---
title: "Examples"
description: "Interactive examples for the codeblock package"
slug: "/vueforge/codeblock/examples"
order: 5
---

# Examples

## Basic

````playground-src
mode: component
framework: vue
height: 360
entry: /App.vue

```vue file=/App.vue
<template>
  <section :style="stageStyle">
    <VfCodeBlock
      language="ts"
      title="useGreeting.ts"
      :code="snippet"
      show-line-numbers
    />
  </section>
</template>

<script setup>
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock';

const stageStyle = {
  height: '100%',
  minHeight: '250px',
  padding: '8px'
};

const snippet = `export const greet = (name: string) => {
  return \`Hello, \${name}\`;
};`;
</script>
```
````

## Advanced

````playground-src
mode: component
framework: vue
height: 420
entry: /App.vue

```vue file=/App.vue
<template>
  <section :style="stageStyle">
    <label :style="labelStyle">
      Language
      <select v-model="language" :style="selectStyle">
        <option value="ts">ts</option>
        <option value="vue">vue</option>
        <option value="json">json</option>
      </select>
    </label>

    <VfCodeBlock
      :language="language"
      :code="codeByLanguage[language]"
      show-line-numbers
      copyable
      wrap
      max-height="220px"
    />
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock';

const language = ref('ts');
const codeByLanguage = {
  ts: `export const sum = (a: number, b: number) => a + b;`,
  vue: `<template><button class="btn">Run</button></template>`,
  json: `{"name":"vueforge","pkg":"codeblock","ok":true}`
};

const stageStyle = { height: '100%', minHeight: '320px', display: 'grid', gap: '10px' };
const labelStyle = { display: 'grid', gap: '6px', fontSize: '13px' };
const selectStyle = { width: '160px', padding: '6px 8px' };
</script>
```
````

