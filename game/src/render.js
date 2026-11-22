// Rendering: one canvas, drawn fresh every frame. The cover frame must read at a
// glance — thief, guard cones, cameras, loot, lasers and the alarm meter, all in
// one shot — so the HUD is big, the cones are bright and the loot glows gold.
import { VIEW, PALETTE, WALLS, EXIT } from './config.js';
import { laserLive } from './level.js';

function conePath(ctx, x, y, angle, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawFloor(ctx, time) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Marble tiles.
  ctx.strokeStyle = PALETTE.floorTile;
  ctx.lineWidth = 1;
  for (let x = 0; x <= VIEW.width; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VIEW.height); ctx.stroke();
  }
  for (let y = 0; y <= VIEW.height; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW.width, y); ctx.stroke();
  }
  // Gold inlay: a runner carpet down the centre hall.
  ctx.fillStyle = 'rgba(232, 183, 58, 0.10)';
  ctx.fillRect(600, 16, 80, 768);
  ctx.strokeStyle = 'rgba(232, 183, 58, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(600, 16, 80, 768);
  // Warm light pools under the ceiling lamps.
  for (const [lx, ly] of [[320, 200], [640, 420], [960, 200], [1120, 560]]) {
    const g = ctx.createRadialGradient(lx, ly, 10, lx, ly, 190);
    g.addColorStop(0, 'rgba(255, 214, 120, 0.10)');
    g.addColorStop(1, 'rgba(255, 214, 120, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 190, ly - 190, 380, 380);
  }
  // Room labels, etched on the floor.
  ctx.fillStyle = 'rgba(245, 233, 208, 0.35)';
  ctx.font = '600 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('VAULT', 218, 90);
  ctx.fillText('MERIDIAN HALL', 640, 480);
  ctx.fillText('RECORDS OFFICE', 1062, 90);
}

function drawWalls(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 4);
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y + 4, w.w, w.h - 4);
  }
}

