import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { JSDOM } from 'jsdom';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { CmCommandPalette, CmDatePicker, CmSelect } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const components = { 'command-palette': CmCommandPalette, 'date-picker': CmDatePicker, select: CmSelect };

function slotContent(content) {
  if (content === '<kbd>⌘K</kbd>') return h('kbd', '⌘K');
  if (content === '<strong>Open</strong> settings <kbd>S</kbd>') {
    return [h('strong', 'Open'), ' settings ', h('kbd', 'S')];
  }
  if (content === '<strong>Finding commands…</strong>') return h('strong', 'Finding commands…');
  return content;
}

for (const [slug, component] of Object.entries(components)) {
  const casesDirectory = resolve(packageDirectory, `../../contracts/${slug}/cases`);
  const caseFiles = (await readdir(casesDirectory)).filter((file) => file.endsWith('.case.json')).sort();

  for (const caseFile of caseFiles) {
    test(`matches canonical ${slug} DOM for ${caseFile}`, async () => {
      const basename = caseFile.slice(0, -'.case.json'.length);
      const definition = JSON.parse(await readFile(resolve(casesDirectory, caseFile), 'utf8'));
      const expected = await readFile(resolve(casesDirectory, `${basename}.html`), 'utf8');
      const props = { ...definition.attributes, ...definition.props };
      if (slug === 'select' || slug === 'date-picker') {
        props.modelValue = props.value ?? '';
        delete props.value;
      }
      const slots = Object.fromEntries(
        Object.entries(definition.slots).map(([name, content]) => [name, () => slotContent(content)]),
      );
      const actual = await renderToString(createSSRApp({ render: () => h(component, props, slots) }));
      const comparison = compareSignificantDom(expected, actual);
      assert.equal(comparison.equal, true, comparison.difference);
    });
  }
}

test('escapes advanced-input option, command, and attribute values during SSR', async () => {
  const actual = await renderToString(
    createSSRApp({
      render: () =>
        h(CmSelect, { id: 'safe', options: [{ value: '"><script>', label: '<Unsafe>' }], 'aria-label': 'Safe' }),
    }),
  );
  assert.match(actual, /&lt;Unsafe&gt;/u);
  assert.match(actual, /&quot;&gt;&lt;script&gt;/u);
  assert.doesNotMatch(actual, /<script>/u);
});

for (const { component, props, popup } of [
  {
    component: CmSelect,
    props: { modelValue: 'daily', options: [{ value: 'daily', label: 'Daily' }] },
    popup: 'listbox',
  },
  { component: CmDatePicker, props: { modelValue: '2026-09-02' }, popup: 'dialog' },
]) {
  test(`preserves the ${popup} trigger relationship and form value during SSR`, async (context) => {
    const actual = await renderToString(
      createSSRApp({
        render: () =>
          h('form', [
            h('p', { id: 'field-help' }, 'Choose a value'),
            h(component, {
              ...props,
              id: 'field',
              name: 'field',
              required: true,
              type: 'submit',
              role: 'button',
              'aria-haspopup': 'menu',
              'aria-controls': 'missing',
              'aria-required': 'false',
              'aria-label': 'Project field',
              'aria-describedby': 'field-help',
              'data-analytics': 'pick',
            }),
          ]),
      }),
    );
    const { window } = new JSDOM(actual);
    context.after(() => window.close());
    const form = window.document.querySelector('form');
    const trigger = form.querySelector('button');
    const panel = form.querySelector(`[role="${popup}"]`);

    assert.equal(trigger.type, 'button');
    assert.equal(trigger.getAttribute('role'), 'combobox');
    assert.equal(trigger.getAttribute('aria-haspopup'), popup);
    assert.equal(trigger.getAttribute('aria-controls'), panel.id);
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(trigger.getAttribute('aria-required'), 'true');
    assert.equal(trigger.getAttribute('aria-label'), 'Project field');
    assert.equal(trigger.getAttribute('aria-describedby'), 'field-help');
    assert.equal(trigger.dataset.analytics, 'pick');
    assert.equal(new window.FormData(form).get('field'), props.modelValue);
  });
}

test('omits a disabled Select from form data rendered on the server', async (context) => {
  const actual = await renderToString(
    createSSRApp({
      render: () =>
        h(
          'form',
          h(CmSelect, {
            id: 'frequency',
            name: 'frequency',
            modelValue: 'daily',
            options: [{ value: 'daily', label: 'Daily' }],
            disabled: true,
          }),
        ),
    }),
  );
  const { window } = new JSDOM(actual);
  context.after(() => window.close());
  const form = window.document.querySelector('form');

  assert.equal(new window.FormData(form).has('frequency'), false);
});

test('omits a disabled DatePicker and submits a readonly DatePicker as ISO', async (context) => {
  const actual = await renderToString(
    createSSRApp({
      render: () =>
        h('form', [
          h(CmDatePicker, { id: 'launch', name: 'launch', modelValue: '2026-08-13', disabled: true }),
          h(CmDatePicker, {
            id: 'review',
            name: 'review',
            modelValue: '2026-09-02',
            displayFormat: 'dd.MM.yyyy',
            readonly: true,
          }),
        ]),
    }),
  );
  const { window } = new JSDOM(actual);
  context.after(() => window.close());
  assert.match(actual, /02\.09\.2026/u);
  assert.deepEqual(
    [...new window.FormData(window.document.querySelector('form')).entries()],
    [['review', '2026-09-02']],
  );
});

test('serializes an initial DatePicker range as repeated ISO fields', async (context) => {
  const actual = await renderToString(
    createSSRApp({
      render: () =>
        h('form', [
          h(CmDatePicker, {
            id: 'release-range',
            name: 'release_dates',
            modelValue: ['2026-09-10', '2026-09-02'],
            displayFormat: 'dd.MM.yyyy',
            range: true,
            readonly: true,
          }),
        ]),
    }),
  );
  const { window } = new JSDOM(actual);
  context.after(() => window.close());
  assert.match(actual, /02\.09\.2026 – 10\.09\.2026/u);
  assert.deepEqual(new window.FormData(window.document.querySelector('form')).getAll('release_dates'), [
    '2026-09-02',
    '2026-09-10',
  ]);
});
