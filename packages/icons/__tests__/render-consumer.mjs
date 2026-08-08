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
const packageScope = join(consumerNodeModules, '@codemonster-ru');
const extractedPackage = join(consumerRoot, 'package');
const sourceRequire = createRequire(import.meta.url);
const solidSingleToneIconNames = new Set([
  'activity',
  'bookmark',
  'caretDown',
  'caretLeft',
  'caretRight',
  'caretUp',
  'check',
  'chevronDown',
  'chevronLeft',
  'chevronRight',
  'chevronUp',
  'circleNotch',
  'cloud',
  'filter',
  'gear',
  'globe',
  'heart',
  'house',
  'mail',
  'message',
  'minus',
  'moon',
  'phone',
  'plus',
  'receipt',
  'send',
  'shield',
  'star',
  'xmark',
]);

const renderIcon = (component, props = {}, suppressWarnings = false) => {
  const app = createSSRApp({ render: () => h(component, props) });

  if (suppressWarnings) {
    app.config.warnHandler = () => {};
  }

  return renderToString(app);
};

try {
  const npmCommand = globalThis.process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const packOutput = execFileSync(
    npmCommand,
    ['pack', '--json', '--ignore-scripts', '--pack-destination', consumerRoot],
    { cwd: packageRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const [{ filename }] = JSON.parse(packOutput);

  execFileSync('tar', ['-xzf', join(consumerRoot, filename), '-C', consumerRoot]);
  mkdirSync(packageScope, { recursive: true });
  symlinkSync(dirname(sourceRequire.resolve('vue/package.json')), join(consumerNodeModules, 'vue'), 'dir');
  symlinkSync(extractedPackage, join(packageScope, 'vueforge-icons'), 'dir');

  const consumerRequire = createRequire(join(consumerRoot, 'consumer.cjs'));
  const {
    VueIconify,
    coreIconNames,
    iconCatalog,
    iconFamilies,
    iconGroups,
    iconNames,
    icons,
    iconVariants,
    outlineIconVariants,
    showcaseIconEntries,
  } = consumerRequire('@codemonster-ru/vueforge-icons');
  const packageJson = JSON.parse(readFileSync(join(extractedPackage, 'package.json'), 'utf8'));
  const rootExport = packageJson.exports['.'];
  const commonJsBundle = readFileSync(join(extractedPackage, rootExport.require.default), 'utf8');
  const esmBundle = readFileSync(join(extractedPackage, rootExport.import.default), 'utf8');
  const iconCss = readFileSync(consumerRequire.resolve('@codemonster-ru/vueforge-icons/style.css'), 'utf8');

  assert.equal(globalThis.document, undefined);
  assert.doesNotMatch(commonJsBundle, /document\.(?:createElement|head)/);
  assert.doesNotMatch(commonJsBundle, /require\(["'][^"']+\.css["']\)/);
  assert.match(esmBundle, /import ["']\.\/index\.css["']/);
  assert.doesNotMatch(esmBundle, /Blind comparison|vueforge-icons-reference-review-votes-v1/);
  assert.doesNotMatch(commonJsBundle, /Blind comparison|vueforge-icons-reference-review-votes-v1/);
  assert.equal(packageJson.exports['./style.css'], './dist/index.css');
  assert.deepEqual(iconVariants, ['solid', 'regular', 'light', 'thin']);
  assert.deepEqual(iconFamilies, ['classic', 'duotone']);
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
  assert.match(iconCss, /prefers-reduced-motion:\s*reduce/);
  assert.match(iconCss, /vf-icon-wrapper--spin[^}]*animation:\s*none/);

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

  const fallbackMarkup = await renderIcon(VueIconify, { icon: 'unknown-icon-name', size: '2rem' });
  assert.match(fallbackMarkup, /width="2rem"/);
  assert.match(fallbackMarkup, /height="2rem"/);
  assert.match(fallbackMarkup, /stroke="currentColor"/);

  assert.equal(
    await renderIcon(VueIconify, { icon: 'check-circle' }),
    await renderIcon(VueIconify, { icon: icons.checkCircle }),
  );

  await assert.rejects(
    () => renderIcon(VueIconify, { icon: icons.github, variant: 'regular' }, true),
    /does not support the "regular" variant/,
  );
  await assert.rejects(
    () => renderIcon(VueIconify, { icon: icons.warning, family: 'unknown' }, true),
    /Unknown icon family/,
  );
  await assert.rejects(
    () => renderIcon(VueIconify, { icon: icons.github, family: 'duotone' }, true),
    /does not support the "duotone" family/,
  );

  assert.match(await renderIcon(VueIconify, { icon: icons.calendar, variant: 'regular' }), /stroke-width="2"/);
  assert.match(await renderIcon(VueIconify, { icon: icons.calendar, variant: 'light' }), /stroke-width="1.5"/);
  assert.match(await renderIcon(VueIconify, { icon: icons.calendar, variant: 'thin' }), /stroke-width="1"/);
  assert.match(await renderIcon(VueIconify, { icon: icons.calendar, variant: 'solid' }), /fill="currentColor"/);

  const duotoneBorderWidths = { regular: 2.5, light: 1.75, thin: 1 };
  for (const variant of outlineIconVariants) {
    const classicMarkup = await renderIcon(VueIconify, { icon: icons.arrowDown, variant, size: 32 });
    const duotoneMarkup = await renderIcon(VueIconify, {
      icon: icons.arrowDown,
      family: 'duotone',
      variant,
      size: 32,
      secondaryColor: 'currentColor',
      secondaryOpacity: 0.4,
    });
    const classicSvg = classicMarkup.match(/<svg[\s\S]*<\/svg>/)?.[0].replace(/\sdata-v-[\w-]+/g, '');
    const duotoneSvg = duotoneMarkup.match(/<svg[\s\S]*<\/svg>/)?.[0].replace(/\sdata-v-[\w-]+/g, '');

    assert.ok(classicSvg && duotoneSvg);
    assert.match(
      duotoneSvg,
      /<path[^>]*fill="currentColor"[^>]*fill-opacity="0.4"[^>]*stroke="none"/,
      `arrowDown/duotone/${variant} must contain an authored secondary filled mass`,
    );
    assert.match(
      duotoneSvg,
      new RegExp(`<path[^>]*fill="none"[^>]*stroke="currentColor"[^>]*stroke-width="${duotoneBorderWidths[variant]}"`),
      `arrowDown/duotone/${variant} must contain its weighted primary contour`,
    );
    assert.notDeepEqual(
      new Resvg(duotoneSvg).render().asPng(),
      new Resvg(classicSvg).render().asPng(),
      `arrowDown/duotone/${variant} must render differently from Classic with currentColor`,
    );
  }

  const databaseDuotone = await renderIcon(VueIconify, {
    icon: icons.database,
    family: 'duotone',
    variant: 'regular',
    secondaryColor: '#8ea8ff',
  });
  const keyDuotone = await renderIcon(VueIconify, {
    icon: icons.key,
    family: 'duotone',
    variant: 'regular',
    secondaryColor: '#8ea8ff',
  });
  const ellipsisDuotone = await renderIcon(VueIconify, {
    icon: icons.ellipsis,
    family: 'duotone',
    variant: 'regular',
    secondaryColor: '#8ea8ff',
  });

  assert.match(databaseDuotone, /v11\.5c0 2-3\.47 3\.5-7\.75 3\.5/);
  assert.match(keyDuotone, /<circle cx="15\.5" cy="8\.75" r="6\.5" fill="#8ea8ff"/);
  assert.match(keyDuotone, /<circle cx="15\.5" cy="8\.75" r="1\.75" fill="currentColor"/);
  assert.match(ellipsisDuotone, /<circle cx="5" cy="12" r="1\.5" fill="#8ea8ff"/);
  assert.match(ellipsisDuotone, /<circle cx="12" cy="12" r="1\.5" fill="currentColor"/);

  for (const [iconName, catalogEntry] of Object.entries(iconCatalog)) {
    for (const variant of catalogEntry.variants) {
      const classicMarkup = await renderIcon(VueIconify, { icon: iconName, variant, size: 24 });
      assert.match(classicMarkup, /<svg/);

      if (catalogEntry.brand) {
        continue;
      }

      const duotoneMarkup = await renderIcon(VueIconify, {
        icon: iconName,
        family: 'duotone',
        variant,
        size: 24,
        secondaryColor: '#8ea8ff',
        secondaryOpacity: 0.65,
      });
      assert.match(duotoneMarkup, /vf-icon--duotone/);
      assert.doesNotMatch(duotoneMarkup, /scale\(0\.86\)/);

      if (variant !== 'solid' || !solidSingleToneIconNames.has(iconName)) {
        assert.match(duotoneMarkup, /#8ea8ff/, `${iconName}/duotone/${variant} must include secondary paint`);
      }
    }
  }
} finally {
  rmSync(consumerRoot, { recursive: true, force: true });
}
