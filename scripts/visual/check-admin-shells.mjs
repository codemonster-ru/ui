import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';

export async function serveAdminFixtures(port = 0) {
  const { createSSRApp } = await import('vue');
  const { renderToString } = await import('vue/server-renderer');
  const { fixtureOptions, fixtureVanilla, fixtureVue } = await import('./admin-shells-fixture.mjs');
  const contracts = Object.fromEntries(
    await Promise.all(
      ['shell', 'layout'].map(async (component) => [
        component,
        (await readFile(resolve(import.meta.dirname, `../../contracts/admin-${component}/cases/default.html`), 'utf8'))
          .trim()
          .replace('<!-- prettier-ignore -->\n', ''),
      ]),
    ),
  );
  const bundle = await build({
    absWorkingDir: resolve(import.meta.dirname, '../..'),
    stdin: {
      contents: `import { createSSRApp } from 'vue';
import { createRuntime } from './examples/vanilla/runtime.mjs';
import { fixtureVue, fixtureOptions } from './scripts/visual/admin-shells-fixture.mjs';
import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-css/fonts.css';
import '@codemonster-ru/ui-css/styles.css';
const config = fixtureOptions(new URLSearchParams(location.search));
const root = document.querySelector('#fixture');
if (config.platform === 'vue') createSSRApp({ render: fixtureVue(config) }).mount(root);
else createRuntime().start(root);
root.dataset.ready = 'true';`,
      resolveDir: resolve(import.meta.dirname, '../..'),
    },
    bundle: true,
    define: { 'process.env.NODE_ENV': '"production"', 'import.meta.main': 'false' },
    format: 'esm',
    platform: 'browser',
    loader: { '.woff2': 'file' },
    outfile: 'fixture.js',
    write: false,
  });
  const assets = new Map(bundle.outputFiles.map((asset) => [asset.path.split('/').at(-1), asset.contents]));
  const mime = { js: 'text/javascript', css: 'text/css', woff2: 'font/woff2' };
  const styles = `
#fixture { --fixture-header-height: 64px; }
.cm-admin-shell__topbar > .cm-admin-shell__header { min-block-size: calc(var(--fixture-header-height) - 2 * var(--cm-space-2)); display: grid; align-items: center; }
.cm-admin-layout__header { block-size: auto; min-block-size: var(--fixture-header-height); }
.fixture-header { line-height: 1; }
.fixture-navigation { display: grid; gap: 6px; }
.fixture-navigation a { inline-size: max-content; max-inline-size: 100%; }
.fixture-spacer { block-size: 250px; }
.fixture-tail { block-size: 520px; }
.fixture-scroll { overflow: auto; block-size: 460px; margin: 50px 12px 24px; position: relative; transform: translateZ(0); border: 1px solid; }
.fixture-scroll-spacer { block-size: 96px; }
.fixture-nested { isolation: isolate; max-inline-size: 400px; }
html[data-fixture-safe] .cm-admin-layout__header { padding-block-start: calc(12px + var(--cm-space-2)); }`;
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      const name = url.pathname.slice(1);
      if (name) {
        const asset = assets.get(name);
        if (!asset) return response.writeHead(404).end();
        return response.writeHead(200, { 'Content-Type': mime[name.split('.').at(-1)] }).end(asset);
      }
      const config = fixtureOptions(url.searchParams);
      const content =
        config.platform === 'vue'
          ? await renderToString(createSSRApp({ render: fixtureVue(config) }))
          : fixtureVanilla(config, contracts);
      const html = `<!doctype html><html lang="en" data-cm-theme="${config.theme}"${config.safe ? ' data-fixture-safe' : ''} style="font-size:${config.zoom * 100}%"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Admin layout regressions</title><link rel="icon" href="data:,"><link rel="stylesheet" href="/fixture.css"><style>${styles}</style></head><body><div id="fixture" style="--fixture-header-height:${config.header}px">${content}</div><script type="module" src="/fixture.js"></script></body></html>`;
      return response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html);
    } catch (error) {
      response.writeHead(500).end(String(error));
    }
  });
  await new Promise((start, fail) => {
    server.once('error', fail);
    server.listen(port, '127.0.0.1', start);
  });
  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise((done) => server.close(done)) };
}

