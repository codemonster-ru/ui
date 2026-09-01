import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const browser = new JSDOM('<!doctype html><html><body></body></html>');
Object.assign(globalThis, {
  Element: browser.window.Element,
  HTMLElement: browser.window.HTMLElement,
  HTMLInputElement: browser.window.HTMLInputElement,
  Node: browser.window.Node,
  SVGElement: browser.window.SVGElement,
  document: browser.window.document,
  window: browser.window,
});

const { mount } = await import('@vue/test-utils');
const { nextTick } = await import('vue');
const components = await import('../dist/index.js');
const layouts = await import('../../layouts/dist/index.js');
const runtime = await import('../../runtime/dist/index.js');

const contractsDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../../contracts');

/**
 * Each entry says how to reach what a scenario names, on either platform. The scenario stays
 * abstract so the same steps drive the Vue component and the controller running on the canonical
 * markup: testing the two apart can never show that they agree.
 *
 * `events` maps a scenario's event name to what each adapter calls it. The names differ by
 * convention rather than by accident — Vue emits `next`, the DOM dispatches `cm:setup-layout-next` —
 * and the mapping is what lets a scenario count an event without picking a side.
 */
const suites = {
  'admin-layout': {
    component: layouts.CmAdminLayout,
    controller: ['admin-layout', runtime.createCmAdminLayoutController],
    root: '.cm-admin-layout',
    targets: { 'mobile-toggle': '[data-cm-mobile-sidebar-toggle]' },
    snapshot: (root) => ({
      drawer: root.getAttribute('data-cm-mobile-sidebar-open'),
      collapsed: root.getAttribute('data-cm-sidebar-collapsed'),
      expanded: root.querySelector('[data-cm-mobile-sidebar-toggle]')?.getAttribute('aria-expanded'),
    }),
  },
  'column-chooser': {
    component: components.CmColumnChooser,
    controller: ['popover', runtime.createCmPopoverController],
    root: '.cm-column-chooser',
    targets: { panel: '.cm-column-chooser__panel', trigger: '.cm-column-chooser__trigger' },
    snapshot: (root) => ({
      expanded: root.querySelector('.cm-column-chooser__trigger')?.getAttribute('aria-expanded'),
      hidden: root.querySelector('.cm-column-chooser__panel')?.hidden,
    }),
  },
  'menu-bar': {
    component: components.CmMenuBar,
    controller: ['menu-bar', runtime.createCmMenuBarController],
    root: '.cm-menu-bar',
    targets: { 'branch-first': '[data-cm-menu-bar-branch]', 'submenu-first': '.cm-menu-bar__submenu' },
    snapshot: (root) => ({
      expanded: [...root.querySelectorAll('[data-cm-menu-bar-branch]')].map((b) => b.getAttribute('aria-expanded')),
      hidden: [...root.querySelectorAll('.cm-menu-bar__submenu')].map((s) => s.hidden),
    }),
  },
  'nav-menu': {
    component: components.CmNavMenu,
    controller: ['nav-menu', runtime.createCmNavMenuController],
    root: '.cm-nav-menu',
    targets: { 'branch-first': '[data-cm-nav-menu-branch]' },
    snapshot: (root) => ({
      expanded: [...root.querySelectorAll('[data-cm-nav-menu-branch]')].map((b) => b.getAttribute('aria-expanded')),
    }),
  },
  'setup-layout': {
    component: layouts.CmSetupLayout,
    controller: ['setup-layout', runtime.createCmSetupLayoutController],
    root: '.cm-setup-layout',
    targets: {},
    events: { back: { dom: 'cm:setup-layout-back', vue: 'back' }, next: { dom: 'cm:setup-layout-next', vue: 'next' } },
    snapshot: () => ({}),
  },
  stepper: {
    component: components.CmStepper,
    controller: ['stepper', runtime.createCmStepperController],
    root: '.cm-stepper',
    targets: {
      'step-first': '[data-cm-stepper-value="account"]',
      'step-second': '[data-cm-stepper-value="billing"]',
      'step-third': '[data-cm-stepper-value="review"]',
    },
    snapshot: (root) => ({
      current: [...root.querySelectorAll('[data-cm-stepper-value]')].map((s) => s.getAttribute('aria-current')),
    }),
  },
};

function resolveTarget(root, suite, name) {
  if (name === 'root') return root;
  const selector = suite.targets[name];
  assert.ok(selector, `Scenario names an unmapped target: ${name}.`);
  const target = root.querySelector(selector);
  assert.ok(target, `Missing parity target ${name}.`);
  return target;
}

