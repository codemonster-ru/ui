# Features

Table wrapper with optional caption, compact mode, stripes, and sticky header.

## Import

Import statement for this component.

```ts
import { VfTable } from '@codemonster-ru/vueforge-core';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 300
entry: /App.vue

```vue file=/App.vue
<template>
  <VfTable caption="Top contributors" striped>
    <template #header>
      <tr>
        <th>Name</th>
        <th>Commits</th>
      </tr>
    </template>

    <tr>
      <td>Alice</td>
      <td>42</td>
    </tr>
    <tr>
      <td>Bob</td>
      <td>27</td>
    </tr>
  </VfTable>
</template>

<script setup>
import { VfTable } from '@codemonster-ru/vueforge-core';
</script>
```
````

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Uses semantic table structure so headers/cells are announced in context.
- Provide a meaningful caption when table purpose is not obvious from surrounding text.
- Use proper header cells and scopes for complex data relationships.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus between interactive controls inside table (if present). |
| `Shift + Tab` | Moves focus backward between interactive controls. |
| `Arrow keys` | Scrolls page/container in standard browser behavior. |

