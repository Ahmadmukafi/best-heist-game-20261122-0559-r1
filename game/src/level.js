// Level state: walls, loot, lasers, cameras and the alarm meter. Pure state plus the
// small physics the whole game shares (circle-vs-wall sliding, laser timing).
import { WALLS, LOOT, LASERS, CAMERAS, GUARDS, ENTRY, ALARM_MAX, mulberry32 } from './config.js';

export function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// Move a circle of radius r by (dx, dy), sliding along walls instead of sticking.
export function moveCircle(body, dx, dy, r) {
  const tryX = { x: body.x + dx, y: body.y };
  if (!hitsWall(tryX.x, tryX.y, r)) body.x = tryX.x;
  const tryY = { x: body.x, y: body.y + dy };
  if (!hitsWall(tryY.x, tryY.y, r)) body.y = tryY.y;
}

export function hitsWall(x, y, r) {
  for (const w of WALLS) {
    if (rectsOverlap(x - r, y - r, r * 2, r * 2, w.x, w.y, w.w, w.h)) return true;
  }
  return false;
}

// A laser beam is live while its cycle clock is inside its on-window.
export function laserLive(beam, time) {
  return ((time + beam.phase) % beam.period) < beam.on;
}

export function createLevel(seed = 7) {
  const rng = mulberry32(seed);
  return {
    time: 0,
    rng,
    alarm: 0,
    lives: 3,
    score: 0,
    lootTaken: 0,
    loot: LOOT.map((l) => ({ ...l, taken: false })),
    lasers: LASERS.map((b) => ({ ...b })),
    cameras: CAMERAS.map((c) => ({ ...c, angle: c.base })),
    guards: GUARDS.map((g) => ({
      ...g,
      waypoint: 0,
      state: 'patrol', // patrol | suspicious | chase | search
      awareness: 0,
      chaseTime: 0,
      searchTime: 0,
      lastSeen: null,
      angle: Math.PI / 2,
    })),
    pulseCharges: 3,
    pulseTime: 0, // seconds of pulse freeze remaining
    pulseCooldown: 0,
    caughtFlash: 0,
    win: false,
    over: false,
    entry: { ...ENTRY },
  };
}

export function lootRemaining(level) {
  return level.loot.filter((l) => !l.taken);
}

export function addAlarm(level, amount) {
  level.alarm = Math.min(ALARM_MAX, level.alarm + amount);
  return level.alarm >= ALARM_MAX;
}

export function decayAlarm(level, dt) {
  if (level.alarm > 0) level.alarm = Math.max(0, level.alarm - 3 * dt);
}
