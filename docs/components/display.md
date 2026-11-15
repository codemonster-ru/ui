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
import { CmIcon } from '@codemonster-ru/ui-vue';
import { VueIconify } from '@codemonster-ru/ui-vue/historical';
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

## Props and states

Use Badge for a status such as “Published” and Tag for a category such as “Platform.”
Badge uses a filled tone and Tag uses an outlined tone. Both carry their label through the
default slot in Vue and text content in Vanilla.

| Components | Vue props and slots |
| --- | --- |
| `CmBadge`, `CmTag` | `tone` defaults to `neutral`. The available tones are `neutral`, `primary`, `success`, `info`, `warning`, `help`, `danger`, and `contrast`. |
| `CmAlert` | Uses the same tones and defaults to `info`. Use the `title` prop or slot, decorative `icon` slot, and default body slot. |
| `CmAvatar` | Supply an `image` with `imageAlt`, a text `label`, or a default slot. `size` is `sm`, `md` (default), or `lg`, and `shape` is `square` (default) or `circle`. |
| `CmDivider` | `orientation` accepts `horizontal` (default) and `vertical`. |
| `CmSkeleton` | `minHeight` accepts a pixel number or simple CSS length. Set `radius` to `control`, `surface` (default), or `round`. Set `:animated="false"` for a stationary placeholder. |

These presentation components use their props and markup to render state. None requires a
Vanilla controller or exposes a custom state-change event.

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

### Historical Vue names

Import `VfAlert` and `VfAvatar` from `@codemonster-ru/ui-vue/historical` to use named icons.
`VfAlert` defaults to the primary tone and `role="alert"`, and accepts `warn` for the warning
tone. The `icon` slot overrides a named `icon` prop or the tone's default icon. Set `hideIcon`
to hide all leading icon content. The `title` slot can replace the `title` prop.
`VfAvatar` uses its named icon after `image` and `label`, before the default slot.

`VfBadge` and `VfTag` are aliases for `CmBadge` and `CmTag`. Both names accept `warn` as an
alias for `warning` and use the canonical warning class in rendered HTML.

```vue
<script setup lang="ts">
import { VfAlert, VfAvatar } from '@codemonster-ru/ui-vue/historical';
</script>

<template>
  <VfAlert tone="warn" title="Review required" icon="alert-circle"> Check the highlighted fields. </VfAlert>
  <VfAvatar icon="user" shape="circle" />
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
