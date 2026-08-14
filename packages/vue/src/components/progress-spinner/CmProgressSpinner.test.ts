import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CmProgressSpinner from './CmProgressSpinner.vue';

describe('CmProgressSpinner', () => {
  it('renders labelled indeterminate progress with owned SVG geometry', () => {
    const wrapper = mount(CmProgressSpinner, { props: { label: 'Loading reports' } });

    expect(wrapper.classes()).toEqual(['cm-progress-spinner', 'cm-progress-spinner--md']);
    expect(wrapper.attributes()).toMatchObject({ role: 'progressbar', 'aria-label': 'Loading reports' });
    expect(wrapper.attributes('aria-valuenow')).toBeUndefined();
    expect(wrapper.get('svg').attributes()).toMatchObject({
      viewBox: '0 0 50 50',
      'aria-hidden': 'true',
      focusable: 'false',
    });
    expect(wrapper.findAll('circle')).toHaveLength(2);
    expect(wrapper.findAll('circle')[1]?.attributes('stroke-width')).toBe('4');
  });

  it('applies finite size and tone modifiers while forwarding root attributes', () => {
    const wrapper = mount(CmProgressSpinner, {
      props: { label: 'Removing project', size: 'lg', tone: 'danger' },
      attrs: {
        class: 'consumer-spinner',
        id: 'remove-progress',
        role: 'status',
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': '50',
      },
    });

    expect(wrapper.classes()).toEqual([
      'cm-progress-spinner',
      'cm-progress-spinner--lg',
      'cm-progress-spinner--danger',
      'consumer-spinner',
    ]);
    expect(wrapper.attributes()).toMatchObject({ id: 'remove-progress', role: 'progressbar' });
    expect(wrapper.attributes('aria-valuemin')).toBeUndefined();
    expect(wrapper.attributes('aria-valuemax')).toBeUndefined();
    expect(wrapper.attributes('aria-valuenow')).toBeUndefined();
  });

  it('rejects an empty accessible label', () => {
    expect(() => mount(CmProgressSpinner, { props: { label: '' } })).toThrow(
      'ProgressSpinner label must be a non-empty string.',
    );
  });
});
