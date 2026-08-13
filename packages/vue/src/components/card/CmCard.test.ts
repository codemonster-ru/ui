import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import CmCard from './CmCard.vue';

describe('CmCard', () => {
  it('renders body-only contract defaults', () => {
    const wrapper = mount(CmCard, { slots: { default: '<p>Project summary</p>' } });

    expect(wrapper.element.tagName).toBe('SECTION');
    expect(wrapper.classes()).toEqual(['cm-card']);
    expect(wrapper.find('.cm-card__header').exists()).toBe(false);
    expect(wrapper.find('.cm-card__body').find('p').text()).toBe('Project summary');
    expect(wrapper.find('.cm-card__footer').exists()).toBe(false);
  });

  it('renders custom regions in contract order and overrides the title', () => {
    const wrapper = mount(CmCard, {
      props: { title: 'Ignored fallback' },
      slots: {
        header: '<h2>Project</h2>',
        default: '<p>Summary</p>',
        footer: '<button type="button">Continue</button>',
      },
    });

    expect(wrapper.find('.cm-card__title').exists()).toBe(false);
    expect(wrapper.element.children).toHaveLength(3);
    expect([...wrapper.element.children].map((element) => element.tagName)).toEqual(['HEADER', 'DIV', 'FOOTER']);
  });

  it('forwards root attributes and merges compact consumer classes', () => {
    const wrapper = mount(CmCard, {
      props: { compact: true, element: 'article' },
      attrs: { class: 'consumer', id: 'summary' },
    });

    expect(wrapper.element.tagName).toBe('ARTICLE');
    expect(wrapper.classes()).toEqual(['cm-card', 'cm-card--compact', 'consumer']);
    expect(wrapper.attributes('id')).toBe('summary');
  });

  it('diagnoses and falls back from invalid semantic roots', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mount(CmCard, { props: { element: 'main' as never } });

    expect(wrapper.element.tagName).toBe('SECTION');
    expect(warning).toHaveBeenCalled();
    warning.mockRestore();
  });
});
