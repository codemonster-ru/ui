import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h, markRaw } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import { VfMenu, VfMenuItem } from '../historical';
import {
  CmBreadcrumbs,
  VfButton,
  VfConfirmDialog,
  VfFormLayout,
  VfGroupBox,
  VfPageHeader,
  VfPanel,
  VfSkeletonGate,
  createAsyncWithSkeleton,
} from '../index';

describe('historical form and surface compositions', () => {
  it('updates form alignment while preserving field markup and attributes', async () => {
    const wrapper = mount(VfFormLayout, {
      attrs: { id: 'profile-fields', class: 'profile-fields' },
      slots: { default: '<label>Email <input name="email"></label>' },
    });

    expect(wrapper.classes()).toEqual(['cm-form-layout', 'cm-form-layout--stacked', 'profile-fields']);
    expect(wrapper.attributes('id')).toBe('profile-fields');
    await wrapper.setProps({ mode: 'responsive', labelWidth: '12rem' });

    expect(wrapper.classes()).toContain('cm-form-layout--responsive');
    expect(wrapper.element.style.getPropertyValue('--cm-form-layout-label-width')).toBe('12rem');
    expect(wrapper.get('label > input').attributes('name')).toBe('email');
  });

  it('supports page header slots, heading level, and a navigation trail', async () => {
    const wrapper = mount(VfPageHeader, {
      props: { title: 'Project Atlas', breadcrumbs: [{ label: 'Projects', href: '/projects' }, { label: 'Atlas' }] },
      slots: { description: '<p>Release schedule</p>', actions: '<button>Deploy</button>' },
    });

    expect(wrapper.get('h1').text()).toBe('Project Atlas');
    expect(wrapper.get('nav[aria-label="Breadcrumb"] a').attributes('href')).toBe('/projects');
    expect(wrapper.get('nav [aria-current="page"]').text()).toBe('Atlas');
    expect(wrapper.get('.cm-page-header__description > p').text()).toBe('Release schedule');
    expect(wrapper.get('.cm-page-header__actions button').text()).toBe('Deploy');

    await wrapper.setProps({ headingLevel: 2, breadcrumbs: [] });
    expect(wrapper.get('h2').text()).toBe('Project Atlas');
    expect(wrapper.find('nav').exists()).toBe(false);
  });

  it('passes router destinations and link attributes through breadcrumbs', () => {
    const routerLink = defineComponent({
      props: { to: { type: Object, required: true } },
      setup(props, { slots }) {
        return () => h('a', { href: `/projects/${props.to.params.id}` }, slots.default?.());
      },
    });
    const wrapper = mount(CmBreadcrumbs, {
      props: {
        component: markRaw(routerLink),
        items: [
          { label: 'Project', to: { name: 'project', params: { id: 'atlas' } }, target: '_blank' },
          { label: 'Deployments' },
        ],
      },
      slots: { separator: ({ index }: { index: number }) => String(index) },
    });

    expect(wrapper.get('a').attributes()).toMatchObject({
      href: '/projects/atlas',
      target: '_blank',
      rel: 'noopener noreferrer',
    });
    expect(wrapper.get('.cm-breadcrumbs__separator').text()).toBe('0');
  });

  it('renders an optional panel heading and accepts a custom header', async () => {
    const panel = mount(VfPanel, { props: { title: 'Status' }, slots: { default: 'Operational' } });
    expect(panel.get('header h3').text()).toBe('Status');
    expect(panel.text()).toContain('Operational');
    await panel.setProps({ subtle: true, title: undefined });
    expect(panel.classes()).toContain('cm-panel--subtle');
    expect(panel.find('header').exists()).toBe(false);

    const titled = mount(VfPanel, { slots: { header: '<h2>Run history</h2>' } });
    expect(titled.get('header > h2').text()).toBe('Run history');
  });
});

