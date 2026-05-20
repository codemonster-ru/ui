# Features

## Summary

Short summary of what this component does.

## Import

```ts
import { ComponentName } from '@codemonster-ru/package-name';
```

## Basic

````playground-src
mode: component
framework: vue
height: 220
entry: /App.vue

```vue file=/App.vue
<template>
  <ComponentName />
</template>

<script setup>
import { ComponentName } from '@codemonster-ru/package-name';
</script>
```
````

## Variants

Describe prop-based visual variants and render each one in `playground-src` examples.

## Slots

Describe available slots and provide slot-focused interactive examples.

## Accessibility

### Screen Reader

- Describe the semantic role of the component (interactive control, layout container, feedback element, navigation, and so on).
- Ensure the component has an accessible name when required (visible label, `aria-label`, or `aria-labelledby`).
- Document required ARIA attributes and state announcements specific to this component.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Describe focus entry behavior for this component. |
| `Shift + Tab` | Describe reverse focus behavior for this component. |
| `Enter` | Describe activation behavior if applicable. |
| `Space` | Describe toggle/activation behavior if applicable. |
| `Escape` | Describe dismiss/close behavior if applicable. |

