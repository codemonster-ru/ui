import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import showcaseGroups from '../../examples/shared/showcase-groups.json' with { type: 'json' };
import { showcaseComponentCases } from '../../examples/shared/showcase-cases.mts';
import { showcaseExamplePrefix } from '../../examples/shared/showcase-inline.mjs';
import { layoutExamples } from '../../examples/shared/showcase-layout-data.mts';
import { normalizeSignificantDom } from '../contracts/significant-dom.mjs';
import { collectComponentManifests } from '../contracts/component-manifests.mjs';
import { collectComponentCases } from '../contracts/component-cases.mjs';

const require = createRequire(import.meta.url);
const browserName = process.env.SHOWCASE_BROWSER || 'chromium';
if (!['chromium', 'firefox', 'webkit'].includes(browserName))
  throw new Error(`Unsupported showcase browser: ${browserName}`);
const playwright = require(process.env.SHOWCASE_PLAYWRIGHT || 'playwright');
const axe = require.resolve('axe-core/axe.min.js');
const browser = await playwright[browserName].launch({
  executablePath: browserName === 'chromium' ? process.env.SHOWCASE_CHROME || undefined : undefined,
});
const output = process.env.SHOWCASE_CAPTURE_DIR;
const adapters = {
  vue: process.env.SHOWCASE_VUE_URL || 'http://127.0.0.1:4173/',
  vanilla: process.env.SHOWCASE_VANILLA_URL || 'http://127.0.0.1:4174/',
};
const viewports = new Map([
  [320, 800],
  [360, 800],
  [390, 844],
  [768, 1024],
  [1440, 900],
]);
const routes = [
  ['core', '', '#theme h2'],
  ['core-alias', 'core/', '#theme h2'],
  ['layouts', 'layouts/', '#layout-primitives'],
  ['colors', 'colors/', '#contrast-matrix'],
  ['icons', 'icons/', '#icon-catalog'],
];
const representative = new Set(['core--1440--light', 'core--360--dark', 'layouts--390--dark']);
let visited = 0;
let accessibilityScans = 0;
let calendarContrastScans = 0;
let scans = [];

function url(base, path) {
  return new URL(path, base).href;
}

async function screenshot(page, name) {
  if (!output) return;
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(output, `${name}.png`), animations: 'disabled', caret: 'hide' });
}

async function doubleTextSize(page, label) {
  const rootFontSize = () =>
    page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize));
  const defaultSize = await rootFontSize();
  const scale = await page.addStyleTag({ content: 'html:root { font-size: 200%; }' });
  assert.equal(await rootFontSize(), defaultSize * 2, `${label}: effective root text size`);
  return scale;
}

async function checkViewport(page, label) {
  const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
  assert.equal(layout.scroll, layout.width, `${label}: document reflows horizontally`);
  const clipped = await page
    .locator('.showcase-brand:visible, .showcase-header button:visible, #showcase-navigation:visible')
    .evaluateAll((items) =>
      items.some((item) => {
        const box = item.getBoundingClientRect();
        return box.left < 0 || box.right > innerWidth;
      }),
    );
  assert.equal(clipped, false, `${label}: clipped header controls`);
}

async function checkAccessibility(page, label) {
  await page.addScriptTag({ path: axe });
  const violations = await page.evaluate(async () => {
    // Keep standalone fixture headings out of the showcase shell's outline check.
    const demos = document.querySelectorAll('.showcase-demo:not([inert])');
    demos.forEach((demo) => {
      demo.inert = true;
    });
    try {
      const result = await window.axe.run({ exclude: ['iframe'] });
      return result.violations.map(({ id, nodes }) => [id, nodes.map((node) => node.target)]);
    } finally {
      demos.forEach((demo) => {
        demo.inert = false;
      });
    }
  });
  scans.push([label, violations]);
  assert.deepEqual(violations, [], `${label}: axe violations`);
  accessibilityScans++;
}

function exampleDemo(page, id) {
  return page.locator(`[data-showcase-example="${id}"]`);
}

async function assertPopupAbove(popup, neighbor, label) {
  await popup.waitFor();
  const hit = await popup.evaluate(
    async (panel, neighbor) => {
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      const popup = panel.getBoundingClientRect();
      const row = neighbor.getBoundingClientRect();
      const left = Math.max(popup.left + 4, row.left, 0);
      const right = Math.min(popup.right - 4, row.right, innerWidth);
      const top = Math.max(popup.top + 4, row.top, 0);
      const bottom = Math.min(popup.bottom - 4, row.bottom, innerHeight);
      if (right <= left || bottom <= top) return 'no overlap';
      return panel.contains(document.elementFromPoint((left + right) / 2, (top + bottom) / 2)) ? 'popup' : 'neighbor';
    },
    await neighbor.elementHandle(),
  );
  assert.equal(hit, 'popup', label);
}

async function checkDevelopmentPreviews(base) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  // Request interception disables the browser's HTTP cache.
  await page.route('**/*', (route) => route.continue());
  const errors = [];
  page.on('requestfailed', (request) => {
    const reason = request.failure()?.errorText;
    if (!reason?.includes('ABORT')) errors.push(`${reason} ${request.url()}`);
  });
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await checkInitialExampleLayout(page, base, 'Vue dev');

    await page.goto(url(base, 'layouts/'), { waitUntil: 'domcontentloaded' });
    const shell = page.locator('#demo-app-shell');
    const preview = shell.locator('iframe.layout-preview__frame');
    await preview.scrollIntoViewIfNeeded();
    await preview.contentFrame().getByRole('tab', { name: 'With aside' }).waitFor();
    await shell.getByRole('radio', { name: '320 px' }).press('Space');
    await expectPreviewWidth(preview, 320);
    assert.deepEqual(errors, [], 'Vue dev preview network/runtime errors');
    console.log('Vue dev: initial inline examples, scrolling, and resizable layout preview passed');
  } finally {
    await page.close();
  }
}

