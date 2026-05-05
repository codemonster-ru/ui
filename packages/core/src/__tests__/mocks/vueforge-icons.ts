import { defineComponent, h } from 'vue';

export const VueIconify = defineComponent({
  name: 'VueIconifyMock',
  props: {
    icon: {
      type: String,
      required: false,
      default: '',
    },
  },
  setup(props) {
    return () => h('span', { 'data-icon': props.icon });
  },
});

export const icons = new Proxy(
  {},
  {
    get: (_target, property) => String(property),
  },
) as Record<string, string>;
