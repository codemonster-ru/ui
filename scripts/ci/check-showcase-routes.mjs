#!/usr/bin/env node
// Full-route gate for the showcase applications (M08, extended in M10).
//
// The parity gate proves one component renders the same thing in three
// implementations. This proves something different: that the real applications
// a reviewer opens actually contain those cases, agree on what each case is
// called, and can hand a reader from one platform to the other without losing
// the case.
//
// Both applications are started the way a developer starts them - `vite
// preview` over a real build, and `php -S` over the real front controller - and
// driven in the same headless Chrome the rest of the harness uses. Nothing is
// re-rendered from a fixture, and no capture is copied from the parity run.
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { get as httpGet } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { relative, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { delay, launchChrome, openPage } from '../baseline/cdp.mjs';
import { artifactsDirectory, captureEnvironment, stableStringify } from '../baseline/reference.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const runDirectory = resolve(artifactsDirectory, 'showcase-routes');
const vueExample = resolve(repositoryRoot, 'examples/playground');
const razorExample = resolve(repositoryRoot, 'examples/razor-showcase');
const themes = ['light', 'dark'];
const viewport = { width: 1280, height: 900 };

const failures = [];
const passed = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed.push(name);
  } else {
    failures.push(`${name}${detail ? `: ${detail}` : ''}`);
  }
}

async function freePort() {
  return new Promise((done, fail) => {
    const server = createServer();
    server.on('error', fail);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => done(port));
    });
  });
}

// `node:http` rather than fetch: PHP's development server closes connections in
// a way undici asserts on, which would crash the gate instead of reporting it.
function probe(url) {
  return new Promise((done) => {
    const request = httpGet(url, { agent: false }, (response) => {
      response.resume();
      response.on('end', () => done(response.statusCode ?? 0));
    });
    request.on('error', () => done(0));
    request.setTimeout(4000, () => {
      request.destroy();
      done(0);
    });
  });
}

async function waitForOrigin(origin, path, label) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 40_000) {
    if ((await probe(`${origin}${path}`)) === 200) return;
    await delay(250);
  }
  throw new Error(`${label} did not become reachable at ${origin}${path}.`);
}

// ---------------------------------------------------------------- shared data
const showcaseIndex = JSON.parse(readFileSync(resolve(repositoryRoot, 'examples/shared/showcase-index.json'), 'utf8'));
const inventory = JSON.parse(readFileSync(resolve(repositoryRoot, 'baseline/reference-inventory.json'), 'utf8'));

const indexComponentNames = showcaseIndex.components.map((entry) => entry.name);
const frozenComponentNames = inventory.components.publicComponentNames;
const razorImplemented = showcaseIndex.components
  .filter((entry) => entry.platforms.razor.status === 'implemented')
  .map((entry) => entry.name);

/**
 * The components both applications must expose, derived from the shared index.
 *
 * Nothing is hardcoded except the selector that proves a case rendered a real
 * control, which is the one fact about a component this gate cannot read from
 * plain data. A component marked implemented with no entry here fails below
 * rather than being skipped.
 */
const controlSelectors = {
  VfInput: 'input.vf-input',
  VfIconButton: 'button.vf-icon-button',
  VfField: '.vf-field',
  VfButton: 'button.vf-button',
  VfTextarea: 'textarea.vf-textarea',
  VfCheckbox: 'label.vf-checkbox',
  VfRadio: 'label.vf-radio',
  VfSwitch: 'label.vf-switch',
  // The M15 presentation components. Each renders exactly one element, so the
  // selector is the component's own root and nothing else.
  VfBadge: 'span.vf-badge',
  VfTag: 'span.vf-tag',
  VfDivider: 'div.vf-divider',
  // The M16 components. Skeleton and Avatar render one root; Card renders a
  // section whose regions are all optional, so its root is the only element
  // every case is guaranteed to have.
  VfSkeleton: 'div.vf-skeleton',
  VfAvatar: 'span.vf-avatar',
  VfCard: 'section.vf-card',
  // The M17 component. Its root is the only element every case has: both halves
  // are always rendered, but a case with a skeleton slot holds no vf-skeleton
  // at all, so the child is deliberately not the selector here.
  VfSkeletonGate: 'div.vf-skeleton-gate',
  // The M18 component. Its root is the only element every case has - the header
  // is optional and there is no body wrapper to select at all, which is the
  // difference from VfCard that this milestone exists to keep.
  VfPanel: 'section.vf-panel',
  // The M19 component. Its root is the only element every case has - the icon
  // container and the title are optional - and it is the first root here that
  // carries a role of the component's own.
  VfAlert: 'section.vf-alert',
  // The M20 component. One root, no slot, no optional region; it is the first
  // root here that another route (the button's loading cases) also renders,
  // and this selector counts the standalone one only because the spinner
  // route is the only route asked for it.
  VfProgressSpinner: 'span.vf-progress-spinner',
  // The M21 component. One root, no slot; the fill is always rendered and the
  // label only sometimes, so the root is the selector. A div beside the
  // spinner's span, which is one more way the two are not the same element.
  VfProgressBar: 'div.vf-progress-bar',
  // The M22 component. The trigger is the selector rather than the root: it
  // is the control the component owns, and a case that rendered the section
  // without its native button would still have a root.
  VfAccordion: 'button.vf-accordion__trigger',
  // The M23 component. The trigger again: one per item, and the control the
  // component owns. Counted by the case's items rather than one per root
  // (see controlsPerCase).
  VfStepper: 'button.vf-stepper__trigger',
  // The M24 component. The tab: one per item, and the control the component
  // owns with its explicit role. Counted by the case's items (see
  // controlsPerCase); the two scroll buttons and the panel are the
  // component's too, and the click probe below reads them.
  VfTabs: 'button.vf-tabs__tab[role="tab"]',
  // The M25 component. The anchor *with a destination*: it is the control
  // the component owns, and a case that rendered the anchor without its href
  // would still have an `a.vf-link` - the inert one the reference renders
  // for a link with no destination, which declares no control at all (see
  // controlsPerCase).
  VfLink: 'a.vf-link[href]',
  // The M26 component. The anchors *with a destination*, however many the
  // historical rule makes per case: the current item, a disabled item and an
  // item with no destination are spans and own nothing (see controlsPerCase).
  VfBreadcrumbs: 'a.vf-breadcrumbs__link[href]',
  // The M27 pair, and the two meanings this map carries. For VfMenu the entry
  // is the component's own root, the way VfBadge's and VfCard's are: the menu
  // owns no interactive control at all, and what is asserted here is that each
  // case renders the menu, not that the menu renders anything focusable. The
  // ownership claim - zero owned controls, every focusable element the
  // consumer's - is the parity profile's static posture, and it is not
  // restated here.
  //
  // For VfMenuItem the entry really is the owned control, and the selector is
  // the block class rather than a tag because the branch decides which tag it
  // is: an anchor or a button, both carrying the class, and an item that
  // stopped being either is still found and still counted.
  VfMenu: 'div.vf-menu',
  VfMenuItem: '.vf-menu__item',
  // The M28 component. The trigger wrapper: the one control the component
  // owns, a div with tabindex and no role, one per instance. The menu is not
  // a control and is outside the case entirely, teleported to <body>; the
  // interaction probe below reads it there.
  VfDropdown: '.vf-dropdown__trigger',
  // The M29 component. The disclosure trigger - a ghost button in the legend -
  // which exists only for a collapsible, titled group; a static group owns no
  // control at all (see controlsPerCase).
  VfGroupBox: 'button.vf-group-box__trigger',
};

/**
 * How many controls a case renders, for the components whose cases hold a
 * variable number of them. The stepper renders one trigger per item, over
 * every instance - and its empty-list case renders none, which is the one
 * case on any route that legitimately shows no control; every other
 * component renders one control per root.
 */
const controlsPerCase = {
  VfStepper: (parityCase) =>
    (Array.isArray(parityCase.group) ? parityCase.group : [parityCase.props]).reduce(
      (total, member) => total + (member.items?.length ?? 0),
      0,
    ),
  VfTabs: (parityCase) =>
    (Array.isArray(parityCase.group) ? parityCase.group : [parityCase.props]).reduce(
      (total, member) => total + (member.items?.length ?? 0),
      0,
    ),
  // One anchor per case, and it is a control exactly when the case has an
  // href - which is what the catalog declares as componentInteractive.
  VfLink: (parityCase) => parityCase.componentInteractive ?? 0,
  // As many anchors as the historical rule makes links - which is what the
  // catalog declares as componentInteractive and the coverage gate checks
  // against the rule. The empty trail and the lone item render none.
  VfBreadcrumbs: (parityCase) => parityCase.componentInteractive ?? 0,
  // VfMenu has no entry: every case renders exactly one menu root, which is
  // the default this map exists to override. What the menu does *not* render -
  // a control of its own - is the parity profile's business, not this gate's.
  //
  // VfMenuItem: one control per case, in all four states: an enabled or disabled button,
  // an enabled or disabled anchor. Never zero and never two.
  VfMenuItem: (parityCase) => parityCase.componentInteractive ?? 0,
  // One trigger per instance, which is what the catalog declares.
  VfDropdown: (parityCase) => parityCase.componentInteractive ?? 0,
  // One trigger per collapsible, titled instance that reaches the DOM - which
  // is what the catalog declares and the coverage gate checks against the
  // JavaScript title test. Every static case renders none.
  VfGroupBox: (parityCase) => parityCase.componentInteractive ?? 0,
};

/**
 * How many Razor roots a case renders, for the components whose cases can
 * hold more than one instance. The accordion's sibling cases render each
 * member and its nested cases render a second accordion inside the first;
 * every other component renders exactly one root per case.
 */
const rootsPerCase = {
  VfAccordion: (parityCase) =>
    (Array.isArray(parityCase.group) ? parityCase.group.length : 1) + (parityCase.content?.body?.accordion ? 1 : 0),
  VfStepper: (parityCase) => (Array.isArray(parityCase.group) ? parityCase.group.length : 1),
  VfTabs: (parityCase) => (Array.isArray(parityCase.group) ? parityCase.group.length : 1),
  VfDropdown: (parityCase) => (Array.isArray(parityCase.group) ? parityCase.group.length : 1),
  // Every group box root carries the marker, static or not; a nested one is in
  // the DOM only while its parent shows its content - inside a closed parent
  // it waits in the parent's inert template.
  VfGroupBox: (parityCase) =>
    groupBoxMembers(parityCase).reduce(
      (total, member) =>
        total + 1 + (parityCase.content?.body?.groupBox && groupBoxShowsContent(parityCase, member) ? 1 : 0),
      0,
    ),
};

/**
 * How many Razor roots the packaged controller enhances, for the one
 * component whose controller claims only some of its roots: a static group box
 * has nothing to enhance and is left unclaimed, so the count is its triggers.
 */
