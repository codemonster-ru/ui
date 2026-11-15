import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SHOWCASE_PLAYWRIGHT || 'playwright');
const axe = require.resolve('axe-core/axe.min.js');
const browser = await chromium.launch({ executablePath: process.env.SHOWCASE_CHROME || undefined });
const output = process.env.SHOWCASE_CAPTURE_DIR;
const adapters = {
  vue: process.env.SHOWCASE_VUE_URL || 'http://127.0.0.1:4173/',
  vanilla: process.env.SHOWCASE_VANILLA_URL || 'http://127.0.0.1:4174/',
};
const viewports = new Map([
  [360, 800],
  [390, 844],
  [768, 1024],
  [1440, 900],
]);
const routes = [
  ['core', '', '.showcase-intro h1'],
  ['components', 'components/', '.reference-catalog h1'],
  ['button', 'components/button/', '[data-reference-preview="button"]'],
  ['data-table', 'components/data-table/#api', '#api'],
  ['docs', 'docs/', '.guide-header h1'],
  ['quick-start', 'docs/getting-started/#vue-quick-start', '#vue-quick-start'],
  ['workspace', 'examples/', '#release-workspace-title'],
  ['icons', 'icons/', '#icon-catalog'],
];
const representative = new Set([
  'core--1440--light',
  'core--360--dark',
  'components--1440--light',
  'button--390--dark',
  'docs--1440--light',
  'docs--1440--dark',
  'docs--360--dark',
  'workspace--1440--light',
  'workspace--360--dark',
]);
let visited = 0;
let accessibilityScans = 0;
let scans = [];

function url(base, path) {
  return new URL(path, base).href;
}

async function screenshot(page, name) {
  if (!output) return;
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(output, `${name}.png`), animations: 'disabled', caret: 'hide' });
}

async function checkViewport(page, label) {
  const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  assert.equal(layout.scroll, layout.width, `${label}: document reflows horizontally`);
  const clipped = await page
    .locator('.showcase-header button:visible, .showcase-navigation a:visible')
    .evaluateAll((items) =>
      items.some((item) => {
        const box = item.getBoundingClientRect();
        return box.left < 0 || box.right > innerWidth;
      }),
    );
  assert.equal(clipped, false, `${label}: clipped header controls`);
}

async function checkAccessibility(page, label) {
  await page.addScriptTag({ path: axe });
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run({ exclude: ['iframe'] });
    return result.violations.map(({ id, nodes }) => [id, nodes.map((node) => node.target)]);
  });
  scans.push([label, violations]);
  assert.deepEqual(violations, [], `${label}: axe violations`);
  accessibilityScans++;
}

