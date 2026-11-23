import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const browserName = process.env.SHOWCASE_BROWSER || 'chromium';
const playwright = require(process.env.SHOWCASE_PLAYWRIGHT || 'playwright');
const origin = process.env.CM_DISPLAY_VISUAL_ORIGIN || 'http://127.0.0.1:5176/';

async function openCase(page, platform, theme, caseId) {
  const url = new URL(origin);
  url.search = new URLSearchParams({ case: caseId, catalog: 'all', platform, theme });
  await page.goto(url.href);
  await page.locator('[data-visual-ready="true"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
}

const pointerCases = [
  ['accordion-default', '.cm-accordion__trigger', 'backgroundColor', 'backgroundColor'],
  ['admin-layout-default', '.cm-admin-layout__mobile-toggle-button', 'backgroundColor', 'backgroundColor'],
  ['breadcrumbs-default', '.cm-breadcrumbs__link', 'color', 'color'],
  ['date-picker-default', '.cm-date-picker', 'borderColor', 'backgroundColor'],
  ['dialog-open', '.cm-dialog__close', 'backgroundColor', 'backgroundColor'],
  ['menu-default', '.cm-menu__item:enabled:not(.cm-menu__item--active)', 'backgroundColor', 'backgroundColor'],
  [
    'nav-menu-default',
    '.cm-nav-menu__item:not(.cm-nav-menu__item--active, [aria-disabled])',
    'backgroundColor',
    'backgroundColor',
  ],
  ['select-default', '.cm-select', 'borderColor', 'backgroundColor'],
  ['stepper-default', '.cm-stepper__trigger:enabled', 'color', 'color', '.cm-stepper__label'],
  [
    'table-of-contents-default',
    '.cm-table-of-contents__link:not(.cm-table-of-contents__link--active)',
    'color',
    'color',
  ],
  ['tabs-default', '.cm-tabs__tab:enabled[aria-selected="false"]', 'color', 'backgroundColor'],
];

async function checkPointerStates(page, platform, theme) {
  for (const [caseId, selector, hoverProperty, pressedProperty, paintSelector] of pointerCases) {
    await openCase(page, platform, theme, caseId);
    await page.mouse.move(0, 0);
    const target = page.locator(selector).first();
    const paint = paintSelector ? target.locator(paintSelector) : target;
    const read = () =>
      paint.evaluate(
        (element, [hover, pressed]) => {
          const style = getComputedStyle(element);
          return [style[hover], style[pressed]];
        },
        [hoverProperty, pressedProperty],
      );
    const rest = await read();
    await target.hover();
    const hovered = await read();
    assert.notEqual(hovered[0], rest[0], `${caseId} reacts to pointer hover`);
    await page.mouse.down();
    try {
      assert.notEqual((await read())[1], hovered[1], `${caseId} distinguishes a held press from hover`);
    } finally {
      await page.mouse.move(0, 0);
      await page.mouse.up();
    }
  }
}

async function checkFocusAndDisabledStates(page, platform, theme) {
  for (const [caseId, selector] of [
    ['button-variant-secondary', '.cm-button'],
    ['button-variant-ghost', '.cm-button'],
    ['icon-button-default', '.cm-icon-button'],
    ['dropdown-default', '.cm-dropdown__trigger'],
    ['popover-default', '.cm-popover__trigger'],
  ]) {
    await openCase(page, platform, theme, caseId);
    await page.mouse.move(0, 0);
    await page.keyboard.press('Tab');
    const target = page.locator(selector).first();
    await target.focus();
    assert(await target.evaluate((element) => element.matches(':focus-visible')), `${caseId} has keyboard focus`);
    const read = () =>
      target.evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.borderTopColor, style.boxShadow];
      });
    const focused = await read();
    assert(focused[1].includes(focused[0]), `${caseId} focus border matches the ring`);
    await target.hover();
    assert.deepEqual(await read(), focused, `${caseId} retains its ring and border colors during hover`);
  }

  for (const [caseId, selector] of [
    ['nav-menu-default', '.cm-nav-menu__item--disabled'],
    ['drawer-composed', '.cm-drawer__close:disabled'],
  ]) {
    await openCase(page, platform, theme, caseId);
    if (caseId === 'drawer-composed') {
      await page.locator('dialog.cm-drawer').evaluate((dialog) => dialog.showModal());
    }
    await page.mouse.move(0, 0);
    const target = page.locator(selector).first();
    const read = () =>
      target.evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.backgroundColor, style.color];
      });
    const disabled = await read();
    await target.hover({ force: true });
    assert.deepEqual(await read(), disabled, `${caseId} retains its disabled appearance on hover`);
  }
}

