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

  const databaseSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.database,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(databaseSolidDuotone, /<clipPath id="vf-duotone-database-separators-[^"]+">/);
  assert.match(databaseSolidDuotone, /<g color="#8ea8ff" opacity="0\.65">/);
  assert.match(
    databaseSolidDuotone,
    /stroke-width="1\.4" stroke-linecap="butt" clip-path="url\(#vf-duotone-database-separators-[^)]+\)"/,
  );

  const keySolidDuotone = await renderIcon(VueIconify, {
    icon: icons.key,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(keySolidDuotone, /<clipPath id="vf-duotone-key-half-[^"]+">/);
  assert.match(keySolidDuotone, /d="M0 23\.842 24 0\.474V24H0Z"/);
  assert.match(keySolidDuotone, /<g color="#8ea8ff" opacity="0\.65">/);
  assert.match(keySolidDuotone, /clip-path="url\(#vf-duotone-key-half-[^)]+\)"/);
  assert.equal((keySolidDuotone.match(/<mask id="vf-solid-key-[^"]+">/g) ?? []).length, 2);
  assert.doesNotMatch(keySolidDuotone, /<circle cx="15\.5" cy="8\.75" r="8"/);

  const phoneSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.phone,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(phoneSolidDuotone, /<clipPath id="vf-duotone-phone-half-[^"]+">/);
  assert.match(phoneSolidDuotone, /d="M0 24 24 0v24Z"/);
  assert.match(phoneSolidDuotone, /<g color="#8ea8ff" opacity="0\.65">/);
  assert.match(phoneSolidDuotone, /clip-path="url\(#vf-duotone-phone-half-[^)]+\)"/);
  assert.equal((phoneSolidDuotone.match(/d="M6\.25 3\.5 9\.5 7\.65/g) ?? []).length, 2);

  const receiptSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.receipt,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(receiptSolidDuotone, /<g color="#8ea8ff" opacity="0\.65">/);
  assert.match(
    receiptSolidDuotone,
    /d="M8 9h8M8 13h8M8 17h5\.5" fill="none" stroke="currentColor" stroke-width="1\.5" stroke-linecap="round"/,
  );

  const starSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.star,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(starSolidDuotone, /<clipPath id="vf-duotone-star-half-[^"]+">/);
  assert.match(starSolidDuotone, /<rect x="12" y="0" width="12" height="24"><\/rect>/);
  assert.match(starSolidDuotone, /<g color="#8ea8ff" opacity="0\.65">/);
  assert.match(starSolidDuotone, /clip-path="url\(#vf-duotone-star-half-[^)]+\)"/);
  assert.equal((starSolidDuotone.match(/d="M12 2\.5l2\.95 5\.98/g) ?? []).length, 2);

  const activitySolidDuotone = await renderIcon(VueIconify, {
    icon: icons.activity,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(activitySolidDuotone, /<clipPath id="vf-duotone-activity-half-[^"]+">/);
  assert.match(activitySolidDuotone, /<rect x="12" y="0" width="12" height="24"><\/rect>/);
  assert.match(activitySolidDuotone, /<g color="#8ea8ff" opacity="0\.65">/);
  assert.match(activitySolidDuotone, /clip-path="url\(#vf-duotone-activity-half-[^)]+\)"/);
  assert.equal((activitySolidDuotone.match(/d="M2\.5 12h4L9 6l4 12 3-7h5\.5/g) ?? []).length, 2);

  const circleNotchSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.circleNotch,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(circleNotchSolidDuotone, /<clipPath id="vf-duotone-circle-notch-half-[^"]+">/);
  assert.match(circleNotchSolidDuotone, /<rect x="12" y="0" width="12" height="24"><\/rect>/);
  assert.match(circleNotchSolidDuotone, /<g color="#8ea8ff" opacity="0\.65">/);
  assert.match(circleNotchSolidDuotone, /clip-path="url\(#vf-duotone-circle-notch-half-[^)]+\)"/);
  assert.equal((circleNotchSolidDuotone.match(/d="M8\.56 3\.68A9 9 0 1 0 15\.44 3\.68/g) ?? []).length, 2);

  const moonSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.moon,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(
    moonSolidDuotone,
    /<clipPath id="vf-duotone-moon-diagonal-[^"]+"><path d="M0 24 24 0v24Z"><\/path><\/clipPath>/,
  );
  assert.match(moonSolidDuotone, /<g color="#8ea8ff" opacity="0\.65">/);
  assert.match(moonSolidDuotone, /clip-path="url\(#vf-duotone-moon-diagonal-[^)]+\)"/);
  assert.equal((moonSolidDuotone.match(/d="M20 15\.25A8\.5 8\.5 0 1 1 10 3\.5/g) ?? []).length, 2);

  const shieldSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.shield,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(shieldSolidDuotone, /<clipPath id="vf-duotone-shield-half-[^"]+">/);
  assert.match(shieldSolidDuotone, /<rect x="12" y="0" width="12" height="24"><\/rect>/);
  assert.match(shieldSolidDuotone, /<g color="#8ea8ff" opacity="0\.65">/);
  assert.match(shieldSolidDuotone, /clip-path="url\(#vf-duotone-shield-half-[^)]+\)"/);
  assert.equal((shieldSolidDuotone.match(/d="M12 2 21 5\.65v6\.1c0 5\.6-3\.5 9\.4-9 11\.2/g) ?? []).length, 2);

  const cloudSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.cloud,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(cloudSolidDuotone, /<clipPath id="vf-duotone-cloud-half-[^"]+">/);
  assert.match(cloudSolidDuotone, /<rect x="0" y="14" width="24" height="10"><\/rect>/);
  assert.match(cloudSolidDuotone, /<g color="#8ea8ff" opacity="0\.65">/);
  assert.match(cloudSolidDuotone, /clip-path="url\(#vf-duotone-cloud-half-[^)]+\)"/);
  assert.equal((cloudSolidDuotone.match(/d="M6\.25 21a5\.25 5\.25 0 0 1-.4-10\.48/g) ?? []).length, 2);

  const mailSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.mail,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(mailSolidDuotone, /<clipPath id="vf-duotone-mail-body-[^"]+">/);
  assert.match(mailSolidDuotone, /<rect x="1" y="4" width="22" height="16" rx="2\.5"><\/rect>/);
  assert.match(mailSolidDuotone, /fill="#8ea8ff" opacity="0\.65"/);
  assert.match(mailSolidDuotone, /d="M1 4h22v2\.2h-2\.2l-7\.4 6\.15a2\.2 2\.2 0 0 1-2\.8 0L3\.2 6\.2H1Z"/);
  assert.doesNotMatch(mailSolidDuotone, /fill-rule="evenodd"/);

  const messageSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.message,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(messageSolidDuotone, /transform="translate\(1 1\) scale\(\.9167\)"/);
  assert.match(messageSolidDuotone, /fill="#8ea8ff" opacity="0\.65"/);
  assert.match(messageSolidDuotone, /d="M6 8h12M6 13h8" fill="none" stroke="currentColor" stroke-width="2"/);
  assert.doesNotMatch(messageSolidDuotone, /vf-solid-message/);

  const solidDuotoneCaretSplits = {
    caretDown: { path: 'm7.25 9.25 4.75 5.5 4.75-5.5Z', rect: '<rect x="12" y="0" width="12" height="24"></rect>' },
    caretLeft: { path: 'm14.75 7.25-5.5 4.75 5.5 4.75Z', rect: '<rect x="0" y="12" width="24" height="12"></rect>' },
    caretRight: { path: 'm9.25 7.25 5.5 4.75-5.5 4.75Z', rect: '<rect x="0" y="12" width="24" height="12"></rect>' },
    caretUp: { path: 'm7.25 14.75 4.75-5.5 4.75 5.5Z', rect: '<rect x="12" y="0" width="12" height="24"></rect>' },
  };

  for (const [iconName, { path, rect }] of Object.entries(solidDuotoneCaretSplits)) {
    const caretSolidDuotone = await renderIcon(VueIconify, {
      icon: icons[iconName],
      family: 'duotone',
      variant: 'solid',
      secondaryColor: '#8ea8ff',
      secondaryOpacity: 0.65,
    });

    assert.match(caretSolidDuotone, /fill="#8ea8ff" opacity="0\.65"/);
    assert.match(caretSolidDuotone, new RegExp(`<clipPath id="vf-duotone-${iconName}-half-[^"]+">`));
    assert.ok(caretSolidDuotone.includes(rect));
    assert.match(caretSolidDuotone, new RegExp(`clip-path="url\\(#vf-duotone-${iconName}-half-[^)]+\\)"`));
    assert.equal((caretSolidDuotone.match(new RegExp(`d="${path}"`, 'g')) ?? []).length, 2);
  }

  const solidDuotoneChevronPrimaryPaths = {
    chevronDown: 'M12 12.5v4.6l7.65-7.65-2.3-2.3Z',
    chevronLeft: 'M11.5 12H6.9l7.65 7.65 2.3-2.3Z',
    chevronRight: 'M12.5 12h4.6L9.45 4.35l-2.3 2.3Z',
    chevronUp: 'M12 11.5V6.9l-7.65 7.65 2.3 2.3Z',
  };

  for (const [iconName, primaryPath] of Object.entries(solidDuotoneChevronPrimaryPaths)) {
    const chevronSolidDuotone = await renderIcon(VueIconify, {
      icon: icons[iconName],
      family: 'duotone',
      variant: 'solid',
      secondaryColor: '#8ea8ff',
      secondaryOpacity: 0.65,
    });

    assert.match(chevronSolidDuotone, /fill="#8ea8ff" opacity="0\.65"/);
    assert.match(chevronSolidDuotone, new RegExp(`d="${primaryPath}" fill="currentColor"`));
  }

  const minusSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.minus,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(minusSolidDuotone, /<clipPath id="vf-duotone-minus-half-[^"]+">/);
  assert.match(minusSolidDuotone, /<rect x="12" y="0" width="12" height="24"><\/rect>/);
  assert.match(minusSolidDuotone, /d="M3 10\.25h18v3\.5H3Z" fill="#8ea8ff" opacity="0\.65"/);
  assert.match(minusSolidDuotone, /clip-path="url\(#vf-duotone-minus-half-[^)]+\)"/);
  assert.equal((minusSolidDuotone.match(/d="M3 10\.25h18v3\.5H3Z"/g) ?? []).length, 2);

  const checkSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.check,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(
    checkSolidDuotone,
    /d="m2\.7 12\.15 2\.55-2\.5 4\.15 4\.1 9\.35-9\.3 2\.55 2\.5L9\.4 18\.8Z" fill="#8ea8ff" opacity="0\.65"/,
  );
  assert.match(checkSolidDuotone, /d="M9\.4 13\.75 18\.75 4\.45l2\.55 2\.5L9\.4 18\.8Z" fill="currentColor"/);

  const filterSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.filter,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(filterSolidDuotone, /d="M3 3\.5h18l-7 8V20l-4-2v-6\.5Z" fill="#8ea8ff" opacity="0\.65"/);
  assert.match(filterSolidDuotone, /d="M10 11\.5h4V20l-4-2Z" fill="currentColor" stroke="currentColor"/);
  assert.match(filterSolidDuotone, /stroke-width="0\.5" stroke-linejoin="round"/);

  const plusSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.plus,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(plusSolidDuotone, /d="M3 10\.25h18v3\.5H3Z" fill="#8ea8ff" opacity="0\.65"/);
  assert.match(plusSolidDuotone, /d="M10\.25 3h3\.5v18h-3\.5Z" fill="currentColor"/);
  assert.doesNotMatch(plusSolidDuotone, /vf-duotone-plus-half/);

  const sendSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.send,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(
    sendSolidDuotone,
    /<clipPath id="vf-duotone-send-facet-[^"]+"><path d="M11\.25 13\.25 24-0\.1375V24H0Z"><\/path><\/clipPath>/,
  );
  assert.match(sendSolidDuotone, /<mask id="vf-duotone-send-silhouette-[^"]+">/);
  assert.match(sendSolidDuotone, /fill="#8ea8ff" opacity="0\.65" mask="url\(#vf-duotone-send-silhouette-[^)]+\)"/);
  assert.match(sendSolidDuotone, /clip-path="url\(#vf-duotone-send-facet-[^)]+\)"/);
  assert.doesNotMatch(sendSolidDuotone, /m11\.25 13\.25 5-5\.25/);

  const sendSolidClassic = await renderIcon(VueIconify, {
    icon: icons.send,
    family: 'classic',
    variant: 'solid',
  });

  assert.match(sendSolidClassic, /m11\.25 13\.25 5-5\.25/);

  const xmarkSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.xmark,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(xmarkSolidDuotone, /d="M6\.2 3\.8 20\.2 17\.8 17\.8 20\.2 3\.8 6\.2Z" fill="#8ea8ff" opacity="0\.65"/);
  assert.match(xmarkSolidDuotone, /d="M17\.8 3\.8 20\.2 6\.2 6\.2 20\.2 3\.8 17\.8Z" fill="currentColor"/);
  assert.doesNotMatch(xmarkSolidDuotone, /d="M12 9\.6 14\.4 12 12 14\.4 9\.6 12Z"/);

  const bookmarkSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.bookmark,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(
    bookmarkSolidDuotone,
    /d="M7 3h10a2 2 0 0 1 2 2v16l-7-4\.5L5 21V5a2 2 0 0 1 2-2Z" fill="#8ea8ff" opacity="0\.65"/,
  );
  assert.match(bookmarkSolidDuotone, /<clipPath id="vf-duotone-bookmark-half-[^"]+">/);
  assert.match(bookmarkSolidDuotone, /<rect x="12" y="0" width="12" height="24"><\/rect>/);
  assert.match(bookmarkSolidDuotone, /clip-path="url\(#vf-duotone-bookmark-half-[^)]+\)"/);
  assert.equal(
    (bookmarkSolidDuotone.match(/d="M7 3h10a2 2 0 0 1 2 2v16l-7-4\.5L5 21V5a2 2 0 0 1 2-2Z"/g) ?? []).length,
    2,
  );

  const gearSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.gear,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(gearSolidDuotone, /<mask id="vf-duotone-gear-ring-[^"]+">/);
  assert.match(gearSolidDuotone, /<circle cx="12" cy="12" r="6" fill="white"><\/circle>/);
  assert.match(gearSolidDuotone, /<circle cx="12" cy="12" r="3" fill="black"><\/circle>/);
  assert.match(gearSolidDuotone, /<g color="#8ea8ff" opacity="0\.65">/);
  assert.match(gearSolidDuotone, /fill="currentColor" mask="url\(#vf-duotone-gear-ring-[^)]+\)"/);

  const globeSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.globe,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(globeSolidDuotone, /<clipPath id="vf-duotone-globe-center-[^"]+">/);
  assert.match(
    globeSolidDuotone,
    /d="M12 2c-3\.35 2\.8-5 6\.15-5 10s1\.65 7\.2 5 10c3\.35-2\.8 5-6\.15 5-10S15\.35 4\.8 12 2Z"/,
  );
  assert.match(globeSolidDuotone, /<g color="#8ea8ff" opacity="0\.65">/);
  assert.match(globeSolidDuotone, /clip-path="url\(#vf-duotone-globe-center-[^)]+\)"/);
  assert.equal((globeSolidDuotone.match(/<mask id="vf-solid-globe-[^"]+">/g) ?? []).length, 2);

  const heartSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.heart,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(heartSolidDuotone, /<g color="#8ea8ff" opacity="0\.65">/);
  assert.match(
    heartSolidDuotone,
    /d="M12 21 4\.1 13\.7C-\.2 9\.8 2\.2 3\.25 7 3\.25c2\.2 0 3\.9 1\.15 5 3 1\.1-1\.85 2\.8-3 5-3 4\.8 0 7\.2 6\.55 2\.9 10\.45Z"/,
  );
  assert.match(heartSolidDuotone, /<clipPath id="vf-duotone-heart-half-[^"]+">/);
  assert.match(heartSolidDuotone, /<rect x="12" y="0" width="12" height="24"><\/rect>/);
  assert.match(heartSolidDuotone, /clip-path="url\(#vf-duotone-heart-half-[^)]+\)"/);
  assert.equal(
    (heartSolidDuotone.match(/d="M12 21 4\.1 13\.7C-\.2 9\.8 2\.2 3\.25 7 3\.25c2\.2 0 3\.9 1\.15 5 3/g) ?? []).length,
    2,
  );

  const houseSolidDuotone = await renderIcon(VueIconify, {
    icon: icons.house,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#8ea8ff',
    secondaryOpacity: 0.65,
  });

  assert.match(houseSolidDuotone, /<mask id="vf-duotone-house-body-[^"]+">/);
  assert.match(houseSolidDuotone, /<rect x="5\.5" y="12\.37" width="13" height="8\.63" fill="white"><\/rect>/);
  assert.match(houseSolidDuotone, /<rect x="9\.5" y="15" width="5" height="6" rx="0\.75" fill="black"><\/rect>/);
  assert.match(houseSolidDuotone, /<g color="#8ea8ff" opacity="0\.65">/);
  assert.match(houseSolidDuotone, /fill="currentColor" mask="url\(#vf-duotone-house-body-[^)]+\)"/);

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

      assert.match(duotoneMarkup, /#8ea8ff/, `${iconName}/duotone/${variant} must include secondary paint`);
    }
  }
} finally {
  rmSync(consumerRoot, { recursive: true, force: true });
}
