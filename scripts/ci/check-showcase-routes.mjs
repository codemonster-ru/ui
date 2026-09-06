#!/usr/bin/env node
// Full-route gate for the two Input showcases (M08).
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
const catalog = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/input/cases.json'), 'utf8'));
const showcaseIndex = JSON.parse(readFileSync(resolve(repositoryRoot, 'examples/shared/showcase-index.json'), 'utf8'));
const inventory = JSON.parse(readFileSync(resolve(repositoryRoot, 'baseline/reference-inventory.json'), 'utf8'));

const caseIds = catalog.cases.map((parityCase) => parityCase.id);
const indexComponentNames = showcaseIndex.components.map((entry) => entry.name);
const frozenComponentNames = inventory.components.publicComponentNames;
const razorImplemented = showcaseIndex.components
  .filter((entry) => entry.platforms.razor.status === 'implemented')
  .map((entry) => entry.name);

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
  JSON.stringify(razorImplemented) === JSON.stringify(['VfInput']),
  razorImplemented.join(', '),
);
check(
  'the Razor case source points at the shared catalog',
  showcaseIndex.components.find((entry) => entry.name === 'VfInput')?.platforms.razor.caseSource ===
    'contracts/input/cases.json',
);

// The Razor case template repeats the vf-input tag once per slot combination,
// because the engine collects named slots at compile time. The prop lists must
// stay identical or the branches quietly render different components.
const casePartial = readFileSync(
  resolve(razorExample, 'views/partials/input-case.razor.php'),
  'utf8',
).replace(/\{\{--[\s\S]*?--\}\}/g, '');
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
async function readShowcase(origin, path, theme, label) {
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
        controls: cases.filter((element) => element.querySelector('input.vf-input')).length,
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
        razorRoots: document.querySelectorAll('[data-vf-razor="input"]').length,
        razorEnhanced: document.querySelectorAll('[data-vf-razor-enhanced]').length,
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
  await waitForOrigin(vueOrigin, '/input', 'The Vue showcase');
  await waitForOrigin(razorOrigin, '/', 'The Razor showcase');

  for (const theme of themes) {
    const vue = await readShowcase(vueOrigin, `/input?theme=${theme}`, theme, 'vue');
    const razor = await readShowcase(razorOrigin, `/?theme=${theme}`, theme, 'razor');
    observations[theme] = { vue, razor };

    // ---------------------------------------------------------- the same cases
    check(`[${theme}] the Vue page identifies itself`, vue.platform === 'vue' && vue.component === 'VfInput');
    check(`[${theme}] the Razor page identifies itself`, razor.platform === 'razor' && razor.component === 'VfInput');
    check(
      `[${theme}] the Vue showcase renders every shared case in catalog order`,
      JSON.stringify(vue.caseIds) === JSON.stringify(caseIds),
      `${vue.caseIds.length} of ${caseIds.length}`,
    );
    check(
      `[${theme}] the Razor showcase renders every shared case in catalog order`,
      JSON.stringify(razor.caseIds) === JSON.stringify(caseIds),
      `${razor.caseIds.length} of ${caseIds.length}`,
    );
    check(
      `[${theme}] every Vue case renders a real control`,
      vue.controls === caseIds.length,
      `${vue.controls} of ${caseIds.length}`,
    );
    check(
      `[${theme}] every Razor case renders a real control`,
      razor.controls === caseIds.length,
      `${razor.controls} of ${caseIds.length}`,
    );

    // ------------------------------------------------- the real Razor pipeline
    check(
      `[${theme}] every Razor case comes from the real adapter`,
      razor.razorRoots === caseIds.length,
      `${razor.razorRoots} ownership markers`,
    );
    check(
      `[${theme}] the packaged Razor controller enhanced every root`,
      razor.razorEnhanced === caseIds.length,
      `${razor.razorEnhanced} enhanced`,
    );
    check(
      `[${theme}] the Razor page loads the packaged stylesheet`,
      razor.stylesheets.includes('/assets/vueforge-razor.css'),
      razor.stylesheets.join(', '),
    );
    check(
      `[${theme}] the Razor page loads the packaged controller`,
      razor.scripts.includes('/assets/vueforge-razor.js'),
      razor.scripts.join(', '),
    );
    // The Vue page must not reach for the Razor delivery path, and the Razor
    // page must not reach for the Vue build. Either would make the two pages
    // share a runtime that the architecture keeps apart.
    check(
      `[${theme}] the Vue page loads no Razor asset`,
      [...vue.stylesheets, ...vue.scripts].every((href) => !/vueforge-razor/.test(href ?? '')),
    );
    check(
      `[${theme}] the Razor page loads no Vue build asset`,
      [...razor.stylesheets, ...razor.scripts].every((href) => !/\/assets\/(index|input)-/.test(href ?? '')),
    );

    // ------------------------------------------------------------- the catalog
    const expectedCatalog = showcaseIndex.components.map((entry) => [entry.name, entry.platforms.razor.status]);
    check(
      `[${theme}] the Vue catalog reports honest Razor support`,
      JSON.stringify(vue.catalog) === JSON.stringify(expectedCatalog),
    );
    check(
      `[${theme}] the Razor catalog reports honest Razor support`,
      JSON.stringify(razor.catalog) === JSON.stringify(expectedCatalog),
    );
    check(
      `[${theme}] unmigrated components stay listed as not implemented`,
      razor.catalog.filter(([, status]) => status === 'not-implemented').length === frozenComponentNames.length - 1,
    );

    // ---------------------------------------------------------------- the theme
    check(`[${theme}] the Razor page applies the requested theme`, razor.themeAttribute === theme);
    check(`[${theme}] the Vue page applies the requested theme`, vue.themeAttribute === theme);

    // ------------------------------------------------------- matching addresses
    const wrongVueLinks = caseIds.filter(
      (id) => vue.caseLinks[id] !== `${razorOrigin}/?component=VfInput&theme=${theme}&case=${encodeURIComponent(id)}`,
    );
    const wrongRazorLinks = caseIds.filter(
      (id) => razor.caseLinks[id] !== `${vueOrigin}/input?component=VfInput&theme=${theme}&case=${encodeURIComponent(id)}`,
    );
    check(
      `[${theme}] every Vue case links to the same Razor case`,
      wrongVueLinks.length === 0,
      wrongVueLinks.slice(0, 3).join(', '),
    );
    check(
      `[${theme}] every Razor case links to the same Vue case`,
      wrongRazorLinks.length === 0,
      wrongRazorLinks.slice(0, 3).join(', '),
    );

    check(
      `[${theme}] neither page reported a script error`,
      vue.diagnostics.pageErrors.length === 0 && razor.diagnostics.pageErrors.length === 0,
      [...vue.diagnostics.pageErrors, ...razor.diagnostics.pageErrors].join('; '),
    );
  }

  // ------------------------------------------------- following a matching link
  //
  // A link that resolves to the page but not to the case would look correct in
  // a screenshot. Both directions are followed for real.
  const sampled = ['input/clearable-filled', 'input/field-floating-filled', 'input/interaction-reveal'];
  for (const caseId of sampled) {
    // A case missing from one side is already reported above; say so here too
    // rather than crashing on an absent link, so the whole report survives.
    const vueLink = observations.light.vue.caseLinks[caseId];
    const razorLink = observations.light.razor.caseLinks[caseId];
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
  for (const [label, origin, path] of [
    ['Vue', vueOrigin, '/input?case=input/does-not-exist'],
    ['Razor', razorOrigin, '/?case=input/does-not-exist'],
  ]) {
    const unknown = await readSelectedCase(origin, path);
    check(
      `${label} reports an unknown case instead of selecting a default`,
      unknown.unknownCase && unknown.focused.length === 0 && unknown.caseCount === caseIds.length,
      JSON.stringify(unknown),
    );
  }
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
  cases: caseIds.length,
  themes,
  components: frozenComponentNames.length,
  razorImplemented,
  assertions: passed.length + failures.length,
  failures,
  screenshots: Object.fromEntries(
    Object.entries(observations).map(([theme, sides]) => [
      theme,
      { vue: sides.vue.screenshot, razor: sides.razor.screenshot },
    ]),
  ),
};
writeFileSync(resolve(runDirectory, 'showcase-routes-report.json'), stableStringify(report));

process.stdout.write(
  `\n${caseIds.length} shared cases x ${themes.length} themes x 2 platforms, ` +
    `${frozenComponentNames.length} catalog components.\n` +
    `Report: ${relative(repositoryRoot, resolve(runDirectory, 'showcase-routes-report.json'))}\n` +
    `${passed.length} assertion(s) passed.\n`,
);

if (failures.length > 0) {
  process.stderr.write(`\n[showcase-routes] FAILED with ${failures.length} failure(s):\n`);
  for (const failure of failures) process.stderr.write(`  - ${failure}\n`);
  process.exit(1);
}

process.stdout.write('[showcase-routes] OK: both real showcases expose the same shared cases and link to each other.\n');
