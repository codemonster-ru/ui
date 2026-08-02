# Features

## Import

The package root is CSS-free. Browser component subpaths automatically load the Date Picker CSS.

```ts
import { VfDatePicker } from '@codemonster-ru/vueforge-core/date-picker';
```

For a manual CSS setup, import `VfDatePicker` from the package root and add
`@codemonster-ru/vueforge-core/date-picker.css` with the shared foundation styles.

## Basic date selection

The visible value follows the requested locale, while `v-model` remains `YYYY-MM-DD`.

````playground-src
mode: component
framework: vue
height: 420
entry: /App.vue

```vue file=/App.vue
<template>
  <VfField label="Start date" description="The model remains an ISO calendar date.">
    <template #default="{ controlId, describedBy, invalid }">
      <VfDatePicker
        :id="controlId"
        v-model="value"
        :aria-describedby="describedBy"
        :invalid="invalid"
        clearable
        locale="en-GB"
        min="2026-01-01"
        max="2026-12-31"
      />
    </template>
  </VfField>
  <p>Model: {{ value }}</p>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VfDatePicker, VfField } from '@codemonster-ru/vueforge-core';

const value = ref('2026-08-02');
</script>
```
````

## Range and multiple selection

Set `range` for a sorted start/end pair or `multiple` for independent values. Both modes use an
array and clear to `[]`.

```vue
<VfDatePicker v-model="range" range />
<VfDatePicker v-model="holidays" multiple />

<script setup lang="ts">
import { ref } from 'vue';
import { VfDatePicker } from '@codemonster-ru/vueforge-core';

const range = ref<string[]>(['2026-08-03', '2026-08-07']);
const holidays = ref<string[]>(['2026-08-12', '2026-08-21']);
</script>
```

## Month, year, and time modes

Month and year modes change both the selection grid and model format. Time controls apply only to
the default day picker.

```vue
<VfDatePicker v-model="month" month-picker />
<VfDatePicker v-model="year" year-picker />
<VfDatePicker v-model="appointment" show-time :minute-step="15" />

<script setup lang="ts">
import { ref } from 'vue';
import { VfDatePicker } from '@codemonster-ru/vueforge-core';

const month = ref('2026-08');
const year = ref('2026');
const appointment = ref('2026-08-02T14:30');
</script>
```

## Display formatting and localization

Use `locale` for normal localized output. Use `displayFormat` only when a product requires a fixed
pattern; supported tokens are documented in the [API](./api.md). Neither option changes the model.

```vue
<VfDatePicker v-model="value" locale="de-DE" />
<VfDatePicker v-model="value" display-format="dd.MM.yyyy" />
```

## Floating labels and forms

Inside a floating `VfField`, Date Picker participates in the field's filled/open state and hides its
empty placeholder. Passing a string `name` produces one hidden input per model value, so native
form submission receives the same ISO-like values as `v-model`.

```vue
<VfField label="Billing period" label-placement="floating">
  <template #default="{ controlId, describedBy, invalid }">
    <VfDatePicker
      :id="controlId"
      v-model="period"
      name="billingPeriod"
      month-picker
      :aria-describedby="describedBy"
      :invalid="invalid"
    />
  </template>
</VfField>
```

## Accessibility and keyboard support

The trigger exposes dialog relationships through `aria-haspopup`, `aria-expanded`, and
`aria-controls`. Calendar, month, and year choices use grid semantics with roving focus; current,
selected, disabled, and range states are announced through ARIA.

| Key                           | Function                                                                 |
| ----------------------------- | ------------------------------------------------------------------------ |
| `Enter`, `Space`, `ArrowDown` | Opens the picker from the trigger.                                       |
| Arrow keys                    | Moves by day/week, month/grid row, or year/grid row for the active mode. |
| `Home`, `End`                 | Moves to the start or end of the current week, year, or year range.      |
| `PageUp`, `PageDown`          | Moves by month, year, or 12-year range for the active mode.              |
| `Escape`                      | Closes the picker and restores focus to the trigger.                     |

Provide a visible label through `VfField` or an accessible name through `aria-label` when the
component is used independently.