function boxes() {
  const root = document.querySelector('[data-fixture-subject]');
  const adminLayout = root.classList.contains('cm-admin-layout');
  const header = root.querySelector(adminLayout ? '.cm-admin-layout__header' : '.cm-admin-shell__topbar');
  const outer = document.querySelector('[data-fixture-outer] > .cm-admin-shell__topbar');
  const aside = root.querySelector(adminLayout ? '.cm-admin-layout__aside' : '.cm-admin-shell__sidebar');
  const mobile = root.querySelector('[data-cm-mobile-sidebar-toggle]');
  const backdrop = root.querySelector('.cm-admin-layout__mobile-backdrop');
  const scroll = document.querySelector('.fixture-scroll') ?? document.scrollingElement;
  const rect = (element) => {
    if (!element) return null;
    const { x, y, right, bottom, width, height } = element.getBoundingClientRect();
    const css = getComputedStyle(element);
    return {
      x,
      y,
      right,
      bottom,
      width,
      height,
      position: css.position,
      visibility: css.visibility,
      zIndex: css.zIndex,
      display: css.display,
      paddingTop: parseFloat(css.paddingTop),
      paddingRight: parseFloat(css.paddingRight),
      paddingBottom: parseFloat(css.paddingBottom),
      paddingLeft: parseFloat(css.paddingLeft),
    };
  };
  const active = document.activeElement;
  const first = document.querySelector('#subject-link-1');
  function hit(element, edge = false) {
    if (!element) return null;
    const { x, y, width, height } = element.getBoundingClientRect();
    const css = getComputedStyle(element);
    const ring =
      css.outlineStyle === 'none'
        ? 0
        : Math.max(0, (parseFloat(css.outlineWidth) || 0) + (parseFloat(css.outlineOffset) || 0));
    const top = edge ? y - Math.max(0, ring - 1) : y + height / 2;
    const positions = [
      [x + width / 2, top],
      [x + width / 2, y + height / 2],
    ];
    const hits = positions.map(([left, depth]) => document.elementFromPoint(left, depth));
    return {
      ring,
      ringTop: y - ring,
      ringBottom: y + height + ring,
      center: hits[1] === element || element.contains(hits[1]),
      coveredByDrawer: hits[1] === backdrop || aside?.contains(hits[1]),
      headerCoversRing: [header, outer].some((bar) => bar?.contains(hits[0])),
      blockedBy: hits[1]?.id || hits[1]?.className || hits[1]?.localName,
    };
  }
  const viewport = [innerWidth, innerHeight];
  const body = rect(root);
  return {
    viewport,
    header: rect(header),
    outerHeader: rect(outer),
    drawer: rect(aside),
    scroll: rect(scroll),
    scrollportTop: scroll === document.scrollingElement ? 0 : scroll.getBoundingClientRect().top + scroll.clientTop,
    scrollTop: scroll.scrollTop,
    root: body,
    scrollWidth: document.documentElement.scrollWidth,
    ready: document.querySelector('#fixture').dataset.ready === 'true',
    open: root.getAttribute('data-cm-mobile-sidebar-open'),
    first: { ...rect(first), ...hit(first) },
    toggle: { ...rect(mobile), ...hit(mobile) },
    focus: {
      id: active.id,
      toggle: active === mobile,
      inDrawer: aside?.contains(active),
      visibleStyle: active.matches(':focus-visible'),
      ...rect(active),
      ...hit(active, true),
    },
    backdrop: rect(backdrop),
    effectiveFont: getComputedStyle(document.documentElement).fontSize,
  };
}

const settle = (page) =>
  page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));

async function openScenario(page, base, scenario, open = false) {
  const url = new URL(base);
  url.search = new URLSearchParams({
    component: scenario.component,
    platform: scenario.platform,
    theme: scenario.theme,
    header: String(scenario.header),
    zoom: String(scenario.zoom),
    nested: String(scenario.nested),
    safe: String(Boolean(scenario.safe) && scenario.engine !== 'chromium'),
    open: String(open),
  });
  const response = await page.goto(url.href, { waitUntil: 'domcontentloaded' });
  if (!response?.ok()) throw new Error(`Fixture returned HTTP ${response?.status()} at ${url.pathname}`);
  if (!scenario.ssr) await page.locator('#fixture[data-ready=true]').waitFor();
  await page.evaluate(() => document.fonts.ready);
}