const enhancedPerCase = {
  VfGroupBox: (parityCase) => parityCase.componentInteractive ?? 0,
};

function groupBoxMembers(parityCase) {
  return Array.isArray(parityCase.group) ? parityCase.group : [parityCase.props ?? {}];
}

/** The group box's decisions, restated as data: JavaScript truthiness for the title. */
function groupBoxShowsContent(parityCase, member) {
  const hasTitle = Boolean(member.title) || parityCase.content?.title !== undefined;
  const collapsible = member.collapsible === true && hasTitle;
  const open = member.collapsed !== undefined ? !member.collapsed : !member.defaultCollapsed;
  return !collapsible || open;
}

/**
 * The Razor ownership marker and enhancement attribute each component renders.
 *
 * These were VfInput's until M13, which worked for VfField only because every
 * field case wraps an input. A textarea carries its own marker, so counting
 * the input's would have reported zero real roots on a page full of them.
 */
const ownershipMarkers = {
  VfInput: { root: '[data-vf-razor="input"]', enhanced: '[data-vf-razor-enhanced]' },
  VfField: { root: '[data-vf-razor="input"]', enhanced: '[data-vf-razor-enhanced]' },
  VfTextarea: { root: '[data-vf-razor="textarea"]', enhanced: '[data-vf-razor-textarea-enhanced]' },
  VfAccordion: { root: '[data-vf-razor="accordion"]', enhanced: '[data-vf-razor-accordion-enhanced]' },
  VfStepper: { root: '[data-vf-razor="stepper"]', enhanced: '[data-vf-razor-stepper-enhanced]' },
  VfTabs: { root: '[data-vf-razor="tabs"]', enhanced: '[data-vf-razor-tabs-enhanced]' },
  VfDropdown: { root: '[data-vf-razor="dropdown"]', enhanced: '[data-vf-razor-dropdown-enhanced]' },
  VfGroupBox: { root: '[data-vf-razor="group-box"]', enhanced: '[data-vf-razor-group-box-enhanced]' },
};

const components = showcaseIndex.components
  .filter((entry) => entry.platforms.razor.status === 'implemented')
  .map((entry) => {
    const catalog = JSON.parse(readFileSync(resolve(repositoryRoot, entry.showcase.caseSource), 'utf8'));

    return {
      name: entry.name,
      caseSource: entry.showcase.caseSource,
      vuePath: entry.showcase.routes.vue,
      razorPath: entry.showcase.routes.razor,
      controlSelector: controlSelectors[entry.name],
      caseIds: catalog.cases.map((parityCase) => parityCase.id),
      expectedRoots: catalog.cases.reduce(
        (total, parityCase) => total + (rootsPerCase[entry.name]?.(parityCase) ?? 1),
        0,
      ),
      expectedEnhanced: catalog.cases.reduce((total, parityCase) => {
        const count = enhancedPerCase[entry.name] ?? rootsPerCase[entry.name];
        return total + (count ? count(parityCase) : 1);
      }, 0),
      casesWithControls: catalog.cases.filter((parityCase) => (controlsPerCase[entry.name]?.(parityCase) ?? 1) > 0)
        .length,
    };
  });

check(
  'every component the index marks Razor-implemented is covered by this gate',
  components.every((component) => typeof component.controlSelector === 'string'),
  components
    .filter((c) => !c.controlSelector)
    .map((c) => c.name)
    .join(', '),
);

// The index cannot invent, hide or rename a component. Without this the two
// catalogs could agree with each other while both disagreeing with the product.
check(
  'the showcase index lists exactly the frozen public catalog',
  JSON.stringify(indexComponentNames) === JSON.stringify(frozenComponentNames),
  `${indexComponentNames.length} vs ${frozenComponentNames.length} names`,
);
check(
  'every component claims Vue support',
  showcaseIndex.components.every((entry) => entry.platforms.vue.status === 'implemented'),
);
check(
  'only components with a real Razor adapter are marked implemented',
  JSON.stringify(razorImplemented) ===
    JSON.stringify([
      'VfAccordion',
      'VfAlert',
      'VfAvatar',
      'VfBadge',
      'VfBreadcrumbs',
      'VfButton',
      'VfCard',
      'VfCheckbox',
      'VfDivider',
      'VfDropdown',
      'VfField',
      'VfGroupBox',
      'VfIconButton',
      'VfInput',
      'VfLink',
      'VfMenu',
      'VfMenuItem',
      'VfPanel',
      'VfProgressBar',
      'VfProgressSpinner',
      'VfRadio',
      'VfSkeleton',
      'VfSkeletonGate',
      'VfStepper',
      'VfSwitch',
      'VfTabs',
      'VfTag',
      'VfTextarea',
    ]),
  razorImplemented.join(', '),
);
check(
  'every implemented component points at the shared catalog that the parity gate uses',
  components.every(
    (component) =>
      showcaseIndex.components.find((entry) => entry.name === component.name)?.platforms.razor.caseSource ===
      component.caseSource,
  ),
);

// The Razor case template repeats the vf-input tag once per slot combination,
// because the engine collects named slots at compile time. The prop lists must
// stay identical or the branches quietly render different components.
const casePartial = readFileSync(resolve(razorExample, 'views/partials/input-case.razor.php'), 'utf8').replace(
  /\{\{--[\s\S]*?--\}\}/g,
  '',
);
const propBlocks = [...casePartial.matchAll(/<vf-input\b([\s\S]*?)(?:\/?)>/g)].map((match) =>
  match[1].replace(/\s+/g, ' ').trim(),
);
check('the Razor case template declares one tag per slot combination', propBlocks.length === 4, `${propBlocks.length}`);
check(
  'every Razor case tag binds an identical prop list',
  propBlocks.length > 0 && propBlocks.every((block) => block === propBlocks[0]),
);

// ------------------------------------------------------------- start the apps
mkdirSync(runDirectory, { recursive: true });

const vuePort = await freePort();
const razorPort = await freePort();
const vueOrigin = `http://127.0.0.1:${vuePort}`;
const razorOrigin = `http://127.0.0.1:${razorPort}`;

process.stdout.write(`Building the Vue showcase (razor origin ${razorOrigin})\n`);
execFileSync('npm', ['run', 'build'], {
  cwd: vueExample,
  stdio: ['ignore', 'ignore', 'pipe'],
  env: { ...process.env, VITE_RAZOR_SHOWCASE_ORIGIN: razorOrigin },
});

// The showcase installs the staged Composer artifact, so the artifact has to
// exist and be current before the page is served. This is what stops the
// showcase demonstrating a gitignored dist that would never ship (M09).
process.stdout.write('Staging the Razor Composer artifact the showcase installs\n');
execFileSync(process.execPath, [resolve(repositoryRoot, 'scripts/release/build-razor-package.mjs')], {
  cwd: repositoryRoot,
  stdio: ['ignore', 'ignore', 'pipe'],
});
execFileSync('composer', ['install', '--no-interaction', '--no-progress', '--quiet'], {
  cwd: razorExample,
  stdio: ['ignore', 'ignore', 'pipe'],
});

const razorAssets = execFileSync(
  'php',
  ['-r', 'require "vendor/autoload.php"; echo Codemonster\\VueForge\\Razor\\VueForgeRazorProvider::assetPath();'],
  { cwd: razorExample, encoding: 'utf8' },
).trim();
check(
  'the Razor showcase consumes the installed package, not the working tree',
  razorAssets.includes('examples/razor-showcase/vendor/codemonster-ru/vueforge-razor'),
  razorAssets,
);
check(
  'the Razor showcase resolves the packaged assets through the provider',
  existsSync(resolve(razorAssets, 'vueforge-razor.css')) && existsSync(resolve(razorAssets, 'vueforge-razor.js')),
  `${razorAssets} (run npm run razor:package)`,
);
// `composer install` over a path repository keeps whatever copy is already in
// vendor/, so a stale install serves an older adapter while every other check
// passes. Comparing the installed source against the staged source is what
// turns that into a failure rather than a confusing missing component.
const installedProvider = resolve(razorAssets, '../src/VueForgeRazorProvider.php');
const stagedProvider = resolve(repositoryRoot, '.release/razor-package/src/VueForgeRazorProvider.php');
check(
  'the installed package matches the staged artifact',
  existsSync(installedProvider) &&
    existsSync(stagedProvider) &&
    readFileSync(installedProvider, 'utf8') === readFileSync(stagedProvider, 'utf8'),
  'vendor/ holds an older copy; remove examples/razor-showcase/vendor and reinstall',
);

process.stdout.write(`Serving the Vue showcase on ${vueOrigin} and the Razor showcase on ${razorOrigin}\n`);
// Detached with no inherited pipes, so the gate can end the whole process group
// and nothing is left holding a handle that keeps this process alive.
const vueServer = spawn(
  resolve(repositoryRoot, 'node_modules/.bin/vite'),
  ['preview', '--host', '127.0.0.1', '--port', String(vuePort), '--strictPort'],
  { cwd: vueExample, stdio: 'ignore', detached: true },
);
const razorServer = spawn('php', ['-S', `127.0.0.1:${razorPort}`, '-t', resolve(razorExample, 'public')], {
  cwd: razorExample,
  stdio: 'ignore',
  detached: true,
  env: {
    ...process.env,
    VUEFORGE_VUE_SHOWCASE_ORIGIN: vueOrigin,
    // The built-in server handles one request at a time; a browser asking for
    // the document, the stylesheet and the controller at once would deadlock it.
    PHP_CLI_SERVER_WORKERS: '4',
  },
});

const chrome = await launchChrome();

