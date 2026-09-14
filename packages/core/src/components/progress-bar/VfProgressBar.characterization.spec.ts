// Characterization of the historical VfProgressBar at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// The M21 component, and the last static progress-related leaf. It sits beside
// VfProgressSpinner and shares the role name and the tone union with it, and
// this suite deliberately imports nothing from the spinner: a spinner defect
// must not be able to reach this file, and a bar that started delegating to
// the spinner's rules would lose three modifiers first.
//
// What is worth reading first, because each is easy to get wrong in a port:
//
//   - determinate is the default, and a missing value is 0, not
//     indeterminate. The indeterminate branch is an explicit boolean prop; it
//     drops all three aria-value* attributes and the fill's inline size, adds
//     one modifier, and ignores any value and max passed beside it;
//   - the maximum falls back to 100 whenever it is not a finite positive
//     number - zero, a negative, NaN, Infinity and a numeric string all fall
//     back. The value falls back to 0 whenever it is not finite, and is then
//     clamped into [0, max]. Nothing is rounded;
//   - the width and the announced value come from the same resolved number,
//     serialised as JavaScript serialises it: `58.333333333333336%` and
//     `aria-valuenow="7"`; `9.999999999999998e-8%` and `aria-valuenow="1e-7"`;
//   - the visible label exists only with showValue, only while determinate,
//     and reads the ratio rounded half-up. It is *not* the accessible name:
//     the name is the label prop, written as aria-label;
//   - the tone rule is the spinner's and the alert's, not the badge's;
//     `animated` alone emits nothing;
//   - the component owns no motion. The indeterminate sweep and the stripe
//     animation are stylesheet keyframes keyed on the canonical classes.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createSSRApp, h } from 'vue';
import { describe, expect, it } from 'vitest';

import VfProgressBar from './VfProgressBar.vue';

type BarProps = InstanceType<typeof VfProgressBar>['$props'];

const TONES = ['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'] as const;

function mountBar({
  props = {},
  attrs = {},
  slots = {},
}: {
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
} = {}) {
  return mount(VfProgressBar, { props: props as BarProps, attrs, slots: slots as never });
}

async function ssrBar(props: Record<string, unknown> = {}) {
  const app = createSSRApp({ render: () => h(VfProgressBar, props) });

  return await renderToString(app);
}

const fill = (wrapper: ReturnType<typeof mountBar>) => wrapper.get('.vf-progress-bar__value');

/** The determinate markup at a value, a maximum and a width, with no label. */
const determinate = (valuenow: string, valuemax: string, width: string, extra = '') =>
  `<div class="vf-progress-bar${extra}" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="${valuemax}" aria-valuenow="${valuenow}">` +
  `<span class="vf-progress-bar__value" style="inline-size: ${width};"><!--v-if--></span></div>`;

describe('VfProgressBar characterization: structure', () => {
  it('renders a div root holding one fill span and nothing else', () => {
    const bar = mountBar();

    expect(bar.element.tagName).toBe('DIV');
    expect([...bar.element.children].map((child) => child.tagName.toLowerCase())).toEqual(['span']);
    expect(fill(bar).element.children).toHaveLength(0);
  });

  it('renders exactly the historical markup at the default', () => {
    expect(mountBar().html({ raw: true })).toBe(determinate('0', '100', '0%'));
  });

  it('keeps the role, the name and the value on the root, and the width on the fill', () => {
    // Structural parity has to see a role that moved onto the fill or a width
    // that moved onto the root, so both placements are pinned.
    const bar = mountBar({ props: { value: 50 } });

    expect(bar.attributes('role')).toBe('progressbar');
    expect(bar.attributes('aria-valuenow')).toBe('50');
    expect(bar.attributes('style')).toBeUndefined();
    expect(fill(bar).attributes('role')).toBeUndefined();
    expect(fill(bar).attributes('aria-valuenow')).toBeUndefined();
    expect(fill(bar).attributes('style')).toBe('inline-size: 50%;');
  });

  it('emits no events', () => {
    expect(Object.keys(mountBar().emitted())).toEqual([]);
    expect((mountBar().vm.$options as { emits?: unknown }).emits).toBeUndefined();
  });

  it('declares no slot and ignores a default slot', () => {
    expect(mountBar({ slots: { default: '<b>inside</b>' } }).html({ raw: true })).toBe(mountBar().html({ raw: true }));
  });

  it('renders no interactive element in any configuration', () => {
    for (const tone of TONES) {
      for (const indeterminate of [false, true]) {
        const bar = mountBar({
          props: { tone, indeterminate, showValue: true, striped: true, animated: true, value: 40 },
        });

        expect(bar.findAll('a, button, input, select, textarea, [tabindex]')).toHaveLength(0);
      }
    }
  });
});

