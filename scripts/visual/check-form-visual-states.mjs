import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

// Run against visual:cross-platform:serve with the built package CSS.
const require = createRequire(import.meta.url);
const browserName = process.env.SHOWCASE_BROWSER || 'chromium';
assert(['chromium', 'firefox', 'webkit'].includes(browserName), `Unsupported browser: ${browserName}`);
const playwright = require(process.env.SHOWCASE_PLAYWRIGHT || 'playwright');
const origin = process.env.CM_FORM_VISUAL_ORIGIN || 'http://127.0.0.1:5176/';

async function openCase(page, platform, theme, caseId) {
  const url = new URL(origin);
  url.search = new URLSearchParams({ case: caseId, catalog: 'all', behavior: 'true', platform, theme });
  await page.goto(url.href);
  await page.locator('[data-visual-ready="true"]').waitFor();
}

async function readContrasts(page, selectors) {
  return page.evaluate((pairs) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    function pixel(color) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].map((channel) => channel / 255);
    }

    function luminance(pixel) {
      const [red, green, blue] = pixel
        .slice(0, 3)
        .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    }

    return pairs.map(([foregroundSelector, foregroundProperty, backgroundSelector, backgroundProperty]) => {
      const foreground = getComputedStyle(document.querySelector(foregroundSelector));
      const background = getComputedStyle(document.querySelector(backgroundSelector));
      const fill = pixel(background[backgroundProperty]);
      const pigment = pixel(foreground[foregroundProperty]);
      const alpha = pigment[3];
      const a = luminance(fill.map((value, index) => alpha * pigment[index] + (1 - alpha) * value));
      const b = luminance(fill);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
  }, selectors);
}

const radioMark = ['.cm-radio__mark', 'backgroundColor', '.cm-radio__control', 'backgroundColor'];

async function checkRadioState(page, state) {
  assert(await page.getByRole('radio').isChecked(), `${state} keeps the native option checked`);
  const [markContrast] = await readContrasts(page, [radioMark]);
  assert(markContrast >= 3, `${state} selected dot contrast is ${markContrast.toFixed(2)}:1`);
  return markContrast.toFixed(2);
}

const focusCases = [
  ['button-default', [['.cm-button']]],
  ['input-enhanced', [['.cm-input'], ['.cm-input__action']]],
  ['textarea-default', [['.cm-textarea']]],
  ['select-clearable', [['.cm-select'], ['.cm-select__clear']]],
  ['date-picker-clearable', [['.cm-date-picker'], ['.cm-date-picker__clear']]],
  ['checkbox-checked', [['.cm-checkbox__input', '.cm-checkbox__control']]],
  ['radio-checked', [['.cm-radio__input', '.cm-radio__control']]],
  ['switch-checked', [['.cm-switch__input', '.cm-switch__control']]],
  ['tabs-default', [['.cm-tabs__tab']]],
  ['dropdown-default', [['.cm-dropdown__trigger']]],
  ['popover-default', [['.cm-popover__trigger']]],
];

