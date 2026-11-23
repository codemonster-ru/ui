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
      });
    }
  }
});
