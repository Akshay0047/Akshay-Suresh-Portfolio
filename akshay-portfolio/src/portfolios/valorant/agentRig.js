import * as THREE from 'three';

/*
 * Procedural posing for the Valorant agent rigs.
 *
 * The exported GLBs are bind-pose only (no clips), and every agent shares the
 * same Unreal skeleton (Splitter > Spine1-4 > Neck/Head, Clavicle > Shoulder >
 * Elbow > Hand, Pelvis > Hip > Knee > Foot > Toe). Local bone axes on that rig
 * are wildly inconsistent, so nothing here relies on them:
 *
 *   - bones are rotated about WORLD axes (rotateWorld),
 *   - arms and legs use a two-bone IK solver driven by world-space targets,
 *   - targets are authored in "character space": [left, up, forward] metres
 *     measured from the point on the floor under the character.
 *
 * Weapons are parented to the R_Hand bone. Every frame the weapon's world pose is
 * derived from the pose spec, the hands are IK'd to its grip / foregrip, and the
 * holder's local transform under R_Hand is recomputed so the gun is rigidly
 * carried by the hand bone.
 */

const DRIVEN = [
  'Splitter', 'Spine1', 'Spine2', 'Spine3', 'Spine4', 'Neck', 'Head',
  'L_Clavicle', 'R_Clavicle', 'L_Shoulder', 'R_Shoulder', 'L_Elbow', 'R_Elbow', 'L_Hand', 'R_Hand',
  'L_Hip', 'R_Hip', 'L_Knee', 'R_Knee', 'L_Foot', 'R_Foot', 'L_Toe', 'R_Toe',
];

const REQUIRED = ['Splitter', 'Spine1', 'Head', 'L_Shoulder', 'L_Elbow', 'L_Hand', 'R_Shoulder', 'R_Elbow', 'R_Hand', 'L_Hip', 'L_Knee', 'L_Foot', 'R_Hip', 'R_Knee', 'R_Foot'];

const UP = new THREE.Vector3(0, 1, 0);

// Scratch objects (module-level; the rig is solved synchronously).
const s = {
  a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), d: new THREE.Vector3(),
  e: new THREE.Vector3(), f: new THREE.Vector3(), g: new THREE.Vector3(), h: new THREE.Vector3(),
  q1: new THREE.Quaternion(), q2: new THREE.Quaternion(), q3: new THREE.Quaternion(), q4: new THREE.Quaternion(),
  m: new THREE.Matrix4(), m2: new THREE.Matrix4(),
  mq: new THREE.Quaternion(),
};

/* ------------------------------------------------------------- Rig set-up */

export function createRig(model) {
  const bones = {};
  const rest = {};
  model.traverse((object) => {
    if (!object.isBone) return;
    bones[object.name] = object;
    rest[object.name] = { q: object.quaternion.clone(), p: object.position.clone() };
  });
  if (!REQUIRED.every((name) => bones[name])) return null;

  model.updateWorldMatrix(true, true);
  const toLocal = (bone) => model.worldToLocal(bone.getWorldPosition(new THREE.Vector3()));

  // Character basis in model-local space: facing comes from the toes (reliable),
  // left = up x forward.
  const forward = new THREE.Vector3();
  ['L', 'R'].forEach((side) => {
    if (bones[`${side}_Toe`]) {
      forward.add(toLocal(bones[`${side}_Toe`]).sub(toLocal(bones[`${side}_Foot`])));
    }
  });
  if (forward.lengthSq() < 1e-6) {
    const left = toLocal(bones.L_Hip).sub(toLocal(bones.R_Hip));
    forward.crossVectors(left, UP);
  }
  forward.y = 0;
  forward.normalize();
  const left = new THREE.Vector3().crossVectors(UP, forward).normalize();
  // Sanity: L_ bones must sit on +left.
  if (toLocal(bones.L_Hip).sub(toLocal(bones.R_Hip)).dot(left) < 0) left.negate();

  const dist = (a, b) => toLocal(bones[a]).distanceTo(toLocal(bones[b]));
  const modelQuat = model.getWorldQuaternion(new THREE.Quaternion());
  const worldQuatLocal = (bone) => bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(modelQuat.clone().invert());

  const finger = (side) => {
    const child = bones[`${side}_Middle1`] || bones[`${side}_Index1`];
    return child ? child.position.clone().normalize() : new THREE.Vector3(0, 1, 0);
  };

  return {
    model,
    bones,
    rest,
    forward,
    left,
    len: {
      arm: [dist('L_Shoulder', 'L_Elbow'), dist('L_Elbow', 'L_Hand')],
      leg: [dist('L_Hip', 'L_Knee'), dist('L_Knee', 'L_Foot')],
    },
    ankle: Math.max(toLocal(bones.L_Foot).y, 0.02),
    footQuat: { L: worldQuatLocal(bones.L_Foot), R: worldQuatLocal(bones.R_Foot) },
    headQuat: worldQuatLocal(bones.Head),
    finger: { L: finger('L'), R: finger('R') },
    weapon: null,
  };
}

