/*
 * ActorX .psa pose loader.
 *
 * TP_Sprinter_S0_X_AimNW_UB.psa is one static upper-body aim (two identical
 * frames). Keys are frame-major: position xyz, quaternion xyzw, time. Unkeyed
 * bones were exported as copies of a single quaternion — those copies are
 * dropped so they are not applied as local rotations down the chain.
 */

let rotations = null;
let pending = null;

const textDecoder = new TextDecoder('utf-8');

function chunkId(bytes, offset) {
  let end = offset;
  const stop = Math.min(offset + 20, bytes.length);
  while (end < stop && bytes[end] !== 0) end += 1;
  return textDecoder.decode(bytes.subarray(offset, end)).trim();
}

function boneName(bytes, offset) {
  let end = offset;
  const stop = Math.min(offset + 64, bytes.length);
  while (end < stop && bytes[end] !== 0) end += 1;
  return textDecoder.decode(bytes.subarray(offset, end));
}

/** Frame-0 local quaternions keyed by bone name. Identity and duplicated fills are omitted. */
export function parsePsaPose(buffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const chunks = {};
  let offset = 0;
  while (offset + 32 <= buffer.byteLength) {
    const id = chunkId(bytes, offset);
    const dataSize = view.getInt32(offset + 24, true);
    const dataCount = view.getInt32(offset + 28, true);
    if (!id || dataSize < 0 || dataCount < 0) break;
    const dataStart = offset + 32;
    const bytesTotal = dataSize * dataCount;
    if (dataStart + bytesTotal > buffer.byteLength) break;
    chunks[id] = { dataStart, dataSize, dataCount };
    offset = dataStart + bytesTotal;
  }

  const bones = chunks.BONENAMES;
  const keys = chunks.ANIMKEYS;
  if (!bones || !keys) return {};

  const names = [];
  for (let i = 0; i < bones.dataCount; i += 1) {
    names.push(boneName(bytes, bones.dataStart + i * bones.dataSize));
  }

  const quats = names.map((_, index) => {
    const base = keys.dataStart + index * keys.dataSize + 12;
    return [0, 1, 2, 3].map((component) => view.getFloat32(base + component * 4, true));
  });

  const keyOf = (q) => q.map((value) => value.toFixed(2)).join(',');
  const counts = {};
  quats.forEach((q) => {
    const key = keyOf(q);
    counts[key] = (counts[key] || 0) + 1;
  });

  const seenFill = {};
  const pose = {};
  quats.forEach((q, index) => {
    if (Math.hypot(q[0], q[1], q[2]) < 0.02) return;
    const name = names[index];
    if (/Weapon|Eye|Brows|Helper|Ndl|Jaw|Mouth|Collar/.test(name)) return;
    const key = keyOf(q);
    if (counts[key] >= 8) {
      seenFill[key] = (seenFill[key] || 0) + 1;
      if (seenFill[key] > 1) return;
    }
    pose[name] = q;
  });
  return pose;
}

export function preloadSprinterClip() {
  if (rotations || pending) return pending;
  const url = `${import.meta.env.BASE_URL}models/TP_Sprinter_S0_X_AimNW_UB.psa`;
  pending = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`PSA ${response.status}`);
      return response.arrayBuffer();
    })
    .then((buffer) => {
      rotations = parsePsaPose(buffer);
      return rotations;
    })
    .catch((error) => {
      pending = null;
      console.error(error);
    });
  return pending;
}

export function getSprinterRotations() {
  return rotations;
}
