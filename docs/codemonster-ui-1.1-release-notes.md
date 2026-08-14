# CodeMonster UI 1.1 release notes

CodeMonster UI 1.1 completes the portable Vue and Annabel Razor component cohort, closes the
reviewed VueForge migration gaps, and validates both adapters against the same contracts. Existing
VueForge packages remain available: Icons, CodeBlock, and Playground continue as separately
maintained products, while application shells and product policy stay application-owned.

## Release cohort

| Package                        | Version | Compatibility                                  |
| ------------------------------ | ------: | ---------------------------------------------- |
| `@codemonster-ru/ui-tokens`    | `1.0.1` | Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0`  |
| `@codemonster-ru/ui-runtime`   | `1.1.0` | Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0`  |
| `@codemonster-ru/ui-css`       | `1.1.0` | Framework-independent CSS; tokens `^1.0.0`     |
| `@codemonster-ru/ui-utilities` | `1.0.1` | Framework-independent CSS; tokens `^1.0.0`     |
| `@codemonster-ru/ui-vue`       | `1.1.0` | Vue `^3.5.0`; supported Node.js line for SSR   |
| `codemonster-ru/ui-razor`      | `1.1.0` | PHP `>=8.2`, Annabel Razor `^2.1`, View `^2.0` |

The packages retain independent semantic versions. The patch releases contain publication metadata
updates; the `1.1.0` packages add public component, style, runtime, or Razor adapter capabilities.

## Install

Install the Vue adapter and shared styles:

```bash
npm install vue@^3.5.0 \
  @codemonster-ru/ui-tokens@^1.0.1 \
  @codemonster-ru/ui-css@^1.1.0 \
  @codemonster-ru/ui-vue@^1.1.0
```

Add progressive enhancement for server-rendered interactive markup when required:

```bash
npm install @codemonster-ru/ui-runtime@^1.1.0
```

The optional utility stylesheet remains a separate package:

```bash
npm install @codemonster-ru/ui-utilities@^1.0.1
```

Install the Annabel Razor adapter, including its integrity-checked token and component CSS assets:

```bash
composer require codemonster-ru/ui-razor:^1.1.0
```

## Highlights

- The supported catalog now contains 37 direct VueForge replacements with shared contracts, Vue
  adapters, Razor adapters, canonical HTML, accessibility evidence, and documented examples.
- Fieldset, IconButton, ProgressBar, and ProgressSpinner are new finite portable components in both
  adapters. Tag is superseded by Badge instead of introducing an overlapping component.
- Existing direct replacements cover the reviewed content, form, controlled-state, keyboard,
  focus, dismissal, server-rendering, selection, pagination, localization, and layout use cases.
- Maintained recipes cover ConfirmDialog, FormLayout, GroupBox, Panel, PageHeader, SkeletonGate,
  AuthLayout, ErrorLayout, and ThemeSwitch without moving application policy into shared packages.
- The representative Vue consumer no longer depends directly on `vueforge-core` or
  `vueforge-layouts`; the Annabel Razor consumer continues to use the same portable contracts.

## Migration

Component names are not a promise of prop, slot, event, or state-ownership compatibility. Use the
[VueForge to CodeMonster UI migration guide](./vueforge-to-codemonster-ui.md) for the exact package
mapping, all 37 direct replacements, maintained recipes, retained products, application-owned
outcomes, and the deterministic codemod workflow.

VueForge releases are not unpublished by this release. Keep VueForge Icons, CodeBlock, and
Playground where their dedicated behavior is still required, and migrate design-system foundations
incrementally using the documented destination for each frozen capability.