describe('VfProgressBar characterization: props and defaults', () => {
  it('accepts exactly nine props', () => {
    expect(Object.keys(mountBar({ props: { height: 8 } }).props() as Record<string, unknown>).sort()).toEqual([
      'animated',
      'height',
      'indeterminate',
      'label',
      'max',
      'showValue',
      'striped',
      'tone',
      'value',
    ]);
  });

  it('defaults value to 0, max to 100, label to Progress, tone to primary and every flag to false', () => {
    const bar = mountBar();

    expect(bar.props('value')).toBe(0);
    expect(bar.props('max')).toBe(100);
    expect(bar.props('indeterminate')).toBe(false);
    expect(bar.props('label')).toBe('Progress');
    expect(bar.props('height')).toBeUndefined();
    expect(bar.props('showValue')).toBe(false);
    expect(bar.props('tone')).toBe('primary');
    expect(bar.props('striped')).toBe(false);
    expect(bar.props('animated')).toBe(false);
  });

  it("has none of VfProgressSpinner's props", () => {
    // The other progress component. A shared "progress" abstraction would
    // bring these with it; the bar has no size and no stroke width.
    const props = mountBar().props() as Record<string, unknown>;

    expect(props).not.toHaveProperty('size');
    expect(props).not.toHaveProperty('strokeWidth');
  });
});

describe('VfProgressBar characterization: value and max', () => {
  it('writes the value and the width from the same number at the default maximum', () => {
    expect(mountBar({ props: { value: 50 } }).html({ raw: true })).toBe(determinate('50', '100', '50%'));
  });

  it('writes zero as a value and as a width rather than dropping either', () => {
    const bar = mountBar({ props: { value: 0 } });

    expect(bar.attributes('aria-valuenow')).toBe('0');
    expect(fill(bar).attributes('style')).toBe('inline-size: 0%;');
  });

  it('writes the maximum as full', () => {
    expect(mountBar({ props: { value: 100 } }).html({ raw: true })).toBe(determinate('100', '100', '100%'));
  });

  it('clamps an overflow to the maximum on both the attribute and the width', () => {
    expect(mountBar({ props: { value: 150 } }).html({ raw: true })).toBe(determinate('100', '100', '100%'));
    expect(mountBar({ props: { value: 15, max: 12 } }).html({ raw: true })).toBe(determinate('12', '12', '100%'));
  });

  it('clamps a negative value to zero on both the attribute and the width', () => {
    expect(mountBar({ props: { value: -20 } }).html({ raw: true })).toBe(determinate('0', '100', '0%'));
  });

  it('exposes a custom maximum and the unrounded ratio', () => {
    expect(mountBar({ props: { value: 7, max: 12 } }).html({ raw: true })).toBe(
      determinate('7', '12', '58.333333333333336%'),
    );
    expect(mountBar({ props: { value: 1, max: 3 } }).html({ raw: true })).toBe(
      determinate('1', '3', '33.33333333333333%'),
    );
  });

  it('falls back to a maximum of 100 for zero, a negative, NaN and Infinity', () => {
    // Not a division by zero and not an empty bar: max <= 0 means "the
    // default maximum", so value 5 of max 0 is 5 of 100.
    for (const max of [0, -10, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(mountBar({ props: { value: 5, max } }).html({ raw: true })).toBe(determinate('5', '100', '5%'));
    }
  });

  it('treats a non-finite value as zero', () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, null, undefined]) {
      expect(mountBar({ props: { value } }).html({ raw: true })).toBe(determinate('0', '100', '0%'));
    }
  });

  it('treats a numeric string as non-finite rather than parsing it', () => {
    // Number.isFinite('40') is false. A Vue template writing value="40" as
    // text gets a warning and an empty bar, and max="10" gets the default
    // maximum. Pinned as the reference's quirk; the Razor adapter parses
    // template text before the rule sees it, and documents that boundary.
    expect(mountBar({ props: { value: '40' } }).html({ raw: true })).toBe(determinate('0', '100', '0%'));
    expect(mountBar({ props: { value: 5, max: '10' } }).html({ raw: true })).toBe(determinate('5', '100', '5%'));
  });

  it('keeps a fractional value and a fractional maximum unrounded', () => {
    expect(mountBar({ props: { value: 33.3333 } }).html({ raw: true })).toBe(determinate('33.3333', '100', '33.3333%'));
    expect(mountBar({ props: { value: 0.1, max: 0.3 } }).html({ raw: true })).toBe(
      determinate('0.1', '0.3', '33.333333333333336%'),
    );
    expect(mountBar({ props: { value: 5, max: 0.5 } }).html({ raw: true })).toBe(determinate('0.5', '0.5', '100%'));
  });

  it('writes a tiny value in exponent form on both the attribute and the width', () => {
    expect(mountBar({ props: { value: 1e-7 } }).html({ raw: true })).toBe(
      determinate('1e-7', '100', '9.999999999999998e-8%'),
    );
  });

  it('always exposes aria-valuemin as 0, whatever the value and maximum', () => {
    for (const props of [{}, { value: 50 }, { value: 7, max: 12 }, { value: -20 }, { value: 5, max: 0 }]) {
      expect(mountBar({ props }).attributes('aria-valuemin')).toBe('0');
    }
  });
});

