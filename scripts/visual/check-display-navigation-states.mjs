import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const browserName = process.env.SHOWCASE_BROWSER || 'chromium';
const playwright = require(process.env.SHOWCASE_PLAYWRIGHT || 'playwright');
const origin = process.env.CM_DISPLAY_VISUAL_ORIGIN || 'http://127.0.0.1:5176/';
const tabKey = process.platform === 'darwin' && browserName === 'webkit' ? 'Alt+Tab' : 'Tab';

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

const focusCases = [
  ['accordion-default', '.cm-accordion__trigger'],
  ['breadcrumbs-default', '.cm-breadcrumbs__link'],
  ['button-variant-secondary', '.cm-button'],
  ['button-variant-ghost', '.cm-button'],
  ['dropdown-default', '.cm-dropdown__trigger'],
  ['icon-button-default', '.cm-icon-button'],
  ['menu-bar-default', '.cm-menu-bar__item--top'],
  ['nav-menu-default', '.cm-nav-menu__item--top'],
  ['popover-default', '.cm-popover__trigger'],
  ['menu-bar-compact-edge', '.cm-menu-bar__item--top', { inset: true, scrollMenu: true }],
  ['nav-menu-default', '.cm-nav-menu__item--active', { inset: true, tabPresses: 3 }],
  ['tabs-default', '.cm-tabs__tab', { inset: true }],
];

const inverseFocusCases = [
  ['button-default', '.cm-button', { inverseFrom: 'primary' }],
  ['icon-button-default', '.cm-icon-button', { inverseFrom: 'ghost' }],
  ['admin-shell-default', '.cm-admin-shell__topbar .cm-button'],
];

const statusFocusCases = [
  ['button-variant-danger', '.cm-button', { status: 'danger' }],
  ['button-default', '.cm-button', { status: 'success', statusFrom: 'primary' }],
  ['icon-button-warn', '.cm-icon-button', { status: 'warn' }],
  ['icon-button-default', '.cm-icon-button', { status: 'info', statusFrom: 'ghost' }],
  ['icon-button-default', '.cm-icon-button', { status: 'help', statusFrom: 'ghost' }],
  ['menu-states', '.cm-menu__item--danger', { status: 'danger', menuKey: 'End' }],
  ['admin-shell-default', '.cm-admin-shell__topbar .cm-button', { status: 'warn' }],
];

async function readFocusPaint(target) {
  return target.evaluate((element) => {
    const style = getComputedStyle(element);
    const hasBorder = Number.parseFloat(style.borderTopWidth) > 0 && !['none', 'hidden'].includes(style.borderTopStyle);
    return {
      fill: style.backgroundColor,
      border: hasBorder ? style.borderTopColor : null,
      shadow: style.boxShadow,
      outline: {
        style: style.outlineStyle,
        color: style.outlineColor,
        width: style.outlineWidth,
        offset: style.outlineOffset,
      },
    };
  });
}

async function readOutlineContrast(target, inset) {
  return target.evaluate((element, inside) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    function rgba(color) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data, (byte) => byte / 255);
    }
    function over(fill, under) {
      return fill.slice(0, 3).map((channel, index) => channel * fill[3] + under[index] * (1 - fill[3]));
    }
    function luminance(channels) {
      const [red, green, blue] = channels.map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      );
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    }
    const layers = [];
    for (let parent = inside ? element : element.parentElement; parent; parent = parent.parentElement) {
      layers.unshift(rgba(getComputedStyle(parent).backgroundColor));
    }
    const surface = layers.reduce((background, layer) => over(layer, background), [1, 1, 1]);
    const ring = luminance(over(rgba(getComputedStyle(element).outlineColor), surface));
    const background = luminance(surface);
    return (Math.max(ring, background) + 0.05) / (Math.min(ring, background) + 0.05);
  }, inset);
}

function readNonFocusPaint({ fill, border, shadow }) {
  return { fill, border, shadow };
}