describe('historical interactive compositions', () => {
  it('accepts the historical full-width button variants through the Vue export', async () => {
    const button = mount(VfButton, { props: { variant: 'success', block: true }, slots: { default: 'Save' } });
    expect(button.classes()).toEqual(['cm-button', 'cm-button--success', 'cm-button--md', 'cm-button--block']);
    for (const variant of ['info', 'warn', 'help', 'contrast'] as const) {
      await button.setProps({ variant });
      expect(button.classes()).toContain(`cm-button--${variant}`);
    }
  });

  it('renders consumer-composed menu items and guards disabled destinations', async () => {
    const onSelect = vi.fn();
    const menu = mount(VfMenu, {
      slots: {
        default: () => [
          h(VfMenuItem, { label: 'Open', href: '/project', target: '_blank', icon: 'link', onSelect }),
          h(VfMenuItem, { label: 'Delete', tone: 'danger', href: '/delete', disabled: true, onSelect }),
        ],
      },
    });
    expect(menu.attributes('role')).toBe('menu');
    const [open, remove] = menu.findAll('[role="menuitem"]');
    expect(open!.attributes()).toMatchObject({ href: '/project', target: '_blank', rel: 'noopener noreferrer' });
    expect(open!.get('svg').attributes('aria-hidden')).toBe('true');
    expect(remove!.attributes()).toMatchObject({ tabindex: '-1', 'aria-disabled': 'true' });
    expect(remove!.attributes('href')).toBeUndefined();
    await remove!.trigger('click');
    expect(onSelect).not.toHaveBeenCalled();
    await open!.trigger('click');
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('keeps group state controlled when collapsed is supplied', async () => {
    const group = mount(VfGroupBox, {
      props: { collapsible: true, collapsed: true },
      slots: {
        title: ({ collapsed }: { collapsed: boolean }) => (collapsed ? 'Show details' : 'Hide details'),
        default: '<input name="details">',
      },
    });
    const trigger = group.get('legend button');
    const region = group.get('[role="region"]');
    expect(trigger.text()).toBe('Show details');
    expect(trigger.attributes('aria-controls')).toBe(region.attributes('id'));
    expect(trigger.attributes('aria-expanded')).toBe('false');
    expect(region.attributes('hidden')).toBe('');
    const input = region.get('input');
    expect(input.element.matches(':disabled')).toBe(true);
    await trigger.trigger('click');
    expect(group.emitted('update:collapsed')).toEqual([[false]]);
    expect(group.emitted('collapsedChange')).toEqual([[false]]);
    expect(region.attributes('hidden')).toBe('');
    await group.setProps({ collapsed: false });
    await input.setValue('PO-456');
    await group.setProps({ collapsed: true });
    expect(region.attributes('hidden')).toBe('');
    await group.setProps({ collapsed: false, disabled: true });
    expect(trigger.text()).toBe('Hide details');
    expect(trigger.attributes('aria-expanded')).toBe('true');
    expect(region.attributes('hidden')).toBeUndefined();
    expect(region.get('input').element).toBe(input.element);
    expect(input.element.value).toBe('PO-456');
    expect(input.element.matches(':disabled')).toBe(false);
    await trigger.trigger('click');
    expect(group.emitted('update:collapsed')).toEqual([[false]]);
  });

  it('uses an uncontrolled group default only when disclosure is enabled', async () => {
    const group = mount(VfGroupBox, {
      props: { title: 'Shipping', collapsible: true, defaultCollapsed: true },
      slots: { default: 'Address' },
    });
    expect(group.get('button').attributes('aria-expanded')).toBe('false');
    await group.get('button').trigger('click');
    expect(group.text()).toContain('Address');
    await group.setProps({ collapsible: false, collapsed: true });
    expect(group.get('legend').text()).toBe('Shipping');
    expect(group.text()).toContain('Address');
  });

  it('takes loading content out of the accessibility tree and restores the same DOM node', async () => {
    const gate = mount(VfSkeletonGate, {
      props: { minHeight: 80, reserveHeight: '6rem', radius: '1rem' },
      slots: { default: '<button type="button">Continue</button>', skeleton: '<span>Placeholder</span>' },
    });
    const content = gate.get('.cm-skeleton-gate__content');
    const button = content.get('button').element;
    expect(gate.attributes('aria-busy')).toBe('true');
    expect(gate.element.style.minHeight).toBe('6rem');
    expect(content.attributes('aria-hidden')).toBe('true');
    expect(content.element.hasAttribute('inert')).toBe(true);
    await gate.setProps({ ready: true, normalizeContentSpacing: true });
    expect(gate.attributes('aria-busy')).toBeUndefined();
    expect(content.attributes('aria-hidden')).toBeUndefined();
    expect(content.attributes('inert')).toBeUndefined();
    expect(content.classes()).toContain('cm-skeleton-gate__content--normalize-spacing');
    expect(content.get('button').element).toBe(button);
    expect(gate.get('.cm-skeleton-gate__overlay').isVisible()).toBe(false);
  });

  it('keeps the observed height for a subsequent loading state and cleans up', async () => {
    let measure: ResizeObserverCallback | undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          measure = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    try {
      const gate = mount(VfSkeletonGate, { props: { ready: true, reserveHeight: 80, preserveLastHeight: true } });
      const content = gate.get('.cm-skeleton-gate__content');
      Object.defineProperty(content.element, 'offsetHeight', { value: 120 });
      measure?.([], {} as ResizeObserver);
      await gate.setProps({ ready: false });
      expect(gate.element.style.minHeight).toBe('120px');
      gate.unmount();
      expect(disconnect).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('shows a skeleton while the async component loads and forwards attributes on resolution', async () => {
    const resolved = defineComponent({
      props: { height: Number },
      setup(props) {
        return () => h('p', `Chart ${props.height}`);
      },
    });
    let finish: ((component: typeof resolved) => void) | undefined;
    const component = createAsyncWithSkeleton({
      loader: () => new Promise<typeof resolved>((resolve) => (finish = resolve)),
      radius: '1rem',
    });
    const host = defineComponent({ setup: () => () => h('section', [h(component, { height: 240 })]) });
    const wrapper = mount(host);
    const placeholder = wrapper.get<HTMLDivElement>('.cm-skeleton');
    expect(placeholder.element.style.minHeight).toBe('240px');
    expect(placeholder.element.style.borderRadius).toBe('1rem');
    finish?.(resolved);
    await flushPromises();
    expect(wrapper.get('p').text()).toBe('Chart 240');
  });

  it('focuses the safer action first and blocks every dismissal while loading', async () => {
    const target = document.createElement('div');
    document.body.append(target);
    const wrapper = mount(VfConfirmDialog, {
      attachTo: document.body,
      props: { teleportTo: target, open: true, description: 'This action cannot be undone.' },
    });
    try {
      await wrapper.vm.$nextTick();
      const dialog = target.querySelector('dialog')!;
      const description = target.querySelector('.cm-dialog__description')!;
      expect(document.activeElement?.textContent).toBe('Cancel');
      expect(dialog.getAttribute('aria-describedby')).toBe(description.id);
      await wrapper.setProps({ loading: true });
      expect(dialog.querySelector('.cm-dialog__close')).toBeNull();
      for (const button of dialog.querySelectorAll('button')) button.click();
      dialog.click();
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(wrapper.emitted('update:open')).toBeUndefined();
      expect(wrapper.emitted('cancel')).toBeUndefined();
      expect(wrapper.emitted('confirm')).toBeUndefined();
      expect(dialog.open).toBe(true);
    } finally {
      wrapper.unmount();
      target.remove();
    }
  });

  it('confirms without closing when requested and reports cancellation', async () => {
    const wrapper = mount(VfConfirmDialog, {
      props: { disableTeleport: true, open: true, closeOnConfirm: false },
    });
    const [cancel, confirm] = wrapper.findAll('.cm-confirm-dialog__actions button');
    await confirm!.trigger('click');
    expect(wrapper.emitted('confirm')).toEqual([[]]);
    expect(wrapper.emitted('update:open')).toBeUndefined();
    await cancel!.trigger('click');
    expect(wrapper.emitted('cancel')).toEqual([[]]);
    expect(wrapper.emitted('update:open')).toEqual([[false]]);
  });
});
