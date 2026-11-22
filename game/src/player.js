// The thief: Ren "Sable" Voss. Moves with WASD/arrows, sneaks with Shift, fires the
// pulse gadget with Space and grabs loot with E. Every piece of loot carried slows
// her down — the heavier the bag, the tighter the getaway.
import { moveCircle, addAlarm } from './level.js';

const BASE_SPEED = 165;
const SNEAK_SPEED = 85;
const WEIGHT_PER_LOOT = 0.08;
export const PULSE_FREEZE = 3;
export const PULSE_ALARM_COST = 12;

export function createPlayer(x, y) {
  return {
    x, y, r: 13,
    angle: 0,
    sneak: false,
    moving: false,
    carried: [], // loot ids in the bag
    pulseReady: true,
  };
}

export function playerSpeed(player) {
  const weight = 1 - player.carried.length * WEIGHT_PER_LOOT;
  return (player.sneak ? SNEAK_SPEED : BASE_SPEED) * Math.max(0.6, weight);
}

export function updatePlayer(player, input, level, dt) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  player.sneak = !!input.sneak;
  player.moving = dx !== 0 || dy !== 0;
  if (player.moving) {
    const len = Math.hypot(dx, dy);
    const speed = playerSpeed(player);
    player.angle = Math.atan2(dy, dx);
    moveCircle(player, (dx / len) * speed * dt, (dy / len) * speed * dt, player.r);
  }
  // Pulse gadget: freezes lasers and cameras, but the burst feeds the alarm.
  if (input.pulse && level.pulseCharges > 0 && level.pulseCooldown <= 0 && level.pulseTime <= 0) {
    level.pulseCharges -= 1;
    level.pulseTime = PULSE_FREEZE;
    level.pulseCooldown = 1.2;
    addAlarm(level, PULSE_ALARM_COST);
    player.pulsed = true;
  } else {
    player.pulsed = false;
  }
  if (level.pulseCooldown > 0) level.pulseCooldown -= dt;
  return player;
}

// Grab loot within reach. Returns the loot taken, or null.
export function tryGrabLoot(player, level) {
  for (const loot of level.loot) {
    if (loot.taken) continue;
    if (Math.hypot(player.x - loot.x, player.y - loot.y) < 34) {
      loot.taken = true;
      player.carried.push(loot.id);
      level.lootTaken += 1;
      level.score += loot.value;
      return loot;
    }
  }
  return null;
}
