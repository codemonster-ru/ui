# Features

## Summary

Document table of contents with active section highlighting.

## Import

```ts
import { VfTableOfContents } from '@codemonster-ru/vueforge-core';
```

## Basic

````playground-src
mode: component
framework: vue
height: 460
entry: /App.vue

```vue file=/App.vue
<template>
  <div style="display:grid;grid-template-columns:220px 1fr;gap:16px">
    <VfTableOfContents
      :items="items"
      :active-id="activeId"
      smooth
      :scroll-offset="12"
      variant="pills"
    />

    <article style="display:grid;gap:14px">
      <section id="introduction">
        <h3 style="margin:0">Introduction</h3>
        <p style="margin:6px 0 0">Overview of package goals and design principles.</p>
      </section>
      <section id="installation">
        <h3 style="margin:0">Installation</h3>
        <p style="margin:6px 0 0">Package manager setup and versioning rules.</p>
      </section>
      <section id="vite">
        <h3 style="margin:0">Vite</h3>
        <p style="margin:6px 0 0">Vite-specific notes and plugin integration.</p>
      </section>
      <section id="configuration">
        <h3 style="margin:0">Configuration</h3>
        <p style="margin:6px 0 0">Runtime options and defaults.</p>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VfTableOfContents } from '@codemonster-ru/vueforge-core';

const activeId = ref('installation');
const items = [
  { id: 'introduction', label: 'Introduction', level: 1 },
  { id: 'installation', label: 'Installation', level: 1 },
  { id: 'vite', label: 'Vite', level: 2 },
  { id: 'configuration', label: 'Configuration', level: 1 },
];
</script>
```
````

## Accessibility

### Screen Reader

- Table of contents is rendered as semantic navigation (`<nav>`) with configurable `aria-label`.
- Active section link is marked with `aria-current="location"`.
- Use clear heading labels in `items` so link text is meaningful when read out of context.

### Keyboard Support

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to next table-of-contents link. |
| `Shift + Tab` | Moves focus to previous table-of-contents link. |
| `Enter` | Activates focused link and navigates/scrolls to section. |
| `Space` | Activates focused link in browsers that map Space to link activation behavior. |

