# Navigation components

`Link` and `Breadcrumbs` preserve native navigation. `Tabs`, `Menu`, and `Dropdown` share the same
canonical DOM and keyboard behavior in Vue and Vanilla HTML. Vanilla HTML markup uses the
framework-independent runtime for progressive enhancement; Vue owns its interaction directly.

Load the token and complete component stylesheets described in the [Button guide](./button.md).
Individual styles are also available from the `link.css`, `breadcrumbs.css`, `tabs.css`,
`menu.css`, and `dropdown.css` npm subpath exports.

## APIs

- `CmLink` (also `VfLink`) accepts a native `href` or, in Vue, a router destination in `to`. With `to`, install
  Vue Router or supply a link component through `component`. It accepts `underline`
  (`none`, `hover`, or `always`) and `tone` (`default` or `muted`), and forwards safe
  anchor attributes. A blank target receives
  `rel="noopener noreferrer"` unless an explicit `rel` is supplied.
- `Breadcrumbs` requires ordered `items` with `label` and optional `href`, `disabled`, and
  `current`. At most one item is current; otherwise the last item is inferred. `ariaLabel`
  defaults to `Breadcrumb`, and the `separator` slot replaces the visual `/`.
- `Tabs` accepts items with unique kebab-case `value`, non-empty `label`, optional `content`,
  and `disabled`. Vue generates a stable prefix if `id` is omitted and binds the active tab with
  `v-model`. Set `defaultValue` for an initial uncontrolled selection. The per-item slots
  `tab{UpperCamelValue}` and `panel{UpperCamelValue}` retain their content across selection changes.
  Use the shared `tab` slot with `{ item, isActive, index }` or the shared active `panel` slot with
  `{ activeValue }`. An item can also provide an external `panelId` and an explicit `tabId`.
  Historical Vue consumers can use `VfTabs` and its `change` event.
- `Menu` requires items with unique kebab-case `id`, `label`, and optional `href`, `target`, `rel`,
  `disabled`, `active`, and `tone` (`default` or `danger`). A blank target is secured like Link.
  `item{UpperCamelId}` slots add trusted rich content without a standalone item component. It
  represents application actions, not ordinary site navigation. Vue emits `select` and
  `closeRequest`.
- `Dropdown` requires `id`, `label`, and Menu items. It accepts `disabled` and `placement`
  (`bottom-start` or `bottom-end`). Its `trigger` slot stays inside the owned button and `label`
  remains its accessible name. Vue binds disclosure state with `v-model:open` and emits `select`;
  Vanilla HTML receives `open` as its initial state.

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

## Vanilla HTML and runtime

Vanilla markup: [tabs HTML](../../contracts/tabs/cases/default.html), [menu HTML](../../contracts/menu/cases/default.html), [breadcrumbs HTML](../../contracts/breadcrumbs/cases/default.html).

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

Vanilla markup: [table-of-contents HTML](../../contracts/table-of-contents/cases/default.html).

For optional scrolling, put `data-cm-controller="table-of-contents"` on the nav and use
`data-cm-toc-smooth` or `data-cm-toc-scroll-offset="64"`. See the
[enhanced markup](../../contracts/table-of-contents/cases/offset.html). Register
`createCmTableOfContentsController` as `table-of-contents` with `CmRuntime`.

Keep each fragment link's `href` and heading `id` in the HTML. Add `tabindex="-1"` to
headings so the enhancement can move focus to the destination without introducing a tab stop.
The enhancement respects reduced motion, applies the offset when the page opens with a matching
fragment, and preserves ordinary browser behavior for modified clicks and missing headings.

The historical `VfTableOfContents` name and `useTableOfContents()` are available from
`@codemonster-ru/ui-vue/historical`. The component uses the same anchor, current-location and
scrolling behavior. The composable accepts plain values, refs or getters for `items`, `offset` and
`disabled`. Pass the returned `activeId` to the component when the current section should track
scroll position. Use the same pixel value for `offset` and `scrollOffset` when a sticky header
covers the top of the viewport.

The scroll tracker reads heading positions by item `id`. An explicit `href` controls link
navigation. Use headings in page order. Tracking starts after mount and waits briefly for a page
whose headings render asynchronously. `updateActiveId()` also lets the host remeasure after a
layout change. A disabled tracker clears the active ID. The server can supply a controlled
`activeId` when it already knows the current section.

## Stepper

`CmStepper` walks a person through a sequence. Each step reads as complete, current or upcoming
relative to the active one, and a disabled step stays disabled wherever it sits — "complete" and
"upcoming" describe progress through steps that can actually be reached.