async function checkInitialExampleLayout(page, base, adapter) {
  const ids = ['button-default', 'dropdown-open', 'nav-menu-default', 'dialog-default--size-lg'];
  const frameRequests = [];
  const recordFrame = (request) => {
    if (request.isNavigationRequest() && request.frame() !== page.mainFrame()) frameRequests.push(request.url());
  };
  page.on('request', recordFrame);
  try {
    await page.goto(url(base, 'core/'), { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.showcase-variants iframe').count(), 0, `${adapter}: no per-example frames`);
    assert.equal(await page.evaluate(() => scrollY), 0, `${adapter}: fixtures do not move initial scroll`);
    assert.equal(
      await page.locator('.showcase-demo dialog:modal').count(),
      0,
      `${adapter}: native modals open on demand`,
    );
    assert.equal(await page.locator('html[data-cm-modal-scroll]').count(), 0, `${adapter}: page scrolling is unlocked`);
    await checkButtonVariants(page, adapter);
    assert(
      await exampleDemo(page, 'skeleton-default').locator('.cm-skeleton').isVisible(),
      `${adapter}: Skeleton keeps a visible surface in the compact grid`,
    );
    for (const id of ids) {
      const demo = exampleDemo(page, id);
      assert(await demo.isVisible(), `${adapter}: ${id} is rendered before scrolling`);
      const height = await demo.evaluate((element) => element.offsetHeight);
      await demo.scrollIntoViewIfNeeded();
      assert.equal(
        await demo.evaluate((element) => element.offsetHeight),
        height,
        `${adapter}: ${id} keeps its height when revealed`,
      );
    }
    assert.deepEqual(frameRequests, [], `${adapter}: scrolling requests no separate demo documents`);
  } finally {
    page.off('request', recordFrame);
  }
}

async function checkButtonVariants(page, adapter) {
  await page.evaluate(() => document.fonts.ready);
  for (const slug of ['button', 'icon-button']) {
    const panel = page.locator(`#demo-${slug}`);
    assert.equal(await panel.locator('table').count(), 0);
    assert.equal(await panel.locator('form, [data-showcase-example="button-icon-slots"], a.cm-button').count(), 0);
    assert.equal(await panel.locator('.cm-button--block').count(), 0);
    const { props } = manifests.find((entry) => entry.slug === slug).manifest;
    const axis = (name) => panel.locator(`[data-button-axis="${name}"]`);
    const variants = axis('variant').getByRole('group');
    const sizes = axis('size').getByRole('group');
    const states = axis('state').getByRole('group');
    const labels = (groups) => groups.evaluateAll((items) => items.map((item) => item.getAttribute('aria-label')));

    assert.deepEqual(
      await labels(variants),
      props.variant.values.filter((value) => value !== props.variant.default),
    );
    assert.deepEqual(await labels(sizes), props.size.values);
    assert.deepEqual(await labels(states), slug === 'button' ? ['loading', 'disabled'] : ['disabled']);
    assert.equal(await variants.getByRole('button').count(), props.variant.values.length - 1);
    assert.equal(await sizes.getByRole('button').count(), props.size.values.length);
    const stateButtons = states.getByRole('button');
    assert.equal(await stateButtons.count(), slug === 'button' ? 2 : 1);
    assert(await stateButtons.last().isDisabled());
    assert.equal(await axis('state').locator('[aria-busy="true"]').count(), slug === 'button' ? 1 : 0);
    for (const group of await panel.locator('[data-button-axis]').all()) {
      assert(
        await group.evaluate((element) => element.scrollWidth <= element.clientWidth),
        `${adapter}: ${slug} samples fit`,
      );
    }
    const [colors, sizeGroup, stateGroup] = await panel.locator('[data-button-axis]').evaluateAll((groups) =>
      groups.map((group) => {
        const { top, left, right } = group.getBoundingClientRect();
        return { top, left, right };
      }),
    );
    if (page.viewportSize().width >= 1440) {
      assert.equal(sizeGroup.top, colors.top, `${adapter}: ${slug} sizes sit beside colors`);
      assert.equal(stateGroup.top, colors.top, `${adapter}: ${slug} states sit beside colors`);
      assert(colors.right < sizeGroup.left && sizeGroup.right < stateGroup.left);
      const lastButton = await stateButtons.last().boundingBox();
      const bounds = await panel.boundingBox();
      assert(lastButton.x + lastButton.width > bounds.x + bounds.width * 0.75);
    } else if (page.viewportSize().width === 320) {
      assert(sizeGroup.top > colors.top, `${adapter}: ${slug} groups wrap on narrow screens`);
    }
  }
}

async function checkDatePickerContrast(page, base, adapter) {
  await page.goto(url(base, 'core/'), { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ path: axe });
  for (const variant of ['default', 'clearable']) {
    const demo = exampleDemo(page, 'date-picker-' + variant);
    await demo.scrollIntoViewIfNeeded();
    await demo.getByRole('combobox').press('ArrowDown');
    const calendar = demo.getByRole('dialog');
    await calendar.waitFor();
    if (variant === 'clearable') {
      assert(await calendar.evaluate((panel) => panel.parentElement.id.endsWith('-portal')));
    }
    const violations = await calendar.evaluate(async (panel) => {
      const result = await window.axe.run(panel, { runOnly: ['color-contrast'] });
      return result.violations.map(({ id, nodes }) => [id, nodes.map((node) => node.target)]);
    });
    const label = `${adapter} dark DatePicker (${variant})`;
    scans.push([label, violations]);
    assert.deepEqual(violations, [], `${label}: axe violations`);
    calendarContrastScans++;
    await page.keyboard.press('Escape');
    await calendar.waitFor({ state: 'hidden' });
  }
}

async function checkTooltipExamples(page, adapter) {
  const panel = page.locator('#demo-tooltip');
  assert.deepEqual(await panel.locator('.showcase-variant-title').allTextContents(), [
    'Top',
    'Bottom',
    'Start',
    'End',
    'Long delay',
    'Rich content',
  ]);
  for (const [suffix, side] of [
    ['', 'top'],
    ['--placement-bottom', 'bottom'],
    ['--placement-start', 'left'],
    ['--placement-end', 'right'],
  ]) {
    const demo = exampleDemo(page, `tooltip-default${suffix}`);
    await demo.getByRole('button', { name: 'Copy', exact: true }).hover();
    const tooltip = demo.getByRole('tooltip');
    await tooltip.waitFor();
    assert.equal(await tooltip.textContent(), 'Copy link');
    if (page.viewportSize().width >= 1440) {
      await tooltip.and(demo.locator(`[data-cm-tooltip-inline="${side}"]`)).waitFor();
    }
    await page.keyboard.press('Escape');
    await tooltip.waitFor({ state: 'hidden' });
  }

  const delayed = exampleDemo(page, 'tooltip-default--delay-long');
  await delayed.getByRole('button', { name: 'Copy', exact: true }).hover();
  const delayedTooltip = delayed.getByRole('tooltip');
  assert.equal(await delayedTooltip.isVisible(), false, `${adapter}: long delay starts with the tooltip hidden`);
  await delayedTooltip.waitFor();
  const rich = exampleDemo(page, 'tooltip-custom-trigger');
  await rich.getByRole('button', { name: 'Keyboard shortcuts', exact: true }).focus();
  const richTooltip = rich.getByRole('tooltip');
  await richTooltip.waitFor();
  assert.equal(await richTooltip.locator('kbd').textContent(), '?');
  await page.keyboard.press('Escape');
  await richTooltip.waitFor({ state: 'hidden' });
}

async function checkDropdownExamples(page, adapter) {
  const headings = page.locator('#demo-dropdown .showcase-variant-title');
  assert.deepEqual(await headings.allTextContents(), ['Default', 'Bottom end', 'Pills', 'Custom items', 'Disabled']);
  const standard = exampleDemo(page, 'dropdown-default');
  await standard.getByRole('button', { name: 'Actions' }).click();
  await standard.getByRole('menuitem', { name: 'Edit' }).click();
  await standard.getByRole('menu').waitFor({ state: 'hidden' });

  const aligned = exampleDemo(page, 'dropdown-open');
  await aligned.getByRole('button', { name: 'Account' }).click();
  const alignedMenu = aligned.getByRole('menu');
  await alignedMenu.waitFor();
  assert(await aligned.getByRole('menuitem', { name: 'Billing' }).isDisabled());
  await aligned.getByRole('button', { name: 'Account' }).press('Escape');
  await alignedMenu.waitFor({ state: 'hidden' });

  const pills = exampleDemo(page, 'dropdown-pills');
  const viewOptions = pills.getByRole('button', { name: 'View options' });
  await viewOptions.click();
  const pillsMenu = pills.getByRole('menu');
  await pillsMenu.waitFor();
  await pills.getByRole('menuitem', { name: 'Grid' }).click();
  assert(await pillsMenu.isVisible(), `${adapter}: pill menu stays open after selection`);
  await viewOptions.click();
  await pillsMenu.waitFor({ state: 'hidden' });
  assert(await exampleDemo(page, 'dropdown-disabled').getByRole('button').isDisabled());

  const dropdown = exampleDemo(page, 'dropdown-scoped');
  const quickActions = dropdown.getByRole('button', { name: 'Quick actions' });
  await quickActions.press('ArrowDown');
  const edit = dropdown.getByRole('menuitem', { name: 'Edit', exact: true });
  await edit.waitFor();
  await edit.press('ArrowDown');
  const rename = dropdown.getByRole('menuitem', { name: 'Rename', exact: true });
  assert(await rename.evaluate((item) => item === document.activeElement), `${adapter}: authored menu keyboard focus`);
  await rename.press('Enter');
  await dropdown.getByRole('menu').waitFor({ state: 'hidden' });
}

async function checkPopoverExamples(page, adapter) {
  const headings = page.locator('#demo-popover .showcase-variant-title');
  assert.deepEqual(await headings.allTextContents(), [
    'Bottom start',
    'Top',
    'Bottom end',
    'Custom trigger',
    'Manual dismiss',
    'Disabled',
  ]);
  for (const [suffix, placement] of [
    ['', 'bottom-start'],
    ['--placement-top', 'top'],
    ['--placement-bottom-end', 'bottom-end'],
  ]) {
    const sample = exampleDemo(page, `popover-default${suffix}`);
    const trigger = sample.getByRole('button', { name: 'Shortcuts' });
    await trigger.click();
    const popover = sample.getByRole('dialog');
    await popover.getByText('Press S to save.', { exact: true }).waitFor();
    if (page.viewportSize().width >= 1440) {
      const panel = await popover.boundingBox();
      const anchor = await trigger.boundingBox();
      if (placement === 'top') {
        assert(panel.y + panel.height <= anchor.y, `${adapter}: popover sits above the trigger`);
      } else {
        assert(panel.y >= anchor.y + anchor.height, `${adapter}: popover sits below the trigger`);
        const offset =
          placement === 'bottom-end' ? panel.x + panel.width - anchor.x - anchor.width : panel.x - anchor.x;
        assert(Math.abs(offset) <= 2, `${adapter}: popover aligns at ${placement}`);
      }
    }
    await trigger.press('Escape');
    await popover.waitFor({ state: 'hidden' });
  }
  const custom = exampleDemo(page, 'popover-composed');
  const customTrigger = custom.getByRole('button', { name: 'Open profile details' });
  await customTrigger.click();
  const customPanel = custom.getByRole('dialog');
  await customPanel.getByText('Profile details.', { exact: true }).waitFor();
  await customTrigger.press('Escape');
  await customPanel.waitFor({ state: 'hidden' });
  const manual = exampleDemo(page, 'popover-explicit-dismissal');
  const trigger = manual.getByRole('button', { name: 'Preferences' });
  await trigger.click();
  const popover = manual.getByRole('dialog');
  const field = popover.getByRole('textbox', { name: 'Display name' });
  await field.and(page.locator(':focus')).waitFor();
  await field.press('Escape');
  await page.locator('#component-popover').click();
  assert(await popover.isVisible(), `${adapter}: manual dismissal ignores Escape and outside clicks`);
  await trigger.click();
  await popover.waitFor({ state: 'hidden' });
  assert(await exampleDemo(page, 'popover-default--disabled').getByRole('button').isDisabled());
}

async function checkCorePopupLayers(page, adapter) {
  const center = (trigger) =>
    trigger.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  if (page.viewportSize().width >= 1440) {
    const bottom = exampleDemo(page, 'tooltip-default--placement-bottom');
    const trigger = bottom.getByRole('button', { name: 'Copy', exact: true });
    const neighbor = exampleDemo(page, 'tooltip-custom-trigger').getByRole('button', { name: 'Keyboard shortcuts' });
    await center(trigger);
    await neighbor.evaluate((element) => element.focus({ preventScroll: true }));
    await trigger.hover();
    const tip = bottom.getByRole('tooltip');
    await assertPopupAbove(tip, neighbor, `${adapter}: hovered Tooltip stays above the focused example`);
    await page.keyboard.press('Escape');
    await page.mouse.move(2, 2);
    await tip.waitFor({ state: 'hidden' });
  }
  if (page.viewportSize().width === 360) {
    for (const [id, role, neighborId, neighborSelector] of [
      ['select-clearable--sm', 'listbox', 'select-clearable', '.cm-select__clear'],
      ['date-picker-clearable', 'dialog', 'date-picker-clearable--lg', '.cm-date-picker__clear'],
      ['field-floating-date-picker', 'dialog', 'field-floating-in', '.cm-field__label'],
    ]) {
      const sample = exampleDemo(page, id);
      const trigger = sample.getByRole('combobox');
      await center(trigger);
      await trigger.click();
      const popup = sample.getByRole(role);
      await assertPopupAbove(
        popup,
        exampleDemo(page, neighborId).locator(neighborSelector),
        `${adapter}: ${id} stays above ${neighborId}`,
      );
      await page.keyboard.press('Escape');
      await popup.waitFor({ state: 'hidden' });
    }
  }
}

async function checkSurfaceExamples(page, adapter) {
  for (const [slug, expected] of [
    ['card', ['Default', 'Compact', 'Header & footer']],
    ['panel', ['Default', 'Subtle']],
    ['group-box', ['Collapsible', 'Static', 'Toggle disabled']],
  ]) {
    assert.deepEqual(await page.locator(`#demo-${slug} .showcase-variant-title`).allTextContents(), expected);
  }
  const card = exampleDemo(page, 'card-default').locator('.cm-card');
  const compact = exampleDemo(page, 'card-compact').locator('.cm-card');
  const cardSpacing = (item) =>
    item.evaluate((element) => {
      const style = getComputedStyle(element);
      return [Number.parseFloat(style.paddingInlineStart), Number.parseFloat(style.rowGap)];
    });
  const regularSpacing = await cardSpacing(card);
  const compactSpacing = await cardSpacing(compact);
  assert(
    compactSpacing.every((value, index) => value < regularSpacing[index]),
    `${adapter}: Compact reduces spacing`,
  );
  await exampleDemo(page, 'card-regions').locator('.cm-card__footer').getByText('Ready', { exact: true }).waitFor();

  const background = (id) =>
    exampleDemo(page, id)
      .locator('.cm-panel')
      .evaluate((item) => getComputedStyle(item).backgroundColor);
  const panelBackground = await background('panel-default');
  const backdrop = await exampleDemo(page, 'panel-subtle').evaluate((item) => getComputedStyle(item).backgroundColor);
  assert.equal(await background('panel-subtle'), 'rgba(0, 0, 0, 0)');
  assert.notEqual(panelBackground, backdrop, `${adapter}: Subtle reveals a different backdrop`);

  const group = exampleDemo(page, 'group-box-default');
  const toggle = group.getByRole('button', { name: 'Invoice details' });
  const input = group.getByRole('textbox', { name: 'Reference' });
  await input.fill('PO-456');
  await toggle.press('Space');
  await input.waitFor({ state: 'hidden' });
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  await toggle.click();
  await input.waitFor();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(await input.inputValue(), 'PO-456', `${adapter}: reopening the Group Box preserves the input`);
  const staticGroup = exampleDemo(page, 'group-box-default--not-collapsible');
  assert.equal(await staticGroup.getByRole('button').count(), 0);
  await staticGroup.getByRole('textbox').waitFor();
  const disabled = exampleDemo(page, 'group-box-disabled');
  const disabledToggle = disabled.getByRole('button', { name: 'Invoice details' });
  const disabledInput = disabled.getByRole('textbox', { name: 'Reference' });
  assert(await disabledToggle.isDisabled());
  await disabledInput.waitFor();
  const gap = await disabled.locator('.cm-group-box').evaluate((box) => {
    const label = box.querySelector('.cm-field__label').getBoundingClientRect();
    const trigger = box.querySelector('.cm-group-box__trigger').getBoundingClientRect();
    return label.top - trigger.bottom;
  });
  assert(gap >= 8, `${adapter}: Group Box leaves space below the toggle`);
  await disabledToggle.click({ force: true });
  assert.equal(await disabledToggle.getAttribute('aria-expanded'), 'true');
  await disabledInput.fill('PO-456');
  assert.equal(await disabledInput.inputValue(), 'PO-456');
  for (const example of [group, disabled]) {
    const trigger = example.locator('.cm-group-box__trigger');
    assert.match(await trigger.getAttribute('class'), /\bcm-button--md\b/u);
    const size = await example
      .locator('.cm-group-box__icon')
      .evaluate((icon) => [getComputedStyle(icon).width, getComputedStyle(icon).height]);
    assert.deepEqual(size, ['14px', '14px'], `${adapter}: Group Box uses the small icon size`);
  }
}

async function checkFeedbackExamples(page, adapter) {
  const palette = ['Neutral', 'Primary', 'Success', 'Info', 'Warning', 'Help', 'Danger', 'Contrast'];
  for (const slug of ['alert', 'badge', 'tag']) {
    const headings = await page.locator(`#demo-${slug} .showcase-variant-title`).allTextContents();
    assert.deepEqual(headings, palette, `${adapter}: one sample per ${slug} tone`);
  }
  const progress = page.locator('#demo-progress-bar .showcase-variant-title');
  assert.deepEqual(await progress.allTextContents(), [...palette, 'Indeterminate', 'Moving stripes', 'Static stripes']);
  const bar = (id) => exampleDemo(page, id).locator('.cm-progress-bar__value');
  const moving = bar('progress-bar-striped');
  const stationary = bar('progress-bar-striped--not-animated');
  const gradient = (item) => item.evaluate((element) => getComputedStyle(element).backgroundImage);
  assert.match(await gradient(moving), /^repeating-linear-gradient\(/u);
  assert.equal(await gradient(moving), await gradient(stationary));

  const animation = (item, pseudo = null) =>
    item.evaluate((element, pseudo) => getComputedStyle(element, pseudo).animationName, pseudo);
  const shimmer = exampleDemo(page, 'skeleton-default').locator('.cm-skeleton');
  const staticSkeleton = exampleDemo(page, 'skeleton-default--not-animated').locator('.cm-skeleton');
  const spinner = exampleDemo(page, 'progress-spinner-default').locator('.cm-progress-spinner__svg');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  try {
    assert.equal(await animation(moving), 'cm-progress-bar-stripes');
    assert.equal(await animation(stationary), 'none');
    assert.equal(await animation(bar('progress-bar-indeterminate'), '::before'), 'cm-progress-bar-indeterminate');
    assert.equal(await animation(spinner), 'cm-progress-spinner-rotate');
    assert.equal(await animation(shimmer, '::after'), 'cm-skeleton-shimmer');
    assert.equal(await animation(staticSkeleton, '::after'), 'none');
  } finally {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  }
  assert.equal(await animation(moving), 'none');
  assert.equal(await animation(shimmer, '::after'), 'none');
  const demo = exampleDemo(page, 'skeleton-gate-ready');
  assert.equal(await page.locator('#demo-skeleton-gate .showcase-demo').count(), 1);
  const gate = demo.locator('.cm-skeleton-gate');
  const overlay = gate.locator('.cm-skeleton-gate__overlay');
  const content = gate.locator('.cm-skeleton-gate__content');
  const load = demo.getByRole('button', { name: 'Load invoice', exact: true });
  const card = demo.locator('.cm-card').filter({ has: gate });
  assert.equal(await demo.locator('.cm-card').count(), 1);
  const height = () => card.evaluate((element) => element.getBoundingClientRect().height);
  await overlay.waitFor({ state: 'hidden' });
  await card.getByRole('heading', { name: 'Invoice INV-1042', exact: true }).waitFor();
  const readyHeight = await height();
  await load.press('Enter');
  await overlay.waitFor();
  assert.equal(await gate.getAttribute('aria-busy'), 'true');
  assert.ok(await content.evaluate((element) => element.inert));
  assert.equal(await overlay.locator('.cm-skeleton').count(), 4);
  assert.equal(await height(), readyHeight, `${adapter}: Skeleton Gate reserves the invoice height`);
  await overlay.waitFor({ state: 'hidden' });
  assert.equal(await gate.getAttribute('aria-busy'), null);
  assert.equal(await content.evaluate((element) => element.inert), false);
  await card.getByText('$120.00', { exact: true }).waitFor();
  await card.getByText('Paid', { exact: true }).waitFor();
  assert.equal(await height(), readyHeight);
}

async function checkDisclosureNavigation(page, adapter) {
  assert.equal(await page.locator('#demo-menu-bar [aria-expanded="true"]').count(), 0);
  const single = exampleDemo(page, 'accordion-default');
  const account = single.getByRole('button', { name: 'Account' });
  const billing = single.getByRole('button', { name: 'Billing' });
  await account.press('Enter');
  await single.getByText('Account answer.', { exact: true }).waitFor();
  await billing.press('Enter');
  await single.getByText('Billing answer.', { exact: true }).waitFor();
  assert.equal(await account.getAttribute('aria-expanded'), 'false');
  const multiple = exampleDemo(page, 'accordion-multiple-open');
  await multiple.getByText('Account answer.', { exact: true }).waitFor();
  await multiple.getByText('Billing answer.', { exact: true }).waitFor();
  await multiple.getByRole('button', { name: 'Account' }).click();
  await multiple.getByText('Account answer.', { exact: true }).waitFor({ state: 'hidden' });
  assert(await multiple.getByText('Billing answer.', { exact: true }).isVisible());
  assert(await exampleDemo(page, 'accordion-disabled').getByRole('button', { name: 'Billing' }).isDisabled());

  const tabs = exampleDemo(page, 'tabs-disabled');
  assert(await tabs.getByRole('tab', { name: 'Advanced' }).isDisabled());
  await tabs.getByRole('tab', { name: 'General' }).press('ArrowRight');
  assert.equal(await tabs.getByRole('tab', { name: 'Billing' }).getAttribute('aria-selected'), 'true');
  await tabs.getByRole('tabpanel').getByText('Billing settings.', { exact: true }).waitFor();
  const scrollable = exampleDemo(page, 'tabs-overflow');
  await scrollable.getByRole('button', { name: 'Scroll to later tabs' }).click();
  await page.waitForFunction(
    () => document.querySelector('[data-showcase-example="tabs-overflow"] [role="tablist"]').scrollLeft > 0,
  );

  const stepper = exampleDemo(page, 'stepper-default');
  const firstStep = stepper.getByRole('button', { name: 'Account' });
  await firstStep.press('Enter');
  assert.equal(await firstStep.getAttribute('aria-current'), 'step');
  assert(await stepper.getByRole('button', { name: 'Review' }).isDisabled());

  for (const [id, expanded] of [
    ['nav-menu-default', 'true'],
    ['nav-menu-default--expandMode-single', 'false'],
  ]) {
    const menu = exampleDemo(page, id);
    const projects = menu.getByRole('button', { name: 'Projects' });
    assert.equal(await projects.getAttribute('aria-expanded'), 'true');
    await menu.getByRole('button', { name: 'Activity' }).click();
    assert.equal(await projects.getAttribute('aria-expanded'), expanded);
  }
  for (const id of ['nav-menu-default', 'nav-menu-default--expandMode-single', 'nav-menu-compact', 'nav-menu-pills']) {
    const menu = exampleDemo(page, id);
    await menu.getByRole('link', { name: 'Dashboard' }).press('Enter');
    assert.deepEqual(await menu.locator('[aria-current="page"]').allTextContents(), ['Dashboard']);
    const active = menu.getByRole('link', { name: 'Active', exact: true });
    const projects = menu.getByRole('button', { name: 'Projects' });
    if ((await projects.getAttribute('aria-expanded')) === 'false') await projects.press('Enter');
    await active.press('Enter');
    assert.deepEqual(await menu.locator('[aria-current="page"]').allTextContents(), ['Active']);
  }
  const menu = exampleDemo(page, 'menu-states');
  await menu.getByRole('menuitem', { name: 'Open project' }).press('ArrowDown');
  await menu.getByRole('menuitem', { name: 'Details' }).and(page.locator(':focus')).waitFor();

  const menuBar = exampleDemo(page, 'menu-bar-pills');
  assert.equal(await menuBar.getByRole('menuitem', { name: 'Help' }).getAttribute('aria-current'), 'page');
  const file = menuBar.getByRole('menuitem', { name: 'File' });
  await file.press('ArrowDown');
  await menuBar.getByRole('menuitem', { name: 'New' }).and(page.locator(':focus')).waitFor();
  await file.press('Escape');
  const constrained = exampleDemo(page, 'menu-bar-compact-edge');
  const reports = constrained.getByRole('menuitem', { name: 'Available reports' });
  await reports.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await reports.press('ArrowDown');
  if (page.viewportSize().width >= 1024) {
    await assertPopupAbove(
      constrained.locator('.cm-menu-bar__submenu:visible').first(),
      menu.locator('.cm-menu__item').first(),
      `${adapter}: Available reports stays above the overlapping Menu item`,
    );
  }
  await constrained.getByRole('menuitem', { name: 'Activity summary' }).press('ArrowDown');
  await constrained.getByRole('menuitem', { name: 'Security audit reports' }).press('ArrowRight');
  const nested = constrained.getByRole('menuitem', { name: 'Download the audit activity report' });
  await nested.and(page.locator(':focus')).waitFor();
  await nested.press('Escape');
  await nested.waitFor({ state: 'hidden' });

  const contents = exampleDemo(page, 'table-of-contents-default--variant-pills');
  await contents.getByRole('link', { name: 'Date Picker' }).click();
  await page.locator('#demo-date-picker:focus').waitFor();
  assert.equal(new URL(page.url()).hash, '#demo-date-picker', `${adapter}: contents link jumps to its section`);
}

async function checkExampleInteractions(page, base, adapter) {
  await page.goto(url(base, 'core/'), { waitUntil: 'domcontentloaded' });
  await checkTooltipExamples(page, adapter);
  await checkDropdownExamples(page, adapter);
  await checkPopoverExamples(page, adapter);
  await checkCorePopupLayers(page, adapter);
  await checkSurfaceExamples(page, adapter);
  await checkFeedbackExamples(page, adapter);
  const labelAboveControl = (id) =>
    exampleDemo(page, id)
      .locator('.cm-field')
      .evaluate((field) => {
        const label = field.querySelector('.cm-field__label').getBoundingClientRect();
        const control = field.querySelector('.cm-field__control').getBoundingClientRect();
        return label.bottom < control.top;
      });
  assert.equal(await labelAboveControl('form-layout-default--mode-stacked'), true);
  assert.equal(await labelAboveControl('form-layout-default--mode-horizontal'), false);
  assert.equal(await labelAboveControl('form-layout-default'), page.viewportSize().width < 768);
  const demo = exampleDemo(page, 'select-default');
  await demo.scrollIntoViewIfNeeded();
  const trigger = demo.getByRole('combobox', { name: 'Frequency' });
  const listbox = demo.getByRole('listbox');
  const checkSelectFits = async (input) => {
    await listbox.waitFor();
    const { top, left, right, bottom, width, height, optionsFit } = await listbox.evaluate(async (element) => {
      await document.fonts.ready;
      // Anchored positioning settles on the next animation frame.
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      const { top, left, right, bottom } = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const visibleTop = top + parseFloat(style.borderTopWidth);
      const visibleBottom = bottom - parseFloat(style.borderBottomWidth);
      const options = [...element.querySelectorAll('[role="option"]')];
      const optionsFit =
        options.length === 2 &&
        options.every((option) => {
          const rect = option.getBoundingClientRect();
          return rect.top >= visibleTop && rect.bottom <= visibleBottom;
        });
      return { top, left, right, bottom, width: innerWidth, height: innerHeight, optionsFit };
    });
    const label = `${adapter}: Select preview after ${input} open`;
    assert(top >= 0 && left >= 0 && right <= width && bottom <= height, `${label} fits the viewport`);
    assert(optionsFit, `${label} exposes both options without scrolling`);
  };

  await trigger.click();
  await checkSelectFits('pointer');
  await trigger.click();
  await listbox.waitFor({ state: 'hidden' });

  await trigger.press('ArrowDown');
  await checkSelectFits('keyboard');
  assert(await listbox.getByRole('option', { name: 'Daily' }).evaluate((option) => option === document.activeElement));
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  assert.match(await trigger.textContent(), /Weekly/);
  assert(await trigger.evaluate((button) => button === document.activeElement));

  const daily = exampleDemo(page, 'radio-default').getByRole('radio');
  const weekly = exampleDemo(page, 'radio-checked').getByRole('radio');
  assert(await weekly.isChecked(), `${adapter}: the checked radio starts selected`);
  await exampleDemo(page, 'radio-default').getByText('Daily', { exact: true }).click();
  assert(await daily.isChecked(), `${adapter}: the clicked radio is selected`);
  assert(await weekly.isChecked(), `${adapter}: selecting a radio leaves adjacent variants unchanged`);

  const portaledSelect = exampleDemo(page, 'select-adornments');
  const portaledTrigger = portaledSelect.getByRole('combobox');
  await portaledTrigger.press('ArrowDown');
  const portaledList = portaledSelect.getByRole('listbox');
  await portaledList.waitFor();
  assert(await portaledList.evaluate((list) => list.parentElement.id.endsWith('-portal')));
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await portaledList.waitFor({ state: 'hidden' });
  assert.match(await portaledTrigger.textContent(), /Weekly/);

  const passwordDemo = exampleDemo(page, 'input-enhanced');
  const password = passwordDemo.locator('input.cm-input');
  assert.equal(await password.getAttribute('type'), 'password');
  await passwordDemo.getByRole('button', { name: 'Show secret', exact: true }).click();
  assert.equal(await password.getAttribute('type'), 'text');
  await passwordDemo.getByRole('button', { name: 'Hide secret', exact: true }).click();
  assert.equal(await password.getAttribute('type'), 'password');
  await passwordDemo.getByRole('button', { name: 'Clear password', exact: true }).click();
  assert.equal(await password.inputValue(), '');

  const clearableDate = exampleDemo(page, 'date-picker-clearable');
  const clearDate = clearableDate.getByRole('button', { name: 'Remove launch date', exact: true });
  await clearDate.click();
  await clearDate.waitFor({ state: 'hidden' });
  const readOnlyDate = exampleDemo(page, 'date-picker-value');
  const readOnlyTrigger = readOnlyDate.getByRole('combobox');
  assert.match(await readOnlyTrigger.textContent(), /2026|26/u);
  await readOnlyTrigger.click();
  assert.equal(await readOnlyTrigger.getAttribute('aria-expanded'), 'false');

  const mixed = exampleDemo(page, 'checkbox-indeterminate').getByRole('checkbox');
  assert(await mixed.evaluate((input) => input.indeterminate));
  await mixed.press('Space');
  assert(await mixed.isChecked());
  assert.equal(await mixed.evaluate((input) => input.indeterminate), false);
  const thumb = exampleDemo(page, 'switch-custom-thumb').getByRole('switch');
  assert(await thumb.isChecked());
  await thumb.press('Space');
  assert.equal(await thumb.isChecked(), false);

  const quantity = exampleDemo(page, 'input-number').getByRole('spinbutton');
  assert.equal(await quantity.inputValue(), '2.5');
  await quantity.press('ArrowUp');
  assert.equal(await quantity.inputValue(), '3');

  await checkDisclosureNavigation(page, adapter);

  const field = exampleDemo(page, 'field-floating-date-picker');
  await field.getByRole('combobox').click();
  await field.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  await field.getByRole('dialog').waitFor({ state: 'hidden' });

  const mask = exampleDemo(page, 'data-table-default--loadingVariant-mask');
  await mask.locator('table[inert]').waitFor();

  const tableDemo = exampleDemo(page, 'data-table-default');
  await tableDemo.scrollIntoViewIfNeeded();
  const header = tableDemo.getByRole('columnheader', { name: /Name/ });
  const rows = tableDemo.locator('tbody tr td:first-child');
  await header.waitFor();
  assert.equal(await header.getAttribute('aria-sort'), null);
  assert.deepEqual(await rows.allTextContents(), ['Apollo', 'Zephyr']);
  if (page.viewportSize().width === 360) {
    const scrolls = await tableDemo
      .locator('.cm-data-table__scroll')
      .evaluate((table) => table.scrollWidth > table.clientWidth);
    assert.equal(scrolls, false, `${adapter}: the two-column DataTable fits the narrow preview`);
  }
  const clientTable = exampleDemo(page, 'data-table-raw-rows');
  const clientHeader = clientTable.getByRole('columnheader', { name: /Name/ });
  assert.equal(await page.locator('[data-cm-data-table-sort]').count(), 1, `${adapter}: one sortable preview`);
  assert.equal(await page.locator('.cm-data-table [aria-sort]').count(), 1);
  const sortButton = clientHeader.locator('button.cm-button[data-cm-data-table-sort]');
  const sortIcon = sortButton.locator('.cm-data-table__sort-indicator svg:visible');
  assert.equal(await sortButton.count(), 1);
  assert.equal(await sortIcon.getAttribute('data-cm-sort-icon'), 'none');
  const clientRows = clientTable.locator('tbody tr[data-cm-data-table-row] > td[data-cm-data-table-column]');
  assert.deepEqual(await clientRows.allTextContents(), ['Zephyr', 'Apollo', 'Luna']);
  for (const [direction, label, expected] of [
    ['ascending', 'Sort Name descending', ['Apollo', 'Luna', 'Zephyr']],
    ['descending', 'Clear sorting for Name', ['Zephyr', 'Luna', 'Apollo']],
    ['none', 'Sort Name ascending', ['Zephyr', 'Apollo', 'Luna']],
  ]) {
    if (direction === 'ascending') await sortButton.click();
    else await sortButton.press('Enter');
    await clientHeader.and(clientTable.locator(`[aria-sort="${direction}"]`)).waitFor();
    assert.deepEqual(await clientRows.allTextContents(), expected, `${adapter}: client sorting ${direction}`);
    assert.equal(await sortButton.getAttribute('aria-label'), label);
    assert.equal(await sortIcon.getAttribute('data-cm-sort-icon'), direction);
  }

  const paginatedTable = exampleDemo(page, 'data-table-pagination');
  const pagination = paginatedTable.getByRole('navigation', { name: 'Table pagination', exact: true });
  await pagination.getByText('Page 1 of 2', { exact: true }).waitFor();
  assert.equal(await page.locator('.cm-data-table__pagination').count(), 1, `${adapter}: one pagination example`);
  const available = paginatedTable.locator('tbody tr:visible td:nth-child(2)');
  const firstPage = ['24', '0', '7', '31', '16'];
  const secondPage = ['4', '12'];
  const next = pagination.getByRole('button', { name: 'Next page' });
  assert.deepEqual(await available.allTextContents(), firstPage);
  await next.press('Enter');
  await pagination.getByText('Page 2 of 2', { exact: true }).waitFor();
  assert.deepEqual(await available.allTextContents(), secondPage, `${adapter}: page two displays different rows`);
  await pagination.getByRole('button', { name: 'Previous page' }).press('Enter');
  await pagination.getByText('Page 1 of 2', { exact: true }).waitFor();
  assert.deepEqual(await available.allTextContents(), firstPage);
  await next.press('Enter');
  await pagination.getByText('Page 2 of 2', { exact: true }).waitFor();
  const pageSize = pagination.getByRole('combobox', { name: 'Rows per page' });
  assert.match(await next.getAttribute('class'), /\bcm-button\b/u);
  assert.match(await pageSize.getAttribute('class'), /\bcm-select\b/u);
  const sizeMenu = page.locator(`[id="${await pageSize.getAttribute('aria-controls')}"]`);
  await pageSize.click();
  await sizeMenu.getByRole('option', { name: '10', exact: true }).click();
  await pagination.getByText('Page 1 of 1', { exact: true }).waitFor();
  assert.deepEqual(await available.allTextContents(), [...firstPage, ...secondPage]);

  const selection = exampleDemo(page, 'data-table-interactive');
  const selectAll = selection.getByRole('checkbox', { name: 'Select all rows', exact: true });
  const atlas = selection.getByRole('checkbox', { name: 'Select Atlas', exact: true });
  const nova = selection.getByRole('checkbox', { name: 'Select Nova', exact: true });
  const luna = selection.getByRole('checkbox', { name: 'Select Luna', exact: true });
  const selectedRows = selection.locator('.cm-data-table__row--selected');
  const selectedIds = () => selectedRows.evaluateAll((items) => items.map((row) => row.dataset.cmDataTableRow));
  const isMixed = () => selectAll.evaluate((input) => input.indeterminate);
  assert.equal(await page.locator('[data-cm-data-table-select-all]').count(), 1, `${adapter}: one selection example`);
  assert.equal(await selection.locator('.cm-checkbox > .cm-checkbox__input[type="checkbox"]').count(), 4);
  assert(await atlas.isDisabled());
  assert.deepEqual(await selectedIds(), []);
  await nova.press('Space');
  assert(await nova.isChecked());
  assert(await isMixed());
  assert.deepEqual(await selectedIds(), ['nova']);
  await selectAll.locator('..').locator('.cm-checkbox__control').click();
  assert(await selectAll.isChecked());
  assert.equal(await isMixed(), false);
  assert(await nova.isChecked());
  assert(await luna.isChecked());
  assert.equal(await atlas.isChecked(), false);
  assert.deepEqual(await selectedIds(), ['nova', 'luna']);
  await selectAll.press('Space');
  assert.equal(await selectAll.isChecked(), false);
  assert.equal(await isMixed(), false);
  assert.equal(await nova.isChecked(), false);
  assert.equal(await luna.isChecked(), false);
  assert.deepEqual(await selectedIds(), []);

  const expansion = exampleDemo(page, 'data-table-expansion');
  assert.deepEqual(
    await page
      .locator('.showcase-demo:has([data-cm-data-table-expand])')
      .evaluateAll((demos) => demos.map((demo) => demo.dataset.showcaseExample)),
    ['data-table-expansion'],
    `${adapter}: one row details example`,
  );
  const atlasDetailsButton = expansion.locator('[data-cm-data-table-row="atlas"] [data-cm-data-table-expand]');
  const novaDetailsButton = expansion.locator('[data-cm-data-table-row="nova"] [data-cm-data-table-expand]');
  assert.equal(await atlasDetailsButton.getAttribute('aria-expanded'), 'false');
  assert.equal(await novaDetailsButton.getAttribute('aria-expanded'), 'false');
  assert.equal(await atlasDetailsButton.getAttribute('aria-label'), 'Expand Atlas');
  assert.equal(await novaDetailsButton.getAttribute('aria-label'), 'Expand Nova');
  const visibleDetails = expansion.locator('.cm-data-table__expanded-row:visible');
  assert.equal(await visibleDetails.count(), 0, `${adapter}: both rows start collapsed`);
  await atlasDetailsButton.press('Enter');
  await visibleDetails.waitFor();
  assert.equal(await novaDetailsButton.getAttribute('aria-expanded'), 'false');
  const atlasPanelId = await atlasDetailsButton.getAttribute('aria-controls');
  const atlasDetails = expansion.locator(`[id="${atlasPanelId}"]`);
  assert.equal(await atlasDetails.textContent(), 'Account notes.');
  await novaDetailsButton.click();
  const novaPanelId = await novaDetailsButton.getAttribute('aria-controls');
  const novaDetails = expansion.locator(`[id="${novaPanelId}"]`);
  await novaDetails.waitFor();
  await atlasDetailsButton.press('Space');
  await atlasDetails.waitFor({ state: 'hidden' });
  assert.equal(await atlasDetailsButton.getAttribute('aria-expanded'), 'false');
  assert.equal(await atlasDetailsButton.getAttribute('aria-label'), 'Expand Atlas');
  assert(await novaDetails.isVisible(), `${adapter}: collapsing one row leaves the other open`);
  await atlasDetailsButton.press('Enter');
  await atlasDetails.waitFor();
  assert.equal(await atlasDetails.textContent(), 'Account notes.');
  assert.equal(await atlasDetailsButton.getAttribute('aria-expanded'), 'true');
  assert.equal(await atlasDetailsButton.getAttribute('aria-label'), 'Collapse Atlas');
  assert.equal(await atlasDetailsButton.getAttribute('aria-controls'), atlasPanelId);
  await novaDetailsButton.click();
  await novaDetails.waitFor({ state: 'hidden' });
  assert(await atlasDetails.isVisible(), `${adapter}: each row owns its details`);

  const resizable = exampleDemo(page, 'data-table-resizable');
  assert.equal(await page.locator('[data-cm-data-table-resize]').count(), 1, `${adapter}: one resize handle`);
  assert.equal(await page.locator('#preview-data-table-expansion + #preview-data-table-resizable').count(), 1);
  const handle = resizable.getByRole('separator', { name: 'Resize Name column', exact: true });
  await handle.scrollIntoViewIfNeeded();
  const measureColumns = () =>
    resizable.getByRole('columnheader').evaluateAll((cells) => cells.map((cell) => cell.getBoundingClientRect().width));
  const before = await measureColumns();
  const bounds = await handle.boundingBox();
  assert(bounds, `${adapter}: the resize handle is visible`);
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  const delta = 32;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + delta, y, { steps: 4 });
  await page.mouse.up();
  const after = await measureColumns();
  assert(Math.abs(after[0] - before[0] - delta) <= 2, `${adapter}: Name widens (${before[0]} → ${after[0]})`);
  assert(Math.abs(after[1] - before[1] + delta) <= 2, `${adapter}: Status narrows (${before[1]} → ${after[1]})`);
  assert.equal(Number(await handle.getAttribute('aria-valuenow')), Math.round(after[0]));

  await checkModalExamples(page, adapter);
}

async function checkModalExamples(page, adapter) {
  const drawerBlock = page.locator('#demo-drawer');
  for (const [group, labels] of [
    ['Sides', ['Start', 'End', 'Top', 'Bottom']],
    ['Sizes', ['sm', 'md', 'lg', 'Full']],
  ]) {
    const buttons = drawerBlock.getByRole('group', { name: group, exact: true }).locator('[data-showcase-open]');
    assert.deepEqual(await buttons.allTextContents(), labels);
    assert.equal(await buttons.and(page.locator('.cm-button--secondary')).count(), labels.length);
  }
  const open = async (id) => {
    const demo = exampleDemo(page, id);
    await demo.locator('[data-showcase-open].cm-button--secondary').press('Enter');
    const modal = demo.locator('dialog:modal');
    await modal.waitFor();
    return modal;
  };
  const escape = async (modal) => {
    await page.keyboard.press('Escape');
    await modal.waitFor({ state: 'hidden' });
  };
  await escape(await open('dialog-default'));
  const manual = await open('dialog-escape-disabled');
  await page.keyboard.press('Escape');
  assert(await manual.isVisible(), `${adapter}: Dialog waits for its close button`);
  await manual.getByRole('button', { name: 'Close', exact: true }).click();
  await manual.waitFor({ state: 'hidden' });
  const composed = await open('dialog-composed');
  await composed.getByRole('textbox', { name: 'Release title' }).waitFor();
  await escape(composed);

  for (const [id, side] of [
    ['drawer-open', 'start'],
    ['drawer-default', 'end'],
    ['drawer-top', 'top'],
    ['drawer-bottom', 'bottom'],
  ]) {
    const drawer = await open(id);
    const bounds = await drawer.boundingBox();
    const { width, height } = page.viewportSize();
    const offset = {
      start: bounds.x,
      end: width - bounds.x - bounds.width,
      top: bounds.y,
      bottom: height - bounds.y - bounds.height,
    }[side];
    assert(Math.abs(offset) <= 2, `${adapter}: Drawer aligns to ${side}`);
    await escape(drawer);
  }
  const medium = drawerBlock.getByRole('button', { name: 'md (Drawer)', exact: true });
  await medium.press('Enter');
  const defaultDrawer = exampleDemo(page, 'drawer-default').locator('dialog.cm-drawer--md:modal');
  await defaultDrawer.waitFor();
  await escape(defaultDrawer);
  assert(await medium.evaluate((button) => button === document.activeElement));
  const offsetDrawer = await open('drawer-physical-offset');
  assert(Math.abs((await offsetDrawer.boundingBox()).y - 48) <= 2);
  await page.mouse.click(page.viewportSize().width - 2, 80);
  await offsetDrawer.waitFor({ state: 'hidden' });
  const offsetWithClose = await open('drawer-physical-offset');
  await offsetWithClose.getByRole('button', { name: 'Close', exact: true }).click();
  await offsetWithClose.waitFor({ state: 'hidden' });

  const palette = await open('command-palette-default');
  const query = palette.getByRole('combobox');
  await query.fill('unmatched');
  await palette.locator('.cm-command-palette__empty').waitFor();
  await query.fill('create');
  await palette.getByRole('option', { name: 'New project' }).waitFor();
  await query.press('Enter');
  await palette.waitFor({ state: 'hidden' });
  const backdrop = await open('command-palette-default');
  await page.mouse.click(2, 2);
  await backdrop.waitFor({ state: 'hidden' });

  const external = await open('command-palette-external-results');
  await external.getByRole('combobox').fill('unmatched');
  await external.getByRole('option', { name: 'Archive', exact: true }).click();
  assert(
    await external.isVisible(),
    `${adapter}: external results remain visible and selection keeps the palette open`,
  );
  await external.getByRole('button', { name: 'Close', exact: true }).click();
  await external.waitFor({ state: 'hidden' });
  const idle = await open('command-palette-idle');
  await idle.getByText('Enter a search term.', { exact: true }).waitFor();
  await escape(idle);
  const loading = await open('command-palette-loading');
  assert.equal(await loading.getByRole('combobox').getAttribute('aria-busy'), 'true');
  const status = loading.getByRole('status');
  await status.waitFor();
  assert.match(await status.textContent(), /Finding commands…/u);
  await escape(loading);
}

async function checkLayoutViewport(page, base, adapter) {
  await page.goto(url(base, 'layouts/'));
  for (const slug of ['app-shell', 'document-layout']) {
    const example = page.locator(`#demo-${slug}`);
    const frame = example.locator('iframe.layout-preview__frame');
    await frame.scrollIntoViewIfNeeded();
    const preview = frame.contentFrame();
    const tab = preview.getByRole('tab', { name: 'With aside' });
    await tab.waitFor();
    const previewDocument = await (await frame.elementHandle()).contentFrame();
    await previewDocument.waitForLoadState('load');
    assert.equal(await tab.getAttribute('aria-selected'), 'true');
    const sidebar = preview.locator(`.cm-${slug}__sidebar`);
    await preview.getByRole('tab', { name: 'Content', exact: true }).click();
    await sidebar.waitFor({ state: 'hidden' });
    const main = preview.locator(slug === 'app-shell' ? '.cm-app-shell__content' : '.cm-document-layout__main');
    assert(
      await main.evaluate((element) => Math.abs(element.offsetWidth - element.parentElement.clientWidth) <= 1),
      `${adapter}: ${slug} uses the full width in Content mode`,
    );
    await tab.click();
    const aside = preview.locator(`.cm-${slug}__aside:not([hidden])`);
    await aside.waitFor({ state: 'attached' });

    await example.getByRole('radio', { name: '320 px' }).press('Space');
    await expectPreviewWidth(frame, 320);
    await aside.waitFor({ state: 'hidden' });
    assert((await sidebar.boundingBox()).y < (await main.boundingBox()).y, `${slug}: sidebar stacks above content`);

    await example.getByRole('radio', { name: '1024 px' }).press('Space');
    await expectPreviewWidth(frame, 1024);
    await sidebar.waitFor({ state: 'visible' });
    await aside.waitFor({ state: 'hidden' });
    assert((await sidebar.boundingBox()).x < (await main.boundingBox()).x, `${slug}: sidebar becomes a column`);

    await example.getByRole('radio', { name: '1280 px' }).press('Space');
    await expectPreviewWidth(frame, 1280);
    await aside.waitFor({ state: 'visible' });
    assert.equal(await tab.getAttribute('aria-selected'), 'true', `${adapter}: resizing preserves layout selection`);

    await example.getByRole('radio', { name: 'Fit' }).press('Space');
    await expectPreviewWidth(frame, await frame.evaluate((element) => element.parentElement.clientWidth));
  }
  const collapse = exampleDemo(page, 'app-shell-collapsible').getByRole('button', { name: 'Toggle sidebar' });
  await collapse.click();
  assert.equal(await collapse.getAttribute('aria-expanded'), 'false');
  await collapse.click();
  assert.equal(await collapse.getAttribute('aria-expanded'), 'true');
  await checkViewport(page, `${adapter} layouts`);
}

async function checkWarehouse(page, base, adapter) {
  await page.goto(url(base, 'layouts/'));
  await page.getByRole('heading', { level: 1, name: 'Layouts', exact: true }).waitFor();
  assert.equal(await page.locator('main .showcase-intro, main .showcase-section-navigation').count(), 0);
  const example = page.locator('#demo-admin-shell');
  await example.waitFor();
  assert.equal(await example.locator(':scope > header > .showcase-component-title').textContent(), 'Admin Shell');
  const preview = example.locator('iframe.layout-preview__frame');
  await preview.scrollIntoViewIfNeeded();
  const frame = preview.contentFrame();
  const table = frame.getByRole('table', { name: 'Warehouse availability', exact: true });
  const scrollArea = table.locator('..');
  const header = table.getByRole('columnheader', { name: 'Available', exact: true });
  const available = table.locator('tbody tr:visible td:nth-child(4)');
  await table.waitFor();
  assert.equal(await table.locator('[data-cm-data-table-sort], [aria-sort]').count(), 0);
  assert.equal(await frame.locator('.cm-data-table__pagination').count(), 0);
  assert.equal(await scrollArea.getAttribute('tabindex'), '0', `${adapter}: the table viewport is keyboard focusable`);
  assert.equal(await header.evaluate((cell) => getComputedStyle(cell).textAlign), 'end');
  assert.deepEqual(await available.allTextContents(), ['24', '0', '7', '31', '16', '4', '12']);
  assert.equal(await available.first().evaluate((cell) => getComputedStyle(cell).textAlign), 'end');
  assert.deepEqual(await table.locator('tbody .cm-tag--danger:visible').allTextContents(), ['Out of stock']);
  assert.deepEqual(await table.locator('tbody .cm-tag--warning:visible').allTextContents(), ['Low stock', 'Low stock']);

  const filter = frame.getByRole('searchbox', { name: 'Filter inventory' });
  await filter.fill('NORTH');
  assert.deepEqual(
    await available.allTextContents(),
    ['24', '7', '12'],
    `${adapter}: filtering searches the inventory`,
  );
  assert(await filter.evaluate((control) => control === document.activeElement), `${adapter}: filter focus is stable`);

  await filter.fill('no matching warehouse');
  await table
    .getByRole('status')
    .filter({ hasText: /^No products match your search\.$/u })
    .waitFor();
  assert.equal(await available.count(), 0);
  await filter.fill('');
  assert.equal(await available.count(), 7, `${adapter}: clearing the filter restores all rows`);

  await example.getByRole('radio', { name: '320 px' }).press('Space');
  await expectPreviewWidth(preview, 320);
  assert.equal(await available.count(), 7, `${adapter}: warehouse data survives reflow`);
  assert(
    await scrollArea.evaluate((area) => area.scrollWidth > area.clientWidth),
    `${adapter}: the five-column warehouse table scrolls at 320 px`,
  );
  await checkViewport(page, `${adapter} warehouse preview`);
  await screenshot(page, `${adapter}--warehouse--320--dark`);
}

async function expectPreviewWidth(frame, width) {
  await frame.evaluate(async (iframe, expectedWidth) => {
    for (let attempt = 0; attempt < 20 && iframe.contentWindow.innerWidth !== expectedWidth; attempt++) {
      await new Promise(requestAnimationFrame);
    }
  }, width);
  assert.equal(await frame.evaluate((iframe) => iframe.contentWindow.innerWidth), width);
}

async function checkSetupLayout(page, base) {
  await page.goto(url(base, 'layouts/'));
  const example = page.locator('#demo-setup-layout');
  const preview = example.locator('iframe');
  await preview.scrollIntoViewIfNeeded();
  const frame = preview.contentFrame();
  const panel = frame.locator('.cm-setup-layout__panel');
  await panel.waitFor();
  for (const [width, display] of [
    [320, 'flex'],
    [1024, 'grid'],
  ]) {
    await example.getByRole('radio', { name: `${width} px` }).press('Space');
    await expectPreviewWidth(preview, width);
    assert.equal(await panel.evaluate((element) => getComputedStyle(element).display), display);
  }
  await example.getByRole('radio', { name: 'Fit' }).press('Space');
  const database = frame.getByRole('textbox', { name: 'Database name' });
  await database.fill('demo_database');
  await database.press('Enter');
  await frame.getByRole('textbox', { name: 'Email' }).waitFor();
  await frame.getByRole('button', { name: 'Continue', exact: true }).click();
  await frame.getByText('demo_database on 127.0.0.1:3306', { exact: true }).waitFor();
  await frame.getByRole('button', { name: 'Finish', exact: true }).last().click();
  await frame.getByRole('status').getByText('Setup preview completed.').waitFor();
  await frame.getByRole('button', { name: 'Back', exact: true }).click();
  await frame.getByRole('textbox', { name: 'Email' }).waitFor();
}

async function checkIconSearch(page, base) {
  await page.goto(url(base, 'icons/'));
  const catalog = page.locator('#icon-catalog');
  const styles = catalog.locator('[data-icon-styles] [role="img"]');
  await styles.first().waitFor();
  assert.equal(await styles.count(), 8, 'Both families and all four weights are compared once');
  const weights = await catalog
    .locator('[data-icon-styles] .cm-icon--classic:not(.cm-icon--solid)')
    .evaluateAll((items) => items.map((icon) => getComputedStyle(icon).strokeWidth));
  assert.deepEqual(weights, ['2px', '1.5px', '1px'], 'Outline weights change the rendered stroke');

  const sizes = await catalog
    .locator('[data-icon-sizes] .cm-icon')
    .evaluateAll((items) => items.map((icon) => icon.getBoundingClientRect().width));
  assert.deepEqual(sizes, [16, 24, 32, 48]);

  const entries = catalog.locator('[data-icon-group] [data-icon-name]');
  const names = await entries.evaluateAll((items) => items.map((item) => item.dataset.iconName));
  assert(names.length > 0 && new Set(names).size === names.length, 'Each catalog name has one entry');
  assert.equal(await entries.locator('.cm-icon').count(), names.length, 'Each name has one glyph in the catalog');

  const search = catalog.getByRole('searchbox', { name: 'Search icons' });
  await search.fill('no matching icon name');
  await catalog
    .locator('[data-icon-count]')
    .getByText(/^0 of /u)
    .waitFor();
  await catalog.getByText('No brand icons match.').waitFor();
  await search.fill('left arrow');
  const arrow = catalog.locator('[data-icon-group] [data-icon-name="arrowLeft"]:visible');
  await arrow.and(catalog.getByRole('button', { name: 'Copy arrowLeft', exact: true })).waitFor();
  assert.equal(await arrow.count(), 1, 'Keyword search finds one preview for arrowLeft');
  await search.fill('');
  await catalog.getByText('No brand icons match.').waitFor({ state: 'hidden' });
}

async function checkAuthForm(page, base, adapter) {
  await page.goto(url(base, 'layouts/#demo-auth-layout'), { waitUntil: 'domcontentloaded' });
  const frame = page.locator('#demo-auth-layout iframe.layout-preview__frame');
  await frame.scrollIntoViewIfNeeded();
  const example = frame.contentFrame();
  const email = example.getByRole('textbox', { name: 'Email' });
  const submit = example.getByRole('button', { name: 'Sign in' });
  await submit.click();
  assert(
    await email.evaluate((input) => input.validity.valueMissing && input === document.activeElement),
    `${adapter}: the form focuses its first missing field`,
  );

  await email.fill('not-an-email');
  await example.getByLabel(/^Password\b/u).fill('preview-password');
  await submit.click();
  assert(await email.evaluate((input) => input.validity.typeMismatch), `${adapter}: invalid email is rejected`);

  await email.fill('preview@example.test');
  await submit.click();
  await example.getByText('Sign-in preview submitted.', { exact: true }).waitFor();
}

async function checkThemePreference(page, base) {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  const switchers = page.locator('#demo-theme-switch .cm-theme-switch');
  await switchers.first().waitFor();
  assert.equal(await switchers.count(), 1);
  const switcher = switchers.first();
  const checked = (mode) => switcher.locator(`input[value="${mode}"]:checked`);
  const toggle = page.locator('.showcase-theme');
  await toggle.click();
  await page.locator('html[data-cm-theme="light"]').waitFor({ state: 'attached' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('html[data-cm-theme="light"]').waitFor({ state: 'attached' });
  await toggle.click();
  await page.locator('html[data-cm-theme="dark"]').waitFor({ state: 'attached' });
  await checked('dark').waitFor({ state: 'attached' });
  await switcher.getByText('System', { exact: true }).click();
  await page.locator('html[data-cm-theme="system"]').waitFor({ state: 'attached' });
  await checked('system').waitFor({ state: 'attached' });
  await toggle.click();
  await page.locator('html[data-cm-theme="light"]').waitFor({ state: 'attached' });
  await checked('light').waitFor({ state: 'attached' });
}

async function checkNavigation(page, base, adapter, width) {
  if (width === 360) {
    for (const path of [
      'components/',
      'components/button/',
      'examples/',
      'docs/',
      'docs/getting-started/',
      'showcase-search.json',
      'codeblock/',
      'playground/',
    ]) {
      const response = await page.request.get(url(base, path));
      assert.equal(response.status(), 404, `${adapter}: ${path} was removed`);
    }
  }
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 2, name: 'Theme', exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  const header = page.locator('.showcase-header');
  assert.equal(await header.getByRole('button', { name: /search|^menu$/i, includeHidden: true }).count(), 0);
  await header.locator('.showcase-theme').waitFor();
  const [brandCenter, themeCenter] = await header.locator('.showcase-brand, .showcase-theme').evaluateAll((items) =>
    items.map((item) => {
      const { top, height } = item.getBoundingClientRect();
      return top + height / 2;
    }),
  );
  assert(Math.abs(brandCenter - themeCenter) <= 1, `${adapter} ${width}: brand and theme switch align vertically`);
  const tabKey = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  await page.keyboard.press(tabKey);
  assert.equal(await page.locator(':focus').textContent(), 'Skip to content');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'showcase-main');

  const navigation = page.locator('#showcase-navigation');
  const links = navigation.getByRole('link');
  assert(await navigation.isVisible());
  assert.equal(await navigation.locator('details, summary').count(), 0);
  assert.deepEqual(await links.allTextContents(), ['Core', 'Layouts', 'Colors', 'Icons']);
  assert.equal(await navigation.locator('a.cm-link').count(), await links.count());
  const tops = await links.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().top));
  assert.equal(new Set(tops).size, 1, `${adapter}: navigation links fit on one row`);
  await checkViewport(page, `${adapter} navigation ${width}`);

  const lastLinkClipped = await links.last().evaluate((link) => {
    return link.getBoundingClientRect().right > link.closest('nav').getBoundingClientRect().right + 1;
  });
  assert.equal(lastLinkClipped, false, `${adapter} ${width}: all routes fit at default text size`);
  const scale = await doubleTextSize(page, `${adapter} navigation`);
  await checkViewport(page, `${adapter} navigation at 200% text size`);
  await links.first().focus();
  for (const link of (await links.all()).slice(1)) {
    await page.keyboard.press(tabKey);
    assert(await link.evaluate((anchor) => anchor === document.activeElement));
  }
  const lastLinkIsVisible = await links.last().evaluate((link) => {
    const linkBounds = link.getBoundingClientRect();
    const navBounds = link.closest('nav').getBoundingClientRect();
    return linkBounds.left >= navBounds.left - 1 && linkBounds.right <= navBounds.right + 1;
  });
  assert(lastLinkIsVisible, `${adapter}: keyboard focus scrolls the last link into view`);
  await scale.evaluate((style) => style.remove());
  await screenshot(page, `${adapter}--navigation--${width}--dark`);

  const colors = navigation.getByRole('link', { name: 'Colors', exact: true });
  if (width < 600) {
    await colors.tap();
  } else {
    await colors.focus();
    await page.keyboard.press('Enter');
  }
  await colors.and(page.locator('[aria-current="page"]')).waitFor();
  assert.equal(page.url(), url(base, 'colors/'));

  await navigation.getByRole('link', { name: 'Core', exact: true }).click();
  await page.getByRole('heading', { level: 2, name: 'Theme', exact: true }).waitFor();
  assert.equal(page.url(), url(base, 'core/'));
}

const contracts = fileURLToPath(new URL('../../contracts/', import.meta.url));
const { cases, errors: caseErrors } = collectComponentCases(contracts);
const manifests = collectComponentManifests(contracts);
const casesBySlug = Map.groupBy(cases, ({ componentSlug }) => componentSlug);
const prepared = new Map(
  manifests.map(({ slug, manifest }) => [
    slug,
    showcaseComponentCases(
      slug,
      casesBySlug.get(slug).map(({ data }) => data),
      manifest,
    ),
  ]),
);

function checkShowcaseSlotContent(content, caseId) {
  if (typeof content === 'string') {
    assert.doesNotMatch(
      content,
      /<(?:button|input|select|textarea|a|svg|dialog|details)\b/iu,
      `${caseId} must render controls and icons with library components`,
    );
  } else if (Array.isArray(content)) {
    for (const slot of content) checkShowcaseSlotContent(slot, caseId);
  } else {
    for (const slot of Object.values(content.slots ?? {})) checkShowcaseSlotContent(slot, caseId);
  }
}

function checkShowcaseContent() {
  assert.deepEqual(caseErrors, []);
  for (const examples of prepared.values()) {
    for (const { id, slots } of examples) {
      for (const content of Object.values(slots)) checkShowcaseSlotContent(content, id);
    }
  }
}

function checkMatrixCombinations() {
  for (const [slug, id] of [
    ['aside-area', 'aside-area-as-div'],
    ['grid', 'grid-default--element-section'],
    ['page-header', 'page-header-default--headingLevel-2'],
    ['radio', 'radio-required'],
    ['tooltip', 'tooltip-no-portal'],
  ]) {
    assert(!prepared.get(slug).some((example) => example.id === id), `${id} has no standalone preview`);
  }
  const independentStates = {
    input: 'disabled',
    textarea: 'invalid',
    radio: 'disabled',
    switch: 'disabled',
    'progress-bar': 'indeterminate',
  };
  for (const [slug, state] of Object.entries(independentStates)) {
    const matching = prepared.get(slug).filter(({ props }) => props[state] === true);
    assert.equal(matching.length, 1, `${slug}: show ${state} once`);
  }

  const interactingSizes = {
    input: 'input-enhanced',
    select: 'select-clearable',
    'date-picker': 'date-picker-clearable',
    checkbox: 'checkbox-indeterminate',
    switch: 'switch-custom-thumb',
  };
  for (const [slug, id] of Object.entries(interactingSizes)) {
    const sizes = prepared
      .get(slug)
      .filter((example) => example.id === id || example.id.startsWith(`${id}--`))
      .map(({ props }) => props.size ?? 'md')
      .sort();
    assert.deepEqual(sizes, ['lg', 'md', 'sm'], `${id}: size changes a control or indicator`);
  }
}

async function checkInlineExamples(page, base, adapter) {
  const layoutSlugs = showcaseGroups.find(({ id }) => id === 'layouts').components;
  const shellSlugs = layoutExamples.map(({ slug }) => slug);
  const groups = {
    'core/': showcaseGroups
      .filter(({ id }) => id !== 'layouts' && id !== 'icons')
      .flatMap(({ id, components }) => (id === 'modals' ? [...components, 'confirm-dialog'] : components)),
    'layouts/': [...shellSlugs, ...layoutSlugs.filter((slug) => !shellSlugs.includes(slug))],
    'icons/': ['icon'],
    'colors/': [],
  };
  for (const [route, slugs] of Object.entries(groups)) {
    await page.goto(url(base, route), { waitUntil: 'domcontentloaded' });
    await page.locator('.showcase-page-heading, .showcase-intro > h1').waitFor();
    const sections = page.locator('[data-showcase-component]:visible');
    const visibleSlugs = await sections.evaluateAll((items) =>
      items.map((section) => section.dataset.showcaseComponent),
    );
    assert.deepEqual(visibleSlugs, slugs, `${adapter}: ordered component sections on ${route}`);
    const ungrouped = await page
      .locator('[data-showcase-component]')
      .evaluateAll((panels) =>
        panels.filter((panel) => !panel.closest('.cm-panel.showcase-group')).map(({ id }) => id),
      );
    assert.deepEqual(ungrouped, [], `${adapter}: component examples belong to a group surface on ${route}`);

    const wrapped = await page
      .locator('.showcase-group .showcase-variants > *')
      .evaluateAll((variants) =>
        variants
          .filter(
            (entry) =>
              !entry.matches('.cm-stack.showcase-variant') ||
              !entry.querySelector(':scope .showcase-variant-title')?.textContent?.trim(),
          )
          .map(({ id }) => id),
      );
    assert.deepEqual(wrapped, [], `${adapter}: inline variants use only spacing and a title on ${route}`);

    const wide =
      route === 'layouts/'
        ? layoutSlugs.filter((slug) => slug !== 'inline')
        : ['table', 'data-table', 'form-layout', 'page-header', 'tabs'];
    const narrowCards = await sections.evaluateAll(
      (panels, names) =>
        panels
          .filter((panel) => names.includes(panel.dataset.showcaseComponent))
          .flatMap((panel) => {
            const grid = panel.querySelector('.showcase-variants');
            return [...(grid?.children ?? [])]
              .filter((card) => Math.abs(card.getBoundingClientRect().width - grid.getBoundingClientRect().width) > 1)
              .map(({ id }) => id);
          }),
      wide,
    );
    assert.deepEqual(narrowCards, [], `${adapter}: wide examples take a full row on ${route}`);
    if (route === 'layouts/') {
      const buttonRows = async (id) => {
        const tops = await exampleDemo(page, id)
          .getByRole('button')
          .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().top));
        return new Set(tops).size;
      };
      assert((await buttonRows('inline-default')) > 1, `${adapter}: Inline wraps at the constrained width`);
      assert.equal(await buttonRows('inline-nowrap'), 1, `${adapter}: Inline preserves one row with wrap disabled`);
      const gridRows = await exampleDemo(page, 'grid-default')
        .locator('.cm-grid > .cm-panel')
        .evaluateAll((panels) => new Set(panels.map((panel) => panel.getBoundingClientRect().top)).size);
      assert.equal(gridRows, page.viewportSize().width < 400 ? 3 : 1, `${adapter}: Grid reflows its panels`);
    }
    if (route === 'core/') {
      const links = page.locator('#demo-link .showcase-variant .cm-link');
      const tops = await links.evaluateAll((items) => items.map((item) => item.getBoundingClientRect().top));
      assert.equal(tops.length, 5);
      if (page.viewportSize().width >= 1440) {
        assert.equal(new Set(tops).size, 1, `${adapter}: all five Link examples share one row`);
      } else {
        assert(tops.at(-1) > tops[0], `${adapter}: Link examples wrap in the narrow preview`);
      }
    }
    for (const slug of slugs) {
      if (!prepared.has(slug) || slug === 'icon') continue; // Composed examples have dedicated checks.
      const previews = await page
        .locator(`[data-showcase-component="${slug}"] .showcase-demo:visible`)
        .evaluateAll((demos) =>
          demos.filter((demo) => demo.firstElementChild).map((demo) => [demo.dataset.showcaseExample, demo.innerHTML]),
        );
      assert.deepEqual(
        previews.map(([id]) => id),
        prepared.get(slug).map(({ id }) => id),
        `${adapter}: ordered examples for ${slug}`,
      );
      const distinct = new Map();
      for (const [id, html] of previews) {
        const markup = html.replaceAll(`${showcaseExamplePrefix(id)}-`, 'example-');
        const key = JSON.stringify(normalizeSignificantDom(markup, { normalizeGeneratedIds: true }));
        assert(!distinct.has(key), `${adapter}: ${id} duplicates ${distinct.get(key)}`);
        distinct.set(key, id);
      }
    }
    assert.equal(
      await sections.locator('.showcase-variants iframe').count(),
      0,
      `${adapter}: inline examples on ${route}`,
    );
    const duplicateIds = await sections
      .locator('.showcase-demo [id]')
      .evaluateAll((items) =>
        items.filter(({ id }) => document.querySelectorAll(`#${CSS.escape(id)}`).length > 1).map(({ id }) => id),
      );
    assert.deepEqual(duplicateIds, [], `${adapter}: example identifiers are unique on ${route}`);
    if (route === 'icons/') {
      for (const name of ['System', 'Brands']) {
        await page.locator('#icon-catalog').getByRole('heading', { name, exact: true }).waitFor();
      }
    }
  }
  await page.goto(url(base, 'core/'), { waitUntil: 'domcontentloaded' });
  const widths = [];
  for (const size of ['sm', 'md', 'lg']) {
    const demo = exampleDemo(page, size === 'md' ? 'dialog-default' : 'dialog-default--size-' + size);
    await demo.locator('[data-showcase-open].cm-button--secondary').press('Enter');
    const modal = demo.locator(`dialog.cm-dialog--${size}:modal`);
    await modal.waitFor();
    widths.push(await modal.evaluate((element) => element.offsetWidth));
    await page.keyboard.press('Escape');
    await modal.waitFor({ state: 'hidden' });
  }
  if (page.viewportSize().width >= 1440) {
    assert(widths[0] < widths[1] && widths[1] < widths[2], `${adapter}: dialog widths are distinguishable`);
  }
  for (const [id, selector] of [
    ['data-table-default--loadingVariant-mask', '.cm-data-table__loading-mask svg'],
    ['data-table-default--loadingVariant-skeleton', 'tbody[aria-busy] .cm-data-table__skeleton'],
  ]) {
    await exampleDemo(page, id).locator(selector).first().waitFor();
  }
}