/* ----------------------------------------------------------------- Weapons */

/**
 * Parse a weapon GLB scene into aim/up axes and grip points (weapon-local).
 * `override` lets props without bones (knives) provide axes explicitly.
 */
export function describeWeapon(scene, override) {
  scene.updateWorldMatrix(true, true);
  const point = (name) => {
    const node = scene.getObjectByName(name);
    return node ? scene.worldToLocal(node.getWorldPosition(new THREE.Vector3())) : null;
  };
  if (override) {
    return {
      aim: new THREE.Vector3(...override.aim).normalize(),
      up: new THREE.Vector3(...override.up).normalize(),
      trigger: new THREE.Vector3(...override.grip),
      foregrip: override.foregrip ? new THREE.Vector3(...override.foregrip) : null,
      muzzle: null,
    };
  }
  const trigger = point('Trigger') || new THREE.Vector3();
  const muzzle = point('Muzzle') || trigger.clone().add(new THREE.Vector3(1, 0, 0));
  const aim = muzzle.clone().sub(trigger).normalize();
  const reflex = point('Reflex');
  const magazine = point('Magazine_Main');
  const up = new THREE.Vector3();
  if (reflex) up.copy(reflex).sub(trigger);
  else if (magazine) up.copy(trigger).sub(magazine);
  else up.set(0, 1, 0);
  up.addScaledVector(aim, -up.dot(aim)).normalize();
  return { aim, up, trigger, foregrip: point('Left_Hand_Target'), muzzle };
}

/** Parent a cloned weapon under the R_Hand bone. Returns the holder group. */
export function attachWeapon(rig, weaponScene, info) {
  const holder = new THREE.Group();
  holder.name = 'weapon-holder';
  holder.add(weaponScene);
  rig.bones.R_Hand.add(holder);
  rig.weapon = { holder, info };
  return holder;
}

/* ----------------------------------------------------------------- Helpers */

function rotateWorld(bone, delta) {
  bone.updateWorldMatrix(true, false);
  bone.getWorldQuaternion(s.q1);
  s.q2.copy(delta).multiply(s.q1); // new world rotation
  bone.parent.getWorldQuaternion(s.q3);
  bone.quaternion.copy(s.q3.invert().multiply(s.q2));
  bone.updateMatrixWorld(true);
}

function rotateAbout(bone, axis, angle) {
  if (!angle) return;
  s.q4.setFromAxisAngle(axis, angle);
  rotateWorld(bone, s.q4);
}

/** Classic analytic two-bone IK with a pole direction for the middle joint. */
function solveTwoBone(upper, mid, end, target, pole, l1, l2) {
  const A = upper.getWorldPosition(s.a);
  const toTarget = s.b.copy(target).sub(A);
  let dist = toTarget.length();
  if (dist < 1e-5) return;
  toTarget.divideScalar(dist);
  dist = THREE.MathUtils.clamp(dist, Math.abs(l1 - l2) + 0.02, (l1 + l2) * 0.999);

  const along = (l1 * l1 + dist * dist - l2 * l2) / (2 * dist);
  const height = Math.sqrt(Math.max(l1 * l1 - along * along, 0));
  const perp = s.c.copy(pole).addScaledVector(toTarget, -pole.dot(toTarget));
  if (perp.lengthSq() < 1e-6) perp.set(0, 0, 1).addScaledVector(toTarget, -toTarget.z);
  perp.normalize();

  const elbow = s.d.copy(A).addScaledVector(toTarget, along).addScaledVector(perp, height);
  const reach = s.e.copy(A).addScaledVector(toTarget, dist);

  // Upper bone: current direction A->mid onto A->elbow.
  // (Distinct scratch vectors: sharing one made both arguments identical and the
  // upper limb never rotated, which left every arm and thigh stuck in the bind pose.)
  const currentDir = mid.getWorldPosition(s.g).sub(A).normalize();
  const desiredDir = s.h.copy(elbow).sub(A).normalize();
  s.q4.setFromUnitVectors(currentDir, desiredDir);
  rotateWorld(upper, s.q4);

  // Lower bone: current direction mid->end onto mid->reach.
  const B2 = mid.getWorldPosition(s.f);
  const C = end.getWorldPosition(s.a);
  s.q4.setFromUnitVectors(C.sub(B2).normalize(), s.b.copy(reach).sub(B2).normalize());
  rotateWorld(mid, s.q4);
}

