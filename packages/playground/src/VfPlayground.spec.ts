// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file */
import { defineComponent, h, markRaw } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import VfPlayground from './VfPlayground.vue';

const createSessionMock = vi.fn(() => ({
  run: vi.fn(async () => undefined),
  dispose: vi.fn(),
  updateFiles: vi.fn(),
  onRun: vi.fn(() => () => undefined),
  onConsole: vi.fn(() => () => undefined),
  onError: vi.fn(() => () => undefined)
}));

vi.mock('@codemonster-ru/vueforge-playground-core', () => ({
  createPlaygroundSession: () => createSessionMock()
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
    '/main.ts': 'console.log("hello")'
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

describe('VfPlayground', () => {
  it('keeps sandbox mode behavior and renders iframe preview', () => {
    const wrapper = mount(VfPlayground, {
      props: baseSandboxProps,
      global: testGlobal
    });

    expect(wrapper.find('iframe.vf-playground__iframe').exists()).toBe(true);
    expect(createSessionMock).toHaveBeenCalledTimes(1);
  });

  it('renders component mode without iframe and shows demo component', () => {
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

    expect(wrapper.find('iframe.vf-playground__iframe').exists()).toBe(false);
    expect(wrapper.find('.demo-content').text()).toBe('Component demo');
    expect(wrapper.find('.vf-tabs-item[data-value="preview"]').exists()).toBe(true);
    expect(wrapper.find('.vf-tabs-item[data-value="code"]').exists()).toBe(false);
    expect(wrapper.find('.vf-tabs-item[data-value="console"]').exists()).toBe(false);
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
});
