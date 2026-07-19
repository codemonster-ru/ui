# Admin Shell

`VfAdminShell` provides a complete administrative shell with a full-width topbar and a body layer with rounded top corners containing the navigation sidebar and content workspace.

It is intended for CMS and dashboard interfaces whose global navigation belongs above every page region.

## Import

```ts
import { VfAdminShell } from '@codemonster-ru/vueforge-layouts';
```

## Basic usage

```vue
<VfAdminShell>
  <template #brand>Annabel CMS</template>
  <template #header>Dashboard</template>
  <template #header-actions>Profile</template>
  <template #sidebar>
    <nav aria-label="Administration">...</nav>
  </template>

  <RouterView />
</VfAdminShell>
```

See [Features](./features.md), [API](./api.md), and [Theming](./theming.md).
