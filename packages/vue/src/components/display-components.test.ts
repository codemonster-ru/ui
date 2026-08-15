import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CmAlert from './alert/CmAlert.vue';
import CmAvatar from './avatar/CmAvatar.vue';
import CmBadge from './badge/CmBadge.vue';
import CmDivider from './divider/CmDivider.vue';
import CmSkeleton from './skeleton/CmSkeleton.vue';

describe('display components', () => {
  it('renders Badge tone and consumer attributes', () => {
    const wrapper = mount(CmBadge, {
      attrs: { title: 'Status' },
      props: { tone: 'danger' },
      slots: { default: 'Blocked' },
    });
    expect(wrapper.classes()).toEqual(['cm-badge', 'cm-badge--danger']);
    expect(wrapper.attributes('title')).toBe('Status');
  });

  it('renders Alert slot priority and a consumer live role', () => {
    const wrapper = mount(CmAlert, {
      attrs: { role: 'alert' },
      props: { tone: 'danger', title: 'Ignored' },
      slots: { default: 'Body', icon: '!', title: 'Failed' },
    });
    expect(wrapper.attributes('role')).toBe('alert');
    expect(wrapper.get('.cm-alert__icon').attributes('aria-hidden')).toBe('true');
    expect(wrapper.get('.cm-alert__title').text()).toBe('Failed');
  });

  it('keeps the default info Alert surface canonical while marking the primary tone', () => {
    const primary = mount(CmAlert, { props: { tone: 'primary' }, slots: { default: 'Primary' } });
    const info = mount(CmAlert, { slots: { default: 'Info' } });

    expect(primary.classes()).toEqual(['cm-alert', 'cm-alert--primary']);
    expect(info.classes()).toEqual(['cm-alert']);
    expect(info.attributes('role')).toBe('status');
  });

  it('prioritizes Avatar image then label then fallback content', async () => {
    const wrapper = mount(CmAvatar, {
      props: { image: '/a.png', imageAlt: 'Ada', label: 'AK' },
      slots: { default: '?' },
    });
    expect(wrapper.get('img').attributes('alt')).toBe('Ada');
    await wrapper.setProps({ image: null });
    expect(wrapper.get('.cm-avatar__label').text()).toBe('AK');
    await wrapper.setProps({ label: null });
    expect(wrapper.text()).toBe('?');
  });

  it('owns Divider semantics', () => {
    const wrapper = mount(CmDivider, {
      attrs: { role: 'none', 'aria-orientation': 'horizontal' },
      props: { orientation: 'vertical' },
    });
    expect(wrapper.element.tagName).toBe('HR');
    expect(wrapper.attributes()).toMatchObject({ role: 'separator', 'aria-orientation': 'vertical' });
  });

  it('normalizes Skeleton height and rejects unsafe CSS values', () => {
    const wrapper = mount(CmSkeleton, { props: { animated: false, minHeight: 48, radius: 'control' } });
    expect(wrapper.attributes('style')).toContain('min-height: 48px');
    expect(() => mount(CmSkeleton, { props: { minHeight: 'calc(100% - 1px)' } })).toThrow(/non-negative CSS length/u);
  });
});
