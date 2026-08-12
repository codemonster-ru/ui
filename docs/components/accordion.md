# Accordion integration

Accordion shares one rendering and interaction contract between Vue and Annabel Razor. It renders
native buttons and labelled regions, supports one or many open items, skips disabled items during
managed focus navigation, and escapes every item string.

Each item has a unique kebab-case `id`, a non-empty `title`, plain-text `content`, and an optional
`disabled` flag. `id` supplies the stable prefix for trigger and panel relationships. Unknown and
disabled ids in an initial open list are ignored; single mode keeps the first valid id in item
order.

## Vue

```vue
<script setup lang="ts">
import '@codemonster-ru/ui-css/styles.css';
import { ref } from 'vue';
import { CmAccordion, type CmAccordionItem } from '@codemonster-ru/ui-vue';

const items: CmAccordionItem[] = [
  { id: 'account', title: 'Account', content: 'Account answer.' },
  { id: 'billing', title: 'Billing', content: 'Billing answer.' },
];
const openItems = ref<string[]>(['account']);
</script>

<template>
  <CmAccordion id="faq" v-model:open-items="openItems" :items="items" />
</template>
```

Omit `open-items` and use `default-open-items` for uncontrolled state. In controlled mode the
component emits the requested `update:openItems` and `openChange` values but continues to render the
owner-supplied state. Do not initialize `@codemonster-ru/ui-runtime` over a Vue-owned Accordion;
Vue already owns its listeners and state.

## Annabel Razor

```php
<?php
$items = [
    ['id' => 'account', 'title' => 'Account', 'content' => 'Account answer.'],
    ['id' => 'billing', 'title' => 'Billing', 'content' => 'Billing answer.'],
];
$openItems = ['account'];
?>

<cm-accordion id="faq" :items="$items" :open-items="$openItems" />
```

Razor renders the complete current server state. Add the shared runtime to the frontend bundle to
progressively enhance that markup:

```ts
import '@codemonster-ru/ui-css/styles.css';
import { CmRuntime, createCmAccordionController } from '@codemonster-ru/ui-runtime';

const runtime = new CmRuntime().register('accordion', createCmAccordionController);
runtime.start(document);
```

Use `runtime.observe(container)` when an application inserts or removes Razor fragments after the
initial render. Its returned disposer disconnects the observer and controllers. Prefer a container
that excludes framework-owned subtrees.

After activation the runtime synchronizes `aria-expanded` and `hidden`, then dispatches a bubbling
`cm:open-change` event with `{ openItems: string[] }`. An application can listen for that event to
persist the next server state. Disconnecting preserves the last rendered client state.

## Keyboard behavior

- Enter and Space use native button activation.
- ArrowDown and ArrowUp move cyclically among enabled triggers.
- Home and End move to the first and last enabled trigger.
- Tab order remains native, and expansion never moves focus.
