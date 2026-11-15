# Layouts

Layouts compose components into a page shell: its regions, their geometry, and the state deciding
whether a region is shown. They ship from [`@codemonster-ru/ui-layouts`](../../packages/layouts/README.md)
rather than `ui-vue`, because a layout is not a component and the two are worth naming apart.

## State lives in attributes

Vue and Vanilla expose layout state on the root as `data-cm-*` attributes. CSS uses those
attributes to render the initial server state and subsequent updates. Vanilla uses marked
controls such as `data-cm-mobile-sidebar-toggle` on the button and `data-cm-mobile-sidebar-close`
on the backdrop. Vue also exposes scoped slots and component ref methods for consumers composing
their own controls.

## AdminLayout

`CmAdminLayout` is an application shell: a collapsible sidebar, a header, page content, and an
optional footer. Below 48rem the sidebar becomes a drawer with a backdrop.

Escape closes the drawer and leaves a collapsed sidebar alone — collapsing is a preference someone
set, while the drawer is covering the page right now.

Use `defaultSidebarCollapsed` or `defaultMobileSidebarOpen` for an initial uncontrolled state.
Use `v-model:sidebar-collapsed` and `v-model:mobile-sidebar-open` when the parent owns state.
If you omit `id`, the component generates an SSR-safe ID for the sidebar and toggle. The
`brand`, `aside`, `header`, and default slots receive `isSidebarCollapsed`, `isSidebarCompact`,
`isMobileSidebarOpen`, and the corresponding collapse, expand, open, close, and toggle methods.
The `mobile-toggle` slot receives `mobileToggleAttrs` for `aria-label`, `aria-controls`, and
`aria-expanded`, along with `toggleMobileSidebar` and the open and close methods.

```vue
<script setup lang="ts">
import { CmAdminLayout } from '@codemonster-ru/ui-layouts';
import { CmNavMenu } from '@codemonster-ru/ui-vue';
import { ref } from 'vue';

const collapsed = ref(false);
const items = [{ value: 'dashboard', label: 'Dashboard', href: '/dashboard' }];
</script>

<template>
  <CmAdminLayout id="workspace" v-model:sidebar-collapsed="collapsed">
    <template #brand>Acme</template>
    <template #aside><CmNavMenu :items="items" value="dashboard" /></template>
    <template #header>Projects</template>
    Dashboard content
  </CmAdminLayout>
</template>
```

Vanilla markup: [admin-layout HTML](../../contracts/admin-layout/cases/default.html).

## AdminShell

`CmAdminShell` is a fixed administrative frame: a topbar above a sidebar and workspace. It holds no
state at all, so it needs neither attributes nor a controller — it is the frame, and everything that
changes lives in what fills it.

Use `:fill-viewport="false"` to size the frame to its content. Both `header-actions` and
`headerActions` are accepted as slot names.

```vue
<template>
  <CmAdminShell>
    <template #brand>Acme</template>
    <template #sidebar>Navigation</template>
    Workspace
  </CmAdminShell>
</template>
```

## AppShell

`CmAppShell` is the widest frame: header, subheader, sidebar, content, aside, and footer. `layout`
selects which regions exist — `content`, `sidebar-content`, or `sidebar-content-aside`.

Use `sticky-header`, `sticky-sidebar`, and `sticky-aside` to opt into sticky placement.
`sticky-header` measures the rendered header and subheader in the browser. The server render uses
the declared `--cm-layout-header-height` and `--cm-layout-subheader-height` tokens.

The default and `sidebar` slots receive `isSidebarCollapsed`, `collapseSidebar`, `expandSidebar`,
and `toggleSidebarCollapsed`. Vue and Vanilla also accept a button marked `data-cm-sidebar-toggle`.
Both implementations keep its `aria-expanded` in step with the root's `data-cm-sidebar-collapsed`.
On desktop the sidebar narrows to a rail, and on small screens it remains reachable above the content.

```vue
<script setup lang="ts">
import { CmAppShell } from '@codemonster-ru/ui-layouts';
import { ref } from 'vue';

const collapsed = ref(false);
</script>

<template>
  <CmAppShell layout="sidebar-content" sticky-header v-model:sidebar-collapsed="collapsed">
    <template #header>Acme</template>
    <template #sidebar>
      <button type="button" data-cm-sidebar-toggle :aria-expanded="!collapsed">Collapse</button>
    </template>
    Dashboard content
  </CmAppShell>
</template>
```

Vanilla markup: [app-shell HTML](../../contracts/app-shell/cases/default.html).

Register both controllers, since the root names both: `app-shell` collapses the sidebar and
`shell-metrics` measures the sticky regions.

## DocumentLayout

`CmDocumentLayout` is the reading counterpart: header, subheader, chapter sidebar, body, a
contextual aside, and footer. It has no state of its own, so it names only `shell-metrics`.
`layout` defaults to `content`. Set `layout="sidebar-content-aside"` to show both side regions.
The `content-subheader` slot appears above the body. Set `edge-notches` to decorate the edges of
the header and footer.

```vue
<script setup lang="ts">
import { CmDocumentLayout } from '@codemonster-ru/ui-layouts';
</script>

<template>
  <CmDocumentLayout layout="sidebar-content-aside" sticky-header sticky-sidebar>
    <template #header>Guide</template>
    <template #sidebar>Chapters</template>
    <template #aside>On this page</template>
    Body
  </CmDocumentLayout>
</template>
```

## SetupLayout

`CmSetupLayout` is a centred panel for one step of a setup or onboarding flow, with a heading, body
and actions. Enter advances and Escape goes back.

The `next` and `back` events in Vue provide the original keyboard event. A key's default action is
cancelled only when Vue has a listener for that navigation event. The aside defaults to `left`.

The Enter rule is worth knowing, because a wizard that steals the key is worse than one that never
offered the shortcut. Enter advances from a single-line text field or from ordinary content, and is
left alone in a textarea, a select, a contenteditable region, and on a button or link that is
already about to act on it. That rule lives in the shared core, so both implementations agree on where the
shortcut applies.

```vue
<template>
  <CmSetupLayout title="Create your workspace" description="This takes a minute." @next="submit" @back="cancel">
    <CmField id="name" label="Workspace name"><CmInput id="name" /></CmField>
    <template #actions><CmButton @click="submit">Continue</CmButton></template>
  </CmSetupLayout>
</template>
```
