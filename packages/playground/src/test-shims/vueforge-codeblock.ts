import { defineComponent, h } from 'vue';

export const VfCodeBlock = defineComponent({
  name: 'VfCodeBlockShim',
  props: {
    code: { type: String, default: '' },
    language: { type: String, default: '' }
  },
  setup(props) {
    return () => h('pre', { class: 'vf-codeblock-shim', 'data-language': props.language }, props.code);
  }
});
