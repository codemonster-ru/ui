import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import VfStepper from './VfStepper.vue';
import type { VfStepperItem } from '@/types/components';

const items: VfStepperItem[] = [
  { value: 'account', label: 'Account' },
  { value: 'profile', label: 'Profile', description: 'Tell us about yourself' },
  { value: 'confirm', label: 'Confirm' },
];

describe('VfStepper', () => {
  it('keeps its palette semantic-first without bypassing existing component tokens', () => {
    const stepperCss = readFileSync(resolve(process.cwd(), 'src/styles/entries/stepper.css'), 'utf8');

    expect(stepperCss).not.toContain('var(--vf-palette-');
    expect(stepperCss).toContain('var(--vf-stepper-rail-color)');
    expect(stepperCss).toContain('var(--vf-stepper-focus-ring-color)');
    expect(stepperCss).toContain('var(--vf-color-border-disabled, var(--vf-stepper-rail-color))');
    expect(stepperCss).toContain('var(--vf-color-background-surface-disabled, var(--vf-stepper-marker-background))');
    expect(stepperCss).toContain('color: var(--vf-stepper-disabled-color);');
  });

  it('keeps horizontal connector segments flush at shared seams', () => {
    const stepperCss = readFileSync(resolve(process.cwd(), 'src/styles/entries/stepper.css'), 'utf8');

    expect(stepperCss).toMatch(/\.vf-stepper--horizontal \.vf-stepper__connector\s*{[^}]*border-radius: 0;/);
  });

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
