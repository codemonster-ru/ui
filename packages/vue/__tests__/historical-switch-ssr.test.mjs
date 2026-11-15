import assert from 'node:assert/strict';
import test from 'node:test';
import { VfSwitch } from '@codemonster-ru/ui-vue/historical';
import { renderToString } from '@vue/server-renderer';
import { JSDOM } from 'jsdom';
import { h } from 'vue';

test('renders the historical public Switch with native submission and decorative slot state', async () => {
  const output = await renderToString(
    h(
      VfSwitch,
      { modelValue: true, label: 'Notifications', name: 'alerts', value: 'yes' },
      {
        thumb: ({ checked }) => h('span', checked ? 'On' : 'Off'),
      },
    ),
  );
  const root = JSDOM.fragment(output).firstElementChild;
  assert.equal(root.tagName, 'LABEL');
  assert.equal(root.className, 'cm-switch cm-switch--md');
  assert.equal(root.querySelector('input')?.name, 'alerts');
  assert.equal(root.querySelector('input')?.value, 'yes');
  assert.equal(root.querySelector('input')?.checked, true);
  assert.equal(root.querySelector('input')?.getAttribute('aria-checked'), 'true');
  assert.equal(root.querySelector('.cm-switch__content')?.textContent, 'Notifications');
  assert.equal(root.querySelector('.cm-switch__control')?.getAttribute('aria-hidden'), 'true');
  assert.equal(root.querySelector('.cm-switch__thumb > span')?.textContent, 'On');
});
