# Group box recipe

`VfGroupBox` splits into two compositions. A static titled group is `CmFieldset`; use it whenever
the grouped content is a set of related form controls. A collapsible group keeps that native group
and places a `CmAccordion` disclosure inside it. The disclosure title is a separate action label,
not an interactive `legend`.

## Vue

```vue
<script setup lang="ts">
import { CmAccordion, CmFieldset, type CmAccordionItem } from '@codemonster-ru/ui-vue';

const invoiceSections: CmAccordionItem[] = [{ id: 'details', title: 'Show or hide invoice fields', content: '' }];
</script>

<template>
  <CmFieldset id="shipping-address" label="Shipping address">
    <label>
      Street
      <input name="shipping_street" autocomplete="shipping street-address" />
    </label>
  </CmFieldset>

  <CmFieldset id="invoice-details" label="Invoice details">
    <CmAccordion id="invoice-disclosure" :items="invoiceSections" :default-open-items="['details']">
      <template #panelDetails>
        <label>
          Purchase order
          <input name="purchase_order" />
        </label>
      </template>
    </CmAccordion>
  </CmFieldset>
</template>
```

Use the `CmFieldset` description/error regions and default slot metadata when descendants share
validation state; see [Fieldset](../components/fieldset.md). `CmAccordion` owns disclosure state,
button semantics, labelled panel relationships, and keyboard navigation. Keep form values and
whether a section should start open in application state.

Do not put a button inside the `legend` slot. An interactive legend is inconsistently exposed by
assistive technology, and the portable Fieldset contract intentionally owns a visible,
non-interactive legend. This recipe therefore does not preserve the exact VueForge title-on-border
toggle markup or its `toggle-icon` slot.

## Vanilla HTML

Compose the same layout using the canonical markup for [fieldset](../../contracts/fieldset/contract.md).
Load styles and initialize interactive components as described in the [Vanilla guide](../vanilla.md).