/** Reads what one showcase page actually rendered. */
async function readShowcase(origin, path, theme, label, controlSelector, markers = ownershipMarkers.VfInput) {
  process.stdout.write(`  reading the ${label} showcase (${theme})\n`);
  const page = await openPage(chrome.endpoint);

  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', {
      ...viewport,
      deviceScaleFactor: captureEnvironment.deviceScaleFactor,
      mobile: false,
    });
    await page.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-reduced-motion', value: captureEnvironment.reducedMotion },
        { name: 'prefers-color-scheme', value: theme },
      ],
    });
    await page.send('Page.navigate', { url: `${origin}${path}` });
    await page.waitFor(`Boolean(document.querySelector('[data-showcase-platform-current]'))`);
    await page.waitFor(`document.querySelectorAll('[data-showcase-case]').length > 0`);
    await delay(250);

    const observed = await page.evaluate(`(() => {
      const cases = [...document.querySelectorAll('[data-showcase-case]')];
      return {
        platform: document.querySelector('[data-showcase-platform-current]').dataset.showcasePlatformCurrent,
        component: document.querySelector('[data-showcase-component]')?.dataset.showcaseComponent ?? null,
        caseIds: cases.map((element) => element.dataset.showcaseCase),
        controls: cases.filter((element) => element.querySelector(${JSON.stringify(controlSelector)})).length,
        caseLinks: Object.fromEntries(
          [...document.querySelectorAll('[data-showcase-case-link]')].map((link) => [
            link.dataset.showcaseCaseLinkFor,
            link.href,
          ]),
        ),
        platformLink: document.querySelector('[data-showcase-platform-link]')?.href ?? null,
        catalog: [...document.querySelectorAll('[data-showcase-catalog-component]')].map((element) => [
          element.dataset.showcaseCatalogComponent,
          element.dataset.showcaseRazorStatus,
        ]),
        razorRoots: document.querySelectorAll(${JSON.stringify(markers.root)}).length,
        razorEnhanced: document.querySelectorAll(${JSON.stringify(markers.enhanced)}).length,
        stylesheets: [...document.querySelectorAll('link[rel="stylesheet"]')].map((link) => link.getAttribute('href')),
        scripts: [...document.querySelectorAll('script[src]')].map((script) => script.getAttribute('src')),
        themeAttribute: document.documentElement.getAttribute('data-vf-theme'),
        focused: [...document.querySelectorAll('[data-showcase-case]')]
          .filter((element) => /--focused/.test(element.className))
          .map((element) => element.dataset.showcaseCase),
        unknownCase: Boolean(document.querySelector('[data-showcase-unknown-case]')),
        pageErrors: 0,
      };
    })()`);

    const shot = await page.send('Page.captureScreenshot', { format: 'png' });
    const bytes = Buffer.from(shot.data, 'base64');
    const fileName = `${label}-${theme}.png`;
    writeFileSync(resolve(runDirectory, fileName), bytes);

    return {
      ...observed,
      diagnostics: page.diagnostics,
      screenshot: { fileName, sha256: createHash('sha256').update(bytes).digest('hex') },
    };
  } finally {
    await page.close();
  }
}

/** Clicks the default accordion case's trigger on one platform and reads the state back once it has settled. */
async function probeAccordionToggle(origin, path) {
  const page = await openPage(chrome.endpoint);
  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
    await page.send('Page.navigate', { url: `${origin}${path}` });
    await page.waitFor(
      `Boolean(document.querySelector('[data-showcase-case="accordion/default"] button.vf-accordion__trigger'))`,
    );
    await delay(300);

    const point = await page.evaluate(`(() => {
      const trigger = document.querySelector('[data-showcase-case="accordion/default"] button.vf-accordion__trigger');
      trigger.scrollIntoView({ block: 'center' });
      const rect = trigger.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, before: trigger.getAttribute('aria-expanded') };
    })()`);
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
    await page.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: point.x,
      y: point.y,
      button: 'left',
      clickCount: 1,
    });
    await page.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: point.x,
      y: point.y,
      button: 'left',
      clickCount: 1,
    });
    await delay(500);

    const after = await page.evaluate(`(() => {
      const root = document.querySelector('[data-showcase-case="accordion/default"] .vf-accordion');
      const trigger = root.querySelector('button.vf-accordion__trigger');
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      return {
        after: trigger.getAttribute('aria-expanded'),
        panel: panel !== null && root.contains(panel) && panel.getAttribute('role') === 'region',
        settled: panel !== null && panel.style.transition === '',
        inlineScripts: [...document.querySelectorAll('script:not([src])')].filter((script) => /accordion/i.test(script.textContent)).length,
      };
    })()`);

    return { before: point.before, ...after };
  } finally {
    await page.close();
  }
}

/**
 * What the group box's showcase case does on one platform, driven with real
 * input: the open collapsible case collapses on a pointer click and expands
 * again on Enter through the browser's own button activation - one native
 * click, keydown not prevented - and the trigger is painted at rest, on a
 * keyboard focus and under a pointer hover. The long collapsible title is
 * measured for truncation on the real viewport, because an ellipsis is a
 * paint property no DOM snapshot records. No showcase script is involved.
 */
