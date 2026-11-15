# Display components

Badge, Tag, Alert, Avatar, Divider, and Skeleton are framework-independent display primitives with
the same significant DOM in Vue and Vanilla HTML. Import shared styles once with
`@codemonster-ru/ui-css/styles.css`.

## Icons

Pass geometry imported from `@codemonster-ru/ui-icons` to `CmIcon`. Omit `label` when nearby text
already names the control. Use `label` for a meaningful standalone image. Both `CmIcon` and
`VueIconify` take `family`, `variant`, `size`, `spin`, `inset`, `secondaryColor`, and
`secondaryOpacity`. Spin stops when the user prefers reduced motion.

```vue
<script setup lang="ts">
import { arrowLeft } from '@codemonster-ru/ui-icons';
import { CmIcon, VueIconify } from '@codemonster-ru/ui-vue';
</script>

<template>
  <CmIcon :icon="arrowLeft" label="Back" />
  <VueIconify icon="arrow-left" family="duotone" :size="24" aria-label="Back" />
</template>
```

`VueIconify` accepts historical camel-case and kebab-case names. It defaults to the moon icon,
uses regular for classic drawings and solid for brand marks, and checks explicit family and
weight combinations. Prefer `CmIcon` for static icon imports so production bundlers can drop
unused geometry. When embedding the same duotone icon multiple times in Vanilla, scope its SVG
definitions once per instance with `scopeCmIconIds` from `@codemonster-ru/ui-icons`.

Badge and Tag differ only in how a tone reads. A tone fills a Badge, which suits a status; it
outlines a Tag, which suits a category. Reach for Badge when the label reports what something *is
doing*, and Tag when it reports what something *belongs to*.

## Vue

```vue
<script setup lang="ts">
import { CmAlert, CmAvatar, CmBadge, CmDivider, CmSkeleton, CmTag } from '@codemonster-ru/ui-vue';
</script>

<template>
  <CmBadge tone="success">Published</CmBadge>
  <CmTag tone="primary">Platform</CmTag>
  <CmAlert tone="warning" title="Review required">Check the highlighted fields.</CmAlert>
  <CmAvatar label="AK" shape="circle" />
  <CmDivider />
  <CmSkeleton min-height="6rem" />
</template>
```

## Vanilla HTML

Use the canonical HTML for [alert](../../contracts/alert/contract.md), [avatar](../../contracts/avatar/contract.md), [badge](../../contracts/badge/contract.md), [divider](../../contracts/divider/contract.md), [skeleton](../../contracts/skeleton/contract.md), [tag](../../contracts/tag/cases/default.html) in Vanilla.

Badge text and Alert body/title carry meaning independently of color. Alert defaults to
`role="status"`; use `role="alert"` only for urgent asynchronously inserted feedback. Alert icon
slots are decorative.

Avatar content priority is image, label, then default slot. Decorative images keep empty alt text;
provide meaningful alternative text or an accessible root label when the avatar communicates an
identity not already stated nearby.

Divider is a native separator and never enters the tab order. Skeleton is hidden from assistive
technology; its container owns busy-state semantics. Skeleton heights accept non-negative numbers
or simple CSS lengths, and animation stops under reduced-motion preferences.
