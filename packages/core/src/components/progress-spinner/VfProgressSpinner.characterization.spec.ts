// Characterization of the historical VfProgressSpinner at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The M20 component, and the one whose markup the Razor adapter has been
// rendering since M12 without ever having pinned the public contract - the
// button's loading state composed it, and only the subset the button used was
// ever asserted. This suite pins the whole of it, standalone, and deliberately
// imports nothing from the button: a button defect must not be able to reach
// this file, which is half of the dependency-direction proof.
//
// What is worth reading first, because each is easy to get wrong in a port:
//
//   - the spinner is not decorative. The root carries role=progressbar and an
//     accessible name; only the artwork inside is aria-hidden. There is no
//     aria-valuenow, aria-valuemin or aria-valuemax, so the progressbar is
//     indeterminate by omission - and nothing here tries to complete it;
//   - the tone rule is the alert's, not the badge's: `primary` (the default)
//     emits no modifier, and every other value does, `neutral` included and an
//     unknown value included;
//   - size is a CSS custom property, not a width. A number becomes pixels, a
//     string is passed through verbatim, and the absent default writes no
//     declaration at all so the theme token applies. On the client that means
//     no style attribute; on the server it means an empty one;
//   - the animation is a stylesheet rule keyed on the canonical class names.
//     The component writes nothing about motion: no inline animation, no
//     transition, no state, no timer. There is nothing to drive.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createSSRApp, h } from 'vue';
import { describe, expect, it } from 'vitest';

import VfProgressSpinner from './VfProgressSpinner.vue';

type SpinnerProps = InstanceType<typeof VfProgressSpinner>['$props'];

const TONES = ['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'] as const;

function mountSpinner({
  props = {},
  attrs = {},
  slots = {},
}: {
  props?: Partial<SpinnerProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
} = {}) {
  return mount(VfProgressSpinner, { props: props as SpinnerProps, attrs, slots: slots as never });
}

async function ssrSpinner(props: Record<string, unknown> = {}) {
  const app = createSSRApp({ render: () => h(VfProgressSpinner, props) });

  return await renderToString(app);
}

const ARTWORK =
  '<svg class="vf-progress-spinner__svg" viewBox="0 0 50 50" aria-hidden="true" focusable="false">' +
  '<circle class="vf-progress-spinner__track" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>' +
  '<circle class="vf-progress-spinner__value" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>' +
  '</svg>';

describe('VfProgressSpinner characterization: structure', () => {
  it('renders a span root holding one svg', () => {
    const spinner = mountSpinner();

    expect(spinner.element.tagName).toBe('SPAN');
    expect([...spinner.element.children].map((child) => child.tagName.toLowerCase())).toEqual(['svg']);
  });

  it('renders exactly the historical markup at the default', () => {
    expect(mountSpinner().html()).toBe(
      `<span class="vf-progress-spinner" role="progressbar" aria-label="Loading">${ARTWORK}</span>`,
    );
  });

  it('renders two circles, the track before the value, and nothing else inside the svg', () => {
    const svg = mountSpinner().get('svg');
    const children = [...svg.element.children];

    expect(children.map((child) => child.tagName.toLowerCase())).toEqual(['circle', 'circle']);
    expect(children.map((child) => child.getAttribute('class'))).toEqual([
      'vf-progress-spinner__track',
      'vf-progress-spinner__value',
    ]);
  });

  it('draws both circles at the same centre and radius with no fill', () => {
    // The geometry the stylesheet's dash lengths are computed against: a
    // radius of 20 in a 50-unit box is a circumference of about 126, which is
    // where the 88/200 and -124 dash values in the keyframes come from. A port
    // that changed the radius would keep the class names and break the dash.
    for (const circle of mountSpinner().findAll('circle')) {
      expect(circle.attributes('cx')).toBe('25');
      expect(circle.attributes('cy')).toBe('25');
      expect(circle.attributes('r')).toBe('20');
      expect(circle.attributes('fill')).toBe('none');
    }
  });

  it('gives the svg a fixed 50-unit viewBox and no width or height of its own', () => {
    // The box is sized by the stylesheet from the custom property; the svg is
    // 100% of it. A width attribute here would pin the artwork to one size.
    const svg = mountSpinner().get('svg');

    expect(svg.attributes('viewBox')).toBe('0 0 50 50');
    expect(svg.attributes('width')).toBeUndefined();
    expect(svg.attributes('height')).toBeUndefined();
  });

  it('emits no events', () => {
    expect(Object.keys(mountSpinner().emitted())).toEqual([]);
    expect((mountSpinner().vm.$options as { emits?: unknown }).emits).toBeUndefined();
  });

  it('declares no slot and ignores a default slot', () => {
    // Nothing a consumer writes between the tags reaches the DOM. The spinner
    // is a leaf, and a port that rendered the slot would be adding an API.
    expect(mountSpinner({ slots: { default: '<b>inside</b>' } }).html()).toBe(mountSpinner().html());
  });

  it('renders no interactive element in any configuration', () => {
    for (const tone of TONES) {
      const spinner = mountSpinner({ props: { tone, size: 40, strokeWidth: 6, label: 'Busy' } });

      expect(spinner.findAll('a, button, input, select, textarea, [tabindex]')).toHaveLength(0);
    }
  });
});

