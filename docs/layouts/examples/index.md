---
title: "Examples"
description: "Interactive examples for the layouts package"
slug: "/vueforge/layouts/examples"
order: 5
---

# Examples

## Basic

````playground-src
mode: component
framework: vue
height: 380
entry: /App.vue

```vue file=/App.vue
<template>
  <VfAppShell :style="{ minHeight: '100%' }">
    <VfHeaderArea>
      <VfCard compact>
        Header
      </VfCard>
    </VfHeaderArea>
    <VfContentArea>
      <VfGrid :columns="2" gap="12">
        <VfCard compact>Content A</VfCard>
        <VfCard compact>Content B</VfCard>
      </VfGrid>
    </VfContentArea>
    <VfFooterArea>
      <VfCard compact>
        Footer
      </VfCard>
    </VfFooterArea>
  </VfAppShell>
</template>

<script setup>
import {
  VfAppShell,
  VfContentArea,
  VfFooterArea,
  VfGrid,
  VfHeaderArea
} from '@codemonster-ru/vueforge-layouts';
import { VfCard } from '@codemonster-ru/vueforge-core';
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
  <VfDocumentLayout :style="{ minHeight: '100%' }">
    <VfHeaderArea>
      <VfContainer>
        <VfCard compact>Docs Header</VfCard>
      </VfContainer>
    </VfHeaderArea>

    <VfContentArea>
      <VfContainer>
        <VfStack gap="12">
          <VfSection>
            <VfCard compact>Main Section</VfCard>
          </VfSection>
          <VfInline gap="12">
            <VfCard compact>Related 1</VfCard>
            <VfCard compact>Related 2</VfCard>
          </VfInline>
        </VfStack>
      </VfContainer>
    </VfContentArea>
  </VfDocumentLayout>
</template>

<script setup>
import {
  VfContainer,
  VfContentArea,
  VfDocumentLayout,
  VfHeaderArea,
  VfInline,
  VfSection,
  VfStack
} from '@codemonster-ru/vueforge-layouts';
import { VfCard } from '@codemonster-ru/vueforge-core';
</script>
```
````