async function checkConfirmDialogExamples(page, base, adapter) {
  await page.goto(url(base, 'core/'));
  const dialog = page.locator('.cm-confirm-dialog:modal');
  const result = page.locator('#demo-confirm-dialog [data-confirm-result]');
  await result.waitFor({ state: 'attached' });
  assert.equal(await result.textContent(), '');
  const launchers = page.locator('#demo-confirm-dialog .showcase-demo > .cm-button--secondary');
  assert.deepEqual(
    (await launchers.allTextContents()).map((label) => label.trim()),
    ['sm', 'md', 'lg', 'Custom confirm', 'Disabled confirm', 'Loading', 'Stay open', 'Custom footer'],
  );
  const open = async (id) => {
    const example = exampleDemo(page, `confirm-dialog-${id}`);
    const launcher = example.getByRole('button').and(example.locator('.cm-button--secondary'));
    await launcher.press('Enter');
    await dialog.waitFor();
    return launcher;
  };
  const cancel = async () => {
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
  };
  const focus = async (locator) => locator.evaluate((element) => element === document.activeElement);

  const defaults = await open('default');
  assert(await focus(dialog.getByRole('button', { name: 'Cancel', exact: true })));
  assert(await dialog.locator('.cm-button--danger').isVisible());
  if (adapter === 'vue') assert(await dialog.evaluate((element) => element.parentElement === document.body));
  await dialog.getByRole('button', { name: 'Confirm', exact: true }).click();
  await result.getByText('sm · Confirmed', { exact: true }).waitFor();
  assert(await focus(defaults));

  await open('labels');
  assert.equal(await result.textContent(), 'sm · Confirmed');
  await dialog.getByRole('heading', { name: 'Archive project?' }).waitFor();
  await dialog.getByText('The project will move to the archive.').waitFor();
  const archive = dialog.getByRole('button', { name: 'Archive', exact: true });
  assert(await focus(archive));
  assert(await archive.evaluate((button) => button.classList.contains('cm-button--primary')));
  assert.equal(await dialog.evaluate((element) => element.classList.contains('cm-dialog--dividers')), false);
  await dialog.getByRole('button', { name: 'Keep project' }).click();
  await result.getByText('Custom confirm · Cancelled', { exact: true }).waitFor();
  for (const [id, size] of [
    ['default', 'sm'],
    ['medium', 'md'],
    ['large', 'lg'],
  ]) {
    await open(id);
    assert(await dialog.evaluate((element, size) => element.classList.contains(`cm-dialog--${size}`), size));
    await cancel();
  }
  await open('disabled');
  assert(await focus(dialog.locator('.cm-dialog__surface')));
  assert(await dialog.getByRole('button', { name: 'Confirm' }).isDisabled());
  await cancel();
  await open('loading');
  await page.keyboard.press('Escape');
  assert(await dialog.isVisible());
  assert(await dialog.getByRole('button', { name: 'Confirm' }).isDisabled());
  assert(await dialog.getByRole('button', { name: 'Cancel' }).isDisabled());
  await dialog.getByRole('button', { name: 'Finish loading' }).click();
  assert(await focus(dialog.getByRole('button', { name: 'Cancel' })));
  await cancel();

  await open('loading');
  assert.equal(await dialog.getByRole('button', { name: 'Confirm' }).getAttribute('aria-busy'), 'true');
  await page.mouse.click(2, 2);
  assert(await dialog.isVisible());
  await dialog.getByRole('button', { name: 'Finish loading' }).click();
  await page.mouse.click(2, 2);
  await result.getByText('Loading · Cancelled', { exact: true }).waitFor();

  await open('keep-open');
  await dialog.getByRole('button', { name: 'Confirm' }).click();
  assert.equal(await result.textContent(), 'Stay open · Confirmed');
  assert(await dialog.isVisible());
  await cancel();
  await result.getByText('Stay open · Cancelled', { exact: true }).waitFor();

  await open('footer');
  await dialog.getByRole('button', { name: 'Apply change' }).click();
  await result.getByText('Custom footer · Confirmed', { exact: true }).waitFor();
  await open('footer');
  await dialog.getByRole('button', { name: 'Go back' }).click();
  await result.getByText('Custom footer · Cancelled', { exact: true }).waitFor();
  assert.equal(await page.locator('#demo-confirm-dialog .cm-tag').count(), 1);
}

