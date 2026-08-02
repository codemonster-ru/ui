import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { Resvg } from '@resvg/resvg-js';

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

  const {
    VueIconify,
    coreIconNames,
    iconCatalog,
    iconGroups,
    iconNames,
    icons,
    iconVariants,
    outlineIconVariants,
    showcaseIconEntries,
  } = consumerRequire('@codemonster-ru/vueforge-icons');

  assert.equal(globalThis.document, undefined);

  const packageJson = JSON.parse(readFileSync(join(extractedPackage, 'package.json'), 'utf8'));
  const rootExport = packageJson.exports['.'];
  const commonJsBundle = readFileSync(join(extractedPackage, rootExport.require.default), 'utf8');
  const esmBundle = readFileSync(join(extractedPackage, rootExport.import.default), 'utf8');
  const iconCss = readFileSync(consumerRequire.resolve('@codemonster-ru/vueforge-icons/style.css'), 'utf8');

  assert.doesNotMatch(commonJsBundle, /document\.(?:createElement|head)/);
  assert.doesNotMatch(commonJsBundle, /require\(["'][^"']+\.css["']\)/);
  assert.match(esmBundle, /import ["']\.\/index\.css["']/);
  assert.doesNotMatch(esmBundle, /Blind comparison|vueforge-icons-reference-review-votes-v1/);
  assert.doesNotMatch(commonJsBundle, /Blind comparison|vueforge-icons-reference-review-votes-v1/);
  assert.equal(packageJson.exports['./style.css'], './dist/index.css');
  assert.deepEqual(iconVariants, ['solid', 'regular', 'light', 'thin']);
  assert.deepEqual(outlineIconVariants, ['regular', 'light', 'thin']);
  assert.deepEqual(
    iconGroups.flatMap((group) => group.icons),
    iconNames,
  );
  assert.equal(iconNames.length, Object.keys(iconCatalog).length);
  assert.ok(coreIconNames.every((iconName) => iconNames.includes(iconName)));
  assert.ok(showcaseIconEntries.every(({ icon }) => iconNames.includes(icon)));
  assert.deepEqual(iconCatalog.calendar.variants, ['solid', 'regular', 'light', 'thin']);
  assert.deepEqual(iconCatalog.github.variants, ['solid']);
  assert.equal(iconCatalog.calendar.style, 'outline');
  assert.equal(iconCatalog.github.style, 'solid');
  assert.match(iconCss, /prefers-reduced-motion:\s*reduce/);
  assert.match(iconCss, /vf-icon-wrapper--spin[^}]*animation:\s*none/);

  const renderIcon = async (component, props = {}, suppressWarnings = false) => {
    const app = createSSRApp({
      render() {
        return h(component, props);
      },
    });

    if (suppressWarnings) {
      app.config.warnHandler = () => {};
    }

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
  assert.match(fallbackMarkup, /stroke="currentColor"/);
  assert.doesNotMatch(fallbackMarkup, /mask="url\(#/);

  const kebabCaseMarkup = await renderIcon(VueIconify, {
    icon: 'check-circle',
  });
  const camelCaseMarkup = await renderIcon(VueIconify, {
    icon: icons.checkCircle,
  });

  assert.equal(kebabCaseMarkup, camelCaseMarkup);
  await assert.rejects(
    () => renderIcon(VueIconify, { icon: icons.github, variant: 'regular' }, true),
    /Icon "github" does not support the "regular" variant/,
  );

  const calendarGenericMarkup = await renderIcon(VueIconify, {
    icon: icons.calendar,
    size: 22,
  });

  assert.match(calendarGenericMarkup, /<svg/);
  assert.match(calendarGenericMarkup, /viewBox="0 0 24 24"/);
  assert.match(calendarGenericMarkup, /stroke="currentColor"/);
  assert.match(calendarGenericMarkup, /stroke-width="2"/);
  assert.match(calendarGenericMarkup, /stroke-linecap="round"/);
  assert.match(calendarGenericMarkup, /stroke-linejoin="round"/);
  assert.match(calendarGenericMarkup, /width="22"/);
  assert.match(calendarGenericMarkup, /height="22"/);

  const lightMarkup = await renderIcon(VueIconify, {
    icon: icons.calendar,
    variant: 'light',
  });
  const thinMarkup = await renderIcon(VueIconify, {
    icon: icons.calendar,
    variant: 'thin',
  });
  const solidMarkup = await renderIcon(VueIconify, {
    icon: icons.calendar,
    variant: 'solid',
  });

  assert.match(lightMarkup, /stroke-width="1.5"/);
  assert.match(thinMarkup, /stroke-width="1"/);
  assert.match(solidMarkup, /fill="currentColor"/);
  assert.doesNotMatch(solidMarkup, /<svg[^>]*stroke-width=/);

  const heartRegularMarkup = await renderIcon(VueIconify, {
    icon: icons.heart,
    variant: 'regular',
  });
  const heartSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.heart,
    variant: 'solid',
  });

  assert.match(heartRegularMarkup, /--vf-icon-offset-y:-0\.0508/);
  assert.match(heartSolidMarkup, /--vf-icon-offset-y:-0\.0508/);

  const warningMarkup = await renderIcon(VueIconify, {
    icon: icons.warning,
    size: 18,
  });

  assert.match(warningMarkup, /<path/);
  assert.match(warningMarkup, /width="18"/);
  assert.match(warningMarkup, /height="18"/);

  for (const [iconName, catalogEntry] of Object.entries(iconCatalog)) {
    for (const variant of catalogEntry.variants) {
      const markup = await renderIcon(VueIconify, {
        icon: iconName,
        variant,
        size: 24,
      });

      assert.match(markup, /<svg/);
      const svg = markup.match(/<svg[\s\S]*<\/svg>/)?.[0].replace(/\sdata-v-[\w-]+/g, '');

      assert.ok(svg, `${iconName}/${variant} must include SVG markup`);
      assert.ok(new Resvg(svg).render().asPng().byteLength > 0, `${iconName}/${variant} must render visible SVG`);
    }
  }
} finally {
  rmSync(consumerRoot, { recursive: true, force: true });
}
