import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const consumerRoot = mkdtempSync(join(tmpdir(), 'vueforge-icons-consumer-'));
const consumerNodeModules = join(consumerRoot, 'node_modules');
const packageScope = join(consumerRoot, 'node_modules', '@codemonster-ru');
const extractedPackage = join(consumerRoot, 'package');
const sourceRequire = createRequire(import.meta.url);

try {
  const npmCommand = globalThis.process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const packOutput = execFileSync(
    npmCommand,
    ['pack', '--json', '--ignore-scripts', '--pack-destination', consumerRoot],
    {
      cwd: packageRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const [{ filename }] = JSON.parse(packOutput);

  execFileSync('tar', ['-xzf', join(consumerRoot, filename), '-C', consumerRoot]);
  mkdirSync(packageScope, { recursive: true });
  symlinkSync(dirname(sourceRequire.resolve('vue/package.json')), join(consumerNodeModules, 'vue'), 'dir');
  symlinkSync(extractedPackage, join(packageScope, 'vueforge-icons'), 'dir');

  const consumerRequire = createRequire(join(consumerRoot, 'consumer.cjs'));

  assert.equal(globalThis.document, undefined);

  const { VueIconify, icons } = consumerRequire('@codemonster-ru/vueforge-icons');

  assert.equal(globalThis.document, undefined);

  const packageJson = JSON.parse(readFileSync(join(extractedPackage, 'package.json'), 'utf8'));
  const commonJsBundle = readFileSync(join(extractedPackage, packageJson.main), 'utf8');
  const esmBundle = readFileSync(join(extractedPackage, packageJson.module), 'utf8');
  const iconCss = readFileSync(consumerRequire.resolve('@codemonster-ru/vueforge-icons/style.css'), 'utf8');

  assert.doesNotMatch(commonJsBundle, /document\.(?:createElement|head)/);
  assert.doesNotMatch(commonJsBundle, /require\(["'][^"']+\.css["']\)/);
  assert.match(esmBundle, /import ["']\.\/index\.css["']/);
  assert.equal(packageJson.exports['./style.css'], './dist/index.css');
  assert.match(iconCss, /prefers-reduced-motion:\s*reduce/);
  assert.match(iconCss, /vf-icon-wrapper--spin[^}]*animation:\s*none/);

  const renderIcon = async (component, props = {}) => {
    const app = createSSRApp({
      render() {
        return h(component, props);
      },
    });

    return renderToString(app);
  };

  const genericMarkup = await renderIcon(VueIconify, {
    icon: icons.warning,
    size: 24,
    'aria-label': 'Warning',
    role: 'img',
  });

  assert.match(genericMarkup, /<svg/);
  assert.match(genericMarkup, /aria-label="Warning"/);
  assert.match(genericMarkup, /role="img"/);
  assert.match(genericMarkup, /width="24"/);
  assert.match(genericMarkup, /height="24"/);

  const fallbackMarkup = await renderIcon(VueIconify, {
    icon: 'unknown-icon-name',
    size: '2rem',
  });

  assert.match(fallbackMarkup, /<svg/);
  assert.match(fallbackMarkup, /width="2rem"/);
  assert.match(fallbackMarkup, /height="2rem"/);
  assert.match(fallbackMarkup, /mask="url\(#/);

  const calendarGenericMarkup = await renderIcon(VueIconify, {
    icon: icons.calendar,
    size: 22,
  });

  assert.match(calendarGenericMarkup, /<svg/);
  assert.match(calendarGenericMarkup, /fill="currentColor"/);
  assert.match(calendarGenericMarkup, /width="22"/);
  assert.match(calendarGenericMarkup, /height="22"/);

  const warningMarkup = await renderIcon(VueIconify, {
    icon: icons.warning,
    size: 18,
  });

  assert.match(warningMarkup, /<path/);
  assert.match(warningMarkup, /width="18"/);
  assert.match(warningMarkup, /height="18"/);
} finally {
  rmSync(consumerRoot, { recursive: true, force: true });
}
