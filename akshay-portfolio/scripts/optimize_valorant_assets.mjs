/*
 * Rebuilds the Valorant GLBs for low memory and fast loading.
 *
 *   pnpm run optimize:valorant            # map + agents + weapons + props
 *   pnpm run optimize:valorant -- map     # map only
 *   pnpm run optimize:valorant -- agents  # everything except the map
 *
 * Sources live in assets-src/models/*.src.glb and are never modified. Output goes
 * to public/models/*.glb with KTX2 (Basis) textures and Draco geometry.
 *
 * Map pipeline
 *   1. Drop shader work that is invisible: clearcoat with factor 0 everywhere, and
 *      specular/ior on matte materials (ValorantScene.jsx forces those matte anyway).
 *      Floors, metal and glass keep their specular response.
 *   2. Flatten the node tree, bucket meshes into 20 m cells and join meshes that share a
 *      material inside each cell. That cuts draw calls without breaking frustum culling.
 *   3. Dedupe and prune, then shrink 1024px textures that only ever cover props under 3 m.
 *   4. Tag textures: UASTC for normals, metal/rough, AO and for colour maps on cutout/glass
 *      materials (alpha matters); ETC1S for the remaining colour maps.
 *   5. Encode with toktx, then Draco the geometry.
 *
 * Agents, weapons and props keep their node graph (bones and sockets are looked up by
 * name) and only swap textures to UASTC.
 *
 * Requires KTX-Software's toktx on PATH (installed to %LOCALAPPDATA%\KTX-Software\bin).
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dedup, flatten, getBounds, join, prune, textureCompress } from '@gltf-transform/functions';
import sharp from 'sharp';
import { createIO } from './lib/gltf-io.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'assets-src', 'models');
const outDir = path.join(root, 'public', 'models');
const tmpDir = path.join(root, 'assets-src', '.tmp');
const cli = path.join(root, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js');

const ktxBin = path.join(process.env.LOCALAPPDATA ?? '', 'KTX-Software', 'bin');
const env = { ...process.env, PATH: `${ktxBin}${path.delimiter}${process.env.PATH}` };

const MAP = 'map_site';
const OTHERS = [
  'agent_chamber', 'agent_cypher', 'agent_gekko', 'agent_jett', 'agent_neon', 'agent_phoenix',
  'agent_reyna', 'agent_sage', 'agent_sova', 'jett_knife', 'operator_gun', 'phantom_gun',
  'sage_ult', 'vandal_gun',
];

// Same patterns ValorantScene.jsx uses to classify materials.
const CUTOUT = /foliage|leaves|leaf|flower|daisy|plant|tree|bush|conifer|vine|canopy|wires|cloth|curtain|flag|fence|decal|graffiti|paper|poster|rug|hair|eyelash/i;
const GLASS = /glass|largefill|eyes/i;
const METAL = /metal|trim|blade|knife|gun|weapon/i;
const NOT_METAL = /nonmetal|wood|cloth|fabric/i;
const FLOOR = /floor|ground|tile|slate/i;

const CELL = 20;
const SMALL_SPAN = 3;

function safeCopy(from, to) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      copyFileSync(from, to);
      return;
    } catch (error) {
      if (attempt >= 5) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 800);
    }
  }
}

const mb = (file) => (statSync(file).size / 1048576).toFixed(2);

function gltfTransform(args) {
  execFileSync(process.execPath, [cli, ...args], { stdio: 'inherit', env });
}

function slotsOf(material) {
  return [
    ['base', material.getBaseColorTexture()],
    ['mr', material.getMetallicRoughnessTexture()],
    ['normal', material.getNormalTexture()],
    ['occlusion', material.getOcclusionTexture()],
    ['emissive', material.getEmissiveTexture()],
  ].filter(([, texture]) => texture);
}

function dropExtension(material, name) {
  const extension = material.getExtension(name);
  if (!extension) return;
  material.setExtension(name, null);
  extension.dispose();
}

function slimMaterials(doc) {
  let physical = 0;
  let standard = 0;
  for (const material of doc.getRoot().listMaterials()) {
    const name = material.getName() || '';
    dropExtension(material, 'KHR_materials_clearcoat');
    const keepSpecular = GLASS.test(name) || FLOOR.test(name) || (METAL.test(name) && !NOT_METAL.test(name));
    const hasSheen = !!material.getExtension('KHR_materials_sheen');
    if (!keepSpecular && !hasSheen) {
      dropExtension(material, 'KHR_materials_specular');
      dropExtension(material, 'KHR_materials_ior');
      standard += 1;
    } else {
      physical += 1;
    }
  }
  return { physical, standard };
}

function bucketIntoCells(doc) {
  const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
  const cells = new Map();
  for (const node of scene.listChildren()) {
    if (!node.getMesh()) continue;
    const box = getBounds(node);
    const cx = Math.floor((box.min[0] + box.max[0]) / 2 / CELL);
    const cz = Math.floor((box.min[2] + box.max[2]) / 2 / CELL);
    const key = `${cx}_${cz}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(node);
  }
  for (const [key, nodes] of cells) {
    const group = doc.createNode(`cell_${key}`);
    scene.addChild(group);
    for (const node of nodes) {
      scene.removeChild(node);
      group.addChild(node);
    }
  }
  return cells.size;
}

/** Largest bounding-box span of any mesh that uses each material. */
function materialSpans(doc) {
  const spans = new Map();
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const box = getBounds(node);
    const span = Math.max(box.max[0] - box.min[0], box.max[1] - box.min[1], box.max[2] - box.min[2]);
    for (const prim of mesh.listPrimitives()) {
      const material = prim.getMaterial();
      if (material) spans.set(material, Math.max(spans.get(material) ?? 0, span));
    }
  }
  return spans;
}