describe('VfProgressBar characterization: determinate versus indeterminate', () => {
  it('is determinate by default: a missing value is 0, not indeterminate', () => {
    const bar = mountBar();

    expect(bar.classes()).not.toContain('vf-progress-bar--indeterminate');
    expect(bar.attributes('aria-valuenow')).toBe('0');
  });

  it('renders exactly the historical indeterminate markup', () => {
    expect(mountBar({ props: { indeterminate: true } }).html({ raw: true })).toBe(
      '<div class="vf-progress-bar vf-progress-bar--indeterminate" role="progressbar" aria-label="Progress">' +
        '<span class="vf-progress-bar__value"><!--v-if--></span></div>',
    );
  });

  it('drops all three aria-value attributes while indeterminate', () => {
    const bar = mountBar({ props: { indeterminate: true } });

    for (const name of ['aria-valuemin', 'aria-valuemax', 'aria-valuenow']) {
      expect(bar.attributes(name)).toBeUndefined();
    }
    expect(bar.attributes('role')).toBe('progressbar');
    expect(bar.attributes('aria-label')).toBe('Progress');
  });

  it('writes no inline size on the fill while indeterminate', () => {
    expect(fill(mountBar({ props: { indeterminate: true } })).attributes('style')).toBeUndefined();
  });

  it('ignores a value, a maximum and showValue passed beside indeterminate', () => {
    const bar = mountBar({ props: { indeterminate: true, value: 40, max: 80, showValue: true } });

    expect(bar.html({ raw: true })).toBe(mountBar({ props: { indeterminate: true } }).html({ raw: true }));
    expect(bar.find('.vf-progress-bar__label').exists()).toBe(false);
  });

  it('keeps the tone and stripe modifiers beside the indeterminate one', () => {
    expect(mountBar({ props: { indeterminate: true, tone: 'info', striped: true, animated: true } }).classes()).toEqual(
      [
        'vf-progress-bar',
        'vf-progress-bar--info',
        'vf-progress-bar--striped',
        'vf-progress-bar--animated',
        'vf-progress-bar--indeterminate',
      ],
    );
  });
});

