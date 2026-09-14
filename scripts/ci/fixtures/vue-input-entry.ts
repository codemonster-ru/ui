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
import VfAccordion from '@codemonster-ru/vueforge-core/src/components/accordion/VfAccordion.vue';

// One app, two real components. The accordion joined in M22: its trigger is
// a native button with the same classes the Razor controller mounts on - minus
// the ownership marker - so it is the sharpest test that the controller mounts
// by marker and not by class.
createApp({
  data: () => ({ value: 'vue-value' }),
  render() {
    return h('div', [
      h(VfInput, {
        id: 'vue-control',
        name: 'vue',
        modelValue: this.value,
        clearable: true,
        'onUpdate:modelValue': (next: string) => {
          this.value = next;
        },
      }),
      h(VfAccordion, { id: 'vue-accordion-root', title: 'Vue accordion' }, { default: () => 'Vue content.' }),
    ]);
  },
}).mount('#vue-input');
