import { CmRuntime, createCmTabsController } from '@codemonster-ru/ui-runtime';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import CmTabs from './CmTabs.vue';

/**
 * A hybrid application is the reason two adapters exist: server-rendered pages enhanced by
 * CmRuntime, and Vue islands on the same document. Both own the same markup contract, so this
 * checks what happens when the runtime meets a component that already manages its own state.
 */
const items = [
  { value: 'overview', label: 'Overview' },
  { value: 'members', label: 'Members' },
];

function mountTabs() {
  return mount(CmTabs, {
    attachTo: document.body,
    props: { id: 'account', items },
    slots: { panelOverview: 'Overview panel', panelMembers: 'Members panel' },
  });
}

function startRuntime() {
  const runtime = new CmRuntime().register('tabs', createCmTabsController);
  runtime.start(document.body);
  return runtime;
}

describe('CmTabs under a running CmRuntime', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the controller hook the canonical DOM requires', () => {
    const wrapper = mountTabs();
    expect(wrapper.attributes('data-cm-controller')).toBe('tabs');
    wrapper.unmount();
  });

  it('keeps one owner of the selected tab when the runtime also attaches', async () => {
    const wrapper = mountTabs();
    const runtime = startRuntime();

    const tabs = wrapper.findAll('[role="tab"]');
    await tabs[1]!.trigger('click');

    // Vue owns this state declaratively; the controller writes the same attributes imperatively.
    // If both act, the emitted value and the rendered attributes can disagree.
    expect(wrapper.emitted('valueChange')).toEqual([['members']]);
    expect(tabs[1]!.attributes('aria-selected')).toBe('true');
    expect(tabs[0]!.attributes('aria-selected')).toBe('false');

    const panels = wrapper.findAll('[role="tabpanel"]');
    expect(panels[1]!.attributes('hidden')).toBeUndefined();
    expect(panels[0]!.attributes('hidden')).toBeDefined();

    runtime.stop();
    wrapper.unmount();
  });

  it('does not let the runtime override a controlled value the parent refused', async () => {
    // Controlled mode: the parent hears valueChange and decides not to move. Vue keeps rendering
    // the old tab, so this is where an imperative second owner would disagree with the markup.
    const wrapper = mount(CmTabs, {
      attachTo: document.body,
      props: { id: 'account', items, modelValue: 'overview' },
      slots: { panelOverview: 'Overview panel', panelMembers: 'Members panel' },
    });
    const runtime = startRuntime();

    const tabs = wrapper.findAll('[role="tab"]');
    await tabs[1]!.trigger('click');

    expect(wrapper.emitted('valueChange')).toEqual([['members']]);
    expect(tabs[0]!.attributes('aria-selected')).toBe('true');
    expect(tabs[1]!.attributes('aria-selected')).toBe('false');

    const panels = wrapper.findAll('[role="tabpanel"]');
    expect(panels[0]!.attributes('hidden')).toBeUndefined();
    expect(panels[1]!.attributes('hidden')).toBeDefined();

    runtime.stop();
    wrapper.unmount();
  });
});
