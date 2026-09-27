#!/usr/bin/env node
// Browser gate for the Razor adapter.
//
// Renders the PHP fixture page with the real assets a host would serve, then
// drives it in headless Chrome through the CDP client the baseline harness
// already uses. No second browser framework is introduced.
//
// Three suites run against three pages:
//   enhanced         the controller is loaded; interactions must work
//   no-js            no controller at all; the markup must still be usable
//   mixed ownership  a real Vue VfInput and a Razor VfInput on one page
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { delay, launchChrome, openPage } from '../baseline/cdp.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const packageRoot = resolve(repositoryRoot, 'packages/razor');
const distDirectory = resolve(packageRoot, 'dist');

const failures = [];
const passed = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed.push(name);
  } else {
    failures.push(`${name}${detail ? `: ${detail}` : ''}`);
  }
}

function buildAssets() {
  execFileSync(process.execPath, [resolve(packageRoot, 'build-assets.mjs')], { stdio: ['ignore', 'ignore', 'pipe'] });
  execFileSync(
    resolve(repositoryRoot, 'node_modules/.bin/vite'),
    ['build', '--config', resolve(repositoryRoot, 'scripts/ci/fixtures/vue-input.vite.config.mts')],
    { cwd: repositoryRoot, stdio: ['ignore', 'ignore', 'pipe'] },
  );
}

function renderFixture(fileName, mode) {
  const output = resolve(distDirectory, fileName);
  execFileSync('php', [resolve(packageRoot, 'tests/fixtures/render-page.php'), output, mode].filter(Boolean), {
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  return output;
}

const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

async function serve(directory) {
  const server = createServer((request, response) => {
    const filePath = resolve(directory, decodeURIComponent(request.url.split('?')[0]).replace(/^\/+/, ''));

    if (!filePath.startsWith(directory) || !existsSync(filePath)) {
      response.writeHead(404).end('not found');
      return;
    }

    response.writeHead(200, { 'content-type': mimeTypes[extname(filePath)] ?? 'application/octet-stream' });
    response.end(readFileSync(filePath));
  });

  await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));

  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolvePromise) => server.close(resolvePromise)),
  };
}

async function withPage(chrome, origin, path, run) {
  const page = await openPage(chrome.endpoint);

  try {
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 1000,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await page.send('Page.navigate', { url: `${origin}/${path}` });
    await page.waitFor(`document.readyState === 'complete'`);
    await delay(250);
    await run(page);
  } finally {
    await page.close();
  }
}

/** A real key press on whatever has focus: rawKeyDown, char, keyUp - what a keyboard produces. */
async function pressKey(page, key) {
  const descriptor = {
    Enter: { code: 'Enter', keyCode: 13, text: '\r' },
    ' ': { code: 'Space', keyCode: 32, text: ' ' },
    // The stepper's navigation keys (M23); none produces a character.
    Home: { code: 'Home', keyCode: 36 },
    End: { code: 'End', keyCode: 35 },
    ArrowLeft: { code: 'ArrowLeft', keyCode: 37 },
    ArrowUp: { code: 'ArrowUp', keyCode: 38 },
    ArrowRight: { code: 'ArrowRight', keyCode: 39 },
    ArrowDown: { code: 'ArrowDown', keyCode: 40 },
    // The tabs' one unhandled key (M24): native focus navigation.
    Tab: { code: 'Tab', keyCode: 9 },
  }[key];
  const base = {
    key,
    code: descriptor.code,
    windowsVirtualKeyCode: descriptor.keyCode,
    nativeVirtualKeyCode: descriptor.keyCode,
  };
  // A character key is one keyDown carrying its text, which Chrome expands
  // into keydown and keypress; rawKeyDown followed by a char event is what
  // Chrome 153 routed to the browser as an accelerator for an unhandled
  // Enter or Space, opening a page of its own and leaving this one hidden
  // without animation frames - found in M24 through the tabs' readiness
  // classes, and reproduced in the parity driver. One native click, keydown
  // not prevented, as before.
  if (descriptor.text !== undefined) {
    await page.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      ...base,
      text: descriptor.text,
      unmodifiedText: descriptor.text,
    });
  } else {
    await page.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...base });
  }
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
}

/**
 * A real pointer click at the centre of the first element the selector finds.
 *
 * Layout is allowed to settle first: an accordion panel entering or leaving
 * above the target moves it, and a point computed mid-flight lands beside it.
 * This page does not emulate reduced motion, so the real 320ms height
 * transition runs; the wait is bounded and ends as soon as no panel carries
 * an inline transition.
 */
async function clickAt(page, selector) {
  await page.evaluate(`(async () => {
    const deadline = performance.now() + 1500;
    const inFlight = () => [...document.querySelectorAll('.vf-accordion__content')].some((panel) => panel.style.transition !== '');
    while (inFlight() && performance.now() < deadline) await new Promise((tick) => setTimeout(tick, 25));
  })()`);
  const point = await page.evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) throw new Error('missing ' + ${JSON.stringify(selector)});
    element.scrollIntoView({ block: 'center' });
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
  await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
  await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
}

/** Installs a per-root log of the accordion's open-change events, keyed by the case name. */
const installAccordionLog = `(() => {
  window.__accordionEvents = {};
  for (const root of document.querySelectorAll('[data-case] .vf-accordion')) {
    const name = root.closest('[data-case]').dataset.case + '/' + root.querySelector('.vf-accordion__trigger').textContent.trim();
    window.__accordionEvents[name] = [];
    root.addEventListener('vf-accordion:open-change', (event) => {
      if (event.target !== root) return;
      window.__accordionEvents[name].push({ open: event.detail.open, bubbles: event.bubbles });
    });
  }
  return Object.keys(window.__accordionEvents).length;
})()`;

/** The accordion in a case as the suite reads it, by its trigger text. */
const readAccordion = (caseName, triggerText) => `(() => {
  const root = [...document.querySelectorAll('[data-case="${caseName}"] .vf-accordion')]
    .find((candidate) => candidate.querySelector('.vf-accordion__trigger').textContent.trim() === ${JSON.stringify(triggerText)});
  const trigger = root.querySelector(':scope > .vf-accordion__trigger');
  const panel = document.getElementById(trigger.getAttribute('aria-controls'));
  const inPanel = panel && root.contains(panel) ? panel : null;
  return {
    enhanced: root.hasAttribute('data-vf-razor-accordion-enhanced'),
    expanded: trigger.getAttribute('aria-expanded'),
    disabled: trigger.disabled,
    iconOpen: trigger.querySelector('.vf-accordion__icon').classList.contains('vf-accordion__icon--open'),
    panelPresent: inPanel !== null,
    panelRole: inPanel?.getAttribute('role') ?? null,
    labelledByTrigger: inPanel ? inPanel.getAttribute('aria-labelledby') === trigger.id : null,
    panelStyle: inPanel?.getAttribute('style') ?? null,
    panelTransition: inPanel?.style.transition ?? null,
    innerText: inPanel?.querySelector(':scope > .vf-accordion__content-inner')?.textContent.trim() ?? null,
    templatePresent: root.querySelector(':scope > template[data-vf-razor-accordion="content"]') !== null,
    focused: document.activeElement === trigger,
    events: window.__accordionEvents?.['${caseName}/' + ${JSON.stringify(triggerText)}] ?? null,
    triggerCount: root.querySelectorAll('.vf-accordion__trigger').length,
  };
})()`;

/**
 * Installs a per-root log of the tabs' change events, a per-root native click
 * counter and a per-root keydown record, keyed by the case name and the
 * root's accessible name.
 */
const installTabsLog = `(() => {
  window.__tabsEvents = {};
  window.__tabsClicks = {};
  window.__tabsKeydowns = {};
  for (const root of document.querySelectorAll('[data-case] .vf-tabs')) {
    const name = root.closest('[data-case]').dataset.case + '/' + root.getAttribute('aria-label');
    window.__tabsEvents[name] = [];
    window.__tabsClicks[name] = 0;
    window.__tabsKeydowns[name] = [];
    root.addEventListener('vf-tabs:change', (event) => {
      if (event.target !== root) return;
      window.__tabsEvents[name].push({ value: event.detail.value, bubbles: event.bubbles });
    });
    root.addEventListener('click', (event) => {
      if (event.target.closest('.vf-tabs__tab')) window.__tabsClicks[name] += 1;
    });
    root.addEventListener('keydown', (event) => {
      const entry = { key: event.key, prevented: false };
      window.__tabsKeydowns[name].push(entry);
      setTimeout(() => { entry.prevented = event.defaultPrevented; }, 0);
    });
  }
  return Object.keys(window.__tabsEvents).length;
})()`;

/** The tabs in a case as the suite reads them, by the root's accessible name. */
const readTabs = (caseName, label) => `(() => {
  const root = [...document.querySelectorAll('[data-case="${caseName}"] .vf-tabs')]
    .find((candidate) => candidate.getAttribute('aria-label') === ${JSON.stringify(label)});
  const tabs = [...root.querySelectorAll('[role="tablist"] > .vf-tabs__tab')];
  const value = (tab) => tab?.getAttribute('data-vf-razor-tabs-value') ?? null;
  const panel = root.querySelector(':scope > .vf-tabs__panel');
  const indicator = root.querySelector('.vf-tabs__indicator');
  const viewport = root.querySelector('.vf-tabs__list-scroller');
  const left = root.querySelector('.vf-tabs__scroll-button--left');
  const right = root.querySelector('.vf-tabs__scroll-button--right');
  const key = '${caseName}/' + ${JSON.stringify(label)};
  return {
    enhanced: root.hasAttribute('data-vf-razor-tabs-enhanced'),
    selected: tabs.filter((t) => t.getAttribute('aria-selected') === 'true').map(value),
    tabindexes: tabs.map((t) => t.getAttribute('tabindex')),
    roles: tabs.map((t) => t.getAttribute('role')),
    tabCount: tabs.length,
    panels: root.querySelectorAll('.vf-tabs__panel').length,
    panelText: panel?.textContent.trim() ?? null,
    panelLabelledBySelected: panel ? document.getElementById(panel.getAttribute('aria-labelledby')) === tabs.find((t) => t.getAttribute('aria-selected') === 'true') : null,
    panelIdMatchesControls: panel ? panel.id === tabs.find((t) => t.getAttribute('aria-selected') === 'true')?.getAttribute('aria-controls') : null,
    templates: root.querySelectorAll(':scope > template[data-vf-razor-tabs-panel]').length,
    indicator: { opacity: indicator.style.opacity, transform: indicator.style.transform, width: indicator.style.width, ready: indicator.classList.contains('vf-tabs__indicator--ready'), noTransition: indicator.classList.contains('vf-tabs__indicator--no-transition') },
    ready: root.classList.contains('vf-tabs--scroll-controls-ready'),
    animated: root.classList.contains('vf-tabs--scroll-controls-animated'),
    scrollLeft: viewport.scrollLeft,
    scrollbarWidth: viewport.style.getPropertyValue('--vf-horizontal-scroller-scrollbar-width').trim(),
    canScrollLeft: root.querySelector('.vf-tabs__list').classList.contains('vf-tabs__list--can-scroll-left'),
    canScrollRight: root.querySelector('.vf-tabs__list').classList.contains('vf-tabs__list--can-scroll-right'),
    left: { hidden: left.classList.contains('vf-tabs__scroll-button--hidden'), ariaHidden: left.getAttribute('aria-hidden'), tabindex: left.getAttribute('tabindex'), disabled: left.disabled },
    right: { hidden: right.classList.contains('vf-tabs__scroll-button--hidden'), ariaHidden: right.getAttribute('aria-hidden'), tabindex: right.getAttribute('tabindex'), disabled: right.disabled },
    fades: [...root.querySelectorAll('.vf-horizontal-scroller__fade')].map((f) => f.classList.contains('vf-horizontal-scroller__fade--left') ? 'left' : 'right'),
    focused: root.contains(document.activeElement) ? (value(document.activeElement.closest('.vf-tabs__tab')) ?? (document.activeElement.classList.contains('vf-tabs__panel') ? 'panel' : 'inside')) : null,
    events: window.__tabsEvents?.[key] ?? null,
    clicks: window.__tabsClicks?.[key] ?? null,
    keydowns: window.__tabsKeydowns?.[key] ?? null,
  };
})()`;

/**
 * Installs a per-root log of the stepper's change events and a per-root
 * native click counter, keyed by the case name and the nav's accessible name.
 * The click counter is what tells native Enter/Space activation (one click)
 * from a handled key (none).
 */
const installStepperLog = `(() => {
  window.__stepperEvents = {};
  window.__stepperClicks = {};
  window.__stepperKeydowns = {};
  for (const root of document.querySelectorAll('[data-case] .vf-stepper')) {
    const name = root.closest('[data-case]').dataset.case + '/' + root.getAttribute('aria-label');
    window.__stepperEvents[name] = [];
    window.__stepperClicks[name] = 0;
    window.__stepperKeydowns[name] = [];
    root.addEventListener('vf-stepper:change', (event) => {
      if (event.target !== root) return;
      window.__stepperEvents[name].push({ value: event.detail.value, bubbles: event.bubbles });
    });
    root.addEventListener('click', (event) => {
      if (event.target.closest('.vf-stepper__trigger')) window.__stepperClicks[name] += 1;
    });
    root.addEventListener('keydown', (event) => {
      const entry = { key: event.key, prevented: false };
      window.__stepperKeydowns[name].push(entry);
      setTimeout(() => { entry.prevented = event.defaultPrevented; }, 0);
    });
  }
  return Object.keys(window.__stepperEvents).length;
})()`;

/** The stepper in a case as the suite reads it, by its accessible name. */
const readStepper = (caseName, label) => `(() => {
  const root = [...document.querySelectorAll('[data-case="${caseName}"] .vf-stepper')]
    .find((candidate) => candidate.getAttribute('aria-label') === ${JSON.stringify(label)});
  const triggers = [...root.querySelectorAll('.vf-stepper__trigger')];
  const key = '${caseName}/' + ${JSON.stringify(label)};
  return {
    enhanced: root.hasAttribute('data-vf-razor-stepper-enhanced'),
    current: triggers.find((t) => t.getAttribute('aria-current') === 'step')?.dataset.vfStepperValue ?? null,
    currentClass: triggers.find((t) => t.classList.contains('vf-stepper__trigger--current'))?.dataset.vfStepperValue ?? null,
    ariaCurrentValues: triggers.map((t) => t.getAttribute('aria-current')),
    states: [...root.querySelectorAll('.vf-stepper__item')].map((item) => [...item.classList].find((c) => c.startsWith('vf-stepper__item--')).slice(18)),
    factor: root.style.getPropertyValue('--vf-stepper-progress-factor').trim(),
    count: root.style.getPropertyValue('--vf-stepper-item-count').trim(),
    itemCount: root.querySelectorAll('.vf-stepper__item').length,
    triggerCount: triggers.length,
    focused: root.contains(document.activeElement) ? document.activeElement.dataset.vfStepperValue ?? 'inside' : null,
    events: window.__stepperEvents?.[key] ?? null,
    clicks: window.__stepperClicks?.[key] ?? null,
    keydowns: window.__stepperKeydowns?.[key] ?? null,
  };
})()`;

mkdirSync(distDirectory, { recursive: true });
process.stdout.write('Building Razor assets and rendering the PHP fixtures\n');
buildAssets();
renderFixture('fixture-enhanced.html', null);
renderFixture('fixture-no-js.html', '--no-js');
renderFixture('fixture-mixed.html', '--with-vue');

/**
 * Installs a per-root log of the dropdown's open-change events, keyed by the
 * root's accessible name, and a per-key record of whether a keydown reaching
 * the document was prevented.
 */
const installDropdownLog = `(() => {
  window.__dropdownEvents = {};
  window.__dropdownKeys = [];
  for (const root of document.querySelectorAll('[data-case] .vf-dropdown')) {
    const name = root.getAttribute('aria-label');
    window.__dropdownEvents[name] = [];
    root.addEventListener('vf-dropdown:open-change', (event) => {
      window.__dropdownEvents[name].push({ open: event.detail.open, bubbles: event.bubbles });
    });
  }
  document.addEventListener('keydown', (event) => {
    const entry = { key: event.key, prevented: false };
    window.__dropdownKeys.push(entry);
    setTimeout(() => { entry.prevented = event.defaultPrevented; }, 0);
  }, true);
  return Object.keys(window.__dropdownEvents).length;
})()`;