function verify(row, name, success) {
  row.checks[name] = Boolean(success);
}

async function shot(page, row, name, output) {
  if (!output) return;
  const representative =
    !process.env.ADMIN_CAPTURE_ALL &&
    !(
      row.safe ||
      row.width === 320 ||
      (row.width === 1440 && row.header === 120 && row.zoom === 1 && row.theme === 'light')
    );
  if (representative) return;
  const nameParts = [
    row.component,
    row.platform,
    row.theme,
    row.width,
    row.header,
    `zoom-${row.zoom}x`,
    row.nested ? 'nested' : 'standalone',
    row.ssr ? 'ssr' : 'enhanced',
    row.safe ? 'safe-area' : '',
    name,
  ].filter(Boolean);
  const file = nameParts.join('--') + '.png';
  await page.screenshot({ path: join(output, file), animations: 'disabled', caret: 'hide' });
  row.screenshots.push(file);
}

function focusExposed(measure) {
  const focus = measure.focus;
  const header = [measure.header, measure.outerHeader].filter(Boolean);
  const aboveHeaders = header.every((bar) => focus.ringTop >= bar.bottom - 0.5);
  const insideViewport = focus.ringTop >= 0 && focus.ringBottom <= measure.viewport[1] + 0.5;
  return (
    focus.visibleStyle && focus.ring > 0 && focus.center && !focus.headerCoversRing && aboveHeaders && insideViewport
  );
}

async function checkShell(page, row, output) {
  const measure = () => page.evaluate(boxes);
  row.initial = await measure();
  verify(
    row,
    'sticky header sizes to fixture slot',
    row.initial.header.height === row.header && row.initial.header.position === 'sticky',
  );
  verify(row, 'root text scale', row.initial.effectiveFont === `${16 * row.zoom}px`);
  if (row.ssr) {
    verify(
      row,
      'SSR emits both working regions',
      !row.initial.ready && row.initial.first.height > 0 && (await page.locator('#subject-next').count()) === 1,
    );
    await shot(page, row, 'static', output);
    return;
  }
  const next = page.locator('#subject-next');
  await next.evaluate((control) => {
    const settings = document.querySelector('#subject-link-6');
    const nested = control.closest('.fixture-scroll');
    const scroller = nested ?? document.scrollingElement;
    const scrollTop = nested ? nested.getBoundingClientRect().top + nested.clientTop : 0;
    scroller.scrollTop += settings.getBoundingClientRect().top - scrollTop;
    control.focus({ preventScroll: true });
  });
  row.scrolled = await measure();
  verify(row, 'the owning scrollport moved', row.scrolled.scrollTop > 100 && row.scrolled.header.position === 'sticky');
  await page.keyboard.press(row.reverseTab);
  await settle(page);
  row.reverse = await measure();
  verify(
    row,
    'Shift+Tab exposes Settings and its focus ring',
    row.reverse.focus.id === 'subject-link-6' && focusExposed(row.reverse),
  );
  await shot(page, row, 'shift-tab', output);
  await page.keyboard.press(row.tabKey);
  await settle(page);
  row.forward = await measure();
  verify(
    row,
    'Tab exposes the workspace control and its focus ring',
    row.forward.focus.id === 'subject-next' && focusExposed(row.forward),
  );
}

