import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

// Run against visual:cross-platform:serve with the built package CSS.
const require = createRequire(import.meta.url);
const browserName = process.env.SHOWCASE_BROWSER || 'chromium';
assert(['chromium', 'firefox', 'webkit'].includes(browserName), `Unsupported browser: ${browserName}`);
const playwright = require(process.env.SHOWCASE_PLAYWRIGHT || 'playwright');
const origin = process.env.CM_FORM_VISUAL_ORIGIN || 'http://127.0.0.1:5176/';
// macOS WebKit uses Option+Tab to include buttons and choice controls in keyboard navigation.
const tabKey = process.platform === 'darwin' && browserName === 'webkit' ? 'Alt+Tab' : 'Tab';

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

async function checkFloatingLabels(page, platform, theme) {
  const label = '.cm-field__label';
  for (const [caseId, control] of [
    ['field-floating-in', '.cm-input'],
    ['field-floating-on', '.cm-input'],
    ['field-floating-over', '.cm-input'],
    ['field-floating-date-picker', '.cm-date-picker'],
  ]) {
    await openCase(page, platform, theme, caseId);
    if (caseId === 'field-floating-over') {
      await page.locator('#visual-root').evaluate((element) => {
        element.style.backgroundColor = 'var(--cm-color-background-surface-elevated)';
      });
    }
    const readLabel = () =>
      page.locator(label).evaluate((element) => {
        const { color, backgroundColor } = getComputedStyle(element);
        return { color, backgroundColor };
      });
    const restingLabel = await readLabel();
    await page.keyboard.press(tabKey);
    const input = page.locator(control);
    assert(await input.evaluate((element) => element.matches(':focus-visible')), `${caseId} receives keyboard focus`);
    const fieldSurface = await input.evaluate((element) => getComputedStyle(element).backgroundColor);
    const checkFocusedLabel = async (status) => {
      const expectedColor = await input.evaluate((element, status) => {
        if (!status) return getComputedStyle(element).outlineColor;
        const sample = document.createElement('span');
        sample.style.color = `var(--cm-color-status-${status}-subtle-foreground)`;
        element.parentElement.append(sample);
        const { color } = getComputedStyle(sample);
        sample.remove();
        return color;
      }, status);
      const { color, backgroundColor } = await readLabel();
      assert.equal(color, expectedColor, `${caseId} label uses the ${status ?? 'neutral focus'} color`);
      assert.equal(backgroundColor, fieldSurface, `${caseId} label uses the field surface`);
      const [contrast] = await readContrasts(page, [[label, 'color', label, 'backgroundColor']]);
      assert(contrast >= 4.5, `${caseId} focused label contrast is ${contrast.toFixed(2)}:1`);
    };
    await checkFocusedLabel();

    if (caseId === 'field-floating-in') {
      const floatingLabel = page.locator(label);
      const neutralBox = await floatingLabel.boundingBox();
      await input.evaluate((element) => element.setAttribute('data-cm-valid', 'true'));
      await checkFocusedLabel('success');
      assert.deepEqual(await floatingLabel.boundingBox(), neutralBox, 'a valid label keeps its geometry');

      await input.evaluate((element) => element.setAttribute('aria-invalid', 'true'));
      await checkFocusedLabel('danger');
      assert.deepEqual(await floatingLabel.boundingBox(), neutralBox, 'an invalid label keeps its geometry');

      await input.evaluate((element) => {
        element.removeAttribute('data-cm-valid');
        element.removeAttribute('aria-invalid');
        element.setAttribute('readonly', '');
      });
      await checkFocusedLabel();
    }

    if (caseId === 'field-floating-date-picker') {
      const calendar = page.getByRole('dialog');
      await page.keyboard.press('ArrowDown');
      await calendar.locator('.cm-date-picker__day:focus-visible').waitFor();
      await page.keyboard.press('Enter');
      await calendar.waitFor({ state: 'hidden' });
      await page.locator('.cm-date-picker:focus-visible').waitFor();
      await checkFocusedLabel();

      await openCase(page, platform, theme, caseId);
      await input.click();
      await calendar.locator('.cm-date-picker__day:focus').click();
      await calendar.waitFor({ state: 'hidden' });
      await page.locator('.cm-date-picker:focus').waitFor();
      assert.equal(await input.getAttribute('data-cm-filled'), 'true');
      assert.deepEqual(await readLabel(), restingLabel, 'pointer selection restores the neutral DatePicker label');

      await input.click();
      await calendar.waitFor();
      await checkFocusedLabel();
      await calendar.locator('.cm-date-picker__navigation:enabled').first().click();
      assert(await calendar.isVisible());
      assert.deepEqual(await readLabel(), restingLabel, 'clicking inside the calendar clears the label highlight');
    }
  }
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

const formFocusCases = [
  ['input-default', 'input'],
  ['textarea-default', 'textarea'],
  ['select-default', 'select'],
  ['date-picker-default', 'date-picker'],
  ['checkbox-default', 'checkbox'],
  ['checkbox-checked', 'checkbox'],
  ['checkbox-indeterminate', 'checkbox'],
  ['radio-checked', 'radio'],
  ['switch-default', 'switch'],
  ['switch-checked', 'switch'],
];

async function checkFormFocus(page, platform, theme, caseTest) {
  for (const [caseId, name] of formFocusCases) {
    const compact = ['checkbox', 'radio', 'switch'].includes(name);
    const focusSelector = compact ? `.cm-${name}__input` : `.cm-${name}`;
    const paintSelector = compact ? `.cm-${name}__control` : focusSelector;
    const focus = page.locator(focusSelector);
    const paint = page.locator(paintSelector);
    const filledChoice = ['checkbox-checked', 'checkbox-indeterminate', 'switch-checked'].includes(caseId);
    const markSelector = name === 'switch' ? '.cm-switch__thumb' : '.cm-checkbox__mark';
    const markColor = caseId === 'checkbox-checked' ? 'borderBlockEndColor' : 'backgroundColor';
    const readPaint = () =>
      paint.evaluate(
        (element, { filledChoice, markSelector, markColor }) => {
          const style = getComputedStyle(element);
          const colors = { fill: style.backgroundColor, ink: style.color };
          if (filledChoice) {
            const mark = getComputedStyle(element.querySelector(markSelector));
            colors.mark = mark[markColor];
            colors.icon = mark.color;
          }
          return {
            colors,
            border: style.borderBlockStartColor,
            borderWidth: style.borderBlockStartWidth,
            shadow: style.boxShadow,
            outline: {
              style: style.outlineStyle,
              width: style.outlineWidth,
              offset: style.outlineOffset,
              color: style.outlineColor,
            },
          };
        },
        { filledChoice, markSelector, markColor },
      );

    for (const state of ['neutral', 'valid', 'invalid']) {
      await openCase(page, platform, theme, caseId);
      await page.mouse.move(0, 0);
      const [validColor, invalidColor, focusColor] = await focus.evaluate(
        (element, { name, state }) => {
          element.closest(`.cm-${name}`).classList.remove(`cm-${name}--invalid`);
          element.removeAttribute('aria-invalid');
          element.removeAttribute('data-cm-valid');
          if (state !== 'neutral') element.setAttribute('data-cm-valid', 'true');
          if (state === 'invalid') element.setAttribute('aria-invalid', 'true');

          const sample = document.createElement('span');
          element.parentElement.append(sample);
          const status = { valid: 'success', invalid: 'danger' }[state];
          const outline = status
            ? `color-mix(in oklab, var(--cm-color-status-${status}-border), transparent 0%)`
            : 'var(--cm-color-focus-ring)';
          const colors = ['var(--cm-color-status-success-border)', 'var(--cm-color-status-danger-border)', outline].map(
            (value) => {
              sample.style.color = value;
              return getComputedStyle(sample).color;
            },
          );
          sample.remove();
          return colors;
        },
        { name, state },
      );
      const label = `${caseId} ${state}`;
      const hasSingleFill = filledChoice && (state === 'neutral' || (state === 'invalid' && name === 'checkbox'));
      const validationColor = { valid: validColor, invalid: invalidColor }[state];
      const checkUnfocused = async ({ border, outline }, interaction) => {
        assert.equal(outline.style, 'none', `${label} has no focus outline ${interaction}`);
        if (hasSingleFill) {
          assert.equal(border, 'rgba(0, 0, 0, 0)', `${label} shows a single colored fill ${interaction}`);
          const [edgeContrast, markContrast] = await readContrasts(page, [
            [paintSelector, 'backgroundColor', '#visual-root', 'backgroundColor'],
            [markSelector, markColor, paintSelector, 'backgroundColor'],
          ]);
          assert(edgeContrast >= 3, `${label} ${interaction} edge contrast is ${edgeContrast.toFixed(2)}:1`);
          assert(markContrast >= 3, `${label} ${interaction} selection mark contrast is ${markContrast.toFixed(2)}:1`);
        } else if (validationColor) {
          assert.equal(border, validationColor, `${label} keeps its validation border ${interaction}`);
        }
      };

      const rest = await readPaint();
      await checkUnfocused(rest, 'at rest');
      await paint.hover();
      const hovered = await readPaint();
      await checkUnfocused(hovered, 'on hover');
      if (filledChoice && state !== 'neutral') {
        assert.notEqual(hovered.colors.fill, rest.colors.fill, `${label} reacts to hover`);
      }

      await page.mouse.move(0, 0);
      await page.keyboard.press(tabKey);
      assert(
        await focus.evaluate((element) => element.matches(':focus-visible')),
        `${label} receives focus by ${tabKey}`,
      );
      const checkFocused = async (unfocused, interaction) => {
        const { border, borderWidth, outline, colors, shadow } = await readPaint();
        assert.deepEqual(
          outline,
          { style: 'solid', width: '1px', offset: '2px', color: focusColor },
          `${label} ${interaction}`,
        );
        assert.equal(border, unfocused.border, `${label} keeps its border color ${interaction}`);
        assert.equal(borderWidth, unfocused.borderWidth, `${label} keeps its border width ${interaction}`);
        assert.equal(shadow, unfocused.shadow, `${label} uses the outline alone ${interaction}`);
        assert.deepEqual(colors, unfocused.colors, `${label} keeps its fill and mark ${interaction}`);
        const [surfaceContrast] = await readContrasts(page, [
          [paintSelector, 'outlineColor', '#visual-root', 'backgroundColor'],
        ]);
        assert(
          surfaceContrast >= 3,
          `${label} ${interaction} focus contrast against the surface is ${surfaceContrast.toFixed(2)}:1`,
        );
        if (filledChoice) {
          const [markContrast] = await readContrasts(page, [
            [markSelector, markColor, paintSelector, 'backgroundColor'],
          ]);
          assert(markContrast >= 3, `${label} ${interaction} selection mark contrast is ${markContrast.toFixed(2)}:1`);
          caseTest.diagnostic(
            `${label} ${interaction} focus contrast against the surface visible in the gap: ${surfaceContrast.toFixed(2)}:1`,
          );
        }
      };
      await checkFocused(rest, 'on focus');
      await paint.hover();
      await checkFocused(hovered, 'on focus and hover');

      if (filledChoice) {
        await focus.blur();
        await page.mouse.down();
        try {
          const pressed = await readPaint();
          await checkUnfocused(pressed, 'when pressed');
          if (state !== 'neutral') {
            assert.notEqual(pressed.colors.fill, hovered.colors.fill, `${label} distinguishes a held press`);
          }
        } finally {
          await page.mouse.move(0, 0);
          await page.mouse.up();
        }
      }
    }
  }
}

test(`Input adornments reflow at 320px with 200% text in ${browserName}`, async (context) => {
  const browser = await playwright[browserName].launch();
  context.after(() => browser.close());
  context.diagnostic(`${browserName} ${browser.version()}`);

  for (const platform of ['vue', 'vanilla']) {
    for (const theme of ['light', 'dark']) {
      await context.test(`${platform}, ${theme}`, async (caseTest) => {
        const page = await browser.newPage({
          viewport: { width: 320, height: 500 },
          colorScheme: theme,
          reducedMotion: 'reduce',
        });
        caseTest.after(() => page.close());
        await openCase(page, platform, theme, 'input-enhanced');
        await page.addStyleTag({
          content: 'html:root { font-size: 200%; } #visual-root { inline-size: 100%; padding: 16px; }',
        });
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('html').evaluate((element) => getComputedStyle(element).fontSize), '32px');
        assert.equal(await page.locator('html').evaluate((element) => element.scrollWidth), 320);

        const input = page.locator('.cm-input');
        const leading = page.locator('.cm-input__leading');
        const trailing = page.locator('.cm-input__trailing');
        const reveal = page.locator('[data-cm-input-password]');
        const clear = page.locator('[data-cm-input-clear]');
        const [field, prefix, suffix, revealBox, clearBox] = await Promise.all(
          [input, leading, trailing, reveal, clear].map((element) => element.boundingBox()),
        );
        assert(suffix.y >= field.y + field.height, 'trailing content has a separate row');
        assert(
          suffix.x >= field.x && suffix.x + suffix.width <= field.x + field.width,
          'trailing text stays within the field width',
        );
        assert(
          prefix.x + prefix.width < revealBox.x && revealBox.x + revealBox.width < clearBox.x,
          'text and actions have independent space',
        );
        for (const box of [prefix, revealBox, clearBox]) {
          assert(
            Math.abs(box.y + box.height / 2 - (field.y + field.height / 2)) <= 1,
            'field adornments stay vertically centred',
          );
        }

        await reveal.press('Space');
        assert.equal(await input.getAttribute('type'), 'text', 'keyboard opens password reveal');
        assert(await input.evaluate((element) => element === document.activeElement), 'reveal returns focus to Input');
        await clear.click();
        assert.equal(await input.inputValue(), '', 'pointer clears the Input');
        assert(await input.evaluate((element) => element === document.activeElement), 'clear returns focus to Input');
        assert.equal(await clear.isVisible(), false, 'empty Input hides the clear action');
      });
    }
  }
});