async function probeGroupBox(origin, path) {
  const page = await openPage(chrome.endpoint);
  const selector = (id) => `[data-showcase-case="${id}"] button.vf-group-box__trigger`;
  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
    await page.send('Page.navigate', { url: `${origin}${path}` });
    await page.waitFor(`Boolean(document.querySelector(${JSON.stringify(selector('group-box/collapsible-open'))}))`);
    await delay(300);

    const paint = `(() => {
      const element = document.querySelector(${JSON.stringify(selector('group-box/collapsible-open'))});
      const style = getComputedStyle(element);
      return { color: style.color, background: style.backgroundColor, outlineStyle: style.outlineStyle, boxShadow: style.boxShadow, focusVisible: element.matches(':focus-visible'), hovered: element.matches(':hover') };
    })()`;
    const rest = await page.evaluate(paint);

    // The long titles, as the reference paints them: the title rule asks for
    // an ellipsis, and it never engages. Inside the trigger the ghost button
    // is an unconstrained inline-flex box, so it grows past the legend and
    // the title span is never narrower than its text; in a static legend the
    // span is inline, where text-overflow does not apply, and the text runs
    // past the legend. Measured in M29 on both showcases and reproduced three
    // ways by the parity screenshots; asserted here as the contract it is.
    // Widths are not compared across the two pages: the Vue showcase chrome
    // leaves the page on the browser's default font, the Razor chrome sets
    // one, and that is every route's chrome rather than this component.
    const title = await page.evaluate(`(() => {
      const at = (id) => document.querySelector('[data-showcase-case="' + id + '"]');
      const collapsible = at('group-box/long-title-collapsible');
      const span = collapsible.querySelector('.vf-group-box__title');
      const button = collapsible.querySelector('.vf-group-box__trigger');
      const legend = collapsible.querySelector('.vf-group-box__legend');
      const staticLegend = at('group-box/long-title').querySelector('.vf-group-box__legend');
      const staticSpan = staticLegend.querySelector('.vf-group-box__title');
      const style = getComputedStyle(span);
      return {
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
        spanTruncated: span.scrollWidth > span.clientWidth,
        triggerOverflowsLegend: button.getBoundingClientRect().width > legend.getBoundingClientRect().width,
        staticSpanDisplay: getComputedStyle(staticSpan).display,
        staticTextOverflowsLegend: staticLegend.scrollWidth > staticLegend.clientWidth,
      };
    })()`);

    const state = `(() => {
      const trigger = document.querySelector(${JSON.stringify(selector('group-box/collapsible-open'))});
      const root = trigger.closest('.vf-group-box');
      return {
        expanded: trigger.getAttribute('aria-expanded'),
        content: root.querySelectorAll(':scope > .vf-group-box__content').length,
        collapsedClass: root.classList.contains('vf-group-box--collapsed'),
        focused: document.activeElement === trigger,
      };
    })()`;
    const point = await page.evaluate(`(() => {
      const trigger = document.querySelector(${JSON.stringify(selector('group-box/collapsible-open'))});
      trigger.scrollIntoView({ block: 'center' });
      window.__showcaseGroupBoxClicks = 0;
      window.__showcaseGroupBoxKeys = [];
      trigger.addEventListener('click', () => { window.__showcaseGroupBoxClicks += 1; });
      trigger.addEventListener('keydown', (event) => { setTimeout(() => window.__showcaseGroupBoxKeys.push(event.defaultPrevented), 0); });
      const rect = trigger.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    const before = await page.evaluate(state);
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
    await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
    await delay(100);
    const clicked = await page.evaluate(state);
    for (const type of ['keyDown', 'keyUp']) {
      await page.send('Input.dispatchKeyEvent', {
        type,
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
        nativeVirtualKeyCode: 13,
        ...(type === 'keyDown' ? { text: '\r', unmodifiedText: '\r' } : {}),
      });
    }
    await delay(100);
    const entered = await page.evaluate(state);
    const record = await page.evaluate(
      `({ clicks: window.__showcaseGroupBoxClicks, keys: window.__showcaseGroupBoxKeys })`,
    );

    // Keyboard focus from a real Tab, then a real hover, each read after the
    // button's colour transition would have finished.
    await page.evaluate(`(() => {
      document.activeElement?.blur();
      const trigger = document.querySelector(${JSON.stringify(selector('group-box/collapsible-open'))});
      const before = document.createElement('button');
      before.type = 'button';
      before.id = 'showcase-focus-origin';
      trigger.closest('.vf-group-box').before(before);
      before.focus();
    })()`);
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await delay(400);
    const focus = await page.evaluate(paint);
    await page.evaluate(`document.getElementById('showcase-focus-origin')?.remove(); document.activeElement?.blur();`);
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
    await delay(400);
    const hover = await page.evaluate(paint);

    const inlineScripts = await page.evaluate(
      `[...document.querySelectorAll('script:not([src])')].filter((script) => /group-box|groupbox/i.test(script.textContent)).length`,
    );

    return { before, clicked, entered, record, rest, focus, hover, title, inlineScripts };
  } finally {
    await page.close();
  }
}

/** Clicks the default stepper case's third trigger on one platform and reads every half of the state back. */
async function probeStepperSelect(origin, path) {
  const page = await openPage(chrome.endpoint);
  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
    await page.send('Page.navigate', { url: `${origin}${path}` });
    await page.waitFor(
      `Boolean(document.querySelector('[data-showcase-case="stepper/default"] button.vf-stepper__trigger'))`,
    );
    await delay(300);

    const point = await page.evaluate(`(() => {
      const root = document.querySelector('[data-showcase-case="stepper/default"] .vf-stepper');
      const trigger = root.querySelectorAll('button.vf-stepper__trigger')[2];
      trigger.scrollIntoView({ block: 'center' });
      const rect = trigger.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        before: root.querySelector('[aria-current="step"]')?.dataset.vfStepperValue ?? null,
      };
    })()`);
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
    await page.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: point.x,
      y: point.y,
      button: 'left',
      clickCount: 1,
    });
    await page.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: point.x,
      y: point.y,
      button: 'left',
      clickCount: 1,
    });
    await delay(200);

    const after = await page.evaluate(`(() => {
      const root = document.querySelector('[data-showcase-case="stepper/default"] .vf-stepper');
      const triggers = [...root.querySelectorAll('button.vf-stepper__trigger')];
      return {
        after: root.querySelector('[aria-current="step"]')?.dataset.vfStepperValue ?? null,
        currentClass: triggers.find((t) => t.classList.contains('vf-stepper__trigger--current'))?.dataset.vfStepperValue ?? null,
        states: [...root.querySelectorAll('.vf-stepper__item')].map((item) => [...item.classList].find((c) => c.startsWith('vf-stepper__item--')).slice(18)),
        factor: root.style.getPropertyValue('--vf-stepper-progress-factor').trim(),
        items: root.querySelectorAll('.vf-stepper__item').length,
        inlineScripts: [...document.querySelectorAll('script:not([src])')].filter((script) => /stepper/i.test(script.textContent)).length,
      };
    })()`);

    return { before: point.before, ...after };
  } finally {
    await page.close();
  }
}

/**
 * Focuses the two anchors that decide what a link is on one platform: the
 * plain href case, which must take focus, and the no-destination case, which
 * must refuse it. Both through the element's own focus(), on the real page,
 * with no script of the showcase's involved; what is read back is where the
 * document's focus actually landed, plus the two attributes that make the
 * difference and whether either anchor was given a role or a tabindex.
 */
async function probeLinkFocus(origin, path) {
  const page = await openPage(chrome.endpoint);
  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
    await page.send('Page.navigate', { url: `${origin}${path}` });
    await page.waitFor(`Boolean(document.querySelector('[data-showcase-case="link/no-destination"] a.vf-link'))`);
    await delay(200);

    return await page.evaluate(`(() => {
      const describe = (caseId) => {
        const anchor = document.querySelector('[data-showcase-case="' + caseId + '"] a.vf-link');
        if (!anchor) return null;
        anchor.focus();
        return {
          tag: anchor.tagName.toLowerCase(),
          href: anchor.getAttribute('href'),
          role: anchor.getAttribute('role'),
          tabindex: anchor.getAttribute('tabindex'),
          focused: document.activeElement === anchor,
        };
      };
      return {
        href: describe('link/href'),
        none: describe('link/no-destination'),
        blank: (() => {
          const anchor = document.querySelector('[data-showcase-case="link/blank-derived-rel"] a.vf-link');
          return anchor ? { target: anchor.getAttribute('target'), rel: anchor.getAttribute('rel') } : null;
        })(),
        inlineScripts: [...document.querySelectorAll('script:not([src])')].filter((script) => /link/i.test(script.textContent)).length,
      };
    })()`);
  } finally {
    await page.close();
  }
}

/**
 * Focuses and hovers the anchors that decide what a breadcrumb trail is on one
 * platform: every anchor of the trail case takes focus through its own
 * focus(), the current span refuses it, the _blank case carries the derived
 * rel, and the landmark carries its label. Then the first anchor is reached
 * by a real Tab key from the body and hovered by a real pointer move, and the
 * computed colour and outline are read back in each state - the same
 * stylesheet is loaded on both platforms, so the two pages have to agree on
 * what a focused and a hovered link look like, and each state has to differ
 * from rest. No script of the showcase's is involved.
 */
async function probeBreadcrumbsLinks(origin, path) {
  const page = await openPage(chrome.endpoint);
  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
    await page.send('Page.navigate', { url: `${origin}${path}` });
    await page.waitFor(
      `Boolean(document.querySelector('[data-showcase-case="breadcrumbs/trail"] a.vf-breadcrumbs__link'))`,
    );
    await delay(200);

    const statics = await page.evaluate(`(() => {
      const trail = document.querySelector('[data-showcase-case="breadcrumbs/trail"] nav.vf-breadcrumbs');
      const anchors = [...trail.querySelectorAll('a.vf-breadcrumbs__link')];
      const focused = anchors.map((anchor) => { anchor.focus(); return document.activeElement === anchor; });
      const current = trail.querySelector('span.vf-breadcrumbs__current');
      current.focus();
      const blank = document.querySelector('[data-showcase-case="breadcrumbs/blank-derived-rel"] a.vf-breadcrumbs__link');
      document.activeElement.blur();
      return {
        tags: anchors.map((anchor) => anchor.tagName.toLowerCase()),
        hrefs: anchors.map((anchor) => anchor.getAttribute('href')),
        focused,
        roles: anchors.map((anchor) => anchor.getAttribute('role')),
        tabindexes: anchors.map((anchor) => anchor.getAttribute('tabindex')),
        currentFocused: document.activeElement === current,
        currentAria: current.getAttribute('aria-current'),
        landmark: trail.tagName.toLowerCase() + '[' + trail.getAttribute('aria-label') + ']',
        blank: blank ? { target: blank.getAttribute('target'), rel: blank.getAttribute('rel') } : null,
        inlineScripts: [...document.querySelectorAll('script:not([src])')].filter((script) => /breadcrumb/i.test(script.textContent)).length,
      };
    })()`);

    const paint = `(() => {
      const anchor = document.querySelector('[data-showcase-case="breadcrumbs/trail"] a.vf-breadcrumbs__link');
      const style = getComputedStyle(anchor);
      return { color: style.color, outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, focusVisible: anchor.matches(':focus-visible'), hovered: anchor.matches(':hover') };
    })()`;
    const rest = await page.evaluate(paint);

    // A real Tab from the body lands on the first focusable element of the
    // page; the anchor is focused programmatically first and then blurred so
    // the next Tab reaches it, and keyboard focus is what makes :focus-visible
    // match on an anchor.
    await page.evaluate(`(() => {
      const anchor = document.querySelector('[data-showcase-case="breadcrumbs/trail"] a.vf-breadcrumbs__link');
      anchor.scrollIntoView({ block: 'center' });
      const before = document.createElement('button');
      before.type = 'button';
      before.id = 'parity-focus-origin';
      anchor.closest('.vf-breadcrumbs').before(before);
      before.focus();
    })()`);
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await delay(100);
    const focus = await page.evaluate(paint);
    await page.evaluate(`document.getElementById('parity-focus-origin')?.remove(); document.activeElement.blur();`);

    const point = await page.evaluate(`(() => {
      const anchor = document.querySelector('[data-showcase-case="breadcrumbs/trail"] a.vf-breadcrumbs__link');
      const rect = anchor.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
    await delay(350);
    const hover = await page.evaluate(paint);

    return { ...statics, rest, focus, hover };
  } finally {
    await page.close();
  }
}

/**
 * The native semantics of a menu item on one platform.
 *
 * Nothing here is the component's own behaviour: an enabled button and an
 * enabled anchor take focus, a disabled button refuses it, a disabled anchor
 * with no href is out of the tab order, and Enter on a button synthesises a
 * click. All of that is the browser's, and both platforms render the same
 * native elements, so the two pages have to agree - which is exactly why it is
 * measured here rather than claimed as a parity dimension.
 *
 * Two things that are the component's are read back too: the border width,
 * which comes from --vf-overlay-border-width and would compute as `medium`
 * on a page that lost overlay-primitives.css, and the glyph of the unknown-icon
 * case, which has to be the moon path on both platforms. Then the first item is
 * reached by a real Tab from the body and hovered by a real pointer move, and
 * the computed colour and ring are read in each state. No showcase script is
 * involved, and the pages carry none.
 */
async function probeMenuItemNatives(origin, path) {
  const page = await openPage(chrome.endpoint);
  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
    await page.send('Page.navigate', { url: `${origin}${path}` });
    await page.waitFor(`Boolean(document.querySelector('[data-showcase-case="menu-item/button"] .vf-menu__item'))`);
    await delay(200);

    const paint = `(() => {
      const element = document.querySelector('[data-showcase-case="menu-item/button"] .vf-menu__item');
      const style = getComputedStyle(element);
      return { color: style.color, background: style.backgroundColor, borderColor: style.borderTopColor, focusVisible: element.matches(':focus-visible'), hovered: element.matches(':hover') };
    })()`;
    // Sampled first, before anything on this page has been focused or hovered.
    // The item transitions its colour and border-colour, so a rest reading taken
    // after the focus probes below catches the element on its way back and
    // reports an interpolated colour - which is a real difference between two
    // samples taken at different moments, and no difference between the two
    // platforms at all.
    const rest = await page.evaluate(paint);

    const statics = await page.evaluate(`(() => {
      const at = (id) => document.querySelector('[data-showcase-case="' + id + '"] .vf-menu__item');
      const probe = (id) => {
        const element = at(id);
        if (!element) return null;
        element.focus();
        const focused = document.activeElement === element;
        document.activeElement.blur();
        return {
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute('role'),
          type: element.getAttribute('type'),
          href: element.getAttribute('href'),
          target: element.getAttribute('target'),
          rel: element.getAttribute('rel'),
          disabled: element.hasAttribute('disabled'),
          ariaDisabled: element.getAttribute('aria-disabled'),
          tabindex: element.getAttribute('tabindex'),
          borderWidth: getComputedStyle(element).borderTopWidth,
          focused,
        };
      };

      const glyph = document.querySelector('[data-showcase-case="menu-item/icon-unknown"] .vf-menu__item-icon path');
      const known = document.querySelector('[data-showcase-case="menu-item/icon"] .vf-menu__item-icon path');
      const wrapper = document.querySelector('[data-showcase-case="menu-item/icon"] .vf-icon-wrapper');

      return {
        button: probe('menu-item/button'),
        disabledButton: probe('menu-item/button-disabled'),
        anchor: probe('menu-item/anchor'),
        disabledAnchor: probe('menu-item/anchor-disabled'),
        emptyHref: probe('menu-item/empty-href'),
        blank: probe('menu-item/blank-without-rel'),
        unknownGlyph: glyph ? glyph.getAttribute('d') : null,
        knownGlyph: known ? known.getAttribute('d') : null,
        // The icon class belongs on the svg; the wrapper span must not carry it.
        wrapperCarriesIconClass: wrapper ? wrapper.classList.contains('vf-menu__item-icon') : null,
        inlineScripts: [...document.querySelectorAll('script:not([src])')].filter((script) => /menu/i.test(script.textContent)).length,
      };
    })()`);

    // Enter on a native button synthesises a click, and the component adds no
    // key handler of its own - so the count below is the browser's behaviour
    // and nothing else.
    //
    // It has to be a real key event *carrying its text*. A KeyboardEvent built
    // in the page is untrusted and synthesises nothing, and a `rawKeyDown` with
    // no text does not either: Chrome derives the activation from the character
    // the key produces, so `text` and `unmodifiedText` are what make this an
    // Enter press rather than a key-code notification. That is precisely why
    // the activation is worth measuring on a real page instead of asserting it
    // in a unit test - jsdom and a synthetic event both report a pass the
    // browser would not give.
    await page.evaluate(`(() => {
      const element = document.querySelector('[data-showcase-case="menu-item/button"] .vf-menu__item');
      window.__parityMenuItemClicks = 0;
      element.addEventListener('click', () => { window.__parityMenuItemClicks += 1; });
      element.scrollIntoView({ block: 'center' });
      element.focus();
    })()`);
    const enterFocused = await page.evaluate(
      `document.activeElement === document.querySelector('[data-showcase-case="menu-item/button"] .vf-menu__item')`,
    );
    for (const type of ['keyDown', 'keyUp']) {
      await page.send('Input.dispatchKeyEvent', {
        type,
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
        nativeVirtualKeyCode: 13,
        text: '\r',
        unmodifiedText: '\r',
      });
    }
    await delay(150);
    const nativeEnterClicks = await page.evaluate('window.__parityMenuItemClicks');
    await page.evaluate('document.activeElement.blur();');

    await page.evaluate(`(() => {
      const element = document.querySelector('[data-showcase-case="menu-item/button"] .vf-menu__item');
      element.scrollIntoView({ block: 'center' });
      const before = document.createElement('button');
      before.type = 'button';
      before.id = 'parity-focus-origin';
      element.before(before);
      before.focus();
    })()`);
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    // Long enough for the colour transition to finish, so the sample is the
    // focused state rather than a point on the way to it.
    await delay(400);
    const focus = await page.evaluate(paint);
    await page.evaluate(`document.getElementById('parity-focus-origin')?.remove(); document.activeElement.blur();`);

    const point = await page.evaluate(`(() => {
      const element = document.querySelector('[data-showcase-case="menu-item/button"] .vf-menu__item');
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
    await delay(350);
    const hover = await page.evaluate(paint);

    return { ...statics, enterFocused, nativeEnterClicks, rest, focus, hover };
  } finally {
    await page.close();
  }
}

/**
 * What a menu is on one platform: a role, a gap, and nothing focusable of its
 * own. The role-override case is read back too, because a consumer replacing
 * it is the one decision this component makes.
 */
async function probeMenuShell(origin, path) {
  const page = await openPage(chrome.endpoint);
  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
    await page.send('Page.navigate', { url: `${origin}${path}` });
    await page.waitFor(`Boolean(document.querySelector('[data-showcase-case="menu/spans"] .vf-menu'))`);
    await delay(200);

    return await page.evaluate(`(() => {
      const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable=""], [contenteditable="true"]';
      const at = (id) => document.querySelector('[data-showcase-case="' + id + '"] .vf-menu');
      const spans = at('menu/spans');
      spans.focus();
      const rootFocused = document.activeElement === spans;
      document.activeElement.blur();
      const style = getComputedStyle(spans);
      const withControl = at('menu/consumer-control');

      return {
        tag: spans.tagName.toLowerCase(),
        role: spans.getAttribute('role'),
        overriddenRole: at('menu/role-override')?.getAttribute('role') ?? null,
        rootFocused,
        display: style.display,
        flexDirection: style.flexDirection,
        // Zero on every case but the two the catalog declares: the component
        // renders nothing focusable, so what is here is the consumer's.
        ownFocusable: [...at('menu/spans').querySelectorAll(FOCUSABLE)].length,
        consumerFocusable: withControl ? [...withControl.querySelectorAll(FOCUSABLE)].length : null,
        // A menu adds nothing to the items it holds.
        menuitemRoles: [...spans.querySelectorAll('[role="menuitem"]')].length,
        ariaOrientation: spans.getAttribute('aria-orientation'),
        activeDescendant: spans.getAttribute('aria-activedescendant'),
        inlineScripts: [...document.querySelectorAll('script:not([src])')].filter((script) => /menu/i.test(script.textContent)).length,
      };
    })()`);
  } finally {
    await page.close();
  }
}

/** Clicks the panel case's middle tab on one platform and reads every half of the state back. */
async function probeTabsSelect(origin, path) {
  const page = await openPage(chrome.endpoint);
  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
    await page.send('Page.navigate', { url: `${origin}${path}` });
    await page.waitFor(`Boolean(document.querySelector('[data-showcase-case="tabs/panel"] button.vf-tabs__tab'))`);
    await delay(300);

    const point = await page.evaluate(`(() => {
      const root = document.querySelector('[data-showcase-case="tabs/panel"] .vf-tabs');
      const tab = root.querySelectorAll('button.vf-tabs__tab')[1];
      tab.scrollIntoView({ block: 'center' });
      const rect = tab.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        before: root.querySelector('[role="tab"][aria-selected="true"]')?.textContent.trim() ?? null,
        ready: root.classList.contains('vf-tabs--scroll-controls-animated'),
      };
    })()`);
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: point.x, y: point.y });
    await page.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: point.x,
      y: point.y,
      button: 'left',
      clickCount: 1,
    });
    await page.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: point.x,
      y: point.y,
      button: 'left',
      clickCount: 1,
    });
    await delay(200);

    const after = await page.evaluate(`(() => {
      const root = document.querySelector('[data-showcase-case="tabs/panel"] .vf-tabs');
      const tabs = [...root.querySelectorAll('button.vf-tabs__tab')];
      const panel = root.querySelector('[role="tabpanel"]');
      const indicator = root.querySelector('.vf-tabs__indicator');
      return {
        after: root.querySelector('[role="tab"][aria-selected="true"]')?.textContent.trim() ?? null,
        tabindexes: tabs.map((t) => t.getAttribute('tabindex')),
        panels: root.querySelectorAll('[role="tabpanel"]').length,
        panelText: panel?.textContent.trim() ?? null,
        panelLabelledBySelected: panel ? document.getElementById(panel.getAttribute('aria-labelledby')) === tabs[1] : false,
        indicatorTransform: indicator.style.transform,
        indicatorOpacity: indicator.style.opacity,
        scrollButtons: root.querySelectorAll('.vf-tabs__scroll-button').length,
        inlineScripts: [...document.querySelectorAll('script:not([src])')].filter((script) => /tabs/i.test(script.textContent)).length,
      };
    })()`);

    return { before: point.before, ready: point.ready, ...after };
  } finally {
    await page.close();
  }
}

/**
 * Drives the real dropdown on one platform with real pointer and key events
 * and reads each menu where it is - in <body>, found through its trigger's
 * aria-controls. Every step is chosen to mean the same on a page that also
 * holds the catalog's initially open cases: they close on the first click
 * anywhere else, as the reference's do, and nothing here depends on focus a
 * pointer click leaves behind. No unhandled navigation key is pressed: the
 * page has no harness to absorb the headless Chrome defect that hides a tab
 * after one (the parity fixture does, and measures ArrowUp there).
 */
async function probeDropdownBehaviour(origin, path) {
  const page = await openPage(chrome.endpoint);
  const state = (caseId) => `(() => {
    const trigger = document.querySelector('[data-showcase-case="${caseId}"] .vf-dropdown__trigger');
    const menu = document.getElementById(trigger.getAttribute('aria-controls'));
    const active = document.activeElement;
    return {
      expanded: trigger.getAttribute('aria-expanded'),
      haspopup: trigger.getAttribute('aria-haspopup'),
      role: trigger.getAttribute('role'),
      menu: menu ? {
        inBody: menu.parentElement === document.body,
        role: menu.getAttribute('role'),
        labelledByTrigger: menu.getAttribute('aria-labelledby') === trigger.id,
        positioned: menu.style.left !== '0px' || menu.style.top !== '0px',
        arrowFirst: menu.firstElementChild?.classList.contains('vf-dropdown__arrow') ?? false,
        transition: [...menu.classList].filter((name) => name.startsWith('vf-floating-transition-')).join(' '),
        below: menu.getBoundingClientRect().top >= trigger.getBoundingClientRect().bottom,
      } : null,
      focus: active === trigger ? 'trigger' : menu && menu.contains(active) ? 'item:' + active.textContent.trim() : 'elsewhere',
    };
  })()`;
  const key = async (name, code, keyCode) => {
    await page.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key: name,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
    await page.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: name,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
    await delay(120);
  };
  const click = async (expression) => {
    const point = await page.evaluate(`(() => {
      const element = ${expression};
      element.scrollIntoView({ block: 'center' });
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    await delay(150);
    const fresh = await page.evaluate(
      `(() => { const rect = (${expression}).getBoundingClientRect(); return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; })()`,
    );
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...fresh });
    await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...fresh, button: 'left', clickCount: 1 });
    await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...fresh, button: 'left', clickCount: 1 });
    void point;
  };
  const triggerOf = (caseId) => `document.querySelector('[data-showcase-case="${caseId}"] .vf-dropdown__trigger')`;
  const menuOf = (caseId) => `document.getElementById(${triggerOf(caseId)}.getAttribute('aria-controls'))`;

  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1, mobile: false });
    await page.send('Page.navigate', { url: `${origin}${path}` });
    await page.waitFor(
      `Boolean(document.querySelector('[data-showcase-case="dropdown/interaction-click-open"] .vf-dropdown__trigger'))`,
    );
    await delay(600);

    const initial = await page.evaluate(`(() => ({
      openOnLoad: [...document.querySelectorAll('.vf-dropdown__trigger[aria-expanded="true"]')].length,
      menusInBody: [...document.body.children].filter((node) => node.classList.contains('vf-dropdown__menu')).length,
      inlineScripts: [...document.querySelectorAll('script:not([src])')].filter((script) => /dropdown|floater/i.test(script.textContent)).length,
    }))()`);

    // Keyboard: ArrowDown opens and focuses the first item, the walk moves on,
    // Tab leaves it open, Escape closes the most recent and focuses the trigger.
    await page.evaluate(`${triggerOf('dropdown/interaction-arrowdown-open')}.focus()`);
    await key('ArrowDown', 'ArrowDown', 40);
    await delay(400);
    const keyboardOpen = await page.evaluate(state('dropdown/interaction-arrowdown-open'));
    await key('ArrowDown', 'ArrowDown', 40);
    const walked = await page.evaluate(state('dropdown/interaction-arrowdown-open'));
    await key('Tab', 'Tab', 9);
    const tabbed = await page.evaluate(state('dropdown/interaction-arrowdown-open'));
    await key('Escape', 'Escape', 27);
    const escaped = await page.evaluate(state('dropdown/interaction-arrowdown-open'));
    await delay(450);
    const escapedLater = await page.evaluate(state('dropdown/interaction-arrowdown-open'));

    // Pointer: a click opens, a click on the arrow - not an item - closes.
    await click(triggerOf('dropdown/interaction-click-arrow'));
    await delay(450);
    const pointerOpen = await page.evaluate(state('dropdown/interaction-click-arrow'));
    await click(`${menuOf('dropdown/interaction-click-arrow')}.querySelector('.vf-dropdown__arrow')`);
    await delay(60);
    const leaving = await page.evaluate(state('dropdown/interaction-click-arrow'));
    await delay(450);
    const insideClosed = await page.evaluate(state('dropdown/interaction-click-arrow'));

    // Outside: a click on the consumer control after the dropdown closes it
    // and takes focus back to the trigger.
    await click(triggerOf('dropdown/interaction-outside-click'));
    await delay(450);
    await click(
      `document.querySelector('[data-showcase-case="dropdown/interaction-outside-click"] .parity-after-control')`,
    );
    await delay(450);
    const outsideClosed = await page.evaluate(state('dropdown/interaction-outside-click'));

    return {
      initial,
      keyboardOpen,
      walked,
      tabbed,
      escaped,
      escapedLater,
      pointerOpen,
      leaving,
      insideClosed,
      outsideClosed,
    };
  } finally {
    await page.close();
  }
}