function drawLoot(ctx, level, time) {
  for (const loot of level.loot) {
    if (loot.taken) continue;
    const pulse = 0.5 + 0.5 * Math.sin(time * 3 + loot.x);
    const g = ctx.createRadialGradient(loot.x, loot.y, 4, loot.x, loot.y, 46);
    g.addColorStop(0, `rgba(255, 217, 104, ${0.35 + 0.25 * pulse})`);
    g.addColorStop(1, 'rgba(255, 217, 104, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(loot.x - 46, loot.y - 46, 92, 92);
    ctx.fillStyle = PALETTE.gold;
    ctx.strokeStyle = PALETTE.goldBright;
    ctx.lineWidth = 2;
    if (loot.id === 'gold') {
      for (let i = 0; i < 3; i += 1) {
        ctx.fillRect(loot.x - 22 + i * 8, loot.y - 8 + i * 7, 30, 10);
        ctx.strokeRect(loot.x - 22 + i * 8, loot.y - 8 + i * 7, 30, 10);
      }
    } else if (loot.id === 'diamond') {
      ctx.save();
      ctx.translate(loot.x, loot.y);
      ctx.rotate(Math.sin(time * 1.5) * 0.15);
      ctx.beginPath();
      ctx.moveTo(0, -20); ctx.lineTo(16, 0); ctx.lineTo(0, 20); ctx.lineTo(-16, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-16, 0); ctx.lineTo(0, -20); ctx.lineTo(16, 0); ctx.lineTo(0, 8); ctx.lineTo(-16, 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
      ctx.restore();
    } else {
      ctx.fillRect(loot.x - 16, loot.y - 12, 32, 24);
      ctx.strokeRect(loot.x - 16, loot.y - 12, 32, 24);
      ctx.fillStyle = PALETTE.crimsonDark;
      ctx.fillRect(loot.x - 16, loot.y - 12, 32, 6);
    }
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '600 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(loot.name.toUpperCase(), loot.x, loot.y + 42);
  }
}

function drawLasers(ctx, level) {
  for (const beam of level.lasers) {
    const live = laserLive(beam, level.time) && level.pulseTime <= 0;
    ctx.strokeStyle = live ? PALETTE.laser : 'rgba(255, 45, 85, 0.18)';
    ctx.lineWidth = live ? 3 : 1;
    ctx.shadowColor = PALETTE.laser;
    ctx.shadowBlur = live ? 12 : 0;
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y);
    ctx.lineTo(beam.x2, beam.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Emitters on the walls.
    ctx.fillStyle = live ? PALETTE.laser : '#5a2a33';
    ctx.fillRect(beam.x1 - 6, beam.y - 5, 8, 10);
    ctx.fillRect(beam.x2 - 2, beam.y - 5, 8, 10);
  }
  if (level.pulseTime > 0) {
    ctx.fillStyle = 'rgba(47, 212, 196, 0.85)';
    ctx.font = '700 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`PULSE — lasers frozen ${level.pulseTime.toFixed(1)}s`, 640, 296);
  }
}

function drawCameras(ctx, level) {
  for (const cam of level.cameras) {
    const frozen = level.pulseTime > 0;
    const hot = (cam.lock ?? 0) > 0.4;
    ctx.fillStyle = hot ? PALETTE.alarm : frozen ? PALETTE.thief : PALETTE.coneHot ? '#d8cdb4' : '#d8cdb4';
    conePath(ctx, cam.x, cam.y, cam.angle, 0.5, cam.range);
    ctx.fillStyle = hot ? PALETTE.coneHot : PALETTE.cone;
    ctx.fill();
    // Mount.
    ctx.fillStyle = '#3d3a44';
    ctx.fillRect(cam.x - 10, cam.y - 8, 20, 12);
    ctx.fillStyle = hot ? PALETTE.alarm : '#9a94a3';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    if (hot) {
      ctx.strokeStyle = PALETTE.alarm;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cam.x, cam.y + 8, 12 + Math.sin(level.time * 8) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawGuards(ctx, level) {
  for (const guard of level.guards) {
    const chasing = guard.state === 'chase';
    const suspicious = guard.state === 'suspicious' || guard.state === 'search';
    ctx.fillStyle = chasing ? PALETTE.coneHot : suspicious ? 'rgba(255, 180, 60, 0.22)' : PALETTE.cone;
    conePath(ctx, guard.x, guard.y, guard.angle, guard.halfAngle, guard.range);
    ctx.fill();
    // Body.
    ctx.fillStyle = chasing ? PALETTE.crimson : PALETTE.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.guardDark;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, guard.angle - 0.9, guard.angle + 0.9);
    ctx.lineTo(guard.x, guard.y);
    ctx.fill();
    // Cap + badge.
    ctx.fillStyle = '#d8cdb4';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y - 3, 6, 0, Math.PI * 2);
    ctx.fill();
    // Awareness arc above the head.
    if (guard.awareness > 0.05) {
      ctx.strokeStyle = chasing ? PALETTE.alarm : PALETTE.gold;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 21, -Math.PI / 2, -Math.PI / 2 + guard.awareness * Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '600 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.name.toUpperCase(), guard.x, guard.y - 26);
  }
}

function drawThief(ctx, player, level) {
  const bob = player.moving ? Math.sin(level.time * 12) * 1.5 : 0;
  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 10, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(player.x, player.y + bob);
  ctx.rotate(player.angle);
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(0, 0, player.r, 0, Math.PI * 2);
  ctx.fill();
  // Crimson scarf — the signature.
  ctx.fillStyle = PALETTE.crimson;
  ctx.fillRect(-player.r - 2, -4, 8, 8);
  ctx.beginPath();
  ctx.moveTo(-player.r - 2, -4);
  ctx.lineTo(-player.r - 12, -8);
  ctx.lineTo(-player.r - 12, 8);
  ctx.lineTo(-player.r - 2, 4);
  ctx.closePath();
  ctx.fill();
  // Facing wedge.
  ctx.fillStyle = PALETTE.thiefDark;
  ctx.beginPath();
  ctx.moveTo(player.r + 6, 0);
  ctx.lineTo(2, -7);
  ctx.lineTo(2, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (player.sneak) {
    ctx.strokeStyle = 'rgba(47, 212, 196, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (player.carried.length > 0) {
    ctx.fillStyle = PALETTE.goldBright;
    ctx.font = '700 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`LOOT ×${player.carried.length}`, player.x, player.y - 24);
  }
}

function drawExit(ctx) {
  const g = ctx.createRadialGradient(EXIT.x, EXIT.y, 4, EXIT.x, EXIT.y, 60);
  g.addColorStop(0, 'rgba(47, 191, 113, 0.4)');
  g.addColorStop(1, 'rgba(47, 191, 113, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(EXIT.x - 60, EXIT.y - 60, 120, 120);
  ctx.strokeStyle = PALETTE.safe;
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT.x - 24, EXIT.y - 24, 48, 48);
  ctx.fillStyle = PALETTE.safe;
  ctx.font = '700 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('GETAWAY', EXIT.x + 4, EXIT.y + 44);
}

function drawHud(ctx, level, player) {
  // Top bar.
  ctx.fillStyle = 'rgba(10, 6, 9, 0.82)';
  ctx.fillRect(0, 0, VIEW.width, 46);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '700 20px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('CRIMSON VAULT', 18, 30);
  ctx.font = '600 15px Georgia, serif';
  ctx.fillStyle = PALETTE.goldBright;
  ctx.fillText(`SCORE ${level.score}`, 250, 29);
  ctx.fillStyle = PALETTE.hud;
  const taken = level.loot.filter((l) => l.taken).length;
  ctx.fillText(`LOOT ${taken}/3`, 400, 29);
  // Lives.
  ctx.fillStyle = PALETTE.crimson;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(520 + i * 24, 22, i < level.lives ? 8 : 8, 0, Math.PI * 2);
    if (i < level.lives) ctx.fill(); else ctx.stroke();
  }
  // Pulse charges.
  ctx.fillStyle = PALETTE.thief;
  ctx.font = '600 15px Georgia, serif';
  ctx.fillText(`PULSE ×${level.pulseCharges}  [SPACE]`, 600, 29);
  // Alarm meter — big, centre-right, impossible to miss.
  const ax = 880;
  const aw = 300;
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '700 15px Georgia, serif';
  ctx.fillText('ALARM', ax, 20);
  ctx.fillStyle = '#3a2228';
  ctx.fillRect(ax, 26, aw, 12);
  const frac = level.alarm / 100;
  ctx.fillStyle = frac > 0.66 ? PALETTE.alarm : frac > 0.33 ? '#ff9f1c' : PALETTE.gold;
  ctx.fillRect(ax, 26, aw * frac, 12);
  ctx.strokeStyle = PALETTE.hud;
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, 26, aw, 12);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '700 14px Georgia, serif';
  ctx.fillText(`${Math.round(level.alarm)}%`, ax + aw + 10, 38);
  // Controls hint, bottom.
  ctx.fillStyle = 'rgba(245, 233, 208, 0.6)';
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD move · SHIFT sneak · SPACE pulse (freezes lasers + cameras) · E grab loot · grab all 3, then reach GETAWAY', 640, 792);
}

function drawAlarmVignette(ctx, level) {
  if (level.alarm < 25) return;
  const strength = (level.alarm - 25) / 75;
  const pulse = 0.5 + 0.5 * Math.sin(level.time * 5);
  const g = ctx.createRadialGradient(640, 400, 300, 640, 400, 720);
  g.addColorStop(0, 'rgba(255, 59, 48, 0)');
  g.addColorStop(1, `rgba(255, 59, 48, ${0.25 * strength * (0.6 + 0.4 * pulse)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 4, 7, 0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = accent;
  ctx.font = '700 54px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 640, 330);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '20px Georgia, serif';
  lines.forEach((line, i) => ctx.fillText(line, 640, 390 + i * 34));
}

export function render(ctx, level, player, screen) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx, level.time);
  drawExit(ctx);
  drawLoot(ctx, level, level.time);
  drawLasers(ctx, level);
  drawCameras(ctx, level);
  drawGuards(ctx, level);
  drawThief(ctx, player, level);
  drawWalls(ctx);
  drawHud(ctx, level, player);
  drawAlarmVignette(ctx, level);
  if (screen === 'title') {
    overlay(ctx, 'CRIMSON VAULT', [
      'The Meridian Job — one thief, one vault, three prizes.',
      'Dodge the cones. Time the lasers. Grab it all and run.',
      'Press ENTER to begin',
    ], PALETTE.goldBright);
  } else if (screen === 'caught') {
    overlay(ctx, 'CAUGHT!', [
      `The alarm hit 100%. ${level.lives} ${level.lives === 1 ? 'life' : 'lives'} left.`,
      'Press ENTER to slip back in',
    ], PALETTE.alarm);
  } else if (screen === 'over') {
    overlay(ctx, 'THE VAULT KEEPS ITS GOLD', [
      'All three lives spent. The Meridian Job ends here.',
      'Press ENTER to try again',
    ], PALETTE.alarm);
  } else if (screen === 'win') {
    overlay(ctx, 'CLEAN GETAWAY!', [
      `All three prizes — score ${level.score}. The vault never saw you coming.`,
      'Press ENTER to run it again',
    ], PALETTE.safe);
  }
}
