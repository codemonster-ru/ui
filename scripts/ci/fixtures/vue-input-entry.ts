// The Vue half of the mixed-ownership fixture.
//
// Mounts the real current VfInput next to Razor-rendered controls so the
// browser suite can prove the Razor controller never touches a Vue root.
//
// It lives in the CI fixtures rather than inside packages/razor on purpose: the
// Razor adapter must never depend on Vue or on the Vue adapter package, and the
// boundary guard enforces exactly that. This is cross-adapter test
// infrastructure, not part of either package.
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