/** Opens a case address on one platform and reports which case it selected. */
async function readSelectedCase(origin, path) {
  const page = await openPage(chrome.endpoint);
  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Page.navigate', { url: `${origin}${path}` });
    await page.waitFor(`Boolean(document.querySelector('[data-showcase-platform-current]'))`);
    await delay(200);

    // Awaited before the finally block closes the page: returning the promise
    // itself would close the socket while the evaluation is still in flight.
    const selected = await page.evaluate(`(() => ({
      focused: [...document.querySelectorAll('[data-showcase-case]')]
        .filter((element) => /--focused/.test(element.className))
        .map((element) => element.dataset.showcaseCase),
      unknownCase: Boolean(document.querySelector('[data-showcase-unknown-case]')),
      caseCount: document.querySelectorAll('[data-showcase-case]').length,
    }))()`);

    return selected;
  } finally {
    await page.close();
  }
}

const observations = {};

try {
  for (const component of components) {
    await waitForOrigin(vueOrigin, component.vuePath, `The Vue ${component.name} showcase`);
    await waitForOrigin(razorOrigin, component.razorPath, `The Razor ${component.name} showcase`);
  }

  for (const component of components) {
    const { name, caseIds: componentCaseIds } = component;
    const vueRoute = `${component.vuePath}?component=${name}`;
    const razorRoute = `${component.razorPath}?component=${name}`;
    // VfInput and VfField each ship a browser controller that enhances every
    // server-rendered root - the input's actions, and the field's filled state.
    // VfIconButton and VfButton have nothing to enhance: a native button is
    // complete server-side, so neither carries an ownership marker and the gate
    // must not demand one they have no reason to render.
    // VfCheckbox, VfRadio and VfSwitch ship no controller: the root of each is
    // a label wrapping a native input, so the pointer, the keyboard and the
    // disabled state are the platform's. The checkbox marks only an
    // indeterminate control, which no showcase case renders as the whole page,
    // so none of the three is treated as an enhanced component here.
    // VfBadge, VfTag and VfDivider ship no controller either, and for a
    // stronger reason than the checkable controls: there is no interaction to
    // enhance at all. Their parity profiles say the same thing through the
    // static snapshot.
    const enhanced = [
      'VfInput',
      'VfField',
      'VfTextarea',
      'VfAccordion',
      'VfStepper',
      'VfTabs',
      'VfDropdown',
      'VfGroupBox',
    ].includes(name);

    for (const theme of themes) {
      const vue = await readShowcase(
        vueOrigin,
        `${vueRoute}&theme=${theme}`,
        theme,
        `vue-${name}`,
        component.controlSelector,
      );
      const razor = await readShowcase(
        razorOrigin,
        `${razorRoute}&theme=${theme}`,
        theme,
        `razor-${name}`,
        component.controlSelector,
        ownershipMarkers[name] ?? ownershipMarkers.VfInput,
      );
      observations[`${name}/${theme}`] = { vue, razor };

      // ---------------------------------------------------------- the same cases
      check(`[${name}/${theme}] the Vue page identifies itself`, vue.platform === 'vue' && vue.component === name);
      check(
        `[${name}/${theme}] the Razor page identifies itself`,
        razor.platform === 'razor' && razor.component === name,
      );
      check(
        `[${name}/${theme}] the Vue showcase renders every shared case in catalog order`,
        JSON.stringify(vue.caseIds) === JSON.stringify(componentCaseIds),
        `${vue.caseIds.length} of ${componentCaseIds.length}`,
      );
      check(
        `[${name}/${theme}] the Razor showcase renders every shared case in catalog order`,
        JSON.stringify(razor.caseIds) === JSON.stringify(componentCaseIds),
        `${razor.caseIds.length} of ${componentCaseIds.length}`,
      );
      check(
        `[${name}/${theme}] every Vue case that declares a control renders a real one`,
        vue.controls === component.casesWithControls,
        `${vue.controls} of ${component.casesWithControls}`,
      );
      check(
        `[${name}/${theme}] every Razor case that declares a control renders a real one`,
        razor.controls === component.casesWithControls,
        `${razor.controls} of ${component.casesWithControls}`,
      );

      // ------------------------------------------------- the real Razor pipeline
      if (enhanced) {
        check(
          `[${name}/${theme}] every Razor case comes from the real adapter`,
          razor.razorRoots === component.expectedRoots,
          `${razor.razorRoots} ownership markers, expected ${component.expectedRoots}`,
        );
        check(
          `[${name}/${theme}] the packaged Razor controller enhanced every root`,
          razor.razorEnhanced === component.expectedEnhanced,
          `${razor.razorEnhanced} enhanced, expected ${component.expectedEnhanced}`,
        );
      } else {
        check(
          `[${name}/${theme}] the Razor page needs no enhancement to be complete`,
          razor.razorEnhanced === 0,
          `${razor.razorEnhanced} enhanced roots on a component with no controller`,
        );
      }
      check(
        `[${name}/${theme}] the Razor page loads the packaged stylesheet`,
        razor.stylesheets.includes('/assets/vueforge-razor.css'),
        razor.stylesheets.join(', '),
      );
      check(
        `[${name}/${theme}] the Razor page loads the packaged controller`,
        razor.scripts.includes('/assets/vueforge-razor.js'),
        razor.scripts.join(', '),
      );
      // The Vue page must not reach for the Razor delivery path, and the Razor
      // page must not reach for the Vue build. Either would make the two pages
      // share a runtime that the architecture keeps apart.
      check(
        `[${name}/${theme}] the Vue page loads no Razor asset`,
        [...vue.stylesheets, ...vue.scripts].every((href) => !/vueforge-razor/.test(href ?? '')),
      );
      check(
        `[${name}/${theme}] the Razor page loads no Vue build asset`,
        [...razor.stylesheets, ...razor.scripts].every(
          (href) => !/\/assets\/(index|input|icon-button)-/.test(href ?? ''),
        ),
      );

      // --------------------------------------------- the accordion actually toggles
      //
      // M22: the Razor showcase has to toggle through the packaged controller
      // and the Vue showcase through the real component, with no showcase
      // script on either. A real pointer click on the first closed trigger of
      // the default case, on both pages, read back after the transition.
      if (name === 'VfAccordion') {
        for (const [platform, origin, route] of [
          ['vue', vueOrigin, `${vueRoute}&theme=${theme}`],
          ['razor', razorOrigin, `${razorRoute}&theme=${theme}`],
        ]) {
          const toggled = await probeAccordionToggle(origin, route);
          check(
            `[${name}/${theme}] the ${platform} showcase opens the default case on a real click`,
            toggled.before === 'false' &&
              toggled.after === 'true' &&
              toggled.panel === true &&
              toggled.settled === true,
            JSON.stringify(toggled),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase adds no script of its own to make that happen`,
            toggled.inlineScripts === 0,
            `${toggled.inlineScripts} inline script(s)`,
          );
        }
      }

      // --------------------------------------------- the group box actually toggles
      //
      // M29: a real click collapses and a real Enter - the browser's own
      // activation, one native click, keydown not prevented - expands the
      // open case on both pages; the trigger paints the same at rest, on focus
      // and on hover; and the long title truncates the same on the real
      // viewport. No showcase script on either.
      if (name === 'VfGroupBox') {
        const probed = {};
        for (const [platform, origin, route] of [
          ['vue', vueOrigin, `${vueRoute}&theme=${theme}`],
          ['razor', razorOrigin, `${razorRoute}&theme=${theme}`],
        ]) {
          const box = await probeGroupBox(origin, route);
          probed[platform] = box;
          check(
            `[${name}/${theme}] the ${platform} showcase collapses the open case on a real click and removes its content`,
            box.before.expanded === 'true' &&
              box.before.content === 1 &&
              box.clicked.expanded === 'false' &&
              box.clicked.content === 0 &&
              box.clicked.collapsedClass === true &&
              box.clicked.focused === true,
            JSON.stringify({ before: box.before, clicked: box.clicked }),
          );
          check(
            `[${name}/${theme}] Enter on the ${platform} showcase trigger is the browser's click, not the component's`,
            box.entered.expanded === 'true' &&
              box.entered.content === 1 &&
              box.record.clicks === 2 &&
              JSON.stringify(box.record.keys) === '[false]',
            JSON.stringify({ entered: box.entered, record: box.record }),
          );
          check(
            `[${name}/${theme}] a keyboard focus and a pointer hover each repaint the ${platform} showcase trigger`,
            box.focus.focusVisible === true &&
              JSON.stringify(box.focus) !== JSON.stringify(box.rest) &&
              box.hover.hovered === true &&
              box.hover.background !== box.rest.background,
            JSON.stringify({ rest: box.rest, focus: box.focus, hover: box.hover }),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase paints the long titles as the reference does: the ellipsis rule never engages`,
            box.title.textOverflow === 'ellipsis' &&
              box.title.whiteSpace === 'nowrap' &&
              box.title.spanTruncated === false &&
              box.title.triggerOverflowsLegend === true &&
              box.title.staticSpanDisplay === 'inline' &&
              box.title.staticTextOverflowsLegend === true,
            JSON.stringify(box.title),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase adds no script of its own to the group boxes`,
            box.inlineScripts === 0,
            `${box.inlineScripts} inline script(s)`,
          );
        }
        check(
          `[${name}/${theme}] both platforms paint the trigger identically at rest, on focus and on hover, and paint the long titles alike`,
          JSON.stringify(probed.vue.rest) === JSON.stringify(probed.razor.rest) &&
            JSON.stringify(probed.vue.focus) === JSON.stringify(probed.razor.focus) &&
            JSON.stringify(probed.vue.hover) === JSON.stringify(probed.razor.hover) &&
            JSON.stringify(probed.vue.title) === JSON.stringify(probed.razor.title),
          JSON.stringify({ vue: probed.vue, razor: probed.razor }),
        );
      }

      // ------------------------------------------- the stepper actually selects
      //
      // M23: the same proof for the second interactive component. A real
      // pointer click on the third trigger of the default case, on both
      // pages, must move every half of the state - aria-current, the trigger
      // modifier, the item classes and the factor - with no showcase script.
      if (name === 'VfStepper') {
        for (const [platform, origin, route] of [
          ['vue', vueOrigin, `${vueRoute}&theme=${theme}`],
          ['razor', razorOrigin, `${razorRoute}&theme=${theme}`],
        ]) {
          const selected = await probeStepperSelect(origin, route);
          check(
            `[${name}/${theme}] the ${platform} showcase selects the last step of the default case on a real click`,
            selected.before === 'account' &&
              selected.after === 'confirm' &&
              selected.currentClass === 'confirm' &&
              JSON.stringify(selected.states) === '["complete","complete","current"]' &&
              selected.factor === '1' &&
              selected.items === 3,
            JSON.stringify(selected),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase adds no script of its own to make that happen`,
            selected.inlineScripts === 0,
            `${selected.inlineScripts} inline script(s)`,
          );
        }
      }

      // --------------------------------------------- the tabs actually select
      //
      // M24: the same proof for the third interactive component. A real
      // pointer click on the middle tab of the panel case, on both pages,
      // must move every half of the state - aria-selected, the roving
      // tabindex, the one panel with its label and content, the measured
      // indicator - with no showcase script, on a page whose scroller had
      // reached its animated frame.
      // --------------------------------- the dropdown on both real pages
      //
      // M28: the overlay. Driven with real events on both platforms and read
      // where the menu really is; every reading must also be the same on both.
      if (name === 'VfDropdown') {
        const readings = {};
        for (const [platform, origin, route] of [
          ['vue', vueOrigin, `${vueRoute}&theme=${theme}`],
          ['razor', razorOrigin, `${razorRoute}&theme=${theme}`],
        ]) {
          const run = await probeDropdownBehaviour(origin, route);
          readings[platform] = run;
          check(
            `[${name}/${theme}] the ${platform} showcase opens the catalog's initially open dropdowns in <body>, with no script of its own`,
            run.initial.openOnLoad === 8 && run.initial.menusInBody === 7 && run.initial.inlineScripts === 0,
            JSON.stringify(run.initial),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase opens on ArrowDown into <body>, positioned below and labelled by its trigger, focusing the first item`,
            run.keyboardOpen.expanded === 'true' &&
              run.keyboardOpen.menu?.inBody &&
              run.keyboardOpen.menu.role === 'menu' &&
              run.keyboardOpen.menu.labelledByTrigger &&
              run.keyboardOpen.menu.positioned &&
              run.keyboardOpen.menu.below &&
              run.keyboardOpen.menu.arrowFirst &&
              run.keyboardOpen.focus === 'item:Edit' &&
              run.keyboardOpen.haspopup === 'menu' &&
              run.keyboardOpen.role === null,
            JSON.stringify(run.keyboardOpen),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase walks with ArrowDown and stays open on Tab`,
            run.walked.focus === 'item:Duplicate' &&
              run.tabbed.expanded === 'true' &&
              run.tabbed.focus === 'item:Archive',
            JSON.stringify({ walked: run.walked.focus, tabbed: run.tabbed }),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase closes on Escape, focuses the trigger, and removes the menu after its leave`,
            run.escaped.expanded === 'false' &&
              run.escaped.focus === 'trigger' &&
              run.escaped.menu?.transition.includes('vf-floating-transition-leave') &&
              run.escapedLater.menu === null,
            JSON.stringify({ escaped: run.escaped, later: run.escapedLater.menu }),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase closes on a click inside the menu on no item`,
            run.pointerOpen.expanded === 'true' &&
              run.pointerOpen.menu?.inBody &&
              run.leaving.expanded === 'false' &&
              run.insideClosed.menu === null &&
              run.insideClosed.focus === 'trigger',
            JSON.stringify({ open: run.pointerOpen, closed: run.insideClosed }),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase closes on an outside click and takes focus back to the trigger`,
            run.outsideClosed.expanded === 'false' &&
              run.outsideClosed.menu === null &&
              run.outsideClosed.focus === 'trigger',
            JSON.stringify(run.outsideClosed),
          );
        }
        check(
          `[${name}/${theme}] the Vue and Razor showcases read the same at every step`,
          JSON.stringify(readings.vue) === JSON.stringify(readings.razor),
          JSON.stringify(readings),
        );
      }

      if (name === 'VfTabs') {
        for (const [platform, origin, route] of [
          ['vue', vueOrigin, `${vueRoute}&theme=${theme}`],
          ['razor', razorOrigin, `${razorRoute}&theme=${theme}`],
        ]) {
          const selected = await probeTabsSelect(origin, route);
          check(
            `[${name}/${theme}] the ${platform} showcase selects the middle tab of the panel case on a real click`,
            selected.ready === true &&
              selected.before === 'Overview' &&
              selected.after === 'Settings' &&
              JSON.stringify(selected.tabindexes) === '["-1","0","-1"]' &&
              selected.panels === 1 &&
              selected.panelText === 'Panel for settings' &&
              selected.panelLabelledBySelected === true &&
              selected.indicatorOpacity === '1' &&
              /^translateX\(9[0-9](\.[0-9]+)?px\)$/.test(selected.indicatorTransform) &&
              selected.scrollButtons === 2,
            JSON.stringify(selected),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase adds no script of its own to make that happen`,
            selected.inlineScripts === 0,
            `${selected.inlineScripts} inline script(s)`,
          );
        }
      }

      // ------------------------------------------------ the link is a native link
      //
      // M25: nothing to click and nothing to toggle - activation is the
      // browser's. What both real pages have to prove instead is what makes
      // an anchor a link: the href case takes focus through its own focus(),
      // the no-destination case refuses it and carries no role and no
      // tabindex, and the _blank case carries the derived rel. No showcase
      // script is involved on either platform.
      if (name === 'VfLink') {
        for (const [platform, origin, route] of [
          ['vue', vueOrigin, `${vueRoute}&theme=${theme}`],
          ['razor', razorOrigin, `${razorRoute}&theme=${theme}`],
        ]) {
          const links = await probeLinkFocus(origin, route);
          check(
            `[${name}/${theme}] the ${platform} showcase's href anchor is a focusable native link`,
            links.href?.tag === 'a' && links.href.href === '/docs' && links.href.focused === true,
            JSON.stringify(links.href),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's no-destination anchor refuses focus and carries no role or tabindex`,
            links.none?.tag === 'a' &&
              links.none.href === null &&
              links.none.role === null &&
              links.none.tabindex === null &&
              links.none.focused === false,
            JSON.stringify(links.none),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's _blank anchor carries the derived rel`,
            links.blank?.target === '_blank' && links.blank.rel === 'noopener noreferrer',
            JSON.stringify(links.blank),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase adds no script of its own to the link`,
            links.inlineScripts === 0,
            `${links.inlineScripts} inline script(s)`,
          );
        }
      }

      // ----------------------------------------- the menu is a shell, not a widget
      //
      // M27: nothing to click and nothing to toggle. What both real pages have
      // to prove is that a menu is a role and a flex column and nothing else -
      // not focusable, no aria-orientation, no active descendant, and nothing
      // focusable of its own - and that a consumer role really does replace
      // role="menu", because that override is the one decision this component
      // makes. No showcase script is involved on either.
      if (name === 'VfMenu') {
        for (const [platform, origin, route] of [
          ['vue', vueOrigin, `${vueRoute}&theme=${theme}`],
          ['razor', razorOrigin, `${razorRoute}&theme=${theme}`],
        ]) {
          const shell = await probeMenuShell(origin, route);
          check(
            `[${name}/${theme}] the ${platform} showcase's menu is a div with role=menu that refuses focus`,
            shell.tag === 'div' && shell.role === 'menu' && shell.rootFocused === false,
            JSON.stringify({ tag: shell.tag, role: shell.role, focused: shell.rootFocused }),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's consumer role replaces role=menu`,
            shell.overriddenRole === 'list',
            String(shell.overriddenRole),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's menu is a flex column and writes no widget ARIA`,
            shell.display === 'flex' &&
              shell.flexDirection === 'column' &&
              shell.ariaOrientation === null &&
              shell.activeDescendant === null,
            JSON.stringify(shell),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's menu renders nothing focusable and no menuitem of its own`,
            shell.ownFocusable === 0 && shell.menuitemRoles === 0 && shell.consumerFocusable === 1,
            JSON.stringify({
              own: shell.ownFocusable,
              menuitems: shell.menuitemRoles,
              consumer: shell.consumerFocusable,
            }),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase adds no script of its own to the menu`,
            shell.inlineScripts === 0,
            `${shell.inlineScripts} inline script(s)`,
          );
        }
      }

      // --------------------------------- the item is one native control
      //
      // M27: the component owns one control and no behaviour beyond a Vue
      // emit, so what both real pages prove is the native half - which element
      // each branch is, which of them take focus, that Enter on a button is
      // the browser's click - plus the two things the component does decide
      // that only a real page can show: the border width the overlay token
      // feeds, and the glyph an unknown icon name falls back to.
      if (name === 'VfMenuItem') {
        const painted = {};
        for (const [platform, origin, route] of [
          ['vue', vueOrigin, `${vueRoute}&theme=${theme}`],
          ['razor', razorOrigin, `${razorRoute}&theme=${theme}`],
        ]) {
          const items = await probeMenuItemNatives(origin, route);
          painted[platform] = items;
          check(
            `[${name}/${theme}] the ${platform} showcase's plain item is a focusable native button with type and role`,
            items.button?.tag === 'button' &&
              items.button.type === 'button' &&
              items.button.role === 'menuitem' &&
              items.button.focused === true &&
              items.button.tabindex === null,
            JSON.stringify(items.button),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's disabled button refuses focus and carries the native attribute`,
            items.disabledButton?.disabled === true &&
              items.disabledButton.ariaDisabled === 'true' &&
              items.disabledButton.tabindex === null &&
              items.disabledButton.focused === false,
            JSON.stringify(items.disabledButton),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's destination item is a focusable native anchor with role=menuitem`,
            items.anchor?.tag === 'a' &&
              items.anchor.href === '/docs' &&
              items.anchor.role === 'menuitem' &&
              items.anchor.focused === true &&
              items.anchor.tabindex === null,
            JSON.stringify(items.anchor),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's disabled anchor keeps target and rel, drops its href and is out of the tab order`,
            items.disabledAnchor?.tag === 'a' &&
              items.disabledAnchor.href === null &&
              items.disabledAnchor.target === '_blank' &&
              items.disabledAnchor.rel === 'nofollow' &&
              items.disabledAnchor.disabled === false &&
              items.disabledAnchor.ariaDisabled === 'true' &&
              items.disabledAnchor.tabindex === '-1',
            JSON.stringify(items.disabledAnchor),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase renders href='' as the button branch`,
            items.emptyHref?.tag === 'button' && items.emptyHref.href === null,
            JSON.stringify(items.emptyHref),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's _blank item carries NO rel, unlike a link or a breadcrumb`,
            items.blank?.target === '_blank' && items.blank.rel === null,
            JSON.stringify(items.blank),
          );
          check(
            `[${name}/${theme}] Enter on the focused ${platform} showcase button is the browser's click, not the component's`,
            items.enterFocused === true && items.nativeEnterClicks === 1,
            `focused ${items.enterFocused}, ${items.nativeEnterClicks} click(s)`,
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's item takes its border width from the overlay token, not from 'medium'`,
            items.button?.borderWidth === '1px',
            String(items.button?.borderWidth),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's unknown icon name renders the moon glyph, and not the known one`,
            items.unknownGlyph === 'M20 15.25A8.5 8.5 0 1 1 10 3.5a7.75 7.75 0 0 0 10 11.75Z' &&
              items.knownGlyph !== null &&
              items.unknownGlyph !== items.knownGlyph,
            JSON.stringify({ unknown: items.unknownGlyph, known: items.knownGlyph }),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase keeps the icon class on the svg, not on the wrapper span`,
            items.wrapperCarriesIconClass === false,
            String(items.wrapperCarriesIconClass),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase adds no script of its own to the items`,
            items.inlineScripts === 0,
            `${items.inlineScripts} inline script(s)`,
          );
          check(
            `[${name}/${theme}] a keyboard focus and a pointer hover each repaint the ${platform} showcase's item`,
            items.focus.focusVisible === true &&
              items.focus.borderColor !== items.rest.borderColor &&
              items.hover.hovered === true &&
              items.hover.background !== items.rest.background,
            JSON.stringify({ rest: items.rest, focus: items.focus, hover: items.hover }),
          );
        }
        check(
          `[${name}/${theme}] both platforms paint the item identically at rest, on focus and on hover`,
          JSON.stringify(painted.vue.rest) === JSON.stringify(painted.razor.rest) &&
            JSON.stringify(painted.vue.focus) === JSON.stringify(painted.razor.focus) &&
            JSON.stringify(painted.vue.hover) === JSON.stringify(painted.razor.hover),
          JSON.stringify({ vue: painted.vue, razor: painted.razor }),
        );
      }

      // ------------------------------------------ the trail is N native links
      //
      // M26: nothing to click and nothing to toggle - activation is the
      // browser's. What both real pages have to prove instead is what makes a
      // breadcrumb trail: every anchor of the trail case takes focus through
      // its own focus() and carries no role or tabindex, the current span
      // refuses focus and carries aria-current, the landmark carries its
      // label, the _blank case carries the derived rel - and a keyboard focus
      // and a pointer hover each repaint the first anchor the same way on both
      // platforms. No showcase script is involved on either.
      if (name === 'VfBreadcrumbs') {
        const painted = {};
        for (const [platform, origin, route] of [
          ['vue', vueOrigin, `${vueRoute}&theme=${theme}`],
          ['razor', razorOrigin, `${razorRoute}&theme=${theme}`],
        ]) {
          const trail = await probeBreadcrumbsLinks(origin, route);
          painted[platform] = trail;
          check(
            `[${name}/${theme}] the ${platform} showcase's trail has two focusable native anchors with their destinations in order`,
            JSON.stringify(trail.tags) === '["a","a"]' &&
              JSON.stringify(trail.hrefs) === '["/","/docs"]' &&
              JSON.stringify(trail.focused) === '[true,true]' &&
              trail.roles.every((role) => role === null) &&
              trail.tabindexes.every((tabindex) => tabindex === null),
            JSON.stringify({ tags: trail.tags, hrefs: trail.hrefs, focused: trail.focused }),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's current item is a span that refuses focus and carries aria-current=page`,
            trail.currentFocused === false && trail.currentAria === 'page',
            JSON.stringify({ focused: trail.currentFocused, ariaCurrent: trail.currentAria }),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's trail is a nav landmark labelled Breadcrumb`,
            trail.landmark === 'nav[Breadcrumb]',
            trail.landmark,
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's _blank anchor carries the derived rel`,
            trail.blank?.target === '_blank' && trail.blank.rel === 'noopener noreferrer',
            JSON.stringify(trail.blank),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's first anchor shows a focus ring on keyboard focus and none at rest`,
            trail.focus.focusVisible === true &&
              trail.focus.outlineStyle === 'solid' &&
              trail.focus.outlineWidth !== '0px' &&
              trail.rest.outlineStyle === 'none',
            JSON.stringify({ rest: trail.rest, focus: trail.focus }),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase's first anchor changes colour on hover`,
            trail.hover.hovered === true && trail.hover.color !== trail.rest.color,
            JSON.stringify({ rest: trail.rest, hover: trail.hover }),
          );
          check(
            `[${name}/${theme}] the ${platform} showcase adds no script of its own to the trail`,
            trail.inlineScripts === 0,
            `${trail.inlineScripts} inline script(s)`,
          );
        }
        for (const state of ['rest', 'focus', 'hover']) {
          check(
            `[${name}/${theme}] the two showcases paint the first anchor identically at ${state}`,
            JSON.stringify(painted.vue[state]) === JSON.stringify(painted.razor[state]),
            JSON.stringify({ vue: painted.vue[state], razor: painted.razor[state] }),
          );
        }
      }

      // ------------------------------------------------------------- the catalog
      const expectedCatalog = showcaseIndex.components.map((entry) => [entry.name, entry.platforms.razor.status]);
      check(
        `[${name}/${theme}] the Vue catalog reports honest Razor support`,
        JSON.stringify(vue.catalog) === JSON.stringify(expectedCatalog),
      );
      check(
        `[${name}/${theme}] the Razor catalog reports honest Razor support`,
        JSON.stringify(razor.catalog) === JSON.stringify(expectedCatalog),
      );
      check(
        `[${name}/${theme}] unmigrated components stay listed as not implemented`,
        razor.catalog.filter(([, status]) => status === 'not-implemented').length ===
          frozenComponentNames.length - razorImplemented.length,
      );

      // ---------------------------------------------------------------- the theme
      check(`[${name}/${theme}] the Razor page applies the requested theme`, razor.themeAttribute === theme);
      check(`[${name}/${theme}] the Vue page applies the requested theme`, vue.themeAttribute === theme);

      // ------------------------------------------------------- matching addresses
      const wrongVueLinks = componentCaseIds.filter(
        (id) =>
          vue.caseLinks[id] !==
          `${razorOrigin}${component.razorPath}?component=${name}&theme=${theme}&case=${encodeURIComponent(id)}`,
      );
      const wrongRazorLinks = componentCaseIds.filter(
        (id) =>
          razor.caseLinks[id] !==
          `${vueOrigin}${component.vuePath}?component=${name}&theme=${theme}&case=${encodeURIComponent(id)}`,
      );
      check(
        `[${name}/${theme}] every Vue case links to the same Razor case`,
        wrongVueLinks.length === 0,
        wrongVueLinks.slice(0, 3).join(', '),
      );
      check(
        `[${name}/${theme}] every Razor case links to the same Vue case`,
        wrongRazorLinks.length === 0,
        wrongRazorLinks.slice(0, 3).join(', '),
      );

      check(
        `[${name}/${theme}] neither page reported a script error`,
        vue.diagnostics.pageErrors.length === 0 && razor.diagnostics.pageErrors.length === 0,
        [...vue.diagnostics.pageErrors, ...razor.diagnostics.pageErrors].join('; '),
      );
    }
  }

  // ------------------------------------------------- following a matching link
  //
  // A link that resolves to the page but not to the case would look correct in
  // a screenshot. Both directions are followed for real.
  const sampled = [
    ['VfInput', 'input/clearable-filled'],
    ['VfInput', 'input/field-floating-filled'],
    ['VfInput', 'input/interaction-reveal'],
    ['VfIconButton', 'icon-button/variant-danger'],
    ['VfIconButton', 'icon-button/interaction-enter'],
  ];
  for (const [componentName, caseId] of sampled) {
    // A case missing from one side is already reported above; say so here too
    // rather than crashing on an absent link, so the whole report survives.
    const vueLink = observations[`${componentName}/light`].vue.caseLinks[caseId];
    const razorLink = observations[`${componentName}/light`].razor.caseLinks[caseId];
    if (typeof vueLink !== 'string' || typeof razorLink !== 'string') {
      check(
        `both showcases offer a matching link for ${caseId}`,
        false,
        `vue ${typeof vueLink}, razor ${typeof razorLink}`,
      );
      continue;
    }

    const razorHref = vueLink.replace(razorOrigin, '');
    const vueHref = razorLink.replace(vueOrigin, '');

    const onRazor = await readSelectedCase(razorOrigin, razorHref);
    const onVue = await readSelectedCase(vueOrigin, vueHref);

    check(
      `following the Vue link for ${caseId} selects it on Razor`,
      JSON.stringify(onRazor.focused) === JSON.stringify([caseId]) && !onRazor.unknownCase,
      JSON.stringify(onRazor.focused),
    );
    check(
      `following the Razor link for ${caseId} selects it on Vue`,
      JSON.stringify(onVue.focused) === JSON.stringify([caseId]) && !onVue.unknownCase,
      JSON.stringify(onVue.focused),
    );
  }

  // --------------------------------------------------------- an address that is
  // not a case must look like one, on both platforms, rather than quietly
  // rendering a default.
  for (const component of components) {
    for (const [label, origin, path] of [
      ['Vue', vueOrigin, `${component.vuePath}?component=${component.name}&case=nothing/does-not-exist`],
      ['Razor', razorOrigin, `${component.razorPath}?component=${component.name}&case=nothing/does-not-exist`],
    ]) {
      const unknown = await readSelectedCase(origin, path);
      check(
        `${label} reports an unknown ${component.name} case instead of selecting a default`,
        unknown.unknownCase && unknown.focused.length === 0 && unknown.caseCount === component.caseIds.length,
        JSON.stringify(unknown),
      );
    }
  }

  // A component nobody implemented must not quietly fall back to one that is.
  const unknownComponentStatus = await probe(`${razorOrigin}/?component=VfNotMigrated`);
  check(
    'the Razor showcase refuses an unknown component instead of rendering a default',
    unknownComponentStatus === 404,
    `HTTP ${unknownComponentStatus}`,
  );
} finally {
  await chrome.close();
  // The whole group: PHP's built-in server forks workers, and killing only the
  // parent leaves them holding the port and this process open.
  for (const server of [vueServer, razorServer]) {
    try {
      process.kill(-server.pid, 'SIGKILL');
    } catch {
      server.kill('SIGKILL');
    }
  }
}

