import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createSSRApp, h, nextTick } from 'vue';
import { vi } from 'vitest';
import VfCodeBlock from '../VfCodeBlock.vue';

const flushObserver = async () => {
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

const flushHighlight = async (wrapper: VueWrapper) => {
  for (let index = 0; index < 20; index += 1) {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 10));

    if (wrapper.findAll('.vf-codeblock__shiki-token').length > 0) {
      return;
    }
  }
};

const mountIntoHost = (props: Record<string, unknown>, hostAttributes: Record<string, string> = {}) => {
  const host = document.createElement('div');

  Object.entries(hostAttributes).forEach(([name, value]) => {
    host.setAttribute(name, value);
  });

  document.body.appendChild(host);

  const wrapper = mount(VfCodeBlock, {
    attachTo: host,
    props,
  });

  return { wrapper, host };
};

describe('VfCodeBlock', () => {
  it('renders highlighted TypeScript content and line numbers', async () => {
    const wrapper = mount(VfCodeBlock, {
      props: {
        language: 'ts',
        code: 'const value = 42;\nreturn value;',
        showLineNumbers: true,
      },
    });

    await flushHighlight(wrapper);

    expect(wrapper.findAll('.vf-codeblock__line-number')).toHaveLength(2);
    expect(wrapper.findAll('.vf-codeblock__shiki-token').length).toBeGreaterThan(0);
    expect(wrapper.html()).toContain('style=');
    expect(wrapper.text()).toContain('const value = 42;');
  });

  it('highlights advanced TypeScript syntax', async () => {
    const wrapper = mount(VfCodeBlock, {
      props: {
        language: 'ts',
        code: [
          'interface User { readonly id: number }',
          'type Nullable<T> = T | null;',
          "enum State { Ready = 'ready' }",
          'class Store<T> { private #value?: T }',
          "const state = 'ready' satisfies State;",
        ].join('\n'),
        showHeader: false,
        copyable: false,
      },
    });

    await flushHighlight(wrapper);

    expect(wrapper.html()).toContain('interface');
    expect(wrapper.findAll('.vf-codeblock__shiki-token').length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('satisfies');
  });

  it('highlights Vue directives and expressions', async () => {
    const wrapper = mount(VfCodeBlock, {
      props: {
        language: 'vue',
        code: `<Form
    v-model="values"
    :validate="validateForm"
    @submit-success="onSubmitSuccess"
>
    <template #default="{ values, setFieldValue }">
        <Input @update:model-value="v => setFieldValue('email', v)" />
    </template>
</Form>`,
        showHeader: false,
        copyable: false,
      },
    });

    await flushHighlight(wrapper);

    expect(wrapper.findAll('.vf-codeblock__shiki-token').length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('v-model');
    expect(wrapper.text()).toContain('@submit-success');
  });

  it('highlights shell keywords, variables, flags, and operators', async () => {
    const wrapper = mount(VfCodeBlock, {
      props: {
        language: 'bash',
        code: [
          'for file in src/**/*.ts; do',
          '  if [[ -f "$file" ]]; then',
          '    echo ${APP_ENV:-development}',
          '  fi',
          'done',
        ].join('\n'),
        showHeader: false,
        copyable: false,
      },
    });

    await flushHighlight(wrapper);

    expect(wrapper.findAll('.vf-codeblock__shiki-token').length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('${APP_ENV:-development}');
  });

  it('highlights CSS selectors, properties, values, and numbers', async () => {
    const wrapper = mount(VfCodeBlock, {
      props: {
        language: 'css',
        code: `/* app.css */
:root {
    --app-page-padding: 1rem;
}

body {
    margin: 0;
    font-family:
        ui-sans-serif,
        system-ui,
        sans-serif;
}`,
        showHeader: false,
        copyable: false,
      },
    });

    await flushHighlight(wrapper);

    expect(wrapper.findAll('.vf-codeblock__shiki-token').length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('--app-page-padding');
  });

  it('highlights CSS at-rules and Sass directives', async () => {
    const wrapper = mount(VfCodeBlock, {
      props: {
        language: 'scss',
        code: [
          '$brand: #0e639c;',
          '@mixin focus-ring($color: $brand) {',
          '  outline: 2px solid rgba($color, 0.45);',
          '}',
          '@media (prefers-color-scheme: dark) {',
          '  .toolbar,',
          '  &:focus-visible {',
          '    @include focus-ring;',
          '  }',
          '}',
        ].join('\n'),
        showHeader: false,
        copyable: false,
      },
    });

    await flushHighlight(wrapper);

    expect(wrapper.findAll('.vf-codeblock__shiki-token').length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('@mixin');
    expect(wrapper.text()).toContain('@include');
  });

  it('highlights npm run scripts in bash blocks', async () => {
    const wrapper = mount(VfCodeBlock, {
      props: {
        language: 'bash',
        code: 'npm run verify:bundle-size',
        showHeader: false,
        copyable: false,
      },
    });

    await flushHighlight(wrapper);

    expect(wrapper.findAll('.vf-codeblock__shiki-token').length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('npm run verify:bundle-size');
  });

  it('highlights npm install subcommands and scoped packages in bash blocks', async () => {
    const wrapper = mount(VfCodeBlock, {
      props: {
        language: 'bash',
        code: 'npm i @codemonster-ru/vueforge',
        showHeader: false,
        copyable: false,
      },
    });

    await flushHighlight(wrapper);

    expect(wrapper.findAll('.vf-codeblock__shiki-token').length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('@codemonster-ru/vueforge');
  });

  it('highlights shell aliases with Shiki', async () => {
    const wrapper = mount(VfCodeBlock, {
      props: {
        language: 'sh',
        code: 'echo $SHELL',
        showHeader: false,
        copyable: false,
      },
    });

    await flushHighlight(wrapper);

    expect(wrapper.findAll('.vf-codeblock__shiki-token').length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('echo $SHELL');
  });

  it('renders highlighted code during SSR', async () => {
    const app = createSSRApp(() =>
      h(VfCodeBlock, {
        code: 'const value = 42;',
        language: 'ts',
        theme: 'dark',
        showHeader: false,
        copyable: false,
      }),
    );
    const html = await renderToString(app);

    expect(html).toContain('vf-codeblock__shiki-token');
    expect(html).toContain('const');
    expect(html).toContain('value');
  });

  it('defines root block margins with spacing CSS variables', () => {
    const source = readFileSync(resolve(__dirname, '../VfCodeBlock.vue'), 'utf8');

    expect(source).toContain('margin-block:');
    expect(source).toContain('--vf-codeblock-margin-block-start');
    expect(source).toContain('--vf-codeblock-margin-block-end');
    expect(source).toContain('--vf-codeblock-margin-block: var(--vf-surface-padding)');
    expect(source).toContain('.vf-codeblock:first-child');
    expect(source).toContain('.vf-codeblock:last-child');
  });

  it('emits copy with raw code payload', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const wrapper = mount(VfCodeBlock, {
      props: {
        code: 'const demo = true;',
      },
    });

    await wrapper.get('.vf-codeblock__copy').trigger('click');

    expect(writeText).toHaveBeenCalledWith('const demo = true;');
    expect(wrapper.emitted('copy')).toEqual([[{ text: 'const demo = true;' }]]);

    vi.unstubAllGlobals();
  });

  it('keeps copy action available when header is hidden', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const wrapper = mount(VfCodeBlock, {
      props: {
        code: 'const hiddenHeader = true;',
        showHeader: false,
        copyable: true,
      },
    });

    expect(wrapper.find('.vf-codeblock__header').exists()).toBe(false);
    await wrapper.get('.vf-codeblock__copy').trigger('click');
    expect(writeText).toHaveBeenCalledWith('const hiddenHeader = true;');

    vi.unstubAllGlobals();
  });

  it('inherits dark theme from the closest data-theme ancestor', async () => {
    const { wrapper } = mountIntoHost(
      {
        code: 'const demo = true;',
        theme: 'inherit',
      },
      { 'data-theme': 'dark' },
    );

    await flushObserver();

    expect(wrapper.attributes('data-theme')).toBe('dark');
    wrapper.unmount();
  });

  it('inherits dark theme from data-vf-theme when data-theme is absent', async () => {
    const { wrapper } = mountIntoHost(
      {
        code: 'const demo = true;',
        theme: 'inherit',
      },
      { 'data-vf-theme': 'dark' },
    );

    await flushObserver();

    expect(wrapper.attributes('data-theme')).toBe('dark');
    wrapper.unmount();
  });

  it('falls back to light theme when no ancestor theme attributes are present', async () => {
    const { wrapper } = mountIntoHost({
      code: 'const demo = true;',
      theme: 'inherit',
    });

    await flushObserver();

    expect(wrapper.attributes('data-theme')).toBe('light');
    wrapper.unmount();
  });

  it.each(['dark', 'light'] as const)('keeps explicit theme=%s unchanged', async (theme) => {
    const { wrapper } = mountIntoHost(
      {
        code: 'const demo = true;',
        theme,
      },
      { 'data-vf-theme': theme === 'dark' ? 'light' : 'dark' },
    );

    await flushObserver();

    expect(wrapper.attributes('data-theme')).toBe(theme);
    wrapper.unmount();
  });

  it('prioritizes data-theme over data-vf-theme in inherit mode', async () => {
    const outer = document.createElement('div');
    outer.setAttribute('data-vf-theme', 'dark');
    const host = document.createElement('div');
    host.setAttribute('data-theme', 'light');
    outer.appendChild(host);
    document.body.appendChild(outer);

    const wrapper = mount(VfCodeBlock, {
      attachTo: host,
      props: {
        code: 'const demo = true;',
        theme: 'inherit',
      },
    });

    await flushObserver();

    expect(wrapper.attributes('data-theme')).toBe('light');
    wrapper.unmount();
  });

  it('keeps classic code mode behavior by default', async () => {
    const wrapper = mount(VfCodeBlock, {
      props: {
        code: 'const fallback = true;',
        language: 'ts',
      },
    });

    await flushHighlight(wrapper);

    expect(wrapper.findAll('.vf-codeblock__tab')).toHaveLength(0);
    expect(wrapper.find('.vf-codeblock__pre').exists()).toBe(true);
    expect(wrapper.text()).toContain('Language: ts');
  });
});
