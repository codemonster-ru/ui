import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CmProgressBar from './CmProgressBar.vue';

describe('CmProgressBar', () => {
  it('renders bounded determinate ARIA state and a rounded value label', () => {
    const wrapper = mount(CmProgressBar, {
      props: { label: 'Step progress', value: 7, max: 12, showValue: true },
    });

    expect(wrapper.attributes()).toMatchObject({
      role: 'progressbar',
      'aria-label': 'Step progress',
      'aria-valuemin': '0',
      'aria-valuemax': '12',
      'aria-valuenow': '7',
    });
    expect(wrapper.get('.cm-progress-bar__value').attributes('style')).toContain('inline-size: 58.333333333333336%');
    expect(wrapper.get('.cm-progress-bar__label').text()).toBe('58%');
  });

  it('normalizes invalid maximum and clamps determinate values', () => {
    const wrapper = mount(CmProgressBar, {
      props: { label: 'Upload progress', value: 140, max: 120 },
    });

    expect(wrapper.attributes('aria-valuemax')).toBe('120');
    expect(wrapper.attributes('aria-valuenow')).toBe('120');
    expect(wrapper.get('.cm-progress-bar__value').attributes('style')).toContain('inline-size: 100%');
  });

  it('omits numeric state and visible values while indeterminate', () => {
    const wrapper = mount(CmProgressBar, {
      props: { label: 'Synchronizing', indeterminate: true, showValue: true, tone: 'warning' },
    });

    expect(wrapper.classes()).toEqual([
      'cm-progress-bar',
      'cm-progress-bar--indeterminate',
      'cm-progress-bar--warning',
    ]);
    expect(wrapper.attributes('aria-valuemin')).toBeUndefined();
    expect(wrapper.attributes('aria-valuemax')).toBeUndefined();
    expect(wrapper.attributes('aria-valuenow')).toBeUndefined();
    expect(wrapper.get('.cm-progress-bar__value').attributes('style')).toBeUndefined();
    expect(wrapper.find('.cm-progress-bar__label').exists()).toBe(false);
  });

  it('preserves consumer classes and attributes without yielding owned semantics', () => {
    const wrapper = mount(CmProgressBar, {
      props: { label: 'Import progress', tone: 'success' },
      attrs: { class: 'consumer-progress', id: 'import', role: 'status', 'aria-valuenow': '999' },
    });

    expect(wrapper.classes()).toEqual(['cm-progress-bar', 'cm-progress-bar--success', 'consumer-progress']);
    expect(wrapper.attributes()).toMatchObject({ id: 'import', role: 'progressbar', 'aria-valuenow': '0' });
  });

  it('rejects an empty accessible label', () => {
    expect(() => mount(CmProgressBar, { props: { label: '  ' } })).toThrow(
      'ProgressBar label must be a non-empty string.',
    );
  });
});
