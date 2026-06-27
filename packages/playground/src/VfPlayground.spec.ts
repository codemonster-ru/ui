// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file */
import { defineComponent, h, markRaw } from 'vue';
import { mount } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import VfPlayground from './VfPlayground.vue';

const createSessionMock = vi.fn((options?: { iframe?: HTMLIFrameElement; files?: Record<string, string>; entry?: string }) => ({
  run: vi.fn(async () => {
    const iframe = options?.iframe;
    const entry = options?.entry ?? '';
    const html = options?.files?.[entry] ?? '<!doctype html><html><head></head><body></body></html>';
    if (iframe?.contentDocument) {
      iframe.contentDocument.open();
      iframe.contentDocument.write(html);
      iframe.contentDocument.close();
    }
  }),
  dispose: vi.fn(),
  updateFiles: vi.fn(),
  onRun: vi.fn(() => () => undefined),
  onConsole: vi.fn(() => () => undefined),
  onError: vi.fn(() => () => undefined)
}));

vi.mock('@codemonster-ru/vueforge-playground-core', () => ({
  createPlaygroundSession: (options: { iframe?: HTMLIFrameElement; files?: Record<string, string>; entry?: string }) =>
    createSessionMock(options)
}));

const TabsStub = defineComponent({
  name: 'VfTabs',
  props: {
    items: { type: Array, default: () => [] },
    modelValue: { type: String, default: '' }
  },
  emits: ['update:model-value'],
  setup(props) {
    return () =>
      h(
        'div',
        { class: 'vf-tabs-stub', 'data-model-value': props.modelValue },
        (props.items as Array<{ value: string; label: string }>).map((item) =>
          h('button', { key: item.value, class: 'vf-tabs-item', 'data-value': item.value }, item.label)
        )
      );
  }
});

const CodeBlockStub = defineComponent({
  name: 'VfCodeBlock',
  props: {
    code: { type: String, default: '' },
    language: { type: String, default: '' }
  },
  setup(props: { code: string; language: string }) {
    return () => h('pre', { class: 'vf-codeblock-stub', 'data-language': props.language }, props.code);
  }
});

const baseSandboxProps = {
  files: {
    '/main.ts': '<!doctype html><html><head></head><body><div>Hello</div></body></html>'
  },
  entry: '/main.ts'
} as const;

const testGlobal = {
  stubs: {
    VfTabs: TabsStub,
    VfCodeBlock: CodeBlockStub
  },
  config: {
    warnHandler: () => undefined
  }
} as const;

function findTabsHost(wrapper: ReturnType<typeof mount>) {
  return wrapper.find('.vf-tabs-stub').exists() ? wrapper.find('.vf-tabs-stub') : wrapper.find('.vf-tabs-shim');
}

function findCodeHost(wrapper: ReturnType<typeof mount>) {
  return wrapper.find('.vf-codeblock-stub').exists()
    ? wrapper.find('.vf-codeblock-stub')
    : wrapper.find('.vf-codeblock-shim');
}

function ensureIframeDocument(iframe: HTMLIFrameElement): Document {
  if (iframe.contentDocument) {
    return iframe.contentDocument;
  }
  const documentStub = window.document.implementation.createHTMLDocument('preview');
  Object.defineProperty(iframe, 'contentDocument', {
    configurable: true,
    value: documentStub
  });
  return documentStub;
}

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });
});

beforeEach(() => {
  createSessionMock.mockClear();
});

async function flushThemeSync(): Promise<void> {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function flushAnimationFrames(count = 2): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  }
}

