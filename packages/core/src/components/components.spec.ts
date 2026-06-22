/* eslint-disable vue/one-component-per-file */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import {
  VfAlert,
  VfBadge,
  VfBreadcrumbs,
  VfButton,
  VfCard,
  VfCheckbox,
  VfCommandPalette,
  VfDialog,
  VfDivider,
  VfDrawer,
  VfField,
  VfFieldset,
  VfIconButton,
  VfInput,
  VfLink,
  VfPanel,
  VfRadio,
  VfSelect,
  VfSkeleton,
  VfSkeletonGate,
  VfStepper,
  VfSwitch,
  VfTable,
  VfTableOfContents,
  VfThemeSwitch,
  VfTag,
  VfTextarea,
} from '@/components';
import VfThemeProvider from '@/providers/VfThemeProvider.vue';

const SwitchThumbProbe = defineComponent({
  components: {
    VfSwitch,
  },
  data() {
    return {
      value: false,
    };
  },
  template: `
    <VfSwitch v-model="value">
      <template #thumb="{ checked }">
        {{ checked ? 'on' : 'off' }}
      </template>
    </VfSwitch>
  `,
});

const ThemeSwitchProbe = defineComponent({
  components: {
    VfThemeProvider,
    VfThemeSwitch,
  },
  template: `
    <VfThemeProvider default-theme="system">
      <VfThemeSwitch />
    </VfThemeProvider>
  `,
});

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-vf-theme');
});

