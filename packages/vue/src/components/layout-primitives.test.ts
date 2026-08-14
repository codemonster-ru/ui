import { mount } from '@vue/test-utils';
import type { Component } from 'vue';
import { describe, expect, it } from 'vitest';

import CmContainer from './container/CmContainer.vue';
import CmGrid from './grid/CmGrid.vue';
import CmInline from './inline/CmInline.vue';
import CmSection from './section/CmSection.vue';
import CmStack from './stack/CmStack.vue';

describe('Vue layout primitives', () => {
  const semanticCases: Array<{ component: Component; elements: string[]; name: string }> = [
    { component: CmContainer, elements: ['div', 'main', 'section'], name: 'Container' },
    { component: CmStack, elements: ['div', 'section', 'ul', 'ol'], name: 'Stack' },
    { component: CmInline, elements: ['div', 'nav', 'ul'], name: 'Inline' },
    { component: CmSection, elements: ['section', 'div', 'article', 'aside'], name: 'Section' },
    { component: CmGrid, elements: ['div', 'section', 'ul', 'ol'], name: 'Grid' },
  ];

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

  it.each(['md', 'lg', 'xl', '2xl'] as const)('renders the Container %s size', (size) => {
    expect(mount(CmContainer, { props: { size } }).classes()).toEqual(['cm-container', `cm-container--${size}`]);
  });

  it.each(semanticCases)('renders approved $name roots and forwards consumer attributes', ({ component, elements }) => {
    for (const element of elements) {
      const wrapper = mount(component, {
        attrs: { class: 'consumer', 'data-layout': element },
        props: { element },
        slots: { default: 'Content' },
      });
      expect(wrapper.element.tagName).toBe(element.toUpperCase());
      expect(wrapper.classes()).toContain('consumer');
      expect(wrapper.attributes('data-layout')).toBe(element);
      expect(wrapper.text()).toBe('Content');
    }
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
