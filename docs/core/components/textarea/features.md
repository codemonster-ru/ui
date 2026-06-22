# Features

Multiline text input with size and validation states.

## Import

Import statement for this component.

```ts
import { VfField, VfTextarea } from '@codemonster-ru/vueforge-core';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <VfTextarea
    v-model="bio"
    rows="4"
    placeholder="Tell us about your project..."
  />
</template>

<script setup>
import { ref } from 'vue';
import { VfTextarea } from '@codemonster-ru/vueforge-core';

const bio = ref('');
</script>
```
````

## Error

Recommended pattern for error and helper text rendering.

````playground-src
mode: component
framework: vue
height: 300
entry: /App.vue

```vue file=/App.vue
<template>
  <VfField
    label="Project summary"
    description="Keep it concise so it fits in release cards."
    :error="error"
  >
    <template #default="{ controlId, describedBy, invalid }">
      <VfTextarea
        :id="controlId"
        v-model="bio"
        rows="4"
        :invalid="invalid"
        :aria-describedby="describedBy"
        placeholder="Describe the release..."
      />
    </template>
  </VfField>
</template>

<script setup>
import { ref } from 'vue';
import { VfField, VfTextarea } from '@codemonster-ru/vueforge-core';

const bio = ref('');
const error = 'Project summary is required.';
</script>
```
````

## Floating Label

Use `VfField` when you want the label to float inside the textarea.

````playground-src
mode: component
framework: vue
height: 260
entry: /App.vue

```vue file=/App.vue
<template>
  <VfField label="Project summary" label-placement="floating">
    <template #default="{ controlId, describedBy, invalid }">
      <VfTextarea
        :id="controlId"
        v-model="bio"
        rows="4"
        :invalid="invalid"
        :aria-describedby="describedBy"
        placeholder="Describe the release..."
      />
    </template>
  </VfField>
</template>

<script setup>
import { ref } from 'vue';
import { VfField, VfTextarea } from '@codemonster-ru/vueforge-core';

const bio = ref('');
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Uses native `<textarea>` semantics, including multiline editing announcement.
- Use `VfField` as the default way to associate visible label, helper text, and error text.
- When used without `VfField`, provide `aria-label` / `aria-labelledby` and connect descriptive text with `aria-describedby`.
- Expose invalid state with `aria-invalid`.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to textarea. |
| `Shift + Tab` | Moves focus to previous focusable element. |
| `Arrow keys` | Move caret through multiline content. |
| `Enter` | Inserts a new line. |
