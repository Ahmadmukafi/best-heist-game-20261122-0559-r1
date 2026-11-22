// Staged screenshots: each scene plays the real rules forward from a fresh world
// for a fixed number of steps, steered by a scripted walk, then composes the frame
// from the game's own state — so every shot is what a short game really looks like
// and the same seed always gives the same frame.
import { STEP, ENTRY } from './config.js';
import { stepWorld } from './main.js';

const IDLE = { left: false, right: false, up: false, down: false, sneak: false, pulse: false, grab: false };

function walk(world, input, seconds) {
  const frames = Math.round(seconds / STEP);
  for (let i = 0; i < frames; i += 1) stepWorld(world, STEP, { ...input, grab: false, pulse: false });
}

function reset(world) {
  const { level, player } = world;
  level.time = 0;
  level.alarm = 0;
  level.score = 0;
  level.lives = 3;
  level.lootTaken = 0;
  level.pulseCharges = 3;
  level.pulseTime = 0;
  level.win = false;
  level.over = false;
  for (const loot of level.loot) loot.taken = false;
  player.x = ENTRY.x;
  player.y = ENTRY.y;
  player.carried = [];
  player.angle = 0;
  for (const guard of level.guards) {
    guard.x = guard.waypoints[0][0];
    guard.y = guard.waypoints[0][1];
    guard.waypoint = 1;
    guard.state = 'patrol';
    guard.awareness = 0;
    guard.angle = Math.PI / 2;
    guard.lastSeen = null;
  }
  for (const cam of level.cameras) {
    cam.lock = 0;
    cam.angle = cam.base;
  }
  world.screen = 'play';
}

// The cover: the complete heist in one frame — thief crossing the hall toward the
// diamond, Mara's cone sweeping across her path, a camera overhead, the laser grid
// live over the vault door, the alarm meter already climbing.
function stageCover(world) {
  reset(world);
  walk(world, { ...IDLE, right: true }, 3.45);
  walk(world, { ...IDLE, up: true }, 2.0);
  const { level, player } = world;
  player.x = 640; player.y = 392; player.angle = -Math.PI / 2;
  level.time = 5.6;
  level.alarm = 32;
  const mara = level.guards[0];
  mara.x = 556; mara.y = 470;
  mara.angle = Math.atan2(player.y - mara.y, player.x - mara.x);
  mara.state = 'suspicious';
  mara.awareness = 0.62;
  const ivo = level.guards[1];
  ivo.x = 1010; ivo.y = 560;
  ivo.angle = Math.PI * 0.75;
  level.cameras[0].angle = Math.PI / 2 + 0.5;
  level.cameras[1].angle = Math.PI / 2 - 0.4;
  return 'play';
}

// The grab: Sable pockets the gold bars while Mara patrols the door behind her.
function stagePlay(world) {
  reset(world);
  walk(world, { ...IDLE, up: true }, 2.55);
  walk(world, { ...IDLE, right: true }, 0.85);
  const { level, player } = world;
  player.x = 210; player.y = 300; player.angle = Math.PI / 2;
  stepWorld(world, STEP, { ...IDLE, grab: true });
  level.time = 3.6;
  level.alarm = 18;
  level.score = 300;
  const mara = level.guards[0];
  mara.x = 500; mara.y = 500;
  mara.angle = Math.PI / 2;
  mara.state = 'patrol';
  return 'play';
}

// The alarm: spotted mid-hall, Mara closing in, the meter at 82 and climbing.
function stageAlarm(world) {
  reset(world);
  walk(world, { ...IDLE, right: true }, 3.45);
  walk(world, { ...IDLE, up: true }, 1.6);
  const { level, player } = world;
  player.x = 700; player.y = 452; player.angle = Math.PI;
  level.time = 8.2;
  level.alarm = 82;
  const mara = level.guards[0];
  mara.x = 636; mara.y = 470;
  mara.angle = Math.atan2(player.y - mara.y, player.x - mara.x);
  mara.state = 'chase';
  mara.awareness = 1;
  mara.lastSeen = { x: player.x, y: player.y };
  level.cameras[0].lock = 1;
  level.cameras[0].angle = Math.atan2(player.y - 40, player.x - 640);
  return 'play';
}

// The getaway: all three prizes in the bag, Sable back at the door, score tallied.
function stageWin(world) {
  reset(world);
  const { level, player } = world;
  for (const loot of level.loot) loot.taken = true;
  player.carried = ['gold', 'diamond', 'ledger'];
  player.x = 96; player.y = 720; player.angle = Math.PI;
  level.time = 74;
  level.alarm = 12;
  level.score = 1850;
  level.lootTaken = 3;
  const mara = level.guards[0];
  mara.x = 780; mara.y = 420;
  mara.angle = -Math.PI / 2;
  mara.state = 'patrol';
  world.screen = 'win';
  return 'win';
}

/**
 * Set `world` to the named scene (cover, play, alarm or win; any other name is
 * cover) and return the screen to draw over it.
 */
export function stageShot(name, world) {
  if (name === 'play') return stagePlay(world);
  if (name === 'alarm') return stageAlarm(world);
  if (name === 'win') return stageWin(world);
  return stageCover(world);
}
