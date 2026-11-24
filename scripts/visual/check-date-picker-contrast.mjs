import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

// Run against visual:cross-platform:serve, which loads the built package CSS exports.
const require = createRequire(import.meta.url);
const browserName = process.env.SHOWCASE_BROWSER || 'chromium';
assert(['chromium', 'firefox', 'webkit'].includes(browserName), `Unsupported browser: ${browserName}`);
const playwright = require(process.env.SHOWCASE_PLAYWRIGHT || 'playwright');
const origin = process.env.CM_CONTRAST_ORIGIN || 'http://127.0.0.1:5176/';
const axe = require.resolve('axe-core/axe.min.js');

async function openCalendar(page, platform, theme, fixture) {
  const url = new URL(origin);
  url.search = new URLSearchParams({
    case: `date-picker-${fixture}`,
    catalog: 'all',
    behavior: 'true',
    platform,
    theme,
  });
  await page.goto(url.href);
  await page.locator('[data-visual-ready="true"]').waitFor();
  await page.getByRole('combobox').press('ArrowDown');
  const calendar = page.getByRole('dialog');
  await calendar.waitFor();
  return calendar;
}

async function readColors(locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const surface = getComputedStyle(element.closest('.cm-date-picker__calendar')).backgroundColor;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    // Convert computed CSS Color 4 values to the browser's sRGB canvas before applying WCAG luminance.
    function pixel(color) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return context.getImageData(0, 0, 1, 1).data;
    }

    function over(foreground, background) {
      const alpha = foreground[3] / 255;
      return [0, 1, 2].map((channel) => foreground[channel] * alpha + background[channel] * (1 - alpha));
    }

    function luminance(color) {
      const srgb = [...color].slice(0, 3).map((value) => value / 255);
      const [r, g, b] = srgb.map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function contrast(first, second) {
      const a = luminance(over(pixel(first), second));
      const b = luminance(second);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }

    const foreground = style.color;
    const surfacePixel = pixel(surface);
    const fill = pixel(style.backgroundColor);
    const background = fill[3] ? style.backgroundColor : surface;
    const backgroundPixel = over(fill, surfacePixel);
    const border = style.borderBlockStartColor;
    const outline = {
      color: style.outlineColor,
      style: style.outlineStyle,
      width: style.outlineWidth,
      offset: style.outlineOffset,
    };
    return {
      foreground,
      background,
      surface,
      text: contrast(foreground, backgroundPixel),
      border,
      borderContrast:
        style.borderBlockStartStyle === 'solid' && Number.parseFloat(style.borderBlockStartWidth) > 0
          ? Math.min(contrast(border, backgroundPixel), contrast(border, surfacePixel))
          : 0,
      focusVisible: element.matches(':focus-visible'),
      textDecoration: style.textDecorationLine,
      shadow: style.boxShadow,
      outline,
      ringContrast: outline.style === 'solid' ? contrast(outline.color, backgroundPixel) : 0,
    };
  });
}

function assertContrast(colors, key, minimum, state) {
  assert(colors[key] >= minimum, `${state}: ${colors[key].toFixed(2)}:1, expected at least ${minimum}:1`);
}

