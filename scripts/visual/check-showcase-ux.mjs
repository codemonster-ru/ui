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
  [320, 800],
  [360, 800],
  [390, 844],
  [768, 1024],
  [1440, 900],
]);
const routes = [
  ['core', '', '.showcase-intro h1'],
  ['core-alias', 'core/', '.showcase-intro h1'],
  ['button', 'components/button/', '[data-reference-preview="button"]'],
  ['data-table', 'components/data-table/#api', '#api'],
  ['icons', 'icons/', '#icon-catalog'],
];
const representative = new Set(['core--1440--light', 'core--360--dark', 'button--390--dark']);
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
    .locator('.showcase-brand:visible, .showcase-header button:visible, #showcase-navigation:visible')
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
  const sections = await page
    .locator('.reference-section > h2')
    .evaluateAll((headings) => headings.map(({ id }) => id));
  assert.deepEqual(
    sections.slice(0, 3),
    ['preview', 'variants', 'usage'],
    `${adapter}: states follow the live preview`,
  );
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
  const referenceNav = page.getByRole('navigation', { name: 'Component reference sections' });
  await referenceNav.getByRole('link', { name: 'API reference', exact: true }).press('Enter');
  assert.equal(new URL(page.url()).hash, '#api');
  await page.locator('#api:focus').waitFor();
  const header = demo.getByRole('columnheader', { name: /Name/ });
  const rows = demo.locator('tbody tr td:first-child');
  await header.waitFor();
  assert.equal(await header.getAttribute('aria-sort'), 'none');
  assert.deepEqual(await rows.allTextContents(), ['Apollo', 'Zephyr']);
  if (page.viewportSize().width === 360) {
    const scrolls = await demo
      .locator('.cm-data-table__scroll')
      .evaluate((table) => table.scrollWidth > table.clientWidth);
    assert.equal(scrolls, false, `${adapter}: the two-column DataTable fits the narrow preview`);
  }
  for (const direction of ['ascending', 'descending', 'none']) {
    await header.getByRole('button').press('Enter');
    await header.and(demo.locator(`[aria-sort="${direction}"]`)).waitFor();
    assert.deepEqual(
      await rows.allTextContents(),
      ['Apollo', 'Zephyr'],
      `${adapter}: manual sorting preserves row order`,
    );
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

async function checkLayoutViewport(page, base, adapter) {
  await page.goto(url(base, 'layouts/'));
  const example = page.locator('#demo-app-shell');
  const frame = example.locator('iframe.layout-preview__frame');
  await frame.scrollIntoViewIfNeeded();
  const preview = frame.contentFrame();
  const tab = preview.getByRole('tab', { name: 'Sidebar + content + aside' });
  await tab.waitFor();
  const previewDocument = await (await frame.elementHandle()).contentFrame();
  await previewDocument.waitForLoadState('load');
  await tab.click();
  const aside = preview.locator('.cm-app-shell__aside:not([hidden])');
  await aside.waitFor({ state: 'attached' });

  await example.getByRole('radio', { name: 'lg · 1024 px' }).press('Space');
  await expectPreviewWidth(frame, 1024);
  assert.equal(await aside.evaluate((region) => getComputedStyle(region).display), 'none');

  await example.getByRole('radio', { name: 'xl · 1280 px' }).press('Space');
  await expectPreviewWidth(frame, 1280);
  await aside.waitFor({ state: 'visible' });
  assert.equal(await tab.getAttribute('aria-selected'), 'true', `${adapter}: resizing preserves layout selection`);
  await checkViewport(page, `${adapter} layouts`);
}

async function checkWarehouse(page, base, adapter) {
  await page.goto(url(base, 'layouts/'));
  const layoutNav = page.getByRole('navigation', { name: 'Layout examples', exact: true });
  await layoutNav.getByRole('link', { name: 'Warehouse workspace', exact: true }).press('Enter');
  assert.equal(new URL(page.url()).hash, '#demo-admin-shell');
  const example = page.locator('#demo-admin-shell');
  await example.and(page.locator(':focus')).waitFor();
  assert.equal(await page.locator('.layout-guide-entry h2').first().textContent(), 'Warehouse workspace');
  const preview = example.locator('iframe.layout-preview__frame');
  await preview.scrollIntoViewIfNeeded();
  const frame = preview.contentFrame();
  const table = frame.getByRole('table', { name: 'Warehouse availability', exact: true });
  const scrollArea = table.locator('..');
  const header = table.getByRole('columnheader', { name: 'Available', exact: true });
  const available = table.locator('tbody tr:visible td:nth-child(4)');
  const pagination = frame.getByRole('navigation', { name: 'Table pagination', exact: true });
  await table.waitFor();
  await frame.locator('#showcase-warehouse[data-cm-data-table-page-count="2"]').waitFor();
  assert.equal(await scrollArea.getAttribute('tabindex'), '0', `${adapter}: the table viewport is keyboard focusable`);
  assert.equal(await header.evaluate((cell) => getComputedStyle(cell).textAlign), 'end');
  assert.deepEqual(await available.allTextContents(), ['24', '0', '7', '31', '16']);
  assert.equal(await available.first().evaluate((cell) => getComputedStyle(cell).textAlign), 'end');
  assert.deepEqual(await table.locator('tbody .cm-tag--danger:visible').allTextContents(), ['Out of stock']);
  assert.deepEqual(await table.locator('tbody .cm-tag--warning:visible').allTextContents(), ['Low stock']);
  await pagination.getByRole('button', { name: 'Next page' }).press('Enter');
  await pagination.getByText('Page 2 of 2', { exact: true }).waitFor();
  assert.deepEqual(await available.allTextContents(), ['4', '12'], `${adapter}: page two renders remaining rows`);
  const size = pagination.getByRole('combobox', { name: 'Rows per page' });
  await size.selectOption('10');
  await pagination.getByText('Page 1 of 1', { exact: true }).waitFor();
  assert.equal(await available.count(), 7, `${adapter}: changing page size resets pagination`);

  await example.getByRole('radio', { name: 'min · 320 px' }).press('Space');
  await expectPreviewWidth(preview, 320);
  assert.equal(await available.count(), 7, `${adapter}: warehouse data survives reflow`);
  assert(
    await scrollArea.evaluate((area) => area.scrollWidth > area.clientWidth),
    `${adapter}: the five-column warehouse table scrolls at 320 px`,
  );
  await checkViewport(page, `${adapter} warehouse preview`);
  await screenshot(page, `${adapter}--warehouse--320--dark`);
}

async function expectPreviewWidth(frame, width) {
  await frame.evaluate(async (iframe, expectedWidth) => {
    for (let attempt = 0; attempt < 20 && iframe.contentWindow.innerWidth !== expectedWidth; attempt++) {
      await new Promise(requestAnimationFrame);
    }
  }, width);
  assert.equal(await frame.evaluate((iframe) => iframe.contentWindow.innerWidth), width);
}

async function checkNavigation(page, base, adapter, width) {
  if (width === 360) {
    for (const path of [
      'components/',
      'examples/',
      'docs/',
      'docs/getting-started/',
      'showcase-search.json',
      'codeblock/',
      'playground/',
    ]) {
      const response = await page.request.get(url(base, path));
      assert.equal(response.status(), 404, `${adapter}: ${path} was removed`);
    }
  }
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1, name: 'CodeMonster UI' }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  const header = page.locator('.showcase-header');
  assert.equal(await header.getByRole('button', { name: /search|^menu$/i, includeHidden: true }).count(), 0);
  await header.locator('.showcase-theme').waitFor();
  const [brandCenter, themeCenter] = await header.locator('.showcase-brand, .showcase-theme').evaluateAll((items) =>
    items.map((item) => {
      const { top, height } = item.getBoundingClientRect();
      return top + height / 2;
    }),
  );
  assert(Math.abs(brandCenter - themeCenter) <= 1, `${adapter} ${width}: brand and theme switch align vertically`);
  const tabKey = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  await page.keyboard.press(tabKey);
  assert.equal(await page.locator(':focus').textContent(), 'Skip to content');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'showcase-main');

  const navigation = page.locator('#showcase-navigation');
  const links = navigation.getByRole('link');
  assert(await navigation.isVisible());
  assert.equal(await navigation.locator('details, summary').count(), 0);
  assert.deepEqual(await links.allTextContents(), ['Visual matrix', 'Layouts', 'Colors', 'Icons']);
  assert.equal(await navigation.locator('a.cm-link').count(), await links.count());
  const tops = await links.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().top));
  assert.equal(new Set(tops).size, 1, `${adapter}: navigation links fit on one row`);
  await checkViewport(page, `${adapter} navigation ${width}`);

  const lastLinkClipped = await links.last().evaluate((link) => {
    return link.getBoundingClientRect().right > link.closest('nav').getBoundingClientRect().right + 1;
  });
  assert.equal(lastLinkClipped, false, `${adapter} ${width}: all routes fit at default text size`);
  const scale = await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  await checkViewport(page, `${adapter} navigation at 200% text size`);
  await links.first().focus();
  for (const link of (await links.all()).slice(1)) {
    await page.keyboard.press(tabKey);
    assert(await link.evaluate((anchor) => anchor === document.activeElement));
  }
  const lastLinkIsVisible = await links.last().evaluate((link) => {
    const linkBounds = link.getBoundingClientRect();
    const navBounds = link.closest('nav').getBoundingClientRect();
    return linkBounds.left >= navBounds.left - 1 && linkBounds.right <= navBounds.right + 1;
  });
  assert(lastLinkIsVisible, `${adapter}: keyboard focus scrolls the last link into view`);
  await scale.evaluate((style) => style.remove());
  await checkHome(page, adapter);
  await checkSectionNavigation(page, adapter);
  await screenshot(page, `${adapter}--navigation--${width}--dark`);

  const colors = navigation.getByRole('link', { name: 'Colors', exact: true });
  if (width < 600) {
    await colors.tap();
  } else {
    await colors.focus();
    await page.keyboard.press('Enter');
  }
  await colors.and(page.locator('[aria-current="page"]')).waitFor();
  assert.equal(page.url(), url(base, 'colors/'));

  await page.goto(url(base, 'components/date-picker/'));
  await page.locator('[data-reference-preview="date-picker"]').waitFor();
  assert.equal(page.url(), url(base, 'components/date-picker/'));
  assert.equal(
    await page.getByRole('link', { name: 'Developer guide', exact: true }).first().getAttribute('href'),
    'https://github.com/codemonster-ru/ui/blob/main/docs/components/advanced-inputs.md#datepicker',
  );
  await page
    .getByRole('navigation', { name: 'Breadcrumb' })
    .getByRole('link', { name: 'Visual matrix', exact: true })
    .click();
  await page.getByRole('heading', { level: 1, name: 'CodeMonster UI' }).waitFor();
  assert.equal(page.url(), url(base, 'core/'));
}

