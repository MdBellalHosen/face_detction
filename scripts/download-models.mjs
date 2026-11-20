// Downloads the face-api model files into public/models.
// Runs automatically after `npm install` (postinstall). Use `npm run models` to force re-download.
import { mkdir, access, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model';
const MODELS = ['tiny_face_detector_model', 'face_expression_model'];

// The manifest (.json) has been published under two names. Try both, and save it under both
// names locally so the loader finds it whichever one it asks for.
const manifestSources = (name) => [`${name}-weights_manifest.json`, `${name}.json`];
const manifestTargets = (name) => [`${name}-weights_manifest.json`, `${name}.json`];

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

const download = async (file) => {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
};

await mkdir(outDir, { recursive: true });

let failed = 0;
for (const name of MODELS) {
  // 1. weights (.bin)
  const bin = `${name}.bin`;
  if (!force && (await exists(path.join(outDir, bin)))) {
    console.log(`[models] skip  ${bin} (already exists)`);
  } else {
    try {
      await writeFile(path.join(outDir, bin), await download(bin));
      console.log(`[models] saved ${bin}`);
    } catch (err) {
      failed += 1;
      console.warn(`[models] FAILED ${bin}: ${err.message}`);
    }
  }

  // 2. manifest (.json)
  const targets = manifestTargets(name).map((f) => path.join(outDir, f));
  const haveAll = (await Promise.all(targets.map(exists))).every(Boolean);
  if (!force && haveAll) {
    console.log(`[models] skip  ${name} manifest (already exists)`);
    continue;
  }

  let data = null;
  for (const source of manifestSources(name)) {
    try {
      data = await download(source);
      console.log(`[models] saved ${name} manifest (from ${source})`);
      break;
    } catch (err) {
      console.warn(`[models] ${source}: ${err.message}`);
    }
  }
  if (data) {
    await Promise.all(targets.map((target) => writeFile(target, data)));
  } else {
    failed += 1;
    console.warn(`[models] FAILED ${name} manifest`);
  }
}

if (failed > 0) {
  // Do not break `npm install`; tell the user how to fix it instead.
  console.warn(
    `\n[models] ${failed} file(s) could not be downloaded. Check your internet connection and run: npm run models\n`,
  );
}
