# Overlay components

`Dialog` and `Drawer` are modal native-dialog surfaces. `Popover` is a non-modal disclosure, and
`Dropdown` opens an action menu. `Tooltip` provides short non-interactive text on both focus and hover. Vue owns interaction inside
its component tree; Vanilla HTML uses the shared progressive-enhancement runtime.

Load the token and complete component stylesheets described in the [Button guide](./button.md).
Individual styles are also available from the `dialog.css`, `drawer.css`, `dropdown.css`, `popover.css`, and
`tooltip.css` npm subpath exports.

## APIs

- `Dialog` requires a stable `id` and an accessible name through a title, header slot, or ARIA
  label. Use `defaultOpen` for uncontrolled initial state. The default, `header`, `description`,
  `actions`, and `footer` slots compose its trusted regions. `VfDialog` from the historical entry
  supplies an ID, defaults to backdrop dismissal and focuses the native surface.
- `Drawer` shares the Dialog composition API and adds logical or physical `side`,
  `size` (`sm`, `md`, `lg`, or `full`), `rounded`, and `dividers`. Use `offsetTop` and
  `bodyPadding` for shell spacing. `VfDrawer` from the historical entry uses physical
  `placement` and defaults to the right edge.
- `Popover` requires `id` and trigger `label`. It accepts `open`, `disabled`, and `placement`
  (`top`, `bottom-start`, or `bottom-end`), an optional Vue portal, and independent Escape and
  outside-click dismissal. The default slot receives `open` and `close()`.
- `Dropdown` requires `id` and trigger `label`. Use `items` or the default slot with native menu
  actions. The default slot receives `{ open, close }`. The `trigger` slot receives
  `{ open, disabled, toggle }` and stays inside the labelled button. Use `variant="pills"`
  for highlighted active items and `closeOnSelect=false` to keep the menu open after selection.
  Both Popover and Dropdown accept `showArrow`. `VfPopover` and `VfDropdown` enable it by default.
- `Tooltip` accepts an authored focusable trigger in its default slot or renders a button with
  `label` and optional `trigger` slot content. Use `content`, `text`, or the `content` slot for its
  non-interactive help. Choose `top`, `bottom`, `start`, or `end` and a named `delay` or an
  `openDelay` in milliseconds. Use `teleportTo` to position the help outside a clipped ancestor.
  `defaultVisible` sets the initial rendering state. The Vue `VfTooltip` export uses top placement,
  an 80 ms delay, and a body portal by default.

Dropdown, Popover, and Tooltip reveal their content with the shared overlay motion. The content
becomes hidden immediately on dismissal. A reduced-motion preference or a browser without CSS
starting styles displays the content immediately. [CSS starting styles](https://www.w3.org/TR/css-transitions-2/#defining-before-change-style)

Dialog fades in with a short upward motion. Drawer slides in from its selected edge. Both fade
in their backdrops and move focus inside as soon as the native modal opens. A reduced-motion
preference skips this entry motion. Closing leaves the native modal stack immediately and
returns focus to the opener.

`VfDialog` and `VfDrawer` accept `teleportTo` as a selector or element in their document.
They render inline on the server and move to the target after mounting, defaulting to `body`.
Use `disableTeleport`, `false`, or `null` to keep them inline. The target controls DOM ancestry
and inherited styles. Opening still uses the browser’s modal top layer and document scroll lock.
Set `VfDrawer`’s `scrollLockTarget` to an element to lock that region while the drawer is open,
or to `false` to leave scroll styles alone. `null` uses the normal document lock.

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
  <CmDialog id="delete-project" v-model:open="confirmOpen" title="Delete project?" size="lg" dividers>
    <template #header>Delete <strong>project</strong>?</template>
    <template #actions><button type="button">Preview impact</button></template>
    This action cannot be undone.
    <template #footer>
      <button type="button" @click="confirmOpen = false">Cancel</button>
      <button type="button">Delete</button>
    </template>
  </CmDialog>

  <CmPopover id="profile-help" v-model:open="helpOpen" label="Profile help">
    <template #trigger><span aria-hidden="true">?</span></template>
    Profile details are visible to your team.
  </CmPopover>
  <CmTooltip id="save-help" label="Save" content="Save changes">
    <template #content>Save <strong>all changes</strong></template>
  </CmTooltip>
</template>
```

Dialog and Drawer emit `update:open` and `openChange` after Escape or close-button dismissal. Set
Dialog `dismissible` to `false` while an asynchronous action must lock user-initiated dismissal.
Popover emits the same events after trigger, Escape, or outside-pointer changes. Keep the Vue model
as application state and do not initialize the shared runtime over these components.

For application-owned scroll regions, import `useScrollLock` from
`@codemonster-ru/ui-vue/historical`. Call `useScrollLock(enabled, { target })` in a Vue scope,
passing values, refs, or getters. The target defaults to `document.body` when omitted or null.
The hook hides overflow while enabled, preserves body scrollbar space, and restores inline
styles when the last lock on that target releases. Call the returned `unlock()` to release
your lock early. Changing the enabled state or target lets the hook acquire again.

## Vanilla HTML and runtime

Use the canonical HTML for [dialog](../../contracts/dialog/contract.md), [drawer](../../contracts/drawer/contract.md), [dropdown](../../contracts/dropdown/contract.md), [popover](../../contracts/popover/contract.md), [tooltip](../../contracts/tooltip/contract.md) in Vanilla.

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

An application-owned Vanilla HTML trigger can request a state change without reaching into controller
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

Add `data-cm-floating-arrow` to an authored `.cm-popover__panel` or `.cm-dropdown__menu` to
show a decorative arrow. The installed controller keeps the arrow on the trigger's side
when the surface flips or shifts to fit the viewport.

## Accessibility and ownership

- Dialog and Drawer use native `<dialog>`, move focus inside when opened, contain Tab focus,
  and restore the invoking focus when known. Use `closeOnEscape` and `closeOnOverlayClick` for
  separate dismissal policies. `dismissible=false` locks user dismissal.
- Native modal overlays keep the document's scroll position and existing scrollbar space while
  open. Content within each modal can scroll. Document scrolling resumes after the last modal closes.
- Drawer supports logical `start` and `end`, physical `left` and `right`, and full-width `top`
  and `bottom` placements. Use `side` in Vue and the corresponding `cm-drawer--*` class in Vanilla.
  Size controls the minimum height of a top or bottom drawer within the available viewport.
- Keep modal titles specific and visible. Use `description` for concise supporting text.
- Popover is non-modal: it positions the panel relative to the trigger and allows focus to leave.
  Escape and outside clicks dismiss it by default.
- Rich Tooltip content must remain brief and cannot contain controls. Never place required
  instructions exclusively in a Tooltip.
- Keep content inside a component-owned trigger button noninteractive. Use authored trigger
  composition for existing buttons: Tooltip accepts one in its default slot, and Vue Popover
  and Dropdown accept one with `triggerAsChild` or through their historical entries.
- Closed server markup remains in the DOM with native `open` or `hidden` state, providing safe SSR
  before JavaScript enhancement.
