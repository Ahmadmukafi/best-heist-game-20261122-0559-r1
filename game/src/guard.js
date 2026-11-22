// Guard brains: patrol waypoints, suspicion that builds while the thief is in the
// cone, a chase when the alarm is sure, and a search of the last seen spot before
// giving up. A caught moment is fair: the guard must actually see the thief, and
// the thief gets a short grace window to break line of sight.
import { canSee, exposure } from './vision.js';
import { moveCircle, addAlarm } from './level.js';

const SUSPICIOUS_AT = 0.45;
const CHASE_AT = 1.0;
const GRACE = 0.35;

function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

function turnToward(guard, target, dt, rate) {
  let d = target - guard.angle;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  const step = Math.max(-rate * dt, Math.min(rate * dt, d));
  guard.angle += step;
}

function walkToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const nx = dx / dist;
  const ny = dy / dist;
  guard.angle = angleTo(guard.x, guard.y, tx, ty);
  moveCircle(guard, nx * speed * dt, ny * speed * dt, 14);
  return dist < 6;
}

export function updateGuard(guard, level, player, dt) {
  const seen = canSee(
    { x: guard.x, y: guard.y, angle: guard.angle, range: guard.range, halfAngle: guard.halfAngle },
    player.x, player.y, player.sneak,
  );
  if (seen) {
    guard.awareness = Math.min(1, guard.awareness + exposure(
      { x: guard.x, y: guard.y, angle: guard.angle, range: guard.range, halfAngle: guard.halfAngle },
      player.x, player.y,
    ) * dt * 1.6);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.grace = GRACE;
  } else {
    guard.grace = Math.max(0, (guard.grace ?? 0) - dt);
    guard.awareness = Math.max(0, guard.awareness - dt * 0.25);
  }

  if (guard.state === 'patrol') {
    if (guard.awareness >= CHASE_AT && guard.grace > 0) {
      guard.state = 'chase';
      guard.chaseTime = 0;
    } else if (guard.awareness >= SUSPICIOUS_AT) {
      guard.state = 'suspicious';
    } else {
      const wp = guard.waypoints[guard.waypoint];
      if (walkToward(guard, wp[0], wp[1], guard.speed, dt)) {
        guard.waypoint = (guard.waypoint + 1) % guard.waypoints.length;
      }
    }
  } else if (guard.state === 'suspicious') {
    turnToward(guard, angleTo(guard.x, guard.y, player.x, player.y), dt, 2.2);
    if (guard.awareness >= CHASE_AT && guard.grace > 0) {
      guard.state = 'chase';
      guard.chaseTime = 0;
    } else if (guard.awareness < 0.1) {
      guard.state = 'patrol';
    }
  } else if (guard.state === 'chase') {
    guard.chaseTime += dt;
    if (seen) {
      addAlarm(level, 30 * dt);
      walkToward(guard, player.x, player.y, guard.speed * 1.9, dt);
    } else if (guard.lastSeen) {
      if (walkToward(guard, guard.lastSeen.x, guard.lastSeen.y, guard.speed * 1.6, dt)) {
        guard.state = 'search';
        guard.searchTime = 0;
      }
    }
    if (guard.chaseTime > 6) {
      guard.state = 'search';
      guard.searchTime = 0;
    }
    // Caught: the guard reaches the thief.
    if (Math.hypot(player.x - guard.x, player.y - guard.y) < 26) return 'caught';
  } else if (guard.state === 'search') {
    guard.searchTime += dt;
    turnToward(guard, guard.angle + dt * 1.5, dt, 1.5);
    if (guard.awareness >= CHASE_AT && guard.grace > 0) {
      guard.state = 'chase';
      guard.chaseTime = 0;
    } else if (guard.searchTime > 4) {
      guard.state = 'patrol';
      guard.awareness = 0;
    }
  }
  return null;
}
