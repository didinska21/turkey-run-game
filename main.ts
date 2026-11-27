// Package the playable directory exactly as static files; no build or install step.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repository = dirname(fileURLToPath(import.meta.url));
const destination = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
const gameSource = join(repository, 'game');
const shotSource = join(repository, 'screenshots');
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

try {
  if (destination === repository || [gameSource, shotSource].some(source => destination === source || destination.startsWith(source + sep))) {
    throw new Error('Choose an output directory outside the source game and screenshots.');
  }
  mkdirSync(destination, { recursive: true });
  cpSync(gameSource, join(destination, 'game'), { recursive: true, force: true });
  const shotDestination = join(destination, 'screenshots');
  if (existsSync(shotSource)) cpSync(shotSource, shotDestination, { recursive: true, force: true });
  else mkdirSync(shotDestination, { recursive: true });
  const dossier = buildDossier(destination, caps);
  writeFileSync(join(destination, 'dossier.json'), dossier);
  console.log(`Packed Turkey Run into ${destination} (${dossier.byteLength} dossier bytes).`);
} catch (error) {
  console.error(`Packaging failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
