// CRIMSON VAULT — The Meridian Job. The world: one thief, two guards, two cameras,
// a laser grid, three loot targets and one getaway door. Keyboard + mouse, offline,
// no network. The loop runs at a fixed step so staged screenshots replay exactly.
import { VIEW, STEP, ENTRY, EXIT, ALARM_MAX } from './config.js';
import { createLevel, laserLive, decayAlarm, addAlarm, lootRemaining } from './level.js';
import { updateGuard } from './guard.js';
import { updateCamera } from './camera.js';
import { createPlayer, updatePlayer, tryGrabLoot } from './player.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import * as audio from './audio.js';

export function createWorld(seed = 7) {
  const level = createLevel(seed);
  const player = createPlayer(ENTRY.x, ENTRY.y);
  return {
    level, player,
    screen: 'title', // title | play | caught | win | over
    laserCooldown: 0,
    stepSound: 0,
    time: 0,
  };
}

function resetPositions(world) {
  const { level, player } = world;
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
  }
  for (const cam of level.cameras) cam.lock = 0;
}

// One fixed step of the live game. Returns an event name or null.
export function stepWorld(world, dt, input) {
  const { level, player } = world;
  if (world.screen !== 'play') return null;
  level.time += dt;
  world.time += dt;
  if (level.pulseTime > 0) level.pulseTime = Math.max(0, level.pulseTime - dt);
  if (world.laserCooldown > 0) world.laserCooldown -= dt;

  updatePlayer(player, input, level, dt);

  // Footstep ticks.
  if (player.moving) {
    world.stepSound -= dt;
    if (world.stepSound <= 0) {
      audio.playStep(player.sneak);
      world.stepSound = player.sneak ? 0.5 : 0.32;
    }
  }

  // Lasers: crossing a live beam trips the alarm and shoves the thief back.
  if (level.pulseTime <= 0 && world.laserCooldown <= 0) {
    for (const beam of level.lasers) {
      if (!laserLive(beam, level.time)) continue;
      if (player.x > beam.x1 && player.x < beam.x2 && Math.abs(player.y - beam.y) < player.r + 3) {
        addAlarm(level, 25);
        world.laserCooldown = 0.8;
        player.y += 26; // shoved back out of the beam
        audio.playCaught();
        break;
      }
    }
  }

  // Guards and cameras.
  for (const guard of level.guards) {
    if (updateGuard(guard, level, player, dt) === 'caught') {
      return caught(world);
    }
  }
  for (const cam of level.cameras) updateCamera(cam, level, player, dt);
  decayAlarm(level, dt);
  audio.setAlarmDrone(level.alarm / ALARM_MAX);

  // Grab loot.
  if (input.grab) {
    const loot = tryGrabLoot(player, level);
    if (loot) audio.playGrab();
  }

  // Alarm maxed out: the vault locks down.
  if (level.alarm >= ALARM_MAX) return caught(world);

  // Win: every prize in the bag, back at the getaway door.
  if (lootRemaining(level).length === 0) {
    const d = Math.hypot(player.x - EXIT.x, player.y - EXIT.y);
    if (d < EXIT.r + 10) {
      level.score += Math.max(0, 600 - Math.round(level.time) * 2);
      level.win = true;
      world.screen = 'win';
      audio.playWin();
      return 'win';
    }
  }
  return null;
}

function caught(world) {
  const { level } = world;
  level.lives -= 1;
  level.alarm = 35;
  level.caughtFlash = 1;
  audio.playCaught();
  audio.setAlarmDrone(0);
  resetPositions(world);
  if (level.lives <= 0) {
    level.over = true;
    world.screen = 'over';
    return 'over';
  }
  world.screen = 'caught';
  return 'caught';
}

function startPlay(world) {
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
  resetPositions(world);
  player.carried = [];
  world.screen = 'play';
}

const KEYS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
  Space: 'pulse',
  KeyE: 'grab',
  Enter: 'enter',
};

export function startGame(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || 7);
  const world = createWorld(seed);

  if (shot) {
    // Staged screenshot: the game's own simulation, driven to a fixed frame.
    const screen = stageShot(shot, world);
    world.screen = screen;
    render(ctx, world.level, world.player, screen);
    window.__game = world;
    return world;
  }

  const input = { left: false, right: false, up: false, down: false, sneak: false, pulse: false, grab: false, enter: false };
  const pressed = new Set();
  window.addEventListener('keydown', (e) => {
    const name = KEYS[e.code];
    if (!name) return;
    e.preventDefault();
    audio.unlockAudio();
    if (name === 'enter') {
      if (world.screen !== 'play') startPlay(world);
      return;
    }
    if (name === 'grab') {
      if (!pressed.has('grab')) input.grab = true;
      pressed.add('grab');
      return;
    }
    if (name === 'pulse') {
      if (!pressed.has('pulse')) input.pulse = true;
      pressed.add('pulse');
      return;
    }
    input[name] = true;
  });
  window.addEventListener('keyup', (e) => {
    const name = KEYS[e.code];
    if (!name) return;
    pressed.delete(name);
    if (name === 'grab' || name === 'pulse' || name === 'enter') return;
    input[name] = false;
  });
  // Mouse: click the canvas to ping a waypoint marker (a planning aid, not a move order).
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    world.ping = {
      x: (e.clientX - rect.left) * (VIEW.width / rect.width),
      y: (e.clientY - rect.top) * (VIEW.height / rect.height),
      t: 1.2,
    };
  });

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    while (acc >= STEP) {
      stepWorld(world, STEP, input);
      input.grab = false;
      input.pulse = false;
      acc -= STEP;
    }
    if (world.ping) {
      world.ping.t -= dt;
      if (world.ping.t <= 0) world.ping = null;
    }
    render(ctx, world.level, world.player, world.screen);
    requestAnimationFrame(frame);
  }
  window.__game = world;
  requestAnimationFrame(frame);
  return world;
}
