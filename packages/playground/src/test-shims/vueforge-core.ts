import { defineComponent, h } from 'vue';

export interface VfTabItem {
  value: string;
  label: string;
}

export const VfTabs = defineComponent({
  name: 'VfTabsShim',
  props: {
    items: { type: Array, default: () => [] },
    modelValue: { type: String, default: '' }
  },
  emits: ['update:model-value'],
  setup(props) {
    return () =>
      h(
        'div',
        { class: 'vf-tabs-shim', 'data-model-value': props.modelValue },
        (props.items as VfTabItem[]).map((item) =>
          h('button', { key: item.value, class: 'vf-tabs-item', 'data-value': item.value }, item.label)
        )
      );
  }
});
