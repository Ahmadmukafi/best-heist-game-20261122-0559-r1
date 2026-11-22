// Cameras: fixed mounts that sweep their cone back and forth. A camera that spots
// the thief raises the alarm and paints the thief with a red lock-on ring; a pulse
// freezes the sweep (and the lasers) for a few seconds.
import { canSee, exposure } from './vision.js';
import { addAlarm } from './level.js';

export function updateCamera(camera, level, player, dt) {
  if (level.pulseTime > 0) return false; // frozen by the pulse
  camera.angle = camera.base + Math.sin(level.time * camera.speed) * camera.sweep;
  const seen = canSee(
    { x: camera.x, y: camera.y, angle: camera.angle, range: camera.range, halfAngle: 0.5 },
    player.x, player.y, player.sneak,
  );
  if (seen) {
    const hot = exposure(
      { x: camera.x, y: camera.y, angle: camera.angle, range: camera.range, halfAngle: 0.5 },
      player.x, player.y,
    );
    addAlarm(level, (10 + hot * 22) * dt);
    camera.lock = Math.min(1, (camera.lock ?? 0) + dt * 2);
    return true;
  }
  camera.lock = Math.max(0, (camera.lock ?? 0) - dt);
  return false;
}