function tagTextures(doc, spans, { aggressive, flat = new Set(), shrink: allowShrink = true }) {
  const info = new Map();
  for (const material of doc.getRoot().listMaterials()) {
    const name = material.getName() || '';
    const needsAlpha = CUTOUT.test(name) || GLASS.test(name);
    for (const [slot, texture] of slotsOf(material)) {
      const entry = info.get(texture) ?? { uastc: false, span: 0 };
      if (!aggressive || (slot === 'base' && needsAlpha)) entry.uastc = true;
      if (slot === 'normal') entry.normal = true;
      entry.span = Math.max(entry.span, spans.get(material) ?? 0);
      info.set(texture, entry);
    }
  }
  let index = 0;
  let shrink = 0;
  for (const texture of doc.getRoot().listTextures()) {
    const entry = info.get(texture) ?? { uastc: !aggressive, span: 99 };
    const [w, h] = texture.getSize() ?? [0, 0];
    const small = aggressive && allowShrink && !flat.has(texture) && Math.max(w, h) >= 1024 && entry.span < SMALL_SPAN;
    if (small) shrink += 1;
    const tier = flat.has(texture) ? 'etc1s' : entry.uastc ? 'uastc' : entry.normal ? 'etc1sn' : 'etc1s';
    const tag = flat.has(texture) ? 'flat_' : small ? 'down_' : '';
    texture.setName(`${tier}_${tag}${index}`);
    index += 1;
  }
  return shrink;
}

/** Textures that are one solid colour: 4px is visually identical and ~10000x smaller on the GPU. */
async function findFlatTextures(doc) {
  const flat = new Set();
  for (const texture of doc.getRoot().listTextures()) {
    const stats = await sharp(Buffer.from(texture.getImage())).stats();
    if (stats.channels.every((channel) => channel.stdev < 0.75)) flat.add(texture);
  }
  return flat;
}

