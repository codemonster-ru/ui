// Characterization of the historical VfButton at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// These tests record observable behaviour before a Razor adapter is written
// against it. Where the reference does something surprising, the surprise is
// asserted as-is rather than fixed here.
//
// The one thing worth reading first: loading is not a visual state. It applies
// the native `disabled` attribute, so a loading button is genuinely inert to
// the pointer and the keyboard, and it renders a progress spinner that is
// exposed to assistive technology rather than hidden from it.
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import VfButton from './VfButton.vue';

type ButtonProps = InstanceType<typeof VfButton>['$props'];

function mountButton({
  props = {},
  attrs = {},
  slots = { default: 'Save' },
}: {
  props?: Partial<ButtonProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, string>;
} = {}) {
  return mount(VfButton, { attachTo: document.body, props: props as ButtonProps, attrs, slots });
}

describe('VfButton characterization: element and defaults', () => {
  it('renders a native button element', () => {
    expect(mountButton().element.tagName).toBe('BUTTON');
  });

  it('defaults to the primary variant, medium size and an explicit button type', () => {
    const button = mountButton().get('button');

    expect(button.classes()).toEqual(['vf-button', 'vf-button--primary']);
    expect(button.attributes('type')).toBe('button');
  });

  it('omits the size modifier at the default medium size', () => {
    // The default size is expressed by the absence of a class, so a stylesheet
    // cannot target it by name.
    const classes = mountButton({ props: { size: 'md' } })
      .get('button')
      .classes();

    expect(classes).not.toContain('vf-button--md');
    expect(classes).toEqual(['vf-button', 'vf-button--primary']);
  });

  it('is neither disabled nor busy by default', () => {
    const button = mountButton().get('button');

    expect(button.attributes('disabled')).toBeUndefined();
    expect(button.attributes('aria-busy')).toBeUndefined();
  });

  it('renders its default slot as the button content', () => {
    expect(
      mountButton({ slots: { default: 'Save changes' } })
        .get('button')
        .text(),
    ).toBe('Save changes');
  });

  it('renders no spinner when it is not loading', () => {
    expect(mountButton().find('.vf-button__spinner').exists()).toBe(false);
  });
});

describe('VfButton characterization: variants and sizes', () => {
  it('emits a modifier for every documented variant', () => {
    for (const variant of [
      'primary',
      'secondary',
      'success',
      'info',
      'warn',
      'help',
      'danger',
      'contrast',
      'ghost',
    ] as const) {
      expect(mountButton({ props: { variant } }).get('button').classes()).toContain(`vf-button--${variant}`);
    }
  });

  it('emits a modifier for the two non-default sizes', () => {
    for (const size of ['sm', 'lg'] as const) {
      expect(mountButton({ props: { size } }).get('button').classes()).toContain(`vf-button--${size}`);
    }
  });

  it('interpolates an undocumented variant or size into the class name without validating it', () => {
    // The reference does not check the prop against its own union, so a value
    // outside it still reaches the stylesheet as a modifier.
    const classes = mountButton({
      props: { variant: 'nonsense' as ButtonProps['variant'], size: 'xl' as ButtonProps['size'] },
    })
      .get('button')
      .classes();

    expect(classes).toContain('vf-button--nonsense');
    expect(classes).toContain('vf-button--xl');
  });

  it('emits the block modifier only when asked', () => {
    expect(
      mountButton({ props: { block: true } })
        .get('button')
        .classes(),
    ).toContain('vf-button--block');
    expect(mountButton().get('button').classes()).not.toContain('vf-button--block');
  });

  it('emits classes in a fixed order: base, variant, size, block, loading', () => {
    const classes = mountButton({ props: { variant: 'danger', size: 'lg', block: true, loading: true } })
      .get('button')
      .classes();

    expect(classes).toEqual([
      'vf-button',
      'vf-button--danger',
      'vf-button--lg',
      'vf-button--block',
      'vf-button--loading',
    ]);
  });
});

describe('VfButton characterization: type and native attributes', () => {
  it('lets the type prop override the default', () => {
    expect(
      mountButton({ props: { type: 'submit' } })
        .get('button')
        .attributes('type'),
    ).toBe('submit');
  });

  it('forwards native attributes onto the button', () => {
    const button = mountButton({
      attrs: { name: 'save', value: 'now', autofocus: true, 'data-testid': 'save' },
    }).get('button');

    expect(button.attributes('name')).toBe('save');
    expect(button.attributes('value')).toBe('now');
    expect(button.attributes('data-testid')).toBe('save');
  });

  it('forwards aria attributes onto the button', () => {
    const button = mountButton({ attrs: { 'aria-label': 'Save', 'aria-pressed': 'true' } }).get('button');

    expect(button.attributes('aria-label')).toBe('Save');
    expect(button.attributes('aria-pressed')).toBe('true');
  });

  it('merges a consumer class with the canonical ones rather than replacing them', () => {
    const classes = mountButton({ attrs: { class: 'consumer-button' } })
      .get('button')
      .classes();

    expect(classes).toContain('vf-button');
    expect(classes).toContain('vf-button--primary');
    expect(classes).toContain('consumer-button');
  });

  it('forwards a consumer style onto the button', () => {
    expect(
      mountButton({ attrs: { style: 'margin-top: 8px' } })
        .get('button')
        .attributes('style'),
    ).toBe('margin-top: 8px;');
  });
});