describe('core primitives', () => {
  it('renders skeleton primitive with sizing styles', () => {
    const wrapper = mount(VfSkeleton, {
      props: {
        minHeight: 120,
      },
    });

    expect(wrapper.classes()).toContain('vf-skeleton');
    expect(wrapper.attributes('style')).toContain('min-height: 120px');
  });

  it('shows skeleton slot until content is ready', async () => {
    const wrapper = mount(VfSkeletonGate, {
      props: {
        ready: false,
        minHeight: 180,
      },
      slots: {
        default: '<div class="content">Loaded</div>',
        skeleton: '<div class="skeleton">Loading</div>',
      },
    });

    expect(wrapper.find('.skeleton').exists()).toBe(true);
    expect(wrapper.attributes('style')).toContain('min-height: 180px');
    expect(wrapper.find('.vf-skeleton-gate__content').classes()).not.toContain('vf-skeleton-gate__content--ready');

    await wrapper.setProps({ ready: true });
    await nextTick();

    expect(wrapper.find('.skeleton').isVisible()).toBe(false);
    expect(wrapper.find('.vf-skeleton-gate__content').classes()).toContain('vf-skeleton-gate__content--ready');
  });

  it('uses reserveHeight as initial placeholder size', () => {
    const wrapper = mount(VfSkeletonGate, {
      props: {
        ready: false,
        reserveHeight: 240,
      },
      slots: {
        default: '<div>Loaded</div>',
      },
    });

    expect(wrapper.attributes('style')).toContain('min-height: 240px');
  });

  it('preserves last measured height when toggling back to skeleton', async () => {
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    try {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get() {
          const element = this as HTMLElement;
          if (element.classList.contains('vf-skeleton-gate__content')) {
            return 312;
          }
          return 0;
        },
      });

      const wrapper = mount(VfSkeletonGate, {
        props: {
          ready: true,
          preserveLastHeight: true,
        },
        slots: {
          default: '<div class="content">Loaded</div>',
        },
      });

      await nextTick();
      await wrapper.setProps({ ready: false });
      await nextTick();

      expect(wrapper.attributes('style')).toContain('min-height: 312px');
    } finally {
      if (originalOffsetHeight) {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
      }
    }
  });

  it('applies normalizeContentSpacing class when enabled', () => {
    const wrapper = mount(VfSkeletonGate, {
      props: {
        normalizeContentSpacing: true,
      },
      slots: {
        default: '<section class="content">Loaded</section>',
      },
    });

    expect(wrapper.find('.vf-skeleton-gate__content').classes()).toContain(
      'vf-skeleton-gate__content--normalize-spacing'
    );
  });

  it('renders button variants and respects native attributes', async () => {
    const wrapper = mount(VfButton, {
      props: {
        variant: 'danger',
        size: 'sm',
        disabled: true,
      },
      slots: {
        default: 'Save',
      },
    });

    expect(wrapper.attributes('type')).toBe('button');
    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.classes()).toContain('vf-button--danger');
    expect(wrapper.classes()).toContain('vf-button--sm');
    expect(wrapper.text()).toBe('Save');
  });

  it('renders stepper and updates the current step', async () => {
    const wrapper = mount(VfStepper, {
      props: {
        items: [
          { value: 'account', label: 'Account' },
          { value: 'profile', label: 'Profile' },
          { value: 'confirm', label: 'Confirm' },
        ],
        defaultValue: 'account',
      },
    });

    expect(wrapper.get('.vf-stepper__item--current').text()).toContain('Account');

    await wrapper.findAll('.vf-stepper__trigger')[1].trigger('click');
    await nextTick();

    expect(wrapper.get('.vf-stepper__item--current').text()).toContain('Profile');
  });

  it('adds safe rel defaults for external links', () => {
    const wrapper = mount(VfLink, {
      props: {
        href: 'https://example.com',
        target: '_blank',
        underline: 'always',
      },
      slots: {
        default: 'Docs',
      },
    });

    expect(wrapper.attributes('rel')).toBe('noopener noreferrer');
    expect(wrapper.classes()).toContain('vf-link--underline-always');
  });

  it('preserves external link classes', () => {
    const wrapper = mount(VfLink, {
      attrs: {
        class: 'custom-link',
      },
      props: {
        href: '/',
      },
      slots: {
        default: 'Home',
      },
    });

    expect(wrapper.classes()).toContain('vf-link');
    expect(wrapper.classes()).toContain('custom-link');
  });

  it('supports router-style links via to prop', () => {
    const wrapper = mount(VfLink, {
      props: {
        to: '/docs',
        underline: 'hover',
      },
      slots: {
        default: 'Docs',
      },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :data-to="to" :class="$attrs.class"><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.attributes('data-to')).toBe('/docs');
    expect(wrapper.classes()).toContain('vf-link--underline-hover');
  });

  it('renders card title and slots', () => {
    const wrapper = mount(VfCard, {
      props: {
        title: 'Overview',
      },
      slots: {
        default: 'Body copy',
        footer: 'Footer',
      },
    });

    expect(wrapper.find('.vf-card__title').text()).toBe('Overview');
    expect(wrapper.text()).toContain('Body copy');
    expect(wrapper.text()).toContain('Footer');
  });

  it('renders breadcrumbs with current item and links', () => {
    const wrapper = mount(VfBreadcrumbs, {
      props: {
        items: [
          { label: 'Docs', href: '/docs' },
          { label: 'Components', href: '/components' },
          { label: 'Breadcrumbs', current: true },
        ],
      },
    });

    const links = wrapper.findAll('.vf-breadcrumbs__link');
    expect(links).toHaveLength(2);
    expect(links[0].attributes('href')).toBe('/docs');
    expect(wrapper.find('[aria-current="page"]').text()).toBe('Breadcrumbs');
  });

  it('renders table structure with caption, head, body, and footer', () => {
    const wrapper = mount(VfTable, {
      props: {
        caption: 'API surface',
        striped: true,
      },
      slots: {
        header: `
          <tr>
            <th>Prop</th>
            <th>Type</th>
          </tr>
        `,
        default: `
          <tr>
            <td>size</td>
            <td>string</td>
          </tr>
        `,
        footer: `
          <tr>
            <td colspan="2">End</td>
          </tr>
        `,
      },
    });

    expect(wrapper.classes()).toContain('vf-table-wrap');
    expect(wrapper.find('caption').text()).toBe('API surface');
    expect(wrapper.findAll('thead th')).toHaveLength(2);
    expect(wrapper.find('tbody td').text()).toBe('size');
    expect(wrapper.find('.vf-table').classes()).toContain('vf-table--striped');
    expect(wrapper.find('tfoot td').text()).toBe('End');
  });

  it('emits input updates and invalid state', async () => {
    const wrapper = mount(VfInput, {
      props: {
        modelValue: 'hello',
        invalid: true,
        placeholder: 'Type here',
      },
    });

    expect(wrapper.attributes('aria-invalid')).toBe('true');
    expect(wrapper.attributes('placeholder')).toBe('Type here');

    await wrapper.setValue('world');

    expect(wrapper.emitted('update:modelValue')).toEqual([['world']]);
  });

  it('renders leading and trailing input icons', async () => {
    const wrapper = mount(VfInput, {
      props: {
        modelValue: 'hello',
        leadingIcon: 'infoCircle',
        trailingIcon: 'xmark',
      },
    });

    expect(wrapper.find('.vf-input-wrap').exists()).toBe(true);
    expect(wrapper.find('.vf-input-wrap__icon--leading').exists()).toBe(true);
    expect(wrapper.find('.vf-input-wrap__icon--trailing').exists()).toBe(true);

    await wrapper.get('input').setValue('world');

    expect(wrapper.emitted('update:modelValue')).toEqual([['world']]);
  });

  it('supports clearable input control', async () => {
    const wrapper = mount(VfInput, {
      props: {
        modelValue: 'hello',
        clearable: true,
      },
    });

    const clearButton = wrapper.find('.vf-input-wrap__clear');
    expect(clearButton.exists()).toBe(true);

    await clearButton.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
  });

  it('supports showing trailing icon and clearable control together', () => {
    const withTrailing = mount(VfInput, {
      props: {
        modelValue: 'hello',
        clearable: true,
        trailingIcon: 'xmark',
      },
    });
    expect(withTrailing.find('.vf-input-wrap__clear').exists()).toBe(true);
    expect(withTrailing.find('.vf-input-wrap__icon--trailing').exists()).toBe(true);
  });

  it('compacts trailing password geometry after clearing input value', async () => {
    const wrapper = mount(VfInput, {
      props: {
        modelValue: 'secret',
        clearable: true,
        passwordReveal: true,
        trailingIcon: 'filter',
      },
      attrs: {
        type: 'password',
      },
    });

    expect(wrapper.find('.vf-input-wrap__clear').exists()).toBe(true);
    expect(wrapper.find('.vf-input-wrap__icon--trailing-before-clear').exists()).toBe(true);
    expect(wrapper.find('.vf-input-wrap__password-toggle--before-clear').exists()).toBe(true);

    await wrapper.get('.vf-input-wrap__clear').trigger('click');

    expect(wrapper.find('.vf-input-wrap__clear').exists()).toBe(false);
    expect(wrapper.find('.vf-input-wrap__icon--trailing-before-clear').exists()).toBe(true);
    expect(wrapper.find('.vf-input-wrap__password-toggle--before-clear').exists()).toBe(false);
    expect(wrapper.find('.vf-input-wrap--with-trailing-password-and-clear').exists()).toBe(false);
    expect(wrapper.find('.vf-input-wrap--with-trailing-and-clear').exists()).toBe(true);
  });

  it('supports password visibility toggle for password inputs', async () => {
    const wrapper = mount(VfInput, {
      props: {
        modelValue: 'secret',
        passwordReveal: true,
      },
      attrs: {
        type: 'password',
      },
    });

    const input = wrapper.get('input');
    const toggle = wrapper.get('.vf-input-wrap__password-toggle');

    expect(input.attributes('type')).toBe('password');
    expect(toggle.attributes('aria-label')).toBe('Show password');
    expect(toggle.attributes('aria-pressed')).toBe('false');

    await toggle.trigger('click');

    expect(input.attributes('type')).toBe('text');
    expect(toggle.attributes('aria-label')).toBe('Hide password');
    expect(toggle.attributes('aria-pressed')).toBe('true');

    await toggle.trigger('click');

    expect(input.attributes('type')).toBe('password');
    expect(toggle.attributes('aria-label')).toBe('Show password');
    expect(toggle.attributes('aria-pressed')).toBe('false');
  });

  it('preserves uncontrolled password value when visibility changes', async () => {
    const wrapper = mount(VfInput, {
      props: {
        passwordReveal: true,
      },
      attrs: {
        type: 'password',
      },
    });

    const input = wrapper.get('input');

    await input.setValue('typed-secret');
    await wrapper.get('.vf-input-wrap__password-toggle').trigger('click');

    expect(input.element.value).toBe('typed-secret');
    expect(input.attributes('type')).toBe('text');
  });

  it('hides clearable control when disabled or readonly attrs are present', () => {
    const disabledInput = mount(VfInput, {
      props: {
        modelValue: 'hello',
        clearable: true,
      },
      attrs: {
        disabled: true,
      },
    });
    expect(disabledInput.find('.vf-input-wrap__clear').exists()).toBe(false);

    const readonlyInput = mount(VfInput, {
      props: {
        modelValue: 'hello',
        clearable: true,
      },
      attrs: {
        readonly: true,
      },
    });
    expect(readonlyInput.find('.vf-input-wrap__clear').exists()).toBe(false);
  });

  it('emits textarea updates and supports size modifiers', async () => {
    const wrapper = mount(VfTextarea, {
      props: {
        modelValue: 'draft',
        size: 'lg',
      },
    });

    expect(wrapper.classes()).toContain('vf-textarea--lg');

    await wrapper.setValue('published');

    expect(wrapper.emitted('update:modelValue')).toEqual([['published']]);
  });

  it('connects field label, description, and error metadata to wrapped controls', () => {
    const wrapper = mount(VfField, {
      props: {
        label: 'Project name',
        description: 'Shown in workspace settings.',
        error: 'Project name is required.',
      },
      slots: {
        default: ({ controlId, describedBy, invalid }: { controlId: string; describedBy?: string; invalid: boolean }) =>
          h('input', {
            id: controlId,
            'aria-describedby': describedBy,
            'aria-invalid': String(invalid),
          }),
      },
    });

    const label = wrapper.get('label');
    const input = wrapper.get('input');
    const description = wrapper.get('.vf-field__description');
    const error = wrapper.get('.vf-field__error');

    expect(label.attributes('for')).toBe(input.attributes('id'));
    expect(input.attributes('aria-describedby')).toBe(`${description.attributes('id')} ${error.attributes('id')}`);
    expect(input.attributes('aria-invalid')).toBe('true');
  });

  it('supports floating label layout for text-like controls', async () => {
    const wrapper = mount(
      defineComponent({
        components: {
          VfField,
          VfInput,
        },
        data() {
          return {
            value: 'Acme',
          };
        },
        template: `
          <VfField label="Workspace name" label-placement="floating">
            <template #default="{ controlId, describedBy, invalid }">
              <VfInput
                :id="controlId"
                v-model="value"
                :invalid="invalid"
                :aria-describedby="describedBy"
              />
            </template>
          </VfField>
        `,
      }),
    );

    await nextTick();

    expect(wrapper.find('.vf-field').classes()).toContain('vf-field--floating');
    expect(wrapper.find('.vf-field__control').classes()).toContain('vf-field__control--filled');
    expect(wrapper.find('.vf-field__label--floating').exists()).toBe(true);
  });

  it('applies the requested floating label variant class', async () => {
    const wrapper = mount(
      defineComponent({
        components: {
          VfField,
          VfInput,
        },
        data() {
          return {
            value: '',
          };
        },
        template: `
          <VfField label="Workspace name" label-placement="floating" floating-variant="on">
            <template #default="{ controlId, describedBy, invalid }">
              <VfInput
                :id="controlId"
                v-model="value"
                :invalid="invalid"
                :aria-describedby="describedBy"
              />
            </template>
          </VfField>
        `,
      }),
    );

    await nextTick();

    expect(wrapper.find('.vf-field').classes()).toContain('vf-field--floating-on');
  });

  it('suppresses empty select placeholder text when floating label is active', async () => {
    const wrapper = mount(
      defineComponent({
        components: {
          VfField,
          VfSelect,
        },
        data() {
          return {
            value: '',
            options: [
              { value: 'starter', label: 'Starter' },
              { value: 'pro', label: 'Pro' },
            ],
          };
        },
        template: `
          <VfField label="Plan" label-placement="floating">
            <template #default="{ controlId, describedBy, invalid }">
              <VfSelect
                :id="controlId"
                v-model="value"
                :options="options"
                placeholder="Select plan"
                :invalid="invalid"
                :aria-describedby="describedBy"
                disable-teleport
              />
            </template>
          </VfField>
        `,
      }),
    );

    await nextTick();

    expect(wrapper.find('.vf-field').classes()).toContain('vf-field--floating');
    expect(wrapper.get('.vf-select__value').text()).toBe('');
  });

  it('connects fieldset legend, description, and error metadata to grouped controls', () => {
    const wrapper = mount(VfFieldset, {
      props: {
        label: 'Plan',
        description: 'Choose one rollout option.',
        error: 'Select one plan to continue.',
      },
      slots: {
        default: ({ describedBy, invalid }: { describedBy?: string; invalid: boolean }) =>
          h(
            'div',
            {
              class: 'grouped-controls',
              'aria-describedby': describedBy,
              'data-invalid': String(invalid),
            },
            'Grouped controls',
          ),
      },
    });

    const fieldset = wrapper.get('fieldset');
    const legend = wrapper.get('legend');
    const group = wrapper.get('.grouped-controls');
    const description = wrapper.get('.vf-fieldset__description');
    const error = wrapper.get('.vf-fieldset__error');

    expect(legend.text()).toBe('Plan');
    expect(fieldset.attributes('aria-describedby')).toBe(`${description.attributes('id')} ${error.attributes('id')}`);
    expect(group.attributes('aria-describedby')).toBe(`${description.attributes('id')} ${error.attributes('id')}`);
    expect(group.attributes('data-invalid')).toBe('true');
  });

  it('emits select updates and renders options through dropdown', async () => {
    const wrapper = mount(VfSelect, {
      props: {
        modelValue: '',
        invalid: true,
        placeholder: 'Choose a plan',
        options: [
          { value: 'starter', label: 'Starter' },
          { value: 'pro', label: 'Pro' },
        ],
      },
    });

    expect(wrapper.find('button.vf-select').attributes('aria-invalid')).toBe('true');
    expect(wrapper.find('.vf-select__value').text()).toBe('Choose a plan');

    await wrapper.find('button.vf-select').trigger('click');
    await nextTick();

    expect(document.body.textContent).toContain('Starter');
    expect(document.body.textContent).toContain('Pro');

    const options = Array.from(document.body.querySelectorAll<HTMLButtonElement>('.vf-select__option'));

    options[1]?.click();
    await nextTick();

    expect(wrapper.emitted('update:modelValue')).toEqual([['pro']]);
  });

  it('forwards descriptive aria attributes to select trigger', () => {
    const wrapper = mount(VfSelect, {
      props: {
        options: [{ value: 'starter', label: 'Starter' }],
      },
      attrs: {
        'aria-describedby': 'select-help',
      },
    });

    expect(wrapper.get('button.vf-select').attributes('aria-describedby')).toBe('select-help');
  });

  it('emits checkbox and switch updates', async () => {
    const checkbox = mount(VfCheckbox, {
      props: {
        modelValue: true,
        invalid: true,
      },
      slots: {
        default: 'Accept terms',
      },
    });

    const switchControl = mount(VfSwitch, {
      props: {
        modelValue: false,
        size: 'lg',
      },
      slots: {
        default: 'Enable notifications',
      },
    });

    expect(checkbox.classes()).toContain('vf-checkbox--checked');
    expect(checkbox.classes()).toContain('vf-checkbox--invalid');
    expect(switchControl.classes()).toContain('vf-switch--lg');

    await checkbox.get('input').setValue(false);
    await switchControl.get('input').setValue(true);

    expect(checkbox.emitted('update:modelValue')).toEqual([[false]]);
    expect(switchControl.emitted('update:modelValue')).toEqual([[true]]);
  });

  it('supports static switch track variant', () => {
    const wrapper = mount(VfSwitch, {
      props: {
        static: true,
      },
    });

    expect(wrapper.classes()).toContain('vf-switch--static');
  });

  it('supports inverse thumb contrast for switch', () => {
    const wrapper = mount(VfSwitch, {
      props: {
        thumbContrast: 'inverse',
      },
    });

    expect(wrapper.classes()).toContain('vf-switch--thumb-contrast-inverse');
  });

  it('supports invalid switch state', () => {
    const wrapper = mount(VfSwitch, {
      props: {
        invalid: true,
      },
    });

    expect(wrapper.classes()).toContain('vf-switch--invalid');
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true');
  });

  it('supports disabled states across form controls', () => {
    const input = mount(VfInput, {
      attrs: {
        disabled: true,
      },
    });
    const textarea = mount(VfTextarea, {
      attrs: {
        disabled: true,
      },
    });
    const select = mount(VfSelect, {
      props: {
        disabled: true,
        options: [{ value: 'starter', label: 'Starter' }],
      },
    });
    const checkbox = mount(VfCheckbox, {
      props: {
        disabled: true,
      },
    });
    const switchControl = mount(VfSwitch, {
      props: {
        disabled: true,
      },
    });
    const radio = mount(VfRadio, {
      props: {
        disabled: true,
        value: 'starter',
      },
    });

    expect(input.attributes('disabled')).toBeDefined();
    expect(textarea.attributes('disabled')).toBeDefined();
    expect(select.get('button.vf-select').attributes('disabled')).toBeDefined();
    expect(checkbox.classes()).toContain('vf-checkbox--disabled');
    expect(checkbox.get('input').attributes('disabled')).toBeDefined();
    expect(switchControl.classes()).toContain('vf-switch--disabled');
    expect(switchControl.get('input').attributes('disabled')).toBeDefined();
    expect(radio.classes()).toContain('vf-radio--disabled');
    expect(radio.get('input').attributes('disabled')).toBeDefined();
  });

  it('supports thumb slot content with checked state', async () => {
    const wrapper = mount(SwitchThumbProbe);

    expect(wrapper.find('.vf-switch__thumb').text()).toBe('off');

    await wrapper.get('input').setValue(true);

    expect(wrapper.find('.vf-switch__thumb').text()).toBe('on');
  });

  it('switches explicit theme mode based on resolved theme', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: () => ({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
    });

    const wrapper = mount(ThemeSwitchProbe);
    await nextTick();

    const input = wrapper.get('.vf-switch__input');

    expect((input.element as HTMLInputElement).checked).toBe(true);

    await input.setValue(false);
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));

    expect(document.documentElement.getAttribute('data-vf-theme')).toBe('light');
    expect((wrapper.get('.vf-switch__input').element as HTMLInputElement).checked).toBe(false);

    await wrapper.get('.vf-switch__input').setValue(true);
    await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));

    expect(document.documentElement.getAttribute('data-vf-theme')).toBe('dark');
  });

  it('does not render switch content wrapper for theme switch without label', () => {
    const wrapper = mount(ThemeSwitchProbe);

    expect(wrapper.find('.vf-switch__content').exists()).toBe(false);
  });

  it('supports button variant for theme switch', async () => {
    const wrapper = mount(
      defineComponent({
        components: {
          VfThemeProvider,
          VfThemeSwitch,
        },
        template: `
          <VfThemeProvider default-theme="system">
            <VfThemeSwitch variant="button" />
          </VfThemeProvider>
        `,
      }),
    );

    const button = wrapper.get('button');

    expect(wrapper.find('.vf-switch').exists()).toBe(false);
    expect(button.classes()).toContain('vf-icon-button');
    expect(button.attributes('aria-label')).toBe('Switch to dark theme');
  });

  it('supports ghost button variant for theme switch', async () => {
    const wrapper = mount(
      defineComponent({
        components: {
          VfThemeProvider,
          VfThemeSwitch,
        },
        template: `
          <VfThemeProvider default-theme="system">
            <VfThemeSwitch variant="button" button-variant="ghost" />
          </VfThemeProvider>
        `,
      }),
    );

    const button = wrapper.get('button');

    expect(button.classes()).toContain('vf-icon-button--ghost');
  });

  it('renders table of contents items, hrefs, and active state', () => {
    const wrapper = mount(VfTableOfContents, {
      props: {
        activeId: 'theme-provider',
        items: [
          { id: 'getting-started', label: 'Getting started', level: 1 },
          { id: 'theme-api', label: 'Theme API', level: 2 },
          { id: 'theme-provider', label: 'Theme provider', level: 3 },
        ],
      },
    });

    const links = wrapper.findAll('.vf-table-of-contents__link');
    const items = wrapper.findAll('.vf-table-of-contents__item');

    expect(links).toHaveLength(3);
    expect(links[0]?.attributes('href')).toBe('#getting-started');
    expect(links[2]?.attributes('aria-current')).toBe('location');
    expect(links[2]?.classes()).toContain('vf-table-of-contents__link--active');
    expect(items[2]?.attributes('style')).toContain('--vf-toc-level: 3');
  });

  it('supports pills variant for table of contents', () => {
    const wrapper = mount(VfTableOfContents, {
      props: {
        variant: 'pills',
        items: [{ id: 'getting-started', label: 'Getting started', level: 1 }],
      },
    });

    expect(wrapper.find('.vf-table-of-contents').classes()).toContain('vf-table-of-contents--pills');
  });

  it('supports opt-in smooth scrolling with offset for table of contents links', async () => {
    const target = document.createElement('h2');
    target.id = 'theme-api';
    target.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 240,
      top: 240,
      left: 0,
      right: 0,
      bottom: 280,
      width: 0,
      height: 40,
      toJSON: () => ({}),
    })) as typeof target.getBoundingClientRect;
    document.body.appendChild(target);

    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    Object.defineProperty(window, 'scrollY', {
      value: 120,
      configurable: true,
    });

    const wrapper = mount(VfTableOfContents, {
      props: {
        smooth: true,
        scrollOffset: 96,
        items: [{ id: 'theme-api', label: 'Theme API', level: 1 }],
      },
    });

    await wrapper.get('.vf-table-of-contents__link').trigger('click');

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 264,
      behavior: 'smooth',
    });
    expect(window.location.hash).toBe('#theme-api');

    scrollToSpy.mockRestore();
    target.remove();
  });

  it('emits radio updates and reflects checked state', async () => {
    const radio = mount(VfRadio, {
      props: {
        modelValue: 'a',
        value: 'b',
        invalid: true,
      },
      attrs: {
        name: 'plan',
      },
      slots: {
        default: 'Pro plan',
      },
    });

    expect(radio.classes()).toContain('vf-radio--invalid');
    expect(radio.get('input').attributes('name')).toBe('plan');

    await radio.get('input').setValue(true);

    expect(radio.emitted('update:modelValue')).toEqual([['b']]);
  });

  it('renders divider orientation and decorative default semantics', () => {
    const wrapper = mount(VfDivider, {
      props: {
        orientation: 'vertical',
      },
    });

    expect(wrapper.attributes('aria-orientation')).toBe('vertical');
    expect(wrapper.attributes('role')).toBe('separator');
    expect(wrapper.classes()).toContain('vf-divider--vertical');
  });

  it('supports optional drawer dividers', () => {
    const wrapper = mount(VfDrawer, {
      props: {
        open: true,
        title: 'Drawer',
        dividers: true,
      },
      slots: {
        default: 'Content',
        footer: 'Footer',
      },
      attachTo: document.body,
    });

    expect(document.body.querySelector('.vf-drawer')).not.toBeNull();
    expect(document.body.querySelector('.vf-drawer')?.classList.contains('vf-drawer--dividers')).toBe(true);
    expect(document.body.querySelector('.vf-drawer__footer')).not.toBeNull();

    wrapper.unmount();

    expect(document.body.querySelector('.vf-drawer')).toBeNull();
  });

  it('supports optional dialog dividers', () => {
    const wrapper = mount(VfDialog, {
      props: {
        open: true,
        title: 'Dialog',
        dividers: true,
      },
      slots: {
        default: 'Content',
        footer: 'Footer',
      },
      attachTo: document.body,
    });

    expect(document.body.querySelector('.vf-dialog')).not.toBeNull();
    expect(document.body.querySelector('.vf-dialog__content')?.classList.contains('vf-dialog__content--dividers')).toBe(
      true,
    );
    expect(document.body.querySelector('.vf-dialog__footer')).not.toBeNull();

    wrapper.unmount();

    expect(document.body.querySelector('.vf-dialog')).toBeNull();
  });

  it('renders command palette search items and emits select', async () => {
    const wrapper = mount(VfCommandPalette, {
      attachTo: document.body,
      props: {
        open: true,
        items: [{ label: 'VfDrawer' }, { label: 'VfDialog' }],
      },
    });

    await nextTick();

    expect(document.body.querySelector('.vf-command-palette')).not.toBeNull();
    expect(document.body.textContent).toContain('VfDrawer');

    document.body.querySelectorAll<HTMLButtonElement>('.vf-command-palette__item')[0]?.click();

    expect(wrapper.emitted('select')?.[0]).toEqual([{ label: 'VfDrawer' }]);
  });

  it('renders badge tone and panel content', () => {
    const badge = mount(VfBadge, {
      props: {
        tone: 'help',
      },
      slots: {
        default: 'Stable',
      },
    });

    const panel = mount(VfPanel, {
      props: {
        title: 'Quick notes',
        subtle: true,
      },
      slots: {
        default: 'Panel content',
      },
    });

    expect(badge.classes()).toContain('vf-badge--help');
    expect(badge.text()).toBe('Stable');
    expect(panel.classes()).toContain('vf-panel--subtle');
    expect(panel.text()).toContain('Quick notes');
    expect(panel.text()).toContain('Panel content');
  });

  it('renders icon button with accessible label and icon stub', () => {
    const wrapper = mount(VfIconButton, {
      props: {
        icon: 'gear',
        'aria-label': 'Open settings',
        variant: 'help',
      },
    });

    expect(wrapper.attributes('type')).toBe('button');
    expect(wrapper.attributes('aria-label')).toBe('Open settings');
    expect(wrapper.classes()).toContain('vf-icon-button--help');
    expect(wrapper.find('.vf-icon').exists()).toBe(true);
  });

  it('uses ghost variant class by default for icon buttons', () => {
    const wrapper = mount(VfIconButton, {
      props: {
        icon: 'gear',
        'aria-label': 'Open settings',
      },
    });

    expect(wrapper.classes()).toContain('vf-icon-button--ghost');
  });

  it('renders alert and tag tones', () => {
    const alert = mount(VfAlert, {
      props: {
        tone: 'warn',
        title: 'Attention',
      },
      slots: {
        default: 'Alert content',
      },
    });

    const tag = mount(VfTag, {
      props: {
        tone: 'contrast',
      },
      slots: {
        default: 'Preview',
      },
    });

    expect(alert.classes()).toContain('vf-alert--warn');
    expect(alert.text()).toContain('Attention');
    expect(alert.text()).toContain('Alert content');
    expect(alert.find('.vf-icon').exists()).toBe(true);
    expect(tag.classes()).toContain('vf-tag--contrast');
    expect(tag.text()).toBe('Preview');
  });

  it('supports custom and hidden alert icons', () => {
    const customIconAlert = mount(VfAlert, {
      props: {
        title: 'Custom icon',
        icon: 'gear',
      },
      slots: {
        default: 'Alert content',
      },
    });

    const hiddenIconAlert = mount(VfAlert, {
      props: {
        title: 'No icon',
        hideIcon: true,
      },
      slots: {
        default: 'Alert content',
      },
    });

    expect(customIconAlert.find('.vf-alert__icon').exists()).toBe(true);
    expect(customIconAlert.find('.vf-icon').exists()).toBe(true);
    expect(hiddenIconAlert.find('.vf-alert__icon').exists()).toBe(false);
  });
});