async function checkLayout(page, row, output) {
  const measure = () => page.evaluate(boxes);
  row.initial = await measure();
  verify(
    row,
    'header sizes naturally to fixture slot',
    row.initial.header.height >= row.header && row.initial.header.position === 'sticky',
  );
  verify(row, 'root text scale', row.initial.effectiveFont === `${16 * row.zoom}px`);
  const expectMobile = row.initial.root.width < 64 * parseFloat(row.initial.effectiveFont);
  const button = page.locator('[data-fixture-subject] [data-cm-mobile-sidebar-toggle]');
  const first = page.locator('#subject-link-1');
  if (!expectMobile) {
    verify(
      row,
      'desktop sidebar hits first link without a mobile toggle',
      row.initial.first.center && row.initial.toggle.width === 0,
    );
    await shot(page, row, 'desktop', output);
    return;
  }
  if (row.ssr) {
    verify(
      row,
      'SSR body and drawer state exist without enhancement',
      !row.initial.ready && row.initial.open === 'true' && row.initial.first.height > 0,
    );
    verify(
      row,
      'SSR first item is below the header and clickable',
      row.initial.first.center && row.initial.first.y >= row.initial.header.bottom - 0.5,
    );
    await shot(page, row, 'static-open', output);
    return;
  }
  verify(
    row,
    'initial drawer closed with pointer-visible toggle',
    row.initial.open === 'false' && row.initial.toggle.center,
  );
  await button.press('Enter');
  await settle(page);
  row.opened = await measure();
  const overlaysHeader = ({ root, outerHeader, scrollportTop, header, drawer, backdrop, toggle }) => {
    const top = Math.max(root.y, outerHeader?.bottom ?? 0, scrollportTop);
    return (
      Math.abs(drawer.y - top) <= 0.5 &&
      Math.abs(backdrop.y - top) <= 0.5 &&
      drawer.y < header.bottom &&
      toggle.coveredByDrawer
    );
  };
  if (row.safeArea) {
    const { header, toggle, drawer, first, viewport } = row.opened;
    verify(
      row,
      'actual safe area clears header controls, drawer content, and drawer bottom',
      header.paddingTop >= 36 &&
        header.paddingLeft >= 30 &&
        header.paddingRight >= 30 &&
        toggle.x >= 30 &&
        drawer.paddingTop >= 36 &&
        drawer.paddingBottom >= 24 &&
        first.x >= 30 &&
        first.right <= viewport[0] - 30,
    );
  }
  verify(
    row,
    'Enter opens a visible drawer and moves focus inside it',
    row.opened.open === 'true' &&
      row.opened.drawer.visibility === 'visible' &&
      row.opened.focus.inDrawer &&
      (await button.getAttribute('aria-expanded')) === 'true',
  );
  verify(row, 'drawer and backdrop start at the visible top and cover the header', overlaysHeader(row.opened));
  verify(row, 'first item receives a native pointer hit', row.opened.first.center);
  const main = page.locator('[data-fixture-subject] > .cm-admin-layout__main');
  verify(row, 'the header and content behind the backdrop are inert', (await main.getAttribute('inert')) !== null);
  await shot(page, row, 'opened', output);
  if (row.safe) {
    await page.evaluate(() => {
      (document.querySelector('.fixture-nested') ?? document.querySelector('#fixture')).style.setProperty(
        '--fixture-header-height',
        '158px',
      );
      (document.querySelector('.fixture-scroll') ?? document.scrollingElement).scrollTop += 72;
    });
    await settle(page);
    row.dynamic = await measure();
    verify(
      row,
      'open drawer covers the header after a resize and scroll',
      row.dynamic.header.height > row.opened.header.height &&
        row.dynamic.scrollTop > row.opened.scrollTop &&
        overlaysHeader(row.dynamic) &&
        row.dynamic.first.center,
    );
    await shot(page, row, 'resized-and-scrolled', output);
    await page.evaluate((oldScroll) => {
      (document.querySelector('.fixture-nested') ?? document.querySelector('#fixture')).style.setProperty(
        '--fixture-header-height',
        '120px',
      );
      (document.querySelector('.fixture-scroll') ?? document.scrollingElement).scrollTop = oldScroll;
    }, row.opened.scrollTop);
    await settle(page);
  }
  if (row.opened.first.center) {
    const { x, y, width, height } = row.opened.first;
    await page.mouse.click(x + width / 2, y + height / 2);
    await page.waitForURL((url) => url.hash === '#picked-subject-1', { timeout: 750 }).catch(() => {});
    verify(row, 'click activates the first item', new URL(page.url()).hash === '#picked-subject-1');
  } else verify(row, 'click activates the first item', false);
  await first.focus();
  await page.keyboard.press(row.tabKey);
  row.tab = await measure();
  await page.keyboard.press(row.reverseTab);
  row.shiftTab = await measure();
  verify(
    row,
    'navigation works in both directions within the drawer',
    row.tab.focus.id === 'subject-link-2' && row.shiftTab.focus.id === 'subject-link-1' && row.shiftTab.focus.center,
  );
  await page.keyboard.press('Escape');
  await settle(page);
  row.escaped = await measure();
  verify(
    row,
    'Escape closes drawer and returns focus to the toggle',
    row.escaped.open === 'false' &&
      row.escaped.focus.toggle &&
      (await button.getAttribute('aria-expanded')) === 'false',
  );
  verify(row, 'the main column is interactive again after Escape', (await main.getAttribute('inert')) === null);
  const { x, y, width, height } = row.escaped.toggle;
  await page.mouse.click(x + width / 2, y + height / 2);
  await settle(page);
  row.pointerOpened = await measure();
  verify(row, 'pointer activation opens drawer', row.pointerOpened.open === 'true');
  const backdropPoint = await page.evaluate(
    (safeInset) => {
      const root = document.querySelector('[data-fixture-subject]');
      const backdrop = root.querySelector('.cm-admin-layout__mobile-backdrop');
      const bounds = backdrop.getBoundingClientRect();
      const drawer = root.querySelector('.cm-admin-layout__aside').getBoundingClientRect();
      const scrollport = root.closest('.fixture-scroll')?.getBoundingClientRect();
      const left = Math.max(bounds.left, scrollport?.left ?? 0, safeInset);
      const right = Math.min(
        bounds.right,
        scrollport?.right ?? innerWidth,
        document.documentElement.clientWidth - safeInset,
      );
      const top = Math.max(bounds.top, scrollport?.top ?? 0, 0);
      const bottom = Math.min(bounds.bottom, scrollport?.bottom ?? innerHeight, innerHeight);
      if (bottom <= top) return null;
      const gaps = [
        [left, Math.min(drawer.left, right)],
        [Math.max(drawer.right, left), right],
      ];
      for (const [start, end] of gaps) {
        if (end <= start) continue;
        const x = (start + end) / 2;
        const y = (top + bottom) / 2;
        if (document.elementFromPoint(x, y) === backdrop) return { x, y };
      }
      return null;
    },
    row.safeArea ? 30 : 0,
  );
  row.backdropPoint = backdropPoint;
  if (backdropPoint) {
    await page.evaluate(() => {
      window.fixtureBackdropClick = null;
      document.addEventListener(
        'click',
        (event) => {
          window.fixtureBackdropClick = { trusted: event.isTrusted, target: event.target.className };
        },
        { capture: true, once: true },
      );
    });
    await page.mouse.click(backdropPoint.x, backdropPoint.y);
    await page
      .waitForFunction(
        () => document.querySelector('[data-fixture-subject]').dataset.cmMobileSidebarOpen === 'false',
        null,
        { timeout: 1200 },
      )
      .catch(() => {});
    row.backdropClick = await page.evaluate(() => window.fixtureBackdropClick);
  }
  await settle(page);
  row.backdropClosed = await measure();
  verify(
    row,
    'the backdrop receives a native pointer hit, closes the drawer and restores focus',
    backdropPoint &&
      row.backdropClick?.trusted &&
      row.backdropClick.target === 'cm-admin-layout__mobile-backdrop' &&
      row.backdropClosed.open === 'false' &&
      row.backdropClosed.focus.toggle,
  );
}

