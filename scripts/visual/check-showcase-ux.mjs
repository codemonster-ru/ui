import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const browserName = process.env.SHOWCASE_BROWSER || 'chromium';
if (!['chromium', 'firefox', 'webkit'].includes(browserName))
  throw new Error(`Unsupported showcase browser: ${browserName}`);
const playwright = require(process.env.SHOWCASE_PLAYWRIGHT || 'playwright');
const axe = require.resolve('axe-core/axe.min.js');
const browser = await playwright[browserName].launch({
  executablePath: browserName === 'chromium' ? process.env.SHOWCASE_CHROME || undefined : undefined,
});
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
let calendarContrastScans = 0;
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

async function checkReferenceFrames(page, base, adapter) {
  const preview = page.locator('.reference-preview iframe').first();
  const demo = preview.contentFrame().locator('.showcase-demo:not([inert])');

  if (adapter === 'vue') {
    await page.goto(url(base, 'components/nav-menu/'));
    await demo.waitFor();
    assert(await demo.evaluate(() => document.documentElement.scrollHeight <= innerHeight));
  } else {
    await page.goto(url(base, 'components/admin-shell/'));
    await demo.waitFor();
    await demo.evaluate(async () => {
      for (let count = 0; count < 6; count++) await new Promise(requestAnimationFrame);
    });
    // The fixture fills its viewport, so the parent must never size the viewport from the fixture.
    assert.equal(await preview.evaluate((frame) => frame.style.blockSize), '');
  }
}

async function checkDatePickerContrast(page, base, adapter) {
  await page.goto(url(base, 'components/date-picker/'));
  await page.getByText('More examples and states', { exact: true }).click();
  for (const [variant, selector] of [
    ['default', '.reference-preview iframe'],
    ['portal', '.reference-variants iframe[title$=" · portal preview"]'],
  ]) {
    const preview = page.locator(selector);
    await preview.scrollIntoViewIfNeeded();
    const frame = await (await preview.elementHandle()).contentFrame();
    await frame.locator('.showcase-demo:not([inert])').getByRole('combobox').press('ArrowDown');
    await frame.getByRole('dialog').waitFor();
    await frame.addScriptTag({ path: axe });
    const violations = await frame.evaluate(async () => {
      const result = await window.axe.run('.cm-date-picker__calendar', { runOnly: ['color-contrast'] });
      return result.violations.map(({ id, nodes }) => [id, nodes.map((node) => node.target)]);
    });
    const label = `${adapter} dark DatePicker (${variant})`;
    scans.push([label, violations]);
    assert.deepEqual(violations, [], `${label}: axe violations`);
    calendarContrastScans++;
  }
}

async function checkReferenceInteractions(page, base, adapter) {
  const preview = page.locator('.reference-preview');
  const frame = preview.locator('iframe').contentFrame();
  const demo = frame.locator('.showcase-demo:not([inert])');

  await page.goto(url(base, 'components/select/'));
  const trigger = demo.getByRole('combobox', { name: 'Frequency' });
  await trigger.press('ArrowDown');
  const listbox = demo.getByRole('listbox');
  await listbox.waitFor();
  assert(await listbox.getByRole('option', { name: 'Daily' }).evaluate((option) => option === document.activeElement));
  const { top, left, right, bottom, width, height } = await listbox.evaluate((element) => {
    const { top, left, right, bottom } = element.getBoundingClientRect();
    return { top, left, right, bottom, width: innerWidth, height: innerHeight };
  });
  assert(top >= 0 && left >= 0 && right <= width && bottom <= height, `${adapter}: Select listbox fits its frame`);
  assert(height - bottom < 64, `${adapter}: Select preview has less than 64 px of space below the open listbox`);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  assert.match(await trigger.textContent(), /Weekly/);
  assert(await trigger.evaluate((button) => button === document.activeElement));

  await page.goto(url(base, 'components/data-table/'));
  const header = demo.getByRole('columnheader', { name: /Name/ });
  const rows = demo.locator('tbody tr td:first-child');
  await header.waitFor();
  assert.equal(await header.getAttribute('aria-sort'), 'none');
  assert.deepEqual(await rows.allTextContents(), ['Apollo', 'Zephyr']);
  for (const [direction, order] of [
    ['ascending', ['Apollo', 'Zephyr']],
    ['descending', ['Zephyr', 'Apollo']],
    ['none', ['Apollo', 'Zephyr']],
  ]) {
    await header.getByRole('button').press('Enter');
    await header.and(demo.locator(`[aria-sort="${direction}"]`)).waitFor();
    assert.deepEqual(await rows.allTextContents(), order, `${adapter}: DataTable row order for ${direction}`);
  }

  for (const [slug, title, description] of [
    ['dialog', 'Dialog', 'A confirmation dialog for deleting a project.'],
    ['drawer', 'Drawer', 'A drawer for filter controls.'],
  ]) {
    await page.goto(url(base, `components/${slug}/`));
    await demo.getByRole('button', { name: `Open ${title}` }).press('Enter');
    await demo.getByRole('dialog').waitFor();
    assert.equal(await preview.locator('article > p').textContent(), description, `${adapter}: ${title} caption`);
  }
}

