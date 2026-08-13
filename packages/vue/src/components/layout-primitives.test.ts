import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CmContainer from './container/CmContainer.vue';
import CmGrid from './grid/CmGrid.vue';
import CmInline from './inline/CmInline.vue';
import CmSection from './section/CmSection.vue';
import CmStack from './stack/CmStack.vue';

describe('Vue layout primitives', () => {
  it('lets fluid Container override size and forwards root attributes', () => {
    const wrapper = mount(CmContainer, {
      attrs: { class: 'consumer', 'aria-label': 'Workspace' },
      props: { element: 'main', fluid: true, size: 'lg' },
      slots: { default: 'Content' },
    });
    expect(wrapper.element.tagName).toBe('MAIN');
    expect(wrapper.classes()).toEqual(['cm-container', 'cm-container--fluid', 'consumer']);
    expect(wrapper.attributes('aria-label')).toBe('Workspace');
  });

  it('renders the stable Stack, Inline, Section, and Grid modifiers', () => {
    expect(mount(CmStack, { slots: { default: 'Items' } }).classes()).toEqual(['cm-stack']);
    expect(mount(CmInline, { props: { wrap: false } }).classes()).toEqual(['cm-inline', 'cm-inline--nowrap']);
    expect(mount(CmSection, { props: { element: 'article', surface: true } }).classes()).toEqual([
      'cm-section',
      'cm-section--surface',
    ]);
    expect(mount(CmGrid).classes()).toEqual(['cm-grid']);
  });
});