async function checkHome(page, adapter) {
  const catalog = page.getByRole('region', { name: 'Component catalog' });
  const links = await catalog
    .locator('a')
    .evaluateAll((anchors) => anchors.map((anchor) => new URL(anchor.href).pathname));
  assert.equal(links.length, 64, `${adapter}: the catalog includes every documented component`);
  assert.equal(new Set(links).size, links.length, `${adapter}: component links are unique`);
  assert(links.includes('/components/confirm-dialog/') && links.includes('/components/theme-provider/'));
  await page.getByRole('link', { name: 'Browse components', exact: true }).press('Enter');
  assert.equal(new URL(page.url()).hash, '#component-catalog');
  assert.equal(await catalog.evaluate((section) => section === document.activeElement), true);
  const disclosures = catalog.locator('summary');
  await disclosures.first().press('Enter');
  assert.equal(await disclosures.first().evaluate((summary) => summary.parentElement.open), true);
  await disclosures.first().press('Enter');
  const feature = page.getByRole('region', { name: 'Live data table example' });
  await feature.getByRole('button', { name: 'Sort Name ascending' }).click();
  await feature.getByRole('button', { name: 'Sort Name descending' }).click();
  assert.equal(await feature.locator('tbody tr').first().locator('td').first().textContent(), 'Zephyr');
  await page.goBack();
}

