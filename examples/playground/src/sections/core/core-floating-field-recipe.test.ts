// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import CoreFloatingFieldRecipe, {
  type CoreFloatingFieldSlotContext,
  type CoreFloatingFieldVariant,
} from './CoreFloatingFieldRecipe.vue';
import CoreInputRecipe from './CoreInputRecipe.vue';
import CoreSelectRecipe from './CoreSelectRecipe.vue';

describe('CoreFloatingFieldRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => {
    host.remove();
    vi.restoreAllMocks();
  });

  function mountField(
    props: Record<string, unknown>,
    control: (scope: CoreFloatingFieldSlotContext) => ReturnType<typeof h>,
  ) {
    const app = createApp(defineComponent(() => () => h(CoreFloatingFieldRecipe, props, { default: control })));
    app.mount(host);
    return app;
  }

  it.each(['in', 'on', 'over'] as const)('owns frozen %s variant IDs and validation semantics', (variant) => {
    const app = mountField(
      {
        controlId: `account-${variant}`,
        description: 'Visible to workspace members.',
        error: 'Required value.',
        label: 'Account',
        required: true,
        variant: variant satisfies CoreFloatingFieldVariant,
      },
      ({ controlId, describedBy, invalid, required }) =>
        h('input', { id: controlId, 'aria-describedby': describedBy, 'aria-invalid': invalid, required }),
    );

    const root = host.querySelector('.demo-application-floating-field')!;
    const input = host.querySelector<HTMLInputElement>('input')!;
    const label = host.querySelector('label')!;
    expect(root.classList).toContain(`demo-application-floating-field--${variant}`);
    expect(root.classList).toContain('demo-application-floating-field--invalid');
    expect(label.htmlFor).toBe(`account-${variant}`);
    expect(label.textContent).toBe('Account*');
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(`account-${variant}-description account-${variant}-error`);
    expect(host.querySelector(`#account-${variant}-description`)?.textContent).toBe('Visible to workspace members.');
    expect(host.querySelector(`#account-${variant}-error`)?.textContent).toBe('Required value.');
    app.unmount();
  });

  it('coordinates focus and filled state with CoreInputRecipe through explicit slot context', async () => {
    const value = ref('initial query');
    const app = mountField({ controlId: 'search', label: 'Search', variant: 'in' }, (scope) =>
      h(CoreInputRecipe, {
        id: scope.controlId,
        floating: scope.floating,
        modelValue: value.value,
        'onUpdate:modelValue': (nextValue: string) => (value.value = nextValue),
      }),
    );

    const root = host.querySelector('.demo-application-floating-field')!;
    const input = host.querySelector<HTMLInputElement>('input')!;
    await nextTick();
    expect(root.getAttribute('data-filled')).toBe('true');
    input.focus();
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await nextTick();
    expect(root.getAttribute('data-focused')).toBe('true');
    expect(root.classList).toContain('demo-application-floating-field--active');

    input.value = 'query';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.blur();
    await nextTick();
    expect(root.getAttribute('data-filled')).toBe('true');
    expect(root.classList).toContain('demo-application-floating-field--active');
    app.unmount();
  });

  it('coordinates selected/open state with CoreSelectRecipe provider context', async () => {
    const app = mountField({ controlId: 'plan', label: 'Plan', variant: 'on' }, ({ controlId, describedBy }) =>
      h(CoreSelectRecipe, {
        id: controlId,
        'aria-describedby': describedBy,
        disableTeleport: true,
        modelValue: 'team',
        options: [
          { value: 'starter', label: 'Starter' },
          { value: 'team', label: 'Team' },
        ],
      }),
    );
    await nextTick();

    const root = host.querySelector('.demo-application-floating-field')!;
    expect(root.getAttribute('data-filled')).toBe('true');
    expect(root.classList).toContain('demo-application-floating-field--active');
    expect(host.querySelector('[data-core-select-floating-supported="true"]')).not.toBeNull();
    app.unmount();
  });

  it('supports textarea controls and explicit overlay-open coordination', async () => {
    const app = mountField({ controlId: 'notes', label: 'Notes', variant: 'over' }, (scope) =>
      h('div', [
        h('textarea', { id: scope.controlId, 'aria-describedby': scope.describedBy }),
        h('button', { onClick: () => scope.setOpen(true) }, 'Open suggestions'),
      ]),
    );
    const root = host.querySelector('.demo-application-floating-field')!;
    expect(host.querySelector('textarea#notes')).not.toBeNull();

    host.querySelector<HTMLButtonElement>('button')!.click();
    await nextTick();
    expect(root.getAttribute('data-open')).toBe('true');
    expect(root.classList).toContain('demo-application-floating-field--active');
    app.unmount();
  });

  it('stays standalone and CM-only', () => {
    const source = readFileSync(resolve(__dirname, 'CoreFloatingFieldRecipe.vue'), 'utf8');
    expect(source).not.toMatch(/--vf-|vueforge-core|VfField/u);
    expect(source).toContain("export type CoreFloatingFieldVariant = 'in' | 'on' | 'over'");
    expect(source).toContain('provide(coreSelectRecipeFieldContextKey, selectContext)');
    expect(source).toContain('setOpen: (open: boolean) => void');
    expect(source).toContain(':deep(textarea)');
  });

  it('owns only floating Input, Select, and Textarea showcase fields', () => {
    const showcase = readFileSync(resolve(__dirname, 'CoreShowcase.vue'), 'utf8');
    expect(showcase.match(/<CoreFloatingFieldRecipe\b/gu)).toHaveLength(12);
    expect(showcase.match(/<VfField\b/gu)).toHaveLength(1);
    expect(showcase).toContain('<VfField label="Release date" label-placement="floating"');
    expect(showcase).not.toMatch(/<Vf(?:Input|Select|FloatingTextarea)\b/u);
    expect(showcase.match(/<CmTextarea\b/gu)).toHaveLength(3);
  });
});
