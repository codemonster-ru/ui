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
    iconFamilies,
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

  const duotoneMarkup = await renderIcon(VueIconify, {
    icon: icons.house,
    family: 'duotone',
    variant: 'regular',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 1,
  });
  const duotoneSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.arrowDown,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneTurnArrowMarkup = await renderIcon(VueIconify, {
    icon: icons.arrowTurnUpRight,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneBarsMarkup = await renderIcon(VueIconify, {
    icon: icons.bars,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneCaretSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.caretLeft,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 0.6,
  });
  const duotoneChevronSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.chevronDown,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 0.6,
  });
  const duotoneCheckSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.check,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 0.6,
  });
  const duotoneFilterSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.filter,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 0.6,
  });
  const duotoneMinusSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.minus,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 0.6,
  });
  const duotonePlusSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.plus,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 0.6,
  });
  const duotoneSendSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.send,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 0.6,
  });
  const duotoneXmarkSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.xmark,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 0.6,
  });
  const duotoneBookmarkSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.bookmark,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 0.6,
  });
  const duotoneBuildingSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.building,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 0.6,
  });
  const duotoneCloudSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.cloud,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 0.6,
  });
  const duotoneDatabaseSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.database,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 0.6,
  });
  const duotoneGearSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.gear,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 0.6,
  });
  const duotoneGlobeSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.globe,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 0.6,
  });
  const duotoneHeartSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.heart,
    family: 'duotone',
    variant: 'solid',
    secondaryColor: '#94a3b8',
    secondaryOpacity: 0.6,
  });
  const duotoneCalendarSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.calendar,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneChartBarSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.chartBar,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneCodeSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.code,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneCpuSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.cpu,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneCreditCardSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.creditCard,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneInboxSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.inbox,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneKeySolidMarkup = await renderIcon(VueIconify, {
    icon: icons.key,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneLayersSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.layers,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneMagnifyingGlassSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.magnifyingGlass,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneMailSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.mail,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneMessageSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.message,
    family: 'duotone',
    variant: 'solid',
  });
  const duotonePhoneSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.phone,
    family: 'duotone',
    variant: 'solid',
  });
  const duotonePlugSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.plug,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneReceiptSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.receipt,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneServerSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.server,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneStarSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.star,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneTerminalSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.terminal,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneUserCheckSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.userCheck,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneUserMinusSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.userMinus,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneUserPlusSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.userPlus,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneUsersSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.users,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneWalletSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.wallet,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneActivitySolidMarkup = await renderIcon(VueIconify, {
    icon: icons.activity,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneAlertCircleSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.alertCircle,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneBanSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.ban,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneCheckCircleSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.checkCircle,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneCircleHalfSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.circleHalf,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneCircleNotchSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.circleNotch,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneClockSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.clock,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneEyeSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.eye,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneHistorySolidMarkup = await renderIcon(VueIconify, {
    icon: icons.history,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneInfoCircleSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.infoCircle,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneMoonSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.moon,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneQuestionSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.question,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneQuestionCircleSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.questionCircle,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneShieldSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.shield,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneSparklesSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.sparkles,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneSunSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.sun,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneWarningSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.warning,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneXCircleSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.xCircle,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneCollapseSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.collapse,
    family: 'duotone',
    variant: 'solid',
  });
  const classicCollapseSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.collapse,
    family: 'classic',
    variant: 'solid',
  });
  const duotoneExpandSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.expand,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneColumnsSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.columns,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneGridSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.grid,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneArchiveSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.archive,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneBellSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.bell,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneBriefcaseSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.briefcase,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneClipboardSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.clipboard,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneCopySolidMarkup = await renderIcon(VueIconify, {
    icon: icons.copy,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneDownloadSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.download,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneEllipsisSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.ellipsis,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneExternalLinkSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.externalLink,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneFileSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.file,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneFileTextSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.fileText,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneFolderSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.folder,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneFolderOpenSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.folderOpen,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneHardDriveSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.hardDrive,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneFunnelXSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.funnelX,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneLinkSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.link,
    family: 'duotone',
    variant: 'solid',
  });
  const duotonePencilSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.pencil,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneSortSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.sort,
    family: 'duotone',
    variant: 'solid',
  });
  const duotoneUploadSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.upload,
    family: 'duotone',
    variant: 'solid',
  });

  const outlineDuotoneFillIconNames = [
    'arrowUp',
    'arrowUpLong',
    'arrowDown',
    'arrowDownLong',
    'arrowLeft',
    'arrowLeftLong',
    'arrowRight',
    'arrowRightLong',
    'arrowTurnUpLeft',
    'arrowTurnUpRight',
    'arrowTurnLeftDown',
    'arrowTurnRightUp',
    'caretDown',
    'caretLeft',
    'caretRight',
    'caretUp',
    'chevronDown',
    'chevronLeft',
    'chevronRight',
    'chevronUp',
    'check',
    'download',
    'bars',
    'ellipsis',
    'link',
    'logIn',
    'logOut',
    'minus',
    'plus',
    'refresh',
    'rotateRight',
    'upload',
    'xmark',
    'code',
    'terminal',
    'activity',
    'circleNotch',
    'history',
    'info',
    'question',
    'columns',
    'grid',
    'collapse',
    'expand',
    'clipboard',
    'copy',
    'externalLink',
    'filter',
    'funnelX',
    'pencil',
    'send',
    'sort',
    'trash',
    'archive',
    'bell',
    'bookmark',
    'briefcase',
    'building',
    'calendar',
    'cloud',
    'cpu',
    'creditCard',
    'file',
    'folderOpen',
    'gear',
    'globe',
    'hardDrive',
    'house',
    'inbox',
    'key',
    'lock',
    'magnifyingGlass',
    'mail',
    'message',
    'plug',
    'receipt',
    'server',
    'share',
    'unlock',
    'user',
    'userCheck',
    'userMinus',
    'userPlus',
    'users',
    'wallet',
    'alertCircle',
    'ban',
    'checkCircle',
    'circleHalf',
    'clock',
    'eye',
    'eyeSlash',
    'infoCircle',
    'moon',
    'questionCircle',
    'shield',
    'sparkles',
    'sun',
    'warning',
    'xCircle',
  ];
  const outlineDuotoneFillIconNameSet = new Set(outlineDuotoneFillIconNames);
  const outlineDuotoneFillMarkups = await Promise.all(
    outlineDuotoneFillIconNames.flatMap((iconName) =>
      outlineIconVariants.map(async (variant) => ({
        iconName,
        variant,
        markup: await renderIcon(VueIconify, {
          icon: icons[iconName],
          family: 'duotone',
          variant,
          secondaryColor: '#94a3b8',
          secondaryOpacity: 0.65,
        }),
      })),
    ),
  );

  const classicHouseSvg = (
    await renderIcon(VueIconify, {
      icon: icons.house,
      family: 'classic',
      variant: 'regular',
      secondaryColor: '#94a3b8',
      secondaryOpacity: 1,
    })
  ).match(/<svg[\s\S]*<\/svg>/)?.[0];
  const duotoneHouseSvg = duotoneMarkup.match(/<svg[\s\S]*<\/svg>/)?.[0];
  const duotoneHouseSolidMarkup = await renderIcon(VueIconify, {
    icon: icons.house,
    family: 'duotone',
    variant: 'solid',
  });

  assert.notEqual(
    duotoneHouseSvg?.replace('vf-icon--duotone', 'vf-icon--family'),
    classicHouseSvg?.replace('vf-icon--classic', 'vf-icon--family'),
  );
  assert.match(duotoneMarkup, /<g opacity="1" stroke="none"><path[^>]*fill="#94a3b8"/);
  assert.doesNotMatch(classicHouseSvg ?? '', /<g opacity="1" stroke="none">/);
  const solidStrokeDuotoneStrokeWidths = { regular: 2, light: 1.5, thin: 1 };
  const solidStrokeDuotoneInnerStrokeWidths = { regular: 1.25, light: 1.75, thin: 2.25 };
  const solidDuotoneBorderStrokeWidths = { regular: 2.5, light: 1.75, thin: 1 };
  const solidDuotonePaths = {
    arrowUp: 'M5.5 11.5 12 4.5l6.5 7h-4.75v8h-3.5v-8Z',
    arrowUpLong: 'M4.75 9.75 12 1.5l7.25 8.25h-5.5V22.5h-3.5V9.75Z',
    arrowDown: 'M5.5 12.5 12 19.5l6.5-7h-4.75v-8h-3.5v8Z',
    arrowDownLong: 'M4.75 14.25 12 22.5l7.25-8.25h-5.5V1.5h-3.5v12.75Z',
    arrowLeft: 'M11.5 5.5 4.5 12l7 6.5v-4.75h8v-3.5h-8Z',
    arrowLeftLong: 'M9.75 4.75 1.5 12l8.25 7.25v-5.5H22.5v-3.5H9.75Z',
    arrowRight: 'M12.5 5.5 19.5 12l-7 6.5v-4.75h-8v-3.5h8Z',
    arrowRightLong: 'M14.25 4.75 22.5 12l-8.25 7.25v-5.5H1.5v-3.5h12.75Z',
    arrowTurnUpLeft:
      'M9.25 10.5V5.25L2.5 12l6.75 6.75V13.5H16A5.5 5.5 0 0 0 21.5 8V6.75a1.5 1.5 0 0 0-3 0V8a2.5 2.5 0 0 1-2.5 2.5Z',
    arrowTurnUpRight:
      'M14.75 10.5V5.25L21.5 12l-6.75 6.75V13.5H8A5.5 5.5 0 0 1 2.5 8V6.75a1.5 1.5 0 0 1 3 0V8A2.5 2.5 0 0 0 8 10.5Z',
    arrowTurnLeftDown:
      'M10.5 14.75H5.25L12 21.5l6.75-6.75H13.5V8A5.5 5.5 0 0 0 8 2.5H6.75a1.5 1.5 0 0 0 0 3H8A2.5 2.5 0 0 1 10.5 8Z',
    arrowTurnRightUp:
      'M10.5 9.25H5.25L12 2.5l6.75 6.75H13.5V16A5.5 5.5 0 0 1 8 21.5H6.75a1.5 1.5 0 0 1 0-3H8a2.5 2.5 0 0 0 2.5-2.5Z',
    caretDown: 'm7.25 9.25 4.75 5.5 4.75-5.5Z',
    caretLeft: 'm14.75 7.25-5.5 4.75 5.5 4.75Z',
    caretRight: 'm9.25 7.25 5.5 4.75-5.5 4.75Z',
    caretUp: 'm7.25 14.75 4.75-5.5 4.75 5.5Z',
    chevronDown: 'm6.65 7.15-2.3 2.3L12 17.1l7.65-7.65-2.3-2.3L12 12.5Z',
    chevronLeft: 'm16.85 6.65-2.3-2.3L6.9 12l7.65 7.65 2.3-2.3L11.5 12Z',
    chevronRight: 'm7.15 6.65 2.3-2.3L17.1 12l-7.65 7.65-2.3-2.3L12.5 12Z',
    chevronUp: 'm6.65 16.85-2.3-2.3L12 6.9l7.65 7.65-2.3 2.3L12 11.5Z',
    check: 'm2.7 12.15 2.55-2.5 4.15 4.1 9.35-9.3 2.55 2.5L9.4 18.8Z',
    download: 'M10.25 2h3.5v9.75l3.4-3.4 2.5 2.5L12 17.25l-7.65-6.4 2.5-2.5 3.4 3.4ZM3 18.25h18v3H3Z',
    bars: 'M4 4.5h16a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 0 1 0-3ZM4 10.5h16a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 0 1 0-3ZM4 16.5h16a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 0 1 0-3Z',
    ellipsis:
      'M5 9.75a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 1 1 0-4.5ZM12 9.75a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 1 1 0-4.5ZM19 9.75a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 1 1 0-4.5Z',
    logIn:
      'M15.5 2H19a3.5 3.5 0 0 1 3.5 3.5v13A3.5 3.5 0 0 1 19 22h-3.5a1.5 1.5 0 0 1 0-3H19a.5.5 0 0 0 .5-.5v-13A.5.5 0 0 0 19 5h-3.5a1.5 1.5 0 0 1 0-3ZM3 10.25h9V7.5l4.5 4.5-4.5 4.5v-2.75H3Z',
    logOut:
      'M8.5 2H5a3.5 3.5 0 0 0-3.5 3.5v13A3.5 3.5 0 0 0 5 22h3.5a1.5 1.5 0 0 0 0-3H5a.5.5 0 0 1-.5-.5v-13A.5.5 0 0 1 5 5h3.5a1.5 1.5 0 0 0 0-3ZM7.5 10.25h9V7.5L21 12l-4.5 4.5v-2.75h-9Z',
    minus: 'M3 10.25h18v3.5H3Z',
    plus: 'M10.25 3h3.5v7.25H21v3.5h-7.25V21h-3.5v-7.25H3v-3.5h7.25Z',
    upload: 'M10.25 17.25h3.5v-8.5l3.4 3.4 2.5-2.5L12 2 4.35 9.65l2.5 2.5 3.4-3.4ZM3 18.25h18v3H3Z',
    xmark: 'm6.2 3.8 5.8 5.8 5.8-5.8 2.4 2.4-5.8 5.8 5.8 5.8-2.4 2.4-5.8-5.8-5.8 5.8-2.4-2.4 5.8-5.8-5.8-5.8Z',
  };
  for (const { iconName, variant, markup } of outlineDuotoneFillMarkups) {
    if (
      iconName === 'refresh' ||
      iconName === 'rotateRight' ||
      iconName === 'history' ||
      iconName === 'info' ||
      iconName === 'question'
    ) {
      const isRotateRight = iconName === 'rotateRight';
      const isHistory = iconName === 'history';
      const isInfo = iconName === 'info';
      const isQuestion = iconName === 'question';
      const outerStrokeWidth = isQuestion ? 3.25 : 3;
      const classicRefreshMarkup = await renderIcon(VueIconify, {
        icon: icons[iconName],
        family: 'classic',
        variant,
      });

      assert.match(markup, new RegExp(`<mask id="vf-duotone-${iconName}-silhouette-[^"]+"`));
      assert.match(markup, new RegExp(`<mask id="vf-duotone-${iconName}-border-[^"]+"`));
      assert.match(markup, new RegExp(`<mask id="vf-duotone-${iconName}-inner-[^"]+"`));
      assert.match(
        markup,
        isRotateRight
          ? /d="M18.36 18.36A9 9 0 1 1 18.36 5.64"/
          : isQuestion
            ? /d="M6.5 7.5a5.5 5.5 0 1 1 8 4.9C12.75 13.35 12 14.5 12 16"/
            : isInfo
              ? /d="M9.25 10.25H12v7M9.25 17.25h5.5"/
              : isHistory
                ? /d="M5.64 18.36A9 9 0 1 0 5.64 5.64"/
                : /d="M3.54 8.92A9 9 0 0 1 18.36 5.64M20.46 15.08A9 9 0 0 1 5.64 18.36"/,
      );
      assert.match(
        markup,
        isRotateRight
          ? /d="M22 9.5 13.5 8l7-6.5Z"/
          : isQuestion
            ? /<circle cx="12" cy="20.5" r="1.75"/
            : isInfo
              ? /<circle cx="12" cy="6.25" r="1.75"/
              : isHistory
                ? /d="M2 9.5 10.5 8l-7-6.5Z"/
                : /d="M22 9.5 13.5 8l7-6.5ZM2 14.5l8.5 1.5-7 6.5Z"/,
      );
      assert.match(
        markup,
        new RegExp(
          `stroke="black" stroke-width="${
            isRotateRight || isHistory || isInfo || isQuestion
              ? outerStrokeWidth - solidDuotoneBorderStrokeWidths[variant]
              : solidStrokeDuotoneInnerStrokeWidths[variant]
          }"`,
        ),
      );
      assert.match(
        markup,
        new RegExp(`mask="url\\(#vf-duotone-${iconName}-silhouette-[^)]+\\)"><rect[^>]*fill="currentColor"`),
      );
      assert.match(
        markup,
        new RegExp(`fill="#94a3b8" opacity="0.65" stroke="none" mask="url\\(#vf-duotone-${iconName}-inner-`),
      );
      assert.match(
        classicRefreshMarkup,
        isRotateRight
          ? /d="M18.36 18.36A9 9 0 1 1 18.36 5.64L21 8.5"/
          : isQuestion
            ? /d="M7 8a5 5 0 1 1 7.35 4.42C12.8 13.25 12 14.25 12 16"/
            : isInfo
              ? /d="M9.25 10.25H12v7M9.25 17.25h5.5"/
              : isHistory
                ? /d="M3.6 8.25A9 9 0 1 1 3.75 16"/
                : /d="M3.54 8.92A9 9 0 0 1 18.36 5.64L21 8.5"/,
      );
      assert.doesNotMatch(classicRefreshMarkup, new RegExp(`vf-duotone-${iconName}-`));
      continue;
    }

    if (iconName in solidDuotonePaths) {
      const classicSolidDuotoneMarkup = await renderIcon(VueIconify, {
        icon: icons[iconName],
        family: 'classic',
        variant,
      });

      assert.match(
        markup,
        new RegExp(`d="${solidDuotonePaths[iconName]}" fill="#94a3b8" fill-opacity="0.65" stroke="none"`),
      );
      assert.match(markup, new RegExp(`<clipPath id="vf-duotone-${iconName}-[^"]+">`));
      assert.match(
        markup,
        new RegExp(
          `<g clip-path="url\\(#vf-duotone-${iconName}-[^)]+\\)"><path[^>]*stroke="currentColor" stroke-width="${solidDuotoneBorderStrokeWidths[variant]}"`,
        ),
      );
      assert.match(
        classicSolidDuotoneMarkup,
        iconName === 'arrowUp'
          ? /<line x1="12" y1="19" x2="12" y2="5"><\/line>/
          : iconName === 'arrowUpLong'
            ? /<line x1="12" y1="21.5" x2="12" y2="2.5"><\/line>/
            : iconName === 'arrowDown'
              ? /<line x1="12" y1="5" x2="12" y2="19"><\/line>/
              : iconName === 'arrowDownLong'
                ? /<line x1="12" y1="2.5" x2="12" y2="21.5"><\/line>/
                : iconName === 'arrowLeft'
                  ? /<line x1="19" y1="12" x2="5" y2="12"><\/line>/
                  : iconName === 'arrowLeftLong'
                    ? /<line x1="21.5" y1="12" x2="2.5" y2="12"><\/line>/
                    : iconName === 'arrowRight'
                      ? /<line x1="5" y1="12" x2="19" y2="12"><\/line>/
                      : iconName === 'arrowRightLong'
                        ? /<line x1="2.5" y1="12" x2="21.5" y2="12"><\/line>/
                        : iconName === 'arrowTurnUpLeft'
                          ? /d="M20.5 6.25V8a4 4 0 0 1-4 4h-13"/
                          : iconName === 'arrowTurnUpRight'
                            ? /d="M3.5 6.25V8a4 4 0 0 0 4 4h13"/
                            : iconName === 'arrowTurnLeftDown'
                              ? /d="M6.25 3.5H8a4 4 0 0 1 4 4v13"/
                              : iconName === 'arrowTurnRightUp'
                                ? /d="M6.25 20.5H8a4 4 0 0 0 4-4v-13"/
                                : iconName === 'caretDown'
                                  ? /<polyline points="8.25 10 12 13.75 15.75 10"><\/polyline>/
                                  : iconName === 'caretLeft'
                                    ? /<polyline points="14 8.25 10.25 12 14 15.75"><\/polyline>/
                                    : iconName === 'caretRight'
                                      ? /<polyline points="10 8.25 13.75 12 10 15.75"><\/polyline>/
                                      : iconName === 'caretUp'
                                        ? /<polyline points="8.25 14 12 10.25 15.75 14"><\/polyline>/
                                        : iconName === 'chevronDown'
                                          ? /<polyline points="5.75 8.75 12 15 18.25 8.75"><\/polyline>/
                                          : iconName === 'chevronLeft'
                                            ? /<polyline points="15.25 5.75 9 12 15.25 18.25"><\/polyline>/
                                            : iconName === 'chevronRight'
                                              ? /<polyline points="8.75 5.75 15 12 8.75 18.25"><\/polyline>/
                                              : iconName === 'chevronUp'
                                                ? /<polyline points="5.75 15.25 12 9 18.25 15.25"><\/polyline>/
                                                : iconName === 'check'
                                                  ? /<polyline points="3.75 12.25 9.25 17.5 20.25 6.5"><\/polyline>/
                                                  : iconName === 'download'
                                                    ? /<line x1="12" y1="3" x2="12" y2="15"><\/line>/
                                                    : iconName === 'bars'
                                                      ? /<line x1="3.25" y1="6" x2="20.75" y2="6"><\/line>/
                                                      : iconName === 'ellipsis'
                                                        ? /<circle cx="5" cy="12" r="1"><\/circle>/
                                                        : iconName === 'logIn'
                                                          ? /d="M15.5 3.5H19a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-3.5"/
                                                          : iconName === 'logOut'
                                                            ? /d="M8.5 3.5H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h3.5"/
                                                            : iconName === 'minus'
                                                              ? /<line x1="4.75" y1="12" x2="19.25" y2="12"><\/line>/
                                                              : iconName === 'plus'
                                                                ? /<line x1="12" y1="4.75" x2="12" y2="19.25"><\/line>/
                                                                : iconName === 'upload'
                                                                  ? /<line x1="12" y1="15.25" x2="12" y2="3.25"><\/line>/
                                                                  : /<line x1="5.75" y1="5.75" x2="18.25" y2="18.25"><\/line>/,
      );
      assert.doesNotMatch(classicSolidDuotoneMarkup, /vf-duotone-|fill-opacity/);
      continue;
    }

    if (
      iconName === 'collapse' ||
      iconName === 'expand' ||
      iconName === 'link' ||
      iconName === 'code' ||
      iconName === 'terminal' ||
      iconName === 'activity' ||
      iconName === 'circleNotch'
    ) {
      const solidStrokeDuotoneOuterStrokeWidth = iconName === 'code' ? 2.75 : iconName === 'circleNotch' ? 3.5 : 3;
      const solidStrokeDuotoneInnerStrokeWidth =
        iconName === 'code' || iconName === 'terminal' || iconName === 'activity' || iconName === 'circleNotch'
          ? solidStrokeDuotoneOuterStrokeWidth - solidDuotoneBorderStrokeWidths[variant]
          : solidStrokeDuotoneInnerStrokeWidths[variant];
      const classicSolidStrokeMarkup = await renderIcon(VueIconify, {
        icon: icons[iconName],
        family: 'classic',
        variant,
      });

      assert.match(
        markup,
        new RegExp(
          `<svg[^>]*stroke="currentColor" stroke-width="${solidStrokeDuotoneStrokeWidths[variant]}"[^>]*>[\\s\\S]*<g opacity="0.65" fill="none">[\\s\\S]*stroke="#94a3b8" stroke-width="${solidStrokeDuotoneOuterStrokeWidth}"`,
        ),
        `${iconName} (${variant}) must use the solid silhouette with a secondary fill`,
      );
      assert.match(
        classicSolidStrokeMarkup,
        iconName === 'collapse'
          ? /<line x1="3" y1="21" x2="9" y2="15"><\/line><polyline points="9 21 9 15 3 15"><\/polyline>/
          : iconName === 'expand'
            ? /<polyline points="15 3 21 3 21 9"><\/polyline><line x1="14" y1="10" x2="21" y2="3"><\/line>/
            : iconName === 'link'
              ? /d="M14.1 11.1c0-2-1.6-3.5-3.8-3.5-1 0-1.8.4-2.5 1.1l-2.4 2.4c-2.2 2.2-2.2 4.4-.2 6 1.3 1.2 3.3 1.3 4.8.2"/
              : iconName === 'code'
                ? /<polyline points="7.75 7.25 3 12 7.75 16.75"><\/polyline>/
                : iconName === 'terminal'
                  ? /<polyline points="3.5 5 10 12 3.5 19"><\/polyline>/
                  : iconName === 'activity'
                    ? /<polyline points="2.5 12 6.5 12 9 6 13 18 16 11 21.5 11"><\/polyline>/
                    : /d="M9.67 3.31A9 9 0 1 0 14.33 3.31"/,
      );
      assert.doesNotMatch(classicSolidStrokeMarkup, new RegExp(`vf-duotone-${iconName}-outline|secondary`));
      assert.match(markup, new RegExp(`<mask id="vf-duotone-${iconName}-outline-[^"]+" maskUnits="userSpaceOnUse"`));
      assert.match(
        markup,
        new RegExp(
          `<g mask="url\\(#vf-duotone-${iconName}-outline-[^)]+\\)">[\\s\\S]*stroke="currentColor" stroke-width="${solidStrokeDuotoneOuterStrokeWidth}"`,
        ),
      );
      assert.match(markup, new RegExp(`stroke="black" stroke-width="${solidStrokeDuotoneInnerStrokeWidth}"`));
      if (iconName === 'circleNotch') {
        assert.match(markup, /d="M8.56 3.68A9 9 0 1 0 15.44 3.68"/);
      }
      continue;
    }

    assert.match(
      markup,
      /<g opacity="0.65" stroke="none">[\s\S]*fill="#94a3b8"/,
      `${iconName} (${variant}) must render an outline duotone fill layer`,
    );
  }
  assert.match(duotoneHouseSolidMarkup, /<g color="var\(--vf-icon-secondary-color, currentColor\)"/);
  assert.match(duotoneHouseSolidMarkup, /<rect x="9.5" y="15" width="5" height="6" rx=".75" fill="black"/);
  assert.doesNotMatch(duotoneHouseSolidMarkup, /vf-duotone-primary-house/);
  assert.match(duotoneSolidMarkup, /<mask id="vf-duotone-primary-arrowDown-/);
  assert.match(duotoneSolidMarkup, /<mask id="vf-duotone-secondary-arrowDown-/);
  assert.match(duotoneSolidMarkup, /mask="url\(#vf-duotone-primary-arrowDown-/);
  assert.match(duotoneSolidMarkup, /<polygon points="5.5 12.5 12 19.5 18.5 12.5" fill="white" stroke="white"/);
  assert.doesNotMatch(duotoneSolidMarkup, /scale\(/);
  assert.match(duotoneTurnArrowMarkup, /stroke="currentColor"/);
  assert.match(duotoneTurnArrowMarkup, /<mask id="vf-duotone-primary-arrowTurnUpRight-/);
  assert.match(duotoneTurnArrowMarkup, /points="14.75 5.25 21.5 12 14.75 18.75"/);
  assert.match(
    duotoneBarsMarkup,
    /<rect x="2.5" y="4.5"[^>]*fill="currentColor"\/><rect x="2.5" y="10.5"[^>]*fill="var\(--vf-icon-secondary-paint, currentColor\)"[^>]*\/><rect x="2.5" y="16.5"[^>]*fill="currentColor"\/>/,
  );
  assert.match(duotoneCaretSolidMarkup, /<g color="#94a3b8" opacity="0.6"><path fill="currentColor"/);
  assert.doesNotMatch(duotoneCaretSolidMarkup, /<mask/);
  assert.match(duotoneChevronSolidMarkup, /<g color="#94a3b8" opacity="0.6"><path fill="currentColor"/);
  assert.doesNotMatch(duotoneChevronSolidMarkup, /<mask/);
  assert.match(duotoneCheckSolidMarkup, /<g color="#94a3b8" opacity="0.6"><path fill="currentColor"/);
  assert.doesNotMatch(duotoneCheckSolidMarkup, /<mask/);
  assert.match(duotoneFilterSolidMarkup, /<g color="#94a3b8" opacity="0.6"><path fill="currentColor"/);
  assert.doesNotMatch(duotoneFilterSolidMarkup, /<mask/);
  assert.match(duotoneMinusSolidMarkup, /<g color="#94a3b8" opacity="0.6"><rect[^>]*fill="currentColor"/);
  assert.doesNotMatch(duotoneMinusSolidMarkup, /<mask/);
  assert.match(duotonePlusSolidMarkup, /<g color="#94a3b8" opacity="0.6"><path fill="currentColor"/);
  assert.doesNotMatch(duotonePlusSolidMarkup, /<mask/);
  assert.match(duotoneSendSolidMarkup, /<g color="#94a3b8" opacity="0.6"><defs><mask id="vf-solid-send-/);
  assert.doesNotMatch(duotoneSendSolidMarkup, /vf-duotone-primary-send/);
  assert.match(duotoneXmarkSolidMarkup, /<g color="#94a3b8" opacity="0.6"><path fill="currentColor"/);
  assert.doesNotMatch(duotoneXmarkSolidMarkup, /<mask/);
  assert.match(duotoneBookmarkSolidMarkup, /<g color="#94a3b8" opacity="0.6"><path fill="currentColor"/);
  assert.doesNotMatch(duotoneBookmarkSolidMarkup, /<mask/);
  assert.match(duotoneBuildingSolidMarkup, /<g color="#94a3b8" opacity="0.6"><defs><mask id="vf-solid-building-/);
  assert.match(
    duotoneBuildingSolidMarkup,
    /<g fill="currentColor"><rect x="8" y="6" width="2.5" height="2.5" rx="0.5"><\/rect>/,
  );
  assert.match(duotoneBuildingSolidMarkup, /<rect x="10.5" y="16.25" width="3" height="5.75" rx="0.5"><\/rect><\/g>/);
  assert.doesNotMatch(duotoneBuildingSolidMarkup, /vf-duotone-primary-building/);
  assert.match(
    duotoneCloudSolidMarkup,
    /<g color="#94a3b8" opacity="0.6"><path transform="translate\(.07 1.32\) scale\(.89\)" fill="currentColor"/,
  );
  assert.doesNotMatch(duotoneCloudSolidMarkup, /<mask/);
  assert.match(
    duotoneDatabaseSolidMarkup,
    /<g color="#94a3b8" opacity="0.6"><g transform="translate\(-1.2 -1.2\) scale\(1.1\)">/,
  );
  assert.match(
    duotoneDatabaseSolidMarkup,
    /<path transform="translate\(-1.2 -1.2\) scale\(1.1\)" d="M4.25 8.5C5.75 10.1 8.5 11 12 11s6.25-.9 7.75-2.5M4.25 13.75c1.5 1.6 4.25 2.5 7.75 2.5s6.25-.9 7.75-2.5" fill="none" stroke="currentColor"/,
  );
  assert.doesNotMatch(duotoneDatabaseSolidMarkup, /vf-duotone-primary-database/);
  assert.match(duotoneGearSolidMarkup, /<g color="#94a3b8" opacity="0.6"><defs><mask id="vf-solid-gear-/);
  assert.match(duotoneGearSolidMarkup, /<circle cx="12" cy="12" r="3" fill="black"/);
  assert.doesNotMatch(duotoneGearSolidMarkup, /<circle cx="12" cy="12" r="3" fill="currentColor"/);
  assert.doesNotMatch(duotoneGearSolidMarkup, /vf-duotone-primary-gear/);
  assert.match(duotoneGlobeSolidMarkup, /<g color="#94a3b8" opacity="0.6"><defs><mask id="vf-solid-globe-/);
  assert.doesNotMatch(duotoneGlobeSolidMarkup, /vf-duotone-primary-globe/);
  assert.match(duotoneHeartSolidMarkup, /<g color="#94a3b8" opacity="0.6"><path fill="currentColor"/);
  assert.doesNotMatch(duotoneHeartSolidMarkup, /<mask/);
  assert.match(duotoneCalendarSolidMarkup, /<mask id="vf-duotone-primary-calendar-/);
  assert.match(
    duotoneCalendarSolidMarkup,
    /transform="translate\(0 -.75\)" x="0" y="0" width="24" height="9" fill="white"/,
  );
  assert.match(
    duotoneCalendarSolidMarkup,
    /<path transform="translate\(0 -.75\)" d="M7 3v3M17 3v3" fill="none" stroke="currentColor"/,
  );
  assert.match(duotoneChartBarSolidMarkup, /<mask id="vf-duotone-primary-chartBar-/);
  assert.match(
    duotoneChartBarSolidMarkup,
    /<rect x="8" y="13" width="3" height="4" fill="white"><\/rect><rect x="13" y="8" width="3" height="9" fill="white"><\/rect><rect x="18" y="4" width="3" height="13" fill="white"><\/rect>/,
  );
  assert.match(duotoneCodeSolidMarkup, /<mask id="vf-duotone-primary-code-/);
  assert.match(duotoneCodeSolidMarkup, /d="M14 3.5l-4 17" fill="none" stroke="white"/);
  assert.match(duotoneCpuSolidMarkup, /<mask id="vf-duotone-primary-cpu-/);
  assert.match(
    duotoneCpuSolidMarkup,
    /<rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="white" stroke-width="2.75"/,
  );
  assert.match(duotoneCreditCardSolidMarkup, /<mask id="vf-duotone-primary-creditCard-/);
  assert.match(duotoneCreditCardSolidMarkup, /<rect x="0" y="0" width="24" height="9.25" fill="white"/);
  assert.match(duotoneInboxSolidMarkup, /<mask id="vf-duotone-primary-inbox-/);
  assert.match(duotoneInboxSolidMarkup, /d="M0 0h24v13.25h-7.5l-1.5 2.5H9l-1.5-2.5H0Z" fill="white"/);
  assert.match(
    duotoneKeySolidMarkup,
    /<path d="M8.75 11.25 12.75 15.5l-2 2H7.5v4H2v-3.75Z" fill="currentColor" stroke="currentColor"[^>]*mask="url\(#vf-solid-key-shaft-/,
  );
  assert.match(
    duotoneKeySolidMarkup,
    /<mask id="vf-solid-key-shaft-[^"]+"><rect width="24" height="24" fill="white"\/><circle cx="15.5" cy="8.75" r="8" fill="black"/,
  );
  assert.match(
    duotoneKeySolidMarkup,
    /<circle cx="15.5" cy="8.75" r="8" fill="var\(--vf-icon-secondary-paint, currentColor\)" fill-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)" mask="url\(#vf-solid-key-head-/,
  );
  assert.doesNotMatch(duotoneKeySolidMarkup, /vf-duotone-primary-key/);
  assert.match(
    duotoneLayersSolidMarkup,
    /d="M3.5 11.75 12 16l8.5-4.25" fill="none" stroke="var\(--vf-icon-secondary-paint, currentColor\)" stroke-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"/,
  );
  assert.match(duotoneLayersSolidMarkup, /d="M3.5 16 12 20.25 20.5 16" fill="none" stroke="currentColor"/);
  assert.match(
    duotoneMagnifyingGlassSolidMarkup,
    /d="m15.5 15.5 5.25 5.25" fill="none" stroke="currentColor"[^>]*mask="url\(#vf-solid-magnifying-glass-handle-/,
  );
  assert.match(
    duotoneMagnifyingGlassSolidMarkup,
    /<circle cx="10.25" cy="10.25" r="7.75" fill="var\(--vf-icon-secondary-paint, currentColor\)" fill-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)" mask="url\(#vf-solid-magnifying-glass-ring-/,
  );
  assert.match(
    duotoneMailSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><path fill="currentColor"/,
  );
  assert.doesNotMatch(duotoneMailSolidMarkup, /vf-duotone-primary-mail/);
  assert.match(
    duotoneMessageSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><g transform="translate\(1 1\) scale\(.9167\)"/,
  );
  assert.doesNotMatch(duotoneMessageSolidMarkup, /vf-duotone-primary-message/);
  assert.match(
    duotonePhoneSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><path[^>]*fill="currentColor" stroke="currentColor"/,
  );
  assert.doesNotMatch(duotonePhoneSolidMarkup, /vf-duotone-primary-phone/);
  assert.match(
    duotonePlugSolidMarkup,
    /d="M9 3v5m6-5v5" fill="none" stroke="var\(--vf-icon-secondary-paint, currentColor\)" stroke-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)"/,
  );
  assert.match(duotonePlugSolidMarkup, /d="M12 18.5V21" fill="none" stroke="currentColor"/);
  assert.match(duotonePlugSolidMarkup, /d="M5.5 8h13v4a6.5 6.5 0 0 1-13 0Z" fill="currentColor" stroke="currentColor"/);
  assert.match(
    duotoneReceiptSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><defs><mask id="vf-solid-receipt-/,
  );
  assert.doesNotMatch(duotoneReceiptSolidMarkup, /vf-duotone-primary-receipt/);
  assert.match(duotoneServerSolidMarkup, /<mask id="vf-duotone-primary-server-/);
  assert.match(duotoneServerSolidMarkup, /<rect x="2.5" y="2.25" width="19" height="8.5" rx="2.5" fill="white"/);
  assert.match(
    duotoneStarSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><path fill="currentColor" stroke="currentColor"/,
  );
  assert.doesNotMatch(duotoneStarSolidMarkup, /vf-duotone-primary-star/);
  assert.match(duotoneTerminalSolidMarkup, /d="m3.5 5 6.5 7-6.5 7" fill="none" stroke="currentColor"/);
  assert.match(
    duotoneTerminalSolidMarkup,
    /d="M12.25 19h8.25" fill="none" stroke="var\(--vf-icon-secondary-paint, currentColor\)" stroke-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)"/,
  );
  assert.match(
    duotoneUserCheckSolidMarkup,
    /<circle cx="9.25" cy="7.25" r="4.25" fill="var\(--vf-icon-secondary-paint, currentColor\)" fill-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)"/,
  );
  assert.match(
    duotoneUserCheckSolidMarkup,
    /fill="var\(--vf-icon-secondary-paint, currentColor\)" fill-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)" d="M.5 21c.35-5.1 3.65-8 8.75-8s8.4 2.9 8.75 8Z"/,
  );
  assert.match(duotoneUserCheckSolidMarkup, /d="m16 8.25 2 2.25 4-4.75" fill="none" stroke="currentColor"/);
  assert.match(
    duotoneUserMinusSolidMarkup,
    /<circle cx="9.25" cy="7.25" r="4.25" fill="var\(--vf-icon-secondary-paint, currentColor\)" fill-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)"/,
  );
  assert.match(
    duotoneUserMinusSolidMarkup,
    /fill="var\(--vf-icon-secondary-paint, currentColor\)" fill-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)" d="M.5 21c.35-5.1 3.65-8 8.75-8s8.4 2.9 8.75 8Z"/,
  );
  assert.match(duotoneUserMinusSolidMarkup, /d="M16 8.25h6" stroke="currentColor"/);
  assert.match(
    duotoneUserPlusSolidMarkup,
    /<circle cx="9.25" cy="7.25" r="4.25" fill="var\(--vf-icon-secondary-paint, currentColor\)" fill-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)"/,
  );
  assert.match(
    duotoneUserPlusSolidMarkup,
    /fill="var\(--vf-icon-secondary-paint, currentColor\)" fill-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)" d="M.5 21c.35-5.1 3.65-8 8.75-8s8.4 2.9 8.75 8Z"/,
  );
  assert.match(duotoneUserPlusSolidMarkup, /d="M19 4.75v7M16 8.25h6" stroke="currentColor"/);
  assert.match(duotoneUsersSolidMarkup, /<circle cx="12" cy="6.5" r="3.5" fill="currentColor"/);
  assert.match(
    duotoneUsersSolidMarkup,
    /<circle cx="4.75" cy="8.75" r="2.5" fill="var\(--vf-icon-secondary-paint, currentColor\)" fill-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)"/,
  );
  assert.match(
    duotoneUsersSolidMarkup,
    /<circle cx="19.25" cy="8.75" r="2.5" fill="var\(--vf-icon-secondary-paint, currentColor\)" fill-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)"/,
  );
  assert.match(
    duotoneUsersSolidMarkup,
    /fill="var\(--vf-icon-secondary-paint, currentColor\)" fill-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)" d="M.75 20v-1.5/,
  );
  assert.match(duotoneUsersSolidMarkup, /fill="currentColor" d="M6 21c.25-5.1 2.45-8 6-8s5.75 2.9 6 8Z"/);
  assert.match(duotoneWalletSolidMarkup, /<mask id="vf-duotone-wallet-clasp-/);
  assert.match(duotoneWalletSolidMarkup, /d="M21.25 9.25H15a3 3 0 0 0 0 6h6.25Z" fill="white"/);
  assert.match(
    duotoneWalletSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><defs><mask id="vf-solid-wallet-/,
  );
  assert.match(
    duotoneWalletSolidMarkup,
    /<g mask="url\(#vf-duotone-wallet-clasp-[^)]+\)"><defs><mask id="vf-solid-wallet-/,
  );
  assert.match(
    duotoneActivitySolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><path[^>]*stroke="currentColor"/,
  );
  assert.doesNotMatch(duotoneActivitySolidMarkup, /vf-duotone-primary-activity/);
  assert.match(
    duotoneAlertCircleSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><defs><mask id="vf-solid-alert-circle-/,
  );
  assert.match(
    duotoneAlertCircleSolidMarkup,
    /<g fill="currentColor"><rect x="10.7" y="6.5" width="2.6" height="7.5" rx="1.3"><\/rect><circle cx="12" cy="17.5" r="1.35"><\/circle><\/g>/,
  );
  assert.doesNotMatch(duotoneAlertCircleSolidMarkup, /vf-duotone-primary-alertCircle/);
  assert.match(
    duotoneBanSolidMarkup,
    /<rect width="24" height="24" fill="currentColor" mask="url\(#vf-solid-ban-ring-/,
  );
  assert.match(
    duotoneBanSolidMarkup,
    /d="M5 5 19 19" stroke="var\(--vf-icon-secondary-paint, currentColor\)" stroke-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)"/,
  );
  assert.match(
    duotoneCheckCircleSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><defs><mask id="vf-solid-check-circle-/,
  );
  assert.match(
    duotoneCheckCircleSolidMarkup,
    /<path d="m7.5 12.2 3 3 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><\/path>/,
  );
  assert.doesNotMatch(duotoneCheckCircleSolidMarkup, /vf-duotone-primary-checkCircle/);
  assert.match(
    duotoneCircleHalfSolidMarkup,
    /<linearGradient id="vf-duotone-circle-half-[^"]+" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">/,
  );
  assert.match(
    duotoneCircleHalfSolidMarkup,
    /<stop offset="0%" stop-color="currentColor"><\/stop><stop offset="50%" stop-color="currentColor"><\/stop><stop offset="50%" stop-color="var\(--vf-icon-secondary-color, currentColor\)" stop-opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><\/stop>/,
  );
  assert.match(
    duotoneCircleHalfSolidMarkup,
    /<circle cx="12" cy="12" r="10" fill="url\(#vf-duotone-circle-half-[^)]+\)"><\/circle>/,
  );
  assert.doesNotMatch(duotoneCircleHalfSolidMarkup, /vf-duotone-primary-circleHalf/);
  assert.match(
    duotoneCircleNotchSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><path[^>]*stroke="currentColor"/,
  );
  assert.doesNotMatch(duotoneCircleNotchSolidMarkup, /vf-duotone-primary-circleNotch/);
  assert.match(
    duotoneClockSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><defs><mask id="vf-solid-clock-/,
  );
  assert.match(
    duotoneClockSolidMarkup,
    /<path d="M12 6.75V12l4 2.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><\/path>/,
  );
  assert.doesNotMatch(duotoneClockSolidMarkup, /vf-duotone-primary-clock/);
  assert.match(
    duotoneEyeSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><defs><mask id="vf-solid-eye-/,
  );
  assert.match(duotoneEyeSolidMarkup, /<circle cx="12" cy="12" r="1.5" fill="currentColor"><\/circle>/);
  assert.doesNotMatch(duotoneEyeSolidMarkup, /vf-duotone-primary-eye/);
  assert.match(
    duotoneHistorySolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><path d="M5.64 18.36A9 9 0 1 0 5.64 5.64" fill="none" stroke="currentColor"/,
  );
  assert.match(
    duotoneHistorySolidMarkup,
    /transform="translate\(-.75\)" d="M2 9.5 10.5 8l-7-6.5Z" fill="currentColor" stroke="currentColor"/,
  );
  assert.match(duotoneHistorySolidMarkup, /d="M12 7.25V12l3.75 2.25" fill="none" stroke="currentColor"/);
  assert.match(
    duotoneInfoCircleSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><defs><mask id="vf-solid-info-circle-/,
  );
  assert.match(
    duotoneInfoCircleSolidMarkup,
    /<g fill="currentColor"><circle cx="12" cy="7" r="1.35"><\/circle><rect x="10.65" y="10" width="2.7" height="7.5" rx="1.35"><\/rect><\/g>/,
  );
  assert.doesNotMatch(duotoneInfoCircleSolidMarkup, /vf-duotone-primary-infoCircle/);
  assert.match(
    duotoneMoonSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><path fill="currentColor" stroke="currentColor"/,
  );
  assert.match(duotoneQuestionSolidMarkup, /d="M6.5 7.5a5.5 5.5 0 1 1 8 4.9[^>]*stroke="currentColor"/);
  assert.match(
    duotoneQuestionSolidMarkup,
    /<circle cx="12" cy="20.5" r="1.75" fill="var\(--vf-icon-secondary-paint, currentColor\)" fill-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)"/,
  );
  assert.match(
    duotoneQuestionCircleSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><defs><mask id="vf-solid-question-circle-/,
  );
  assert.match(
    duotoneQuestionCircleSolidMarkup,
    /d="M8.8 8.7a3.3 3.3 0 1 1 4.8 2.95C12.5 12.25 12 13 12 14"[^>]*stroke="currentColor"/,
  );
  assert.match(
    duotoneShieldSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><path fill="currentColor"/,
  );
  assert.match(
    duotoneSparklesSolidMarkup,
    /<path d="M14.5 3c.5 3.55 2.45 5.5 6 6[^>]*fill="currentColor" stroke="currentColor"/,
  );
  assert.match(
    duotoneSparklesSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><path d="M6 14.5c.25 1.75/,
  );
  assert.match(
    duotoneSunSolidMarkup,
    /<circle cx="12" cy="12" r="4.5" fill="var\(--vf-icon-secondary-paint, currentColor\)" fill-opacity="var\(--vf-icon-secondary-part-opacity, 0.4\)"/,
  );
  assert.match(duotoneSunSolidMarkup, /d="M12 2.75V5M12 19v2.25[^>]*stroke="currentColor"/);
  assert.match(
    duotoneWarningSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><defs><mask id="vf-solid-warning-/,
  );
  assert.match(
    duotoneWarningSolidMarkup,
    /<g fill="currentColor"><rect x="10.7" y="8" width="2.6" height="7" rx="1.3"><\/rect><circle cx="12" cy="18.25" r="1.4"><\/circle><\/g>/,
  );
  assert.match(
    duotoneXCircleSolidMarkup,
    /<g color="var\(--vf-icon-secondary-color, currentColor\)" opacity="var\(--vf-icon-secondary-opacity, 0.4\)"><defs><mask id="vf-solid-x-circle-/,
  );
  assert.match(duotoneXCircleSolidMarkup, /d="m8.5 8.5 7 7m0-7-7 7"[^>]*stroke="currentColor"/);
  assert.match(duotoneCollapseSolidMarkup, /<mask id="vf-duotone-primary-collapse-/);
  assert.match(duotoneCollapseSolidMarkup, /d="M21 3l-6 6m0-6v6h6"/);
  assert.match(classicCollapseSolidMarkup, /d="m3 21 6-6m0 6v-6H3M21 3l-6 6m0-6v6h6"/);
  assert.match(duotoneExpandSolidMarkup, /<mask id="vf-duotone-primary-expand-/);
  assert.match(duotoneExpandSolidMarkup, /d="M14 10 21 3m-6 0h6v6"/);
  assert.match(duotoneColumnsSolidMarkup, /<mask id="vf-duotone-primary-columns-/);
  assert.match(duotoneColumnsSolidMarkup, /<rect x="0" y="0" width="24" height="8" fill="white"/);
  assert.match(
    duotoneGridSolidMarkup,
    /<rect x="3" y="3"[^>]*fill="var\(--vf-icon-secondary-paint, currentColor\)"[^>]*\/><rect x="13" y="3"[^>]*fill="currentColor"\/><rect x="3" y="13"[^>]*fill="currentColor"\/><rect x="13" y="13"[^>]*fill="var\(--vf-icon-secondary-paint, currentColor\)"/,
  );
  assert.match(duotoneArchiveSolidMarkup, /<mask id="vf-duotone-primary-archive-/);
  assert.match(duotoneArchiveSolidMarkup, /<rect x="0" y="8.25" width="24" height="15.75" fill="white"/);
  assert.match(duotoneBellSolidMarkup, /<mask id="vf-duotone-primary-bell-/);
  assert.match(
    duotoneBellSolidMarkup,
    /transform="translate\(0 -.75\)" d="M3 18.5c1.4-1.7 2-3.35 2-5V10a7 7 0 0 1 14 0v3.5c0 1.65.6 3.3 2 5 .55.7.05 1.75-.85 1.75H3.85c-.9 0-1.4-1.05-.85-1.75Z"/,
  );
  assert.match(duotoneBriefcaseSolidMarkup, /<mask id="vf-duotone-primary-briefcase-/);
  assert.match(
    duotoneBriefcaseSolidMarkup,
    /<rect x="0" y="6" width="24" height="6.5" fill="white"><\/rect><path d="M8.5 7V4.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7" fill="none" stroke="black"/,
  );
  assert.match(duotoneClipboardSolidMarkup, /<mask id="vf-duotone-primary-clipboard-/);
  assert.match(
    duotoneClipboardSolidMarkup,
    /<rect x="3" y="4" width="18" height="18" rx="3" fill="white"\/><rect x="7.5" y="1.75" width="9" height="6" rx="2" fill="black"/,
  );
  assert.match(duotoneCopySolidMarkup, /<mask id="vf-duotone-primary-copy-/);
  assert.match(duotoneCopySolidMarkup, /d="M8.5 6.5h7l5 5V19a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z"/);
  assert.match(duotoneDownloadSolidMarkup, /<mask id="vf-duotone-primary-download-/);
  assert.match(duotoneDownloadSolidMarkup, /d="M10.25 2h3.5v9.75l3.4-3.4 2.5 2.5L12 17.25l-7.65-6.4 2.5-2.5 3.4 3.4Z"/);
  assert.match(
    duotoneEllipsisSolidMarkup,
    /<circle cx="5" cy="12"[^>]*fill="currentColor"\/><circle cx="12" cy="12"[^>]*fill="var\(--vf-icon-secondary-paint, currentColor\)"[^>]*\/><circle cx="19" cy="12"[^>]*fill="currentColor"\/>/,
  );
  assert.match(duotoneExternalLinkSolidMarkup, /<mask id="vf-duotone-primary-externalLink-/);
  assert.match(duotoneExternalLinkSolidMarkup, /d="M11 13 21 3M15 3h6v6"/);
  assert.match(duotoneFileSolidMarkup, /<mask id="vf-duotone-primary-file-/);
  assert.match(duotoneFileSolidMarkup, /d="M5 2h9l5 5v15H5Z" fill="white"/);
  assert.match(duotoneFileSolidMarkup, /d="M14 2 19 7v1h-5Z" fill="black"/);
  assert.match(duotoneFileTextSolidMarkup, /<mask id="vf-duotone-primary-fileText-/);
  assert.match(duotoneFileTextSolidMarkup, /d="M14 2 19 7v1h-5Z" fill="black"/);
  assert.match(
    duotoneFileTextSolidMarkup,
    /<path d="M8.5 12.25h7m-7 4h7" fill="none" stroke="currentColor" stroke-width="1.5"/,
  );
  assert.match(duotoneFolderSolidMarkup, /<mask id="vf-duotone-primary-folder-/);
  assert.match(duotoneFolderSolidMarkup, /<rect x="0" y="7.75" width="24" height="16.25" fill="white"/);
  assert.match(duotoneFolderOpenSolidMarkup, /<mask id="vf-duotone-primary-folderOpen-/);
  assert.match(
    duotoneFolderOpenSolidMarkup,
    /d="M5.5 9h14.25a1.75 1.75 0 0 1 1.7 2.2l-2 7.5a1.75 1.75 0 0 1-1.7 1.3H2.5Z"/,
  );
  assert.match(duotoneHardDriveSolidMarkup, /<mask id="vf-duotone-primary-hardDrive-/);
  assert.match(duotoneHardDriveSolidMarkup, /<rect x="0" y="12" width="24" height="12" fill="white"/);
  assert.match(duotoneFunnelXSolidMarkup, /<mask id="vf-duotone-primary-funnelX-/);
  assert.match(duotoneFunnelXSolidMarkup, /<circle cx="16.75" cy="16.5" r="5.5" fill="white"/);
  assert.match(duotoneLinkSolidMarkup, /<mask id="vf-duotone-primary-link-/);
  assert.match(
    duotoneLinkSolidMarkup,
    /d="M9.9 12.1c0 1.9 1.6 3.2 3.6 3.2 1 0 1.8-.4 2.5-1.1l2.7-2.7c2.1-2.1 2.1-4.5.1-5.7-1.3-.8-3.3-.9-4.7 0"/,
  );
  assert.match(duotonePencilSolidMarkup, /<mask id="vf-duotone-primary-pencil-/);
  assert.match(duotonePencilSolidMarkup, /d="M4.15 15.25 15 4.4 19.6 9 8.75 19.85Z"/);
  assert.match(duotoneSortSolidMarkup, /<mask id="vf-duotone-primary-sort-/);
  assert.match(duotoneSortSolidMarkup, /d="M4 14.5h16L12 21.5Z" fill="white" stroke="white"/);
  assert.match(duotoneUploadSolidMarkup, /<mask id="vf-duotone-primary-upload-/);
  assert.match(duotoneUploadSolidMarkup, /<rect x="3" y="18.25" width="18" height="3" fill="white"/);
  await assert.rejects(
    () => renderIcon(VueIconify, { icon: icons.github, family: 'duotone' }, true),
    /Icon "github" does not support the "duotone" family/,
  );

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

      if (!catalogEntry.brand) {
        const duotoneMarkup = await renderIcon(VueIconify, {
          icon: iconName,
          family: 'duotone',
          variant,
          size: 24,
        });
        const duotoneSvg = duotoneMarkup.match(/<svg[\s\S]*<\/svg>/)?.[0].replace(/\sdata-v-[\w-]+/g, '');

        assert.ok(duotoneSvg, `${iconName}/duotone/${variant} must include SVG markup`);
        assert.doesNotMatch(
          duotoneSvg,
          /scale\(0\.86\)/,
          `${iconName}/duotone/${variant} must not apply the former secondary-layer scale`,
        );
        if (variant === 'solid') {
          assert.match(
            duotoneSvg,
            /vf-icon-secondary-(?:paint|color)|vf-duotone-/,
            `${iconName}/duotone/solid must include a secondary color region`,
          );
        } else if (outlineDuotoneFillIconNameSet.has(iconName)) {
          assert.match(
            duotoneSvg,
            /vf-icon-secondary-color/,
            `${iconName}/duotone/${variant} must include a secondary fill region`,
          );
        } else {
          assert.equal(
            duotoneSvg.replace('vf-icon--duotone', 'vf-icon--family'),
            svg.replace('vf-icon--classic', 'vf-icon--family'),
            `${iconName}/${variant} geometry must match between Classic and Duotone`,
          );
        }
        assert.ok(
          new Resvg(duotoneSvg).render().asPng().byteLength > 0,
          `${iconName}/duotone/${variant} must render visible SVG`,
        );
      }
    }
  }
} finally {
  rmSync(consumerRoot, { recursive: true, force: true });
}
