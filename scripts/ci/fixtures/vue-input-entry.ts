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
import VfStepper from '@codemonster-ru/vueforge-core/src/components/stepper/VfStepper.vue';
import VfTabs from '@codemonster-ru/vueforge-core/src/components/tabs/VfTabs.vue';
import VfGroupBox from '@codemonster-ru/vueforge-core/src/components/group-box/VfGroupBox.vue';

// One app, three real components. The accordion joined in M22: its trigger is
// a native button with the same classes the Razor controller mounts on - minus
// the ownership marker - so it is the sharpest test that the controller mounts
// by marker and not by class. The stepper joined in M23 for the same reason,
// with the same item values the Razor fixtures use: the Razor controller must
// neither mount it nor move its focus into a Vue trigger. The tabs joined in
// M24, with the same values again: a Vue tabs' role=tab buttons carry the
// same classes the Razor tabs controller mounts on. The group box joined in
// M29: its fieldset and ghost trigger carry the same classes the Razor group
// box controller mounts on, minus the ownership marker.
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
      h(VfStepper, {
        id: 'vue-stepper-root',
        items: [
          { value: 'account', label: 'Account' },
          { value: 'profile', label: 'Profile' },
          { value: 'confirm', label: 'Confirm' },
        ],
      }),
      h(
        VfTabs,
        {
          id: 'vue-tabs-root',
          items: [
            { value: 'overview', label: 'Overview' },
            { value: 'settings', label: 'Settings' },
            { value: 'billing', label: 'Billing' },
          ],
        },
        { panel: ({ activeValue }: { activeValue: string }) => h('p', `Vue panel ${activeValue}`) },
      ),
      h(
        VfGroupBox,
        { id: 'vue-group-box-root', title: 'Vue group box', collapsible: true },
        { default: () => h('p', 'Vue group box content.') },
      ),
    ]);
  },
}).mount('#vue-input');
