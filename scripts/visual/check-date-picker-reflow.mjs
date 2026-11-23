import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';

// Run against visual:cross-platform:serve, which uses the packaged component CSS.
const require = createRequire(import.meta.url);
const browserName = process.env.SHOWCASE_BROWSER || 'chromium';
assert(['chromium', 'firefox', 'webkit'].includes(browserName), `Unsupported browser: ${browserName}`);
const playwright = require(process.env.SHOWCASE_PLAYWRIGHT || 'playwright');
const origin = process.env.CM_DATE_PICKER_REFLOW_ORIGIN || 'http://127.0.0.1:5176/';
const captureDirectory = process.env.CM_DATE_PICKER_REFLOW_CAPTURE_DIR;
const dateFixtures = ['clearable', 'range', 'month', 'year', 'time', 'portal'];

async function openCalendar(page, platform, theme, fixture, scale, locale = 'en-US') {
  const url = new URL(origin);
  url.search = new URLSearchParams({ case: `date-picker-${fixture}`, catalog: 'all', platform, theme, locale });
  await page.goto(url.href);
  const root = page.locator('[data-visual-ready="true"]');
  await root.waitFor();
  await page.evaluate(
    async ({ scale, locale }) => {
      document.documentElement.style.fontSize = scale;
      document.documentElement.dir = locale === 'ar-EG' ? 'rtl' : 'ltr';
      await document.fonts.ready;
    },
    { scale, locale },
  );
  await root.evaluate((element) => {
    element.style.inlineSize = '100%';
    element.style.padding = '8px';
  });
  await page.getByRole('combobox').press('ArrowDown');
  const calendar = page.getByRole('dialog');
  await calendar.waitFor();
  await calendar.locator('.cm-date-picker__day:focus').waitFor();
  return calendar;
}

async function measure(calendar) {
  return calendar.evaluate((element) => {
    const grid = element.querySelector('[role="grid"]');
    const headers = [...grid.querySelectorAll('[role="columnheader"]')];
    const rows = [...grid.querySelectorAll('.cm-date-picker__week')].map((row) => [...row.children]);
    const box = element.getBoundingClientRect();
    const center = (node) => {
      const bounds = node.getBoundingClientRect();
      return bounds.left + bounds.width / 2;
    };
    return {
      viewport: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      left: box.left,
      right: box.right,
      gridWidth: grid.clientWidth,
      gridContent: grid.scrollWidth,
      overlaps: rows.some((row) =>
        row.slice(1).some((cell, index) => {
          const one = row[index].getBoundingClientRect();
          const two = cell.getBoundingClientRect();
          return one.left < two.right - 0.5 && two.left < one.right - 0.5;
        }),
      ),
      headingsMisaligned: rows.some((row) =>
        headers.some((heading, index) => Math.abs(center(heading) - center(row[index])) > 1),
      ),
      labelsOverflow: [...headers, ...rows.flat(), element.querySelector('.cm-date-picker__month')].some((label) => {
        const bounds = label.getBoundingClientRect();
        const text = document.createRange();
        text.selectNodeContents(label);
        return [...text.getClientRects()].some(
          (fragment) => fragment.left < bounds.left - 1 || fragment.right > bounds.right + 1,
        );
      }),
    };
  });
}

function assertLayout(layout, label) {
  assert.equal(layout.documentWidth, layout.viewport, `${label}: the page fits the viewport`);
  assert(layout.left >= -1 && layout.right <= layout.viewport + 1, `${label}: the calendar fits the viewport`);
  assert.equal(layout.overlaps, false, `${label}: adjacent targets do not overlap`);
  assert.equal(layout.headingsMisaligned, false, `${label}: headings align with the date columns`);
  assert.equal(layout.labelsOverflow, false, `${label}: each label fits its target`);
}

async function assertFocusedDateVisible(calendar, column) {
  const focused = calendar.locator('.cm-date-picker__day:focus');
  assert(
    await focused.evaluate((cell, column) => {
      const grid = cell.closest('[role="grid"]');
      const bounds = cell.getBoundingClientRect();
      const visible = grid.getBoundingClientRect();
      return (
        cell === (column === 0 ? cell.parentElement.firstElementChild : cell.parentElement.lastElementChild) &&
        bounds.left >= visible.left - 1 &&
        bounds.right <= visible.left + grid.clientWidth + 1
      );
    }, column),
    `the ${column === 0 ? 'first' : 'last'} date is focused and scrolled into view`,
  );
  return focused;
}