async function checkColors(page, adapter) {
  const palette = await page
    .locator('#primitive-scales + .color-system__families .color-system__primitive-color')
    .evaluateAll((swatches) => swatches.map((swatch) => getComputedStyle(swatch).backgroundColor));
  assert(palette.length > 0 && new Set(palette).size === palette.length, `${adapter}: distinct palette shades`);

  const themes = page.locator('.color-system__theme');
  const canvases = await themes.evaluateAll((samples) =>
    samples.map((sample) => getComputedStyle(sample).backgroundColor),
  );
  assert.equal(new Set(canvases).size, 2, `${adapter}: light and dark use different canvas colors`);
  for (const theme of await themes.all()) {
    const selected = await theme
      .locator('.color-system__selected')
      .evaluateAll((samples) => samples.map((sample) => getComputedStyle(sample).backgroundColor));
    assert.equal(new Set(selected).size, 3, `${adapter}: selected states use distinct fills`);
  }

  const ratios = page.locator('[data-contrast-foreground]');
  await ratios.first().filter({ hasText: /:1$/u }).waitFor();
  assert.equal(await ratios.count(), 12);
  assert((await ratios.allTextContents()).every((ratio) => /^\d+\.\d{2}:1$/u.test(ratio)));
}

async function captureShowcaseContent(root) {
  return root.evaluate(async (element) => {
    await document.fonts.ready;
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const visible = (item) =>
      item.getClientRects().length > 0 &&
      getComputedStyle(item).visibility !== 'hidden' &&
      !item.closest('[aria-hidden="true"]');
    const text = (value) => value.replace(/\s+/gu, ' ').trim();
    return {
      headings: [...element.querySelectorAll('h1, h2, h3, h4')].filter(visible).map((item) => text(item.innerText)),
      examples: [...element.querySelectorAll('[data-showcase-example]')].map((item) => item.dataset.showcaseExample),
      icons: [...element.querySelectorAll('[data-icon-group] [data-icon-name]')].map((item) => item.dataset.iconName),
      text: text(element.innerText),
      controls: [...element.querySelectorAll('button, input, textarea, select, a[href]')]
        .filter(visible)
        .map((item) => [
          item.tagName,
          text(item.getAttribute('aria-label') ?? item.innerText),
          item.value ?? null,
          item.disabled ?? null,
          item.checked ?? null,
          item.indeterminate ?? null,
          ...['aria-expanded', 'aria-current', 'aria-selected', 'aria-pressed', 'aria-invalid', 'aria-busy'].map(
            (attribute) => item.getAttribute(attribute),
          ),
        ]),
    };
  });
}

