# Display components

Badge, Alert, Avatar, Divider, and Skeleton are framework-independent display primitives with the
same significant DOM in Vue and Annabel Razor. Import shared styles once with
`@codemonster-ru/ui-css/styles.css`.

## Vue

```vue
<script setup lang="ts">
import { CmAlert, CmAvatar, CmBadge, CmDivider, CmSkeleton } from '@codemonster-ru/ui-vue';
</script>

<template>
  <CmBadge tone="success">Published</CmBadge>
  <CmAlert tone="warning" title="Review required">Check the highlighted fields.</CmAlert>
  <CmAvatar label="AK" shape="circle" />
  <CmDivider />
  <CmSkeleton min-height="6rem" />
</template>
```

## Annabel Razor

```php
<cm-badge tone="success">Published</cm-badge>
<cm-alert tone="warning" title="Review required">Check the highlighted fields.</cm-alert>
<cm-avatar label="AK" shape="circle" />
<cm-divider />
<cm-skeleton min-height="6rem" />
```

Badge text and Alert body/title carry meaning independently of color. Alert defaults to
`role="status"`; use `role="alert"` only for urgent asynchronously inserted feedback. Alert icon
slots are decorative.

Avatar content priority is image, label, then default slot. Decorative images keep empty alt text;
provide meaningful alternative text or an accessible root label when the avatar communicates an
identity not already stated nearby.

Divider is a native separator and never enters the tab order. Skeleton is hidden from assistive
technology; its container owns busy-state semantics. Skeleton heights accept non-negative numbers
or simple CSS lengths, and animation stops under reduced-motion preferences.