/* ------------------------------------------------------------------- Apply */

const frame = {
  left: new THREE.Vector3(), forward: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), origin: new THREE.Vector3(),
};

function charPoint(out, p) {
  return out.copy(frame.origin).addScaledVector(frame.left, p[0]).addScaledVector(frame.up, p[1]).addScaledVector(frame.forward, p[2]);
}

function charDir(out, d) {
  return out.set(0, 0, 0).addScaledVector(frame.left, d[0]).addScaledVector(frame.up, d[1]).addScaledVector(frame.forward, d[2]).normalize();
}

const weaponPose = {
  quat: new THREE.Quaternion(),
  pos: new THREE.Vector3(),
  rightHand: new THREE.Vector3(),
  leftHand: new THREE.Vector3(),
  aim: new THREE.Vector3(),
  up: new THREE.Vector3(),
  side: new THREE.Vector3(),
};

function computeWeaponPose(rig, spec) {
  const info = rig.weapon.info;
  const w = spec.weapon;
  const grip = charPoint(new THREE.Vector3(), w.pos);
  const aim = weaponPose.aim;
  if (w.aimAt) aim.set(w.aimAt[0], w.aimAt[1], w.aimAt[2]).sub(grip);
  else charDir(aim, w.aimDir);
  aim.normalize();
  if (w.pitch) {
    // Extra pitch about the character's left axis (+ = muzzle down).
    s.q4.setFromAxisAngle(frame.left, w.pitch);
    aim.applyQuaternion(s.q4);
  }
  // World up with optional roll about the barrel axis.
  const up = weaponPose.up.copy(frame.up);
  up.addScaledVector(aim, -up.dot(aim));
  if (up.lengthSq() < 1e-4) up.copy(frame.forward).negate();
  up.normalize();
  if (w.roll) up.applyAxisAngle(aim, w.roll);
  const side = weaponPose.side.crossVectors(aim, up).normalize();

  const local = s.m.makeBasis(info.aim, info.up, s.a.crossVectors(info.aim, info.up).normalize());
  const world = s.m2.makeBasis(aim, up, side);
  const qL = s.q1.setFromRotationMatrix(local);
  const qW = s.q2.setFromRotationMatrix(world);
  weaponPose.quat.copy(qW).multiply(qL.invert());
  weaponPose.pos.copy(grip).sub(s.b.copy(info.trigger).applyQuaternion(weaponPose.quat));

  const place = (localPoint, out) => out.copy(localPoint).applyQuaternion(weaponPose.quat).add(weaponPose.pos);
  const palm = s.c.copy(info.trigger).addScaledVector(info.aim, w.palm?.[0] ?? -0.035).addScaledVector(info.up, w.palm?.[1] ?? -0.085);
  place(palm, weaponPose.rightHand);
  if (info.foregrip) place(info.foregrip, weaponPose.leftHand);
  else weaponPose.leftHand.copy(weaponPose.rightHand);
  return weaponPose;
}

/**
 * spec = {
 *   hips:   [left, up, forward]            body offset (negative up = crouch, positive = airborne)
 *   lean, twist, headYaw, headPitch        radians (lean + = forward, twist + = to the left)
 *   lookAt: [x, y, z]                      world point for the head to track
 *   feet:   { L: {p:[l,u,f], pitch}, R }   sole position above the floor
 *   hands:  { L: [l,u,f], R: [l,u,f] }     used for the hands that are not on a weapon
 *   poles:  { L: [l,u,f], R: [l,u,f] }     elbow pole directions (character space)
 *   kneePoles: { L, R }                    knee pole directions
 *   weapon: { pos, aimAt | aimDir, pitch, roll, palm, left: boolean }
 * }
 */
