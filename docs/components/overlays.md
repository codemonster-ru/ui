# Overlay components

`Dialog` and `Drawer` are modal native-dialog surfaces. `Popover` is a non-modal disclosure, and
`Tooltip` provides short non-interactive text on both focus and hover. Vue owns interaction inside
its component tree; Annabel Razor uses the shared progressive-enhancement runtime.

Load the token and complete component stylesheets described in the [Button guide](./button.md).
Individual styles are also available from the `dialog.css`, `drawer.css`, `popover.css`, and
`tooltip.css` npm subpath exports.

## APIs

- `Dialog` requires a stable `id` and non-empty `title`. It accepts `description`, `open`, and
  `closeLabel`; the default and `footer` slots compose its body and actions.
- `Drawer` shares the Dialog API and adds logical `side` (`start` or `end`, default `end`).
- `Popover` requires `id` and trigger `label`. It accepts `open`, `disabled`, and `placement`
  (`top`, `bottom-start`, or `bottom-end`); the default slot is its non-modal panel.
- `Tooltip` requires `id`, trigger `label`, and plain-text `content`. `placement` is `top`, `bottom`,
  `start`, or `end`; `delay` is `none`, `short`, or `long`. `defaultVisible` is only an initial
  rendering state, not a controlled API.

## Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CmDialog, CmPopover, CmTooltip } from '@codemonster-ru/ui-vue';

const confirmOpen = ref(false);
const helpOpen = ref(false);
</script>

<template>
  <button type="button" @click="confirmOpen = true">Delete project</button>
  <CmDialog id="delete-project" v-model:open="confirmOpen" title="Delete project?">
    This action cannot be undone.
    <template #footer>
      <button type="button" @click="confirmOpen = false">Cancel</button>
      <button type="button">Delete</button>
    </template>
  </CmDialog>

  <CmPopover id="profile-help" v-model:open="helpOpen" label="Profile help">
    Profile details are visible to your team.
  </CmPopover>
  <CmTooltip id="save-help" label="Save" content="Save changes" />
</template>
```

Dialog and Drawer emit `update:open` and `openChange` after Escape or close-button dismissal.
Popover emits the same events after trigger, Escape, or outside-pointer changes. Keep the Vue model
as application state and do not initialize the shared runtime over these components.

## Annabel Razor and runtime

```razor
<button id="open-confirm" type="button">Delete project</button>
<cm-dialog id="delete-project" title="Delete project?">
    This action cannot be undone.
    <razor-slot name="footer"><button type="button">Delete</button></razor-slot>
</cm-dialog>
<cm-drawer id="filters" title="Filters" side="end">Filter controls.</cm-drawer>
<cm-popover id="profile-help" label="Profile help">Profile details are visible to your team.</cm-popover>
<cm-tooltip id="save-help" label="Save" content="Save changes" />
```

Register all four controllers once in a frontend entry:

```ts
import {
  CmRuntime,
  createCmDialogController,
  createCmDrawerController,
  createCmPopoverController,
  createCmTooltipController,
} from '@codemonster-ru/ui-runtime';

new CmRuntime()
  .register('dialog', createCmDialogController)
  .register('drawer', createCmDrawerController)
  .register('popover', createCmPopoverController)
  .register('tooltip', createCmTooltipController)
  .start(document);
```

An application-owned Razor trigger can request a state change without reaching into controller
internals:

```ts
const dialog = document.querySelector('#delete-project-dialog');
document.querySelector('#open-confirm')?.addEventListener('click', () => {
  dialog?.dispatchEvent(new CustomEvent('cm:dialog-open-request'));
});
dialog?.addEventListener('cm:dialog-open-change', (event) => {
  console.log((event as CustomEvent<{ open: boolean }>).detail.open);
});
```

Drawer supports the matching `cm:drawer-open-request`; both modal controllers also accept their
`*-close-request`. Popover owns its trigger. Persist meaningful open state in application data when
it must survive navigation; runtime state is intentionally page-local.

## Accessibility and ownership

- Dialog and Drawer use native `<dialog>`, move focus inside when opened, contain Tab focus, close
  on Escape, and restore the invoking focus when known. Backdrop clicks do not dismiss them.
- Keep modal titles specific and visible. Use `description` for concise supporting text.
- Popover is non-modal: it does not trap focus, teleport content, or calculate floating
  coordinates. Escape and outside pointer activation dismiss it.
- Tooltip content must remain brief plain text and cannot contain controls. Never place required
  instructions exclusively in a Tooltip.
- Closed server markup remains in the DOM with native `open` or `hidden` state, providing safe SSR
  before JavaScript enhancement.
