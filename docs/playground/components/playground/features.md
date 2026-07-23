# Features

Interactive renderer for sandbox files or component demos, powered by `@codemonster-ru/vueforge-playground-core`.

## Import

Import statement for this component.

```ts
import { VfPlayground } from '@codemonster-ru/vueforge-playground/ui';
```

When the playground chunk is lazy-loaded, you can use the built-in async wrapper:

```ts
import { VfPlaygroundAsync } from '@codemonster-ru/vueforge-playground/ui';
```

## Sandbox Mode

Sandbox mode is the default. Provide a virtual file map and an entry module; the preview runs in a
sandboxed iframe and the console tab receives runtime messages.

````playground-src
mode: component
framework: vue
height: 380
entry: /App.vue

```vue file=/App.vue
<template>
  <VfPlayground
    :files="files"
    entry="/main.js"
    framework="vanilla"
    theme="inherit"
    :height="300"
  />
</template>

<script setup lang="ts">
import { VfPlayground } from '@codemonster-ru/vueforge-playground/ui';

const files = {
  '/main.js': `
const heading = document.createElement('h2');
heading.textContent = 'Sandbox preview';
document.querySelector('#app')?.append(heading);
console.info('preview ready');
`,
};
</script>
```
````

## Component Mode

Use component mode to render an existing Vue component directly without loading the sandbox
compiler.

````playground-src
mode: component
framework: vue
height: 360
entry: /App.vue

```vue file=/App.vue
<template>
  <VfPlayground mode="component" :component="DemoBlock" :height="280" />
</template>

<script setup>
import { h } from 'vue';
import { VfPlayground } from '@codemonster-ru/vueforge-playground/ui';

const DemoBlock = {
  render: () => h('div', { style: { display: 'grid', gap: 'var(--vf-surface-gap-compact)' } }, [
    h('h3', { style: { margin: 0 } }, 'Playground demo'),
    h('p', { style: { margin: 0 } }, 'Component mode preview without sandbox srcdoc.')
  ])
};
</script>
```
````

## Notes

Additional implementation notes and caveats:

- In `sandbox` mode, preview is rendered in an iframe.
- In `component` mode, preview renders the provided Vue component directly.
- `files` and `entry` are required in sandbox mode; `component` is required in component mode.
- `theme="inherit"` synchronizes the source CodeBlock and sandbox preview with the nearest VueForge
  theme boundary.

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Treat playground as a composite interactive region containing tabs, code panel, preview area, and optional console.
- Provide explicit labels for custom renderers (tabs/actions/files) so control purpose is announced.
- Ensure preview iframe/component content has its own semantic structure and accessible naming.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key           | Function                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `Tab`         | Moves focus between playground controls (tabs, file picker, action buttons, code/preview/console regions). |
| `Shift + Tab` | Moves focus backward across playground controls.                                                           |
| `Enter`       | Activates focused playground action/control.                                                               |
| `Escape`      | Used by nested overlays/components inside playground when they implement close-on-escape.                  |