describe('VfProgressSpinner characterization: props and defaults', () => {
  it('accepts exactly four props', () => {
    expect(Object.keys(mountSpinner({ props: { size: 40 } }).props() as Record<string, unknown>).sort()).toEqual([
      'label',
      'size',
      'strokeWidth',
      'tone',
    ]);
  });

  it('defaults label to Loading, size to undefined, strokeWidth to 4 and tone to primary', () => {
    const spinner = mountSpinner();

    expect(spinner.props('label')).toBe('Loading');
    expect(spinner.props('size')).toBeUndefined();
    expect(spinner.props('strokeWidth')).toBe(4);
    expect(spinner.props('tone')).toBe('primary');
  });

  it("has none of VfProgressBar's props", () => {
    // The other progress component. A shared "progress" abstraction would
    // bring these with it; the spinner has no value, no maximum and no
    // determinate branch.
    const props = mountSpinner().props() as Record<string, unknown>;

    for (const name of ['value', 'max', 'indeterminate', 'showValue', 'striped', 'animated', 'height']) {
      expect(props).not.toHaveProperty(name);
    }
  });
});

describe('VfProgressSpinner characterization: classes', () => {
  it('emits only the block class at the default tone', () => {
    expect(mountSpinner().classes()).toEqual(['vf-progress-spinner']);
    expect(mountSpinner({ props: { tone: 'primary' } }).classes()).toEqual(['vf-progress-spinner']);
  });

  it('emits a modifier for every tone other than primary, neutral included', () => {
    // The alert's convention. A badge suppresses `neutral` and emits
    // `--primary`; a spinner does the opposite, and no stylesheet rule exists
    // for `vf-progress-spinner--primary`.
    for (const tone of TONES) {
      const expected =
        tone === 'primary' ? ['vf-progress-spinner'] : ['vf-progress-spinner', `vf-progress-spinner--${tone}`];

      expect(mountSpinner({ props: { tone } }).classes()).toEqual(expected);
    }
  });

  it('interpolates an undocumented tone into the class name without validating it', () => {
    expect(mountSpinner({ props: { tone: 'nonsense' as SpinnerProps['tone'] } }).classes()).toEqual([
      'vf-progress-spinner',
      'vf-progress-spinner--nonsense',
    ]);
  });

  it('never emits another block name', () => {
    for (const tone of TONES) {
      const joined = mountSpinner({ props: { tone } }).classes().join(' ');

      expect(joined).not.toContain('vf-alert');
      expect(joined).not.toContain('vf-badge');
      expect(joined).not.toContain('vf-progress-bar');
      expect(joined).not.toContain('vf-button');
    }
  });

  it('classes the svg and both circles with fixed element names', () => {
    const spinner = mountSpinner({ props: { tone: 'danger' } });

    expect(spinner.get('svg').classes()).toEqual(['vf-progress-spinner__svg']);
    expect(spinner.findAll('circle').map((circle) => circle.classes())).toEqual([
      ['vf-progress-spinner__track'],
      ['vf-progress-spinner__value'],
    ]);
  });

  it('appends a consumer class after the canonical classes', () => {
    expect(mountSpinner({ attrs: { class: 'mine' } }).classes()).toEqual(['vf-progress-spinner', 'mine']);
    expect(mountSpinner({ props: { tone: 'info' }, attrs: { class: 'mine' } }).classes()).toEqual([
      'vf-progress-spinner',
      'vf-progress-spinner--info',
      'mine',
    ]);
  });
});

