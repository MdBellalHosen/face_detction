// Downloads the face-api model files into public/models.
// Runs automatically after `npm install` (postinstall). Use `npm run models` to force re-download.
import { mkdir, access, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model';
const FILES = [
  'tiny_face_detector_model.json',
  'tiny_face_detector_model.bin',
  'face_expression_model.json',
  'face_expression_model.bin',
];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'models');
const force = process.argv.includes('--force');

const exists = async (p) => {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
};

await mkdir(outDir, { recursive: true });

let failed = 0;
for (const file of FILES) {
  const dest = path.join(outDir, file);
  if (!force && (await exists(dest))) {
    console.log(`[models] skip  ${file} (already exists)`);
    continue;
  }
  try {
    const res = await fetch(`${BASE}/${file}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
    console.log(`[models] saved ${file}`);
  } catch (err) {
    failed += 1;
    console.warn(`[models] FAILED ${file}: ${err.message}`);
  }
}

if (failed > 0) {
  // Do not break `npm install`; tell the user how to fix it instead.
  console.warn(
    `\n[models] ${failed} file(s) could not be downloaded. Check your internet connection and run: npm run models\n`,
  );
}
