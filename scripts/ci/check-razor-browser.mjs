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
  }[key];
  const base = {
    key,
    code: descriptor.code,
    windowsVirtualKeyCode: descriptor.keyCode,
    nativeVirtualKeyCode: descriptor.keyCode,
  };
  await page.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...base });
  await page.send('Input.dispatchKeyEvent', {
    type: 'char',
    ...base,
    text: descriptor.text,
    unmodifiedText: descriptor.text,
  });
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

mkdirSync(distDirectory, { recursive: true });
process.stdout.write('Building Razor assets and rendering the PHP fixtures\n');
buildAssets();
renderFixture('fixture-enhanced.html', null);
renderFixture('fixture-no-js.html', '--no-js');
renderFixture('fixture-mixed.html', '--with-vue');

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
  '[razor-browser] OK: enhanced interactions, no-JS fallback, mixed Vue/Razor ownership and the accordion controller.\n',
);
