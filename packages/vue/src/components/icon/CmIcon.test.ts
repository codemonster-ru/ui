import { arrowLeft, github, moon } from '@codemonster-ru/ui-icons';
import { renderToString } from '@vue/server-renderer';
import { mount } from '@vue/test-utils';
import { createSSRApp, h } from 'vue';
import { describe, expect, it } from 'vitest';

import CmIcon from './CmIcon.vue';
import VueIconify from './VueIconify.vue';

describe('Vue icon rendering', () => {
  it('uses historical sizing, inset and accent props with the shared geometry', () => {
    const wrapper = mount(VueIconify, {
      props: {
        icon: 'arrow-left',
        size: 20,
        spin: true,
        inset: 0.25,
        family: 'duotone',
        secondaryColor: 'red',
        secondaryOpacity: 0.6,
      },
      attrs: { 'aria-label': 'Back' },
    });
    const svg = wrapper.get('svg');
    expect(svg.attributes('aria-label')).toBe('Back');
    expect(svg.attributes('role')).toBe('img');
    expect(svg.classes()).toContain('cm-icon--spin');
    expect(svg.attributes('style')).toContain('--cm-icon-size: 20px');
    expect(svg.attributes('style')).toContain('--cm-icon-scale: 0.5');
    expect(svg.attributes('style')).toContain('--vf-icon-secondary-color: red');
    expect(svg.attributes('style')).toContain('--vf-icon-secondary-opacity: 0.6');
    expect(svg.find('clipPath').exists()).toBe(true);
  });

  it('defaults to moon for an omitted or unknown name and to solid for brand marks', async () => {
    const wrapper = mount(VueIconify);
    const svg = wrapper.get('svg');
    expect(svg.attributes('aria-hidden')).toBe('true');
    expect(svg.element.innerHTML).toBe(moon['classic/regular']?.body);
    await wrapper.setProps({ icon: 'unknown-icon' });
    expect(svg.element.innerHTML).toBe(moon['classic/regular']?.body);
    await wrapper.setProps({ icon: 'github' });
    expect(svg.classes()).toContain('cm-icon--solid');
    expect(svg.get('path').attributes('d')).toBe(github['classic/solid']?.body.match(/\sd="([^"]+)"/u)?.[1]);
  });

  it('keeps the first-class geometry API and paints a brand using its actual rendering', () => {
    const wrapper = mount(CmIcon, { props: { icon: github, family: 'duotone', variant: 'thin', label: 'GitHub' } });
    expect(wrapper.classes()).toEqual(['cm-icon', 'cm-icon--solid', 'cm-icon--classic']);
    expect(wrapper.attributes('aria-label')).toBe('GitHub');
  });

  it('omits unused style attributes in server-rendered canonical SVG', async () => {
    const html = await renderToString(h(CmIcon, { icon: arrowLeft }));
    expect(html).not.toContain('style=');
  });

  it('generates unique yet deterministic IDs for server-rendered duotone references', async () => {
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h('div', [
              h(CmIcon, { icon: arrowLeft, family: 'duotone' }),
              h(CmIcon, { icon: arrowLeft, family: 'duotone' }),
            ]),
        }),
      );
    const html = await render();
    expect(await render()).toBe(html);
    const ids = [...html.matchAll(/\sid="([^"]+)"/gu)].map(([, id]) => id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(html).toContain(`url(#${id})`);
  });
});
