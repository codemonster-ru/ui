# Layouts

Layouts compose components into a page shell: its regions, their geometry, and the state deciding
whether a region is shown. They ship from [`@codemonster-ru/ui-layouts`](../../packages/layouts/README.md)
rather than `ui-vue`, because a layout is not a component and the two are worth naming apart.

## State lives in attributes

A layout's state is small — a sidebar is collapsed or not, a mobile drawer is open or not — but it
has to cross a boundary that Vue slot scopes cannot. The VueForge layouts handed every slot a scope
object holding the state plus five functions to change it; PHP has no equivalent, which is why those
layouts were never portable.

So the state is written on the layout root as `data-cm-*` attributes. Both adapters render it, CSS
reads it, and a runtime controller flips it. Controls are marked rather than wired:
`data-cm-mobile-sidebar-toggle` on the button, `data-cm-mobile-sidebar-close` on the backdrop. That
is the same arrangement Tabs and Accordion already use.

One consequence worth having: the layout is correct before JavaScript runs. A server-rendered page
opens with the right sidebar state, and CSS handles the drawer.

## AdminLayout

`CmAdminLayout` is an application shell: a collapsible sidebar, a header, page content, and an
optional footer. Below 48rem the sidebar becomes a drawer with a backdrop.

Escape closes the drawer and leaves a collapsed sidebar alone — collapsing is a preference someone
set, while the drawer is covering the page right now.

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

```php
<cm-admin-layout id="workspace">
  <template #brand>Acme</template>
  <template #aside><cm-nav-menu :items="$navigation" /></template>
  Dashboard content
</cm-admin-layout>
```

## AdminShell

`CmAdminShell` is a fixed administrative frame: a topbar above a sidebar and workspace. It holds no
state at all, so it needs neither attributes nor a controller — it is the frame, and everything that
changes lives in what fills it.

```vue
<template>
  <CmAdminShell>
    <template #brand>Acme</template>
    <template #sidebar>Navigation</template>
    Workspace
  </CmAdminShell>
</template>
```

## SetupLayout

`CmSetupLayout` is a centred panel for one step of a setup or onboarding flow, with a heading, body
and actions. Enter advances and Escape goes back.

The Enter rule is worth knowing, because a wizard that steals the key is worse than one that never
offered the shortcut. Enter advances from a single-line text field or from ordinary content, and is
left alone in a textarea, a select, a contenteditable region, and on a button or link that is
already about to act on it. That rule lives in the shared core, so both adapters agree on where the
shortcut applies.

```vue
<template>
  <CmSetupLayout title="Create your workspace" description="This takes a minute." @next="submit" @back="cancel">
    <CmField id="name" label="Workspace name"><CmInput id="name" /></CmField>
    <template #actions><CmButton @click="submit">Continue</CmButton></template>
  </CmSetupLayout>
</template>
```