describe('VfProgressSpinner characterization: size', () => {
  it('writes no style attribute at the default, so the theme token sizes the box', () => {
    expect(mountSpinner().attributes('style')).toBeUndefined();
  });

  it('writes a number as pixels into the custom property', () => {
    expect(mountSpinner({ props: { size: 40 } }).attributes('style')).toBe('--vf-progress-spinner-size: 40px;');
  });

  it('treats zero as a length rather than an absence', () => {
    expect(mountSpinner({ props: { size: 0 } }).attributes('style')).toBe('--vf-progress-spinner-size: 0px;');
  });

  it('writes a string verbatim, token references included', () => {
    expect(mountSpinner({ props: { size: '2em' } }).attributes('style')).toBe('--vf-progress-spinner-size: 2em;');
    expect(mountSpinner({ props: { size: 'var(--vf-icon-current-size)' } }).attributes('style')).toBe(
      '--vf-progress-spinner-size: var(--vf-icon-current-size);',
    );
  });

  it('writes no declaration for an empty string', () => {
    // Vue omits a style property whose value is the empty string, so
    // `size=""` is not a zero-sized spinner - it is the default one.
    expect(mountSpinner({ props: { size: '' } }).attributes('style')).toBeUndefined();
  });

  it('never sets width or height attributes anywhere', () => {
    const spinner = mountSpinner({ props: { size: 40 } });

    expect(spinner.attributes('width')).toBeUndefined();
    expect(spinner.attributes('height')).toBeUndefined();
    expect(spinner.get('svg').attributes('width')).toBeUndefined();
    expect(spinner.get('svg').attributes('height')).toBeUndefined();
  });
});

describe('VfProgressSpinner characterization: stroke width', () => {
  it('writes the default stroke width on both circles', () => {
    expect(
      mountSpinner()
        .findAll('circle')
        .map((circle) => circle.attributes('stroke-width')),
    ).toEqual(['4', '4']);
  });

  it('writes a custom stroke width on both circles, the track included', () => {
    // Both, not only the value arc: a thinner track under a thicker arc would
    // be a different drawing.
    expect(
      mountSpinner({ props: { strokeWidth: 5 } })
        .findAll('circle')
        .map((circle) => circle.attributes('stroke-width')),
    ).toEqual(['5', '5']);
    expect(
      mountSpinner({ props: { strokeWidth: 2.5 } })
        .findAll('circle')
        .map((circle) => circle.attributes('stroke-width')),
    ).toEqual(['2.5', '2.5']);
  });

  it('writes zero as a stroke width rather than dropping it', () => {
    expect(
      mountSpinner({ props: { strokeWidth: 0 } })
        .findAll('circle')
        .map((circle) => circle.attributes('stroke-width')),
    ).toEqual(['0', '0']);
  });
});