describe('VfProgressBar characterization: the visible label', () => {
  it('renders no label element by default, leaving a v-if placeholder', () => {
    const bar = mountBar({ props: { value: 50 } });

    expect(bar.find('.vf-progress-bar__label').exists()).toBe(false);
    expect(fill(bar).element.innerHTML).toBe('<!--v-if-->');
  });

  it('renders the rounded percentage inside the fill with showValue', () => {
    const bar = mountBar({ props: { value: 50, showValue: true } });
    const label = bar.get('.vf-progress-bar__label');

    expect(label.element.tagName).toBe('SPAN');
    expect(label.element.parentElement).toBe(fill(bar).element);
    expect(label.text()).toBe('50%');
  });

  it('rounds the label half-up while leaving the width and the value unrounded', () => {
    const bar = mountBar({ props: { value: 1, max: 8, showValue: true } });

    expect(bar.get('.vf-progress-bar__label').text()).toBe('13%');
    expect(fill(bar).attributes('style')).toBe('inline-size: 12.5%;');
    expect(bar.attributes('aria-valuenow')).toBe('1');
    expect(
      mountBar({ props: { value: 2, max: 3, showValue: true } })
        .get('.vf-progress-bar__label')
        .text(),
    ).toBe('67%');
  });

  it('renders "0%" at zero rather than dropping the label', () => {
    expect(
      mountBar({ props: { value: 0, showValue: true } })
        .get('.vf-progress-bar__label')
        .text(),
    ).toBe('0%');
  });

  it('writes the label text with the surrounding whitespace of the template', () => {
    // The template puts the interpolation on its own line, so the rendered
    // text node carries a newline and indentation on each side. Pinned raw:
    // a port that wrote the text tight would move the SSR bytes.
    expect(mountBar({ props: { value: 50, showValue: true } }).html({ raw: true })).toBe(
      '<div class="vf-progress-bar" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">' +
        '<span class="vf-progress-bar__value" style="inline-size: 50%;"><span class="vf-progress-bar__label">50%</span></span></div>',
    );
  });

  it('is not the accessible name: the name stays the label prop whatever the visible text', () => {
    const bar = mountBar({ props: { value: 50, showValue: true, label: 'Upload' } });

    expect(bar.attributes('aria-label')).toBe('Upload');
    expect(bar.get('.vf-progress-bar__label').text()).toBe('50%');
    expect(bar.attributes('aria-valuetext')).toBeUndefined();
  });
});

describe('VfProgressBar characterization: classes', () => {
  it('emits only the block class at the default', () => {
    expect(mountBar().classes()).toEqual(['vf-progress-bar']);
    expect(mountBar({ props: { tone: 'primary' } }).classes()).toEqual(['vf-progress-bar']);
  });

  it('emits a modifier for every tone other than primary, neutral included', () => {
    for (const tone of TONES) {
      const expected = tone === 'primary' ? ['vf-progress-bar'] : ['vf-progress-bar', `vf-progress-bar--${tone}`];

      expect(mountBar({ props: { tone } }).classes()).toEqual(expected);
    }
  });

  it('interpolates an undocumented tone into the class name without validating it', () => {
    expect(mountBar({ props: { tone: 'nonsense' } }).classes()).toEqual([
      'vf-progress-bar',
      'vf-progress-bar--nonsense',
    ]);
  });

  it('emits the striped modifier, and the animated one only beside it', () => {
    expect(mountBar({ props: { striped: true } }).classes()).toEqual(['vf-progress-bar', 'vf-progress-bar--striped']);
    expect(mountBar({ props: { animated: true } }).classes()).toEqual(['vf-progress-bar']);
    expect(mountBar({ props: { striped: true, animated: true } }).classes()).toEqual([
      'vf-progress-bar',
      'vf-progress-bar--striped',
      'vf-progress-bar--animated',
    ]);
  });

  it('never emits another block name', () => {
    for (const tone of TONES) {
      const joined = mountBar({ props: { tone, striped: true, animated: true, indeterminate: true } })
        .classes()
        .join(' ');

      expect(joined).not.toContain('vf-progress-spinner');
      expect(joined).not.toContain('vf-alert');
      expect(joined).not.toContain('vf-badge');
    }
  });

  it('classes the fill and the label with fixed element names', () => {
    const bar = mountBar({ props: { tone: 'danger', showValue: true } });

    expect(fill(bar).classes()).toEqual(['vf-progress-bar__value']);
    expect(bar.get('.vf-progress-bar__label').classes()).toEqual(['vf-progress-bar__label']);
  });

  it('appends a consumer class after the canonical classes', () => {
    expect(mountBar({ attrs: { class: 'mine' } }).classes()).toEqual(['vf-progress-bar', 'mine']);
    expect(mountBar({ props: { tone: 'info', striped: true }, attrs: { class: 'mine' } }).classes()).toEqual([
      'vf-progress-bar',
      'vf-progress-bar--info',
      'vf-progress-bar--striped',
      'mine',
    ]);
  });
});

