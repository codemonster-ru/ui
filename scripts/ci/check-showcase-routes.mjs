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
};

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
      'VfAvatar',
      'VfBadge',
      'VfButton',
      'VfCard',
      'VfCheckbox',
      'VfDivider',
      'VfField',
      'VfIconButton',
      'VfInput',
      'VfPanel',
      'VfRadio',
      'VfSkeleton',
      'VfSkeletonGate',
      'VfSwitch',
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
    const enhanced = ['VfInput', 'VfField', 'VfTextarea'].includes(name);

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
        `[${name}/${theme}] every Vue case renders a real control`,
        vue.controls === componentCaseIds.length,
        `${vue.controls} of ${componentCaseIds.length}`,
      );
      check(
        `[${name}/${theme}] every Razor case renders a real control`,
        razor.controls === componentCaseIds.length,
        `${razor.controls} of ${componentCaseIds.length}`,
      );

      // ------------------------------------------------- the real Razor pipeline
      if (enhanced) {
        check(
          `[${name}/${theme}] every Razor case comes from the real adapter`,
          razor.razorRoots === componentCaseIds.length,
          `${razor.razorRoots} ownership markers`,
        );
        check(
          `[${name}/${theme}] the packaged Razor controller enhanced every root`,
          razor.razorEnhanced === componentCaseIds.length,
          `${razor.razorEnhanced} enhanced`,
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