test(`DatePicker reflows at 320px with 200% text in ${browserName}`, async (context) => {
  const browser = await playwright[browserName].launch();
  context.after(() => browser.close());
  context.diagnostic(browser.version());
  if (captureDirectory) await mkdir(captureDirectory, { recursive: true });

  for (const platform of ['vue', 'vanilla']) {
    for (const theme of ['light', 'dark']) {
      await context.test(`${platform}, ${theme}`, async (caseTest) => {
        const page = await browser.newPage({
          viewport: { width: 320, height: 720 },
          colorScheme: theme,
          reducedMotion: 'reduce',
          timezoneId: 'UTC',
        });
        caseTest.after(() => page.close());
        // Keep the date deterministic while Vue's event timestamps advance normally.
        await page.clock.install({ time: new Date('2026-08-12T12:00:00Z') });

        for (const fixture of dateFixtures) {
          const calendar = await openCalendar(page, platform, theme, fixture, '200%');
          const layout = await measure(calendar);
          assertLayout(layout, fixture);
          assert(layout.gridContent > layout.gridWidth, `${fixture}: the wider grid scrolls inside the calendar`);
          assert(
            (await calendar.locator('.cm-date-picker__day[tabindex="0"]').count()) === 1,
            `${fixture}: only one date is in the tab order`,
          );
          if (captureDirectory) {
            await page.screenshot({
              path: join(captureDirectory, `${browserName}-${platform}-${theme}-${fixture}.png`),
            });
          }
          if (fixture === 'range') {
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('End');
            const last = await assertFocusedDateVisible(calendar, 6);
            assert.equal(await last.getAttribute('data-cm-date-picker-value'), '2026-08-15');
          }
          if (fixture === 'time') {
            const hour = calendar.getByRole('combobox', { name: 'Hour' });
            const minute = calendar.getByRole('combobox', { name: 'Minute' });
            const listbox = calendar.getByRole('listbox');
            assert.equal(await calendar.locator('select').count(), 0);
            await hour.click();
            await listbox.getByRole('option', { name: '10' }).click();
            await minute.press('ArrowDown');
            await listbox.locator('[role="option"]:focus').waitFor();
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
            assert.equal(await page.locator('input[name="release_time"]').inputValue(), '2026-08-13T10:45');
            await minute.press('ArrowDown');
            await listbox.waitFor();
            await page.keyboard.press('Escape');
            await listbox.waitFor({ state: 'hidden' });
            assert(await calendar.isVisible(), 'Escape closes the time list before the calendar');
            await page.keyboard.press('Escape');
            await calendar.waitFor({ state: 'hidden' });
          }
        }

        for (const locale of ['es-ES', 'ru-RU', 'ar-EG']) {
          const calendar = await openCalendar(page, platform, theme, 'clearable', '200%', locale);
          await page.keyboard.press('PageDown');
          const expectedHeading = calendar.locator('.cm-date-picker__day:focus').evaluate((cell, locale) => {
            const date = new Date(`${cell.dataset.cmDatePickerValue}T12:00:00Z`);
            return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
          }, locale);
          assert.equal(await calendar.locator('.cm-date-picker__month').textContent(), await expectedHeading);
          assertLayout(await measure(calendar), locale);
          const titleKeepsWordsTogether = await calendar.locator('.cm-date-picker__month').evaluate((title) => {
            const text = title.firstChild;
            return [...text.textContent.matchAll(/\S+/gu)].every(({ index, 0: word }) => {
              const range = document.createRange();
              range.setStart(text, index);
              range.setEnd(text, index + word.length);
              return new Set([...range.getClientRects()].map(({ top }) => top)).size === 1;
            });
          });
          assert(titleKeepsWordsTogether, `${locale}: the localized month title wraps between words`);
          assert.deepEqual(
            await calendar.getByRole('columnheader').allTextContents(),
            await page.evaluate((locale) => {
              const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
              return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(Date.UTC(2026, 7, 2 + index))));
            }, locale),
          );
          if (captureDirectory) {
            await page.screenshot({
              path: join(captureDirectory, `${browserName}-${platform}-${theme}-${locale}.png`),
            });
          }

          await page.keyboard.press('Home');
          await assertFocusedDateVisible(calendar, 0);
          await page.keyboard.press('End');
          const last = await assertFocusedDateVisible(calendar, 6);
          const lastValue = await last.getAttribute('data-cm-date-picker-value');
          const lastName = await last.getAttribute('aria-label');
          assert.equal(
            lastName,
            await page.evaluate(
              ({ locale, lastValue }) =>
                new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(
                  new Date(`${lastValue}T12:00:00Z`),
                ),
              { locale, lastValue },
            ),
          );
          await last.click();
          await calendar.waitFor({ state: 'hidden' });
          assert.equal(
            await page.locator('input[name="launch_date"]').inputValue(),
            lastValue,
            'the revealed date can be clicked',
          );
          const trigger = page.getByRole('combobox');
          await trigger.press('ArrowDown');
          await calendar.waitFor();
          await calendar.locator('.cm-date-picker__day:focus').waitFor();
          await page.keyboard.press('Escape');
          await calendar.waitFor({ state: 'hidden' });
          assert(
            await trigger.evaluate((element) => element === document.activeElement),
            'Escape restores trigger focus',
          );
        }

        await page.setViewportSize({ width: 390, height: 720 });
        const ordinary = await openCalendar(page, platform, theme, 'clearable', '100%');
        const layout = await measure(ordinary);
        assertLayout(layout, 'default text size');
        assert.equal(layout.gridContent, layout.gridWidth, 'all columns fit at the default text size');

        const time = await openCalendar(page, platform, theme, 'time', '100%');
        await time.getByRole('combobox', { name: 'Hour' }).click();
        await page.waitForFunction(
          () => {
            const listbox = document.querySelector('[data-cm-date-picker-hour] [role="listbox"]:not([hidden])');
            if (!listbox) return false;
            const { left, top, width, height } = listbox.getBoundingClientRect();
            return listbox.contains(document.elementFromPoint(left + width / 2, top + height / 2));
          },
          null,
          { timeout: 3000 },
        );
      });
    }
  }
});