describe('VfProgressSpinner characterization: accessibility', () => {
  it('exposes the root as a progressbar named Loading by default', () => {
    const spinner = mountSpinner();

    expect(spinner.attributes('role')).toBe('progressbar');
    expect(spinner.attributes('aria-label')).toBe('Loading');
  });

  it('names the root from the label prop, an empty label included', () => {
    expect(mountSpinner({ props: { label: 'Saving' } }).attributes('aria-label')).toBe('Saving');
    // An empty string is written, not dropped: the attribute is present and
    // the name is empty, which is a different thing from no attribute.
    expect(mountSpinner({ props: { label: '' } }).attributes('aria-label')).toBe('');
  });

  it('hides only the artwork from assistive technology', () => {
    const spinner = mountSpinner();

    expect(spinner.attributes('aria-hidden')).toBeUndefined();
    expect(spinner.get('svg').attributes('aria-hidden')).toBe('true');
    expect(spinner.get('svg').attributes('focusable')).toBe('false');
    for (const circle of spinner.findAll('circle')) {
      expect(circle.attributes('aria-hidden')).toBeUndefined();
    }
  });

  it('writes no value semantics, so the progressbar is indeterminate by omission', () => {
    // Not aria-valuenow="0", not aria-valuemin, not aria-valuemax, not
    // aria-busy, not aria-live. Adding any of them would be an accessibility
    // change the reference never made.
    const spinner = mountSpinner();

    for (const name of [
      'aria-valuenow',
      'aria-valuemin',
      'aria-valuemax',
      'aria-valuetext',
      'aria-busy',
      'aria-live',
    ]) {
      expect(spinner.attributes(name)).toBeUndefined();
    }
  });

  it('lets a consumer role replace its own', () => {
    // The role is a static attribute written before the inherited attrs, so a
    // consumer's wins and the component's is gone rather than duplicated.
    const spinner = mountSpinner({ attrs: { role: 'status' } });

    expect(spinner.attributes('role')).toBe('status');
    expect(spinner.html()).not.toContain('progressbar');
  });

  it('lets a consumer aria-label replace its own', () => {
    expect(
      mountSpinner({ props: { label: 'Loading' }, attrs: { 'aria-label': 'Busy' } }).attributes('aria-label'),
    ).toBe('Busy');
  });

  it('forwards consumer value semantics onto the root rather than rejecting them', () => {
    const spinner = mountSpinner({ attrs: { 'aria-valuenow': '40', 'aria-valuemin': '0', 'aria-valuemax': '100' } });

    expect(spinner.attributes('aria-valuenow')).toBe('40');
    expect(spinner.attributes('aria-valuemin')).toBe('0');
    expect(spinner.attributes('aria-valuemax')).toBe('100');
  });

  it('lets a consumer hide the whole spinner while the artwork stays hidden too', () => {
    const spinner = mountSpinner({ attrs: { 'aria-hidden': 'true' } });

    expect(spinner.attributes('aria-hidden')).toBe('true');
    expect(spinner.attributes('role')).toBe('progressbar');
    expect(spinner.get('svg').attributes('aria-hidden')).toBe('true');
  });
});

describe('VfProgressSpinner characterization: attrs and style', () => {
  it('forwards native and data attributes onto the root, never onto the svg', () => {
    const spinner = mountSpinner({ attrs: { id: 'sp', title: 'Loading data', 'data-testid': 'spinner' } });

    expect(spinner.attributes('id')).toBe('sp');
    expect(spinner.attributes('title')).toBe('Loading data');
    expect(spinner.attributes('data-testid')).toBe('spinner');
    expect(spinner.get('svg').attributes('id')).toBeUndefined();
    expect(spinner.get('svg').attributes('data-testid')).toBeUndefined();
  });

  it('merges a consumer style after its own size declaration', () => {
    expect(mountSpinner({ attrs: { style: 'margin: 4px' } }).attributes('style')).toBe('margin: 4px;');
    expect(mountSpinner({ props: { size: 40 }, attrs: { style: 'margin: 4px' } }).attributes('style')).toBe(
      '--vf-progress-spinner-size: 40px; margin: 4px;',
    );
  });

  it('lets a consumer declaration of the size property win over the prop', () => {
    // Vue merges a bound style object with an inherited style attribute
    // rather than concatenating them: one declaration survives, the consumer's.
    expect(
      mountSpinner({ props: { size: 40 }, attrs: { style: '--vf-progress-spinner-size: 10px' } }).attributes('style'),
    ).toBe('--vf-progress-spinner-size: 10px;');
  });

  it('keeps the artwork attributes fixed whatever the consumer forwards', () => {
    const spinner = mountSpinner({
      props: { tone: 'danger', size: 40, strokeWidth: 6 },
      attrs: { class: 'mine', style: 'margin: 4px', role: 'status', 'data-testid': 'x' },
    });

    expect(spinner.get('svg').element.outerHTML).toBe(ARTWORK.replace(/stroke-width="4"/g, 'stroke-width="6"'));
  });
});