async function checkNavigation(page, base, adapter, width) {
  const search = page.getByRole('button', { name: 'Search components and guides' });
  await page.goto(base);
  await page.locator('main h1').waitFor();
  await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab');
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
  await query.fill('Vue');
  const installation = dialog.locator('a[href$="/getting-started/#install-a-local-20-build"]');
  const section = dialog.locator('a[href$="/getting-started/#vue-quick-start"]');
  await installation.waitFor();
  await section.waitFor();
  assert.deepEqual(await dialog.getByRole('link').evaluateAll((links) => links.slice(0, 2).map(({ hash }) => hash)), [
    '#install-a-local-20-build',
    '#vue-quick-start',
  ]);
  await query.fill('Vue quick start');
  await section.waitFor();
  await checkViewport(page, `${adapter} search results`);
  await checkAccessibility(page, `${adapter} search ${width}`);
  await screenshot(page, `${adapter}--search--${width}--dark`);
  await section.click();
  await page.locator('#vue-quick-start').waitFor();
  assert.equal(page.url(), url(base, 'docs/getting-started/#vue-quick-start'));
  // Exercise the browser's native reload of the fragment URL before testing Back and Forward.
  await Promise.all([
    page.waitForEvent('framenavigated', { predicate: (frame) => frame === page.mainFrame() }),
    page.evaluate(() => setTimeout(() => location.reload(), 0)),
  ]);
  await page.locator('#vue-quick-start').waitFor();
  await page.goBack();
  assert.equal(page.url(), url(base, 'colors/'));
  assert.equal(await dialog.isVisible(), false);
  await page.goForward();
  await page.locator('#vue-quick-start').waitFor();
  assert.equal(page.url(), url(base, 'docs/getting-started/#vue-quick-start'));
  assert.equal(await page.locator('.showcase-navigation [aria-current]').getAttribute('aria-current'), 'location');
}

async function checkAdapter([adapter, base]) {
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
        if (width === 360 && theme === 'dark') {
          await checkReferenceFrames(page, base, adapter);
          await checkDatePickerContrast(page, base, adapter);
        }
        if ((width === 360 && theme === 'dark') || (width === 1440 && theme === 'light'))
          await checkReferenceInteractions(page, base, adapter);
        if ((width === 360 || width === 1440) && theme === 'dark') await checkNavigation(page, base, adapter, width);
        assert.deepEqual(errors, [], `${adapter} ${width} ${theme}: network/runtime errors`);
      } finally {
        await page.close();
      }
    }
  }
  console.log(`${adapter}: four widths, two themes, eight routes, and keyboard / touch navigation and search passed`);
}

try {
  if (output) await mkdir(output, { recursive: true });
  console.log(`${browserName} ${browser.version()}`);
  const entries = Object.entries(adapters);
  if (browserName === 'firefox') {
    // Concurrent adapter pages compete for focus, which can suppress keyboard activation in an iframe.
    for (const entry of entries) await checkAdapter(entry);
  } else {
    await Promise.all(entries.map(checkAdapter));
  }
  console.log(
    `${visited} route/width/theme combinations; ${accessibilityScans} page axe scans; ${calendarContrastScans} dark calendar contrast scans.`,
  );
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
