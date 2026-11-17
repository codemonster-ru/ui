import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const browserName = process.env.SHOWCASE_BROWSER || 'chromium';
const playwright = require(process.env.SHOWCASE_PLAYWRIGHT || 'playwright');
const origin = process.env.CM_TOOLTIP_VISUAL_ORIGIN || 'http://127.0.0.1:5176/';

async function openCase(page, platform, theme, caseId, hostStyle = {}) {
  const url = new URL(origin);
  url.search = new URLSearchParams({ case: caseId, catalog: 'all', platform, theme });
  await page.goto(url.href);
  const host = page.locator('[data-visual-ready="true"]');
  await host.evaluate((element, style) => Object.assign(element.style, style), hostStyle);
  await page.evaluate(() => document.fonts.ready);
}

async function ensureViewportFit(page) {
  await page.waitForFunction(() => {
    const tooltip = document.querySelector('[role="tooltip"]:not([hidden])');
    if (!tooltip) return false;
    const { left, top, right, bottom } = tooltip.getBoundingClientRect();
    return left >= 0 && top >= 0 && right <= innerWidth && bottom <= innerHeight;
  });
}

const edgeHost = { position: 'fixed', width: 'max-content', minHeight: '0', padding: '0' };
const clippingHost = {
  position: 'absolute',
  left: '70px',
  top: '85px',
  width: '204px',
  height: '30px',
  minHeight: '0',
  padding: '0',
  overflow: 'hidden',
  border: '3px solid currentColor',
};

test(`packaged Tooltip placement in ${browserName}`, async (t) => {
  const browser = await playwright[browserName].launch();
  t.after(() => browser.close());
  t.diagnostic(`${browserName} ${browser.version()}`);

  for (const platform of ['vue', 'vanilla']) {
    for (const theme of ['light', 'dark']) {
      await t.test(`${platform}, ${theme}`, async (caseTest) => {
        const page = await browser.newPage({
          viewport: { width: 390, height: 300 },
          colorScheme: theme,
          reducedMotion: 'reduce',
        });
        caseTest.after(() => page.close());
        page.setDefaultTimeout(4000);
        const trigger = page.locator('.cm-tooltip__trigger');
        const panel = page.getByRole('tooltip');

        await openCase(page, platform, theme, 'tooltip-visible');
        await ensureViewportFit(page);
        assert.equal(await panel.getAttribute('data-cm-tooltip-inline'), 'bottom');

        await openCase(page, platform, theme, 'tooltip-visible', {
          width: '100%',
          padding: '60px 0 0',
          display: 'flex',
          justifyContent: 'end',
        });
        await page.setViewportSize({ width: 320, height: 300 });
        await ensureViewportFit(page);
        assert.equal(await panel.getAttribute('data-cm-tooltip-inline'), 'bottom');
        assert(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          'the shifted panel and hover area stay within the page width',
        );

        await openCase(page, platform, theme, 'tooltip-composed', { ...edgeHost, left: '0', top: '1px' });
        await trigger.hover();
        await ensureViewportFit(page);
        assert.equal(await panel.getAttribute('data-cm-tooltip-inline'), 'bottom');
        const anchorBounds = await trigger.boundingBox();
        const panelBounds = await panel.boundingBox();
        const across = anchorBounds.x + anchorBounds.width / 2;
        await page.mouse.move(across, anchorBounds.y + anchorBounds.height + 5);
        assert(await panel.isVisible(), 'the pointer remains over the corridor outside the shifted panel edge');
        await page.mouse.move(panelBounds.x + 5, panelBounds.y + 5);
        assert(await panel.isVisible(), 'the hover path follows the flipped panel');

        await openCase(page, platform, theme, 'tooltip-visible', { ...edgeHost, left: '112px', bottom: '1px' });
        await page.setViewportSize({ width: 390, height: 300 });
        await ensureViewportFit(page);
        assert.equal(await panel.getAttribute('data-cm-tooltip-inline'), 'top');

        await openCase(page, platform, theme, 'tooltip-default', {
          ...clippingHost,
          height: '130px',
          overflow: 'auto',
        });
        await page.locator('#visual-root').evaluate((host) => {
          host.querySelector('.cm-tooltip').style.margin = '115px 0 0 47px';
          const spacer = host.ownerDocument.createElement('div');
          spacer.style.height = '270px';
          host.append(spacer);
          host.scrollTop = 45;
        });
        await trigger.focus();
        await ensureViewportFit(page);
        assert.equal(await panel.getAttribute('data-cm-tooltip-inline'), 'top');
        await page.locator('#visual-root').evaluate((host) => {
          host.scrollTop += 10;
        });
        await page.waitForFunction(() => {
          const tip = document.querySelector('[role="tooltip"]').getBoundingClientRect();
          const button = document.querySelector('.cm-tooltip__trigger').getBoundingClientRect();
          const host = document.querySelector('#visual-root').getBoundingClientRect();
          const hit = document.elementFromPoint(tip.left + tip.width / 2, tip.top + tip.height / 2);
          return (
            Math.abs(button.top - tip.bottom - 10) < 0.01 && tip.top >= host.top && hit?.closest('[role="tooltip"]')
          );
        });

        await openCase(page, platform, theme, 'tooltip-visible', clippingHost);
        await page.setViewportSize({ width: 389, height: 300 });
        await ensureViewportFit(page);
        assert(
          await panel.evaluate((tooltip) => {
            const { left, top, width, height } = tooltip.getBoundingClientRect();
            const hit = document.elementFromPoint(left + width / 2, top + height / 2);
            return tooltip.closest('.cm-tooltip') && !tooltip.contains(hit);
          }),
          'a viewport-contained inline panel still respects its clipping ancestor',
        );

        await openCase(page, platform, theme, 'tooltip-custom-trigger', clippingHost);
        await trigger.focus();
        await ensureViewportFit(page);
        assert(
          await panel.evaluate((tooltip) => {
            const { left, top, width, height } = tooltip.getBoundingClientRect();
            const hit = document.elementFromPoint(left + width / 2, top + height / 2);
            return tooltip.parentElement === document.body && tooltip.contains(hit);
          }),
          'the portal escapes the clipping ancestor',
        );
        await trigger.press('Escape');
        await panel.waitFor({ state: 'hidden' });
        assert(await trigger.evaluate((button) => button === document.activeElement), 'Escape preserves trigger focus');
      });
    }
  }
});
