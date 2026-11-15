import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToString } from '@vue/server-renderer';
import { JSDOM } from 'jsdom';
import { h } from 'vue';
import { VfCard, VfDivider, VfSkeleton } from '@codemonster-ru/ui-vue';

test('historical Card regions, Divider orientations and Skeleton dimensions use their public entry', async () => {
  const source = await renderToString(
    h(
      VfCard,
      { title: 'Loading account', compact: true },
      {
        default: () => [
          h(VfSkeleton, { minHeight: 'calc(1rem + 4px)', radius: '3px 7px', animated: false }),
          h(VfSkeleton, { minHeight: 38 }),
          h(VfDivider, { orientation: 'vertical' }),
          h(VfDivider),
        ],
        footer: () => 'Account details',
      },
    ),
  );
  const { document } = new JSDOM(source).window;
  const card = document.querySelector('section.cm-card--compact');
  assert.equal(card.querySelector('header h3').textContent, 'Loading account');
  assert.equal(card.querySelector('footer').textContent, 'Account details');
  const [still, animated] = card.querySelectorAll('.cm-card__body .cm-skeleton');
  assert.equal(still.getAttribute('aria-hidden'), 'true');
  assert.match(still.getAttribute('style'), /min-height:calc\(1rem \+ 4px\);border-radius:3px 7px;/u);
  assert.equal(animated.style.minHeight, '38px');
  assert.equal(still.classList.contains('cm-skeleton--animated'), false);
  assert.equal(animated.classList.contains('cm-skeleton--animated'), true);
  assert.deepEqual(
    [...card.querySelectorAll('hr[role="separator"]')].map((node) => node.getAttribute('aria-orientation')),
    ['vertical', 'horizontal'],
  );
});
