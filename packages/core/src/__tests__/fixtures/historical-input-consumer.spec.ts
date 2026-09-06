// Runtime half of the historical consumer gate: the unchanged fixture in
// HistoricalInputConsumer.vue must keep compiling (vue-tsc) and keep working.
// A migration step that needs this file edited has changed the public contract.
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

vi.mock('@codemonster-ru/vueforge-icons', () => ({
  VueIconify: {
    name: 'VueIconifyConsumerStub',
    props: ['icon', 'size'],
    template: '<span class="vf-icon" :data-icon="icon" aria-hidden="true" />',
  },
  icons: new Proxy(
    {},
    {
      get: (_target, property) => String(property),
    },
  ),
}));

import HistoricalInputConsumer from './HistoricalInputConsumer.vue';

describe('historical VfInput consumer fixture', () => {
  it('renders every historical usage without changes to the consumer source', async () => {
    const wrapper = mount(HistoricalInputConsumer, { attachTo: document.body });
    await nextTick();

    const inputs = wrapper.findAll('input');
    expect(inputs).toHaveLength(6);

    // Floating field integration is still driven by the input.
    expect(wrapper.find('.vf-field--floating').exists()).toBe(true);
    expect(wrapper.find('.vf-field__control--filled').exists()).toBe(true);
    expect(wrapper.get('.vf-field__label--floating .vf-field__required-mark').text()).toBe('*');

    // Icon props still render on both sides of the search control.
    const search = wrapper.get('.historical-consumer__search');
    expect(search.get('.vf-input-wrap__icon--leading .vf-icon').attributes('data-icon')).toBe('magnifyingGlass');
    expect(search.get('.vf-input-wrap__icon--trailing .vf-icon').attributes('data-icon')).toBe('circleInfo');
    expect(search.get('input').attributes('type')).toBe('search');

    // Native types survive attribute forwarding.
    expect(wrapper.get('input[name="seats"]').attributes('type')).toBe('number');
    expect(wrapper.get('input[name="seats"]').attributes('min')).toBe('1');
    expect(wrapper.get('input[name="starts-on"]').attributes('type')).toBe('date');
    expect(wrapper.get('input[name="password"]').attributes('type')).toBe('password');
    expect(wrapper.get('input[name="workspace"]').attributes('autocomplete')).toBe('organization');

    // Slots still replace the icon props inside the adornment spans.
    const amount = wrapper.get('.historical-consumer__amount');
    expect(amount.get('.vf-input-wrap__icon--leading').text()).toBe('$');
    expect(amount.get('.vf-input-wrap__icon--trailing').text()).toBe('USD');
    expect(amount.element.tagName).toBe('DIV');
  });

  it('still emits update:modelValue to the consumer handler and clears on demand', async () => {
    const wrapper = mount(HistoricalInputConsumer, { attachTo: document.body });
    const search = wrapper.get('.historical-consumer__search');

    await search.get('input').setValue('billing');

    expect(wrapper.get('.historical-consumer__echo').text()).toBe('billing');
    expect(search.find('.vf-input-wrap__clear').exists()).toBe(true);

    await search.get('.vf-input-wrap__clear').trigger('click');

    expect(wrapper.get('.historical-consumer__echo').text()).toBe('');
    expect(search.get('input').element.value).toBe('');
  });

  it('still reveals the password and keeps the clear control alongside it', async () => {
    const wrapper = mount(HistoricalInputConsumer, { attachTo: document.body });
    const password = wrapper.get('input[name="password"]').element.closest('.vf-input-wrap');
    expect(password).not.toBeNull();

    const toggle = wrapper.get('.vf-input-wrap__password-toggle');
    expect(wrapper.get('.vf-input-wrap__clear').attributes('aria-label')).toBe('Clear input');
    expect(toggle.attributes('aria-label')).toBe('Show password');

    await toggle.trigger('click');

    expect(wrapper.get('input[name="password"]').attributes('type')).toBe('text');
    expect(toggle.attributes('aria-pressed')).toBe('true');
  });

  it('keeps the readonly input free of a clear control', () => {
    const wrapper = mount(HistoricalInputConsumer, { attachTo: document.body });
    const amount = wrapper.get('.historical-consumer__amount');

    expect(amount.get('input').attributes('readonly')).toBeDefined();
    expect(amount.find('.vf-input-wrap__clear').exists()).toBe(false);
  });
});