async function checkPageParity() {
  for (const [width, theme] of [
    [360, 'dark'],
    [1440, 'light'],
  ]) {
    const [vue, vanilla] = await Promise.all(
      Object.values(adapters).map(() =>
        browser.newPage({
          viewport: { width, height: viewports.get(width) },
          colorScheme: theme,
          reducedMotion: 'reduce',
        }),
      ),
    );
    try {
      for (const [name, path, ready] of routes.filter(([name]) => name !== 'core-alias')) {
        await Promise.all(
          [
            [vue, adapters.vue],
            [vanilla, adapters.vanilla],
          ].map(async ([page, base]) => {
            await page.goto(url(base, path), { waitUntil: 'domcontentloaded' });
            await page.locator(ready).first().waitFor();
            if (name === 'colors')
              await page.locator('[data-contrast-foreground]').first().filter({ hasText: /:1$/u }).waitFor();
          }),
        );
        assert.deepEqual(
          await captureShowcaseContent(vue.locator('#showcase-main')),
          await captureShowcaseContent(vanilla.locator('#showcase-main')),
          `${name}: matching content and initial controls at ${width} px in ${theme}`,
        );
        if (name === 'layouts') {
          for (const { slug } of layoutExamples) {
            const capture = async (page) => {
              const frame = page.locator(`#demo-${slug} iframe`);
              await frame.scrollIntoViewIfNeeded();
              const preview = frame.contentFrame();
              await preview.locator(`.cm-${slug}`).first().waitFor();
              return captureShowcaseContent(preview.locator('body'));
            };
            assert.deepEqual(await capture(vue), await capture(vanilla), `${slug}: matching preview at ${width} px`);
          }
        }
      }
    } finally {
      await Promise.all([vue.close(), vanilla.close()]);
    }
  }
  console.log('Four showcase pages and seven Layouts previews match at 360 and 1440 px.');
}

