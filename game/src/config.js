// CRIMSON VAULT — The Meridian Job. Shared constants, palette and the level layout.
// A top-down night heist inside the Meridian Bank vault: one thief, two guards, two
// sweeping cameras, a laser grid over the diamond, three loot targets, one getaway door.
export const VIEW = { width: 1280, height: 800 };

// Crimson-and-gold night palette: dark marble, warm light pools, red danger, gold loot.
export const PALETTE = {
  floor: '#1a1216',
  floorTile: '#221722',
  wall: '#3a2a33',
  wallTop: '#5a3d47',
  gold: '#e8b73a',
  goldBright: '#ffd968',
  crimson: '#c62f3b',
  crimsonDark: '#7e1a24',
  alarm: '#ff3b30',
  safe: '#2fbf71',
  thief: '#2fd4c4',
  thiefDark: '#0f7d72',
  guard: '#4a6fa5',
  guardDark: '#2c4a73',
  cone: 'rgba(255, 214, 90, 0.20)',
  coneHot: 'rgba(255, 59, 48, 0.30)',
  laser: '#ff2d55',
  hud: '#f5e9d0',
  dim: '#8a7a80',
};

export const STEP = 1 / 60;
export const ALARM_MAX = 100;
export const LOOT_VALUES = { gold: 300, diamond: 500, ledger: 400 };

// Walls as {x, y, w, h} rectangles. The hall is split into three rooms:
// left vault (gold), centre hall (diamond, behind the laser grid), right office (ledger).
export const WALLS = [
  // Outer border.
  { x: 0, y: 0, w: 1280, h: 16 },
  { x: 0, y: 784, w: 1280, h: 16 },
  { x: 0, y: 0, w: 16, h: 800 },
  { x: 1264, y: 0, w: 16, h: 800 },
  // Divider left vault / centre hall, with a door gap at y 380..460.
  { x: 420, y: 16, w: 14, h: 364 },
  { x: 420, y: 460, w: 14, h: 100 },
  // Divider centre hall / right office, with a door gap at y 380..460.
  { x: 860, y: 16, w: 14, h: 364 },
  { x: 860, y: 460, w: 14, h: 340 },
  // South wall of the centre hall, door gap at x 600..680 to the getaway corridor.
  { x: 434, y: 560, w: 166, h: 14 },
  { x: 680, y: 560, w: 180, h: 14 },
  // Vault chamber walls around the diamond (top centre), door gap at x 600..680, y 300.
  { x: 480, y: 150, w: 14, h: 150 },
  { x: 786, y: 150, w: 14, h: 150 },
  { x: 480, y: 150, w: 320, h: 14 },
];

// Loot targets: id, name, value, position, room.
export const LOOT = [
  { id: 'gold', name: 'Gold Bars', value: LOOT_VALUES.gold, x: 210, y: 300 },
  { id: 'diamond', name: 'Meridian Diamond', value: LOOT_VALUES.diamond, x: 640, y: 210 },
  { id: 'ledger', name: 'Black Ledger', value: LOOT_VALUES.ledger, x: 1060, y: 300 },
];

// Laser grid: three horizontal beams guarding the diamond chamber door (y 300..330).
// Each beam toggles on a staggered cycle; crossing a live beam trips the alarm.
export const LASERS = [
  { y: 306, x1: 494, x2: 786, period: 2.4, phase: 0.0, on: 1.4 },
  { y: 318, x1: 494, x2: 786, period: 2.4, phase: 0.8, on: 1.4 },
  { y: 330, x1: 494, x2: 786, period: 2.4, phase: 1.6, on: 1.4 },
];

// Cameras: fixed mounts that sweep a vision cone.
export const CAMERAS = [
  { x: 640, y: 40, base: Math.PI / 2, sweep: 0.9, speed: 0.45, range: 260 },
  { x: 1060, y: 40, base: Math.PI / 2, sweep: 0.7, speed: 0.6, range: 240 },
];

// Guards: named patrols with waypoint loops.
export const GUARDS = [
  {
    name: 'Mara',
    x: 500, y: 420,
    waypoints: [[500, 420], [780, 420], [780, 660], [500, 660]],
    speed: 62, range: 230, halfAngle: 0.62,
  },
  {
    name: 'Ivo',
    x: 950, y: 520,
    waypoints: [[950, 520], [1180, 520], [1180, 660], [950, 660]],
    speed: 56, range: 220, halfAngle: 0.62,
  },
];

export const ENTRY = { x: 70, y: 720 };
export const EXIT = { x: 70, y: 720, r: 34 };

// Deterministic RNG (mulberry32) so staged screenshots replay identically.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