describe('VfProgressBar characterization: height', () => {
  it('writes no root style attribute at the default, so the theme token sizes the track', () => {
    expect(mountBar().attributes('style')).toBeUndefined();
  });

  it('writes a number as pixels into the custom property', () => {
    expect(mountBar({ props: { height: 12 } }).attributes('style')).toBe('--vf-progress-bar-height: 12px;');
  });

  it('treats zero as a length rather than an absence', () => {
    expect(mountBar({ props: { height: 0 } }).attributes('style')).toBe('--vf-progress-bar-height: 0px;');
  });

  it('writes a string verbatim', () => {
    expect(mountBar({ props: { height: '1rem' } }).attributes('style')).toBe('--vf-progress-bar-height: 1rem;');
  });

  it('writes no declaration for an empty string', () => {
    expect(mountBar({ props: { height: '' } }).attributes('style')).toBeUndefined();
  });

  it('never writes the height as a height declaration, and never onto the fill', () => {
    const bar = mountBar({ props: { height: 12, value: 50 } });

    expect(bar.attributes('style')).toBe('--vf-progress-bar-height: 12px;');
    expect(bar.attributes('style')).not.toMatch(/(^|[; ])(height|block-size):/);
    expect(fill(bar).attributes('style')).toBe('inline-size: 50%;');
  });
});

describe('VfProgressBar characterization: accessibility', () => {
  it('exposes the root as a progressbar named Progress by default', () => {
    const bar = mountBar();

    expect(bar.attributes('role')).toBe('progressbar');
    expect(bar.attributes('aria-label')).toBe('Progress');
  });

  it('names the root from the label prop, an empty label included', () => {
    expect(mountBar({ props: { label: 'Upload' } }).attributes('aria-label')).toBe('Upload');
    expect(mountBar({ props: { label: '' } }).attributes('aria-label')).toBe('');
  });

  it('writes no other ARIA of its own', () => {
    const bar = mountBar({ props: { value: 50 } });

    for (const name of ['aria-valuetext', 'aria-busy', 'aria-live', 'aria-hidden', 'aria-labelledby']) {
      expect(bar.attributes(name)).toBeUndefined();
    }
  });

  it('lets a consumer role replace its own', () => {
    const bar = mountBar({ attrs: { role: 'status' } });

    expect(bar.attributes('role')).toBe('status');
    expect(bar.html()).not.toContain('progressbar');
    // The value attributes stay: only the role was replaced.
    expect(bar.attributes('aria-valuenow')).toBe('0');
  });

  it('lets a consumer aria-label replace its own', () => {
    expect(mountBar({ props: { label: 'Upload' }, attrs: { 'aria-label': 'Busy' } }).attributes('aria-label')).toBe(
      'Busy',
    );
  });

  it('lets a consumer aria-value attribute replace its own while the width keeps the prop', () => {
    // The attrs are written after the component's own, so a consumer's
    // aria-valuenow wins. The fill does not read the attribute, so the visual
    // and the announced value can be made to disagree by a consumer - which
    // is the reference's contract, and the harness measures the two apart.
    const bar = mountBar({ props: { value: 50 }, attrs: { 'aria-valuenow': '40' } });

    expect(bar.attributes('aria-valuenow')).toBe('40');
    expect(fill(bar).attributes('style')).toBe('inline-size: 50%;');
    expect(mountBar({ attrs: { 'aria-valuemax': '200' } }).attributes('aria-valuemax')).toBe('200');
    expect(mountBar({ attrs: { 'aria-valuemin': '10' } }).attributes('aria-valuemin')).toBe('10');
  });

  it('forwards a consumer aria-valuetext and aria-labelledby beside its own attributes', () => {
    const bar = mountBar({ attrs: { 'aria-valuetext': 'half', 'aria-labelledby': 'heading' } });

    expect(bar.attributes('aria-valuetext')).toBe('half');
    expect(bar.attributes('aria-labelledby')).toBe('heading');
    expect(bar.attributes('aria-label')).toBe('Progress');
  });

  it('forwards a consumer aria-valuenow onto an indeterminate bar rather than stripping it', () => {
    const bar = mountBar({ props: { indeterminate: true }, attrs: { 'aria-valuenow': '40' } });

    expect(bar.attributes('aria-valuenow')).toBe('40');
    expect(bar.attributes('aria-valuemin')).toBeUndefined();
    expect(bar.attributes('aria-valuemax')).toBeUndefined();
  });

  it('lets a consumer hide the whole bar', () => {
    const bar = mountBar({ attrs: { 'aria-hidden': 'true' } });

    expect(bar.attributes('aria-hidden')).toBe('true');
    expect(bar.attributes('role')).toBe('progressbar');
  });
});

