# Group box recipe

Use GroupBox to label related fields and optionally make their section collapsible. The title
appears on the fieldset border. When the group collapses, the trigger remains available and
its fields stop participating in form validation and submission. The fields stay in the DOM
and retain their values when the group reopens.

## Vue

```vue
<script setup lang="ts">
import { CmGroupBox } from '@codemonster-ru/ui-vue';
import { ref } from 'vue';

const invoiceCollapsed = ref(false);
</script>

<template>
  <CmGroupBox title="Shipping address">
    <label> Street <input name="shipping_street" autocomplete="shipping street-address" /> </label>
  </CmGroupBox>

  <CmGroupBox v-model:collapsed="invoiceCollapsed" collapsible title="Invoice details">
    <label>Purchase order <input name="purchase_order" /></label>
  </CmGroupBox>
</template>
```

Set `defaultCollapsed` for an initially collapsed group without a model. Set `disabled` to
disable the disclosure button. The `title` and `toggle-icon` slots receive the current collapse
state, as does the default slot.

## Vanilla HTML

Use the [GroupBox markup](../../contracts/group-box/cases/default.html) and shared `group-box.css`
or the full stylesheet. For a static group, use a fieldset with a legend and content, and omit
the disclosure button and its controller.

```js
import { CmRuntime, createCmGroupBoxController } from '@codemonster-ru/ui-runtime';

const runtime = new CmRuntime().register('group-box', createCmGroupBoxController);
runtime.start(document);
```

Render the group open when its fields should be usable before JavaScript loads. For an
initially collapsed group, add `cm-group-box--collapsed` and `disabled` to the fieldset,
set `aria-expanded="false"` on the button and `hidden` on the content. Add `disabled` to the
button separately when it should be unavailable. Listen for `cm:group-box-collapsed-change`
to act on `event.detail.collapsed`.

Use [Fieldset](../components/fieldset.md) when the group needs its own description or
validation message.
