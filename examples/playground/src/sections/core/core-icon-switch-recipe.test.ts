// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- Tests mount isolated controlled and slot hosts. */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import CoreIconSwitchRecipe from './CoreIconSwitchRecipe.vue';

describe('CoreIconSwitchRecipe', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => host.remove());

  it('keeps the frozen label, input, control, thumb, and content DOM', async () => {
    const app = createApp(CoreIconSwitchRecipe, {
      modelValue: true,
      label: 'Icon switch',
      checkedIcon: 'check',
      'aria-label': 'Icon preference',
      // eslint-disable-next-line vue/component-definition-name-casing -- Forwarded native form name.
      name: 'icon-preference',
    });
    app.mount(host);
    await nextTick();

    const root = host.querySelector('label')!;
    const children = [...root.children];
    expect(children.map((child) => child.className)).toEqual([
      'core-icon-switch-recipe__input',
      'core-icon-switch-recipe__control',
      'core-icon-switch-recipe__content',
    ]);
    expect(children[1]?.firstElementChild?.className).toBe('core-icon-switch-recipe__thumb');
    expect(host.querySelector<HTMLInputElement>('input')?.checked).toBe(true);
    expect(host.querySelector('input')?.getAttribute('role')).toBe('switch');
    expect(host.querySelector('input')?.getAttribute('aria-label')).toBe('Icon preference');
    expect(host.querySelector('input')?.getAttribute('name')).toBe('icon-preference');
    expect(host.querySelector('.core-icon-switch-recipe__content')?.textContent).toBe('Icon switch');
    expect(host.querySelector('.vf-icon-wrapper')).not.toBeNull();
    app.unmount();
  });

  it('is controlled and emits boolean update and change values', async () => {
    const checked = ref(false);
    const changes: boolean[] = [];
    const app = createApp(
      defineComponent(
        () => () =>
          h(CoreIconSwitchRecipe, {
            modelValue: checked.value,
            label: 'Controlled switch',
            'onUpdate:modelValue': (value: boolean) => (checked.value = value),
            onChange: (value: boolean) => changes.push(value),
          }),
      ),
    );
    app.mount(host);
    await nextTick();
    const input = host.querySelector<HTMLInputElement>('input')!;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await nextTick();
    expect(checked.value).toBe(true);
    expect(changes).toEqual([true]);
    expect(host.querySelector('label')?.classList).toContain('core-icon-switch-recipe--checked');
    expect(host.querySelector<HTMLInputElement>('input')?.checked).toBe(true);
    app.unmount();
  });

  it('supports sm, md, and lg geometry plus disabled and invalid semantics', async () => {
    const apps = ['sm', 'md', 'lg'].map((size) => {
      const mountPoint = document.createElement('div');
      host.append(mountPoint);
      const app = createApp(CoreIconSwitchRecipe, {
        size,
        disabled: size === 'md',
        invalid: size === 'lg',
        label: `${size} switch`,
      });
      app.mount(mountPoint);
      return app;
    });
    await nextTick();
    expect(host.querySelectorAll('.core-icon-switch-recipe--sm')).toHaveLength(1);
    expect(host.querySelectorAll('.core-icon-switch-recipe--md')).toHaveLength(1);
    expect(host.querySelectorAll('.core-icon-switch-recipe--lg')).toHaveLength(1);
    expect(host.querySelector('.core-icon-switch-recipe--disabled input')?.hasAttribute('disabled')).toBe(true);
    expect(host.querySelector('.core-icon-switch-recipe--invalid input')?.getAttribute('aria-invalid')).toBe('true');
    apps.forEach((app) => app.unmount());
  });

  it('passes checked state to the thumb slot and omits empty content geometry', async () => {
    const app = createApp(
      defineComponent(
        () => () =>
          h(
            CoreIconSwitchRecipe,
            { modelValue: true, 'aria-label': 'Thumb-only switch' },
            { thumb: ({ checked }: { checked: boolean }) => h('span', { 'data-checked': checked }, 'thumb') },
          ),
      ),
    );
    app.mount(host);
    await nextTick();
    expect(host.querySelector('[data-checked="true"]')?.textContent).toBe('thumb');
    expect(host.querySelector('.core-icon-switch-recipe__content')).toBeNull();
    app.unmount();
  });

  it('owns the two-level frozen icon sizing without legacy runtime or tokens', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreIconSwitchRecipe.vue'), 'utf8');
    expect(source).toContain('.core-icon-switch-recipe__thumb > :deep(.vf-icon-wrapper)');
    expect(source).toContain('.core-icon-switch-recipe__thumb > :deep(.vf-icon-wrapper > .vf-icon)');
    expect(source).toContain('--core-icon-switch-thumb-icon-size: 0.75rem');
    expect(source).not.toContain('--vf-');
    expect(source).not.toContain('@codemonster-ru/vueforge-core');
    expect(source).toContain('--cm-');
  });

  it('owns the only Core showcase icon-switch usage without changing its explicit thumb slot', () => {
    const showcase = readFileSync(resolve(process.cwd(), 'src/sections/core/CoreShowcase.vue'), 'utf8');
    expect(showcase.match(/<CoreIconSwitchRecipe\b/gu)).toHaveLength(1);
    expect(showcase).not.toMatch(/VfIconSwitch|VfSwitch as VfIconSwitch/u);
    expect(showcase).toContain('<template #thumb="{ checked }">');
    expect(showcase).toContain('<VueIconify :icon="checked ? icons.check : icons.xmark" />');
    expect(showcase).toContain('Icon switch\n                      </CoreIconSwitchRecipe>');
  });
});