describe('VfProgressBar characterization: attrs and style', () => {
  it('forwards native and data attributes onto the root, never onto the fill', () => {
    const bar = mountBar({ attrs: { id: 'pb', title: 'Uploading', 'data-testid': 'bar' } });

    expect(bar.attributes('id')).toBe('pb');
    expect(bar.attributes('title')).toBe('Uploading');
    expect(bar.attributes('data-testid')).toBe('bar');
    expect(fill(bar).attributes('id')).toBeUndefined();
    expect(fill(bar).attributes('data-testid')).toBeUndefined();
  });

  it('merges a consumer style after its own height declaration', () => {
    expect(mountBar({ attrs: { style: 'margin: 4px' } }).attributes('style')).toBe('margin: 4px;');
    expect(mountBar({ props: { height: 12 }, attrs: { style: 'margin: 4px' } }).attributes('style')).toBe(
      '--vf-progress-bar-height: 12px; margin: 4px;',
    );
  });

  it('lets a consumer declaration of the height property win over the prop', () => {
    expect(
      mountBar({ props: { height: 12 }, attrs: { style: '--vf-progress-bar-height: 4px' } }).attributes('style'),
    ).toBe('--vf-progress-bar-height: 4px;');
  });

  it('never lets a consumer style reach the fill', () => {
    const bar = mountBar({ props: { value: 50 }, attrs: { style: 'inline-size: 10%' } });

    expect(bar.attributes('style')).toBe('inline-size: 10%;');
    expect(fill(bar).attributes('style')).toBe('inline-size: 50%;');
  });
});

