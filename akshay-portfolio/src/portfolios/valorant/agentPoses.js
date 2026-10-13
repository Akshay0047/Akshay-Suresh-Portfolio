/*
 * Pose generators for the cast. Each returns a spec for agentRig.applyPose().
 * Character space is [left, up, forward] in metres from the floor point under
 * the agent; "right" is therefore negative on the first axis.
 */

const TAU = Math.PI * 2;
const ease = (k) => k * k * (3 - 2 * k);

/** One leg of a running cycle. `p` in [0, 1): stance (foot back) then swing (foot forward). */
function runLeg(p, stride, lift, stanceShare = 0.42) {
  const front = stride;
  const back = -stride;
  if (p < stanceShare) {
    const k = p / stanceShare;
    return { forward: front + (back - front) * k, up: 0, pitch: 0 };
  }
  const k = (p - stanceShare) / (1 - stanceShare);
  const swing = ease(k);
  return {
    forward: back + (front - back) * swing,
    up: Math.sin(Math.PI * k) * lift,
    // Toe points down as the foot pushes off, then flexes up on the swing.
    pitch: k < 0.25 ? 0.5 * (1 - k / 0.25) : -0.25 * Math.sin(Math.PI * k),
  };
}

/**
 * Tight athletic sprint with the rifle carried across the body in a low-ready hold.
 * Spine leans ~14 degrees forward, knees drive, torso counter-rotates against the hips.
 */
export function sprintPose(t, { phase = 0, aimAt, lookAt, cadence = 2.9 } = {}) {
  const w = t * cadence + phase;
  const wrap = (v) => ((v % 1) + 1) % 1;
  const left = runLeg(wrap(w), 0.46, 0.34);
  const right = runLeg(wrap(w + 0.5), 0.46, 0.34);
  const bob = Math.cos(w * TAU * 2) * 0.035;
  const sway = Math.sin(w * TAU) * 0.03;
  return {
    hips: [0, -0.09 + bob, 0.1],
    lean: 0.245, // 14 degrees
    twist: Math.sin(w * TAU) * 0.1,
    roll: Math.sin(w * TAU) * 0.04,
    feet: {
      L: { p: [0.115, left.up, left.forward], pitch: left.pitch },
      R: { p: [-0.115, right.up, right.forward], pitch: right.pitch },
    },
    kneePoles: { L: [0.1, 0, 1], R: [-0.1, 0, 1] },
    weapon: {
      pos: [-0.14 + sway, 1.1 + bob * 0.8, 0.3],
      aimAt,
      aimDir: aimAt ? undefined : [0, -0.12, 1],
      palm: [-0.03, -0.085],
    },
    poles: { L: [0.9, -0.5, -0.4], R: [-0.9, -0.5, -0.4] },
    lookAt,
  };
}

/** Planted two-handed aim-down-sights; used by the defender and overwatch agents. */
export function adsPose(t, { aimAt, lookAt, breathe = 0.006, stance = 0, kneel = 0 } = {}) {
  const b = Math.sin(t * 1.3);
  return {
    hips: [0, -0.04 - kneel, 0.03],
    lean: 0.07 + b * 0.004,
    twist: 0.1,
    feet: {
      L: { p: [0.2 + stance, 0, 0.16], pitch: 0 },
      R: { p: [-0.16, 0, -0.2], pitch: 0 },
    },
    kneePoles: { L: [0.2, 0, 1], R: [-0.2, 0, 1] },
    weapon: { pos: [-0.075, 1.48 + b * breathe, 0.2], aimAt, palm: [-0.03, -0.085] },
    poles: { L: [0.7, -0.9, -0.3], R: [-0.9, -0.7, -0.3] },
    lookAt: lookAt ?? aimAt,
  };
}

/** Low-ready: rifle lowered across the body, eyes up, weight forward and ready to peek. */
export function lowReadyPose(t, { aimAt, lookAt } = {}) {
  const b = Math.sin(t * 1.1);
  return {
    hips: [0, -0.1, 0.05],
    lean: 0.16,
    twist: 0.08,
    feet: {
      L: { p: [0.19, 0, 0.3], pitch: 0 },
      R: { p: [-0.17, 0, -0.18], pitch: 0.15 },
    },
    kneePoles: { L: [0.2, 0, 1], R: [-0.2, 0, 1] },
    weapon: { pos: [-0.12, 1.08 + b * 0.008, 0.24], aimAt, palm: [-0.03, -0.085] },
    poles: { L: [0.8, -0.8, -0.3], R: [-0.9, -0.6, -0.4] },
    lookAt,
  };
}

/**
 * Grounded tactical crouch behind cover. Hips sit low over a wide, staggered base,
 * back stays long, and the gun comes up in a compact peek.
 */
export function crouchPose(t, { aimAt, lookAt } = {}) {
  const b = Math.sin(t * 1.2);
  return {
    hips: [0, -0.68, -0.08],
    lean: 0.34,
    twist: 0.12,
    feet: {
      L: { p: [0.24, 0, 0.2], pitch: 0 },
      R: { p: [-0.2, 0.0, -0.16], pitch: 0.35 },
    },
    kneePoles: { L: [0.5, 0, 1], R: [-0.5, 0, 1] },
    weapon: { pos: [-0.09, 0.88 + b * 0.006, 0.3], aimAt, palm: [-0.03, -0.085] },
    poles: { L: [0.9, -0.6, -0.3], R: [-0.9, -0.6, -0.3] },
    lookAt,
  };
}

/** Blade Storm: airborne, back arm swept wide, throwing arm locked onto the target. */
export function ultPose(t, { aimAt, lookAt } = {}) {
  const hover = Math.sin(t * 1.5) * 0.14;
  const flutter = Math.sin(t * 2.4) * 0.05;
  return {
    hips: [0, 0.0 + hover, -0.06],
    lean: -0.1,
    twist: 0.28,
    roll: 0.06 + flutter,
    feet: {
      L: { p: [0.14, 0.34 + hover + flutter, 0.38], pitch: 0.55 },
      R: { p: [-0.14, 0.2 + hover - flutter, -0.3], pitch: 0.9 },
    },
    kneePoles: { L: [0.3, 0, 1], R: [-0.3, 0, 1] },
    weapon: { pos: [-0.3, 1.5 + hover, 0.5], aimAt, left: false, palm: [-0.04, -0.01] },
    hands: { L: [0.62, 1.3 + hover + flutter, -0.35] },
    poles: { L: [1, -0.2, -0.5], R: [-0.4, -0.2, -1] },
    handAim: { L: [1, 0.2, -0.3] },
    lookAt,
  };
}

/** Sage: a calm casting stance, both palms forward at chest height. */
export function castPose(t, { lookAt } = {}) {
  const b = Math.sin(t * 1.2);
  return {
    hips: [0, -0.05, 0.02],
    lean: 0.04,
    twist: -0.1,
    feet: {
      L: { p: [0.17, 0, 0.1], pitch: 0 },
      R: { p: [-0.17, 0, -0.16], pitch: 0 },
    },
    kneePoles: { L: [0.2, 0, 1], R: [-0.2, 0, 1] },
    hands: { L: [0.26, 1.28 + b * 0.015, 0.5], R: [-0.24, 1.36 - b * 0.015, 0.46] },
    handAim: { L: [0.05, 0.1, 1], R: [-0.05, 0.1, 1] },
    poles: { L: [0.8, -0.8, -0.1], R: [-0.8, -0.8, -0.1] },
    lookAt,
  };
}
