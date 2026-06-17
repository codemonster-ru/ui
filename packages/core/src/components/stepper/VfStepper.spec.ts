import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VfStepper from './VfStepper.vue';
import type { VfStepperItem } from '@/types/components';

const items: VfStepperItem[] = [
  { value: 'account', label: 'Account' },
  { value: 'profile', label: 'Profile', description: 'Tell us about yourself' },
  { value: 'confirm', label: 'Confirm' },
];

describe('VfStepper', () => {
  it('renders current and completed steps from uncontrolled state', async () => {
    const wrapper = mount(VfStepper, {
      props: {
        items,
        defaultValue: 'profile',
      },
    });

    expect(wrapper.get('.vf-stepper__item--complete').text()).toContain('Account');
    expect(wrapper.get('.vf-stepper__item--current').text()).toContain('Profile');

    await wrapper.findAll('.vf-stepper__trigger')[2].trigger('click');

    expect(wrapper.get('.vf-stepper__item--current').text()).toContain('Confirm');
  });

  it('supports vertical orientation and keyboard navigation', async () => {
    const wrapper = mount(VfStepper, {
      attachTo: document.body,
      props: {
        items,
        orientation: 'vertical',
        defaultValue: 'account',
      },
    });

    expect(wrapper.get('.vf-stepper').classes()).toContain('vf-stepper--vertical');

    await wrapper.findAll('.vf-stepper__trigger')[0].trigger('keydown', { key: 'ArrowDown' });
    await nextTick();

    expect(wrapper.get('.vf-stepper__item--current').text()).toContain('Profile');
  });

  it('applies resolved content-position classes for each orientation', () => {
    const horizontal = mount(VfStepper, {
      props: {
        items,
        contentPosition: 'above',
      },
    });

    expect(horizontal.get('.vf-stepper').classes()).toContain('vf-stepper--content-above');

    const vertical = mount(VfStepper, {
      props: {
        items,
        orientation: 'vertical',
        contentPosition: 'start',
      },
    });

    expect(vertical.get('.vf-stepper').classes()).toContain('vf-stepper--content-start');
  });

  it('supports controlled mode', async () => {
    const wrapper = mount(
      defineComponent({
        components: { VfStepper },
        setup() {
          const value = ref('account');

          return () =>
            h(VfStepper, {
              items,
              modelValue: value.value,
              'onUpdate:modelValue': (nextValue: string) => {
                value.value = nextValue;
              },
            });
        },
      }),
    );

    await wrapper.findAll('.vf-stepper__trigger')[1].trigger('click');
    await nextTick();

    expect(wrapper.get('.vf-stepper__item--current').text()).toContain('Profile');
  });
});
