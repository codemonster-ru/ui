// Characterization of the historical VfIconButton at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// These tests record observable behaviour before the Razor adapter is written
// against it. They are not a proposal: where the reference does something
// surprising, the surprise is asserted as-is rather than fixed here.
//
// The shared core setup stubs the icon registry with a component that renders
// no attributes, which would make every icon indistinguishable. This file
// installs a stub that echoes the requested glyph and size so the icon contract
// is actually observable.
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@codemonster-ru/vueforge-icons', () => ({
  VueIconify: {
    name: 'VueIconifyCharacterizationStub',
    props: ['icon', 'size'],
    // aria-hidden is deliberately NOT hardcoded here: it is part of the
    // contract under test, so it has to fall through from the component. A stub
    // that supplied it made the assertion pass no matter what the component did.
    template: '<span class="vf-icon" :data-icon="icon" :data-size="size" />',
  },
  icons: new Proxy({}, { get: (_target, property) => String(property) }),
}));

import VfIconButton from './VfIconButton.vue';

type IconButtonProps = InstanceType<typeof VfIconButton>['$props'];

function mountIconButton({
  props = {},
  attrs = {},
}: { props?: Partial<IconButtonProps>; attrs?: Record<string, unknown> } = {}) {
  return mount(VfIconButton, {
    attachTo: document.body,
    props: { icon: 'xmark', ...props } as IconButtonProps,
    attrs,
  });
}

describe('VfIconButton characterization: element and defaults', () => {
  it('renders a native button element', () => {
    const wrapper = mountIconButton();

    expect(wrapper.element.tagName).toBe('BUTTON');
  });

  it('defaults to a ghost variant, medium size and an explicit button type', () => {
    const button = mountIconButton().get('button');

    expect(button.classes()).toEqual(['vf-icon-button', 'vf-icon-button--ghost']);
    expect(button.attributes('type')).toBe('button');
  });

  it('omits the size modifier at the default medium size', () => {
    const classes = mountIconButton({ props: { icon: 'xmark', size: 'md' } }).get('button').classes();

    expect(classes).not.toContain('vf-icon-button--md');
    expect(classes).toEqual(['vf-icon-button', 'vf-icon-button--ghost']);
  });

  it('renders exactly one icon and no text', () => {
    const wrapper = mountIconButton();

    expect(wrapper.findAll('.vf-icon')).toHaveLength(1);
    expect(wrapper.text()).toBe('');
  });
});

describe('VfIconButton characterization: variants and sizes', () => {
  it.each(['primary', 'secondary', 'success', 'info', 'warn', 'help', 'danger', 'contrast', 'ghost'] as const)(
    'adds the %s variant modifier',
    (variant) => {
      const classes = mountIconButton({ props: { icon: 'xmark', variant } }).get('button').classes();

      expect(classes).toContain(`vf-icon-button--${variant}`);
      expect(classes[0]).toBe('vf-icon-button');
    },
  );

  it.each([
    ['sm', 'vf-icon-button--sm'],
    ['lg', 'vf-icon-button--lg'],
  ] as const)('adds the %s size modifier', (size, expected) => {
    expect(mountIconButton({ props: { icon: 'xmark', size } }).get('button').classes()).toContain(expected);
  });

  it.each([
    ['sm', 'var(--vf-icon-size-sm)'],
    ['md', 'var(--vf-icon-size-md)'],
    ['lg', 'var(--vf-icon-size-lg)'],
  ] as const)('sizes the glyph for %s through the icon size token', (size, expected) => {
    const icon = mountIconButton({ props: { icon: 'xmark', size } }).get('.vf-icon');

    expect(icon.attributes('data-size')).toBe(expected);
  });
});

describe('VfIconButton characterization: icon contract', () => {
  it('passes the requested glyph name straight through', () => {
    expect(mountIconButton({ props: { icon: 'eye' } }).get('.vf-icon').attributes('data-icon')).toBe('eye');
    expect(mountIconButton({ props: { icon: 'eye-slash' } }).get('.vf-icon').attributes('data-icon')).toBe('eye-slash');
  });

  it('hides the glyph from assistive technology, so the button owns the accessible name', () => {
    expect(mountIconButton().get('.vf-icon').attributes('aria-hidden')).toBe('true');
  });
});

describe('VfIconButton characterization: attribute forwarding', () => {
  it('forwards native and aria attributes onto the button', () => {
    const button = mountIconButton({
      props: { icon: 'xmark' },
      attrs: {
        'aria-label': 'Clear input',
        'aria-pressed': 'false',
        id: 'clear-control',
        title: 'Clear',
        name: 'clear',
        'data-testid': 'clear',
      },
    }).get('button');

    expect(button.attributes('aria-label')).toBe('Clear input');
    expect(button.attributes('aria-pressed')).toBe('false');
    expect(button.attributes('id')).toBe('clear-control');
    expect(button.attributes('title')).toBe('Clear');
    expect(button.attributes('name')).toBe('clear');
    expect(button.attributes('data-testid')).toBe('clear');
  });

  it('merges a consumer class with the canonical classes rather than replacing them', () => {
    const classes = mountIconButton({ props: { icon: 'xmark' }, attrs: { class: 'consumer-class' } })
      .get('button')
      .classes();

    expect(classes).toContain('vf-icon-button');
    expect(classes).toContain('vf-icon-button--ghost');
    expect(classes).toContain('consumer-class');
  });

  it('keeps a consumer style on the button', () => {
    const button = mountIconButton({ props: { icon: 'xmark' }, attrs: { style: 'margin-top: 4px;' } }).get('button');

    expect(button.attributes('style')).toContain('margin-top: 4px');
  });

  it('lets a consumer override the rendered type through the prop', () => {
    expect(mountIconButton({ props: { icon: 'xmark', type: 'submit' } }).get('button').attributes('type')).toBe(
      'submit',
    );
  });
});

describe('VfIconButton characterization: disabled and activation', () => {
  it('renders the native disabled attribute a consumer supplies', () => {
    const button = mountIconButton({ props: { icon: 'xmark' }, attrs: { disabled: true } }).get('button');

    expect(button.attributes('disabled')).toBeDefined();
    expect((button.element as HTMLButtonElement).disabled).toBe(true);
  });

  it('emits no component event of its own: click is the native one', async () => {
    const wrapper = mountIconButton();
    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted()).toEqual({ click: [expect.anything()] });
  });

  it('does not activate while disabled', async () => {
    const onClick = vi.fn();
    const wrapper = mountIconButton({ props: { icon: 'xmark' }, attrs: { disabled: true, onClick } });
    (wrapper.get('button').element as HTMLButtonElement).click();

    expect(onClick).not.toHaveBeenCalled();
  });

  it('is focusable when enabled and not focusable when disabled', () => {
    const enabled = mountIconButton().get('button').element as HTMLButtonElement;
    enabled.focus();
    expect(document.activeElement).toBe(enabled);

    const disabled = mountIconButton({ props: { icon: 'xmark' }, attrs: { disabled: true } }).get('button')
      .element as HTMLButtonElement;
    disabled.focus();
    expect(document.activeElement).not.toBe(disabled);
  });
});