async function checkFocusStates(page, platform, theme, cases) {
  for (const [
    caseId,
    selector,
    { inset = false, inverseFrom, menuKey, scrollMenu, status, statusFrom, tabPresses = 1 } = {},
  ] of cases) {
    await openCase(page, platform, theme, caseId);
    await page.mouse.move(0, 0);
    const inverseTopbar = caseId === 'admin-shell-default';
    if (inverseTopbar) {
      await page.locator('.cm-admin-shell__topbar').evaluate((header, variant) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `cm-button cm-button--${variant} cm-button--md`;
        button.textContent = 'Account';
        header.append(button);
      }, status ?? 'ghost');
    }
    if (scrollMenu) {
      const menu = page.locator('.cm-menu-bar');
      const scrolls = await menu.evaluate((element) => {
        element.setAttribute('data-cm-menu-bar-scroll', '');
        const list = element.querySelector('.cm-menu-bar__list');
        return list.scrollWidth > list.clientWidth;
      });
      assert(scrolls, `${caseId} has a clipped scroll region`);
    }
    const target = page.locator(selector).first();
    const variant = inverseFrom ? 'contrast' : status;
    const originalVariant = inverseFrom ?? statusFrom;
    const label = variant ? `${caseId} ${variant} variant` : caseId;
    if (originalVariant) {
      assert(
        await target.evaluate(
          (element, { base, previous, next }) => {
            return element.classList.replace(`${base}--${previous}`, `${base}--${next}`);
          },
          { base: selector.slice(1), previous: originalVariant, next: variant },
        ),
        `${label} uses the expected palette`,
      );
    }
    const statusToken = status === 'warn' ? 'warning' : status;
    const tint = inverseTopbar ? 'var(--cm-color-text-inverse) 35%' : 'transparent 0%';
    const expectedFocus = statusToken
      ? `color-mix(in oklab, var(--cm-color-status-${statusToken}-border), ${tint})`
      : 'var(--cm-color-focus-ring)';
    const { focusColor, inverseFill, forcedColors } = await target.evaluate((element, expectedColor) => {
      const sample = document.createElement('span');
      const forcedColors = matchMedia('(forced-colors: active)').matches;
      sample.style.color = forcedColors ? 'CanvasText' : expectedColor;
      sample.style.backgroundColor = 'var(--cm-color-background-inverse)';
      element.parentElement.append(sample);
      const { color: focusColor, backgroundColor: inverseFill } = getComputedStyle(sample);
      sample.remove();
      return { focusColor, inverseFill, forcedColors };
    }, expectedFocus);
    const rest = await readFocusPaint(target);
    if (inverseFrom && !forcedColors) assert.equal(rest.fill, inverseFill, `${label} has an inverse fill`);
    for (let index = 0; index < tabPresses; index++) await page.keyboard.press(tabKey);
    // Firefox visits the horizontally scrolling list before its first menu item.
    if (
      scrollMenu &&
      (await target.evaluate((element) => element.closest('.cm-menu-bar__list') === document.activeElement))
    ) {
      await page.keyboard.press(tabKey);
    }
    if (menuKey) await page.keyboard.press(menuKey);
    assert(await target.evaluate((element) => element.matches(':focus-visible')), `${label} has keyboard focus`);
    const focused = await readFocusPaint(target);
    assert.deepEqual(readNonFocusPaint(focused), readNonFocusPaint(rest), `${label} retains its rest styling on focus`);
    const { style, color, width, offset } = focused.outline;
    assert.deepEqual({ style, width, offset }, { style: 'solid', width: '1px', offset: inset ? '-1px' : '2px' }, label);
    if (!inverseTopbar || status || forcedColors) {
      assert.equal(color, focusColor, `${label} uses the expected focus color`);
    }
    const contrast = await readOutlineContrast(target, inset);
    assert(
      contrast >= 3,
      `${label} focus outline contrasts with the surrounding background by ${contrast.toFixed(2)}:1`,
    );
    await target.hover();
    assert(await target.evaluate((element) => element.matches(':hover')), `${label} is hovered with keyboard focus`);
    const focusedHover = await readFocusPaint(target);
    assert.deepEqual(focusedHover.outline, focused.outline, `${label} retains its focus outline during hover`);
    const hoverContrast = await readOutlineContrast(target, inset);
    assert(hoverContrast >= 3, `${label} hovered focus contrast is ${hoverContrast.toFixed(2)}:1`);
    await target.blur();
    await page.mouse.move(0, 0);
    await target.hover();
    assert(await target.evaluate((element) => element.matches(':hover')), `${label} is hovered after focus leaves`);
    const hovered = await readFocusPaint(target);
    assert.deepEqual(
      readNonFocusPaint(focusedHover),
      readNonFocusPaint(hovered),
      `${label} retains its hover styling on focus`,
    );
  }
}

async function checkDisabledStates(page, platform, theme) {
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
        await checkFocusStates(page, platform, theme, [...focusCases, ...inverseFocusCases, ...statusFocusCases]);
        await checkDisabledStates(page, platform, theme);
      });

      await t.test(`${platform}, ${theme}, forced colors`, async (caseTest) => {
        const page = await browser.newPage({
          viewport: { width: 320, height: 650 },
          colorScheme: theme,
          forcedColors: 'active',
          reducedMotion: 'reduce',
        });
        caseTest.after(() => page.close());
        if (!(await page.evaluate(() => matchMedia('(forced-colors: active)').matches))) {
          caseTest.skip('This browser does not expose forced-colors emulation.');
          return;
        }
        const forcedStatusCases = statusFocusCases.filter(([, , options]) => !options.statusFrom);
        await checkFocusStates(page, platform, theme, [...focusCases, ...inverseFocusCases, ...forcedStatusCases]);
      });
    }
  }
});
