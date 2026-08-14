import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import CmIconButton from './CmIconButton.vue';

describe('CmIconButton', () => {
  it('renders the accessible contract defaults and decorative trusted icon content', () => {
    const wrapper = mount(CmIconButton, {
      props: { label: 'Search' },
      slots: { default: '<svg data-icon="search"></svg>' },
    });

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.classes()).toEqual(['cm-icon-button', 'cm-icon-button--ghost', 'cm-icon-button--md']);
    expect(wrapper.attributes()).toMatchObject({ type: 'button', 'aria-label': 'Search' });
    expect(wrapper.find('.cm-icon-button__icon').attributes('aria-hidden')).toBe('true');
    expect(wrapper.find('[data-icon="search"]').exists()).toBe(true);
  });

  it('renders finite configuration and disabled state', () => {
    const wrapper = mount(CmIconButton, {
      props: { label: 'Delete', variant: 'danger', size: 'lg', type: 'submit', disabled: true },
    });

    expect(wrapper.classes()).toEqual(['cm-icon-button', 'cm-icon-button--danger', 'cm-icon-button--lg']);
    expect(wrapper.attributes()).toMatchObject({ type: 'submit', disabled: '', 'aria-label': 'Delete' });
  });

  it('merges classes, forwards safe root attributes, and preserves native activation', async () => {
    const onClick = vi.fn();
    const wrapper = mount(CmIconButton, {
      props: { label: 'Settings' },
      attrs: {
        class: ['consumer', { featured: true }],
        id: 'settings',
        'data-testid': 'settings-button',
        onClick,
      },
    });

    expect(wrapper.classes()).toEqual([
      'cm-icon-button',
      'cm-icon-button--ghost',
      'cm-icon-button--md',
      'consumer',
      'featured',
    ]);
    expect(wrapper.attributes()).toMatchObject({ id: 'settings', 'data-testid': 'settings-button' });
    await wrapper.trigger('click');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('owns semantic attributes and normalizes invalid finite props', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mount(CmIconButton, {
      props: { label: 'More', variant: 'unknown' as never, size: 'huge' as never, type: 'invalid' as never },
      attrs: { 'aria-label': 'Override', type: 'reset' },
    });

    expect(wrapper.classes()).toEqual(['cm-icon-button', 'cm-icon-button--ghost', 'cm-icon-button--md']);
    expect(wrapper.attributes()).toMatchObject({ type: 'button', 'aria-label': 'More' });
    expect(warning).toHaveBeenCalled();
    warning.mockRestore();
  });

  it('diagnoses an empty accessible label', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    mount(CmIconButton, { props: { label: ' ' } });
    expect(warning).toHaveBeenCalled();
    warning.mockRestore();
  });
});
