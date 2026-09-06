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
    check(
      'the bridge applies floating state after bootstrap',
      field.before.fieldFloating === true,
      JSON.stringify(field),
    );
    check('the bridge marks the input floating', field.before.inputFloating === true);
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
      };
    })()`);
    check('no controller runs without its script', noJs.enhancedRoots === 0, JSON.stringify(noJs));
    check('typing works without javascript', noJs.typed === 'typed without javascript');
    check('the value is submittable without javascript', noJs.submittable === 'typed without javascript');
    check('a password stays protected without javascript', noJs.passwordType === 'password');
    check('no action is visible without javascript', noJs.actionsHidden === true);
    check('no action occupies layout without javascript', noJs.actionsUnrendered === true);
    check('no action is reachable without javascript', noJs.actionsDisabled === true && noJs.focusableActions === 0);
    check('floating labels degrade to the plain composition', noJs.floatingApplied === 0);
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

process.stdout.write('[razor-browser] OK: enhanced interactions, no-JS fallback and mixed Vue/Razor ownership.\n');
