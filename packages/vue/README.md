# CodeMonster UI Vue

Vue 3 adapter for CodeMonster UI components.

Current version: `@codemonster-ru/ui-vue@2.0.0-rc.2` — unpublished internal release candidate; the published line is `1.x`.

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` for package tooling and SSR.
- Vue `^3.5.0`.

## Installation

The 2.0 candidate in this checkout is consumed through workspace builds or local tarballs.
From the repository root:

```bash
npm ci
npm run build
npm run check:packed-consumers
```

The packed check installs this candidate with npm, pnpm, and Yarn in fresh consumer projects.
Install the matching tokens, CSS, runtime, icons, and Vue tarballs together when testing it in
another project. Use the released `1.x` documentation for registry installations of that line.

## Quick start

```ts
import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-css/styles.css';
import { CmButton } from '@codemonster-ru/ui-vue';
```

```vue
<CmButton variant="secondary" size="lg" type="submit">Save</CmButton>
```

`CmButton` renders a native button, forwards consumer attributes and listeners to it, and merges
consumer classes after the stable `cm-button` contract classes. Its default native `type` is
`button`; set `type="submit"` explicitly for form submission. The optional `leading` and `trailing`
slots render icon regions. `loading` replaces the leading region with a hidden spinner, disables the
button, and exposes `aria-busy="true"` while preserving its label. A non-empty `href` renders an
anchor. Disabled links omit `href`, expose `aria-disabled="true"`, and suppress consumer click
handlers.

## Migrating VueForge templates

Use the `Cm*` components from `@codemonster-ru/ui-vue` for new templates. The
`@codemonster-ru/ui-vue/historical` entry is available for restored contracts such as named icons,
authored overlay triggers, and the physical Drawer placement API:

```ts
import { VfDrawer, VfPopover } from '@codemonster-ru/ui-vue/historical';
```

Import the shared tokens and stylesheet before rendering either aggregate entry. The native Dialog and Drawer
use the browser's modal stack; custom legacy Teleport destinations and scroll-lock targets are
separate migration concerns. The [historical Vue theme plugin](../../docs/recipes/vue-theme-plugin.md)
sets app-level defaults for `VfThemeProvider`. Node `require()` supports both entries on the Node
versions above and shares the ESM instances. The archived VueForge packages retain their preset
engine. See the
[historical contract trace](../../docs/verification/historical-vue-core.md) and
[layout migration notes](../layouts/README.md) for exact supported behavior and remaining differences.

Use component subpaths such as `@codemonster-ru/ui-vue/historical/button` for browser bundlers to
automatically load the relevant shared CSS from the existing packages. Node loads the same
component modules without CSS. See the [deep import migration guide](../../docs/migrate-from-vueforge.md#component-subpaths).

## Documentation

See the cross-platform [Button guide](../../docs/components/button.md) for props, slots, forms,
links, accessibility, and matching Vanilla HTML usage.
See the [Card guide](../../docs/components/card.md) for semantic roots and region composition.
See the [form components guide](../../docs/components/forms.md) for Vue binding, choice controls, and accessible forms.
See the [Accordion guide](../../docs/components/accordion.md) for controlled state and keyboard behavior.
See the [display components guide](../../docs/components/display.md) for Badge, Alert, Avatar, Divider, and Skeleton.
See the [navigation components guide](../../docs/components/navigation.md) for native links, controlled Tabs, Menu, and Dropdown behavior.
See the [overlay components guide](../../docs/components/overlays.md) for modal focus, disclosure state, and Tooltip behavior.
See the [advanced input guide](../../docs/components/advanced-inputs.md) for component-owned Select, native DatePicker binding, and CommandPalette state.
See the [Table and DataTable guide](../../docs/components/data-tables.md) for authored table slots and controlled data requests.
See the [layout primitives guide](../../docs/components/layout-primitives.md) for semantic,
responsive page composition without runtime behavior.

## License

[MIT](./LICENSE)