export function applyPose(rig, spec) {
  const { model, bones, rest } = rig;

  // 1. Back to the bind pose.
  DRIVEN.forEach((name) => {
    if (!bones[name]) return;
    bones[name].quaternion.copy(rest[name].q);
    bones[name].position.copy(rest[name].p);
  });
  model.updateWorldMatrix(true, true);

  // 2. Character frame in world space.
  model.getWorldQuaternion(s.mq);
  frame.left.copy(rig.left).applyQuaternion(s.mq);
  frame.forward.copy(rig.forward).applyQuaternion(s.mq);
  model.getWorldPosition(frame.origin);

  // 3. Hips.
  const hips = spec.hips ?? [0, 0, 0];
  const splitter = bones.Splitter;
  splitter.getWorldPosition(s.a);
  s.a.addScaledVector(frame.left, hips[0]).addScaledVector(frame.up, hips[1]).addScaledVector(frame.forward, hips[2]);
  splitter.position.copy(splitter.parent.worldToLocal(s.b.copy(s.a)));
  splitter.updateMatrixWorld(true);

  // 4. Spine (lean about the left axis, twist about up), distributed down the chain.
  const chain = [['Spine1', 0.2], ['Spine2', 0.3], ['Spine3', 0.3], ['Spine4', 0.2]];
  chain.forEach(([name, share]) => {
    if (!bones[name]) return;
    rotateAbout(bones[name], frame.left, (spec.lean ?? 0) * share);
    rotateAbout(bones[name], frame.up, (spec.twist ?? 0) * share);
  });
  // Roll (side bend) shares the same chain; + tilts toward the character's left.
  if (spec.roll) {
    chain.forEach(([name, share]) => bones[name] && rotateAbout(bones[name], frame.forward, -(spec.roll) * share));
  }

  // 5. Legs.
  ['L', 'R'].forEach((side) => {
    const foot = spec.feet?.[side];
    if (!foot) return;
    const target = charPoint(s.d, [foot.p[0], foot.p[1] + rig.ankle, foot.p[2]]).clone();
    const poleSrc = spec.kneePoles?.[side] ?? [side === 'L' ? 0.25 : -0.25, 0, 1];
    const pole = charDir(new THREE.Vector3(), poleSrc);
    solveTwoBone(bones[`${side}_Hip`], bones[`${side}_Knee`], bones[`${side}_Foot`], target, pole, rig.len.leg[0], rig.len.leg[1]);
    // Foot: rest orientation (flat) plus pitch about the left axis (+ = toe down).
    const footBone = bones[`${side}_Foot`];
    s.q1.copy(s.mq).multiply(rig.footQuat[side]);
    if (foot.pitch) {
      s.q2.setFromAxisAngle(frame.left, foot.pitch);
      s.q1.premultiply(s.q2);
    }
    footBone.parent.getWorldQuaternion(s.q3);
    footBone.quaternion.copy(s.q3.invert().multiply(s.q1));
    footBone.updateMatrixWorld(true);
  });

  // 6. Weapon + arms.
  poseArms(rig, spec);

  // 7. Head tracking (shares the spine's counter-rotation so gaze stays level).
  if (bones.Neck && bones.Head) {
    const look = spec.lookAt;
    const headWorld = bones.Head.getWorldPosition(s.a);
    if (look) {
      const desired = s.b.set(look[0], look[1], look[2]).sub(headWorld).normalize();
      // Current forward of the head from rest orientation.
      bones.Head.getWorldQuaternion(s.q1);
      s.q2.copy(s.mq).invert().multiply(s.q1).multiply(s.q3.copy(rig.headQuat).invert()); // delta from rest, model-local
      const current = s.c.copy(rig.forward).applyQuaternion(s.q2).applyQuaternion(s.mq).normalize();
      s.q4.setFromUnitVectors(current, desired);
      const angle = 2 * Math.acos(Math.min(1, Math.abs(s.q4.w)));
      const limit = 1.05;
      if (angle > limit) s.q4.slerp(s.q1.identity(), 1 - limit / angle);
      s.q4.slerp(s.q1.identity(), 0.15);
      // Split between neck and head.
      rotateWorld(bones.Neck, s.q3.identity().slerp(s.q4, 0.45));
      rotateWorld(bones.Head, s.q3.identity().slerp(s.q4, 0.55));
    } else {
      rotateAbout(bones.Neck, frame.left, -(spec.lean ?? 0) * 0.45 + (spec.headPitch ?? 0) * 0.5);
      rotateAbout(bones.Head, frame.left, -(spec.lean ?? 0) * 0.35 + (spec.headPitch ?? 0) * 0.5);
      rotateAbout(bones.Head, frame.up, (spec.headYaw ?? 0) - (spec.twist ?? 0) * 0.6);
    }
  }

}