Arrow keys move between steps and follow the orientation: left and right when horizontal, up and
down when vertical. That is the same roving navigation Tabs, Accordion and Menu use, taken from the
shared core rather than written again here.

Use `v-model:value` with its existing immediate updates, `defaultValue` for an initial step, or
`v-model` for a controlled Stepper. With `modelValue` supplied, a step activation emits
`update:modelValue` and `change` and the current step follows the value accepted by the caller.
`VfStepper` exposes the same native component for historical Vue consumers.

Set `contentPosition` to `above` or `below` for a horizontal Stepper, or `start` or `end`
for a vertical Stepper. The vertical sides follow the text direction. Existing `bottom` and
`inline` layouts remain available. Vanilla HTML uses the same geometry classes and starts
with `aria-current="step"` on the authored active button.

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

Vanilla markup: [stepper HTML](../../contracts/stepper/cases/default.html).

## Nested navigation

`CmNavMenu` renders a nested menu. Branches expand in place. With uncontrolled expansion, the menu
opens the path to the active item on initial render and when selection changes.

A collapsed branch stays in the markup. Its links leave the tab order until the branch opens.
The open and closed states animate with `grid-template-rows`, so neither adapter measures height.
Choose `variant="pills"` for the historical row height, rounded selected surface, and visible
labels at narrow widths. Pills use the same native link and disclosure button markup as the
sidebar and inline variants.

`kind: 'group'` renders a non-interactive section heading whose children are always shown.

Use `href` for a native link. Use `to` for a string or object route and register `RouterLink` in
the Vue application. Pass `linkComponent` to supply another component that accepts `to` and
forwards the navigation attributes to a focusable anchor. Disabled routes render without a
destination and stay out of the tab sequence.

Use `v-model` for controlled selection or `defaultValue` for initial uncontrolled selection.
Existing `v-model:value` bindings take precedence when supplied. `select` returns the selected
item. `change` and `valueChange` return its value. The sidebar variant narrows with a CSS container
query that applies to server-rendered pages.

To set the sidebar presentation explicitly, use `compact` for icon-only top-level actions
that have icons or `:compact="false"` to keep full labels. Set a `CmNavMenu` item's `leadingIcon`
to geometry imported from `@codemonster-ru/ui-icons`. The opt-in `VfNavMenu` from
`@codemonster-ru/ui-vue/historical` accepts catalog names in the same field. Enabled links with
`target="_blank"` include a decorative external-link icon.

```vue
<script setup lang="ts">
import { CmNavMenu } from '@codemonster-ru/ui-vue';
import { ref } from 'vue';

const active = ref('active');
const items = [
  { value: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  {
    value: 'projects',
    label: 'Projects',
    children: [{ value: 'active', label: 'Active', to: { path: '/projects/active' } }],
  },
];
</script>

<template>
  <CmNavMenu v-model="active" :items="items" expand-mode="single" variant="pills" />
</template>
```

Vanilla markup is available for [sidebar](../../contracts/nav-menu/cases/default.html),
[pills](../../contracts/nav-menu/cases/pills.html),
[resolved routes](../../contracts/nav-menu/cases/routes.html), and
[compact sidebar](../../contracts/nav-menu/cases/compact.html).

## Menu bar

`CmMenuBar` is a horizontal bar of menus: `role="menubar"` with nested `role="menu"` submenus. It
shows one path at a time, so opening a branch replaces the open path rather than adding to it.

The keyboard is the part worth knowing, because the same arrow means different things depending on
where focus sits. Down opens a branch on the bar but walks entries inside a submenu; right moves
along the bar but opens a nested branch; left moves back along the bar but closes to the parent
inside. The horizontal pair swaps under `rtl` and the vertical pair does not, because a submenu
drops downward in both directions. Those rules are one function in the shared core rather than
nested conditions in each adapter.

Submenus are positioned by CSS and stay in the markup while closed, hidden rather than absent.
The menu bar has one tab stop. Arrow keys skip disabled commands, and Escape closes the open menu
and restores focus to its top-level trigger. Use `variant="pills"` for the historical control
geometry and selected surfaces. Set `defaultValue` for an initial selection or bind `v-model`.
The selected leaf has `aria-current="page"` and a corresponding class in both adapters.

```vue
<script setup lang="ts">
import { CmMenuBar } from '@codemonster-ru/ui-vue';

const items = [
  { value: 'file', label: 'File', children: [{ value: 'new', label: 'New' }] },
  { value: 'help', label: 'Help', href: '/help' },
];
</script>

<template>
  <CmMenuBar :items="items" default-value="help" variant="pills" />
</template>
```

Vanilla markup is available for [default](../../contracts/menu-bar/cases/default.html) and
[pills](../../contracts/menu-bar/cases/pills.html).
