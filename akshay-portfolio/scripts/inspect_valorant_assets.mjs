/*
 * Read-only report on a source GLB: texture sizes, how large the meshes that use
 * each texture are, and which heavy material extensions carry real values.
 *   node scripts/inspect_valorant_assets.mjs assets-src/models/map_site.src.glb
 */
import { getBounds } from '@gltf-transform/functions';
import { createIO } from './lib/gltf-io.mjs';

const file = process.argv[2];
if (!file) throw new Error('usage: inspect_valorant_assets.mjs <file.glb>');

const io = await createIO();
const doc = await io.read(file);
const root = doc.getRoot();

const textureUse = new Map();
const matUse = new Map();
for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const size = getBounds(node);
  const span = Math.max(size.max[0] - size.min[0], size.max[1] - size.min[1], size.max[2] - size.min[2]);
  for (const prim of mesh.listPrimitives()) {
    const material = prim.getMaterial();
    if (!material) continue;
    matUse.set(material, Math.max(matUse.get(material) ?? 0, span));
  }
}

const slots = (material) => ({
  base: material.getBaseColorTexture(),
  mr: material.getMetallicRoughnessTexture(),
  normal: material.getNormalTexture(),
  occlusion: material.getOcclusionTexture(),
  emissive: material.getEmissiveTexture(),
});

let clearcoat = 0;
let sheen = 0;
let specular = 0;
let ior = 0;
let emissiveSameAsBase = 0;
let emissiveOnly = 0;
const clearcoatValues = new Set();
const sheenValues = new Set();
for (const material of root.listMaterials()) {
  const cc = material.getExtension('KHR_materials_clearcoat');
  const sh = material.getExtension('KHR_materials_sheen');
  const sp = material.getExtension('KHR_materials_specular');
  const io2 = material.getExtension('KHR_materials_ior');
  if (cc) { clearcoat += 1; clearcoatValues.add(cc.getClearcoatFactor().toFixed(2)); }
  if (sh) { sheen += 1; sheenValues.add(sh.getSheenColorFactor().map((v) => v.toFixed(2)).join(',')); }
  if (sp) specular += 1;
  if (io2) ior += 1;
  const s = slots(material);
  if (s.emissive && s.base && s.emissive.getURI?.() === s.base.getURI?.()) emissiveSameAsBase += 1;
  if (s.emissive) emissiveOnly += 1;
  for (const tex of Object.values(s)) {
    if (!tex) continue;
    const entry = textureUse.get(tex) ?? { span: 0, slots: new Set() };
    entry.span = Math.max(entry.span, matUse.get(material) ?? 0);
    textureUse.set(tex, entry);
  }
  for (const [name, tex] of Object.entries(s)) {
    if (tex) textureUse.get(tex).slots.add(name);
  }
}

const buckets = {};
for (const [tex, info] of textureUse) {
  const [w, h] = tex.getSize() ?? [0, 0];
  const span = info.span < 3 ? '<3m' : info.span < 8 ? '3-8m' : info.span < 20 ? '8-20m' : '>20m';
  const key = `${Math.max(w, h)}px / largest user ${span}`;
  buckets[key] = (buckets[key] ?? 0) + 1;
}

console.log(JSON.stringify({
  file,
  nodes: root.listNodes().length,
  meshes: root.listMeshes().length,
  materials: root.listMaterials().length,
  textures: root.listTextures().length,
  extensionsUsed: root.listExtensionsUsed().map((e) => e.extensionName),
  materialsWithClearcoat: clearcoat,
  clearcoatFactors: [...clearcoatValues],
  materialsWithSheen: sheen,
  sheenColors: [...sheenValues].slice(0, 6),
  materialsWithSpecular: specular,
  materialsWithIor: ior,
  materialsWithEmissiveTexture: emissiveOnly,
  buckets,
}, null, 2));
