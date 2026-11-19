import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const browserName = process.env.SHOWCASE_BROWSER || 'chromium';
const playwright = require(process.env.SHOWCASE_PLAYWRIGHT || 'playwright');
const origin = process.env.CM_NATIVE_BUTTON_ORIGIN || 'http://127.0.0.1:5176/';

async function openButton(page, platform, theme, caseId) {
  const url = new URL(origin);
  url.search = new URLSearchParams({ case: caseId, catalog: 'all', platform, theme });
  await page.goto(url.href);
  await page.locator('[data-visual-ready="true"]').waitFor();
  return page.getByRole('button', { name: 'Save' });
}

async function measure(button, styled) {
  return button.evaluate((element, isStyled) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    function rgba(value) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data, (byte) => byte / 255);
    }
    function over(fill, under) {
      return fill.slice(0, 3).map((channel, index) => channel * fill[3] + under[index] * (1 - fill[3]));
    }
    function luminance(channels) {
      return channels
        .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    }
    function size(element) {
      const { width, height } = element.getBoundingClientRect();
      return [width, height];
    }
    const style = getComputedStyle(element);
    const backgroundLayers = [];
    for (let node = element; node; node = node.parentElement) {
      backgroundLayers.unshift(getComputedStyle(node).backgroundColor);
    }
    const background = backgroundLayers.reduce((pixels, layer) => over(rgba(layer), pixels), [1, 1, 1]);
    const foreground = over(rgba(style.color), background);
    const [lighter, darker] = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
    const authoredStyle = element.getAttribute('style');
    const original = { color: style.color, background: style.backgroundColor, size: size(element) };
    try {
      element.style.transition = 'none';
      element.style.color = isStyled ? 'var(--cm-color-interactive-primary-foreground)' : 'revert';
      if (isStyled) element.style.backgroundColor = 'var(--cm-color-interactive-primary-background)';
      const expected = getComputedStyle(element);
      return {
        ...original,
        contrast: (lighter + 0.05) / (darker + 0.05),
        expectedColor: expected.color,
        expectedBackground: expected.backgroundColor,
        referenceSize: size(element),
      };
    } finally {
      if (authoredStyle === null) element.removeAttribute('style');
      else element.setAttribute('style', authoredStyle);
    }
  }, styled);
}

test(`native and library button contrast in ${browserName}`, async (t) => {
  const browser = await playwright[browserName].launch();
  t.after(() => browser.close());
  t.diagnostic(`${browserName} ${browser.version()}`);

  for (const platform of ['vue', 'vanilla']) {
    for (const theme of ['light', 'dark']) {
      await t.test(`${platform}, ${theme}`, async (caseTest) => {
        const page = await browser.newPage({
          viewport: { width: 320, height: 320 },
          colorScheme: theme,
          reducedMotion: 'reduce',
        });
        caseTest.after(() => page.close());
        for (const [caseId, styled] of [
          ['inline-default', false],
          ['button-default', true],
        ]) {
          const button = await openButton(page, platform, theme, caseId);
          await page.evaluate(() => document.fonts.ready);
          const result = await measure(button, styled);
          caseTest.diagnostic(`${caseId}: ${result.contrast.toFixed(2)}:1, ${result.size.join(' × ')} px`);
          assert(result.contrast >= 4.5, `${caseId} uses a readable foreground/background pair`);
          assert.equal(result.color, result.expectedColor, `${caseId} foreground matches its own palette`);
          assert.equal(result.background, result.expectedBackground, `${caseId} background matches its own palette`);
          assert.deepEqual(result.size, result.referenceSize, `${caseId} palette leaves geometry intact`);
        }
      });
    }
  }
});
