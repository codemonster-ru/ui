import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import test from 'node:test';

// Run against visual:cross-platform:serve with the built packages.
const require = createRequire(import.meta.url);
const browserName = process.env.SHOWCASE_BROWSER || 'chromium';
assert(['chromium', 'firefox', 'webkit'].includes(browserName), `Unsupported browser: ${browserName}`);
const playwright = require(process.env.SHOWCASE_PLAYWRIGHT || 'playwright');
const origin = process.env.CM_REFLOW_ORIGIN || 'http://127.0.0.1:5176/';
const captureDir = process.env.CM_REFLOW_CAPTURE_DIR;
const groupTitle = 'Unternehmensweite Zugriffsberechtigungen und Authentifizierungseinstellungen';
const headingTitle = 'Authentifizierungseinstellungen und Zugriffsberechtigungsverwaltung';

async function assertTextFits(locator, container) {
  const result = await locator.evaluate((element, containerSelector) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const lines = Array.from(range.getClientRects());
    const bounds = element.closest(containerSelector).getBoundingClientRect();
    return {
      lines: new Set(lines.map((line) => line.top)).size,
      fits: lines.every((line) => line.left >= bounds.left - 1 && line.right <= bounds.right + 1),
    };
  }, container);
  assert(result.lines > 1, 'long text reflows onto multiple lines');
  assert(result.fits, 'all text stays within its component');
}

test(`packaged long-label reflow in ${browserName}`, async (t) => {
  const browser = await playwright[browserName].launch();
  t.after(() => browser.close());
  t.diagnostic(`${browserName} ${browser.version()}`);
  if (captureDir) await mkdir(captureDir, { recursive: true });

  for (const fixture of ['group-box-default', 'table-of-contents-offset']) {
    for (const platform of ['vue', 'vanilla']) {
      for (const theme of ['light', 'dark']) {
        for (const dir of ['ltr', 'rtl']) {
          await t.test(`${fixture} ${platform} ${theme} ${dir}`, async (subtest) => {
            const page = await browser.newPage({
              viewport: { width: 320, height: 900 },
              colorScheme: theme,
              reducedMotion: 'reduce',
            });
            subtest.after(() => page.close());
            const url = new URL(origin);
            url.search = new URLSearchParams({ case: fixture, catalog: 'all', behavior: 'true', platform, theme });
            await page.goto(url.href);
            await page.locator('[data-visual-ready="true"]').waitFor();
            const defaultRootSize = await page.evaluate(() =>
              Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
            );
            await page.addStyleTag({
              content: `
                html:root { font-size: 200%; }
                #visual-root { inline-size: 100%; padding: 12px; }
                .cm-group-box__content input { max-inline-size: 100%; }
                .cm-group-box + .cm-group-box { margin-block-start: 12px; }
              `,
            });
            await page.evaluate((direction) => {
              document.documentElement.dir = direction;
            }, dir);
            const scaledRootSize = await page.evaluate(() =>
              Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
            );
            assert.equal(scaledRootSize, defaultRootSize * 2);

            if (fixture === 'group-box-default') {
              await page.locator('.cm-group-box__title').evaluate((element, title) => {
                element.textContent = title;
                element.lang = 'de';
                const group = document.createElement('fieldset');
                group.className = 'cm-group-box cm-group-box--titled';
                const legend = document.createElement('legend');
                legend.className = 'cm-group-box__legend';
                legend.append(element.cloneNode(true));
                const content = document.createElement('div');
                content.className = 'cm-group-box__content';
                content.textContent = 'Static field group';
                group.append(legend, content);
                element.closest('.cm-group-box').after(group);
              }, groupTitle);
            } else {
              await page.locator('.cm-table-of-contents__link').evaluate((link, title) => {
                link.textContent = title;
                link.lang = 'de';
                link.parentElement.style.setProperty('--cm-toc-level', '6');
              }, headingTitle);
            }

            await page.evaluate(() => document.fonts.ready);
            const { width, available } = await page.evaluate(() => ({
              width: document.documentElement.scrollWidth,
              available: document.documentElement.clientWidth,
            }));
            if (captureDir) {
              const capture = resolve(captureDir, `${fixture}--${platform}--${theme}--${dir}.png`);
              await page.screenshot({ path: capture, animations: 'disabled', caret: 'hide' });
              subtest.diagnostic(`document scroll width ${width}px`);
            }
            assert.equal(width, available, 'the document does not require horizontal scrolling');

            if (fixture === 'group-box-default') {
              const trigger = page.getByRole('button', { name: groupTitle });
              const title = page.locator('.cm-group-box__title');
              await assertTextFits(title.nth(0), '.cm-group-box__trigger');
              await assertTextFits(title.nth(1), '.cm-group-box');
              await trigger.press('Space');
              assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
              assert(await trigger.evaluate((element) => element.matches(':focus-visible')));
              await trigger.press('Enter');
              assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
              assert(await page.getByRole('textbox', { name: 'Reference' }).isVisible());
            } else {
              const link = page.getByRole('link', { name: headingTitle });
              await assertTextFits(link, '.cm-table-of-contents__link');
              await link.press('Enter');
              assert(await page.locator('#install').evaluate((heading) => heading === document.activeElement));
            }
          });
        }
      }
    }
  }
});