describe('VfProgressSpinner characterization: SSR', () => {
  it('renders the default spinner with an empty style attribute on the server', async () => {
    // The one place the client and server outputs differ, and it is a Vue
    // serialiser difference rather than a product one: the client writes no
    // attribute for an object with no declarations, the server writes an
    // empty one. The parity extractor records both as absent.
    expect(await ssrSpinner()).toBe(
      `<span class="vf-progress-spinner" style="" role="progressbar" aria-label="Loading">${ARTWORK}</span>`,
    );
  });

  it('renders the size declaration on the server', async () => {
    expect(await ssrSpinner({ size: 40 })).toContain('style="--vf-progress-spinner-size:40px;"');
  });

  it('renders an empty-string size as an empty declaration on the server', async () => {
    // The reference builds a plain style object and the SSR serialiser keeps
    // an empty string where the client serialiser drops it. Pinned as-is: a
    // rule that "tidied" the empty value away would change these bytes.
    expect(await ssrSpinner({ size: '' })).toContain('style="--vf-progress-spinner-size:;"');
  });

  it('renders the tone modifier, a consumer class and a consumer style on the server', async () => {
    expect(await ssrSpinner({ tone: 'danger', class: 'mine', style: 'margin: 4px' })).toContain(
      '<span class="vf-progress-spinner vf-progress-spinner--danger mine" style="margin:4px;" role="progressbar"',
    );
  });

  it('lets a consumer role and name replace its own on the server too', async () => {
    const markup = await ssrSpinner({ role: 'status', 'aria-label': 'Busy' });

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-label="Busy"');
    expect(markup).not.toContain('progressbar');
  });
});

describe('VfProgressSpinner characterization: animation', () => {
  // The spinner moves, and nothing in the component makes it move. Motion is
  // two stylesheet animations keyed on the canonical element classes, so the
  // contract the component owns is the class names, and the contract the
  // stylesheet owns is pinned by baseline:css against the reference bytes.
  // Read here rather than assumed, so a port that renamed the svg's class or
  // moved the animation onto the root would fail before any screenshot did.
  const stylesheet = readFileSync(resolve(__dirname, '../../../../styles/src/components/progress-spinner.css'), 'utf8');

  it('writes no inline animation, transition or state of its own', () => {
    const markup = mountSpinner({ props: { size: 40 } }).html();

    expect(markup).not.toContain('animation');
    expect(markup).not.toContain('transition');
    expect(markup).not.toMatch(/data-state|data-phase/);
  });

  it('is animated by two stylesheet keyframes on the svg and the value arc', () => {
    expect(stylesheet).toContain('@keyframes vf-progress-spinner-rotate');
    expect(stylesheet).toContain('@keyframes vf-progress-spinner-dash');
    expect(stylesheet).toMatch(/\.vf-progress-spinner__svg \{[^}]*animation: vf-progress-spinner-rotate/);
    expect(stylesheet).toMatch(/\.vf-progress-spinner__value \{[^}]*animation: vf-progress-spinner-dash/);
    expect(stylesheet).not.toMatch(/\.vf-progress-spinner \{[^}]*animation/);
  });

  it('takes its duration and easings from theme tokens the component never writes', () => {
    expect(stylesheet).toContain('var(--vf-progress-spinner-duration)');
    expect(stylesheet).toContain('var(--vf-progress-spinner-rotate-easing)');
    expect(stylesheet).toContain('var(--vf-progress-spinner-dash-easing)');
    expect(mountSpinner().html()).not.toContain('--vf-progress-spinner-duration');
  });

  it('paints one modifier rule per non-default tone and none for primary', () => {
    for (const tone of TONES) {
      const rule = `.vf-progress-spinner--${tone} {`;

      if (tone === 'primary') expect(stylesheet).not.toContain(rule);
      else expect(stylesheet).toContain(rule);
    }
  });
});