async function optimizeMap(io) {
  const input = path.join(srcDir, `${MAP}.src.glb`);
  const stepA = path.join(tmpDir, `${MAP}.a.glb`);
  const stepB = path.join(tmpDir, `${MAP}.b.glb`);
  const stepB2 = path.join(tmpDir, 'map_site.b2.glb');
  const stepC = path.join(tmpDir, 'map_site.c.glb');
  const output = path.join(outDir, `${MAP}.glb`);

  const doc = await io.read(input);
  const before = { meshes: doc.getRoot().listMeshes().length, materials: doc.getRoot().listMaterials().length };
  console.log(`[map] source ${mb(input)} MB, ${before.meshes} meshes, ${before.materials} materials`);

  const slim = slimMaterials(doc);
  console.log(`[map] materials: ${slim.standard} standard, ${slim.physical} physical kept`);

  await doc.transform(
    dedup({ keepUniqueNames: true }),
    flatten(),
  );
  const cells = bucketIntoCells(doc);
  await doc.transform(
    join({ keepMeshes: false, keepNamed: false }),
    dedup({ keepUniqueNames: true }),
    prune({ keepLeaves: false, keepAttributes: false }),
  );
  console.log(`[map] ${cells} cells -> ${doc.getRoot().listMeshes().length} meshes, ${doc.getRoot().listMaterials().length} materials, ${doc.getRoot().listTextures().length} textures`);

  const spans = materialSpans(doc);
  await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'png' }));
  const flat = await findFlatTextures(doc);
  console.log(`[map] ${flat.size} solid-colour textures collapse to 4px`);
  const shrink = tagTextures(doc, spans, { aggressive: true, flat });
  console.log(`[map] shrinking ${shrink} oversized prop textures to 512`);
  await doc.transform(
    textureCompress({ encoder: sharp, targetFormat: 'png', resize: [4, 4], pattern: /_flat_/ }),
    textureCompress({ encoder: sharp, targetFormat: 'png', resize: [512, 512], pattern: /_down_/ }),
  );
  await io.write(stepA, doc);

  gltfTransform(['etc1s', stepA, stepB, '--pattern', 'etc1s_*', '--quality', '200', '--compression', '2', '--slots', '*']);
  gltfTransform(['etc1s', stepB, stepB2, '--pattern', 'etc1sn_*', '--quality', '255', '--compression', '2', '--slots', '*']);
  gltfTransform(['uastc', stepB2, stepC, '--pattern', 'uastc_*', '--level', '2', '--rdo', '--rdo-lambda', '2', '--zstd', '18', '--slots', '*']);
  const stepD = path.join(tmpDir, `${MAP}.d.glb`);
  gltfTransform(['draco', stepC, stepD, '--method', 'edgebreaker']);
  safeCopy(stepD, output);
  console.log(`[map] wrote ${output} ${mb(output)} MB`);
}

async function optimizeOther(io, name) {
  const input = path.join(srcDir, `${name}.src.glb`);
  const stepA = path.join(tmpDir, `${name}.a.glb`);
  const stepB = path.join(tmpDir, `${name}.b.glb`);
  const output = path.join(outDir, `${name}.glb`);
  if (!existsSync(input)) {
    console.warn(`[${name}] missing ${input}`);
    return;
  }
  const doc = await io.read(input);
  const spans = new Map();
  await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'png' }));
  const flat = await findFlatTextures(doc);
  tagTextures(doc, spans, { aggressive: name !== 'agent_gekko', flat, shrink: false });
  await doc.transform(textureCompress({ encoder: sharp, targetFormat: 'png', resize: [4, 4], pattern: /_flat_/ }));
  await io.write(stepA, doc);
  const stepM = path.join(tmpDir, name + '.m.glb');
  const stepM2 = path.join(tmpDir, name + '.m2.glb');
  gltfTransform(['etc1s', stepA, stepM, '--pattern', 'etc1s_*', '--quality', '220', '--compression', '2', '--slots', '*']);
  gltfTransform(['etc1s', stepM, stepM2, '--pattern', 'etc1sn_*', '--quality', '255', '--compression', '2', '--slots', '*']);
  gltfTransform(['uastc', stepM2, stepB, '--pattern', 'uastc_*', '--level', '2', '--rdo', '--rdo-lambda', '2', '--zstd', '18', '--slots', '*']);
  const stepC = path.join(tmpDir, `${name}.c.glb`);
  // 16-bit UVs/positions: agent atlases can sit far outside 0..1, where the 12-bit default smears facial detail.
  gltfTransform(['draco', stepB, stepC, '--method', 'edgebreaker', '--quantize-texcoord', '16', '--quantize-position', '16', '--quantize-normal', '12']);
  safeCopy(stepC, output);
  console.log(`[${name}] ${mb(input)} MB -> ${mb(output)} MB`);
}

const target = process.argv[2] ?? 'all';
mkdirSync(tmpDir, { recursive: true });
mkdirSync(outDir, { recursive: true });
const io = await createIO();

if (target === 'all' || target === 'map') await optimizeMap(io);
if (target === 'all' || target === 'agents') {
  for (const name of OTHERS.filter((n) => !process.argv[3] || n === process.argv[3])) await optimizeOther(io, name);
}
if (!process.env.KEEP_TMP) rmSync(tmpDir, { recursive: true, force: true });