async function checkAdapter([adapter, base]) {
  for (const [width, height] of viewports) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1,
        colorScheme: theme,
        reducedMotion: 'reduce',
        hasTouch: width < 600,
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('requestfailed', (request) => {
        const reason = request.failure()?.errorText;
        if (reason === 'net::ERR_INSUFFICIENT_RESOURCES') errors.push(`${reason} ${request.url()}`);
      });
      page.on('response', (response) => {
        if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      });
      page.setDefaultTimeout(10000);
      page.setDefaultNavigationTimeout(30000);
      try {
        await page.addInitScript((mode) => {
          if (window === window.top && !localStorage.getItem('cm-showcase-theme'))
            localStorage.setItem('cm-showcase-theme', mode);
        }, theme);
        for (const [name, path, ready] of routes) {
          await page.goto(url(base, path), { waitUntil: 'domcontentloaded' });
          await page.locator(ready).first().waitFor();
          await page
            .locator(`html[data-cm-theme="${theme}"]`)
            .waitFor({ state: 'attached' })
            .catch((cause) => {
              throw new Error(`${adapter} ${name} ${width} ${theme}: did not initialize theme (${errors.join(', ')})`, {
                cause,
              });
            });
          if (name === 'core' || name === 'core-alias') {
            assert.equal(await page.locator('main .showcase-intro, #component-catalog, #showcase-projects').count(), 0);
            await page.getByRole('heading', { level: 1, name: 'Core', exact: true }).waitFor({ state: 'attached' });
            assert.equal(await page.getByRole('heading', { name: 'Component states', exact: true }).count(), 0);
            await page.getByRole('heading', { level: 2, name: 'Theme', exact: true }).waitFor();
          }
          await checkViewport(page, `${adapter} ${name} ${width} ${theme}`);
          visited++;
          const file = `${name}--${width}--${theme}`;
          if (representative.has(file)) await screenshot(page, `${adapter}--${file}`);
          if (
            (name === 'core' || name === 'layouts' || name === 'colors') &&
            ((width === 360 && theme === 'dark') || (width === 1440 && theme === 'light'))
          ) {
            if (name === 'colors') await checkColors(page, adapter);
            await checkAccessibility(page, `${adapter} ${file}`);
          }
          if (width <= 360 && theme === 'dark') {
            const scale = await doubleTextSize(page, `${adapter} ${name}`);
            await checkViewport(page, `${adapter} ${name} at 200% text size`);
            await scale.evaluate((style) => style.remove());
          }
        }
        if ((width === 320 && theme === 'dark') || (width === 1440 && theme === 'light')) {
          await page.goto(url(base, 'core/'));
          await page.locator('#demo-button').waitFor();
          await checkButtonVariants(page, adapter);
        }
        if (width === 360 && theme === 'dark') {
          await checkDatePickerContrast(page, base, adapter);
        }
        if ((width === 360 && theme === 'dark') || (width === 1440 && theme === 'light')) {
          await checkExampleInteractions(page, base, adapter);
          await checkInlineExamples(page, base, adapter);
        }
        if (width === 1440 && theme === 'light') {
          await checkInitialExampleLayout(page, base, adapter);
          await checkConfirmDialogExamples(page, base, adapter);
        }
        if ((width <= 360 || width === 1440) && theme === 'dark') await checkNavigation(page, base, adapter, width);
        if (width === 1440 && theme === 'dark') {
          await checkLayoutViewport(page, base, adapter);
          await checkWarehouse(page, base, adapter);
          await checkAuthForm(page, base, adapter);
          await checkSetupLayout(page, base);
          await checkIconSearch(page, base);
          await checkThemePreference(page, base);
        }
        assert.deepEqual(errors, [], `${adapter} ${width} ${theme}: network/runtime errors`);
      } finally {
        await page.close();
      }
    }
  }
  console.log(
    `${adapter}: ${viewports.size} widths, two themes, ${routes.length} routes, and keyboard / touch navigation passed`,
  );
}

try {
  checkShowcaseContent();
  checkMatrixCombinations();
  if (output) await mkdir(output, { recursive: true });
  console.log(`${browserName} ${browser.version()}`);
  if (process.env.SHOWCASE_VUE_DEV_URL) await checkDevelopmentPreviews(process.env.SHOWCASE_VUE_DEV_URL);
  await checkPageParity();
  // Keep each adapter's iframe keyboard and resize checks in the foreground.
  for (const entry of Object.entries(adapters)) await checkAdapter(entry);
  console.log(
    `${visited} route/width/theme combinations; ${accessibilityScans} page axe scans; ${calendarContrastScans} dark calendar contrast scans.`,
  );
} catch (error) {
  console.error(
    JSON.stringify(
      scans.filter(([, violations]) => violations.length),
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser.close();
}
