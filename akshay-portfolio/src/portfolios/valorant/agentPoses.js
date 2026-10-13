import * as THREE from 'three';

/*
 * The agent GLBs are exported in bind pose (no animation clips), so poses are
 * driven procedurally. All rotations are expressed about world axes and then
 * converted into each bone's parent frame, which makes the code independent of
 * the rig's (very inconsistent) local bone axes:
 *
 *     local = conj(P) * R * P * restLocal        (P = parent's current world quat)
 *
 * Angle convention about the character's lateral axis (+X in the model):
 *   hips / shoulders / elbows  + = swing forward (model forward is -Z)
 *   knees                      - = bend backward
 *   lean                       - = torso leans forward
 */

const BONES = [
  'Spine1',
  'Neck',
  'L_Hip', 'R_Hip', 'L_Knee', 'R_Knee', 'L_Foot', 'R_Foot',
  'L_Shoulder', 'R_Shoulder', 'L_Elbow', 'R_Elbow',
];

const scratch = {
  parent: new THREE.Quaternion(),
  parentInv: new THREE.Quaternion(),
  rotation: new THREE.Quaternion(),
  root: new THREE.Quaternion(),
  lateral: new THREE.Vector3(),
  up: new THREE.Vector3(0, 1, 0),
};

export function createRig(model) {
  const bones = {};
  model.traverse((object) => {
    if (object.isBone && BONES.includes(object.name)) {
      bones[object.name] = { bone: object, rest: object.quaternion.clone() };
    }
  });
  return bones;
}

function rotateBone(entry, axis, angle) {
  if (!entry || !angle) {
    if (entry) entry.bone.quaternion.copy(entry.rest);
    return;
  }
  const { bone, rest } = entry;
  bone.parent.updateWorldMatrix(true, false);
  bone.parent.getWorldQuaternion(scratch.parent);
  scratch.parentInv.copy(scratch.parent).invert();
  scratch.rotation.setFromAxisAngle(axis, angle);
  bone.quaternion
    .copy(scratch.parentInv)
    .multiply(scratch.rotation)
    .multiply(scratch.parent)
    .multiply(rest);
}

/** pose: { lean, headYaw, hips:[l,r], knees:[l,r], shoulders:[l,r], elbows:[l,r], armSpread:[l,r] } */
export function applyPose(rig, rootObject, pose) {
  if (!rig.L_Hip) return;
  rootObject.getWorldQuaternion(scratch.root);
  scratch.lateral.set(1, 0, 0).applyQuaternion(scratch.root);
  const lateral = scratch.lateral;

  // Parents first so children read the already-posed parent transform.
  rotateBone(rig.Spine1, lateral, pose.lean ?? 0);
  rotateBone(rig.Neck, scratch.up, pose.headYaw ?? 0);

  const [hipL, hipR] = pose.hips ?? [0, 0];
  const [kneeL, kneeR] = pose.knees ?? [0, 0];
  rotateBone(rig.L_Hip, lateral, hipL);
  rotateBone(rig.R_Hip, lateral, hipR);
  rotateBone(rig.L_Knee, lateral, kneeL);
  rotateBone(rig.R_Knee, lateral, kneeR);
  // Keep the feet level: undo the accumulated shin rotation.
  rotateBone(rig.L_Foot, lateral, -(hipL + kneeL) * 0.85);
  rotateBone(rig.R_Foot, lateral, -(hipR + kneeR) * 0.85);

  const [shL, shR] = pose.shoulders ?? [0, 0];
  const [elL, elR] = pose.elbows ?? [0, 0];
  rotateBone(rig.L_Shoulder, lateral, shL);
  rotateBone(rig.R_Shoulder, lateral, shR);
  rotateBone(rig.L_Elbow, lateral, elL);
  rotateBone(rig.R_Elbow, lateral, elR);
}

/* ----------------------------------------------------------------- Presets */

/** Rushing agent: forward-leaning sprint cycle, in place. */
export function sprintPose(t) {
  const phase = t * 9.5;
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  return {
    pose: {
      lean: -0.38,
      headYaw: 0,
      hips: [s * 0.95 + 0.15, -s * 0.95 + 0.15],
      knees: [-(0.75 - c * 0.55), -(0.75 + c * 0.55)],
      shoulders: [-s * 0.9, s * 0.9],
      elbows: [1.35 + c * 0.2, 1.35 - c * 0.2],
    },
    bodyY: Math.abs(s) * 0.09 - 0.06,
    bodyZ: 0,
  };
}

/** High-ground agent: planted wide stance, slow breathing, head scanning the site. */
export function overwatchPose(t) {
  return {
    pose: {
      lean: -0.04 + Math.sin(t * 1.4) * 0.012,
      headYaw: Math.sin(t * 0.45) * 0.5,
      hips: [0.08, -0.06],
      knees: [-0.12, -0.08],
      shoulders: [0.1 + Math.sin(t * 1.4) * 0.02, 0.12 - Math.sin(t * 1.4) * 0.02],
      elbows: [0.55, 0.62],
    },
    bodyY: 0,
    bodyZ: 0,
  };
}

/** Lurking agent: low crouch behind cover, leaning out to peek. */
export function crouchPose(t) {
  const peek = (Math.sin(t * 0.5) + 1) / 2;
  return {
    pose: {
      lean: -0.28 - peek * 0.1,
      headYaw: -0.35 + Math.sin(t * 0.8) * 0.08,
      hips: [1.0, 0.9],
      knees: [-1.95, -1.8],
      shoulders: [0.5, 0.55],
      elbows: [1.1, 1.0],
    },
    bodyY: -0.45,
    bodyZ: 0,
  };
}
