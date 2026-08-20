import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const browser = new JSDOM('<!doctype html><html><body></body></html>');
Object.assign(globalThis, {
  Element: browser.window.Element,
  HTMLElement: browser.window.HTMLElement,
  Node: browser.window.Node,
  SVGElement: browser.window.SVGElement,
  document: browser.window.document,
  window: browser.window,
});

const { mount } = await import('@vue/test-utils');
const { CmCheckbox, CmDatePicker, CmSelect } = await import('../dist/index.js');
const contractsDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../../contracts');
const cases = [
  ['checkbox', CmCheckbox, 'indeterminate'],
  ['select', CmSelect, 'selected'],
  ['select', CmSelect, 'clearable'],
  ['date-picker', CmDatePicker, 'default'],
  ['date-picker', CmDatePicker, 'value'],
  ['date-picker', CmDatePicker, 'clearable'],
];

for (const [componentSlug, component, caseName] of cases) {
  test(`matches Vue and Razor accessibility for ${componentSlug}/${caseName}`, async () => {
    const definition = await readDefinition(componentSlug, caseName);
    const razorHtml = await readFile(resolve(contractsDirectory, componentSlug, 'cases', `${caseName}.html`), 'utf8');
    const vue = mount(component, {
      attachTo: browser.window.document.body,
      attrs: definition.attributes,
      props: normalizeVueProps(componentSlug, definition.props),
    });
    const razorDom = new JSDOM('<!doctype html><html><body></body></html>');
    razorDom.window.document.body.innerHTML = razorHtml;
    const vueRoot = vue.element;
    const razorRoot = razorDom.window.document.body.firstElementChild;
    const vueControl = findControl(vueRoot);
    const razorControl = findControl(razorRoot);

    assert.deepEqual(accessibilitySnapshot(vueRoot, vueControl), accessibilitySnapshot(razorRoot, razorControl));
    vueControl.focus();
    razorControl.focus();
    assert.equal(
      browser.window.document.activeElement === vueControl,
      razorDom.window.document.activeElement === razorControl,
    );

    vue.unmount();
    razorDom.window.close();
  });
}

async function readDefinition(componentSlug, caseName) {
  return JSON.parse(
    await readFile(resolve(contractsDirectory, componentSlug, 'cases', `${caseName}.case.json`), 'utf8'),
  );
}

function normalizeVueProps(componentSlug, props) {
  const normalized = { ...props };
  if (componentSlug === 'checkbox' && 'checked' in normalized) {
    normalized.modelValue = normalized.checked;
    delete normalized.checked;
  }
  if (['select', 'date-picker'].includes(componentSlug) && 'value' in normalized) {
    normalized.modelValue = normalized.value;
    delete normalized.value;
  }
  return normalized;
}

function findControl(root) {
  const control = root.matches('input, select') ? root : root.querySelector('input, select');
  assert.ok(control, 'Accessibility case must contain a native form control.');
  return control;
}

function accessibilitySnapshot(root, control) {
  const clear = root.querySelector('[data-cm-select-clear], [data-cm-input-clear]');
  return {
    tagName: control.tagName,
    ariaLabel: control.getAttribute('aria-label'),
    ariaInvalid: control.getAttribute('aria-invalid'),
    disabled: control.disabled,
    readOnly: control.readOnly ?? false,
    required: control.required,
    tabIndex: control.tabIndex,
    labelText: root.tagName === 'LABEL' ? root.textContent?.trim() : null,
    clearAction: clear
      ? { ariaLabel: clear.getAttribute('aria-label'), hidden: clear.hidden, tabIndex: clear.tabIndex }
      : null,
  };
}
