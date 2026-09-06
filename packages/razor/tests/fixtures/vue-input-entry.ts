// The Vue half of the mixed-ownership fixture.
//
// Mounts the real current VfInput next to Razor-rendered controls so the
// browser suite can prove the Razor controller never touches a Vue root.
import { createApp, h } from 'vue';
import VfInput from '@codemonster-ru/vueforge-core/src/components/input/VfInput.vue';

createApp({
  data: () => ({ value: 'vue-value' }),
  render() {
    return h(VfInput, {
      id: 'vue-control',
      name: 'vue',
      modelValue: this.value,
      clearable: true,
      'onUpdate:modelValue': (next: string) => {
        this.value = next;
      },
    });
  },
}).mount('#vue-input');