async function checkSectionNavigation(page, adapter) {
  const sectionNav = page.getByRole('navigation', { name: 'Component state sections', exact: true });
  const entries = await sectionNav.getByRole('link').evaluateAll((anchors) =>
    anchors.map((anchor) => {
      const section = document.getElementById(anchor.hash.slice(1));
      return [anchor.textContent, section?.querySelector('h2')?.textContent, section?.tabIndex];
    }),
  );
  assert.equal(entries.length, 9, `${adapter}: section index covers the complete matrix`);
  for (const [link, title, tabIndex] of entries) {
    assert.equal(link, title, `${adapter}: section link names the linked heading`);
    assert.equal(tabIndex, -1, `${adapter}: section is a programmatic focus target`);
  }
  const link = sectionNav.getByRole('link', { name: 'Forms', exact: true });
  await link.press('Enter');
  assert.equal(new URL(page.url()).hash, '#forms');
  const destination = page.locator('#forms');
  assert.equal(await destination.evaluate((element) => element === document.activeElement), true);
  assert(
    await destination.evaluate((section) => {
      const top = section.querySelector('h2').getBoundingClientRect().top;
      const topbar = document.querySelector('.showcase-topbar');
      return top >= Math.max(0, topbar.getBoundingClientRect().bottom) && top < innerHeight;
    }),
    `${adapter}: the section heading remains visible after keyboard navigation`,
  );
  await page.goBack();
  await sectionNav.waitFor();
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
      page.on('requestfailed', (request) => {
        const reason = request.failure()?.errorText;
        if (reason === 'net::ERR_INSUFFICIENT_RESOURCES') errors.push(`${reason} ${request.url()}`);
      });
      page.on('response', (response) => {
        if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      });
      page.setDefaultTimeout(10000);
      page.setDefaultNavigationTimeout(30000);
      try {
        await page.addInitScript((mode) => {
          if (window === window.top) localStorage.setItem('cm-showcase-theme', mode);
        }, theme);
        for (const [name, path, ready] of routes) {
          // Core has hundreds of deferred previews. The route and theme checks below establish page readiness.
          await page.goto(url(base, path), { waitUntil: 'domcontentloaded' });
          await page.locator(ready).first().waitFor();
          await page.locator(`html[data-cm-theme="${theme}"]`).waitFor({ state: 'attached' });
          await checkViewport(page, `${adapter} ${name} ${width} ${theme}`);
          visited++;
          const file = `${name}--${width}--${theme}`;
          if (representative.has(file)) await screenshot(page, `${adapter}--${file}`);
          if (
            (name === 'core' || name === 'button') &&
            ((width === 360 && theme === 'dark') || (width === 1440 && theme === 'light'))
          )
            await checkAccessibility(page, `${adapter} ${file}`);
          if (width === 360 && theme === 'dark' && name !== 'icons') {
            const rootFontSize = () =>
              page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize));
            const defaultSize = await rootFontSize();
            const scale = await page.addStyleTag({ content: 'html:root { font-size: 200%; }' });
            assert.equal(await rootFontSize(), defaultSize * 2, `${adapter} ${name}: effective root text size`);
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
        if ((width <= 360 || width === 1440) && theme === 'dark') await checkNavigation(page, base, adapter, width);
        if (width === 1440 && theme === 'dark') {
          await checkLayoutViewport(page, base, adapter);
          await checkWarehouse(page, base, adapter);
        }
        assert.deepEqual(errors, [], `${adapter} ${width} ${theme}: network/runtime errors`);
      } finally {
        await page.close();
      }
    }
  }
  console.log(
    `${adapter}: ${viewports.size} widths, two themes, ${routes.length} routes, and keyboard / touch navigation passed`,
  );
}

try {
  if (output) await mkdir(output, { recursive: true });
  console.log(`${browserName} ${browser.version()}`);
  // Keep each adapter's iframe keyboard and resize checks in the foreground.
  for (const entry of Object.entries(adapters)) await checkAdapter(entry);
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