async function runMatrix() {
  const require = createRequire(import.meta.url);
  const playwright = require(process.env.SHOWCASE_PLAYWRIGHT || 'playwright');
  const engine = process.env.SHOWCASE_BROWSER || 'chromium';
  const stage = process.env.ADMIN_STAGE || 'after';
  const output = process.env.ADMIN_CAPTURE_DIR;
  if (output) await mkdir(output, { recursive: true });
  const fixture = process.env.ADMIN_FIXTURE_URL ? null : await serveAdminFixtures();
  const base = process.env.ADMIN_FIXTURE_URL || fixture.url;
  const browser = await playwright[engine].launch({
    executablePath:
      engine === 'chromium'
        ? process.env.SHOWCASE_CHROME
        : engine === 'webkit'
          ? process.env.SHOWCASE_WEBKIT
          : undefined,
  });
  const rows = [];
  const platforms = ['vue', 'vanilla'];
  const themes = process.env.ADMIN_QUICK ? ['light'] : ['light', 'dark'];
  const widths = process.env.ADMIN_QUICK ? [320] : [320, 390, 1440];
  const heights = [64, 120];
  const matrix = [];
  for (const component of ['shell', 'layout'])
    for (const platform of platforms)
      for (const theme of themes) {
        for (const width of widths)
          for (const header of heights)
            for (const nested of [false, true])
              for (const zoom of [1, 2]) {
                matrix.push({ component, platform, theme, width, header, nested, zoom });
              }
        if (!process.env.ADMIN_QUICK) {
          for (const header of heights)
            for (const nested of [false, true])
              matrix.push({ component, platform, theme, width: 320, header, nested, zoom: 2, ssr: true });
          if (component === 'layout')
            for (const nested of [false, true])
              matrix.push({ component, platform, theme, width: 390, header: 120, nested, zoom: 2, safe: true });
        }
      }
  if (process.env.ADMIN_SAFE_ONLY) {
    const safeScenarios = matrix.filter((scenario) => scenario.safe);
    matrix.splice(0, matrix.length, ...safeScenarios);
  }
  try {
    await Promise.all(
      Array.from({ length: 4 }, async () => {
        while (matrix.length) {
          const scenario = matrix.shift();
          const tabKey = engine === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
          const row = {
            ...scenario,
            engine,
            tabKey,
            reverseTab: `Shift+${tabKey}`,
            checks: {},
            screenshots: [],
            errors: [],
          };
          rows.push(row);
          const page = await browser.newPage({
            viewport: { width: scenario.width, height: scenario.width === 1440 ? 830 : 680 },
            colorScheme: scenario.theme,
            reducedMotion: 'reduce',
            javaScriptEnabled: !scenario.ssr,
          });
          page.setDefaultTimeout(5000);
          page.on('pageerror', (error) => row.errors.push(error.message));
          page.on('console', (message) => {
            if (message.type() === 'error' && /hydrat|mismatch/i.test(message.text())) row.errors.push(message.text());
          });
          try {
            if (scenario.safe && engine === 'chromium') {
              const session = await page.context().newCDPSession(page);
              await session.send('Emulation.setSafeAreaInsetsOverride', {
                insets: { top: 36, bottom: 24, left: 30, right: 30 },
              });
            }
            await openScenario(page, base, row, row.component === 'layout' && row.ssr);
            if (scenario.safe && engine === 'chromium') {
              row.safeArea = await page.evaluate(() => {
                const probe = document.createElement('div');
                probe.style.cssText =
                  'position:absolute;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
                document.body.append(probe);
                const padding = getComputedStyle(probe).padding;
                probe.remove();
                return padding;
              });
              verify(row, 'native safe-area values reached CSS', row.safeArea === '36px 30px 24px');
            }
            if (scenario.component === 'shell') await checkShell(page, row, output);
            else await checkLayout(page, row, output);
          } catch (error) {
            row.errors.push(error.message);
          } finally {
            await page.close();
          }
        }
      }),
    );
  } finally {
    const version = browser.version();
    await browser.close();
    await fixture?.close();
    const failures = rows.filter((row) => row.errors.length || Object.values(row.checks).some((value) => !value));
    console.log(`${stage} ${engine} ${version}: ${rows.length - failures.length}/${rows.length} scenarios pass`);
    if (output)
      await writeFile(
        join(output, 'regression-matrix.json'),
        JSON.stringify({ stage, engine, version, rows }, null, 2) + '\n',
      );
    for (const row of failures)
      console.log(
        JSON.stringify({
          component: row.component,
          platform: row.platform,
          theme: row.theme,
          width: row.width,
          header: row.header,
          nested: row.nested,
          zoom: row.zoom,
          ssr: row.ssr,
          failed: Object.keys(row.checks).filter((key) => !row.checks[key]),
          errors: row.errors,
        }),
      );
    if (failures.length) process.exitCode = 1;
  }
}

if (process.argv[2] && /^\d+$/.test(process.argv[2])) {
  const fixture = await serveAdminFixtures(Number(process.argv[2]));
  console.log(fixture.url);
} else {
  await runMatrix();
}
