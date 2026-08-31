# Navigation components

`Link` and `Breadcrumbs` preserve native navigation. `Tabs`, `Menu`, and `Dropdown` share the same
canonical DOM and keyboard behavior in Vue and Annabel Razor. Razor markup uses the
framework-independent runtime for progressive enhancement; Vue owns its interaction directly.

Load the token and complete component stylesheets described in the [Button guide](./button.md).
Individual styles are also available from the `link.css`, `breadcrumbs.css`, `tabs.css`,
`menu.css`, and `dropdown.css` npm subpath exports.

## APIs

- `Link` requires a non-empty `href`, accepts `underline` (`none`, `hover`, or `always`) and `tone`
  (`default` or `muted`), and forwards safe anchor attributes. A blank target receives
  `rel="noopener noreferrer"` unless an explicit `rel` is supplied.
- `Breadcrumbs` requires ordered `items` with `label` and optional `href`, `disabled`, and
  `current`. At most one item is current; otherwise the last item is inferred. `ariaLabel`
  defaults to `Breadcrumb`, and the `separator` slot replaces the visual `/`.
- `Tabs` requires a stable `id` and items with unique kebab-case `value`, non-empty `label`, optional
  `content`, and `disabled`. Vue binds the active value with `v-model`; Razor receives `value`.
  `defaultValue` initializes uncontrolled state. Per-item
  `tab{UpperCamelValue}`/`panel{UpperCamelValue}` slots provide trusted rich content inside owned
  panels. Invalid or missing values fall back to the first enabled tab.
- `Menu` requires items with unique kebab-case `id`, `label`, and optional `href`, `target`, `rel`,
  `disabled`, `active`, and `tone` (`default` or `danger`). A blank target is secured like Link.
  `item{UpperCamelId}` slots add trusted rich content without a standalone item component. It
  represents application actions, not ordinary site navigation. Vue emits `select` and
  `closeRequest`.
- `Dropdown` requires `id`, `label`, and Menu items. It accepts `disabled` and `placement`
  (`bottom-start` or `bottom-end`). Its `trigger` slot stays inside the owned button and `label`
  remains its accessible name. Vue binds disclosure state with `v-model:open` and emits `select`;
  Razor receives `open` as its initial state.

## Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CmBreadcrumbs, CmDropdown, CmLink, CmTabs } from '@codemonster-ru/ui-vue';

const tab = ref('profile');
const menuOpen = ref(false);
const tabs = [
  { value: 'profile', label: 'Profile', content: 'Profile settings.' },
  { value: 'security', label: 'Security', content: 'Security settings.' },
];
const actions = [
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete', tone: 'danger' as const },
];
</script>

<template>
  <CmBreadcrumbs :items="[{ label: 'Home', href: '/' }, { label: 'Settings' }]" />
  <CmLink href="/help" underline="hover">Help</CmLink>
  <CmTabs id="settings" v-model="tab" :items="tabs" />
  <CmDropdown id="actions" v-model:open="menuOpen" label="Actions" :items="actions" />
</template>
```

Treat the Vue model as authoritative application state. Tabs use automatic activation: Arrow keys,
Home, and End both focus and select an enabled tab. Menu uses Up/Down, Home, End, and Escape.
Dropdown opens from its trigger with ArrowDown, ArrowUp, Enter, or Space and closes after selection,
Escape, or an outside pointer activation.

## Annabel Razor and runtime

```razor
<cm-breadcrumbs :items="[['label' => 'Home', 'href' => '/'], ['label' => 'Settings']]" />
<cm-link href="/help" underline="hover">Help</cm-link>
<cm-tabs id="settings" value="profile" :items="$tabs" />
<cm-dropdown id="actions" label="Actions" :items="$actions" />
```

Register the interactive controllers once in a frontend entry that is scoped away from Vue-owned
trees:

```ts
import {
  CmRuntime,
  createCmDropdownController,
  createCmMenuController,
  createCmTabsController,
} from '@codemonster-ru/ui-runtime';

new CmRuntime()
  .register('tabs', createCmTabsController)
  .register('menu', createCmMenuController)
  .register('dropdown', createCmDropdownController)
  .start(document);
```

Without JavaScript, links and Breadcrumbs remain fully functional, the initially selected tab panel
remains visible, and an initially open Dropdown remains usable. Persist user-driven Tabs and
Dropdown state through application events or the next server request when the state must survive a
page load.

## Accessibility and ownership

- Use Link only for navigation and native buttons for actions that do not navigate.
- Keep Breadcrumb labels concise and provide a specific `ariaLabel` when multiple trails exist.
- Keep Tabs panel ids stable and unique; do not duplicate a Tabs `id` on a page.
- Menu implements the ARIA application-menu keyboard model. Use ordinary links for a persistent
  navigation list.
- Dropdown is a disclosure, not a modal: it does not trap focus, teleport content, or calculate
  floating coordinates.
- Do not initialize the shared runtime over Vue-owned navigation components.

## Table of contents

`CmTableOfContents` is a nav of anchor links to headings on the page. It needs no JavaScript: a
browser follows `#id` on its own, so the list works from server-rendered markup alone.

`smooth` and `scrollOffset` are the enhancement layered over that, for pages with a sticky header
that would otherwise cover the heading being jumped to. Without either, the click is left alone
rather than intercepted and reimplemented. Nesting comes from each item's `level`, clamped to the
six levels that exist.

```vue
<script setup lang="ts">
import { CmTableOfContents } from '@codemonster-ru/ui-vue';

const items = [
  { id: 'overview', label: 'Overview' },
  { id: 'install', label: 'Installation', level: 2 },
  { id: 'usage', label: 'Usage', level: 2 },
];
</script>

<template>
  <CmTableOfContents :items="items" active-id="install" :scroll-offset="64" smooth />
</template>
```

```php
<cm-table-of-contents :items="$items" active-id="install" />
```

## Stepper

`CmStepper` walks a person through a sequence. Each step reads as complete, current or upcoming
relative to the active one, and a disabled step stays disabled wherever it sits — "complete" and
"upcoming" describe progress through steps that can actually be reached.

Arrow keys move between steps and follow the orientation: left and right when horizontal, up and
down when vertical. That is the same roving navigation Tabs, Accordion and Menu use, taken from the
shared core rather than written again here.

```vue
<script setup lang="ts">
import { CmStepper } from '@codemonster-ru/ui-vue';
import { ref } from 'vue';

const items = [
  { value: 'account', label: 'Account' },
  { value: 'billing', label: 'Billing', description: 'Payment details' },
  { value: 'review', label: 'Review' },
];
const step = ref('billing');
</script>

<template>
  <CmStepper v-model:value="step" :items="items" />
</template>
```

```php
<cm-stepper :items="$items" value="billing" />
```
