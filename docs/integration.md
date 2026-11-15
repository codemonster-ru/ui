---
title: 'Application integration'
description: 'Use CodeMonster UI in forms, overlays, mixed applications, and server-side rendering (SSR)'
---

# Application integration

## Forms and validation

Use a native form, keep `name` stable, and render errors beside their controls. Native
constraints can handle basic requirements such as `required`, email format, and ranges.
Keep server validation authoritative for permissions, uniqueness, and business rules.
The server should return the submitted values and an explanation of any rejected field.

In Vue, bind the Field slot's ID, description IDs, and state to the control. Here the parent
supplies `emailError` for the latest server response and clears it when the value changes.

```vue
<script setup lang="ts">
import { CmButton, CmField, CmInput } from '@codemonster-ru/ui-vue';

defineProps<{ emailError?: string }>();
const email = defineModel<string>('email', { required: true });
</script>

<template>
  <form action="/account/email" method="post">
    <CmField
      control-id="account-email"
      label="Work email"
      description="We send account notices to this address."
      :error="emailError"
      required
    >
      <template #default="{ controlId, describedBy, invalid, required }">
        <CmInput
          :id="controlId"
          v-model="email"
          name="email"
          type="email"
          autocomplete="email"
          :aria-describedby="describedBy"
          :invalid="invalid"
          :required="required"
        />
      </template>
    </CmField>
    <CmButton type="submit">Update email</CmButton>
  </form>
</template>
```

With Vanilla HTML, render the same label, help, and error relationships on the server.
Link the visible help and error IDs from the input's `aria-describedby` and apply
`aria-invalid="true"` when the field fails validation. Escape submitted values before
placing them back in markup. [Field with help and error](../contracts/field/cases/help-error.html)

After an attempted submission, make the error clear and easy to reach. For a form with several
errors, a concise summary can link to the affected controls. When replacing a form asynchronously,
manage focus so the user can locate the summary or the first invalid field. Test that browser
validation, form submission, and reset still work through the normal keyboard path.
[Form component API](./components/forms.md) · [Form layout recipe](./recipes/form-layout.md)

## Overlays

- Use a Dialog or Drawer when the current task requires the user's attention before they
  return to the page. Give it a name and keep the trigger mounted so focus can return.
- Use a Popover for extra controls that can sit beside the main task. Use a Dropdown for
  application menu actions.
- Keep Tooltip content short and non-interactive. Put required instructions in visible
  text elsewhere.

Bind Vue overlay state through the component's model or events. In Vanilla,
render the initial attributes and use the component's documented open and close requests.
For a confirmation flow, put the confirmed action in the handler and keep cancellation
available by keyboard.
[Overlay APIs](./components/overlays.md) · [Confirmation recipe](./recipes/confirm-dialog.md)

## Server rendering and hydration

For server-side rendering (SSR), both integration modes use the same token and component styles.
Load tokens before the component stylesheet and render the theme preference in `data-cm-theme` before first paint.
For a stored choice, use the same preference on the server and for the initial client render.
[Theme and cookie setup](./recipes/theme-switch.md#server-rendering)

- **Vue SSR:** Render with the Vue SSR entry and hydrate the same widget tree with the same
  initial props. Keep any supplied IDs and data that affect the initial DOM stable across
  server and client. Browser-only effects and measurement belong in mounted code.
- **Vanilla server markup:** Render the canonical HTML, including all accessible names and
  initial native, ARIA, and visibility states. Start the registered controllers in a
  browser module after the markup exists. For enhanced fragments, manage controller teardown
  with the fragment lifecycle.
- **Mixed pages:** Give Vue and Vanilla separate containers. Start or observe the DOM runtime
  from the Vanilla container and hydrate the Vue application in its own root.

[Vanilla setup and dynamic HTML](./vanilla.md) · [Rendering contract](./architecture/rendering-strategy.md)

## TypeScript

Import types from the same public package entry that exports the component or helper. For an
ordinary Vue template, the Vue language tools infer prop and event types from the component.
When defining configuration or wrappers, use exported types such as `CmInputProps` from
`@codemonster-ru/ui-vue`. A Vanilla integration can use types from `@codemonster-ru/ui-runtime`
when it manages controllers in TypeScript. The browser bundle and ordinary HTML work with JavaScript.

For bundled applications use TypeScript’s `Bundler` module resolution. For Node ESM applications,
use `NodeNext` to resolve the package export conditions. [Token types and overrides](./tokens/getting-started.md#typescript-consumption)

## Package entry points

Use named imports from the Vue and Layouts packages in a bundler. Build the client CSS
with the application or serve the exported stylesheets from the HTML layout. Node ESM
and CommonJS resolve the server-safe JS entries without loading CSS. For existing VueForge
subpaths, compatible browser builds can get component styles through the browser export
condition. Check the release cohort and entry point before copying an import from an older app.

[Release and installation](./getting-started.md#choose-a-release) · [CSS entries](./css/getting-started.md#public-entries) · [Migration guide](./migrate-from-vueforge.md)
