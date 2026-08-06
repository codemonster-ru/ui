# Features

## Import

```ts
import { VfPageHeader } from '@codemonster-ru/vueforge-core/page-header';
```

## Basic

```vue
<VfPageHeader
  title="Users"
  description="Manage application access."
  :breadcrumbs="[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]"
>
  <template #actions>
    <VfButton>New user</VfButton>
  </template>
</VfPageHeader>
```

Actions wrap below the title when the page header's container becomes narrow. Use the named slots
when title, description, or breadcrumb content needs custom markup.
