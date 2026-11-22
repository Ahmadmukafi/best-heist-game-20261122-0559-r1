// CRIMSON VAULT — The Meridian Job (Node 22, standard library only). The game is
// this directory's game/ folder, plain static files a desktop browser loads offline
// (game/index.html and its ES modules, no library and no network request), and the
// program hands it in: it copies game/ and screenshots/ from beside this file to
// /output and writes /output/dossier.json, the summary the judge reads, with the
// vendored make.fun library. Serve it locally with `node serve.ts`, then open
// http://localhost:8080. Outside the grader's container, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes;
// the others refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files in game/ or 48 MiB of game files, in all, or a
// path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap,
// its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Fail loudly instead of handing in a dossier the gate would refuse: the sealed
// scorer caps dossier.json at 1.5 MiB, and a run that writes more is invalid.
const dossierBytes = statSync(join(out, 'dossier.json')).size;
if (dossierBytes > 1572864) {
  throw new Error(`dossier.json is ${dossierBytes} bytes, over the 1.5 MiB cap`);
}
// The dossier must name this game's own screenshots, never the kit starter's.
const dossierText = readFileSync(join(out, 'dossier.json'), 'utf8');
if (!dossierText.includes('1-cover.jpg') || !dossierText.includes('CRIMSON VAULT')) {
  throw new Error('dossier.json does not describe the Crimson Vault entry');
}
