# Features

Interactive renderer for sandbox files or component demos, powered by `@codemonster-ru/vueforge-playground-core`.

## Summary

Interactive renderer for sandbox files or component demos, powered by `@codemonster-ru/vueforge-playground-core`.

## Import

```ts
import { VfPlayground } from '@codemonster-ru/vueforge-playground';
```

## Basic

````playground-src
mode: component
framework: vue
height: 360
entry: /App.vue

```vue file=/App.vue
<template>
  <VfPlayground mode="sandbox" :files="files" entry="/App.vue" :height="280" />
</template>

<script setup>
import { VfPlayground } from '@codemonster-ru/vueforge-playground';

const files = {
  '/App.vue': `<template><button>Playground demo</button></template>`
};
</script>
```
````

## Notes

- In `sandbox` mode, preview is rendered in an iframe.
- In `component` mode, preview renders the provided Vue component directly.

## Accessibility

### Screen Reader

- Treat playground as a composite interactive region containing tabs, code panel, preview area, and optional console.
- Provide explicit labels for custom renderers (tabs/actions/files) so control purpose is announced.
- Ensure preview iframe/component content has its own semantic structure and accessible naming.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus between playground controls (tabs, file picker, action buttons, code/preview/console regions). |
| `Shift + Tab` | Moves focus backward across playground controls. |
| `Enter` | Activates focused playground action/control. |
| `Escape` | Used by nested overlays/components inside playground when they implement close-on-escape. |

