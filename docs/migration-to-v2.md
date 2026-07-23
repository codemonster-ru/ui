# Migrating to VueForge 2

VueForge 2 removes the compatibility paths that remained after the primitive and semantic token
architecture shipped. The built-in visual design, OKLCH palette, accessibility behavior, component
set, CommonJS support, and documented custom-prefix support are unchanged.

## Release and platform floors

Upgrade interdependent VueForge packages together.

| Package                                           | VueForge 2 line | Previous line | Runtime floor                 |
| ------------------------------------------------- | --------------- | ------------- | ----------------------------- |
| `@codemonster-ru/vueforge-theme`                  | `2.0.0`         | `1.4.0`       | Node.js `>=18`                |
| `@codemonster-ru/vueforge-icons`                  | `2.0.0`         | `1.6.0`       | Node.js `>=18`, Vue `^3.5.0`  |
| `@codemonster-ru/vueforge-core`                   | `2.0.0`         | `1.36.0`      | Node.js `>=18`, Vue `^3.5.0`  |
| `@codemonster-ru/vueforge-layouts`                | `2.0.0`         | `1.22.0`      | Node.js `>=18`, Core `^2.0.0` |
| `@codemonster-ru/vueforge-codeblock`              | `4.0.0`         | `3.7.0`       | Node.js `>=20`, Vue `^3.5.0`  |
| `@codemonster-ru/vueforge-playground-core`        | `2.0.0`         | `1.2.0`       | Node.js `>=18`                |
| `@codemonster-ru/vueforge-playground-vite-plugin` | `1.0.0`         | `0.2.0`       | Node.js `>=18`, Vite `^6–^8`  |
| `@codemonster-ru/vueforge-playground`             | `3.0.0`         | `2.6.0`       | Node.js `>=20`, Vue `^3.5.0`  |

TypeScript `>=5.8` with `moduleResolution: "Bundler"` or `"NodeNext"` is the supported declaration
resolution path. Package `exports` is authoritative; metadata for resolvers that ignore `exports`
was removed. Supported `require` conditions and CSS-free Node/SSR entries remain available.

## Run the migration checker

The repository includes a dependency-free checker/codemod. It defaults to a read-only check:

```bash
node scripts/migrate-to-v2.mjs src
node scripts/migrate-to-v2.mjs --write src
```

The write mode applies deterministic VueForge CSS-variable and TypeScript API casing renames. It
reports theme-object fields, `data-theme`, package-root imports, removed styling hooks, and other
changes that need semantic judgment instead of guessing. Review each reported theme boundary,
apply the old-to-new mapping below, then run the application test/build suite.

## Theme attributes

`data-vf-theme` is now the only implicit VueForge theme attribute:

```diff
-<html data-theme="dark">
+<html data-vf-theme="dark">
```

Core, Layouts, CodeBlock, Playground, generated static CSS, runtime CSS, and sandbox previews no
longer mirror or observe `data-theme`. A custom attribute explicitly configured through theme
options remains supported and is emitted alongside the engine attribute when required.

## Legacy color roots

The 35 legacy-only CSS variables and matching preset fields were removed. Primitive
`palette*` fields and semantic `colorBackground*`, `colorText*`, `colorIcon*`, `colorBorder*`,
`colorInteractive*`, and `colorStatus*` fields are now the complete color contract.
`colorFocusRing` remains because it is already a canonical semantic token.

Use the closest replacement below, then choose a more specific semantic role when the usage context
requires it.

| VueForge 1 field / CSS suffix | VueForge 2 replacement                    |
| ----------------------------- | ----------------------------------------- |
| `colorBg`                     | `colorBackgroundCanvas`                   |
| `colorSurface`                | `colorBackgroundSurface`                  |
| `colorSurfaceMuted`           | `colorBackgroundSurfaceSubtle`            |
| `colorText`                   | `colorTextPrimary`                        |
| `colorMuted`                  | `colorTextMuted`                          |
| `colorBorder`                 | `colorBorderDefault`                      |
| `colorPrimary`                | `colorInteractivePrimaryBackground`       |
| `colorPrimaryContrast`        | `colorInteractivePrimaryForeground`       |
| `colorPrimarySoft`            | `colorInteractivePrimarySubtleBackground` |
| `colorPrimaryBorderSoft`      | `colorInteractivePrimaryBorder`           |
| `colorSuccess`                | `colorStatusSuccessSolidBackground`       |
| `colorSuccessContrast`        | `colorStatusSuccessSolidForeground`       |
| `colorSuccessSoft`            | `colorStatusSuccessSubtleBackground`      |
| `colorSuccessBorderSoft`      | `colorStatusSuccessBorder`                |
| `colorInfo`                   | `colorStatusInfoSolidBackground`          |
| `colorInfoContrast`           | `colorStatusInfoSolidForeground`          |
| `colorInfoSoft`               | `colorStatusInfoSubtleBackground`         |
| `colorInfoBorderSoft`         | `colorStatusInfoBorder`                   |
| `colorWarn`                   | `colorStatusWarningSolidBackground`       |
| `colorWarnContrast`           | `colorStatusWarningSolidForeground`       |
| `colorWarnSoft`               | `colorStatusWarningSubtleBackground`      |
| `colorWarnBorderSoft`         | `colorStatusWarningBorder`                |
| `colorHelp`                   | `colorStatusHelpSolidBackground`          |
| `colorHelpContrast`           | `colorStatusHelpSolidForeground`          |
| `colorHelpSoft`               | `colorStatusHelpSubtleBackground`         |
| `colorHelpBorderSoft`         | `colorStatusHelpBorder`                   |
| `colorDanger`                 | `colorStatusDangerSolidBackground`        |
| `colorDangerContrast`         | `colorStatusDangerSolidForeground`        |
| `colorDangerSoft`             | `colorStatusDangerSubtleBackground`       |
| `colorDangerBorderSoft`       | `colorStatusDangerBorder`                 |
| `colorContrast`               | `colorBackgroundInverse`                  |
| `colorContrastContrast`       | `colorTextInverse`                        |
| `colorContrastSoft`           | `colorBackgroundInverseSubtle`            |
| `colorContrastBorderSoft`     | `colorBorderInverse`                      |
| `overlayBackdrop`             | `colorBackgroundBackdrop`                 |