/** One dropdown as the suite reads it, by the root's accessible name. */
const readDropdown = (label) => `(() => {
  const root = document.querySelector('.vf-dropdown[aria-label="${label}"]');
  const trigger = root.querySelector(':scope > .vf-dropdown__trigger');
  const menu = document.getElementById(trigger.getAttribute('aria-controls'));
  const active = document.activeElement;
  const where = !menu ? null : menu.parentElement === document.body ? 'body' : menu.parentElement === root ? 'inline' : menu.parentElement.id || menu.parentElement.className;
  return {
    enhanced: root.hasAttribute('data-vf-razor-dropdown-enhanced'),
    expanded: trigger.getAttribute('aria-expanded'),
    menu: Boolean(menu),
    where,
    menuClasses: menu ? [...menu.classList] : null,
    labelledByTrigger: menu ? menu.getAttribute('aria-labelledby') === trigger.id : null,
    role: menu?.getAttribute('role') ?? null,
    arrowFirst: menu ? menu.firstElementChild?.classList.contains('vf-dropdown__arrow') : null,
    positioned: menu ? menu.style.left !== '0px' || menu.style.top !== '0px' : null,
    templates: root.querySelectorAll(':scope > template[data-vf-razor-dropdown="menu"]').length,
    focus: active === trigger ? 'trigger' : menu && menu.contains(active) ? 'item:' + active.textContent.trim() : active === document.body ? 'body' : root.contains(active) ? 'inside' : 'elsewhere',
    events: window.__dropdownEvents?.[${JSON.stringify(label)}] ?? null,
  };
})()`;

