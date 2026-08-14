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

  it('composes trusted per-item trigger and panel content', () => {
    const wrapper = mount(CmAccordion, {
      props: { id: 'faq', items, defaultOpenItems: ['account'] },
      slots: {
        triggerAccount: '<span>Account <small>recommended</small></span>',
        panelAccount: '<p>Manage your <a href="/account">account</a>.</p>',
      },
    });

    expect(wrapper.get('#faq-account-trigger').html()).toContain('<small>recommended</small>');
    expect(wrapper.get('#faq-account-panel').html()).toContain('<a href="/account">account</a>');
    expect(wrapper.get('#faq-billing-trigger').text()).toBe('Billing');
    expect(wrapper.get('#faq-billing-panel').text()).toBe('Billing answer.');
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

  it('reports controlled state without mutating rendered panels', async () => {
    const wrapper = mount(CmAccordion, { props: { id: 'faq', items, openItems: ['account'] } });

    await wrapper.get('#faq-billing-trigger').trigger('click');

    expect(wrapper.get('#faq-account-trigger').attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('#faq-billing-trigger').attributes('aria-expanded')).toBe('false');
    expect(wrapper.emitted('update:openItems')).toEqual([[['billing']]]);
  });

  it('keeps independent ordered state in multiple mode', async () => {
    const wrapper = mount(CmAccordion, { props: { id: 'faq', items, multiple: true } });

    await wrapper.get('#faq-billing-trigger').trigger('click');
    await wrapper.get('#faq-account-trigger').trigger('click');

    const updates = wrapper.emitted('update:openItems') ?? [];
    expect(updates[updates.length - 1]).toEqual([['account', 'billing']]);
    expect(wrapper.findAll('.cm-accordion__panel').every((panel) => panel.attributes('hidden') === undefined)).toBe(
      true,
    );
  });

  it('ignores disabled activation and skips disabled triggers during focus navigation', async () => {
    const wrapper = mount(CmAccordion, {
      attachTo: document.body,
      props: {
        id: 'faq',
        items: [items[0], { ...items[1], disabled: true }, { id: 'security', title: 'Security', content: 'Secure.' }],
      },
    });
    const triggers = wrapper.findAll<HTMLButtonElement>('.cm-accordion__trigger');

    await triggers[1].trigger('click');
    triggers[0].element.focus();
    await triggers[0].trigger('keydown', { key: 'ArrowDown' });

    expect(wrapper.emitted('openChange')).toBeUndefined();
    expect(document.activeElement).toBe(triggers[2].element);

    await triggers[2].trigger('keydown', { key: 'Home' });
    expect(document.activeElement).toBe(triggers[0].element);
    await triggers[0].trigger('keydown', { key: 'ArrowUp' });
    expect(document.activeElement).toBe(triggers[2].element);
    wrapper.unmount();
  });
});
