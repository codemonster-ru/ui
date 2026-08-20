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
const { nextTick } = await import('vue');
const { CmCheckbox, CmDatePicker, CmSelect } = await import('../dist/index.js');
const { CmRuntime, createCmCheckboxController, createCmInputController, createCmSelectController } =
  await import('../../runtime/dist/index.js');

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contractsDirectory = resolve(packageDirectory, '../../contracts');
const scenarios = [
  ['checkbox', CmCheckbox, 'toggle-submission.scenario.json'],
  ['checkbox', CmCheckbox, 'required-validation.scenario.json'],
  ['select', CmSelect, 'change-submission.scenario.json'],
  ['select', CmSelect, 'required-validation.scenario.json'],
  ['date-picker', CmDatePicker, 'change-submission.scenario.json'],
  ['date-picker', CmDatePicker, 'range-validation.scenario.json'],
];

for (const [componentSlug, component, scenarioFile] of scenarios) {
  test(`matches Vue and Razor behavior for ${componentSlug}/${scenarioFile}`, async () => {
    const scenario = await readScenario(componentSlug, scenarioFile);
    const definition = await readCase(componentSlug, scenario.case);
    const razorHtml = await readRazorCase(componentSlug, scenario.case);
    const vue = mount(component, {
      attachTo: browser.window.document.body,
      attrs: definition.attributes,
      props: definition.props,
    });
    const vueForm = createForm(browser.window, vue.element);
    const razorDom = new JSDOM('<!doctype html><html><body></body></html>');
    const razorForm = createForm(razorDom.window, razorHtml);
    const runtime = createRuntime(componentSlug);
    runtime?.start(razorDom.window.document);
    const vueControl = resolveTarget(vueForm, 'control');
    const razorControl = resolveTarget(razorForm, 'control');
    const vueEvents = countEvents(vueControl, scenario);
    const razorEvents = countEvents(razorControl, scenario);

    for (const step of scenario.steps) {
      if (step.action) {
        activate(browser.window, vueForm, vueControl, step);
        activate(razorDom.window, razorForm, razorControl, step);
        await nextTick();
      } else {
        const vueObservation = observe(vueForm, vueControl, vueEvents, step);
        const razorObservation = observe(razorForm, razorControl, razorEvents, step);
        assert.deepEqual(vueObservation, razorObservation, `${scenarioFile}: Vue and Razor diverged at ${step.expect}`);
        assert.deepEqual(vueObservation, expectedObservation(step), `${scenarioFile}: contract expectation failed`);
      }
    }

    vue.unmount();
    razorDom.window.close();
  });
}

async function readScenario(componentSlug, scenarioFile) {
  return JSON.parse(await readFile(resolve(contractsDirectory, componentSlug, 'behavior', scenarioFile), 'utf8'));
}

async function readCase(componentSlug, caseId) {
  const caseName = caseId.slice(`${componentSlug}-`.length);
  return JSON.parse(
    await readFile(resolve(contractsDirectory, componentSlug, 'cases', `${caseName}.case.json`), 'utf8'),
  );
}

async function readRazorCase(componentSlug, caseId) {
  const caseName = caseId.slice(`${componentSlug}-`.length);
  return readFile(resolve(contractsDirectory, componentSlug, 'cases', `${caseName}.html`), 'utf8');
}

function createForm(targetWindow, content) {
  const form = targetWindow.document.createElement('form');
  if (typeof content === 'string') form.innerHTML = content;
  else form.append(content);
  targetWindow.document.body.append(form);
  return form;
}

function createRuntime(componentSlug) {
  if (componentSlug === 'checkbox') return new CmRuntime().register('checkbox', createCmCheckboxController);
  if (componentSlug === 'select') return new CmRuntime().register('select', createCmSelectController);
  if (componentSlug === 'date-picker') return new CmRuntime().register('input', createCmInputController);
  return null;
}

function resolveTarget(form, target) {
  if (target === 'form') return form;
  const control = form.querySelector('input, select');
  assert.ok(control, `Missing behavior control for ${target}.`);
  return control;
}

function countEvents(control, scenario) {
  const events = new Map();
  for (const step of scenario.steps) {
    if (step.expect !== 'eventCount' || events.has(step.name)) continue;
    events.set(step.name, 0);
    control.addEventListener(step.name, () => events.set(step.name, events.get(step.name) + 1));
  }
  return events;
}

function activate(targetWindow, form, control, step) {
  if (step.action === 'click') control.click();
  if (step.action === 'focus') control.focus();
  if (step.action === 'setValue') {
    control.value = step.value;
    control.dispatchEvent(new targetWindow.Event('input', { bubbles: true }));
    control.dispatchEvent(new targetWindow.Event('change', { bubbles: true }));
  }
  if (step.action === 'submit')
    form.dispatchEvent(new targetWindow.Event('submit', { bubbles: true, cancelable: true }));
  if (step.action === 'press') {
    control.dispatchEvent(
      new targetWindow.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: step.key }),
    );
    if (step.key === 'Enter' || step.key === ' ') control.click();
  }
}

function observe(form, control, events, step) {
  if (step.expect === 'eventCount') return events.get(step.name) ?? 0;
  if (step.expect === 'formValue') return new form.ownerDocument.defaultView.FormData(form).get(step.name);
  if (step.expect === 'validity') return control.checkValidity();
  if (step.expect === 'focus') return form.ownerDocument.activeElement === control;
  if (step.expect === 'attribute') return control.getAttribute(step.name);
  if (step.expect === 'text') return form.textContent?.trim() ?? '';
  if (step.expect === 'visible') return !control.hidden;
  return undefined;
}

function expectedObservation(step) {
  if (step.expect === 'eventCount') return step.count;
  if (step.expect === 'formValue' || step.expect === 'attribute' || step.expect === 'text') return step.value;
  if (['focus', 'validity', 'visible'].includes(step.expect)) return step.value;
  return undefined;
}
