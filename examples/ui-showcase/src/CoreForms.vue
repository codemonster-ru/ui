<script setup lang="ts">
import {
  CmCard,
  CmCheckbox,
  CmDatePicker,
  CmField,
  CmFieldset,
  CmFormLayout,
  CmInput,
  CmIcon,
  CmRadio,
  CmSelect,
  CmStack,
  CmSwitch,
  CmTextarea,
} from '@codemonster-ru/ui-vue';
import { check, filter, magnifyingGlass, xmark } from '@codemonster-ru/ui-icons';
import { reactive, ref } from 'vue';
import CoreMatrix from './CoreMatrix.vue';

const sizes = ['sm', 'md', 'lg'] as const;
const radioChoices = reactive({ sm: 'a', md: 'a', lg: 'a' });
const adornments = [
  { label: 'Leading', leading: true },
  { label: 'Trailing', trailing: true },
  { label: 'Clear', clearable: true },
  { label: 'Leading and clear', leading: true, clearable: true },
  { label: 'Trailing and clear', trailing: true, clearable: true },
  { label: 'Leading, trailing and clear', leading: true, trailing: true, clearable: true },
];
const plans = [
  { value: 'starter', label: 'Starter' },
  { value: 'pro', label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];
const workspaceName = ref('');
const billingEmail = ref('');
const workspacePlan = ref('');
const releaseDate = ref('2026-07-30');
const bookingDate = ref('2026-08-12');
const releaseDates = ref(['2026-08-13', '2026-08-20']);
const releaseWindow = ref(['2026-08-13', '2026-08-20']);
const billingMonth = ref('2026-08');
const licenseYear = ref('2026');
const releaseTime = ref('2026-08-13T09:30');
const portalDate = ref('2026-08-13');
const fieldsetPlan = ref('pro');
const floatingVariants = ['in', 'on', 'over'] as const;
const floatingStates = [
  { kind: 'input', label: 'Empty input', value: '' },
  { kind: 'input', label: 'Filled input', value: 'Filled' },
  { kind: 'input', label: 'Invalid input', value: 'Invalid', error: 'Invalid' },
  { kind: 'select', label: 'Empty select', value: '' },
  { kind: 'select', label: 'Filled select', value: 'pro' },
  { kind: 'textarea', label: 'Empty textarea', value: '' },
  { kind: 'textarea', label: 'Filled textarea', value: 'Filled textarea' },
];
const dateStates = [
  { label: 'Invalid date', placeholder: 'Invalid date', invalid: true },
  { label: 'Disabled date', modelValue: '2026-07-30', disabled: true },
  { label: 'Readonly date', modelValue: '2026-07-30', readonly: true },
];
const states = [
  { label: 'Default' },
  { label: 'Value', modelValue: 'Workspace' },
  { label: 'Invalid', invalid: true },
  { label: 'Disabled', disabled: true },
  { label: 'Read-only', readonly: true, modelValue: 'Workspace' },
];
</script>

<template>
  <CoreMatrix title="Stack + Field · recommended form stack">
    <CmStack class="core-matrix-wide core-form-stack">
      <p>
        Use a vertical layout container for form spacing. <code>CmField</code> owns internal label, control,
        description, and error spacing; the form layout should own the gap between fields.
      </p>
      <CmField v-slot="{ controlId, describedBy }" control-id="core-name" label="Workspace name" required>
        <CmInput
          :id="controlId"
          v-model="workspaceName"
          :aria-describedby="describedBy"
          placeholder="Acme Cloud"
          required
        />
      </CmField>
      <CmField v-slot="{ controlId, describedBy }" control-id="core-email" label="Billing email" required>
        <CmInput
          :id="controlId"
          v-model="billingEmail"
          :aria-describedby="describedBy"
          type="email"
          placeholder="team@acme.test"
          required
        />
      </CmField>
      <CmField v-slot="{ controlId, describedBy }" control-id="core-plan" label="Plan">
        <CmSelect
          :id="controlId"
          v-model="workspacePlan"
          :aria-describedby="describedBy"
          :options="plans"
          placeholder="Choose a plan"
        />
      </CmField>
    </CmStack>
  </CoreMatrix>
  <CoreMatrix title="Form layout · responsive">
    <CmCard title="Workspace settings" class="core-matrix-wide">
      <CmFormLayout mode="responsive">
        <CmField
          v-slot="{ controlId, describedBy }"
          control-id="core-workspace"
          label="Workspace name"
          description="Shown to every workspace member."
          required
        >
          <CmInput
            :id="controlId"
            v-model="workspaceName"
            :aria-describedby="describedBy"
            placeholder="Acme Cloud"
            required
          />
        </CmField>
        <CmField v-slot="{ controlId }" control-id="core-billing" label="Billing email" required>
          <CmInput :id="controlId" v-model="billingEmail" type="email" placeholder="team@acme.test" required />
        </CmField>
        <CmField v-slot="{ controlId }" control-id="core-role" label="Plan">
          <CmSelect :id="controlId" v-model="workspacePlan" :options="plans" placeholder="Choose a plan" />
        </CmField>
      </CmFormLayout>
    </CmCard>
  </CoreMatrix>
  <CoreMatrix title="Date picker">
    <p class="core-matrix-wide core-matrix-note">
      Localized display with stable ISO model values, constraints, and form states.
    </p>
    <div class="core-matrix-cell">
      <h4>Interactive</h4>
      <CmField v-slot="{ controlId }" control-id="core-release-date" label="Release date">
        <CmDatePicker :id="controlId" v-model="releaseDate" placeholder="Choose a date" clearable />
      </CmField>
      <p>
        Model: <code>{{ releaseDate || 'empty' }}</code>
      </p>
    </div>
    <div class="core-matrix-cell">
      <h4>Min and max</h4>
      <CmField
        v-slot="{ controlId, describedBy }"
        control-id="core-booking-date"
        label="Booking date"
        description="Available from August 10 through August 20, 2026."
      >
        <CmDatePicker
          :id="controlId"
          v-model="bookingDate"
          :aria-describedby="describedBy"
          min="2026-08-10"
          max="2026-08-20"
          clearable
        />
      </CmField>
      <p>
        Model: <code>{{ bookingDate || 'empty' }}</code>
      </p>
    </div>
    <div class="core-matrix-cell">
      <h4>Multiple dates</h4>
      <CmField v-slot="{ controlId }" control-id="core-release-dates" label="Release dates">
        <CmDatePicker :id="controlId" v-model="releaseDates" multiple placeholder="Choose dates" clearable />
      </CmField>
      <p>
        Model: <code>{{ releaseDates.join(', ') || 'empty' }}</code>
      </p>
    </div>
    <div class="core-matrix-cell">
      <h4>Date range</h4>
      <CmField v-slot="{ controlId }" control-id="core-release-window" label="Release window">
        <CmDatePicker :id="controlId" v-model="releaseWindow" range placeholder="Choose a date range" clearable />
      </CmField>
      <p>
        Model: <code>{{ releaseWindow.join(' – ') || 'empty' }}</code>
      </p>
    </div>
    <div class="core-matrix-cell">
      <h4>Month picker</h4>
      <CmField v-slot="{ controlId }" control-id="core-billing-month" label="Billing month">
        <CmDatePicker :id="controlId" v-model="billingMonth" month-picker clearable />
      </CmField>
      <p>
        Model: <code>{{ billingMonth || 'empty' }}</code>
      </p>
    </div>
    <div class="core-matrix-cell">
      <h4>Year picker</h4>
      <CmField v-slot="{ controlId }" control-id="core-license-year" label="License year">
        <CmDatePicker :id="controlId" v-model="licenseYear" year-picker clearable />
      </CmField>
      <p>
        Model: <code>{{ licenseYear || 'empty' }}</code>
      </p>
    </div>
    <div class="core-matrix-cell">
      <h4>Date and time</h4>
      <CmField v-slot="{ controlId }" control-id="core-release-time" label="Release date and time">
        <CmDatePicker :id="controlId" v-model="releaseTime" show-time :minute-step="15" clearable />
      </CmField>
      <p>
        Model: <code>{{ releaseTime || 'empty' }}</code>
      </p>
    </div>
    <div class="core-matrix-cell">
      <h4>Calendar portal</h4>
      <CmField v-slot="{ controlId }" control-id="core-calendar-portal" label="Portal date">
        <CmDatePicker :id="controlId" v-model="portalDate" placement="bottom-end" teleport-to="body" />
      </CmField>
    </div>
    <div class="core-matrix-cell">
      <h4>States</h4>
      <CmDatePicker
        v-for="({ label, ...props }, index) in dateStates"
        :id="'core-date-' + index"
        :key="label"
        :aria-label="label"
        v-bind="props"
      />
    </div>
  </CoreMatrix>
  <CoreMatrix title="Forms visual QA matrix" class="core-form-matrix">
    <section class="core-matrix-wide core-matrix-cell">
      <h4>Input, Select and Textarea · controls</h4>
      <div class="core-matrix-grid">
        <div v-for="size in sizes" :key="size" class="core-matrix-cell">
          <h5>{{ size }}</h5>
          <CmInput :size="size" aria-label="Search" placeholder="Search"
            ><template #leading><CmIcon :icon="magnifyingGlass" /></template
          ></CmInput>
          <CmInput :size="size" aria-label="Filter" placeholder="Filter"
            ><template #trailing><CmIcon :icon="filter" /></template
          ></CmInput>
          <CmSelect
            :id="'core-control-plan-' + size"
            :options="plans"
            :size="size"
            aria-label="Plan"
            placeholder="Plan"
          />
          <CmTextarea :size="size" aria-label="Notes" placeholder="Notes" />
        </div>
      </div>
    </section>
    <section class="core-matrix-wide core-matrix-cell">
      <h4>Checkbox, Radio and Switch · sizes</h4>
      <div class="core-matrix-grid">
        <div v-for="size in sizes" :key="size" class="core-matrix-cell">
          <h5>{{ size }}</h5>
          <CmCheckbox :size="size" label="Checked option" model-value />
          <CmCheckbox :size="size" label="Invalid option" invalid />
          <CmRadio
            :name="'core-radio-size-' + size"
            :size="size"
            label="Active radio"
            value="active"
            model-value="active"
          />
          <CmSwitch :size="size" label="Active switch" model-value />
          <CmSwitch :size="size" label="Icon switch" model-value>
            <template #thumb="{ checked }"><CmIcon :icon="checked ? check : xmark" /></template>
          </CmSwitch>
        </div>
      </div>
    </section>
    <section
      v-for="control in ['Input', 'Select', 'Textarea', 'Input and Select adornments', 'Checkbox, Radio and Switch']"
      :key="control"
      class="core-matrix-wide core-matrix-cell"
    >
      <h4>
        {{ control }} ·
        {{ control === 'Checkbox, Radio and Switch' ? 'states and multiline labels' : 'states by size' }}
      </h4>
      <div class="core-matrix-grid">
        <div v-for="size in sizes" :key="size" class="core-matrix-cell">
          <h5>{{ size }}</h5>
          <template v-if="control === 'Input' || control === 'Textarea'">
            <template v-for="{ label, ...props } in states" :key="label">
              <CmInput
                v-if="control === 'Input'"
                :aria-label="label"
                :placeholder="label"
                :size="size"
                v-bind="props"
              />
              <CmTextarea v-else :aria-label="label" :placeholder="label" :size="size" v-bind="props" />
            </template>
            <CmInput
              v-if="control === 'Input'"
              :size="size"
              aria-label="Search projects"
              model-value="Projects"
              clearable
            />
          </template>
          <template v-else-if="control === 'Select'">
            <CmSelect
              :id="'core-select-' + size"
              :options="plans"
              :size="size"
              aria-label="Plan"
              placeholder="Choose a plan"
            />
            <CmSelect
              :id="'core-select-value-' + size"
              :options="plans"
              :size="size"
              aria-label="Selected plan"
              model-value="pro"
              clearable
            />
            <CmSelect
              :id="'core-select-invalid-' + size"
              :options="plans"
              :size="size"
              aria-label="Invalid plan"
              invalid
            />
            <CmSelect
              :id="'core-select-disabled-' + size"
              :options="plans"
              :size="size"
              aria-label="Disabled plan"
              disabled
            />
          </template>
          <template v-else-if="control === 'Input and Select adornments'">
            <CmInput
              v-for="{ label, leading, trailing, clearable } in adornments"
              :key="label"
              :aria-label="label"
              :model-value="label"
              :size="size"
              :clearable="clearable"
            >
              <template v-if="leading" #leading><CmIcon :icon="magnifyingGlass" /></template>
              <template v-if="trailing" #trailing><CmIcon :icon="filter" /></template>
            </CmInput>
            <CmSelect
              v-for="({ label, leading, trailing, clearable }, index) in adornments
                .filter(({ leading, trailing }) => leading || trailing)
                .filter(({ label }) => ['Leading', 'Trailing', 'Leading, trailing and clear'].includes(label))"
              :id="`core-select-adornment-${size}-${index}`"
              :key="label"
              :aria-label="label"
              :placeholder="label"
              :model-value="clearable ? 'pro' : undefined"
              :options="plans"
              :size="size"
              :clearable="clearable"
            >
              <template v-if="leading" #leading><CmIcon :icon="magnifyingGlass" /></template>
              <template v-if="trailing" #trailing><CmIcon :icon="filter" /></template>
            </CmSelect>
            <CmInput :size="size" type="password" aria-label="Password" model-value="release-demo" password-reveal />
          </template>
          <template v-else>
            <CmCheckbox :size="size" label="Default" />
            <CmCheckbox :size="size" label="Checked" model-value />
            <CmCheckbox :size="size" label="Indeterminate" indeterminate />
            <CmCheckbox :size="size" label="Invalid" invalid />
            <CmCheckbox :size="size" label="Disabled" disabled />
            <CmCheckbox :size="size" label="Disabled checked" disabled model-value />
            <CmCheckbox :size="size" label="Send release updates to the people responsible for this workspace" />
            <CmRadio
              v-model="radioChoices[size]"
              :name="'core-radio-' + size"
              :size="size"
              label="Option A"
              value="a"
            />
            <CmRadio
              v-model="radioChoices[size]"
              :name="'core-radio-' + size"
              :size="size"
              label="Option B"
              value="b"
            />
            <CmRadio :name="'core-radio-invalid-' + size" :size="size" value="invalid" label="Invalid radio" invalid />
            <CmRadio
              :name="'core-radio-disabled-' + size"
              :size="size"
              value="disabled"
              label="Disabled radio"
              disabled
            />
            <CmRadio
              :name="'core-radio-disabled-checked-' + size"
              :size="size"
              value="checked"
              model-value="checked"
              label="Disabled checked radio"
              disabled
            />
            <CmRadio
              :name="'core-radio-wrap-' + size"
              :size="size"
              value="wrap"
              label="Multiline radio label that wraps to expose control alignment against body copy."
            />
            <CmSwitch :size="size" label="Default" />
            <CmSwitch :size="size" label="Enabled" model-value />
            <CmSwitch :size="size" label="Invalid" invalid />
            <CmSwitch :size="size" label="Disabled" disabled />
            <CmSwitch :size="size" label="Disabled and enabled" disabled model-value />
            <CmSwitch :size="size" label="Send notifications when the rollout needs attention" />
          </template>
        </div>
      </div>
    </section>
    <section class="core-matrix-wide core-matrix-cell">
      <h4>Field · floating labels</h4>
      <div class="core-matrix-grid">
        <div v-for="variant in floatingVariants" :key="variant" class="core-matrix-cell">
          <h5>{{ variant }}</h5>
          <CmField
            v-slot="{ controlId }"
            :control-id="'core-float-search-' + variant"
            label="Search"
            required
            label-placement="floating"
            :floating-variant="variant"
          >
            <CmInput :id="controlId" model-value="Search query" placeholder=" " required />
          </CmField>
          <CmField
            v-slot="{ controlId }"
            :control-id="'core-float-plan-' + variant"
            label="Plan"
            label-placement="floating"
            :floating-variant="variant"
          >
            <CmSelect :id="controlId" model-value="pro" :options="plans" />
          </CmField>
          <CmField
            v-slot="{ controlId }"
            :control-id="'core-float-notes-' + variant"
            label="Notes"
            label-placement="floating"
            :floating-variant="variant"
          >
            <CmTextarea :id="controlId" model-value="Textarea baseline check" placeholder=" " />
          </CmField>
        </div>
      </div>
    </section>
    <section class="core-matrix-wide core-matrix-cell">
      <h4>Field · floating labels by size and fill state</h4>
      <div class="core-matrix-grid">
        <div v-for="size in sizes" :key="size" class="core-matrix-cell">
          <h5>{{ size }}</h5>
          <CmField
            v-for="(example, index) in floatingStates"
            :key="example.label"
            v-slot="{ controlId, describedBy, invalid }"
            :control-id="`core-float-${size}-${index}`"
            :label="example.label"
            :error="example.error"
            label-placement="floating"
            floating-variant="on"
          >
            <CmInput
              v-if="example.kind === 'input'"
              :id="controlId"
              :model-value="example.value"
              :size="size"
              :invalid="invalid"
              :aria-describedby="describedBy"
              placeholder=" "
            />
            <CmSelect
              v-else-if="example.kind === 'select'"
              :id="controlId"
              :model-value="example.value"
              :size="size"
              :options="plans"
            />
            <CmTextarea v-else :id="controlId" :model-value="example.value" :size="size" placeholder=" " />
          </CmField>
        </div>
      </div>
    </section>
    <section class="core-matrix-wide core-matrix-cell">
      <h4>Field and Fieldset · containers</h4>
      <div class="core-matrix-grid core-matrix-grid--two">
        <div class="core-matrix-cell">
          <h5>Field</h5>
          <CmField
            v-slot="{ controlId, describedBy }"
            control-id="core-form-default"
            label="Default field"
            description="Description text"
            required
          >
            <CmInput :id="controlId" :aria-describedby="describedBy" model-value="Field value" required />
          </CmField>
          <CmField
            v-slot="{ controlId, describedBy, invalid }"
            control-id="core-form-invalid"
            label="Invalid field"
            error="Error text"
          >
            <CmInput :id="controlId" :aria-describedby="describedBy" :invalid="invalid" model-value="Invalid value" />
          </CmField>
        </div>
        <div class="core-matrix-cell">
          <h5>Fieldset</h5>
          <CmFieldset
            id="core-form-notifications"
            label="Notification channels"
            description="Grouped checkbox controls"
          >
            <div class="core-matrix-cell">
              <CmCheckbox label="Email alerts" model-value /><CmCheckbox label="Slack alerts" />
            </div>
          </CmFieldset>
          <CmFieldset
            id="core-form-fieldset-plan"
            v-slot="{ invalid }"
            label="Workspace plan"
            error="Select one option"
          >
            <div class="core-matrix-cell">
              <CmRadio
                v-model="fieldsetPlan"
                name="core-fieldset-plan"
                value="starter"
                label="Starter"
                :invalid="invalid"
              />
              <CmRadio v-model="fieldsetPlan" name="core-fieldset-plan" value="pro" label="Pro" :invalid="invalid" />
            </div>
          </CmFieldset>
        </div>
      </div>
    </section>
  </CoreMatrix>
</template>