test(`packaged display and navigation states in ${browserName}`, async (t) => {
  const browser = await playwright[browserName].launch();
  t.after(() => browser.close());
  t.diagnostic(`${browserName} ${browser.version()}`);

  for (const platform of ['vue', 'vanilla']) {
    for (const theme of ['light', 'dark']) {
      await t.test(`${platform}, ${theme}`, async (caseTest) => {
        const page = await browser.newPage({
          viewport: { width: 320, height: 650 },
          colorScheme: theme,
          reducedMotion: 'reduce',
        });
        caseTest.after(() => page.close());

        const longTitle = 'Registry unavailable: InternationalTeamWorkspaceAccessPermissionsDirectory2026';
        for (const component of ['alert', 'dialog']) {
          await openCase(page, platform, theme, component === 'alert' ? 'alert-danger-icon' : 'dialog-open');
          const measured = await page.locator(`.cm-${component}__title`).evaluate((title, text) => {
            title.textContent = text;
            const range = document.createRange();
            range.selectNodeContents(title);
            const { left, right } = title.getBoundingClientRect();
            const lines = [...range.getClientRects()];
            return { lineCount: lines.length, fits: lines.every((line) => line.left >= left && line.right <= right) };
          }, longTitle);
          assert(measured.fits && measured.lineCount > 2, `${component} wraps a long title inside its box`);
        }

        await openCase(page, platform, theme, 'progress-bar-determinate');
        const progress = page.getByRole('progressbar');
        for (const direction of ['ltr', 'rtl']) {
          for (const percentage of [0, 1, 42, 100]) {
            const geometry = await progress.evaluate(
              (bar, { direction, percentage }) => {
                const fill = bar.querySelector('.cm-progress-bar__value');
                const label = bar.querySelector('.cm-progress-bar__label');
                bar.dir = direction;
                fill.style.inlineSize = percentage + '%';
                label.textContent = percentage + '%';
                const outer = bar.getBoundingClientRect();
                const value = fill.getBoundingClientRect();
                const text = label.getBoundingClientRect();
                // DOMRect edge arithmetic can differ at a fraction of a layout unit.
                const millipixels = (coordinate) => Math.round(coordinate * 1000);
                return {
                  labelFits:
                    millipixels(text.left) >= millipixels(outer.left) &&
                    millipixels(text.right) <= millipixels(outer.right) &&
                    millipixels(text.height) <= millipixels(outer.height),
                  labelOutside: direction === 'rtl' ? value.left > text.right : value.right < text.left,
                  railHeight: value.height,
                };
              },
              { direction, percentage },
            );
            assert(geometry.labelFits && geometry.labelOutside, `${percentage}% label in ${direction}`);
            assert.equal(geometry.railHeight, 8, 'default rail retains the documented height');
          }
        }

        await openCase(page, platform, theme, 'progress-bar-striped');
        assert.equal((await page.locator('.cm-progress-bar__value').boundingBox()).height, 16);

        await openCase(page, platform, theme, 'nav-menu-default');
        const active = page.locator('.cm-nav-menu__item--active');
        const readBackground = () => active.evaluate((item) => getComputedStyle(item).backgroundColor);
        const selected = await readBackground();
        await active.hover();
        assert.equal(await readBackground(), selected, 'hover preserves the current destination marker');

        await openCase(page, platform, theme, 'accordion-disabled');
        const enabled = page.getByRole('button', { name: 'Account' });
        const disabled = page.getByRole('button', { name: 'Billing' });
        assert(await disabled.isDisabled(), 'Billing remains natively disabled');
        assert.notEqual(
          await enabled.evaluate((button) => getComputedStyle(button).color),
          await disabled.evaluate((button) => getComputedStyle(button).color),
          'disabled and enabled Accordion items have distinct text colors',
        );

        await openCase(page, platform, theme, 'avatar-image');
        const image = page.getByRole('img', { name: 'Ada King' });
        await image.evaluate((picture) => picture.decode());
        assert.equal(await image.evaluate((picture) => picture.naturalWidth), 96, 'fixture loads the actual image');

        await checkPointerStates(page, platform, theme);
        await checkFocusAndDisabledStates(page, platform, theme);
      });
    }
  }
});