describe('VfPlayground', () => {
  it.each([
    ['/config/.env', 'env'],
    ['/src/index.php', 'php'],
    ['/config/jobs.cron', 'cron'],
    ['/config/app.json', 'json']
  ])('passes the %s file language to CodeBlock', (entry, language) => {
    const wrapper = mount(VfPlayground, {
      props: {
        files: {
          [entry]: 'content'
        },
        entry
      },
      global: testGlobal
    });

    expect(findCodeHost(wrapper).attributes('data-language')).toBe(language);
  });

  it('applies minHeight and height to container style', () => {
    const wrapper = mount(VfPlayground, {
      props: {
        ...baseSandboxProps,
        minHeight: 260,
        height: 420
      },
      global: testGlobal
    });

    const styleValue = wrapper.attributes('style');
    expect(styleValue).toContain('min-height: 260px');
    expect(styleValue).toContain('height: 420px');
  });

  it('keeps sandbox mode behavior and renders iframe preview', async () => {
    const wrapper = mount(VfPlayground, {
      props: baseSandboxProps,
      global: testGlobal
    });

    await flushThemeSync();

    expect(wrapper.find('iframe.vf-playground__iframe').exists()).toBe(true);
    expect(createSessionMock).toHaveBeenCalledTimes(1);
  });

  it('renders component mode without iframe and shows demo component', async () => {
    const Demo = defineComponent({
      name: 'DemoComponent',
      setup() {
        return () => h('div', { class: 'demo-content' }, 'Component demo');
      }
    });

    const wrapper = mount(VfPlayground, {
      props: {
        mode: 'component',
        component: markRaw(Demo)
      },
      global: testGlobal
    });

    await flushThemeSync();

    expect(wrapper.find('iframe.vf-playground__iframe').exists()).toBe(false);
    expect(wrapper.find('.demo-content').text()).toBe('Component demo');
    expect(wrapper.find('.vf-tabs-item[data-value="preview"]').exists()).toBe(true);
    expect(wrapper.find('.vf-tabs-item[data-value="code"]').exists()).toBe(false);
    expect(wrapper.find('.vf-tabs-item[data-value="console"]').exists()).toBe(false);
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('emits ready and preview-ready in component mode', async () => {
    const Demo = defineComponent({
      name: 'DemoReadyEvents',
      setup() {
        return () => h('div', 'ready');
      }
    });

    const wrapper = mount(VfPlayground, {
      props: {
        mode: 'component',
        component: markRaw(Demo)
      },
      global: testGlobal
    });

    await flushThemeSync();

    expect(wrapper.emitted('preview-ready')).toBeTruthy();
    expect(wrapper.emitted('ready')).toBeTruthy();
    expect(wrapper.emitted('ready')?.length).toBe(1);
  });

  it('emits preview-ready before ready in component mode', async () => {
    const sequence: string[] = [];
    const Demo = defineComponent({
      name: 'DemoReadyOrder',
      setup() {
        return () => h('div', 'ready-order');
      }
    });

    mount(VfPlayground, {
      props: {
        mode: 'component',
        component: markRaw(Demo),
        onPreviewReady: () => sequence.push('preview-ready'),
        onReady: () => sequence.push('ready')
      },
      global: testGlobal
    });

    await flushThemeSync();
    await flushAnimationFrames(2);

    expect(sequence.length).toBeGreaterThan(0);
    expect(sequence[0]).toBe('preview-ready');
    expect(sequence).toContain('ready');
  });

  it('throws clear dev error when component mode has no component', () => {
    expect(() =>
      mount(VfPlayground, {
        props: {
          mode: 'component'
        } as never,
        global: testGlobal
      })
    ).toThrow('[VfPlayground] `component` is required when `mode` is "component".');
  });

  it('shows code tab in component mode when componentSource is provided', () => {
    const wrapper = mount(VfPlayground, {
      props: {
        mode: 'component',
        component: markRaw(
          defineComponent({
            name: 'ComponentWithSource',
            setup() {
              return () => h('div', 'preview');
            }
          })
        ),
        componentSource: '<template><div>preview</div></template>',
        componentSourceLanguage: 'vue'
      },
      global: testGlobal
    });

    expect(wrapper.find('.vf-tabs-item[data-value="code"]').exists()).toBe(true);
    expect(wrapper.find('.vf-tabs-item[data-value="preview"]').exists()).toBe(true);
    expect(findTabsHost(wrapper).attributes('data-model-value')).toBe('code');
    expect(findCodeHost(wrapper).attributes('data-language')).toBe('vue');
    expect(findCodeHost(wrapper).text()).toContain('<template><div>preview</div></template>');
  });

  it('uses initialTab preview in component mode when code is available', () => {
    const wrapper = mount(VfPlayground, {
      props: {
        mode: 'component',
        component: markRaw(
          defineComponent({
            name: 'ComponentInitialPreview',
            setup() {
              return () => h('div', 'preview');
            }
          })
        ),
        componentSource: '<template><div>preview</div></template>',
        initialTab: 'preview'
      },
      global: testGlobal
    });

    expect(wrapper.find('.vf-tabs-item[data-value="code"]').exists()).toBe(true);
    expect(findTabsHost(wrapper).attributes('data-model-value')).toBe('preview');
    expect(findCodeHost(wrapper).exists()).toBe(false);
  });

  it('falls back to preview when initialTab code is not available', () => {
    const wrapper = mount(VfPlayground, {
      props: {
        ...baseSandboxProps,
        showCode: false,
        initialTab: 'code'
      },
      global: testGlobal
    });

    expect(wrapper.find('.vf-tabs-item[data-value="code"]').exists()).toBe(false);
    expect(findTabsHost(wrapper).attributes('data-model-value')).toBe('preview');
  });

  it('uses initialTab console in sandbox mode', () => {
    const wrapper = mount(VfPlayground, {
      props: {
        ...baseSandboxProps,
        initialTab: 'console'
      },
      global: testGlobal
    });

    expect(wrapper.find('.vf-tabs-item[data-value="console"]').exists()).toBe(true);
    expect(findTabsHost(wrapper).attributes('data-model-value')).toBe('console');
  });

  it('falls back to preview when initialTab console is not available', () => {
    const wrapper = mount(VfPlayground, {
      props: {
        mode: 'component',
        component: markRaw(
          defineComponent({
            name: 'ComponentInitialConsole',
            setup() {
              return () => h('div', 'preview');
            }
          })
        ),
        componentSource: '<template><div>preview</div></template>',
        initialTab: 'console'
      },
      global: testGlobal
    });

    expect(wrapper.find('.vf-tabs-item[data-value="console"]').exists()).toBe(false);
    expect(findTabsHost(wrapper).attributes('data-model-value')).toBe('preview');
  });

  it('supports multi-file code view in component mode', () => {
    const wrapper = mount(VfPlayground, {
      props: {
        mode: 'component',
        component: markRaw(
          defineComponent({
            name: 'ComponentMultiFile',
            setup() {
              return () => h('div', 'preview');
            }
          })
        ),
        componentFiles: {
          'Demo.vue': '<template><DemoCard /></template>',
          'DemoCard.vue': '<template><div>Card</div></template>'
        },
        componentEntry: 'DemoCard.vue'
      },
      global: testGlobal
    });

    expect(wrapper.find('.vf-tabs-item[data-value="code"]').exists()).toBe(true);
    expect(wrapper.find('.vf-tabs-item[data-value="Demo.vue"]').exists()).toBe(true);
    expect(wrapper.find('.vf-tabs-item[data-value="DemoCard.vue"]').exists()).toBe(true);
    expect(findCodeHost(wrapper).text()).toContain('<template><div>Card</div></template>');
  });

  it('does not provide run action renderer in component mode', () => {
    const ActionsSpy = defineComponent({
      name: 'ActionsSpy',
      props: {
        run: { type: Function, default: undefined }
      },
      setup(props) {
        return () => h('div', { class: 'actions-spy', 'data-has-run': String(typeof props.run === 'function') });
      }
    });

    const wrapper = mount(VfPlayground, {
      props: {
        mode: 'component',
        component: markRaw(
          defineComponent({
          name: 'MinimalDemo',
          setup() {
            return () => h('div', 'x');
          }
          })
        ),
        actionsRenderer: ActionsSpy
      },
      global: testGlobal
    });

    expect(wrapper.find('.actions-spy').exists()).toBe(false);
  });

  it('syncs sandbox theme when prop changes light -> dark -> light', async () => {
    const wrapper = mount(VfPlayground, {
      props: {
        ...baseSandboxProps,
        theme: 'light'
      },
      global: testGlobal
    });

    await flushThemeSync();
    const iframe = wrapper.find('iframe.vf-playground__iframe').element as HTMLIFrameElement;
    ensureIframeDocument(iframe);
    iframe.dispatchEvent(new Event('load'));
    await flushThemeSync();
    expect(iframe.contentDocument?.documentElement.getAttribute('data-theme')).toBe('light');

    await wrapper.setProps({ theme: 'dark' });
    await flushThemeSync();
    expect(iframe.contentDocument?.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(iframe.contentDocument?.documentElement.classList.contains('vf-theme-dark')).toBe(true);

    await wrapper.setProps({ theme: 'light' });
    await flushThemeSync();
    expect(iframe.contentDocument?.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('syncs sandbox theme in inherit mode from host root attributes', async () => {
    document.documentElement.setAttribute('data-theme', 'light');
    const wrapper = mount(VfPlayground, {
      props: {
        ...baseSandboxProps,
        theme: 'inherit'
      },
      global: testGlobal
    });

    const iframe = wrapper.find('iframe.vf-playground__iframe').element as HTMLIFrameElement;
    ensureIframeDocument(iframe);
    await flushThemeSync();
    expect(iframe.contentDocument?.documentElement.getAttribute('data-theme')).toBe('light');

    document.documentElement.setAttribute('data-theme', 'dark');
    await flushThemeSync();
    expect(iframe.contentDocument?.documentElement.getAttribute('data-theme')).toBe('dark');

    document.documentElement.removeAttribute('data-theme');
  });

  it('applies sandbox theme without relying on parent access or external script loading', async () => {
    const wrapper = mount(VfPlayground, {
      props: {
        files: {
          '/index.html': '<!doctype html><html><head></head><body><script src="/main.js"></script></body></html>'
        },
        entry: '/index.html',
        theme: 'dark'
      },
      global: testGlobal
    });

    await flushThemeSync();
    const iframe = wrapper.find('iframe.vf-playground__iframe').element as HTMLIFrameElement;
    ensureIframeDocument(iframe);
    iframe.dispatchEvent(new Event('load'));
    await flushThemeSync();
    const iframeRoot = iframe.contentDocument?.documentElement;
    expect(iframeRoot?.getAttribute('data-theme')).toBe('dark');
    expect(iframe.contentDocument?.getElementById('vf-playground-theme-sync')).toBeTruthy();
  });

  it('keeps playground codeblock overrides layout-only', () => {
    const tokensSource = readFileSync(resolve(__dirname, './tokens.css'), 'utf8');
    const componentSource = readFileSync(resolve(__dirname, './playground.css'), 'utf8');

    expect(tokensSource).toContain('--vf-playground-codeblock-max-height: 100%');
    expect(tokensSource).toContain('--vf-playground-codeblock-border-color: transparent;');
    expect(tokensSource).toContain('--vf-playground-codeblock-border-radius: 0;');
    expect(tokensSource).toContain('--vf-playground-codeblock-shadow: none;');
    expect(componentSource).toContain('--vf-codeblock-max-height: var(--vf-playground-codeblock-max-height)');
    expect(componentSource).not.toContain('--vf-codeblock-background-color:');
    expect(componentSource).not.toContain('--vf-codeblock-header-background-color:');
    expect(componentSource).not.toContain('--vf-codeblock-action-background-color:');
  });

  it('keeps sandbox runtime behind a dynamic import', () => {
    const source = readFileSync(resolve(__dirname, './VfPlayground.vue'), 'utf8');

    expect(source).not.toMatch(
      /import\s+\{[^}]*createPlaygroundSession[^}]*\}\s+from\s+['"]@codemonster-ru\/vueforge-playground-core['"]/
    );
    expect(source).toContain("import('@codemonster-ru/vueforge-playground-core')");
  });

  it('emits ready and preview-ready on sandbox iframe load', async () => {
    const wrapper = mount(VfPlayground, {
      props: baseSandboxProps,
      global: testGlobal
    });

    await flushThemeSync();
    const iframe = wrapper.find('iframe.vf-playground__iframe').element as HTMLIFrameElement;
    ensureIframeDocument(iframe);
    iframe.dispatchEvent(new Event('load'));
    await flushThemeSync();

    expect(wrapper.emitted('preview-ready')).toBeTruthy();
    expect(wrapper.emitted('ready')).toBeTruthy();
    expect(wrapper.emitted('ready')?.length).toBe(1);
  });

  it('does not schedule mounted ready fallback frames in sandbox mode', async () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    const wrapper = mount(VfPlayground, {
      props: baseSandboxProps,
      global: testGlobal
    });

    await flushThemeSync();

    expect(rafSpy).not.toHaveBeenCalled();
    wrapper.unmount();
    rafSpy.mockRestore();
  });
});