test(`packaged form and navigation states in ${browserName}`, async (t) => {
  const browser = await playwright[browserName].launch();
  t.after(() => browser.close());
  t.diagnostic(`${browserName} ${browser.version()}`);

  for (const platform of ['vue', 'vanilla']) {
    for (const theme of ['light', 'dark']) {
      await t.test(`${platform}, ${theme}, default palette`, async (caseTest) => {
        const page = await browser.newPage({ colorScheme: theme, reducedMotion: 'reduce' });
        caseTest.after(() => page.close());
        await openCase(page, platform, theme, 'radio-checked');
        const radio = page.locator('.cm-radio');
        const rest = await checkRadioState(page, 'rest');
        await radio.hover();
        const hover = await checkRadioState(page, 'hover');
        await page.mouse.down();
        const pressed = await checkRadioState(page, 'pressed');
        await page.mouse.up();
        assert(await page.getByRole('radio').isChecked(), 'pointer release preserves native selection');
        caseTest.diagnostic(`selected dot contrast at rest, hover and press: ${rest}, ${hover}, ${pressed}`);

        await openCase(page, platform, theme, 'input-default');
        for (const surface of [
          'canvas',
          'surface',
          'surface-subtle',
          'surface-elevated',
          'surface-hover',
          'surface-active',
        ]) {
          await page.locator('#visual-root').evaluate((element, surfaceName) => {
            element.style.backgroundColor = `var(--cm-color-background-${surfaceName})`;
            element.style.color = 'var(--cm-color-text-muted)';
          }, surface);
          const [boundary, muted] = await readContrasts(page, [
            ['.cm-input', 'borderBlockStartColor', '#visual-root', 'backgroundColor'],
            ['#visual-root', 'color', '#visual-root', 'backgroundColor'],
          ]);
          assert(boundary >= 3, `${surface} field border contrast is ${boundary.toFixed(2)}:1`);
          if (surface !== 'surface-active') {
            assert(muted >= 4.5, `${surface} muted text contrast is ${muted.toFixed(2)}:1`);
          }
        }

        await openCase(page, platform, theme, 'input-enhanced');
        const input = page.locator('.cm-input');
        await input.evaluate((element) => element.classList.replace('cm-input--md', 'cm-input--sm'));
        const reveal = page.locator('[data-cm-input-password]');
        const clear = page.locator('[data-cm-input-clear]');
        const revealBox = await reveal.boundingBox();
        const clearBox = await clear.boundingBox();
        assert(revealBox.width >= 24 && revealBox.height >= 24, 'compact reveal target is at least 24 by 24');
        assert(clearBox.width >= 24 && clearBox.height >= 24, 'compact clear target is at least 24 by 24');
        assert(revealBox.x + revealBox.width < clearBox.x, 'compact field actions have independent hit areas');
        await reveal.click();
        assert.equal(await input.getAttribute('type'), 'text', 'pointer opens password reveal');
        await clear.click();
        assert.equal(await input.inputValue(), '', 'pointer clears the input');
        assert.equal((await reveal.boundingBox()).x, clearBox.x, 'remaining action sits at the trailing edge');

        for (const [caseId, selector] of [
          ['select-clearable', '.cm-select__clear'],
          ['date-picker-clearable', '.cm-date-picker__clear'],
        ]) {
          await openCase(page, platform, theme, caseId);
          const action = page.locator(selector);
          const box = await action.boundingBox();
          assert(box.width >= 24 && box.height >= 24, `${caseId} clear target is at least 24 by 24`);
          await action.click();
          assert.equal(await action.isVisible(), false, `${caseId} clear action hides after clearing`);
        }

        await openCase(page, platform, theme, 'select-clearable');
        await page.locator('.cm-select').press('Space');
        const listbox = page.getByRole('listbox');
        const option = listbox.getByRole('option').first();
        await option.evaluate((element) => {
          element.textContent = 'InternationalizationWithoutBreaksAcrossNarrowContainerAndLongWordsInTheListBox';
        });
        assert(
          await listbox.evaluate((element) => element.scrollWidth === element.clientWidth),
          'a long option wraps inside the trigger width',
        );
        const listboxBox = await listbox.boundingBox();
        const optionBox = await option.boundingBox();
        assert(
          optionBox.y + optionBox.height <= listboxBox.y + listboxBox.height,
          'the wrapped option is fully visible',
        );

        await openCase(page, platform, theme, 'date-picker-default');
        const trigger = page.locator('.cm-date-picker');
        await page.mouse.move(0, 0);
        const restBorder = await trigger.evaluate((element) => getComputedStyle(element).borderTopColor);
        await trigger.hover();
        const hovered = await trigger.evaluate((element) => {
          const style = getComputedStyle(element);
          return { cursor: style.cursor, border: style.borderTopColor };
        });
        assert.equal(hovered.cursor, 'pointer');
        assert.notEqual(hovered.border, restBorder, 'enabled DatePicker indicates pointer hover');
        await trigger.evaluate((element) => element.setAttribute('aria-readonly', 'true'));
        assert.equal(await trigger.evaluate((element) => getComputedStyle(element).cursor), 'default');
      });

      await t.test(`${platform}, ${theme}, forced colors`, async (caseTest) => {
        const page = await browser.newPage({ colorScheme: theme, forcedColors: 'active', reducedMotion: 'reduce' });
        caseTest.after(() => page.close());
        if (!(await page.evaluate(() => matchMedia('(forced-colors: active)').matches))) {
          caseTest.skip('This browser does not expose forced-colors emulation.');
          return;
        }
        await page.clock.setFixedTime(new Date('2026-08-12T12:00:00Z'));

        for (const [caseId, controls] of focusCases) {
          await openCase(page, platform, theme, caseId);
          await page.keyboard.press('Tab');
          for (const [focusSelector, paintSelector = focusSelector] of controls) {
            const control = page.locator(focusSelector).first();
            await control.focus();
            assert(
              await control.evaluate((element) => element.matches(':focus-visible')),
              `${focusSelector} focuses visibly`,
            );
            const paint = page.locator(paintSelector).first();
            const outline = await paint.evaluate((element) => {
              const style = getComputedStyle(element);
              return {
                style: style.outlineStyle,
                width: Number.parseFloat(style.outlineWidth),
              };
            });
            assert(outline.style === 'solid' && outline.width >= 2, `${paintSelector} has a forced-colors outline`);
            const [contrast] = await readContrasts(page, [
              [paintSelector, 'outlineColor', '#visual-root', 'backgroundColor'],
            ]);
            assert(contrast >= 3, `${paintSelector} focus contrast is ${contrast.toFixed(2)}:1`);
          }
          if (caseId === 'radio-checked') await checkRadioState(page, 'forced colors');
          if (caseId === 'select-clearable') {
            await page.locator('.cm-select').press('ArrowDown');
            await page.keyboard.press('ArrowDown');
            const selected = page.getByRole('option', { selected: true });
            assert(!(await selected.evaluate((element) => element.matches(':focus-visible'))));
            await selected.hover();
            assert.equal(
              await selected.evaluate((element) => getComputedStyle(element).textDecorationLine),
              'underline',
            );
            const [contrast] = await readContrasts(page, [
              ['.cm-select__option--selected', 'color', '.cm-select__listbox', 'backgroundColor'],
            ]);
            assert(contrast >= 4.5, `selected option label contrast is ${contrast.toFixed(2)}:1`);
          }
          if (caseId === 'date-picker-clearable') {
            await page.locator('.cm-date-picker').press('ArrowDown');
            const today = page.getByRole('dialog').locator('[aria-current="date"]');
            assert.equal(await today.evaluate((element) => getComputedStyle(element).textDecorationLine), 'underline');
          }
        }

        await openCase(page, platform, theme, 'theme-switch-default');
        const selectedTheme = '.cm-theme-switch__input:checked + .cm-theme-switch__label';
        assert.equal(
          await page.locator(selectedTheme).evaluate((element) => getComputedStyle(element).textDecorationLine),
          'underline',
        );
        const [selectedThemeContrast] = await readContrasts(page, [
          [selectedTheme, 'color', '.cm-theme-switch', 'backgroundColor'],
        ]);
        assert(selectedThemeContrast >= 4.5, `selected theme label contrast is ${selectedThemeContrast.toFixed(2)}:1`);
      });
    }
  }
});
