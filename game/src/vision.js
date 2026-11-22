// Vision: what a guard or a camera can actually see — a cone plus a line of sight
// that walls block. Sampling the ray in short steps keeps the check cheap and exact
// enough for a top-down game.
import { WALLS } from './config.js';

function pointInWall(x, y) {
  for (const w of WALLS) {
    if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) return true;
  }
  return false;
}

// True when the segment from (x1,y1) to (x2,y2) never crosses a wall.
export function hasLineOfSight(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    if (pointInWall(x1 + dx * t, y1 + dy * t)) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when (tx,ty) sits inside the watcher's cone and nothing blocks the view.
// `sneak` halves the effective range: crouched thieves are harder to spot.
export function canSee(watcher, tx, ty, sneak) {
  const dx = tx - watcher.x;
  const dy = ty - watcher.y;
  const dist = Math.hypot(dx, dy);
  const range = watcher.range * (sneak ? 0.55 : 1);
  if (dist > range) return false;
  const angle = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(angle, watcher.angle)) > watcher.halfAngle) return false;
  return hasLineOfSight(watcher.x, watcher.y, tx, ty);
}

// How exposed the thief is to this watcher, 0..1: closer and more centred is worse.
export function exposure(watcher, tx, ty) {
  const dx = tx - watcher.x;
  const dy = ty - watcher.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  let d = angle - watcher.angle;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  const centred = 1 - Math.abs(d) / watcher.halfAngle;
  const near = 1 - dist / watcher.range;
  return Math.max(0, Math.min(1, centred * 0.5 + near * 0.5));
}