For CSS, serialize the field name as before:
`colorBackgroundCanvas` becomes `--vf-color-background-canvas`.

Complete `VfThemeTokens` presets must now provide all primitive and semantic color fields and all
built-in non-color fields. Mode overrides (`dark`, `light`, and `extend`) remain partial. The easiest
migration for a custom preset is to spread `defaultThemePreset.tokens` and override only owned
decisions:

```ts
import { createThemePreset, defaultThemePreset } from '@codemonster-ru/vueforge-core/theme';

export const brandTheme = createThemePreset({
  name: 'brand',
  tokens: {
    ...defaultThemePreset.tokens,
    colorInteractivePrimaryBackground: 'oklch(52% 0.16 250)',
  },
});
```

Component-level tokens that still represent active customization boundaries were not removed.
Custom prefixes also remain supported.

## Removed styling hooks

| Removed field or CSS variable                                    | Migration                                                             |
| ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| `buttonSolidHoverFilter`, `--vf-button-solid-hover-filter`       | Set the relevant semantic hover-background token.                     |
| `buttonSolidActiveFilter`, `--vf-button-solid-active-filter`     | Set the relevant semantic active-background token.                    |
| `shadow`, `--vf-shadow`                                          | Set the component-specific Layouts or CodeBlock shadow variable.      |
| `tableOfContentsTitleColor`                                      | Remove it; `VfTableOfContents` has no title element.                  |
| `--vf-layout-surface-subtle`                                     | Remove it; no Layouts CSS consumed this variable.                     |
| `--vf-codeblock-action-opacity`                                  | Remove it; no CodeBlock CSS consumed this variable.                   |
| `--vf-codeblock-disabled-opacity`                                | Style a disabled wrapper explicitly if an application needs a fade.   |
| `--vf-playground-surface-muted`, `--vf-playground-text-muted`    | Remove them; no Playground CSS consumed them.                         |
| `--vf-playground-run-*`                                          | Remove them; the retired run-control surface no longer consumes them. |
| `--vf-playground-radius-md`                                      | Use the active component-specific radius token.                       |
| `--vf-playground-control-*`                                      | Override the Core control/Tabs tokens used by Playground.             |
| `--vf-playground-focus-ring-width`                               | Use `--vf-focus-ring-width`.                                          |
| `--vf-playground-toolbar-gap`, `--vf-playground-toolbar-padding` | Remove them; no current toolbar rule consumes them.                   |

The built-in values of the removed no-op hooks did not affect rendering, so their removal does not
change the default visual output.

## Public TypeScript and component API

| Old API                                  | VueForge 2 API                                   |
| ---------------------------------------- | ------------------------------------------------ |
| `VueforgePlaygroundVirtualExportMode`    | `VueForgePlaygroundVirtualExportMode`            |
| `VueforgePlaygroundVirtualEntryConfig`   | `VueForgePlaygroundVirtualEntryConfig`           |
| `VueforgePlaygroundVirtualEntryValue`    | `VueForgePlaygroundVirtualEntryValue`            |
| `VueforgePlaygroundVirtualPluginOptions` | `VueForgePlaygroundVirtualPluginOptions`         |
| `SHIKI_LIGHT_THEME`, `SHIKI_DARK_THEME`  | Remove the imports; pass `light` / `dark` mode.  |
| `VueIconify` prop `style="solid"`        | Remove the prop; icons are solid-only.           |
| `dualStyleCoreIconNames`                 | Remove the import; the exported array was empty. |

No deprecated component emit, slot, overload, or additional composable was present. The already
unexported `useSidebarState` source file was removed; applications cannot import it through a
supported package entry.

## Package entry points

Package-root compatibility resolution was removed. Use the exported subpaths:

```diff
-import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock';
+import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock/view';

-import { highlightCodeBlock } from '@codemonster-ru/vueforge-codeblock';
+import { highlightCodeBlock } from '@codemonster-ru/vueforge-codeblock/highlight';

-import { VfPlayground } from '@codemonster-ru/vueforge-playground';
+import { VfPlayground } from '@codemonster-ru/vueforge-playground/ui';

-import { createPlaygroundSession } from '@codemonster-ru/vueforge-playground';
+import { createPlaygroundSession } from '@codemonster-ru/vueforge-playground/runtime';
```

Core, Layouts, Icons, Theme, Playground Core, and the Playground Vite plugin keep their documented
root export. CommonJS consumers must resolve those entries through the `require` condition in
`exports`; no supported CJS entry was removed.

## Recommended verification

After migration:

1. Remove any local `dist` artifacts and perform a clean install.
2. Run TypeScript with `moduleResolution: "Bundler"` or `"NodeNext"`.
3. Build browser and SSR bundles and verify explicit CSS imports.
4. Exercise root and nested light/dark scopes using `data-vf-theme`.
5. Inspect custom presets for every field reported by TypeScript.
6. Run unit, accessibility, and visual regression suites.
