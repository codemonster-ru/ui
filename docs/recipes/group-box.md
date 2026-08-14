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

## Annabel Razor

```razor
<?php
$invoiceSections = [
    ['id' => 'details', 'title' => 'Show or hide invoice fields', 'content' => ''],
];
$invoiceOpenItems = ['details'];
?>

<cm-fieldset id="shipping-address" label="Shipping address">
    <label>
        Street
        <input name="shipping_street" autocomplete="shipping street-address">
    </label>
</cm-fieldset>

<cm-fieldset id="invoice-details" label="Invoice details">
    <cm-accordion
        id="invoice-disclosure"
        :items="$invoiceSections"
        :default-open-items="$invoiceOpenItems"
    >
        <razor-slot name="panelDetails">
            <label>
                Purchase order
                <input name="purchase_order">
            </label>
        </razor-slot>
    </cm-accordion>
</cm-fieldset>
```

Register `createCmAccordionController` once as described in
[Accordion integration](../components/accordion.md). Server-rendered content remains available
without JavaScript; enhancement only changes disclosure state. Persist `cm:open-change` when the
chosen open section must survive navigation. No runtime is required for the static Fieldset case.

If the content is not a related form-control group, do not use Fieldset merely to reproduce an
outline. Use `CmCard` or `CmSection` and give the section an application-authored heading instead.
