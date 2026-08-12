import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import CmButton from './CmButton.vue';

describe('CmButton', () => {
  it('renders the contract defaults', () => {
    const wrapper = mount(CmButton, {
      slots: { default: 'Save' },
    });

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.classes()).toEqual(['cm-button', 'cm-button--primary', 'cm-button--md']);
    expect(wrapper.attributes('type')).toBe('button');
    expect(wrapper.find('.cm-button__label').text()).toBe('Save');
  });

  it('renders variants, sizes, types, and disabled state', () => {
    const wrapper = mount(CmButton, {
      props: {
        variant: 'danger',
        size: 'lg',
        type: 'submit',
        disabled: true,
      },
    });

    expect(wrapper.classes()).toEqual(['cm-button', 'cm-button--danger', 'cm-button--lg']);
    expect(wrapper.attributes()).toMatchObject({ type: 'submit', disabled: '' });
  });

  it('merges classes and forwards safe root attributes', () => {
    const wrapper = mount(CmButton, {
      attrs: {
        class: ['consumer-button', { featured: true }],
        id: 'save',
        'data-testid': 'save-button',
      },
    });

    expect(wrapper.classes()).toEqual([
      'cm-button',
      'cm-button--primary',
      'cm-button--md',
      'consumer-button',
      'featured',
    ]);
    expect(wrapper.attributes()).toMatchObject({ id: 'save', 'data-testid': 'save-button' });
  });

  it('renders named icon regions around the label', () => {
    const wrapper = mount(CmButton, {
      slots: {
        leading: '<span aria-hidden="true">←</span>',
        default: 'Move',
        trailing: '<span aria-hidden="true">→</span>',
      },
    });

    expect(wrapper.find('.cm-button__leading').html()).toBe(
      '<span class="cm-button__leading"><span aria-hidden="true">←</span></span>',
    );
    expect(wrapper.find('.cm-button__label').text()).toBe('Move');
    expect(wrapper.find('.cm-button__trailing').html()).toBe(
      '<span class="cm-button__trailing"><span aria-hidden="true">→</span></span>',
    );
  });

  it('renders loading state in place of leading content', () => {
    const wrapper = mount(CmButton, {
      props: { loading: true },
      attrs: { 'aria-busy': 'false' },
      slots: {
        leading: '<span>authored icon</span>',
        default: 'Save',
      },
    });

    expect(wrapper.attributes()).toMatchObject({ disabled: '', 'aria-busy': 'true' });
    expect(wrapper.find('.cm-button__spinner').attributes('aria-hidden')).toBe('true');
    expect(wrapper.find('.cm-button__leading').exists()).toBe(false);
    expect(wrapper.find('.cm-button__label').text()).toBe('Save');
  });

  it('renders a non-empty href as an enabled link', async () => {
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
    const wrapper = mount(CmButton, {
      props: { href: '/docs', variant: 'ghost', type: 'submit' },
      attrs: { onClick },
      slots: { default: 'Documentation' },
    });

    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes()).toMatchObject({ href: '/docs' });
    expect(wrapper.attributes('type')).toBeUndefined();

    await wrapper.trigger('click');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('removes link activation while disabled', async () => {
    const onClick = vi.fn();
    const wrapper = mount(CmButton, {
      props: { href: '/docs', disabled: true },
      attrs: { onClick },
      slots: { default: 'Documentation' },
    });

    expect(wrapper.element.tagName).toBe('A');
    expect(wrapper.attributes()).toMatchObject({ role: 'link', 'aria-disabled': 'true' });
    expect(wrapper.attributes('href')).toBeUndefined();

    await wrapper.trigger('click');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('keeps empty href values in button mode', () => {
    const wrapper = mount(CmButton, {
      props: { href: '' },
    });

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.attributes('type')).toBe('button');
  });

  it('preserves native button click behavior', () => {
    const enabledClick = vi.fn();
    const disabledClick = vi.fn();
    const enabled = mount(CmButton, { attrs: { onClick: enabledClick } });
    const disabled = mount(CmButton, {
      props: { disabled: true },
      attrs: { onClick: disabledClick },
    });

    (enabled.element as HTMLButtonElement).click();
    (disabled.element as HTMLButtonElement).click();

    expect(enabledClick).toHaveBeenCalledOnce();
    expect(disabledClick).not.toHaveBeenCalled();
  });

  it('diagnoses and safely normalizes invalid finite props', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mount(CmButton, {
      props: {
        variant: 'unknown' as never,
        size: 'huge' as never,
        type: 'invalid' as never,
      },
    });

    expect(wrapper.classes()).toEqual(['cm-button', 'cm-button--primary', 'cm-button--md']);
    expect(wrapper.attributes('type')).toBe('button');
    expect(warning).toHaveBeenCalled();
    warning.mockRestore();
  });
});