// Unreal bone space is Z-up. Rotating -90° about X maps it onto the Y-up frame the GLB uses.
const UNREAL_TO_Y_UP = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
const Y_UP_TO_UNREAL = UNREAL_TO_Y_UP.clone().invert();

/** Put every bone back on the exported bind pose. */
export function restoreRest(rig) {
  const { bones, rest, model } = rig;
  Object.keys(rest).forEach((name) => {
    const bone = bones[name];
    if (!bone) return;
    bone.quaternion.copy(rest[name].q);
    bone.position.copy(rest[name].p);
  });
  model.updateWorldMatrix(true, true);
}

/**
 * Apply an ActorX clip on the bind pose. Keys are parent-local quaternions from
 * the Unreal bind, swung into Y-up, then composed with the GLB rest quaternion.
 * Bones the clip does not key stay on the bind pose.
 */
export function overlayClipLocal(rig, rotations, weight = 1) {
  const { bones, rest } = rig;
  restoreRest(rig);
  for (const name in rotations) {
    const bone = bones[name];
    const base = rest[name];
    if (!bone || !base) continue;
    const q = rotations[name];
    s.q1.set(q[0], q[1], q[2], q[3]).normalize();
    s.q2.copy(UNREAL_TO_Y_UP).multiply(s.q1).multiply(Y_UP_TO_UNREAL);
    s.q4.copy(base.q).multiply(s.q2);
    bone.quaternion.copy(base.q).slerp(s.q4, weight);
  }
  rig.model.updateWorldMatrix(true, true);
}

/** Re-seat the weapon and the arms that should hold it, without touching the body pose. */
export function holdWeapon(rig, spec) {
  const { model } = rig;
  model.updateWorldMatrix(true, true);
  model.getWorldQuaternion(s.mq);
  frame.left.copy(rig.left).applyQuaternion(s.mq);
  frame.forward.copy(rig.forward).applyQuaternion(s.mq);
  model.getWorldPosition(frame.origin);
  poseArms(rig, spec);
}

function poseArms(rig, spec) {
  const { bones } = rig;
  let wp = null;
  const handTargets = { L: null, R: null };
  const handAim = { L: null, R: null };
  if (rig.weapon && spec.weapon) {
    wp = computeWeaponPose(rig, spec);
    handTargets.R = wp.rightHand.clone();
    if (spec.weapon.left !== false) handTargets.L = wp.leftHand.clone();
    handAim.R = s.e.copy(wp.aim).multiplyScalar(0.35).addScaledVector(wp.up, -0.9).normalize().clone();
    handAim.L = s.e.copy(wp.aim).multiplyScalar(0.95).addScaledVector(wp.up, -0.15).normalize().clone();
  }
  ['L', 'R'].forEach((side) => {
    const spot = spec.hands?.[side];
    if (!handTargets[side] && spot) handTargets[side] = charPoint(new THREE.Vector3(), spot);
    if (spec.handAim?.[side]) handAim[side] = charDir(new THREE.Vector3(), spec.handAim[side]);
  });
  ['L', 'R'].forEach((side) => {
    const target = handTargets[side];
    if (!target) return;
    const poleSrc = spec.poles?.[side] ?? [side === 'L' ? 0.55 : -0.55, -0.9, -0.15];
    solveTwoBone(bones[`${side}_Shoulder`], bones[`${side}_Elbow`], bones[`${side}_Hand`], target, charDir(new THREE.Vector3(), poleSrc), rig.len.arm[0], rig.len.arm[1]);
    if (handAim[side]) {
      const hand = bones[`${side}_Hand`];
      hand.getWorldQuaternion(s.q1);
      const current = s.a.copy(rig.finger[side]).applyQuaternion(s.q1).normalize();
      s.q4.setFromUnitVectors(current, handAim[side]);
      rotateWorld(hand, s.q4);
    }
  });
  if (wp) {
    const holder = rig.weapon.holder;
    bones.R_Hand.updateWorldMatrix(true, false);
    s.m.compose(wp.pos, wp.quat, s.a.set(1, 1, 1));
    s.m2.copy(bones.R_Hand.matrixWorld).invert().multiply(s.m);
    s.m2.decompose(holder.position, holder.quaternion, holder.scale);
    holder.updateMatrixWorld(true);
  }
}