/** A real pointer click on the element the expression returns, after the page settles. */
async function clickElement(page, expression) {
  const point = await page.evaluate(`(() => {
    const element = ${expression};
    if (!element) throw new Error('missing click target');
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
  await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
  await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
}

const dropdownTrigger = (label) =>
  `document.querySelector('.vf-dropdown[aria-label="${label}"] > .vf-dropdown__trigger')`;
const dropdownMenu = (label) => `document.getElementById(${dropdownTrigger(label)}.getAttribute('aria-controls'))`;

/** Installs a per-root log of the group box's collapsed-change events, keyed by the root's title text. */
const installGroupBoxLog = `(() => {
  window.__groupBoxEvents = {};
  for (const root of document.querySelectorAll('[data-case] .vf-group-box')) {
    const trigger = root.querySelector(':scope > legend > .vf-group-box__trigger');
    if (!trigger) continue;
    const name = trigger.textContent.trim();
    window.__groupBoxEvents[name] = [];
    root.addEventListener('vf-group-box:collapsed-change', (event) => {
      if (event.target !== root) return;
      window.__groupBoxEvents[name].push({ collapsed: event.detail.collapsed, bubbles: event.bubbles });
    });
  }
  return Object.keys(window.__groupBoxEvents).length;
})()`;

/** One group box as the suite reads it, by its trigger text. */
const readGroupBox = (title) => `(() => {
  const trigger = [...document.querySelectorAll('.vf-group-box__trigger')].find((candidate) => candidate.textContent.trim() === ${JSON.stringify(title)});
  const root = trigger.closest('.vf-group-box');
  const content = root.querySelector(':scope > .vf-group-box__content');
  return {
    enhanced: root.hasAttribute('data-vf-razor-group-box-enhanced'),
    expanded: trigger.getAttribute('aria-expanded'),
    className: root.className,
    contentPresent: content !== null,
    contentId: content?.id ?? null,
    controlsContent: content !== null && trigger.getAttribute('aria-controls') === content.id,
    labelledByTrigger: content !== null && content.getAttribute('aria-labelledby') === trigger.id,
    role: content?.getAttribute('role') ?? null,
    afterLegend: content !== null && content.previousElementSibling?.tagName === 'LEGEND',
    text: content ? content.textContent.replace(/\\s+/g, ' ').trim() : null,
    hiddenCopies: root.querySelectorAll(':scope > .vf-group-box__content[hidden], :scope > [style*="display: none"]').length,
    templatePresent: root.querySelector(':scope > template[data-vf-razor-group-box="content"]') !== null,
    focused: document.activeElement === trigger,
    disabled: trigger.disabled,
    events: window.__groupBoxEvents?.[${JSON.stringify(title)}] ?? null,
    triggerCount: root.querySelectorAll('.vf-group-box__trigger').length,
  };
})()`;

const server = await serve(distDirectory);
const chrome = await launchChrome();

try {
  // ---------------------------------------------------------------- enhanced
  await withPage(chrome, server.origin, 'fixture-enhanced.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-enhanced]'))`);

    const enhanced = await page.evaluate(`(() => {
      const roots = [...document.querySelectorAll('[data-vf-razor="input"]')];
      return { total: roots.length, enhanced: roots.filter((r) => r.hasAttribute('data-vf-razor-enhanced')).length };
    })()`);
    check('every Razor root is enhanced', enhanced.total === enhanced.enhanced, JSON.stringify(enhanced));
    check('the fixture actually has roots', enhanced.total >= 16, `found ${enhanced.total}`);

    // Computed visibility, not just the property: `hidden` loses to the
    // canonical .vf-icon-button display rule, so a property-only assertion
    // would pass while the control is on screen.
    const clearVisible = await page.evaluate(`(() => {
      const seen = (el) => el.getBoundingClientRect().width > 0 && getComputedStyle(el).display !== 'none';
      const filled = document.querySelector('[data-case="clearable"] [data-vf-razor-input="clear"]');
      const empty = document.querySelector('[data-case="clearable-empty"] [data-vf-razor-input="clear"]');
      const disabled = document.querySelector('[data-case="disabled"] [data-vf-razor-input="clear"]');
      const readonly = document.querySelector('[data-case="readonly"] [data-vf-razor-input="clear"]');
      return {
        filledSeen: seen(filled),
        filledDisabled: filled.disabled,
        emptySeen: seen(empty),
        disabledSeen: seen(disabled),
        readonlySeen: seen(readonly),
      };
    })()`);
    check(
      'clear is actually visible for a filled control',
      clearVisible.filledSeen === true,
      JSON.stringify(clearVisible),
    );
    check('clear is enabled once enhanced', clearVisible.filledDisabled === false);
    check('clear is actually invisible while empty', clearVisible.emptySeen === false);
    check('clear is actually invisible when disabled', clearVisible.disabledSeen === false);
    check('clear is actually invisible when read-only', clearVisible.readonlySeen === false);

    const typing = await page.evaluate(`(() => {
      const input = document.querySelector('#clearable-empty');
      const clear = document.querySelector('[data-case="clearable-empty"] [data-vf-razor-input="clear"]');
      input.value = 'typed';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const afterType = { filled: input.getAttribute('data-vf-filled'), clearHidden: clear.hidden };
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return { afterType, afterClearText: { filled: input.getAttribute('data-vf-filled'), clearHidden: clear.hidden } };
    })()`);
    check('typing marks the control filled', typing.afterType.filled === 'true', JSON.stringify(typing));
    check('typing reveals the clear action', typing.afterType.clearHidden === false);
    check('emptying drops the filled marker', typing.afterClearText.filled === null);
    check('emptying hides the clear action', typing.afterClearText.clearHidden === true);

    const cleared = await page.evaluate(`(() => {
      const input = document.querySelector('#clearable');
      const clear = document.querySelector('[data-case="clearable"] [data-vf-razor-input="clear"]');
      let inputEvents = 0;
      input.addEventListener('input', () => { inputEvents += 1; });
      clear.click();
      return {
        value: input.value,
        filled: input.getAttribute('data-vf-filled'),
        clearHidden: clear.hidden,
        focused: document.activeElement === input,
        inputEvents,
      };
    })()`);
    check('clear empties the control', cleared.value === '', JSON.stringify(cleared));
    check('clear drops the filled marker', cleared.filled === null);
    check('clear hides itself', cleared.clearHidden === true);
    check('clear returns focus to the control', cleared.focused === true);
    check('clear emits a native input event', cleared.inputEvents === 1);

    const reveal = await page.evaluate(`(() => {
      const input = document.querySelector('#password');
      const toggle = document.querySelector('[data-case="password"] [data-vf-razor-input="password-reveal"]');
      const before = { type: input.getAttribute('type'), pressed: toggle.getAttribute('aria-pressed'), label: toggle.getAttribute('aria-label') };
      input.focus();
      input.setSelectionRange(2, 8, 'backward');
      toggle.click();
      const shown = {
        type: input.getAttribute('type'),
        pressed: toggle.getAttribute('aria-pressed'),
        label: toggle.getAttribute('aria-label'),
        start: input.selectionStart,
        end: input.selectionEnd,
        direction: input.selectionDirection,
        focused: document.activeElement === input,
      };
      toggle.click();
      return { before, shown, hidden: { type: input.getAttribute('type'), pressed: toggle.getAttribute('aria-pressed') } };
    })()`);
    check('a password starts protected', reveal.before.type === 'password', JSON.stringify(reveal.before));
    check('reveal switches the type to text', reveal.shown.type === 'text', JSON.stringify(reveal.shown));
    check('reveal updates aria-pressed', reveal.shown.pressed === 'true');
    check('reveal updates the accessible name', reveal.shown.label === 'Hide password');
    check('reveal keeps focus on the control', reveal.shown.focused === true);
    check('reveal restores the caret offsets', reveal.shown.start === 2 && reveal.shown.end === 8);
    check('reveal restores the selection direction', reveal.shown.direction === 'backward');
    check('hiding restores the password type', reveal.hidden.type === 'password');
    check('hiding resets aria-pressed', reveal.hidden.pressed === 'false');

    const inert = await page.evaluate(`(() => {
      const disabled = document.querySelector('[data-case="disabled"] [data-vf-razor-input="clear"]');
      const readonly = document.querySelector('[data-case="readonly"] [data-vf-razor-input="clear"]');
      return { disabledHidden: disabled.hidden, readonlyHidden: readonly.hidden };
    })()`);
    check('a disabled control offers no clear action', inert.disabledHidden === true, JSON.stringify(inert));
    check('a read-only control offers no clear action', inert.readonlyHidden === true);

    const nativeType = await page.evaluate(
      `document.querySelector('#number').getAttribute('type') + '|' + document.querySelector('#number').getAttribute('step')`,
    );
    check('a native number type survives enhancement', nativeType === 'number|1', nativeType);

    const field = await page.evaluate(`(() => {
      const input = document.querySelector('#field-floating-input');
      const field = document.querySelector('[data-testid="field-field-floating-input"]');
      const control = field.querySelector('.vf-field__control');
      const before = {
        fieldFloating: field.classList.contains('vf-field--floating'),
        inputFloating: input.classList.contains('vf-input--floating'),
        filled: control.classList.contains('vf-field__control--filled'),
      };
      input.value = 'Acme';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return { before, afterFilled: control.classList.contains('vf-field__control--filled') };
    })()`);
    // Since M11 the floating classes are rendered by vf-field on the server -
    // placement and label presence cannot change without a re-render - so they
    // are asserted as already present rather than applied by a bridge. What is
    // still dynamic is filled, and that is the field controller's only job.
    check(
      'the server renders the field floating, with no runtime bridge',
      field.before.fieldFloating === true,
      JSON.stringify(field),
    );
    check('the server marks the input floating', field.before.inputFloating === true);
    check('an empty floating field is not filled', field.before.filled === false);
    check('typing marks the floating field filled', field.afterFilled === true);

    const independence = await page.evaluate(`(() => {
      const a = document.querySelector('#filled');
      const b = document.querySelector('#clearable');
      a.value = 'changed-a';
      a.dispatchEvent(new Event('input', { bubbles: true }));
      return { a: a.value, b: b.value };
    })()`);
    check(
      'instances stay independent',
      independence.a === 'changed-a' && independence.b === '',
      JSON.stringify(independence),
    );

    check(
      'the page produced no script errors',
      page.diagnostics.pageErrors.length === 0,
      page.diagnostics.pageErrors.join('; '),
    );
  });

  // -------------------------------------------------------------------- no-js
  await withPage(chrome, server.origin, 'fixture-no-js.html', async (page) => {
    const noJs = await page.evaluate(`(() => {
      const input = document.querySelector('#plain');
      const password = document.querySelector('#password');
      const buttons = [...document.querySelectorAll('button[data-vf-razor-input]')];
      input.value = 'typed without javascript';
      const form = document.querySelector('#fixture-form');
      return {
        enhancedRoots: document.querySelectorAll('[data-vf-razor-enhanced]').length,
        typed: input.value,
        submittable: new FormData(form).get('plain'),
        passwordType: password.getAttribute('type'),
        actionsHidden: buttons.every((b) => b.hidden),
        actionsUnrendered: buttons.every((b) => getComputedStyle(b).display === 'none'),
        actionsDisabled: buttons.every((b) => b.disabled),
        focusableActions: buttons.filter((b) => !b.disabled).length,
        floatingApplied: document.querySelectorAll('.vf-field--floating').length,
        floatingLabelInsideControl: document.querySelectorAll(
          '.vf-field__control > .vf-field__label--floating',
        ).length,
        labelAssociations: [...document.querySelectorAll('.vf-field__label')].filter((label) => {
          const target = document.getElementById(label.getAttribute('for') ?? '');
          return target !== null && target.tagName === 'INPUT';
        }).length,
        fieldsEnhanced: document.querySelectorAll('[data-vf-razor-field-enhanced]').length,
      };
    })()`);
    check('no controller runs without its script', noJs.enhancedRoots === 0, JSON.stringify(noJs));
    check('typing works without javascript', noJs.typed === 'typed without javascript');
    check('the value is submittable without javascript', noJs.submittable === 'typed without javascript');
    check('a password stays protected without javascript', noJs.passwordType === 'password');
    check('no action is visible without javascript', noJs.actionsHidden === true);
    check('no action occupies layout without javascript', noJs.actionsUnrendered === true);
    check('no action is reachable without javascript', noJs.actionsDisabled === true && noJs.focusableActions === 0);
    // Before M11 there was no Razor field, so the floating composition existed
    // only once the controller had built it and a no-JS page degraded to a
    // plain label. vf-field renders it on the server now: the class, the label
    // moved inside the control, and the association are all present with the
    // script blocked, and the layout is pure CSS from there.
    check('floating labels are composed without javascript', noJs.floatingApplied === 1, JSON.stringify(noJs));
    check('the floating label sits inside the control without javascript', noJs.floatingLabelInsideControl === 1);
    check('every label reaches a real control without javascript', noJs.labelAssociations === 2);
    check('no field controller runs without its script', noJs.fieldsEnhanced === 0);
  });

  // --------------------------------------------------------- mixed ownership
  await withPage(chrome, server.origin, 'fixture-mixed.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('#vue-control'))`);
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-enhanced]'))`);
    await delay(150);

    const ownership = await page.evaluate(`(() => {
      const vue = document.querySelector('#vue-control');
      const vueRoot = vue.closest('.vf-input-wrap') ?? vue;
      const razor = document.querySelector('#clearable');
      const snapshot = (el) => ({ outer: el.outerHTML, value: el.value });
      const before = snapshot(vue);

      const razorClear = document.querySelector('[data-case="clearable"] [data-vf-razor-input="clear"]');
      razorClear.click();

      return {
        vueMounted: Boolean(vue),
        vueMarkedByRazor:
          vueRoot.hasAttribute('data-vf-razor') ||
          vueRoot.hasAttribute('data-vf-razor-enhanced') ||
          vue.hasAttribute('data-vf-razor-input') ||
          vue.hasAttribute('data-vf-razor-type'),
        vueInsideRazorRoot: Boolean(vue.closest('[data-vf-razor="input"]')),
        vueUnchanged: snapshot(vue).outer === before.outer,
        vueValue: vue.value,
        razorValue: razor.value,
        razorEnhanced: document.querySelectorAll('[data-vf-razor-enhanced]').length,
        vueActionControls: vueRoot.querySelectorAll('[data-vf-razor-input]').length,
      };
    })()`);
    check('the Vue control really mounted', ownership.vueMounted === true, JSON.stringify(ownership));
    check('the Razor controller marks no Vue node', ownership.vueMarkedByRazor === false);
    check('the Vue control is outside every Razor root', ownership.vueInsideRazorRoot === false);
    check('clearing a Razor control leaves the Vue DOM untouched', ownership.vueUnchanged === true);
    check(
      'the Vue value is independent of the Razor value',
      ownership.vueValue === 'vue-value' && ownership.razorValue === '',
    );
    check('the Razor controller adds no controls to the Vue root', ownership.vueActionControls === 0);

    // Vue owns this subtree, so its clear runs its own historical path: the
    // wrapper collapses and the input element is replaced on the next patch.
    // The value has to be read after that patch, not synchronously.
    const vueClicked = await page.evaluate(`(() => {
      const clear = document.querySelector('#vue-input .vf-input-wrap__clear');
      clear?.click();
      return Boolean(clear);
    })()`);
    await delay(100);
    const vueOwn = await page.evaluate(`(() => {
      const vue = document.querySelector('#vue-control');
      return { value: vue?.value ?? null, stillRazorFree: !vue?.hasAttribute('data-vf-razor-type') };
    })()`);
    check('the Vue control keeps its own clear action', vueClicked === true);
    check('the Vue clear action still works', vueOwn.value === '', JSON.stringify(vueOwn));
    check('the replaced Vue input is still untouched by the Razor controller', vueOwn.stillRazorFree === true);

    check(
      'the mixed page produced no script errors',
      page.diagnostics.pageErrors.length === 0,
      page.diagnostics.pageErrors.join('; '),
    );
  });

  // ---------------------------------------------------------- double bootstrap
  //
  // A host can load the controller twice, or call the exported enhancer again
  // after inserting markup. The ownership attribute is what makes that a no-op,
  // and nothing was asserting it.
  await withPage(chrome, server.origin, 'fixture-enhanced.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-enhanced]'))`);

    const before = await page.evaluate(`(() => ({
      roots: document.querySelectorAll('[data-vf-razor="input"]').length,
      enhanced: document.querySelectorAll('[data-vf-razor-enhanced]').length,
      clears: document.querySelectorAll('[data-vf-razor-input="clear"]').length,
      reveals: document.querySelectorAll('[data-vf-razor-input="password-reveal"]').length,
    }))()`);

    // A fresh module URL re-evaluates the module, which re-runs its bootstrap.
    await page.evaluate(`import('./vueforge-razor.js?bootstrap=2').then(() => true)`);
    await delay(250);

    const after = await page.evaluate(`(() => {
      const input = document.querySelector('#clearable');
      const clear = document.querySelector('[data-case="clearable"] [data-vf-razor-input="clear"]');
      let inputEvents = 0;
      input.addEventListener('input', () => { inputEvents += 1; });
      clear.click();
      return {
        roots: document.querySelectorAll('[data-vf-razor="input"]').length,
        enhanced: document.querySelectorAll('[data-vf-razor-enhanced]').length,
        clears: document.querySelectorAll('[data-vf-razor-input="clear"]').length,
        reveals: document.querySelectorAll('[data-vf-razor-input="password-reveal"]').length,
        inputEvents,
        value: input.value,
      };
    })()`);

    check('a second bootstrap adds no root', after.roots === before.roots, JSON.stringify({ before, after }));
    check('a second bootstrap adds no ownership marker', after.enhanced === before.enhanced);
    check('a second bootstrap adds no clear action', after.clears === before.clears);
    check('a second bootstrap adds no reveal action', after.reveals === before.reveals);
    check('a second bootstrap does not double the clear listener', after.inputEvents === 1, JSON.stringify(after));
    check('clear still works after a second bootstrap', after.value === '');
    check(
      'the double-bootstrapped page produced no script errors',
      page.diagnostics.pageErrors.length === 0,
      page.diagnostics.pageErrors.join('; '),
    );
  });

  // ------------------------------------------------------------- accordion
  //
  // The M22 suite. The first Razor controller that owns a state change, driven
  // with real pointer and key events and read back off the live DOM: state,
  // relationships, transition endpoint, events, focus and ownership of the
  // roots it mounts on.
  await withPage(chrome, server.origin, 'fixture-enhanced.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-accordion-enhanced]'))`);
    // Every root is enhanced in the same synchronous bootstrap, but the first
    // real pointer event needs layout to have settled once.
    await delay(150);
    const logged = await page.evaluate(installAccordionLog);
    check('the accordion event log covers every accordion on the page', logged === 10, `logged ${logged}`);

    const mounted = await page.evaluate(`(() => ({
      owned: document.querySelectorAll('[data-vf-razor="accordion"]').length,
      enhanced: document.querySelectorAll('[data-vf-razor="accordion"][data-vf-razor-accordion-enhanced]').length,
      unowned: document.querySelectorAll('[data-case="accordion-unowned"] .vf-accordion[data-vf-razor-accordion-enhanced]').length,
      unownedRoots: document.querySelectorAll('[data-case="accordion-unowned"] .vf-accordion').length,
    }))()`);
    check(
      'every Razor-owned accordion root is enhanced, nested included',
      mounted.owned === 9 && mounted.enhanced === 9,
      JSON.stringify(mounted),
    );
    check(
      'an accordion copy without the ownership marker is not mounted',
      mounted.unowned === 0 && mounted.unownedRoots === 1,
      JSON.stringify(mounted),
    );

    // -- click opens, with the reference's enter and endpoint
    const closedBefore = await page.evaluate(readAccordion('accordion-closed', 'Closed'));
    check(
      'a closed accordion starts closed with its content deferred',
      closedBefore.expanded === 'false' && !closedBefore.panelPresent && closedBefore.templatePresent,
      JSON.stringify(closedBefore),
    );
    await clickAt(page, '[data-case="accordion-closed"] .vf-accordion__trigger');
    const opening = await page.evaluate(readAccordion('accordion-closed', 'Closed'));
    check(
      'a real click flips aria-expanded and the icon at once',
      opening.expanded === 'true' && opening.iconOpen,
      JSON.stringify(opening),
    );
    check(
      'the click creates the region, labelled by the trigger, holding the deferred content',
      opening.panelPresent &&
        opening.panelRole === 'region' &&
        opening.labelledByTrigger === true &&
        opening.innerText === 'Closed content.',
      JSON.stringify(opening),
    );
    check(
      'the entering panel carries the reference transition inline',
      typeof opening.panelTransition === 'string' &&
        opening.panelTransition.startsWith('height var(--vf-motion-duration-normal)'),
      JSON.stringify(opening),
    );
    check('the click leaves focus on the trigger', opening.focused === true);
    check(
      'the click dispatches exactly one open-change event with open=true',
      JSON.stringify(opening.events) === JSON.stringify([{ open: true, bubbles: true }]),
      JSON.stringify(opening.events),
    );
    await delay(400);
    const opened = await page.evaluate(readAccordion('accordion-closed', 'Closed'));
    check(
      'after the normal duration every inline declaration is cleared and an empty style attribute remains',
      opened.panelStyle === '' && opened.panelTransition === '',
      JSON.stringify(opened),
    );

    // -- click closes, with delayed removal
    await clickAt(page, '[data-case="accordion-closed"] .vf-accordion__trigger');
    const closing = await page.evaluate(readAccordion('accordion-closed', 'Closed'));
    check(
      'a second click flips aria-expanded back while the panel is still leaving',
      closing.expanded === 'false' && closing.panelPresent && !closing.iconOpen,
      JSON.stringify(closing),
    );
    check(
      'the leaving panel collapses through inline styles',
      closing.panelStyle.includes('height: 0px') && closing.panelStyle.includes('opacity: 0'),
      JSON.stringify(closing),
    );
    await delay(400);
    const closed = await page.evaluate(readAccordion('accordion-closed', 'Closed'));
    check('after the normal duration the panel is removed, not hidden', !closed.panelPresent, JSON.stringify(closed));
    check(
      'two toggles produced exactly two events, true then false',
      JSON.stringify(closed.events.map((e) => e.open)) === '[true,false]',
      JSON.stringify(closed.events),
    );
    const noHidden = await page.evaluate(
      `document.querySelectorAll('[data-case="accordion-closed"] [hidden], [data-case="accordion-closed"] .vf-accordion__content').length`,
    );
    check('nothing is hidden in place after closing', noHidden === 0);

    // -- keyboard: Enter and Space through the keydown handler, no native click
    await page.evaluate(`(() => {
      const trigger = document.querySelector('[data-case="accordion-open"] .vf-accordion__trigger');
      window.__nativeClicks = 0;
      trigger.addEventListener('click', () => { window.__nativeClicks += 1; });
      trigger.focus();
    })()`);
    await pressKey(page, 'Enter');
    const afterEnter = await page.evaluate(readAccordion('accordion-open', 'Open'));
    check(
      'Enter on the focused open trigger closes it',
      afterEnter.expanded === 'false' && !afterEnter.iconOpen,
      JSON.stringify(afterEnter),
    );
    await delay(400);
    await pressKey(page, ' ');
    const afterSpace = await page.evaluate(readAccordion('accordion-open', 'Open'));
    check(
      'Space on the focused trigger opens it again',
      afterSpace.expanded === 'true' && afterSpace.panelPresent && afterSpace.innerText === 'Open content.',
      JSON.stringify(afterSpace),
    );
    const nativeClicks = await page.evaluate('window.__nativeClicks');
    check(
      'neither key produced a native click: the keydown handler prevented the default',
      nativeClicks === 0,
      `native clicks ${nativeClicks}`,
    );
    check(
      'the two key presses produced two events',
      JSON.stringify(afterSpace.events.map((e) => e.open)) === '[false,true]',
      JSON.stringify(afterSpace.events),
    );
    check('the keyboard leaves focus on the trigger', afterSpace.focused === true);

    // -- disabled: no toggle by any route
    await page.evaluate(`document.querySelector('[data-case="accordion-disabled"] .vf-accordion__trigger').focus()`);
    await pressKey(page, 'Enter');
    await pressKey(page, ' ');
    await page.evaluate(`document.querySelector('[data-case="accordion-disabled"] .vf-accordion__trigger').click()`);
    await page.evaluate(
      `document.querySelector('[data-case="accordion-disabled"] .vf-accordion__trigger').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))`,
    );
    const disabled = await page.evaluate(readAccordion('accordion-disabled', 'Disabled'));
    check(
      'a disabled trigger takes no focus and toggles on no route',
      disabled.disabled && !disabled.focused && disabled.expanded === 'false' && !disabled.panelPresent,
      JSON.stringify(disabled),
    );
    check('a disabled trigger dispatches no event', disabled.events.length === 0, JSON.stringify(disabled.events));

    // -- a consumer control inside the panel is the consumer's
    await clickAt(page, '[data-case="accordion-consumer"] .vf-accordion__trigger');
    await delay(400);
    const consumerButton = await page.evaluate(`(() => {
      const button = document.querySelector('[data-case="accordion-consumer"] #consumer-retry');
      if (!button) return null;
      window.__retryClicks = 0;
      button.addEventListener('click', () => { window.__retryClicks += 1; });
      return { inPanel: button.closest('.vf-accordion__content-inner') !== null, buttons: document.querySelectorAll('[data-case="accordion-consumer"] button').length };
    })()`);
    check(
      'opening renders the consumer button inside the inner wrapper, beside one trigger',
      consumerButton?.inPanel === true && consumerButton.buttons === 2,
      JSON.stringify(consumerButton),
    );
    await clickAt(page, '[data-case="accordion-consumer"] #consumer-retry');
    const afterConsumerClick = await page.evaluate(readAccordion('accordion-consumer', 'Export'));
    const retryClicks = await page.evaluate('window.__retryClicks');
    check(
      'clicking the consumer button reaches the consumer and toggles nothing',
      retryClicks === 1 && afterConsumerClick.expanded === 'true' && afterConsumerClick.events.length === 1,
      JSON.stringify({ retryClicks, afterConsumerClick }),
    );

    // -- siblings stay independent
    await clickAt(page, '[data-case="accordion-siblings"] .vf-accordion:first-of-type .vf-accordion__trigger');
    await delay(400);
    const first = await page.evaluate(readAccordion('accordion-siblings', 'First'));
    const second = await page.evaluate(readAccordion('accordion-siblings', 'Second'));
    check(
      'clicking the first sibling opens it and leaves the second as it was',
      first.expanded === 'true' && first.panelPresent && second.expanded === 'true' && second.events.length === 0,
      JSON.stringify({ first, second }),
    );
    const siblingIds = await page.evaluate(`(() => {
      const triggers = [...document.querySelectorAll('[data-case="accordion-siblings"] .vf-accordion__trigger')];
      const panels = [...document.querySelectorAll('[data-case="accordion-siblings"] .vf-accordion__content')];
      return { ids: new Set([...triggers, ...panels].map((el) => el.id)).size, local: triggers.every((t) => t.parentElement.contains(document.getElementById(t.getAttribute('aria-controls')))) };
    })()`);
    check(
      'sibling ids are distinct and every aria-controls stays inside its own root',
      siblingIds.ids === 4 && siblingIds.local === true,
      JSON.stringify(siblingIds),
    );

    // -- nested: the inner toggles alone; its event bubbles but targets the inner root
    await clickAt(page, '[data-case="accordion-nested"] .vf-accordion .vf-accordion .vf-accordion__trigger');
    await delay(400);
    const outer = await page.evaluate(readAccordion('accordion-nested', 'Outer'));
    const inner = await page.evaluate(readAccordion('accordion-nested', 'Inner'));
    check(
      'clicking the inner trigger opens the inner accordion only',
      inner.expanded === 'true' &&
        inner.panelPresent &&
        inner.innerText === 'Inner content.' &&
        outer.expanded === 'true',
      JSON.stringify({ outer, inner }),
    );
    check(
      "the inner event is logged on the inner root and not counted as the outer's",
      inner.events.length === 1 && outer.events.length === 0,
      JSON.stringify({ outerEvents: outer.events, innerEvents: inner.events }),
    );
    check('the outer root owns exactly its own trigger', outer.triggerCount === 2 && inner.triggerCount === 1);

    // -- content rendered on open is itself enhanced
    await clickAt(page, '[data-case="accordion-with-input"] .vf-accordion__trigger');
    await delay(400);
    const insideInput = await page.evaluate(`(() => {
      const root = document.querySelector('[data-case="accordion-with-input"] .vf-accordion__content [data-vf-razor="input"]');
      if (!root) return null;
      const clear = root.querySelector('[data-vf-razor-input="clear"]');
      const control = document.getElementById('inside-accordion');
      const before = { enhanced: root.hasAttribute('data-vf-razor-enhanced'), clearVisible: clear ? getComputedStyle(clear).display !== 'none' : null, value: control.value };
      clear?.click();
      return { ...before, valueAfterClear: control.value };
    })()`);
    check(
      'an input rendered inside the opened panel is enhanced and its clear action works',
      insideInput?.enhanced === true &&
        insideInput.clearVisible === true &&
        insideInput.value === 'typed' &&
        insideInput.valueAfterClear === '',
      JSON.stringify(insideInput),
    );

    check(
      'the accordion page produced no script errors',
      page.diagnostics.pageErrors.length === 0,
      page.diagnostics.pageErrors.join('; '),
    );
  });

  // ------------------------------------------------------------- group box
  //
  // The M29 suite. A controller that reproduces one behaviour - the trigger's
  // click - and nothing else: no keydown handler, no timer, no global
  // listener. Driven with real pointer and key events and read back off the
  // live DOM: state, classes, relationships, v-if removal and fresh
  // re-rendering, events, focus, and ownership of the roots it mounts on.
  await withPage(chrome, server.origin, 'fixture-enhanced.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-group-box-enhanced]'))`);
    await delay(150);
    const logged = await page.evaluate(installGroupBoxLog);
    // Eleven owned collapsible roots outside a template, plus the unowned copy,
    // which carries a trigger and no controller.
    check(
      'the group box event log covers every group box with a trigger on the page',
      logged === 12,
      `logged ${logged}`,
    );

    const mounted = await page.evaluate(`(() => ({
      owned: document.querySelectorAll('[data-vf-razor="group-box"]').length,
      collapsible: document.querySelectorAll('[data-vf-razor="group-box"] > legend > .vf-group-box__trigger').length,
      enhanced: document.querySelectorAll('[data-vf-razor="group-box"][data-vf-razor-group-box-enhanced]').length,
      staticEnhanced: document.querySelectorAll('[data-case="group-box-static"] [data-vf-razor-group-box-enhanced]').length,
      staticRoots: document.querySelectorAll('[data-case="group-box-static"] [data-vf-razor="group-box"]').length,
      unowned: document.querySelectorAll('[data-case="group-box-unowned"] .vf-group-box[data-vf-razor-group-box-enhanced]').length,
      unownedRoots: document.querySelectorAll('[data-case="group-box-unowned"] .vf-group-box').length,
    }))()`);
    check(
      'every Razor-owned collapsible group box is enhanced, nested included, and nothing else is claimed',
      mounted.owned === 13 && mounted.collapsible === 11 && mounted.enhanced === 11,
      JSON.stringify(mounted),
    );
    check(
      'a static group box - titled, or collapsible without a title - is not claimed',
      mounted.staticRoots === 2 && mounted.staticEnhanced === 0,
      JSON.stringify(mounted),
    );
    check(
      'a group box copy without the ownership marker is not mounted',
      mounted.unowned === 0 && mounted.unownedRoots === 1,
      JSON.stringify(mounted),
    );

    // -- click opens a fresh content element after the legend
    const closedBefore = await page.evaluate(readGroupBox('Closed'));
    check(
      'a closed group box starts closed with its content deferred',
      closedBefore.expanded === 'false' && !closedBefore.contentPresent && closedBefore.templatePresent,
      JSON.stringify(closedBefore),
    );
    await clickAt(page, '[data-case="group-box-closed"] .vf-group-box__trigger');
    const opened = await page.evaluate(readGroupBox('Closed'));
    check(
      'a click opens it synchronously: aria-expanded, the region after the legend, both relationships',
      opened.expanded === 'true' &&
        opened.contentPresent &&
        opened.afterLegend &&
        opened.controlsContent &&
        opened.labelledByTrigger &&
        opened.role === 'region' &&
        opened.text === 'Closed content.',
      JSON.stringify(opened),
    );
    check(
      'opening drops the collapsed modifier and keeps the canonical class order',
      opened.className === 'vf-group-box vf-group-box--titled vf-group-box--collapsible',
      opened.className,
    );
    check('the click leaves focus on the trigger', opened.focused === true, JSON.stringify(opened));
    check(
      'the open is dispatched as one bubbling event with collapsed=false',
      JSON.stringify(opened.events) === '[{"collapsed":false,"bubbles":true}]',
      JSON.stringify(opened.events),
    );

    // -- v-if: typing, collapsing and reopening discards the typed value
    const typedNode = await page.evaluate(`(() => {
      const input = document.querySelector('[data-case="group-box-closed"] .group-box-typed');
      input.value = 'typed before collapse';
      window.__typedNode = input;
      return input.value;
    })()`);
    await clickAt(page, '[data-case="group-box-closed"] .vf-group-box__trigger');
    const collapsed = await page.evaluate(readGroupBox('Closed'));
    check(
      'a click closes it in the same task: the content is removed outright, nothing hidden is kept',
      collapsed.expanded === 'false' &&
        !collapsed.contentPresent &&
        collapsed.hiddenCopies === 0 &&
        collapsed.className === 'vf-group-box vf-group-box--titled vf-group-box--collapsible vf-group-box--collapsed',
      JSON.stringify(collapsed),
    );
    await clickAt(page, '[data-case="group-box-closed"] .vf-group-box__trigger');
    const reopened = await page.evaluate(`(() => {
      const input = document.querySelector('[data-case="group-box-closed"] .group-box-typed');
      return { sameNode: input === window.__typedNode, value: input.value, oldConnected: window.__typedNode.isConnected };
    })()`);
    check(
      'reopening renders the content afresh: a new element, the typed value gone',
      typedNode === 'typed before collapse' &&
        reopened.sameNode === false &&
        reopened.value === '' &&
        reopened.oldConnected === false,
      JSON.stringify(reopened),
    );
    const threeEvents = await page.evaluate(readGroupBox('Closed'));
    check(
      'open, close, open dispatched three events with the new collapsed values',
      JSON.stringify(threeEvents.events.map((e) => e.collapsed)) === '[false,true,false]',
      JSON.stringify(threeEvents.events),
    );

    // -- keyboard: native activation only, one click per key, nothing prevented
    await page.evaluate(`(() => {
      const trigger = document.querySelector('[data-case="group-box-open"] .vf-group-box__trigger');
      window.__groupBoxClicks = 0;
      window.__groupBoxKeys = [];
      trigger.addEventListener('click', () => { window.__groupBoxClicks += 1; });
      trigger.addEventListener('keydown', (event) => {
        const entry = { key: event.key };
        window.__groupBoxKeys.push(entry);
        setTimeout(() => { entry.prevented = event.defaultPrevented; }, 0);
      });
      trigger.focus();
    })()`);
    await pressKey(page, 'Enter');
    const afterEnter = await page.evaluate(readGroupBox('Open'));
    check(
      'Enter on the focused trigger closes it through the native click',
      afterEnter.expanded === 'false' && !afterEnter.contentPresent,
      JSON.stringify(afterEnter),
    );
    await pressKey(page, ' ');
    await delay(50);
    const afterSpace = await page.evaluate(readGroupBox('Open'));
    const keyRecord = await page.evaluate(`({ clicks: window.__groupBoxClicks, keys: window.__groupBoxKeys })`);
    check(
      'Space on the focused trigger opens it again through the native click',
      afterSpace.expanded === 'true' && afterSpace.contentPresent && afterSpace.text === 'Open content.',
      JSON.stringify(afterSpace),
    );
    check(
      'each key produced exactly one native click and neither keydown was prevented',
      keyRecord.clicks === 2 &&
        keyRecord.keys.length === 2 &&
        keyRecord.keys.every((entry) => entry.prevented === false),
      JSON.stringify(keyRecord),
    );
    check('the keyboard leaves focus on the trigger', afterSpace.focused === true);

    // -- keys the reference ignores. Dispatched on the trigger rather than sent
    // through the browser: an unhandled navigation key sent through CDP hides
    // the headless tab (M28).
    const ignoredKeys = await page.evaluate(`(() => {
      const trigger = document.querySelector('[data-case="group-box-open"] .vf-group-box__trigger');
      const before = trigger.getAttribute('aria-expanded');
      const prevented = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Escape'].map((key) => {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        trigger.dispatchEvent(event);
        return event.defaultPrevented;
      });
      return { before, after: trigger.getAttribute('aria-expanded'), prevented };
    })()`);
    check(
      'arrow keys, Home, End and Escape change nothing and are not prevented',
      ignoredKeys.before === ignoredKeys.after && ignoredKeys.prevented.every((value) => value === false),
      JSON.stringify(ignoredKeys),
    );

    // -- disabled: no focus, no toggle on any route
    await page.evaluate(`document.querySelector('[data-case="group-box-disabled"] .vf-group-box__trigger').focus()`);
    await pressKey(page, 'Enter');
    await pressKey(page, ' ');
    await page.evaluate(`document.querySelector('[data-case="group-box-disabled"] .vf-group-box__trigger').click()`);
    await page.evaluate(
      `document.querySelector('[data-case="group-box-disabled"] .vf-group-box__trigger').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))`,
    );
    const disabled = await page.evaluate(readGroupBox('Disabled'));
    check(
      'a disabled trigger takes no focus and toggles on no route',
      disabled.disabled && !disabled.focused && disabled.expanded === 'false' && !disabled.contentPresent,
      JSON.stringify(disabled),
    );
    check('a disabled trigger dispatches no event', disabled.events.length === 0, JSON.stringify(disabled.events));
    const disabledFieldset = await page.evaluate(
      `document.querySelector('[data-case="group-box-disabled"] fieldset').disabled`,
    );
    check('disabled never reaches the fieldset', disabledFieldset === false);

    // -- siblings are independent
    await clickAt(page, '[data-case="group-box-siblings"] .vf-group-box:first-of-type .vf-group-box__trigger');
    const first = await page.evaluate(readGroupBox('First'));
    const second = await page.evaluate(readGroupBox('Second'));
    check(
      'clicking one sibling closes that sibling only',
      first.expanded === 'false' && !first.contentPresent && second.expanded === 'true' && second.contentPresent,
      JSON.stringify({ first, second }),
    );
    check('the sibling that was not clicked dispatched nothing', second.events.length === 0);

    // -- nesting: each root owns its own trigger and content
    await clickAt(page, '[data-case="group-box-nested"] .vf-group-box .vf-group-box .vf-group-box__trigger');
    const outer = await page.evaluate(readGroupBox('Outer'));
    const inner = await page.evaluate(readGroupBox('Inner'));
    check(
      'clicking the inner trigger opens the inner group box only',
      inner.expanded === 'true' && inner.contentPresent && outer.expanded === 'true',
      JSON.stringify({ outer, inner }),
    );
    check(
      "the inner event is logged on the inner root and not counted as the outer's",
      inner.events.length === 1 && outer.events.length === 0,
      JSON.stringify({ outerEvents: outer.events, innerEvents: inner.events }),
    );
    await clickAt(page, '[data-case="group-box-nested"] .vf-group-box__trigger');
    const outerClosed = await page.evaluate(
      `document.querySelectorAll('[data-case="group-box-nested"] .vf-group-box').length`,
    );
    check(
      'closing the outer group box removes the inner one with its content',
      outerClosed === 1,
      `roots ${outerClosed}`,
    );
    await clickAt(page, '[data-case="group-box-nested"] .vf-group-box__trigger');
    const innerAgain = await page.evaluate(`(() => {
      const trigger = [...document.querySelectorAll('[data-case="group-box-nested"] .vf-group-box__trigger')].find((t) => t.textContent.trim() === 'Inner');
      const root = trigger.closest('.vf-group-box');
      return { expanded: trigger.getAttribute('aria-expanded'), enhanced: root.hasAttribute('data-vf-razor-group-box-enhanced') };
    })()`);
    check(
      'reopening the outer group box renders the inner one afresh, in its server state, enhanced',
      innerAgain.expanded === 'false' && innerAgain.enhanced === true,
      JSON.stringify(innerAgain),
    );
    await clickAt(page, '[data-case="group-box-nested"] .vf-group-box .vf-group-box .vf-group-box__trigger');
    const innerToggled = await page.evaluate(`(() => {
      const trigger = [...document.querySelectorAll('[data-case="group-box-nested"] .vf-group-box__trigger')].find((t) => t.textContent.trim() === 'Inner');
      return trigger.getAttribute('aria-expanded');
    })()`);
    check('the re-rendered inner group box toggles on its own click', innerToggled === 'true', innerToggled);

    await clickAt(page, '[data-case="group-box-nested-deferred"] .vf-group-box__trigger');
    const deferredInner = await page.evaluate(`(() => {
      const trigger = [...document.querySelectorAll('[data-case="group-box-nested-deferred"] .vf-group-box__trigger')].find((t) => t.textContent.trim() === 'Deferred inner');
      if (!trigger) return null;
      const root = trigger.closest('.vf-group-box');
      trigger.click();
      return { enhanced: root.hasAttribute('data-vf-razor-group-box-enhanced'), expandedAfterClick: trigger.getAttribute('aria-expanded') };
    })()`);
    check(
      'a group box rendered from a closed outer group box is enhanced when the outer one opens',
      deferredInner?.enhanced === true && deferredInner.expandedAfterClick === 'false',
      JSON.stringify(deferredInner),
    );

    // -- content rendered on open is itself enhanced
    await clickAt(page, '[data-case="group-box-with-input"] .vf-group-box__trigger');
    const insideInput = await page.evaluate(`(() => {
      const root = document.querySelector('[data-case="group-box-with-input"] .vf-group-box__content [data-vf-razor="input"]');
      if (!root) return null;
      const clear = root.querySelector('[data-vf-razor-input="clear"]');
      const control = document.getElementById('inside-group-box');
      const before = { enhanced: root.hasAttribute('data-vf-razor-enhanced'), value: control.value };
      clear?.click();
      return { ...before, valueAfterClear: control.value };
    })()`);
    check(
      'an input rendered inside the opened content is enhanced and its clear action works',
      insideInput?.enhanced === true && insideInput.value === 'typed' && insideInput.valueAfterClear === '',
      JSON.stringify(insideInput),
    );

    // -- the title "0" is a real, working disclosure
    await clickAt(page, '[data-case="group-box-zero"] .vf-group-box__trigger');
    const zero = await page.evaluate(readGroupBox('0'));
    check(
      'the title "0" renders a trigger that toggles',
      zero.expanded === 'false' && !zero.contentPresent,
      JSON.stringify(zero),
    );

    // -- a consumer class stays after the canonical classes across a toggle
    await clickAt(page, '[data-case="group-box-consumer"] .vf-group-box__trigger');
    const consumer = await page.evaluate(readGroupBox('Consumer'));
    check(
      'a consumer class keeps its place after the canonical classes when the modifier changes',
      consumer.className ===
        'vf-group-box vf-group-box--titled vf-group-box--collapsible vf-group-box--collapsed group-box-extra',
      consumer.className,
    );

    // -- the trigger submits nothing
    const submits = await page.evaluate(`(() => {
      let count = 0;
      document.querySelector('#fixture-form').addEventListener('submit', (event) => { count += 1; event.preventDefault(); });
      document.querySelector('[data-case="group-box-open"] .vf-group-box__trigger').click();
      document.querySelector('[data-case="group-box-open"] .vf-group-box__trigger').click();
      return count;
    })()`);
    check('a trigger inside a form submits nothing', submits === 0, `submits ${submits}`);

    check(
      'the group box page produced no script errors',
      page.diagnostics.pageErrors.length === 0,
      page.diagnostics.pageErrors.join('; '),
    );
  });

  // -------------------------------------- group box, listeners and bootstrap
  await withPage(chrome, server.origin, 'fixture-enhanced.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-group-box-enhanced]'))`);
    await page.evaluate(installGroupBoxLog);
    const record = await page.evaluate(`(async () => {
      const module = await import('./vueforge-razor.js');
      const added = [];
      const documentAdd = document.addEventListener;
      const windowAdd = window.addEventListener;
      document.addEventListener = function (type, ...rest) { added.push('document:' + type); return documentAdd.call(this, type, ...rest); };
      window.addEventListener = function (type, ...rest) { added.push('window:' + type); return windowAdd.call(this, type, ...rest); };
      const timers = [];
      const setTimeoutOriginal = window.setTimeout;
      const rafOriginal = window.requestAnimationFrame;
      window.setTimeout = function (...args) { timers.push('timeout'); return setTimeoutOriginal.apply(this, args); };
      window.requestAnimationFrame = function (...args) { timers.push('raf'); return rafOriginal.apply(this, args); };

      // A second bootstrap of every enhancer, then a fresh root inserted and
      // enhanced on its own, then one click on each.
      module.enhanceVueForgeGroupBoxes(document);
      const host = document.querySelector('[data-case="group-box-unowned"]');
      const fresh = host.querySelector('.vf-group-box').cloneNode(true);
      fresh.setAttribute('data-vf-razor', 'group-box');
      host.append(fresh);
      module.enhanceVueForgeGroupBoxes(host);
      module.enhanceVueForgeGroupBoxes(host);
      fresh.querySelector('.vf-group-box__trigger').click();
      document.querySelector('[data-case="group-box-open"] .vf-group-box__trigger').click();

      document.addEventListener = documentAdd;
      window.addEventListener = windowAdd;
      window.setTimeout = setTimeoutOriginal;
      window.requestAnimationFrame = rafOriginal;
      return {
        added,
        timers,
        freshExpanded: fresh.querySelector('.vf-group-box__trigger').getAttribute('aria-expanded'),
        freshContent: fresh.querySelectorAll(':scope > .vf-group-box__content').length,
      };
    })()`);
    const open = await page.evaluate(readGroupBox('Open'));
    check(
      'enhancing and toggling adds no document or window listener and starts no timer or animation frame',
      record.added.length === 0 && record.timers.length === 0,
      JSON.stringify(record),
    );
    check(
      'after a second bootstrap one click is one toggle and one event',
      open.expanded === 'false' && open.events.length === 1,
      JSON.stringify(open),
    );
    check(
      'a root inserted later and enhanced twice toggles once per click',
      record.freshExpanded === 'false' && record.freshContent === 0,
      JSON.stringify(record),
    );
    check(
      'the double-bootstrapped group box page produced no script errors',
      page.diagnostics.pageErrors.length === 0,
      page.diagnostics.pageErrors.join('; '),
    );
  });

  // -------------------------------------------------------- group box, no-js
  await withPage(chrome, server.origin, 'fixture-no-js.html', async (page) => {
    const noJs = await page.evaluate(`(() => {
      const closed = document.querySelector('[data-case="group-box-closed"] .vf-group-box__trigger');
      closed.click();
      return {
        enhanced: document.querySelectorAll('[data-vf-razor-group-box-enhanced]').length,
        closedExpanded: closed.getAttribute('aria-expanded'),
        closedContent: document.querySelectorAll('[data-case="group-box-closed"] .vf-group-box__content').length,
        templateInert: document.querySelectorAll('[data-case="group-box-closed"] .group-box-typed').length,
        openContent: document.querySelector('[data-case="group-box-open"] .vf-group-box__content')?.textContent.trim() ?? null,
        staticContent: [...document.querySelectorAll('[data-case="group-box-static"] .vf-group-box__content')].map((node) => node.textContent.trim()),
        triggerTypes: [...document.querySelectorAll('.vf-group-box__trigger')].map((node) => node.type),
        substitutes: document.querySelectorAll('.vf-group-box details, .vf-group-box summary, .vf-group-box a[href]').length,
      };
    })()`);
    check('no group box controller runs without its script', noJs.enhanced === 0, JSON.stringify(noJs));
    check(
      'without javascript a closed group box stays closed and its content is unreachable',
      noJs.closedExpanded === 'false' && noJs.closedContent === 0 && noJs.templateInert === 0,
      JSON.stringify(noJs),
    );
    check(
      'without javascript open and static group boxes show their content',
      noJs.openContent === 'Open content.' &&
        JSON.stringify(noJs.staticContent) === '["Static content.","Untitled content."]',
      JSON.stringify(noJs),
    );
    check(
      'the triggers are type=button and nothing - details, summary, link - was substituted',
      noJs.triggerTypes.every((type) => type === 'button') && noJs.substitutes === 0,
      JSON.stringify(noJs),
    );
  });

  // ------------------------------------------------ group box, ownership
  await withPage(chrome, server.origin, 'fixture-mixed.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('#vue-group-box-root'))`);
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-group-box-enhanced]'))`);
    await delay(150);
    await page.evaluate(`(() => {
      window.__vueGroupBoxRazorEvents = 0;
      document.querySelector('#vue-group-box-root').addEventListener('vf-group-box:collapsed-change', () => { window.__vueGroupBoxRazorEvents += 1; });
    })()`);
    await clickAt(page, '#vue-group-box-root .vf-group-box__trigger');
    await delay(100);
    const vue = await page.evaluate(`(() => {
      const root = document.querySelector('#vue-group-box-root');
      return {
        markedByRazor: root.hasAttribute('data-vf-razor-group-box-enhanced') || root.hasAttribute('data-vf-razor'),
        expanded: root.querySelector('.vf-group-box__trigger').getAttribute('aria-expanded'),
        content: root.querySelectorAll('.vf-group-box__content').length,
        razorEvents: window.__vueGroupBoxRazorEvents,
      };
    })()`);
    check('the Razor controller marks no Vue group box root', vue.markedByRazor === false, JSON.stringify(vue));
    check(
      'the Vue group box toggles through its own handler and receives no Razor event',
      vue.expanded === 'false' && vue.content === 0 && vue.razorEvents === 0,
      JSON.stringify(vue),
    );
  });

  // ------------------------------------------------------------- stepper
  //
  // The M23 sections: one root per case enhanced by its marker, a real click
  // that moves every half of the state and dispatches one event, Enter and
  // Space that reach the click handler through native activation (one click
  // each), the six navigation keys with their axis, wrapping and disabled
  // skipping, focus that stays inside the root even when a sibling shares
  // the value, a consumer button beside the stepper that is left alone, and
  // an unowned copy that is not mounted.
  await withPage(chrome, server.origin, 'fixture-enhanced.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-stepper-enhanced]'))`);
    const logged = await page.evaluate(installStepperLog);
    check('the stepper event log covers every stepper on the page', logged === 7, `logged ${logged}`);

    const roots = await page.evaluate(`({
      owned: document.querySelectorAll('[data-vf-razor="stepper"]').length,
      enhanced: document.querySelectorAll('[data-vf-razor="stepper"][data-vf-razor-stepper-enhanced]').length,
      unowned: document.querySelectorAll('[data-case="stepper-unowned"] .vf-stepper[data-vf-razor-stepper-enhanced]').length,
      unownedRoots: document.querySelectorAll('[data-case="stepper-unowned"] .vf-stepper').length,
      triggers: document.querySelectorAll('[data-vf-razor="stepper"] button.vf-stepper__trigger').length,
    })`);
    check(
      'every Razor-owned stepper root is enhanced',
      roots.owned === 6 && roots.enhanced === 6,
      JSON.stringify(roots),
    );
    check(
      'a stepper copy without the ownership marker is not mounted',
      roots.unownedRoots === 1 && roots.unowned === 0,
      JSON.stringify(roots),
    );
    check('the owned steppers carry one native button per item', roots.triggers === 18, `triggers ${roots.triggers}`);

    // -- click: every half of the state moves, one event
    const before = await page.evaluate(readStepper('stepper-horizontal', 'Progress'));
    check(
      'a horizontal stepper starts with the first step current and factor 0',
      before.current === 'account' &&
        before.currentClass === 'account' &&
        before.factor === '0' &&
        JSON.stringify(before.states) === '["current","upcoming","upcoming"]',
      JSON.stringify(before),
    );
    await clickAt(page, '[data-case="stepper-horizontal"] .vf-stepper__item:nth-child(3) .vf-stepper__trigger');
    await delay(50);
    const clicked = await page.evaluate(readStepper('stepper-horizontal', 'Progress'));
    check(
      'a real click moves aria-current, the trigger modifier, the item classes and the factor together',
      clicked.current === 'confirm' &&
        clicked.currentClass === 'confirm' &&
        JSON.stringify(clicked.states) === '["complete","complete","current"]' &&
        clicked.factor === '1' &&
        JSON.stringify(clicked.ariaCurrentValues) === '[null,null,"step"]',
      JSON.stringify(clicked),
    );
    check(
      'every item survives the click',
      clicked.itemCount === 3 && clicked.triggerCount === 3 && clicked.count === '3',
    );
    check(
      'one click dispatches one bubbling change event with the value',
      JSON.stringify(clicked.events) === '[{"value":"confirm","bubbles":true}]',
      JSON.stringify(clicked.events),
    );
    check(
      'a click leaves focus on the clicked trigger',
      clicked.focused === 'confirm',
      JSON.stringify(clicked.focused),
    );

    // -- click on the current step: counted, suppressed
    await clickAt(page, '[data-case="stepper-horizontal"] .vf-stepper__item:nth-child(3) .vf-stepper__trigger');
    await delay(50);
    const reclicked = await page.evaluate(readStepper('stepper-horizontal', 'Progress'));
    check(
      'a click on the current step reaches the trigger and changes nothing',
      reclicked.clicks === 2 && reclicked.current === 'confirm' && reclicked.events.length === 1,
      JSON.stringify(reclicked),
    );

    // -- Enter and Space: native activation, one click each, keydown not prevented
    await page.evaluate(
      `document.querySelector('[data-case="stepper-horizontal"] .vf-stepper__item:nth-child(1) .vf-stepper__trigger').focus()`,
    );
    await pressKey(page, 'Enter');
    await delay(50);
    const afterEnter = await page.evaluate(readStepper('stepper-horizontal', 'Progress'));
    check(
      'Enter activates natively: one more click counted, the selection moves, the keydown is not prevented',
      afterEnter.clicks === 3 &&
        afterEnter.current === 'account' &&
        afterEnter.keydowns.at(-1).key === 'Enter' &&
        afterEnter.keydowns.at(-1).prevented === false,
      JSON.stringify(afterEnter),
    );
    await page.evaluate(
      `document.querySelector('[data-case="stepper-horizontal"] .vf-stepper__item:nth-child(2) .vf-stepper__trigger').focus()`,
    );
    await pressKey(page, ' ');
    await delay(50);
    const afterSpace = await page.evaluate(readStepper('stepper-horizontal', 'Progress'));
    check(
      'Space activates natively as well',
      afterSpace.clicks === 4 &&
        afterSpace.current === 'profile' &&
        afterSpace.factor === '0.5' &&
        afterSpace.keydowns.at(-1).key === ' ' &&
        afterSpace.keydowns.at(-1).prevented === false,
      JSON.stringify(afterSpace),
    );
    check(
      'the three changes are logged in order',
      JSON.stringify(afterSpace.events.map((e) => e.value)) === '["confirm","account","profile"]',
      JSON.stringify(afterSpace.events),
    );

    // -- ArrowRight/ArrowLeft, wrap, Home, End, wrong axis
    await pressKey(page, 'ArrowRight');
    await delay(50);
    const right = await page.evaluate(readStepper('stepper-horizontal', 'Progress'));
    check(
      'ArrowRight is prevented, activates the next step and focuses it, with no native click',
      right.current === 'confirm' &&
        right.focused === 'confirm' &&
        right.clicks === 4 &&
        right.keydowns.at(-1).prevented === true,
      JSON.stringify(right),
    );
    await pressKey(page, 'ArrowRight');
    await delay(50);
    const wrapped = await page.evaluate(readStepper('stepper-horizontal', 'Progress'));
    check(
      'ArrowRight from the last step wraps to the first',
      wrapped.current === 'account' && wrapped.focused === 'account',
      JSON.stringify(wrapped),
    );
    await pressKey(page, 'ArrowLeft');
    await delay(50);
    const left = await page.evaluate(readStepper('stepper-horizontal', 'Progress'));
    check(
      'ArrowLeft from the first step wraps to the last',
      left.current === 'confirm' && left.focused === 'confirm',
      JSON.stringify(left),
    );
    await pressKey(page, 'Home');
    await delay(50);
    const home = await page.evaluate(readStepper('stepper-horizontal', 'Progress'));
    check(
      'Home activates and focuses the first step',
      home.current === 'account' && home.focused === 'account' && home.keydowns.at(-1).prevented === true,
      JSON.stringify(home),
    );
    await pressKey(page, 'End');
    await delay(50);
    const end = await page.evaluate(readStepper('stepper-horizontal', 'Progress'));
    check(
      'End activates and focuses the last step',
      end.current === 'confirm' && end.focused === 'confirm' && end.keydowns.at(-1).prevented === true,
      JSON.stringify(end),
    );
    await pressKey(page, 'ArrowDown');
    await delay(50);
    const wrongAxis = await page.evaluate(readStepper('stepper-horizontal', 'Progress'));
    check(
      'ArrowDown on a horizontal stepper is ignored and not prevented',
      wrongAxis.current === 'confirm' &&
        wrongAxis.focused === 'confirm' &&
        wrongAxis.keydowns.at(-1).key === 'ArrowDown' &&
        wrongAxis.keydowns.at(-1).prevented === false &&
        wrongAxis.events.length === end.events.length,
      JSON.stringify(wrongAxis),
    );

    // -- vertical axis
    await page.evaluate(
      `document.querySelector('[data-case="stepper-vertical"] .vf-stepper__item:nth-child(2) .vf-stepper__trigger').focus()`,
    );
    await pressKey(page, 'ArrowRight');
    await pressKey(page, 'ArrowDown');
    await delay(50);
    const vertical = await page.evaluate(readStepper('stepper-vertical', 'Progress'));
    check(
      'a vertical stepper ignores ArrowRight and navigates on ArrowDown',
      vertical.current === 'confirm' &&
        vertical.focused === 'confirm' &&
        vertical.keydowns[0].prevented === false &&
        vertical.keydowns[1].prevented === true &&
        vertical.events.length === 1,
      JSON.stringify(vertical),
    );
    await pressKey(page, 'ArrowUp');
    await pressKey(page, 'ArrowUp');
    await delay(50);
    const up = await page.evaluate(readStepper('stepper-vertical', 'Progress'));
    check(
      'ArrowUp twice goes back through the middle to the first step',
      up.current === 'account' && up.focused === 'account',
      JSON.stringify(up),
    );

    // -- disabled: skipped by keys, no focus, no click
    await page.evaluate(
      `document.querySelector('[data-case="stepper-disabled"] .vf-stepper__item:nth-child(1) .vf-stepper__trigger').focus()`,
    );
    await pressKey(page, 'ArrowRight');
    await delay(50);
    const skipped = await page.evaluate(readStepper('stepper-disabled', 'Progress'));
    check(
      'ArrowRight skips the disabled middle step',
      skipped.current === 'confirm' &&
        skipped.focused === 'confirm' &&
        JSON.stringify(skipped.states) === '["complete","disabled","current"]',
      JSON.stringify(skipped),
    );
    await page.evaluate(
      `document.querySelector('[data-case="stepper-disabled"] .vf-stepper__item:nth-child(2) .vf-stepper__trigger').focus()`,
    );
    const disabledPoint = await page.evaluate(`(() => {
      const element = document.querySelector('[data-case="stepper-disabled"] .vf-stepper__item:nth-child(2) .vf-stepper__trigger');
      element.scrollIntoView({ block: 'center' });
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...disabledPoint });
    await page.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      ...disabledPoint,
      button: 'left',
      clickCount: 1,
    });
    await page.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      ...disabledPoint,
      button: 'left',
      clickCount: 1,
    });
    await page.evaluate(
      `document.querySelector('[data-case="stepper-disabled"] .vf-stepper__item:nth-child(2) .vf-stepper__trigger').dispatchEvent(new MouseEvent('click', { bubbles: true }))`,
    );
    await delay(50);
    const disabled = await page.evaluate(readStepper('stepper-disabled', 'Progress'));
    check(
      'a disabled trigger takes no focus and a real or synthetic click on it selects nothing',
      disabled.current === 'confirm' && disabled.focused !== 'profile' && disabled.events.length === 1,
      JSON.stringify(disabled),
    );

    // -- siblings sharing values: state and focus stay in their own root
    await page.evaluate(
      `document.querySelector('[data-case="stepper-siblings"] .vf-stepper:last-of-type .vf-stepper__item:nth-child(1) .vf-stepper__trigger').focus()`,
    );
    await pressKey(page, 'ArrowRight');
    await delay(50);
    const firstSibling = await page.evaluate(readStepper('stepper-siblings', 'First'));
    const secondSibling = await page.evaluate(readStepper('stepper-siblings', 'Second'));
    check(
      'ArrowRight in the second sibling changes the second sibling only',
      secondSibling.current === 'profile' &&
        secondSibling.events.length === 1 &&
        firstSibling.current === 'account' &&
        firstSibling.events.length === 0,
      JSON.stringify({ firstSibling, secondSibling }),
    );
    check(
      'the Razor controller focuses within its own root although the first sibling shares the value - the historical document-wide lookup is not reproduced',
      secondSibling.focused === 'profile' && firstSibling.focused === null,
      JSON.stringify({ firstFocused: firstSibling.focused, secondFocused: secondSibling.focused }),
    );

    // -- a consumer button beside the stepper is the consumer's
    const consumerBefore = await page.evaluate(`(() => {
      const button = document.querySelector('#stepper-continue');
      window.__continueClicks = 0;
      button.addEventListener('click', () => { window.__continueClicks += 1; });
      return { classed: button.classList.contains('vf-stepper__trigger'), buttons: document.querySelectorAll('[data-case="stepper-consumer"] button').length };
    })()`);
    await clickAt(page, '#stepper-continue');
    await delay(50);
    const consumer = await page.evaluate(readStepper('stepper-consumer', 'Progress'));
    const continueClicks = await page.evaluate('window.__continueClicks');
    check(
      'clicking the consumer button beside the stepper reaches the consumer and selects nothing',
      consumerBefore.classed === false &&
        consumerBefore.buttons === 4 &&
        continueClicks === 1 &&
        consumer.current === 'profile' &&
        consumer.events.length === 0,
      JSON.stringify({ consumerBefore, continueClicks, consumer }),
    );

    check(
      'the stepper page produced no script errors',
      page.diagnostics.pageErrors.length === 0,
      page.diagnostics.pageErrors.join('; '),
    );
  });

  // -------------------------------------------------------- stepper, no-js
  await withPage(chrome, server.origin, 'fixture-no-js.html', async (page) => {
    const noJs = await page.evaluate(`(() => {
      const trigger = document.querySelector('[data-case="stepper-horizontal"] .vf-stepper__item:nth-child(2) .vf-stepper__trigger');
      const before = document.querySelector('[data-case="stepper-horizontal"] [aria-current="step"]').dataset.vfStepperValue;
      trigger.click();
      return {
        enhanced: document.querySelectorAll('[data-vf-razor-stepper-enhanced]').length,
        currentBefore: before,
        currentAfterClick: document.querySelector('[data-case="stepper-horizontal"] [aria-current="step"]').dataset.vfStepperValue,
        states: [...document.querySelectorAll('[data-case="stepper-vertical"] .vf-stepper__item')].map((item) => [...item.classList].find((c) => c.startsWith('vf-stepper__item--')).slice(18)),
        disabledTrigger: document.querySelector('[data-case="stepper-disabled"] .vf-stepper__item:nth-child(2) .vf-stepper__trigger').disabled,
        triggerType: trigger.type,
        triggers: document.querySelectorAll('[data-vf-razor="stepper"] button.vf-stepper__trigger').length,
        links: document.querySelectorAll('[data-vf-razor="stepper"] a, [data-vf-razor="stepper"] form').length,
      };
    })()`);
    check('no stepper controller runs without its script', noJs.enhanced === 0, JSON.stringify(noJs));
    check(
      'the initial selection, classes and disabled state are truthful without javascript',
      noJs.currentBefore === 'account' &&
        JSON.stringify(noJs.states) === '["complete","current","upcoming"]' &&
        noJs.disabledTrigger === true,
      JSON.stringify(noJs),
    );
    check(
      'a click changes no selection without javascript - the documented limitation, not a lie',
      noJs.currentAfterClick === 'account',
    );
    check(
      'the triggers are type=button that submit nothing, and no link or form was substituted',
      noJs.triggerType === 'button' && noJs.links === 0 && noJs.triggers === 18,
      JSON.stringify(noJs),
    );
  });

  // ---------------------------------------------------- stepper, ownership
  await withPage(chrome, server.origin, 'fixture-mixed.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('#vue-stepper-root'))`);
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-stepper-enhanced]'))`);
    await delay(150);
    await page.evaluate(`(() => {
      window.__vueStepperRazorEvents = 0;
      document.querySelector('#vue-stepper-root').addEventListener('vf-stepper:change', () => { window.__vueStepperRazorEvents += 1; });
    })()`);
    await clickAt(page, '#vue-stepper-root .vf-stepper__item:nth-child(2) .vf-stepper__trigger');
    await delay(100);
    const vue = await page.evaluate(`(() => {
      const root = document.querySelector('#vue-stepper-root');
      return {
        markedByRazor: root.hasAttribute('data-vf-razor-stepper-enhanced') || root.hasAttribute('data-vf-razor'),
        current: root.querySelector('[aria-current="step"]')?.dataset.vfStepperValue ?? null,
        razorEvents: window.__vueStepperRazorEvents,
      };
    })()`);
    check('the Razor controller marks no Vue stepper root', vue.markedByRazor === false, JSON.stringify(vue));
    check(
      'the Vue stepper selects through its own handler and receives no Razor event',
      vue.current === 'profile' && vue.razorEvents === 0,
      JSON.stringify(vue),
    );
  });

  // ------------------------------------------ stepper, double bootstrap
  await withPage(chrome, server.origin, 'fixture-enhanced.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-stepper-enhanced]'))`);
    await page.evaluate(installStepperLog);
    await page.evaluate(`import('./vueforge-razor.js?bootstrap=stepper').then(() => true)`);
    await delay(250);
    await clickAt(page, '[data-case="stepper-horizontal"] .vf-stepper__item:nth-child(2) .vf-stepper__trigger');
    await delay(50);
    const twice = await page.evaluate(readStepper('stepper-horizontal', 'Progress'));
    check(
      'after a second bootstrap one click is one selection: profile current, one event',
      twice.current === 'profile' && twice.events.length === 1 && twice.clicks === 1,
      JSON.stringify(twice),
    );
    const markers = await page.evaluate(`document.querySelectorAll('[data-vf-razor-stepper-enhanced]').length`);
    check('a second bootstrap adds no stepper ownership marker', markers === 6, `markers ${markers}`);
  });

  // ---------------------------------------------------------------- tabs
  //
  // The M24 sections: one root per case enhanced by its marker, readiness in
  // two frames, a real click that moves every half of the state - the
  // selection projection, the one panel, the measured indicator - and
  // dispatches one event, a click on the current tab that notifies again,
  // Enter and Space that reach the click handler through native activation
  // (one click each), the six navigation keys with their wrapping and
  // disabled skipping from the tab that received the key, native Tab that
  // lands on the panel, the scroller of an overflowing list with its
  // buttons, fades and 140 ms scrolling state, siblings sharing values whose
  // state and focus stay in their own root, a consumer button inside the
  // panel that is left alone, a controlled unknown value, and an unowned
  // copy that is not mounted.
  await withPage(chrome, server.origin, 'fixture-enhanced.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-tabs-enhanced]'))`);
    await page.waitFor(
      `document.querySelector('[data-case="tabs-default"] .vf-tabs').classList.contains('vf-tabs--scroll-controls-animated')`,
    );
    const logged = await page.evaluate(installTabsLog);
    check('the tabs event log covers every tabs on the page', logged === 8, `logged ${logged}`);

    const roots = await page.evaluate(`({
      owned: document.querySelectorAll('[data-vf-razor="tabs"]').length,
      enhanced: document.querySelectorAll('[data-vf-razor="tabs"][data-vf-razor-tabs-enhanced]').length,
      unowned: document.querySelectorAll('[data-case="tabs-unowned"] .vf-tabs[data-vf-razor-tabs-enhanced]').length,
      unownedRoots: document.querySelectorAll('[data-case="tabs-unowned"] .vf-tabs').length,
      unownedReady: document.querySelectorAll('[data-case="tabs-unowned"] .vf-tabs--scroll-controls-ready').length,
      tabs: document.querySelectorAll('[data-vf-razor="tabs"] [role="tablist"] > button.vf-tabs__tab[role="tab"]').length,
      scrollButtons: document.querySelectorAll('[data-vf-razor="tabs"] button.vf-tabs__scroll-button').length,
      panels: document.querySelectorAll('[data-vf-razor="tabs"] > .vf-tabs__panel').length,
    })`);
    check('every Razor-owned tabs root is enhanced', roots.owned === 7 && roots.enhanced === 7, JSON.stringify(roots));
    check(
      'a tabs copy without the ownership marker is not mounted and never becomes ready',
      roots.unownedRoots === 1 && roots.unowned === 0 && roots.unownedReady === 0,
      JSON.stringify(roots),
    );
    check(
      'the owned tabs carry one native button[role=tab] per item, two scroll buttons each, and one panel where a panel slot and a selection exist',
      roots.tabs === 25 && roots.scrollButtons === 14 && roots.panels === 5,
      JSON.stringify(roots),
    );

    // -- readiness and the initial measurement
    const before = await page.evaluate(readTabs('tabs-default', 'Default'));
    check(
      'a tabs starts with the first tab selected and tabbable, its panel labelled and named by it, ready and animated',
      JSON.stringify(before.selected) === '["overview"]' &&
        JSON.stringify(before.tabindexes) === '["0","-1","-1"]' &&
        JSON.stringify(before.roles) === '["tab","tab","tab"]' &&
        before.panels === 1 &&
        before.panelText === 'Panel for overview' &&
        before.panelLabelledBySelected === true &&
        before.panelIdMatchesControls === true &&
        before.templates === 3 &&
        before.ready === true &&
        before.animated === true &&
        before.indicator.ready === true,
      JSON.stringify(before),
    );
    check(
      'the indicator is measured to the fraction of a pixel under the first tab, and nothing overflows',
      before.indicator.opacity === '1' &&
        before.indicator.transform === 'translateX(0px)' &&
        /^\d+\.\d+px$/.test(before.indicator.width) &&
        before.canScrollLeft === false &&
        before.canScrollRight === false &&
        before.left.hidden === true &&
        before.right.hidden === true &&
        before.left.disabled === true &&
        before.left.tabindex === '-1' &&
        before.left.ariaHidden === 'true' &&
        before.fades.length === 0,
      JSON.stringify(before),
    );

    // -- click: every half of the state moves, one event
    await clickAt(page, '[data-case="tabs-default"] [role="tablist"] > .vf-tabs__tab:nth-child(2)');
    await delay(50);
    const clicked = await page.evaluate(readTabs('tabs-default', 'Default'));
    check(
      'a real click moves aria-selected, the roving tabindex, the one panel and the indicator together',
      JSON.stringify(clicked.selected) === '["settings"]' &&
        JSON.stringify(clicked.tabindexes) === '["-1","0","-1"]' &&
        clicked.panels === 1 &&
        clicked.panelText === 'Panel for settings' &&
        clicked.panelLabelledBySelected === true &&
        clicked.panelIdMatchesControls === true &&
        clicked.indicator.opacity === '1' &&
        /^translateX\(\d+\.\d+px\)$/.test(clicked.indicator.transform) &&
        clicked.indicator.transform !== before.indicator.transform,
      JSON.stringify(clicked),
    );
    check(
      'every tab and the templates survive the click',
      clicked.tabCount === 3 && clicked.templates === 3,
      JSON.stringify(clicked),
    );
    check(
      'one click dispatches one bubbling change event with the value, and leaves focus on the clicked tab',
      JSON.stringify(clicked.events) === '[{"value":"settings","bubbles":true}]' && clicked.focused === 'settings',
      JSON.stringify(clicked),
    );

    // -- click on the current tab: counted and notified again
    await clickAt(page, '[data-case="tabs-default"] [role="tablist"] > .vf-tabs__tab:nth-child(2)');
    await delay(50);
    const reclicked = await page.evaluate(readTabs('tabs-default', 'Default'));
    check(
      'a click on the current tab reaches the tab, changes nothing and notifies again',
      reclicked.clicks === 2 &&
        JSON.stringify(reclicked.selected) === '["settings"]' &&
        JSON.stringify(reclicked.events.map((e) => e.value)) === '["settings","settings"]',
      JSON.stringify(reclicked),
    );

    // -- Enter and Space: native activation, one click each, keydown not prevented
    await page.evaluate(
      `document.querySelector('[data-case="tabs-default"] [role="tablist"] > .vf-tabs__tab:nth-child(3)').focus()`,
    );
    await pressKey(page, 'Enter');
    await delay(50);
    const afterEnter = await page.evaluate(readTabs('tabs-default', 'Default'));
    check(
      'Enter activates natively: one more click counted, the selection moves, the keydown is not prevented',
      afterEnter.clicks === 3 &&
        JSON.stringify(afterEnter.selected) === '["billing"]' &&
        afterEnter.keydowns.at(-1).key === 'Enter' &&
        afterEnter.keydowns.at(-1).prevented === false,
      JSON.stringify(afterEnter),
    );
    await page.evaluate(
      `document.querySelector('[data-case="tabs-default"] [role="tablist"] > .vf-tabs__tab:nth-child(1)').focus()`,
    );
    await pressKey(page, ' ');
    await delay(50);
    const afterSpace = await page.evaluate(readTabs('tabs-default', 'Default'));
    check(
      'Space activates natively as well',
      afterSpace.clicks === 4 &&
        JSON.stringify(afterSpace.selected) === '["overview"]' &&
        afterSpace.keydowns.at(-1).key === ' ' &&
        afterSpace.keydowns.at(-1).prevented === false,
      JSON.stringify(afterSpace),
    );

    // -- the six navigation keys, from the focused tab, wrapping
    await pressKey(page, 'ArrowRight');
    await delay(50);
    const right = await page.evaluate(readTabs('tabs-default', 'Default'));
    check(
      'ArrowRight is prevented, selects the next tab and focuses it, with no native click',
      JSON.stringify(right.selected) === '["settings"]' &&
        right.focused === 'settings' &&
        right.clicks === 4 &&
        right.keydowns.at(-1).prevented === true,
      JSON.stringify(right),
    );
    await pressKey(page, 'ArrowDown');
    await delay(50);
    const down = await page.evaluate(readTabs('tabs-default', 'Default'));
    check(
      'ArrowDown moves forward on the horizontal tablist, prevented',
      JSON.stringify(down.selected) === '["billing"]' &&
        down.focused === 'billing' &&
        down.keydowns.at(-1).prevented === true,
      JSON.stringify(down),
    );
    await pressKey(page, 'ArrowRight');
    await delay(50);
    const wrapped = await page.evaluate(readTabs('tabs-default', 'Default'));
    check(
      'ArrowRight from the last tab wraps to the first',
      JSON.stringify(wrapped.selected) === '["overview"]' && wrapped.focused === 'overview',
      JSON.stringify(wrapped),
    );
    await pressKey(page, 'ArrowUp');
    await delay(50);
    const up = await page.evaluate(readTabs('tabs-default', 'Default'));
    check(
      'ArrowUp from the first tab wraps backward to the last',
      JSON.stringify(up.selected) === '["billing"]' && up.focused === 'billing',
      JSON.stringify(up),
    );
    await pressKey(page, 'ArrowLeft');
    await delay(50);
    const left = await page.evaluate(readTabs('tabs-default', 'Default'));
    check(
      'ArrowLeft goes to the previous tab',
      JSON.stringify(left.selected) === '["settings"]' && left.focused === 'settings',
      JSON.stringify(left),
    );
    await pressKey(page, 'End');
    await delay(50);
    const end = await page.evaluate(readTabs('tabs-default', 'Default'));
    check(
      'End selects and focuses the last tab',
      JSON.stringify(end.selected) === '["billing"]' &&
        end.focused === 'billing' &&
        end.keydowns.at(-1).prevented === true,
      JSON.stringify(end),
    );
    await pressKey(page, 'Home');
    await delay(50);
    const home = await page.evaluate(readTabs('tabs-default', 'Default'));
    check(
      'Home selects and focuses the first tab',
      JSON.stringify(home.selected) === '["overview"]' &&
        home.focused === 'overview' &&
        home.keydowns.at(-1).prevented === true,
      JSON.stringify(home),
    );
    check(
      'the eight changes are logged in order and the panel followed each',
      JSON.stringify(home.events.map((e) => e.value)) ===
        '["settings","settings","billing","overview","settings","billing","overview","billing","settings","billing","overview"]' &&
        home.panelText === 'Panel for overview' &&
        home.panels === 1,
      JSON.stringify(home.events),
    );

    // -- navigation starts from the focused tab, not the selected one
    await page.evaluate(
      `document.querySelector('[data-case="tabs-default"] [role="tablist"] > .vf-tabs__tab:nth-child(3)').focus()`,
    );
    const focusedOnly = await page.evaluate(readTabs('tabs-default', 'Default'));
    await pressKey(page, 'ArrowLeft');
    await delay(50);
    const fromFocused = await page.evaluate(readTabs('tabs-default', 'Default'));
    check(
      'focus alone selects nothing, and ArrowLeft from the focused last tab lands on the middle one',
      JSON.stringify(focusedOnly.selected) === '["overview"]' &&
        focusedOnly.focused === 'billing' &&
        JSON.stringify(fromFocused.selected) === '["settings"]' &&
        fromFocused.focused === 'settings',
      JSON.stringify({ focusedOnly, fromFocused }),
    );

    // -- native Tab lands on the panel
    await pressKey(page, 'Tab');
    await delay(50);
    const tabbed = await page.evaluate(readTabs('tabs-default', 'Default'));
    check(
      'Tab is unhandled and native focus lands on the panel',
      tabbed.focused === 'panel' &&
        tabbed.keydowns.at(-1).key === 'Tab' &&
        tabbed.keydowns.at(-1).prevented === false &&
        JSON.stringify(tabbed.selected) === '["settings"]',
      JSON.stringify(tabbed),
    );

    // -- disabled: skipped by keys, no focus, no click
    await page.evaluate(
      `document.querySelector('[data-case="tabs-disabled"] [role="tablist"] > .vf-tabs__tab:nth-child(1)').focus()`,
    );
    await pressKey(page, 'ArrowRight');
    await delay(50);
    const skipped = await page.evaluate(readTabs('tabs-disabled', 'Disabled'));
    check(
      'ArrowRight skips the disabled middle tab',
      JSON.stringify(skipped.selected) === '["billing"]' && skipped.focused === 'billing',
      JSON.stringify(skipped),
    );
    await page.evaluate(
      `document.querySelector('[data-case="tabs-disabled"] [role="tablist"] > .vf-tabs__tab:nth-child(2)').focus()`,
    );
    const disabledPoint = await page.evaluate(`(() => {
      const element = document.querySelector('[data-case="tabs-disabled"] [role="tablist"] > .vf-tabs__tab:nth-child(2)');
      element.scrollIntoView({ block: 'center' });
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...disabledPoint });
    await page.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      ...disabledPoint,
      button: 'left',
      clickCount: 1,
    });
    await page.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      ...disabledPoint,
      button: 'left',
      clickCount: 1,
    });
    await page.evaluate(
      `document.querySelector('[data-case="tabs-disabled"] [role="tablist"] > .vf-tabs__tab:nth-child(2)').dispatchEvent(new MouseEvent('click', { bubbles: true }))`,
    );
    await delay(50);
    const disabled = await page.evaluate(readTabs('tabs-disabled', 'Disabled'));
    check(
      'a disabled tab takes no focus and a real or synthetic click on it selects nothing',
      JSON.stringify(disabled.selected) === '["billing"]' &&
        disabled.focused !== 'settings' &&
        disabled.events.length === 1,
      JSON.stringify(disabled),
    );

    // -- the scroller: overflow, buttons, fades, the scrolling state, the clipped indicator
    const overflow = await page.evaluate(readTabs('tabs-overflow', 'Overflow'));
    check(
      'an overflowing list shows the right button and fade, hides the left one, and the indicator is unclipped',
      overflow.canScrollLeft === false &&
        overflow.canScrollRight === true &&
        overflow.left.hidden === true &&
        overflow.right.hidden === false &&
        overflow.right.ariaHidden === 'false' &&
        overflow.right.tabindex === '0' &&
        overflow.right.disabled === false &&
        JSON.stringify(overflow.fades) === '["right"]' &&
        overflow.scrollLeft === 0 &&
        overflow.indicator.opacity === '1' &&
        overflow.panels === 0,
      JSON.stringify(overflow),
    );
    await clickAt(page, '[data-case="tabs-overflow"] .vf-tabs__scroll-button--right');
    // The scroll event fires on the next frame; the scrolling state lasts
    // 140 ms from there.
    await delay(30);
    const midScroll = await page.evaluate(readTabs('tabs-overflow', 'Overflow'));
    await delay(250);
    const scrolled = await page.evaluate(readTabs('tabs-overflow', 'Overflow'));
    check(
      'a click on the right button scrolls by max(120, round(0.6 * width)) and marks 140 ms of scrolling, which then ends',
      midScroll.scrollLeft === 216 &&
        midScroll.scrollbarWidth === 'thin' &&
        midScroll.indicator.noTransition === true &&
        scrolled.scrollLeft === 216 &&
        scrolled.scrollbarWidth === 'none' &&
        scrolled.indicator.noTransition === false,
      JSON.stringify({ midScroll, scrolled }),
    );
    check(
      'in the middle both buttons and both fades show, and the selected first tab is hidden under the left button',
      scrolled.canScrollLeft === true &&
        scrolled.canScrollRight === true &&
        scrolled.left.hidden === false &&
        scrolled.right.hidden === false &&
        JSON.stringify(scrolled.fades) === '["left","right"]' &&
        scrolled.indicator.opacity === '0' &&
        scrolled.indicator.transform === 'translateX(28px)' &&
        scrolled.indicator.width === '0px',
      JSON.stringify(scrolled),
    );
    await clickAt(page, '[data-case="tabs-overflow"] .vf-tabs__scroll-button--left');
    await delay(250);
    const back = await page.evaluate(readTabs('tabs-overflow', 'Overflow'));
    check(
      'the left button scrolls back to the start and the state returns to the initial one',
      back.scrollLeft === 0 &&
        back.canScrollLeft === false &&
        back.canScrollRight === true &&
        JSON.stringify(back.fades) === '["right"]' &&
        back.indicator.opacity === '1' &&
        back.indicator.transform === 'translateX(0px)' &&
        back.events.length === 0,
      JSON.stringify(back),
    );

    // -- resize: the indicator and the scroll state are re-measured
    await page.evaluate(
      `(() => { const section = document.querySelector('[data-case="tabs-overflow"]'); section.style.width = '900px'; section.style.maxWidth = 'none'; })()`,
    );
    await delay(100);
    const widened = await page.evaluate(readTabs('tabs-overflow', 'Overflow'));
    check(
      'widening the case through the ResizeObserver removes the overflow: no buttons, no fades, the indicator unclipped',
      widened.canScrollRight === false &&
        widened.right.hidden === true &&
        widened.fades.length === 0 &&
        widened.indicator.opacity === '1',
      JSON.stringify(widened),
    );
    await page.evaluate(
      `(() => { const section = document.querySelector('[data-case="tabs-overflow"]'); section.style.width = ''; section.style.maxWidth = ''; })()`,
    );
    await delay(100);

    // -- siblings sharing values: state and focus stay in their own root
    await page.evaluate(
      `document.querySelector('[data-case="tabs-siblings"] .vf-tabs:last-of-type [role="tablist"] > .vf-tabs__tab:nth-child(1)').focus()`,
    );
    await pressKey(page, 'ArrowRight');
    await delay(50);
    const firstSibling = await page.evaluate(readTabs('tabs-siblings', 'First'));
    const secondSibling = await page.evaluate(readTabs('tabs-siblings', 'Second'));
    check(
      'ArrowRight in the second sibling changes the second sibling only, its panel included',
      JSON.stringify(secondSibling.selected) === '["settings"]' &&
        secondSibling.panelText === 'Panel for settings' &&
        secondSibling.events.length === 1 &&
        JSON.stringify(firstSibling.selected) === '["overview"]' &&
        firstSibling.panelText === 'Panel for overview' &&
        firstSibling.events.length === 0,
      JSON.stringify({ firstSibling, secondSibling }),
    );
    check(
      'the Razor controller focuses within its own root although the first sibling shares the value',
      secondSibling.focused === 'settings' && firstSibling.focused === null,
      JSON.stringify({ firstFocused: firstSibling.focused, secondFocused: secondSibling.focused }),
    );
    const siblingIds = await page.evaluate(`(() => {
      const ids = [...document.querySelectorAll('[data-case="tabs-siblings"] [id]')].map((e) => e.id);
      return { ids: ids.length, unique: new Set(ids).size };
    })()`);
    check(
      'two siblings sharing values keep distinct ids',
      siblingIds.ids === siblingIds.unique && siblingIds.ids === 8,
      JSON.stringify(siblingIds),
    );

    // -- a consumer button inside the panel is the consumer's
    const consumerBefore = await page.evaluate(`(() => {
      const button = document.querySelector('[data-case="tabs-consumer"] .vf-tabs__panel .tabs-panel-control');
      window.__saveClicks = 0;
      button.addEventListener('click', () => { window.__saveClicks += 1; });
      return { classed: button.classList.contains('vf-tabs__tab'), role: button.getAttribute('role') };
    })()`);
    await clickAt(page, '[data-case="tabs-consumer"] .vf-tabs__panel .tabs-panel-control');
    await delay(50);
    const consumer = await page.evaluate(readTabs('tabs-consumer', 'Consumer'));
    const saveClicks = await page.evaluate('window.__saveClicks');
    check(
      'clicking the consumer button inside the panel reaches the consumer and selects nothing',
      consumerBefore.classed === false &&
        consumerBefore.role === null &&
        saveClicks === 1 &&
        JSON.stringify(consumer.selected) === '["overview"]' &&
        consumer.events.length === 0,
      JSON.stringify({ consumerBefore, saveClicks, consumer }),
    );

    // -- an unknown controlled value: nothing selected, the first click selects
    const unknown = await page.evaluate(readTabs('tabs-unknown', 'Unknown'));
    check(
      'an unknown value selects nothing: no aria-selected, every tabindex -1, no panel, the indicator hidden',
      unknown.selected.length === 0 &&
        JSON.stringify(unknown.tabindexes) === '["-1","-1","-1"]' &&
        unknown.panels === 0 &&
        unknown.templates === 3 &&
        unknown.indicator.opacity === '0',
      JSON.stringify(unknown),
    );
    await clickAt(page, '[data-case="tabs-unknown"] [role="tablist"] > .vf-tabs__tab:nth-child(3)');
    await delay(50);
    const nowSelected = await page.evaluate(readTabs('tabs-unknown', 'Unknown'));
    check(
      'the first click on it creates the one panel from the inert template and selects the tab',
      JSON.stringify(nowSelected.selected) === '["billing"]' &&
        nowSelected.panels === 1 &&
        nowSelected.panelText === 'Panel for billing' &&
        nowSelected.panelLabelledBySelected === true &&
        nowSelected.indicator.opacity === '1',
      JSON.stringify(nowSelected),
    );

    check(
      'the tabs page produced no script errors',
      page.diagnostics.pageErrors.length === 0,
      page.diagnostics.pageErrors.join('; '),
    );
  });

  // ----------------------------------------------------------- tabs, no-js
  await withPage(chrome, server.origin, 'fixture-no-js.html', async (page) => {
    const noJs = await page.evaluate(`(() => {
      const tab = document.querySelector('[data-case="tabs-default"] [role="tablist"] > .vf-tabs__tab:nth-child(2)');
      const selectedBefore = document.querySelector('[data-case="tabs-default"] [role="tab"][aria-selected="true"]').textContent.trim();
      tab.click();
      const root = document.querySelector('[data-case="tabs-default"] .vf-tabs');
      return {
        enhanced: document.querySelectorAll('[data-vf-razor-tabs-enhanced]').length,
        selectedBefore,
        selectedAfterClick: document.querySelector('[data-case="tabs-default"] [role="tab"][aria-selected="true"]').textContent.trim(),
        panels: root.querySelectorAll('.vf-tabs__panel').length,
        panelText: root.querySelector('.vf-tabs__panel').textContent.trim(),
        templatesInert: [...root.querySelectorAll('template[data-vf-razor-tabs-panel]')].every((t) => t.getClientRects().length === 0),
        ready: root.className,
        indicator: root.querySelector('.vf-tabs__indicator').getAttribute('style'),
        buttonsHidden: [...root.querySelectorAll('.vf-tabs__scroll-button')].every((b) => b.disabled && b.getAttribute('aria-hidden') === 'true' && b.getAttribute('tabindex') === '-1'),
        overflowButtonsHidden: [...document.querySelectorAll('[data-case="tabs-overflow"] .vf-tabs__scroll-button')].every((b) => b.disabled),
        disabledTab: document.querySelector('[data-case="tabs-disabled"] [role="tablist"] > .vf-tabs__tab:nth-child(2)').disabled,
        tabType: tab.type,
        tabs: document.querySelectorAll('[data-vf-razor="tabs"] button.vf-tabs__tab[role="tab"]').length,
        links: document.querySelectorAll('[data-vf-razor="tabs"] a, [data-vf-razor="tabs"] form').length,
      };
    })()`);
    check('no tabs controller runs without its script', noJs.enhanced === 0, JSON.stringify(noJs));
    check(
      'the initial selection, the one panel and the disabled state are truthful without javascript',
      noJs.selectedBefore === 'Overview' &&
        noJs.panels === 1 &&
        noJs.panelText === 'Panel for overview' &&
        noJs.templatesInert === true &&
        noJs.disabledTab === true,
      JSON.stringify(noJs),
    );
    check(
      'nothing pretends to be measured without javascript: no readiness, the indicator at its seed, every scroll button hidden even on the overflow',
      noJs.ready === 'vf-tabs' &&
        noJs.indicator === 'opacity:0;transform:translateX(0);width:0;' &&
        noJs.buttonsHidden === true &&
        noJs.overflowButtonsHidden === true,
      JSON.stringify(noJs),
    );
    check(
      'a click changes no selection without javascript - the documented limitation, not a lie',
      noJs.selectedAfterClick === 'Overview',
    );
    check(
      'the tabs are type=button that submit nothing, and no link or form was substituted',
      noJs.tabType === 'button' && noJs.links === 0 && noJs.tabs === 25,
      JSON.stringify(noJs),
    );
  });

  // ------------------------------------------------------- tabs, ownership
  await withPage(chrome, server.origin, 'fixture-mixed.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('#vue-tabs-root'))`);
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-tabs-enhanced]'))`);
    await delay(150);
    await page.evaluate(`(() => {
      window.__vueTabsRazorEvents = 0;
      document.querySelector('#vue-tabs-root').addEventListener('vf-tabs:change', () => { window.__vueTabsRazorEvents += 1; });
    })()`);
    await clickAt(page, '#vue-tabs-root [role="tablist"] > .vf-tabs__tab:nth-child(2)');
    await delay(100);
    const vue = await page.evaluate(`(() => {
      const root = document.querySelector('#vue-tabs-root');
      return {
        markedByRazor: root.hasAttribute('data-vf-razor-tabs-enhanced') || root.hasAttribute('data-vf-razor'),
        selected: root.querySelector('[role="tab"][aria-selected="true"]')?.textContent.trim() ?? null,
        panelText: root.querySelector('.vf-tabs__panel')?.textContent.trim() ?? null,
        templates: root.querySelectorAll('template').length,
        razorEvents: window.__vueTabsRazorEvents,
      };
    })()`);
    check('the Razor controller marks no Vue tabs root', vue.markedByRazor === false, JSON.stringify(vue));
    check(
      'the Vue tabs select through their own handler, with no template and no Razor event',
      vue.selected === 'Settings' &&
        vue.panelText === 'Vue panel settings' &&
        vue.templates === 0 &&
        vue.razorEvents === 0,
      JSON.stringify(vue),
    );
  });

  // ------------------------------------------------ tabs, double bootstrap
  await withPage(chrome, server.origin, 'fixture-enhanced.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-tabs-enhanced]'))`);
    await page.evaluate(installTabsLog);
    await page.evaluate(`import('./vueforge-razor.js?bootstrap=tabs').then(() => true)`);
    await delay(250);
    await clickAt(page, '[data-case="tabs-default"] [role="tablist"] > .vf-tabs__tab:nth-child(2)');
    await delay(50);
    const twice = await page.evaluate(readTabs('tabs-default', 'Default'));
    check(
      'after a second bootstrap one click is one selection: settings selected, one event, one panel',
      JSON.stringify(twice.selected) === '["settings"]' &&
        twice.events.length === 1 &&
        twice.clicks === 1 &&
        twice.panels === 1,
      JSON.stringify(twice),
    );
    const markers = await page.evaluate(`document.querySelectorAll('[data-vf-razor-tabs-enhanced]').length`);
    check('a second bootstrap adds no tabs ownership marker', markers === 7, `markers ${markers}`);
  });

  // ------------------------------------------------------ accordion, no-js
  await withPage(chrome, server.origin, 'fixture-no-js.html', async (page) => {
    const noJs = await page.evaluate(`(() => {
      const closedTrigger = document.querySelector('[data-case="accordion-closed"] .vf-accordion__trigger');
      const before = closedTrigger.getAttribute('aria-expanded');
      closedTrigger.click();
      return {
        enhanced: document.querySelectorAll('[data-vf-razor-accordion-enhanced]').length,
        closedBefore: before,
        closedAfterClick: closedTrigger.getAttribute('aria-expanded'),
        closedPanels: document.querySelectorAll('[data-case="accordion-closed"] .vf-accordion__content').length,
        closedContentVisible: document.body.innerText.includes('Closed content.'),
        templateInert: document.querySelector('[data-case="accordion-closed"] template[data-vf-razor-accordion="content"]')?.getClientRects().length === 0,
        openExpanded: document.querySelector('[data-case="accordion-open"] .vf-accordion__trigger').getAttribute('aria-expanded'),
        openContentVisible: document.body.innerText.includes('Open content.'),
        openRegion: document.querySelectorAll('[data-case="accordion-open"] [role="region"]').length,
        disabledTrigger: document.querySelector('[data-case="accordion-disabled"] .vf-accordion__trigger').disabled,
        triggerType: closedTrigger.type,
        triggers: document.querySelectorAll('[data-vf-razor="accordion"] > button.vf-accordion__trigger').length,
      };
    })()`);
    check(
      'no accordion controller runs without its script',
      noJs.enhancedRoots === undefined && noJs.enhanced === 0,
      JSON.stringify(noJs),
    );
    check(
      'the closed state is truthful without javascript: aria-expanded=false, no panel, content unreachable',
      noJs.closedBefore === 'false' &&
        noJs.closedPanels === 0 &&
        noJs.closedContentVisible === false &&
        noJs.templateInert === true,
      JSON.stringify(noJs),
    );
    check(
      'a click does nothing without javascript - the documented limitation, not a lie',
      noJs.closedAfterClick === 'false' && noJs.closedPanels === 0,
    );
    check(
      'the open state is truthful without javascript: the region and its content are there',
      noJs.openExpanded === 'true' && noJs.openContentVisible === true && noJs.openRegion === 1,
    );
    check(
      'the trigger is a type=button that submits nothing, and disabled stays disabled',
      noJs.triggerType === 'button' && noJs.disabledTrigger === true,
    );
    check(
      'every accordion root carries exactly one native trigger without javascript',
      noJs.triggers === 9,
      `triggers ${noJs.triggers}`,
    );
  });

  // -------------------------------------------------- accordion, ownership
  await withPage(chrome, server.origin, 'fixture-mixed.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('#vue-accordion-root'))`);
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-accordion-enhanced]'))`);
    await delay(150);
    await page.evaluate(`(() => {
      window.__vueRazorEvents = 0;
      document.querySelector('#vue-accordion-root').addEventListener('vf-accordion:open-change', () => { window.__vueRazorEvents += 1; });
    })()`);
    await clickAt(page, '#vue-accordion-root .vf-accordion__trigger');
    await delay(400);
    const vue = await page.evaluate(`(() => {
      const root = document.querySelector('#vue-accordion-root');
      const trigger = root.querySelector('.vf-accordion__trigger');
      return {
        markedByRazor: root.hasAttribute('data-vf-razor-accordion-enhanced') || root.hasAttribute('data-vf-razor'),
        expanded: trigger.getAttribute('aria-expanded'),
        panel: root.querySelector('.vf-accordion__content') !== null,
        razorEvents: window.__vueRazorEvents,
        template: root.querySelector('template') !== null,
      };
    })()`);
    check('the Razor controller marks no Vue accordion root', vue.markedByRazor === false, JSON.stringify(vue));
    check(
      'the Vue accordion toggles through its own handler and receives no Razor event',
      vue.expanded === 'true' && vue.panel === true && vue.razorEvents === 0 && vue.template === false,
      JSON.stringify(vue),
    );
  });

  // --------------------------------------- accordion, double bootstrap
  await withPage(chrome, server.origin, 'fixture-enhanced.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-accordion-enhanced]'))`);
    await page.evaluate(installAccordionLog);
    await page.evaluate(`import('./vueforge-razor.js?bootstrap=accordion').then(() => true)`);
    await delay(250);
    await clickAt(page, '[data-case="accordion-closed"] .vf-accordion__trigger');
    await delay(400);
    const twice = await page.evaluate(readAccordion('accordion-closed', 'Closed'));
    const panels = await page.evaluate(
      `document.querySelectorAll('[data-case="accordion-closed"] .vf-accordion__content').length`,
    );
    check(
      'after a second bootstrap one click is one toggle: open, one panel, one event',
      twice.expanded === 'true' && panels === 1 && twice.events.length === 1,
      JSON.stringify({ twice, panels }),
    );
    const markers = await page.evaluate(`document.querySelectorAll('[data-vf-razor-accordion-enhanced]').length`);
    check('a second bootstrap adds no accordion ownership marker', markers === 9, `markers ${markers}`);
    check(
      'the double-bootstrapped accordion page produced no script errors',
      page.diagnostics.pageErrors.length === 0,
      page.diagnostics.pageErrors.join('; '),
    );
  });

  // ----------------------------------------------------------------- dropdown
  await withPage(chrome, server.origin, 'fixture-enhanced.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-dropdown-enhanced]'))`);
    // The server's open render, inserted and enhanced through the packaged
    // module's own export - the path a host takes for markup it adds later.
    await page.evaluate(`(async () => {
      const section = document.querySelector('[data-case="dropdown-open"]');
      section.append(document.getElementById('dropdown-open-source').content.cloneNode(true));
      (await import('./vueforge-razor.js')).enhanceVueForgeDropdowns(section);
    })()`);
    const logged = await page.evaluate(installDropdownLog);
    check('the fixture has the dropdown roots', logged === 10, `logged ${logged}`);

    const ownership = await page.evaluate(`(() => ({
      owned: document.querySelectorAll('[data-vf-razor="dropdown"]').length,
      enhanced: document.querySelectorAll('[data-vf-razor="dropdown"][data-vf-razor-dropdown-enhanced]').length,
      unowned: document.querySelectorAll('[data-case="dropdown-unowned"] .vf-dropdown[data-vf-razor-dropdown-enhanced]').length,
      scripts: [...document.querySelectorAll('[data-case^="dropdown"] script, [data-case^="dropdown"] [onclick], [data-case^="dropdown"] [onkeydown]')].length,
    }))()`);
    check(
      'every Razor dropdown is enhanced and the unowned copy is not',
      ownership.owned === 9 && ownership.enhanced === 9 && ownership.unowned === 0 && ownership.scripts === 0,
      JSON.stringify(ownership),
    );

    // The server's open menu, taken over at bootstrap: moved to body,
    // positioned, and announced by no event.
    await delay(400);
    const open = await page.evaluate(readDropdown('Open'));
    check(
      'an initially open menu is teleported to body and positioned at bootstrap, without an event',
      open.expanded === 'true' &&
        open.where === 'body' &&
        open.positioned === true &&
        open.labelledByTrigger &&
        open.role === 'menu' &&
        open.arrowFirst &&
        open.events.length === 0 &&
        open.templates === 0,
      JSON.stringify(open),
    );
    // The top of the escape stack is the only open dropdown; Escape closes it
    // before anything else is clicked.
    await page.evaluate(`document.getElementById('submit').focus()`);
    await page.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
      nativeVirtualKeyCode: 27,
    });
    await page.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
      nativeVirtualKeyCode: 27,
    });
    await delay(450);
    const openClosed = await page.evaluate(readDropdown('Open'));
    check(
      'Escape closes the server-opened dropdown, focuses its trigger and removes its menu',
      openClosed.expanded === 'false' &&
        openClosed.menu === false &&
        openClosed.focus === 'trigger' &&
        JSON.stringify(openClosed.events) === '[{"open":false,"bubbles":true}]',
      JSON.stringify(openClosed),
    );
    const disabled = await page.evaluate(readDropdown('Disabled'));
    check(
      'a disabled dropdown given default-open is closed, with no menu anywhere',
      disabled.expanded === 'false' && disabled.menu === false && disabled.templates === 1,
      JSON.stringify(disabled),
    );

    // A closed dropdown: the reference dangles, and nothing is in the page.
    const closed = await page.evaluate(readDropdown('Default'));
    check(
      'a closed dropdown has a dangling aria-controls and its content only in the inert template',
      closed.expanded === 'false' && closed.menu === false && closed.templates === 1,
      JSON.stringify(closed),
    );

    // Pointer open: the menu goes to body, focus stays on the trigger, one event.
    await clickAt(page, '[data-case="dropdown-default"] .vf-dropdown__trigger');
    await delay(50);
    const entering = await page.evaluate(`[...${dropdownMenu('Default')}.classList]`);
    await delay(400);
    const clicked = await page.evaluate(readDropdown('Default'));
    check(
      'a click opens a fresh menu in body, labelled by its trigger, and focus stays on the trigger',
      clicked.expanded === 'true' &&
        clicked.where === 'body' &&
        clicked.labelledByTrigger &&
        clicked.positioned &&
        clicked.focus === 'trigger' &&
        JSON.stringify(clicked.events) === '[{"open":true,"bubbles":true}]',
      JSON.stringify(clicked),
    );
    check(
      'the menu enters with the vf-floating-transition classes and settles without them',
      entering.includes('vf-floating-transition-enter-active') &&
        JSON.stringify(clicked.menuClasses) === '["vf-dropdown__menu","vf-dropdown__menu--default"]',
      JSON.stringify({ entering, settled: clicked.menuClasses }),
    );

    // An inside click on the arrow - not an item - closes and focuses the trigger.
    await clickElement(page, `${dropdownMenu('Default')}.querySelector('.vf-dropdown__arrow')`);
    await delay(60);
    const leaving = await page.evaluate(
      `(() => { const m = ${dropdownMenu('Default')}; return m ? [...m.classList] : null; })()`,
    );
    await delay(450);
    const afterInside = await page.evaluate(readDropdown('Default'));
    check(
      'a click anywhere inside the menu closes it, focuses the trigger and removes the menu after its leave',
      afterInside.expanded === 'false' &&
        afterInside.menu === false &&
        afterInside.focus === 'trigger' &&
        Array.isArray(leaving) &&
        leaving.includes('vf-floating-transition-leave-active') &&
        afterInside.events.length === 2 &&
        afterInside.events[1].open === false,
      JSON.stringify({ leaving, afterInside }),
    );

    // Keyboard: ArrowUp does not open; ArrowDown opens and focuses the first
    // item; the walk wraps; Tab leaves it open.
    await page.evaluate(`window.__dropdownKeys.length = 0; ${dropdownTrigger('Keep')}.focus()`);
    await pressKey(page, 'ArrowUp');
    await delay(100);
    const arrowUp = await page.evaluate(readDropdown('Keep'));
    check(
      'ArrowUp on a closed trigger does not open it',
      arrowUp.expanded === 'false' && arrowUp.events.length === 0,
      JSON.stringify(arrowUp),
    );
    await pressKey(page, 'ArrowDown');
    await delay(400);
    const arrowDown = await page.evaluate(readDropdown('Keep'));
    check(
      'ArrowDown opens and focuses the first item',
      arrowDown.expanded === 'true' && arrowDown.focus === 'item:Alpha',
      JSON.stringify(arrowDown),
    );
    await pressKey(page, 'ArrowUp');
    const wrapped = await page.evaluate(readDropdown('Keep'));
    await pressKey(page, 'Home');
    const home = await page.evaluate(readDropdown('Keep'));
    await pressKey(page, 'Tab');
    await delay(100);
    const tabbed = await page.evaluate(readDropdown('Keep'));
    const keys = await page.evaluate(`window.__dropdownKeys.map((entry) => entry.key + ':' + entry.prevented)`);
    check(
      'ArrowUp wraps to the last item, Home returns to the first, Tab leaves the menu open',
      wrapped.focus === 'item:Gamma' &&
        home.focus === 'item:Alpha' &&
        tabbed.expanded === 'true' &&
        tabbed.focus === 'item:Beta',
      JSON.stringify({ wrapped: wrapped.focus, home: home.focus, tabbed }),
    );
    check(
      'the trigger prevents only the keys it handles, the menu only the walk',
      JSON.stringify(keys) === '["ArrowUp:false","ArrowDown:true","ArrowUp:true","Home:true","Tab:false"]',
      JSON.stringify(keys),
    );
    // closeOnSelect off: an item click keeps it open.
    await clickElement(page, `${dropdownMenu('Keep')}.querySelectorAll('[role="menuitem"]')[1]`);
    await delay(100);
    const kept = await page.evaluate(readDropdown('Keep'));
    check(
      'closeOnSelect off keeps the menu open on an item click',
      kept.expanded === 'true' && kept.menu === true,
      JSON.stringify(kept),
    );

    // Escape: the shared LIFO stack across siblings, then an outside click.
    await page.evaluate(`${dropdownTrigger('First')}.focus()`);
    await pressKey(page, 'ArrowDown');
    await delay(100);
    await page.evaluate(`${dropdownTrigger('Second')}.focus()`);
    await pressKey(page, 'ArrowDown');
    await delay(400);
    const bothOpen = [await page.evaluate(readDropdown('First')), await page.evaluate(readDropdown('Second'))];
    check(
      'two keyboard opens leave both siblings open: there is no mutual exclusion',
      bothOpen.every((state) => state.expanded === 'true' && state.where === 'body'),
      JSON.stringify(bothOpen),
    );
    const bodyOrder = await page.evaluate(
      `[...document.body.children].filter((node) => node.classList.contains('vf-dropdown__menu')).map((node) => document.querySelector('[aria-controls="' + node.id + '"]').closest('.vf-dropdown').getAttribute('aria-label'))`,
    );
    check(
      'teleported menus sit in body in document order, whatever order they opened in',
      JSON.stringify(bodyOrder) === '["First","Second","Keep"]',
      JSON.stringify(bodyOrder),
    );
    await page.evaluate(`document.getElementById('submit').focus()`);
    await page.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
      nativeVirtualKeyCode: 27,
    });
    await page.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
      nativeVirtualKeyCode: 27,
    });
    await delay(100);
    const afterEscape = [
      await page.evaluate(readDropdown('First')),
      await page.evaluate(readDropdown('Second')),
      await page.evaluate(readDropdown('Keep')),
    ];
    check(
      'one Escape closes only the most recently opened dropdown and focuses its trigger',
      afterEscape[0].expanded === 'true' &&
        afterEscape[1].expanded === 'false' &&
        afterEscape[1].focus === 'trigger' &&
        afterEscape[2].expanded === 'true',
      JSON.stringify(afterEscape),
    );
    await clickAt(page, '[data-case="dropdown-siblings"] .dropdown-outside');
    await delay(450);
    const afterOutside = [await page.evaluate(readDropdown('First')), await page.evaluate(readDropdown('Keep'))];
    check(
      'an outside click closes every open dropdown, each focusing its own trigger in document order, so the last one keeps it',
      afterOutside.every((state) => state.expanded === 'false' && state.menu === false) &&
        afterOutside[0].focus === 'elsewhere' &&
        afterOutside[1].focus === 'trigger',
      JSON.stringify(afterOutside),
    );

    // Pointer switch: the neighbour closes as an outside click and focuses its own trigger.
    await clickAt(page, '[data-case="dropdown-siblings"] .vf-dropdown[aria-label="First"] > .vf-dropdown__trigger');
    await delay(100);
    await clickAt(page, '[data-case="dropdown-siblings"] .vf-dropdown[aria-label="Second"] > .vf-dropdown__trigger');
    await delay(450);
    const switched = [await page.evaluate(readDropdown('First')), await page.evaluate(readDropdown('Second'))];
    check(
      'a pointer open closes an open neighbour, which then focuses its own trigger',
      switched[0].expanded === 'false' && switched[1].expanded === 'true' && switched[0].focus === 'trigger',
      JSON.stringify(switched),
    );

    // In place, and into a named overlay root.
    // In place, and into a named overlay root. Each is closed again before
    // the next click: an open menu is fixed over whatever lies below it.
    await clickAt(page, '[data-case="dropdown-target"] .vf-dropdown__trigger');
    await delay(400);
    const target = await page.evaluate(readDropdown('Target'));
    check(
      'teleport-to renders the menu into the named element',
      target.where === 'razor-overlay-root',
      JSON.stringify(target),
    );
    await clickAt(page, '[data-case="dropdown-target"] .vf-dropdown__trigger');
    await delay(450);
    await clickAt(page, '[data-case="dropdown-inline"] .vf-dropdown__trigger');
    await delay(400);
    const inlineOpen = await page.evaluate(readDropdown('Inline'));
    const inlineChildren = await page.evaluate(
      `[...document.querySelector('.vf-dropdown[aria-label="Inline"]').children].map((child) => child.tagName.toLowerCase() + '.' + child.className)`,
    );
    check(
      'disable-teleport renders the menu inside its own root, right after the trigger',
      inlineOpen.where === 'inline' &&
        inlineOpen.expanded === 'true' &&
        JSON.stringify(inlineChildren) ===
          '["div.vf-dropdown__trigger","div.vf-dropdown__menu vf-dropdown__menu--default","template."]',
      JSON.stringify({ inlineOpen, inlineChildren }),
    );
    await clickAt(page, '[data-case="dropdown-inline"] .vf-dropdown__trigger');
    await delay(450);

    // Disabled: nothing opens and nothing is prevented.
    await clickAt(page, '[data-case="dropdown-disabled"] .vf-dropdown__trigger');
    await page.evaluate(`${dropdownTrigger('Disabled')}.focus()`);
    await pressKey(page, 'ArrowDown');
    await delay(200);
    const disabledAfter = await page.evaluate(readDropdown('Disabled'));
    check(
      'a disabled dropdown ignores click and keys',
      disabledAfter.expanded === 'false' && disabledAfter.menu === false && disabledAfter.events.length === 0,
      JSON.stringify(disabledAfter),
    );

    // A menu of vf-menu-item with a disabled button: Enter on a consumer
    // control inside the trigger opens it, the walk stops at the disabled
    // item, and the vf-input inside the menu is enhanced every time.
    await page.evaluate(`document.querySelector('.dropdown-trigger-control').focus()`);
    await pressKey(page, 'Enter');
    await delay(400);
    await pressKey(page, 'ArrowDown');
    await delay(50);
    const menuState = await page.evaluate(readDropdown('Menu'));
    const nested = await page.evaluate(
      `(() => { const m = ${dropdownMenu('Menu')}; const input = m.querySelector('[data-vf-razor="input"]'); return { input: Boolean(input), enhanced: input?.hasAttribute('data-vf-razor-enhanced') ?? null, top: m.classList.contains('vf-dropdown__menu--top'), pills: m.classList.contains('vf-dropdown__menu--pills') }; })()`,
    );
    check(
      'Enter on a consumer control in the trigger opens the menu and the walk stops at a disabled item',
      menuState.expanded === 'true' && menuState.focus === 'item:Edit',
      JSON.stringify(menuState),
    );
    check(
      'Razor content inside a rendered menu is enhanced',
      nested.input && nested.enhanced === true && nested.pills,
      JSON.stringify(nested),
    );
    check(
      'the enhanced dropdown page produced no script errors',
      page.diagnostics.pageErrors.length === 0,
      page.diagnostics.pageErrors.join('; '),
    );
  });

  // ------------------------------------------------------- dropdown, no-js
  await withPage(chrome, server.origin, 'fixture-no-js.html', async (page) => {
    const noJs = await page.evaluate(`(() => {
      const trigger = document.querySelector('.vf-dropdown[aria-label="Default"] > .vf-dropdown__trigger');
      trigger.click();
      const section = document.querySelector('[data-case="dropdown-open"]');
      section.append(document.getElementById('dropdown-open-source').content.cloneNode(true));
      const openRoot = document.querySelector('.vf-dropdown[aria-label="Open"]');
      const openMenu = openRoot.querySelector(':scope > .vf-dropdown__menu');
      return {
        enhanced: document.querySelectorAll('[data-vf-razor-dropdown-enhanced]').length,
        expandedAfterClick: trigger.getAttribute('aria-expanded'),
        menusInBody: document.querySelectorAll('body > .vf-dropdown__menu').length,
        closedMenu: Boolean(document.getElementById(trigger.getAttribute('aria-controls'))),
        templateContentInert: document.querySelectorAll('[data-case="dropdown-default"] [role="menuitem"]').length,
        openInPlace: Boolean(openMenu),
        openStyle: openMenu?.getAttribute('style') ?? null,
        openExpanded: openRoot.querySelector(':scope > .vf-dropdown__trigger').getAttribute('aria-expanded'),
      };
    })()`);
    check('no dropdown controller runs without its script', noJs.enhanced === 0, JSON.stringify(noJs));
    check(
      'without javascript a closed dropdown stays closed and its menu content is unreachable',
      noJs.expandedAfterClick === 'false' &&
        noJs.closedMenu === false &&
        noJs.templateContentInert === 0 &&
        noJs.menusInBody === 0,
      JSON.stringify(noJs),
    );
    check(
      'without javascript an open dropdown shows its menu in place, unpositioned',
      noJs.openInPlace && noJs.openStyle === 'left:0px;top:0px;' && noJs.openExpanded === 'true',
      JSON.stringify(noJs),
    );
  });

  // ------------------------------------------------ dropdown, double bootstrap
  await withPage(chrome, server.origin, 'fixture-enhanced.html', async (page) => {
    await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-dropdown-enhanced]'))`);
    await page.evaluate(installDropdownLog);
    const anchorsBefore = await page.evaluate(
      `[...document.body.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent === '').length`,
    );
    await page.evaluate(`import('./vueforge-razor.js?bootstrap=dropdown').then(() => true)`);
    await delay(250);
    const anchorsAfter = await page.evaluate(
      `[...document.body.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent === '').length`,
    );
    await clickAt(page, '[data-case="dropdown-default"] .vf-dropdown__trigger');
    await delay(400);
    const twice = await page.evaluate(readDropdown('Default'));
    const menus = await page.evaluate(`document.querySelectorAll('body > .vf-dropdown__menu').length`);
    check(
      'after a second bootstrap one click is one open: one menu, one event, no second anchor',
      twice.expanded === 'true' && twice.events.length === 1 && anchorsAfter === anchorsBefore,
      JSON.stringify({ twice, anchorsBefore, anchorsAfter }),
    );
    check('a second bootstrap renders no second menu', menus === 1, `menus ${menus}`);
    check(
      'the double-bootstrapped dropdown page produced no script errors',
      page.diagnostics.pageErrors.length === 0,
      page.diagnostics.pageErrors.join('; '),
    );
  });
} finally {
  await chrome.close();
  await server.close();
}

process.stdout.write(`\n${passed.length} browser assertion(s) passed.\n`);

if (failures.length > 0) {
  process.stderr.write(`\n[razor-browser] FAILED with ${failures.length} failure(s):\n`);
  for (const failure of failures) {
    process.stderr.write(`  - ${failure}\n`);
  }
  process.exit(1);
}

process.stdout.write(
  '[razor-browser] OK: enhanced interactions, no-JS fallback, mixed Vue/Razor ownership and the accordion, stepper, tabs, dropdown and group box controllers.\n',
);