function activate(targetWindow, target, step) {
  if (step.action === 'click') target.click();
  if (step.action === 'focus') target.focus();
  if (step.action === 'press') {
    target.dispatchEvent(new targetWindow.KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: step.key }));
  }
}

function observe(root, suite, step, counts) {
  const target = resolveTarget(root, suite, step.target);
  if (step.expect === 'attribute') return target.getAttribute(step.name);
  if (step.expect === 'visible') return !target.hidden;
  if (step.expect === 'eventCount') return counts.get(step.name) ?? 0;
  if (step.expect === 'focus') return root.ownerDocument.activeElement === target;
  throw new Error(`Unsupported expectation: ${step.expect}.`);
}

function expected(step) {
  return step.expect === 'eventCount' ? step.count : step.value;
}

/**
 * A fixture that supplies a controlled prop leaves the Vue component unable to change on its own,
 * because nothing writes the update back. Closing that loop is what an application does, and without
 * it the comparison would report a divergence the components do not have.
 */
async function syncModels(vue, consumed) {
  const emitted = vue.emitted();
  const props = {};
  for (const [name, payloads] of Object.entries(emitted)) {
    if (!name.startsWith('update:')) continue;
    if ((consumed.get(name) ?? 0) === payloads.length) continue;
    consumed.set(name, payloads.length);
    props[name.slice('update:'.length)] = payloads.at(-1)[0];
  }
  if (Object.keys(props).length > 0) await vue.setProps(props);
}

for (const [slug, suite] of Object.entries(suites)) {
  const behaviorDirectory = resolve(contractsDirectory, slug, 'behavior');
  const scenarioFiles = (await readdir(behaviorDirectory)).filter((file) => file.endsWith('.scenario.json')).sort();

  for (const scenarioFile of scenarioFiles) {
    test(`Vue and Razor agree for ${slug}/${scenarioFile}`, async () => {
      const scenario = JSON.parse(await readFile(resolve(behaviorDirectory, scenarioFile), 'utf8'));
      const basename = scenario.case.slice(`${slug}-`.length);
      const casePath = resolve(contractsDirectory, slug, 'cases', basename);
      const definition = JSON.parse(await readFile(`${casePath}.case.json`, 'utf8'));
      const razorHtml = await readFile(`${casePath}.html`, 'utf8');

      const razorDom = new JSDOM(`<!doctype html><html><body>${razorHtml}</body></html>`);
      const razorRoot = razorDom.window.document.querySelector(suite.root);
      assert.ok(razorRoot, `Canonical fixture has no ${suite.root}.`);
      new runtime.CmRuntime().register(...suite.controller).start(razorDom.window.document);

      const slots = Object.fromEntries(
        Object.entries(definition.slots ?? {}).map(([name, content]) => [name, () => content]),
      );
      const vue = mount(suite.component, {
        attachTo: browser.window.document.body,
        props: definition.props,
        slots,
      });

      const razorCounts = new Map();
      for (const [name, mapping] of Object.entries(suite.events ?? {})) {
        razorCounts.set(name, 0);
        razorRoot.addEventListener(mapping.dom, () => razorCounts.set(name, razorCounts.get(name) + 1));
      }
      const vueCounts = {
        get: (name) => (vue.emitted(suite.events?.[name]?.vue ?? name) ?? []).length,
      };

      assert.deepEqual(suite.snapshot(vue.element), suite.snapshot(razorRoot), 'initial state differs');

      const consumed = new Map();
      for (const step of scenario.steps) {
        if (step.action) {
          activate(razorDom.window, resolveTarget(razorRoot, suite, step.target), step);
          activate(browser.window, resolveTarget(vue.element, suite, step.target), step);
          await nextTick();
          await syncModels(vue, consumed);
          assert.deepEqual(
            suite.snapshot(vue.element),
            suite.snapshot(razorRoot),
            `${scenarioFile}: diverged after ${step.action} ${step.target}`,
          );
          continue;
        }

        const vueObservation = observe(vue.element, suite, step, vueCounts);
        const razorObservation = observe(razorRoot, suite, step, razorCounts);
        assert.deepEqual(
          vueObservation,
          razorObservation,
          `${scenarioFile}: diverged at ${step.expect} ${step.target}`,
        );
        assert.deepEqual(vueObservation, expected(step), `${scenarioFile}: contract expectation failed`);
      }

      vue.unmount();
      razorDom.window.close();
    });
  }
}