describe('VfButton characterization: disabled', () => {
  it('is disabled when the attribute is bound true', () => {
    expect(
      mountButton({ attrs: { disabled: true } })
        .get('button')
        .attributes('disabled'),
    ).toBeDefined();
  });

  it('is disabled when the attribute is present with an empty value', () => {
    expect(
      mountButton({ attrs: { disabled: '' } })
        .get('button')
        .attributes('disabled'),
    ).toBeDefined();
  });

  it('is NOT disabled when the attribute is the string "true"', () => {
    // A quirk, asserted as-is. The component compares against `true` and `''`
    // only, and its own `:disabled` binding is applied after the attribute
    // fallthrough, so a string value un-disables the button rather than
    // disabling it.
    expect(
      mountButton({ attrs: { disabled: 'true' } })
        .get('button')
        .attributes('disabled'),
    ).toBeUndefined();
  });

  it('is NOT disabled when the attribute is bound false', () => {
    expect(
      mountButton({ attrs: { disabled: false } })
        .get('button')
        .attributes('disabled'),
    ).toBeUndefined();
  });
});

describe('VfButton characterization: loading', () => {
  it('applies the loading modifier and marks the button busy', () => {
    const button = mountButton({ props: { loading: true } }).get('button');

    expect(button.classes()).toContain('vf-button--loading');
    expect(button.attributes('aria-busy')).toBe('true');
  });

  it('disables the button natively while loading, so it is genuinely inert', () => {
    // Loading is not a visual state: the native attribute is applied, which is
    // what stops both the pointer and the keyboard.
    expect(
      mountButton({ props: { loading: true } })
        .get('button')
        .attributes('disabled'),
    ).toBeDefined();
  });

  it('keeps its slot content while loading rather than replacing it', () => {
    expect(
      mountButton({ props: { loading: true }, slots: { default: 'Save' } })
        .get('button')
        .text(),
    ).toContain('Save');
  });

  it('renders the spinner before the slot content', () => {
    // Compared over child *nodes*, not elements: the slot is usually text, so
    // an element-only check would still see the spinner first after it moved.
    const nodes = [
      ...mountButton({ props: { loading: true }, slots: { default: 'Save' } }).get('button').element.childNodes,
    ];
    const spinner = nodes.findIndex(
      (node) => node instanceof HTMLElement && node.classList.contains('vf-button__spinner'),
    );
    const label = nodes.findIndex((node) => node.textContent?.trim() === 'Save');

    expect(spinner).toBeGreaterThanOrEqual(0);
    expect(label).toBeGreaterThanOrEqual(0);
    expect(spinner).toBeLessThan(label);
  });

  it('exposes the spinner to assistive technology as a named progressbar', () => {
    // Not decorative. The spinner keeps role=progressbar and its own
    // accessible name, so a loading button announces both.
    const spinner = mountButton({ props: { loading: true } }).get('.vf-button__spinner');

    expect(spinner.attributes('role')).toBe('progressbar');
    expect(spinner.attributes('aria-label')).toBe('Loading');
    expect(spinner.classes()).toContain('vf-progress-spinner');
  });

  it('hides the spinner artwork itself from assistive technology', () => {
    const svg = mountButton({ props: { loading: true } }).get('.vf-button__spinner svg');

    expect(svg.attributes('aria-hidden')).toBe('true');
    expect(svg.attributes('focusable')).toBe('false');
  });

  it('sizes the spinner from the button icon size and thickens its stroke', () => {
    const spinner = mountButton({ props: { loading: true } }).get('.vf-button__spinner');

    expect(spinner.attributes('style')).toContain('--vf-progress-spinner-size: var(--vf-icon-current-size)');
    expect(spinner.get('circle').attributes('stroke-width')).toBe('5');
  });

  it('stays disabled while loading even when the disabled attribute says otherwise', () => {
    expect(
      mountButton({ props: { loading: true }, attrs: { disabled: false } })
        .get('button')
        .attributes('disabled'),
    ).toBeDefined();
  });
});

describe('VfButton characterization: activation', () => {
  it('emits no click of its own; a listener reaches the native button through attrs', async () => {
    const clicks: unknown[] = [];
    const wrapper = mountButton({ attrs: { onClick: () => clicks.push('click') } });

    await wrapper.get('button').trigger('click');

    expect(clicks).toHaveLength(1);
  });

  it('does not activate while disabled', async () => {
    const clicks: unknown[] = [];
    const wrapper = mountButton({ attrs: { disabled: true, onClick: () => clicks.push('click') } });

    await wrapper.get('button').trigger('click');

    expect(clicks).toHaveLength(0);
  });

  it('does not activate while loading', async () => {
    const clicks: unknown[] = [];
    const wrapper = mountButton({ props: { loading: true }, attrs: { onClick: () => clicks.push('click') } });

    await wrapper.get('button').trigger('click');

    expect(clicks).toHaveLength(0);
  });

  it('takes its accessible name from its slot content', () => {
    expect(
      mountButton({ slots: { default: 'Save changes' } })
        .get('button')
        .text(),
    ).toBe('Save changes');
  });
});