const report = {
  $comment: 'Full-route showcase report. Generated by scripts/ci/check-showcase-routes.mjs.',
  cases: Object.fromEntries(components.map((component) => [component.name, component.caseIds.length])),
  themes,
  components: frozenComponentNames.length,
  razorImplemented,
  assertions: passed.length + failures.length,
  failures,
  screenshots: Object.fromEntries(
    Object.entries(observations).map(([key, sides]) => [
      key,
      { vue: sides.vue.screenshot, razor: sides.razor.screenshot },
    ]),
  ),
};
writeFileSync(resolve(runDirectory, 'showcase-routes-report.json'), stableStringify(report));

process.stdout.write(
  `\n${components.map((component) => `${component.name} ${component.caseIds.length}`).join(', ')} ` +
    `shared cases x ${themes.length} themes x 2 platforms, ` +
    `${frozenComponentNames.length} catalog components.\n` +
    `Report: ${relative(repositoryRoot, resolve(runDirectory, 'showcase-routes-report.json'))}\n` +
    `${passed.length} assertion(s) passed.\n`,
);

if (failures.length > 0) {
  process.stderr.write(`\n[showcase-routes] FAILED with ${failures.length} failure(s):\n`);
  for (const failure of failures) process.stderr.write(`  - ${failure}\n`);
  process.exit(1);
}

process.stdout.write(
  '[showcase-routes] OK: both real showcases expose the same shared cases and link to each other.\n',
);