test(`packaged DatePicker contrast in ${browserName}`, async (t) => {
  const browser = await playwright[browserName].launch();
  t.after(() => browser.close());
  t.diagnostic(`${browserName} ${browser.version()}`);

  for (const platform of ['vue', 'vanilla']) {
    for (const theme of ['light', 'dark']) {
      await t.test(`${platform}, ${theme}`, async (caseTest) => {
        const page = await browser.newPage({
          viewport: theme === 'dark' ? { width: 360, height: 800 } : { width: 1440, height: 900 },
          locale: 'en-US',
          colorScheme: theme,
          reducedMotion: 'reduce',
          timezoneId: 'UTC',
        });
        caseTest.after(() => page.close());
        await page.clock.setFixedTime(new Date('2026-08-12T12:00:00Z'));

        const years = await openCalendar(page, platform, theme, 'year');
        const currentYear = years.locator('.cm-date-picker__day--today.cm-date-picker__day--selected');
        await currentYear.waitFor();
        assert.equal(await currentYear.evaluate((year) => getComputedStyle(year).textDecorationLine), 'none');

        const calendar = await openCalendar(page, platform, theme, 'clearable');
        const focusColor = await calendar.evaluate((element) => {
          const sample = document.createElement('span');
          sample.style.color = 'var(--cm-color-focus-ring)';
          element.append(sample);
          const { color } = getComputedStyle(sample);
          sample.remove();
          return color;
        });
        const heading = calendar.getByRole('columnheader').first();
        const outsideDay = calendar.locator('.cm-date-picker__day--outside:enabled').first();
        const weekday = await readColors(heading);
        const adjacent = await readColors(outsideDay);
        assertContrast(weekday, 'text', 4.5, 'weekday label');
        assertContrast(adjacent, 'text', 4.5, 'enabled adjacent date');
        const ordinary = await readColors(
          calendar
            .locator('.cm-date-picker__day:enabled:not(.cm-date-picker__day--outside, [aria-selected="true"])')
            .first(),
        );
        assertContrast(ordinary, 'text', 4.5, 'unselected date text');
        const today = calendar.locator('[aria-current="date"]');
        const currentDate = await readColors(today);
        assertContrast(currentDate, 'borderContrast', 3, 'current date boundary');
        const selected = calendar.getByRole('gridcell', { selected: true });
        const focusedSelection = await readColors(selected);
        assert(focusedSelection.focusVisible, 'keyboard opening focuses the selected date visibly');
        assert.deepEqual(
          focusedSelection.outline,
          { color: focusColor, style: 'solid', width: '1px', offset: '-1px' },
          'the selected date draws the shared focus outline inside its edge',
        );
        assertContrast(focusedSelection, 'text', 4.5, 'focused selected date text');
        assertContrast(focusedSelection, 'ringContrast', 3, 'keyboard focus ring');

        await page.keyboard.press('ArrowLeft');
        const focusedDay = await readColors(calendar.locator('.cm-date-picker__day:focus-visible'));
        assert.deepEqual(focusedDay.outline, focusedSelection.outline, 'unselected dates use the same focus outline');
        assert.equal(focusedDay.border, currentDate.border, 'focusing today preserves its border');
        assert.equal(focusedDay.background, currentDate.background, 'focusing today preserves its fill');
        assert.equal(focusedDay.shadow, currentDate.shadow, 'focusing today adds only the outline');
        assertContrast(focusedDay, 'text', 4.5, 'focused unselected date text');
        assertContrast(focusedDay, 'ringContrast', 3, 'unselected date focus ring');
        assert.equal(focusedDay.textDecoration, 'underline', 'current date remains marked while focused');
        const selection = await readColors(selected);
        assert(!selection.focusVisible, 'selection cue persists independently of keyboard focus');
        assert.equal(focusedSelection.border, selection.border, 'focusing a selected date preserves its border');
        assert.equal(focusedSelection.background, selection.background, 'focusing a selected date preserves its fill');
        assert.equal(focusedSelection.shadow, selection.shadow, 'focusing a selected date adds only the outline');
        assertContrast(selection, 'text', 4.5, 'selected date text');
        assertContrast(selection, 'borderContrast', 3, 'selected date boundary');

        await outsideDay.hover();
        const hover = await readColors(outsideDay);
        assert.notEqual(hover.background, adjacent.background, 'enabled adjacent date displays the hover surface');
        assertContrast(hover, 'text', 4.5, 'hovered adjacent date text');
        await selected.hover();
        const selectedHover = await readColors(selected);
        assert.equal(selectedHover.background, selection.background, 'hover preserves the selected surface');
        assertContrast(selectedHover, 'borderContrast', 3, 'hovered selected date boundary');

        await today.click();
        await calendar.waitFor({ state: 'hidden' });
        await page.getByRole('combobox').press('ArrowDown');
        await calendar.waitFor();
        await page.keyboard.press('ArrowLeft');
        assert.equal(await today.getAttribute('aria-selected'), 'true');
        assert.equal(
          (await readColors(today)).textDecoration,
          'underline',
          'current date remains marked while selected',
        );

        await page.clock.setFixedTime(new Date('2026-08-17T12:00:00Z'));
        const range = await openCalendar(page, platform, theme, 'range');
        const inRange = await readColors(range.locator('.cm-date-picker__day--in-range[aria-selected="true"]').first());
        assertContrast(inRange, 'text', 4.5, 'date within a selected range text');
        assertContrast(inRange, 'borderContrast', 3, 'date within a selected range boundary');
        const todayInRange = await readColors(range.locator('[aria-current="date"][aria-selected="true"]'));
        assert.equal(todayInRange.textDecoration, 'underline', 'current date remains marked within a selected range');

        const time = await openCalendar(page, platform, theme, 'time');
        const timeLabel = await readColors(time.getByText('Time', { exact: true }));
        assertContrast(timeLabel, 'text', 4.5, 'time group label');

        for (const control of [
          time.locator('.cm-date-picker__day:disabled').first(),
          time.locator('.cm-date-picker__navigation:disabled').first(),
        ]) {
          // Inactive controls are exempt from minimum contrast. Confirm that the browser enforces inactivity.
          const inactive = await control.evaluate((button) => {
            button.focus();
            button.click();
            return button.disabled && document.activeElement !== button;
          });
          assert(inactive, 'a genuinely disabled calendar control cannot take focus');
          assert(await time.isVisible(), 'clicking a disabled control keeps the calendar open');
          const normal = await readColors(control);
          await control.hover({ force: true });
          assert.equal(
            (await readColors(control)).background,
            normal.background,
            'disabled control has no hover surface',
          );
        }

        await page.addScriptTag({ path: axe });
        const violations = await page.evaluate(async () => {
          const result = await window.axe.run('.cm-date-picker__calendar', { runOnly: ['color-contrast'] });
          return result.violations.map(({ id, nodes }) => [id, nodes.map(({ target }) => target)]);
        });
        assert.deepEqual(violations, [], 'open time calendar axe text contrast');
        caseTest.diagnostic(
          JSON.stringify({
            weekday,
            ordinary,
            adjacent,
            hover,
            selection,
            inRange,
            currentDate,
            focusedDay,
            timeLabel,
          }),
        );
      });
    }
  }
});
