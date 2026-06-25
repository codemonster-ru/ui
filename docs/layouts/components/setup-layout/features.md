# Features

Installer-oriented shell for setup wizards and first-run configuration flows.

## Import

Import statement for this component.

```ts
import { VfSetupLayout } from '@codemonster-ru/vueforge-layouts';
```

For component-level auto CSS:

```ts
import VfSetupLayout from '@codemonster-ru/vueforge-layouts/setup-layout';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 520
entry: /App.vue

```vue file=/App.vue
<template>
  <VfSetupLayout
    title="Database"
    description="Configure storage before creating the administrator account."
    :fill-viewport="false"
  >
    <template #brand>
      <strong>Annabel CMS</strong>
    </template>

    <template #aside>
      <VfStepper
        :items="steps"
        model-value="database"
        orientation="vertical"
        aria-label="Installation steps"
      />
    </template>

    <div style="display:grid;gap:var(--vf-layout-space-layout-base)">
      <VfInput value="127.0.0.1" aria-label="Host" />
      <VfInput value="annabel" aria-label="Database name" />
      <VfInput value="annabel_user" aria-label="Database user" />
    </div>

    <template #actions>
      <VfButton variant="secondary" type="button">Back</VfButton>
      <VfButton type="button">Continue</VfButton>
    </template>
  </VfSetupLayout>
</template>

<script setup>
import { VfButton, VfInput, VfStepper } from '@codemonster-ru/vueforge-core';
import { VfSetupLayout } from '@codemonster-ru/vueforge-layouts';

const steps = [
  { value: 'license', label: 'License' },
  { value: 'database', label: 'Database' },
  { value: 'admin', label: 'Admin' },
  { value: 'finish', label: 'Finish' },
];
</script>
```
````

## Responsive Behavior

The layout uses the shared layout breakpoint registry. With an aside slot, medium and wider viewports render a two-column setup surface. Narrower viewports stack brand, toolbar, header, body, actions, and aside content.

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Render a clear `title` for the current setup step.
- Use the `aside` slot for step navigation or setup context.
- Use `toolbar` for compact progress indicators when the stepper is not shown.
- Keep form labels and validation messages in the default slot content.

### Keyboard Support

Keyboard interaction follows native semantics of rendered controls and navigation components.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus through step navigation, form controls, and actions. |
| `Shift + Tab` | Moves focus backward through interactive elements. |
| `Enter` | Submits a focused submit button or activates a focused button. |
| `Space` | Activates focused buttons. |
