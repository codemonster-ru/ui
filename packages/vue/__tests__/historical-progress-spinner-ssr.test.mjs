import assert from 'node:assert/strict';
import test from 'node:test';
import { CmBadge, CmTag } from '@codemonster-ru/ui-vue';
import { VfBadge, VfProgressSpinner, VfTag } from '@codemonster-ru/ui-vue/historical';
import { renderToString } from '@vue/server-renderer';
import { JSDOM } from 'jsdom';
import { h } from 'vue';

test('historical Badge and Tag use the same implementations and warning classes', async () => {
  assert.equal(VfBadge, CmBadge);
  assert.equal(VfTag, CmTag);
  assert.equal(
    await renderToString(h(VfBadge, { tone: 'warn', class: 'custom' }, () => 'Pending review')),
    await renderToString(h(CmBadge, { tone: 'warning', class: 'custom' }, () => 'Pending review')),
  );
  assert.equal(
    await renderToString(h(VfTag, { tone: 'warn' }, () => 'Review')),
    await renderToString(h(CmTag, { tone: 'warning' }, () => 'Review')),
  );
});

test('historical spinner restores its default label and custom dimensions', async () => {
  async function renderSpinner(props) {
    return JSDOM.fragment(await renderToString(h(VfProgressSpinner, props))).firstElementChild;
  }

  const defaultSpinner = await renderSpinner();
  assert.equal(defaultSpinner.getAttribute('aria-label'), 'Loading');
  assert.deepEqual(
    [...defaultSpinner.querySelectorAll('circle')].map((circle) => circle.getAttribute('stroke-width')),
    ['4', '4'],
  );

  const customSpinner = await renderSpinner({
    label: 'Synchronizing',
    size: 38,
    strokeWidth: 6,
    tone: 'warn',
    style: { opacity: 0.8 },
  });
  assert.equal(customSpinner.getAttribute('aria-label'), 'Synchronizing');
  assert.equal(customSpinner.getAttribute('role'), 'progressbar');
  assert.equal(customSpinner.getAttribute('aria-valuenow'), null);
  assert.ok(customSpinner.classList.contains('cm-progress-spinner--warning'));
  assert.equal(customSpinner.style.getPropertyValue('--cm-progress-spinner-size'), '38px');
  assert.equal(customSpinner.style.opacity, '0.8');
  assert.deepEqual(
    [...customSpinner.querySelectorAll('circle')].map((circle) => circle.getAttribute('stroke-width')),
    ['6', '6'],
  );

  const cssSize = await renderSpinner({ size: 'calc(2rem + 2px)' });
  assert.equal(cssSize.style.getPropertyValue('--cm-progress-spinner-size'), 'calc(2rem + 2px)');
});