describe('VfProgressBar characterization: SSR', () => {
  it('renders the default bar with an empty root style attribute on the server', async () => {
    // The one place the client and server outputs differ, and it is a Vue
    // serialiser difference rather than a product one: the client writes no
    // attribute for an object with no declarations, the server writes an
    // empty one. The parity extractor records both as absent.
    expect(await ssrBar()).toBe(
      '<div class="vf-progress-bar" style="" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
        '<span class="vf-progress-bar__value" style="inline-size:0%;"><!--v-if--></span></div>',
    );
  });

  it('renders the value and the unrounded width on the server', async () => {
    expect(await ssrBar({ value: 7, max: 12 })).toContain(
      'aria-valuemax="12" aria-valuenow="7"><span class="vf-progress-bar__value" style="inline-size:58.333333333333336%;">',
    );
  });

  it('renders the indeterminate bar with an empty style on both the root and the fill on the server', async () => {
    expect(await ssrBar({ indeterminate: true })).toBe(
      '<div class="vf-progress-bar vf-progress-bar--indeterminate" style="" role="progressbar" aria-label="Progress">' +
        '<span class="vf-progress-bar__value" style=""><!--v-if--></span></div>',
    );
  });

  it('renders the height declaration, and an empty-string height as an empty declaration, on the server', async () => {
    expect(await ssrBar({ height: 12 })).toContain('style="--vf-progress-bar-height:12px;"');
    expect(await ssrBar({ height: '' })).toContain('style="--vf-progress-bar-height:;"');
  });

  it('renders the label with its template whitespace on the server', async () => {
    expect(await ssrBar({ value: 1, max: 8, showValue: true })).toContain(
      '<span class="vf-progress-bar__value" style="inline-size:12.5%;"><span class="vf-progress-bar__label">13%</span></span>',
    );
  });

  it('renders an empty label as a bare aria-label attribute on the server', async () => {
    // The server writes `aria-label` with no value where the client writes
    // `aria-label=""`; the DOM reads both as the empty string.
    expect(await ssrBar({ label: '' })).toContain('role="progressbar" aria-label aria-valuemin="0"');
  });

  it('lets a consumer role, name and value replace its own on the server too', async () => {
    const markup = await ssrBar({ role: 'status', 'aria-label': 'Busy', 'aria-valuenow': '40', value: 50 });

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-label="Busy"');
    expect(markup).toContain('aria-valuenow="40"');
    expect(markup).toContain('inline-size:50%;');
    expect(markup).not.toContain('progressbar');
  });
});

describe('VfProgressBar characterization: motion', () => {
  // The component owns no motion. The indeterminate sweep, the stripe drift
  // and the width transition are stylesheet rules keyed on the canonical
  // classes; the contract the component owns is the class names and the
  // inline size.
  const stylesheet = readFileSync(resolve(__dirname, '../../../../styles/src/components/progress-bar.css'), 'utf8');

  it('writes no inline animation, transition or state of its own', () => {
    const markup = mountBar({ props: { indeterminate: true, striped: true, animated: true } }).html();

    expect(markup).not.toContain('animation');
    expect(markup).not.toContain('transition');
    expect(markup).not.toMatch(/data-state|data-phase/);
  });

  it('is animated by three stylesheet keyframes, none of them on the root', () => {
    expect(stylesheet).toContain('@keyframes vf-progress-bar-indeterminate {');
    expect(stylesheet).toContain('@keyframes vf-progress-bar-indeterminate-short {');
    expect(stylesheet).toContain('@keyframes vf-progress-bar-stripes {');
    expect(stylesheet).toMatch(
      /\.vf-progress-bar--indeterminate \.vf-progress-bar__value::before \{[^}]*animation: vf-progress-bar-indeterminate/,
    );
    expect(stylesheet).toMatch(
      /\.vf-progress-bar--striped\.vf-progress-bar--animated \.vf-progress-bar__value \{[^}]*animation: vf-progress-bar-stripes/,
    );
    expect(stylesheet).not.toMatch(/\.vf-progress-bar \{[^}]*animation/);
  });

  it('transitions the fill width from a stylesheet token, not from the component', () => {
    expect(stylesheet).toMatch(
      /\.vf-progress-bar__value \{[^}]*transition: inline-size var\(--vf-progress-bar-transition-duration\)/,
    );
    expect(mountBar({ props: { value: 50 } }).html()).not.toContain('--vf-progress-bar-transition');
  });

  it('paints one modifier rule per non-default tone and none for primary', () => {
    for (const tone of TONES) {
      const rule = `.vf-progress-bar--${tone} {`;

      if (tone === 'primary') expect(stylesheet).not.toContain(rule);
      else expect(stylesheet).toContain(rule);
    }
  });

  it('does not import or reuse the spinner stylesheet', () => {
    expect(stylesheet).not.toContain('progress-spinner');
  });
});
