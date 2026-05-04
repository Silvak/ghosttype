/**
 * Copies ONNX Runtime Web WASM assets into public/transformers/ so they are
 * served as web_accessible_resources in MV3.
 *
 * @huggingface/transformers dist/ only ships a subset of ORT files; the full
 * ort-wasm-simd-threaded(.jsep)?.* set lives in onnxruntime-web/dist and is
 * required when the browser falls back from WebGPU to WASM.
 */

import { copyFile, mkdir, readdir, unlink, access } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { constants as fsConstants } from 'node:fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');
const DEST_DIR = join(root, 'public', 'transformers');

const ORT_WASM_FILE = /^ort-wasm.*\.(mjs|wasm|wasm\.gz)$/i;

async function dirExists(dir) {
  try {
    await access(dir, fsConstants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Locates onnxruntime-web/dist without relying on require.resolve (package
 * "exports" often block package.json subpaths; pnpm may not hoist the dep).
 */
async function resolveOnnxRuntimeWebDist() {
  const flat = join(root, 'node_modules', 'onnxruntime-web', 'dist');
  if (await dirExists(flat)) return flat;

  const pnpmDir = join(root, 'node_modules', '.pnpm');
  if (!(await dirExists(pnpmDir))) return null;

  const entries = await readdir(pnpmDir);
  const candidates = entries.filter(e => e.startsWith('onnxruntime-web@'));
  if (candidates.length === 0) return null;

  candidates.sort();
  for (let i = candidates.length - 1; i >= 0; i--) {
    const dist = join(pnpmDir, candidates[i], 'node_modules', 'onnxruntime-web', 'dist');
    if (await dirExists(dist)) return dist;
  }

  return null;
}

async function removeObsoleteNodeBundles() {
  let names;
  try {
    names = await readdir(DEST_DIR);
  } catch {
    return;
  }
  const obsolete = names.filter(
    n => n.startsWith('transformers.node') && /\.(mjs|cjs)$/i.test(n),
  );
  await Promise.all(obsolete.map(f => unlink(join(DEST_DIR, f)).catch(() => {})));
}

async function run() {
  const srcDir = await resolveOnnxRuntimeWebDist();
  if (!srcDir) {
    console.error('[copy-transformers-assets] Could not find onnxruntime-web/dist.');
    console.error('  Run `pnpm install` first.');
    process.exit(1);
  }

  let srcFiles;
  try {
    srcFiles = await readdir(srcDir);
  } catch {
    console.error('[copy-transformers-assets] Source dir not readable:', srcDir);
    process.exit(1);
  }

  const targets = srcFiles.filter(f => ORT_WASM_FILE.test(f));

  if (targets.length === 0) {
    console.error('[copy-transformers-assets] No ort-wasm *.mjs / *.wasm in', srcDir);
    console.error('  Check that onnxruntime-web is installed.');
    process.exit(1);
  }

  await mkdir(DEST_DIR, { recursive: true });
  await removeObsoleteNodeBundles();

  await Promise.all(
    targets.map(async file => {
      const src = join(srcDir, file);
      const dest = join(DEST_DIR, file);
      await copyFile(src, dest);
    }),
  );

  console.log(
    `[copy-transformers-assets] Copied ${targets.length} ONNX Runtime Web files from`,
    `\n  ${srcDir}\n  → public/transformers/`,
  );
}

run().catch(err => {
  console.error('[copy-transformers-assets] Error:', err);
  process.exit(1);
});
