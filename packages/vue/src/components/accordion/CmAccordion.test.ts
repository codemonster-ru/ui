import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CmAccordion from './CmAccordion.vue';

const items = [
  { id: 'account', title: 'Account', content: 'Account answer.' },
  { id: 'billing', title: 'Billing', content: 'Billing answer.' },
] as const;

describe('CmAccordion', () => {
  it('renders canonical disclosure relationships', () => {
    const wrapper = mount(CmAccordion, { props: { id: 'faq', items, defaultOpenItems: ['account'] } });

    expect(wrapper.attributes('data-cm-controller')).toBe('accordion');
    expect(wrapper.get('#faq-account-trigger').attributes()).toMatchObject({
      'aria-controls': 'faq-account-panel',
      'aria-expanded': 'true',
    });
    expect(wrapper.get('#faq-account-panel').attributes('aria-labelledby')).toBe('faq-account-trigger');
  });

  it('updates uncontrolled state and emits ordered item ids', async () => {
    const wrapper = mount(CmAccordion, { props: { id: 'faq', items } });

    await wrapper.get('#faq-billing-trigger').trigger('click');

    expect(wrapper.get('#faq-billing-trigger').attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('#faq-billing-panel').attributes('hidden')).toBeUndefined();
    expect(wrapper.emitted('update:openItems')).toEqual([[['billing']]]);
    expect(wrapper.emitted('openChange')).toEqual([[{ openItems: ['billing'] }]]);
  });

  it('rejects invalid item contracts', () => {
    expect(() => mount(CmAccordion, { props: { id: 'faq', items: [...items, items[0]] } })).toThrow(
      /Invalid Accordion item/u,
    );
  });
});
