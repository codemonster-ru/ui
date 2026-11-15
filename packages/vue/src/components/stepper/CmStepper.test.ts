import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';

import CmStepper from './CmStepper.vue';

const items = [
  { value: 'account', label: 'Account' },
  { value: 'billing', label: 'Billing', disabled: true },
  { value: 'review"]', label: 'Review' },
];

it('keeps a controlled Stepper current until the caller accepts the requested step', async () => {
  const wrapper = mount(CmStepper, { attachTo: document.body, props: { items, modelValue: 'account' } });
  const [account, , review] = wrapper.findAll('button');
  await account.trigger('keydown', { key: 'ArrowRight' });
  expect(document.activeElement).toBe(review.element);
  expect(wrapper.get('[aria-current="step"]').element).toBe(account.element);
  expect(wrapper.emitted('update:modelValue')).toEqual([['review"]']]);
  expect(wrapper.emitted('change')).toEqual([['review"]']]);

  await wrapper.setProps({ modelValue: 'review"]' });
  expect(wrapper.get('[aria-current="step"]').element).toBe(review.element);
  wrapper.unmount();
});

it('uses the historical default and adopts a fallback when that step is removed', async () => {
  const wrapper = mount(CmStepper, { props: { items, defaultValue: 'review"]' } });
  expect(wrapper.get('[aria-current="step"]').text()).toContain('Review');

  await wrapper.setProps({ items: items.slice(0, 2) });
  expect(wrapper.get('[aria-current="step"]').text()).toContain('Account');
  expect(wrapper.emitted('change')).toEqual([['account']]);
  await wrapper.setProps({ items });
  expect(wrapper.get('[aria-current="step"]').text()).toContain('Account');
  wrapper.unmount();
});

it('preserves immediate value bindings and resolves content placement for the current axis', async () => {
  const wrapper = mount(CmStepper, { props: { items, value: 'account', contentPosition: 'above' } });
  expect(wrapper.classes()).toContain('cm-stepper--content-above');
  await wrapper.findAll('button')[2].trigger('click');
  expect(wrapper.get('[aria-current="step"]').text()).toContain('Review');
  expect(wrapper.emitted('update:value')).toEqual([['review"]']]);

  await wrapper.setProps({ orientation: 'vertical', contentPosition: 'start' });
  expect(wrapper.classes()).toContain('cm-stepper--content-start');
  expect(wrapper.classes()).not.toContain('cm-stepper--content-above');
  await wrapper.setProps({ contentPosition: 'inline' });
  expect(wrapper.classes()).toContain('cm-stepper--content-inline');
  await wrapper.setProps({ contentPosition: 'end' });
  expect(wrapper.classes()).toEqual(['cm-stepper', 'cm-stepper--vertical']);
  wrapper.unmount();
});
