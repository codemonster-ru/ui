import assert from 'node:assert/strict';
import test from 'node:test';
import { CmAlert } from '@codemonster-ru/ui-vue';
import { VfAlert, VfAvatar, VueIconify } from '@codemonster-ru/ui-vue/historical';
import { renderToString } from '@vue/server-renderer';
import { JSDOM } from 'jsdom';
import { h } from 'vue';

async function render(component, props, slots) {
  return JSDOM.fragment(await renderToString(h(component, props, slots))).firstElementChild;
}

test('historical alerts retain their tone, role, and default named icon', async () => {
  const cases = [
    [undefined, 'primary', 'infoCircle'],
    ['neutral', 'neutral', 'infoCircle'],
    ['primary', 'primary', 'infoCircle'],
    ['success', 'success', 'checkCircle'],
    ['info', null, 'infoCircle'],
    ['warn', 'warning', 'alertCircle'],
    ['warning', 'warning', 'alertCircle'],
    ['help', 'help', 'questionCircle'],
    ['danger', 'danger', 'xCircle'],
    ['contrast', 'contrast', 'infoCircle'],
  ];

  for (const [tone, modifier, icon] of cases) {
    const alert = await render(VfAlert, { tone }, () => 'Message');
    assert.equal(alert.getAttribute('role'), 'alert');
    assert.equal(alert.className, modifier ? `cm-alert cm-alert--${modifier}` : 'cm-alert');
    assert.equal(alert.querySelector('.cm-alert__body')?.textContent, 'Message');
    assert.equal(alert.querySelector('.cm-alert__icon')?.getAttribute('aria-hidden'), 'true');
    const expectedIcon = await render(VueIconify, { icon, size: 'var(--cm-icon-size-lg)' });
    assert.equal(alert.querySelector('svg')?.outerHTML, expectedIcon.outerHTML);
  }

  const canonical = await render(CmAlert, null, () => 'Message');
  assert.equal(canonical.getAttribute('role'), 'status');
  assert.equal(canonical.className, 'cm-alert');
  assert.equal(canonical.querySelector('.cm-alert__icon'), null);
});

test('historical alerts honor named icons, slot priority, and hideIcon', async () => {
  const named = await render(VfAlert, { icon: 'arrow-left', role: 'status', title: 'Text title' });
  const expectedIcon = await render(VueIconify, { icon: 'arrowLeft', size: 'var(--cm-icon-size-lg)' });
  assert.equal(named.getAttribute('role'), 'status');
  assert.equal(named.getAttribute('icon'), null);
  assert.equal(named.querySelector('.cm-alert__title')?.textContent, 'Text title');
  assert.equal(named.querySelector('svg')?.outerHTML, expectedIcon.outerHTML);

  const slots = { icon: () => h('span', 'custom icon'), title: () => h('strong', 'custom title') };
  const custom = await render(VfAlert, { icon: 'arrow-left', title: 'Text title' }, slots);
  assert.equal(custom.querySelector('.cm-alert__icon > span')?.textContent, 'custom icon');
  assert.equal(custom.querySelector('.cm-alert__title > strong')?.textContent, 'custom title');
  assert.equal(custom.querySelector('svg'), null);

  const hidden = await render(VfAlert, { icon: 'arrow-left', hideIcon: true }, slots);
  assert.equal(hidden.querySelector('.cm-alert__icon'), null);
  assert.equal(hidden.getAttribute('hideIcon'), null);
});

test('historical avatars render image, label, named icon, or slotted text in precedence order', async () => {
  const props = { image: '/avatar.png', imageAlt: 'Ada', label: 'AK', icon: 'user', size: 'lg', shape: 'circle' };
  const fallback = () => 'Anonymous';
  const image = await render(VfAvatar, props, fallback);
  assert.equal(image.className, 'cm-avatar cm-avatar--lg cm-avatar--circle');
  assert.equal(image.querySelector('img')?.getAttribute('src'), '/avatar.png');
  assert.equal(image.querySelector('img')?.getAttribute('alt'), 'Ada');
  assert.equal(image.children.length, 1);

  const label = await render(VfAvatar, { ...props, image: undefined }, fallback);
  assert.equal(label.querySelector('.cm-avatar__label')?.textContent, 'AK');
  assert.equal(label.children.length, 1);

  const icon = await render(VfAvatar, { icon: props.icon, 'aria-label': 'Guest' }, fallback);
  const expectedIcon = await render(VueIconify, { icon: 'user', class: 'cm-avatar__icon', size: '1em' });
  assert.equal(icon.querySelector('svg')?.outerHTML, expectedIcon.outerHTML);
  assert.equal(icon.getAttribute('aria-label'), 'Guest');
  assert.equal(icon.getAttribute('icon'), null);
  assert.equal(icon.textContent, '');

  const slotted = await render(VfAvatar, null, fallback);
  assert.equal(slotted.textContent, 'Anonymous');
});
