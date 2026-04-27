import { build } from 'esbuild';
import { readFileSync, writeFileSync, cpSync, rmSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(ROOT, 'dist');
const manifest = JSON.parse(readFileSync(resolve(ROOT, 'manifest.json'), 'utf8'));
const VERSION = manifest.version;
const PROD = process.argv.includes('--prod');
const GECKO_ID = 'ui-tools@nicepage.dev';

const STATIC_FILES = [
  ['manifest.json', 'manifest.json'],
  ['devtools.html', 'devtools.html'],
  ['devtools.js', 'devtools.js'],
  ['panel.html', 'panel.html'],
  ['icons', 'icons'],
  ['src/panel/styles', 'styles'],
];

rmSync(DIST, { recursive: true, force: true });

for (const browser of ['chrome', 'firefox']) {
  const out = resolve(DIST, browser);
  mkdirSync(out, { recursive: true });

  for (const [src, dest] of STATIC_FILES) {
    cpSync(resolve(ROOT, src), resolve(out, dest), { recursive: true });
  }

  await build({
    entryPoints: [resolve(ROOT, 'src/panel/init.ts')],
    bundle: true,
    format: 'esm',
    target: 'chrome120',
    outfile: resolve(out, 'panel.js'),
    sourcemap: PROD ? false : 'linked',
    minify: PROD,
    logLevel: 'info',
  });

  await build({
    entryPoints: [resolve(ROOT, 'src/injected/index.ts')],
    bundle: true,
    format: 'iife',
    target: 'chrome120',
    outfile: resolve(out, 'injected.js'),
    sourcemap: PROD ? false : 'linked',
    minify: PROD,
    logLevel: 'info',
  });

  if (browser === 'firefox') {
    const mPath = resolve(out, 'manifest.json');
    const m = JSON.parse(readFileSync(mPath, 'utf8'));
    m.browser_specific_settings = {
      gecko: { id: GECKO_ID, strict_min_version: '128.0' },
    };
    writeFileSync(mPath, JSON.stringify(m, null, 2));
  }
}

if (PROD) {
  execSync(`zip -rq "${DIST}/ui-tools-chrome-v${VERSION}.zip" .`, {
    cwd: resolve(DIST, 'chrome'),
  });
  execSync(`zip -rq "${DIST}/ui-tools-firefox-v${VERSION}.zip" .`, {
    cwd: resolve(DIST, 'firefox'),
  });
  console.log(`\nBuilt v${VERSION} (production):`);
  console.log(`  dist/ui-tools-chrome-v${VERSION}.zip`);
  console.log(`  dist/ui-tools-firefox-v${VERSION}.zip`);
} else {
  console.log(`\nBuilt v${VERSION} (development):`);
  console.log(`  dist/chrome/  (load unpacked in chrome://extensions)`);
  console.log(`  dist/firefox/ (load in about:debugging)`);
}