test(`packaged form and navigation states in ${browserName}`, async (t) => {
  const browser = await playwright[browserName].launch();
  t.after(() => browser.close());
  t.diagnostic(`${browserName} ${browser.version()}`);

  for (const platform of ['vue', 'vanilla']) {
    for (const theme of ['light', 'dark']) {
      await t.test(`${platform}, ${theme}, default palette`, async (caseTest) => {
        const page = await browser.newPage({ colorScheme: theme, reducedMotion: 'reduce' });
        caseTest.after(() => page.close());
        await checkFormFocus(page, platform, theme, caseTest);
        await checkFloatingLabels(page, platform, theme);
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
        await page.mouse.move(0, 0);
        const select = page.locator('.cm-select');
        const readSelectOutline = () =>
          select.evaluate((element) => {
            const { outlineStyle, outlineWidth, outlineOffset, outlineColor, borderTopColor, backgroundColor } =
              getComputedStyle(element);
            return { outlineStyle, outlineWidth, outlineOffset, outlineColor, borderTopColor, backgroundColor };
          });
        const listbox = page.getByRole('listbox');
        const option = listbox.getByRole('option').first();
        const selectRest = await readSelectOutline();
        await select.click();
        await listbox.waitFor();
        await page.mouse.move(0, 0);
        const selectOutline = await readSelectOutline();
        assert.equal(selectOutline.outlineStyle, 'solid');
        assert.equal(selectOutline.outlineWidth, '1px');
        assert.equal(selectOutline.outlineOffset, '2px');
        assert.equal(selectOutline.borderTopColor, selectRest.borderTopColor, 'opening preserves the Select border');
        assert.equal(selectOutline.backgroundColor, selectRest.backgroundColor, 'opening preserves the Select fill');

        await listbox.click({ position: { x: 20, y: 2 } });
        assert(await listbox.isVisible(), 'clicking the listbox padding keeps it open');
        assert.equal((await readSelectOutline()).outlineStyle, 'none', 'clicking inside clears the opening outline');
        await option.click();
        await listbox.waitFor({ state: 'hidden' });
        assert.equal(await select.locator('.cm-select__value').textContent(), 'Daily');

        await openCase(page, platform, theme, 'select-clearable');
        await page.mouse.move(0, 0);
        await page.keyboard.press(tabKey);
        assert.deepEqual(
          await readSelectOutline(),
          selectOutline,
          'pointer opening matches the Select keyboard outline',
        );
        await page.keyboard.press('Space');
        await listbox.locator('[role="option"]:focus-visible').waitFor();
        assert.deepEqual(await readSelectOutline(), selectOutline, 'keyboard opening uses the same Select outline');
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
        const readTrigger = () =>
          trigger.evaluate((element) => {
            const style = getComputedStyle(element);
            return {
              border: style.borderTopColor,
              fill: style.backgroundColor,
              outline: style.outlineStyle,
              color: style.outlineColor,
              width: style.outlineWidth,
              offset: style.outlineOffset,
            };
          });
        await page.mouse.move(0, 0);
        const neutralTrigger = await readTrigger();
        await trigger.hover();
        const hovered = await trigger.evaluate((element) => {
          const style = getComputedStyle(element);
          return { cursor: style.cursor, border: style.borderTopColor };
        });
        assert.equal(hovered.cursor, 'pointer');
        assert.notEqual(hovered.border, neutralTrigger.border, 'enabled DatePicker indicates pointer hover');

        const calendar = page.getByRole('dialog');
        await trigger.click();
        await calendar.locator('[aria-current="date"]:focus').waitFor();
        await page.mouse.move(0, 0);
        const expanded = await readTrigger();
        assert.equal(expanded.outline, 'solid', 'the open field keeps its outline after the pointer leaves');
        assert.equal(expanded.width, '1px');
        assert.equal(expanded.offset, '2px');
        assert.equal(expanded.border, neutralTrigger.border, 'opening preserves the DatePicker border');
        assert.equal(expanded.fill, neutralTrigger.fill, 'opening preserves the DatePicker fill');

        await calendar.locator('.cm-date-picker__navigation:enabled').first().click();
        assert(await calendar.isVisible(), 'the calendar stays open after navigating to another month');
        assert.deepEqual(
          await readTrigger(),
          neutralTrigger,
          'interacting with the calendar removes the opening outline',
        );

        await page.keyboard.press('Escape');
        await calendar.waitFor({ state: 'hidden' });
        await page.locator('.cm-date-picker:focus').waitFor();
        await trigger.click();
        await calendar.locator('[aria-current="date"]:focus').waitFor();
        await page.mouse.move(0, 0);
        assert.deepEqual(await readTrigger(), expanded, 'opening again restores the opening outline');

        await page.keyboard.press('Escape');
        await calendar.waitFor({ state: 'hidden' });
        await page.locator('.cm-date-picker:focus').waitFor();

        await openCase(page, platform, theme, 'date-picker-default');
        await page.keyboard.press(tabKey);
        await page.locator('.cm-date-picker:focus-visible').waitFor();
        assert.deepEqual(expanded, await readTrigger(), 'pointer opening matches the keyboard focus outline');
        await page.keyboard.press('ArrowDown');
        await calendar.locator('[aria-current="date"]:focus-visible').waitFor();
        assert.deepEqual(await readTrigger(), expanded, 'the open field keeps its outline while the date has focus');

        await page.keyboard.press('Escape');
        await calendar.waitFor({ state: 'hidden' });
        await trigger.blur();
        assert.deepEqual(await readTrigger(), neutralTrigger, 'closed field returns to rest');
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
          const canvasText = await page.locator('#visual-root').evaluate((element) => {
            const sample = document.createElement('span');
            sample.style.color = 'CanvasText';
            element.append(sample);
            const { color } = getComputedStyle(sample);
            sample.remove();
            return color;
          });
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
                color: style.outlineColor,
              };
            });
            assert.deepEqual(
              outline,
              { style: 'solid', width: 1, color: canvasText },
              `${paintSelector} has a 1px CanvasText outline`,
            );
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