async function checkNavigation(page, base, adapter, width) {
  const search = page.getByRole('button', { name: 'Search components and guides' });
  await page.goto(base);
  await page.locator('main h1').waitFor();
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(), 'Skip to content');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'showcase-main');

  const navigation = page.locator('#showcase-navigation');
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  if (width < 896) {
    assert.equal(await navigation.isVisible(), false);
    assert.equal(await menu.getAttribute('aria-expanded'), 'false');
    assert((await page.locator('.showcase-topbar').evaluate((header) => header.offsetHeight)) <= 72);
    await menu.tap();
    assert.equal(await menu.getAttribute('aria-expanded'), 'true');
    assert(
      await navigation.getByRole('link', { name: 'Overview' }).evaluate((link) => link === document.activeElement),
    );
    await checkViewport(page, `${adapter} open menu`);
    await screenshot(page, `${adapter}--menu--${width}--dark`);
    await page.keyboard.press('Escape');
    assert(await menu.evaluate((button) => button === document.activeElement));
    assert.equal(await navigation.isVisible(), false);
    await menu.tap();
  } else {
    assert(await navigation.isVisible());
    assert.equal(await menu.isVisible(), false);
  }
  await navigation.locator('summary').click();
  await navigation.getByRole('link', { name: 'Colors', exact: true }).click();
  assert.equal(page.url(), url(base, 'colors/'));
  await page.locator('.showcase-resources [aria-current="page"]').waitFor({ state: 'attached' });
  if (width < 896) await menu.tap();
  assert((await navigation.getByRole('link', { name: 'Colors', exact: true }).isVisible()) || width >= 896);
  if (width < 896) await menu.tap();

  await search.click();
  let dialog = page.getByRole('dialog', { name: 'Search components and guides' });
  const query = dialog.getByRole('searchbox');
  assert(await query.evaluate((input) => input === document.activeElement));
  await query.fill('zzzzzz no matching record');
  await dialog.getByText(/No matches/).waitFor();
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert(await search.evaluate((button) => button === document.activeElement));
  await search.click();
  await query.fill('CmDatePicker');
  const first = dialog.getByRole('link').first();
  await first.waitFor();
  assert.equal(await first.getAttribute('href'), url(base, 'components/date-picker/'));
  await page.keyboard.press('ArrowDown');
  assert(await first.evaluate((link) => link === document.activeElement));
  await page.keyboard.press('Escape');
  assert(await search.evaluate((button) => button === document.activeElement));

  await search.click();
  await query.fill('Vue quick start');
  const section = dialog.locator('a[href$="/getting-started/#vue-quick-start"]');
  await section.waitFor();
  await checkViewport(page, `${adapter} search results`);
  await checkAccessibility(page, `${adapter} search ${width}`);
  await screenshot(page, `${adapter}--search--${width}--dark`);
  await section.click();
  await page.locator('#vue-quick-start').waitFor();
  assert.equal(page.url(), url(base, 'docs/getting-started/#vue-quick-start'));
  await page.reload();
  await page.locator('#vue-quick-start').waitFor();
  await page.goBack();
  assert.equal(page.url(), url(base, 'colors/'));
  assert.equal(await dialog.isVisible(), false);
  await page.goForward();
  await page.locator('#vue-quick-start').waitFor();
  assert.equal(page.url(), url(base, 'docs/getting-started/#vue-quick-start'));
  assert.equal(await page.locator('.showcase-navigation [aria-current]').getAttribute('aria-current'), 'location');
}

try {
  if (output) await mkdir(output, { recursive: true });
  console.log(`Chrome ${browser.version()}`);
  await Promise.all(
    Object.entries(adapters).map(async ([adapter, base]) => {
      for (const [width, height] of viewports) {
        for (const theme of ['light', 'dark']) {
          const page = await browser.newPage({
            viewport: { width, height },
            deviceScaleFactor: 1,
            colorScheme: theme,
            reducedMotion: 'reduce',
            hasTouch: width < 600,
          });
          const errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
          page.on('response', (response) => {
            if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
          });
          page.setDefaultTimeout(10000);
          try {
            await page.addInitScript((mode) => localStorage.setItem('cm-showcase-theme', mode), theme);
            for (const [name, path, ready] of routes) {
              await page.goto(url(base, path));
              await page.locator(ready).first().waitFor();
              await page.locator(`html[data-cm-theme="${theme}"]`).waitFor({ state: 'attached' });
              await checkViewport(page, `${adapter} ${name} ${width} ${theme}`);
              visited++;
              const file = `${name}--${width}--${theme}`;
              if (representative.has(file)) await screenshot(page, `${adapter}--${file}`);
              if (
                ['components', 'button', 'docs', 'quick-start', 'workspace'].includes(name) &&
                ((width === 360 && theme === 'dark') || (width === 1440 && theme === 'light'))
              )
                await checkAccessibility(page, `${adapter} ${file}`);
              if (width === 360 && theme === 'dark' && name !== 'icons') {
                const scale = await page.addStyleTag({ content: 'html { font-size: 200%; }' });
                await checkViewport(page, `${adapter} ${name} at 200% text size`);
                await scale.evaluate((style) => style.remove());
              }
            }
            if ((width === 360 || width === 1440) && theme === 'dark')
              await checkNavigation(page, base, adapter, width);
            assert.deepEqual(errors, [], `${adapter} ${width} ${theme}: network/runtime errors`);
          } finally {
            await page.close();
          }
        }
      }
      console.log(
        `${adapter}: four widths, two themes, eight routes, and keyboard / touch navigation and search passed`,
      );
    }),
  );
  console.log(`${visited} route/width/theme combinations; ${accessibilityScans} axe scans.`);
} catch (error) {
  console.error(
    JSON.stringify(
      scans.filter(([, violations]) => violations.length),
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser.close();
}
