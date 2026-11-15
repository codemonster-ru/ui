# Migrate from VueForge

This guide starts from VueForge commit `d9879116` and targets the CodeMonster UI `2.0.0-dev.0`
workspace. Build and install matching workspace tarballs to try these examples in another app.
[Build and verify a packed Vue consumer](../packages/vue/README.md#installation).

Migrate one page or component group at a time. Keep the archived packages pinned for pages that
still depend on their entries or theme engine. The restored Vue names cover specific contracts.
Review the behavior and visual differences for each component you move. [Vue contract trace](./verification/historical-vue-core.md) · [Layout and icon trace](./verification/historical-vue-ecosystem.md).

## Package and stylesheet entries

All package names in the table use the `@codemonster-ru` scope.

| VueForge at `d9879116`                                                                                 | CodeMonster UI entry or retained package                                                                                                              |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vueforge-core@2.4.0`                                                                                  | Use named components from `ui-vue` or `ui-vue/historical`. Component subpaths are available under `ui-vue/historical/`.                               |
| `vueforge-layouts@2.1.2`                                                                               | Use `ui-layouts` for shells, page layouts, semantic regions, and layout breakpoints. Component subpaths are available under `ui-layouts/historical/`. |
| `vueforge-icons@3.2.0`                                                                                 | Use named geometry from `ui-icons` with `CmIcon`. Use `VueIconify` from `ui-vue/historical` for name strings and `ui-icons/catalog` for metadata.     |
| `vueforge-theme@2.0.1`                                                                                 | Use the shared CSS and typed token APIs from `ui-tokens`. Vue providers and the Vanilla theme controller own preference state.                        |
| `vueforge-codeblock@4.0.1`                                                                             | Keep the archived Vue CodeBlock package for source highlighting. The Vanilla code block recipe presents authored code with optional copying.          |
| `vueforge-playground@3.0.1`, `vueforge-playground-core@2.1.0`, `vueforge-playground-vite-plugin@1.0.0` | Keep the archived packages for Vue previews and Vite integration. The Vanilla playground previews authored HTML, CSS, and JavaScript.                 |

For root or aggregate imports, replace the old `vueforge-core/styles.css` and
`vueforge-layouts/styles.css` imports with the shared stack in the application entry.

```ts
import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-css/fonts.css';
import '@codemonster-ru/ui-css/styles.css';
```

For a smaller stylesheet, use `@codemonster-ru/ui-css/foundation.css` and the component CSS
entries you use, such as `@codemonster-ru/ui-css/button.css`. The old layout breakpoint stylesheet
maps to `@codemonster-ru/ui-tokens/breakpoints.css`. Node CommonJS applications can `require()`
`ui-vue`, `ui-vue/historical`, and `ui-layouts` on the supported Node versions. These entries
load the same server-safe modules as ESM imports. The engine requirement is newer than the old
VueForge Node 18 requirement. The archived Icons, CodeBlock, and Playground entries retain their
own package and stylesheet contracts. [Shared CSS entries](./css/getting-started.md#public-entries).

Update application selectors and overrides to the shared `.cm-*` and `--cm-*` names even when a Vue
component still uses a `Vf*` name. Check the component's canonical HTML for selectors and state
attributes. [Canonical HTML catalog](../contracts/README.md).

### Component subpaths

Add `historical/` before the old component slug when changing package names. This covers the
45 Core component subpaths, `async`, and all 17 Layouts component subpaths at `d9879116`.
Vue keeps the named exports. Layouts keeps the default and named exports.

```ts
import { VfButton } from '@codemonster-ru/ui-vue/historical/button';
import { VfDataTable } from '@codemonster-ru/ui-vue/historical/data-table';
import VfContainer from '@codemonster-ru/ui-layouts/historical/container';
```

Browser bundlers that select the `browser` condition load shared tokens, fonts, and foundation,
plus the styles for the imported components and their built-in controls. Use this approach for
browser builds with automatic styles, or use the explicit stack above for app-wide CSS. Import
styles for any additional components authored in slots. For Node SSR, the same deep imports
load CSS-free modules. Serve the client build's CSS alongside the server-rendered HTML.

Use the current packages for foundation and theme APIs. For local design tokens use `ui-tokens`.
The Vue theme provider and breakpoint alternatives are described below.

## Vue components and composables

Use the `Cm*` components for new templates. Some restored names, including `VfButton`, `VfField`, and
`VfTabs`, are also on the root entry. Use `ui-vue/historical` for entries such as `VfAccordion`,
`VfDatePicker`, `VfDrawer`, `VfDataTable`, and `VueIconify`. Shells and regions such as `CmAppShell`,
`VfAppShell`, and `VfContentArea` come from `ui-layouts`. [Vue and layout export inventories](./verification/historical-vue-core.md).

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CmButton, VfField } from '@codemonster-ru/ui-vue';
import { VfDatePicker } from '@codemonster-ru/ui-vue/historical';

const releaseDate = ref('');
</script>

<template>
  <VfField v-slot="{ controlId }" label="Release date" label-placement="floating">
    <VfDatePicker :id="controlId" v-model="releaseDate" locale="en-US" clearable />
  </VfField>
  <CmButton>Save release</CmButton>
</template>
```

- Theme consumers can import `useTheme` or `useCmTheme` from `ui-vue`. Both use the nearest theme
  provider. [Theme provider and switch](./components/forms.md#themeswitch-api).
- Import `useDisclosure`, `useId`, `useTableOfContents`, `useClickOutside`, `useEscapeKey`,
  `useFloating`, `useFocusTrap`, and `useScrollLock` from `ui-vue/historical`. The host owns focus
  and dismissal for its own overlays. [Document events](./recipes/vue-document-events.md) · [Floating positioning](./recipes/vue-floating.md) · [Focus trap](./recipes/vue-focus-trap.md).
- `useBreakpoint`, `useBreakpoints`, and `useBreakpointValue` are available from
  `ui-vue/historical` and `ui-layouts`. The hooks use the shared numeric viewport thresholds.
  `useCssVarBreakpoints` from `ui-layouts` reads CSS property overrides. [Breakpoint composables](./recipes/vue-breakpoints.md).

## Theme presets and preference

Port application overrides to the matching `--cm-*` tokens under `:root` or a theme selector.
Load override styles after the tokens. For generated styles, `ui-tokens` exposes immutable light
and dark preset data and `serializeCmThemeTokensToCssVars`. [Token overrides and serialization](./tokens/getting-started.md).

Use `CmThemeProvider` for the `cm-theme` cookie. In SSR, read the cookie and write `data-cm-theme`
before the first paint. The `system` mode follows the browser's color preference through CSS.
`VfThemeProvider` defaults to the old `vf-theme` local storage key and mirrors the resolved theme
to `data-vf-theme`. Both providers publish the selected mode to `data-cm-theme`. Use one provider
to own the document theme. [Provider migration details](./components/forms.md#themeswitch-api).

Import `VueForgeCore` as a default or named export from `ui-vue/historical`, or call
`createVueForgeCore()` to make a plugin instance. Install it to supply app-level `defaultTheme`,
`themeStorageKey`, and `themeAttribute` defaults to `VfThemeProvider`. Explicit provider props take
precedence. Move the old `theme` option to stylesheet overrides or keep the archived package for
its runtime preset engine. [Theme plugin recipe](./recipes/vue-theme-plugin.md).

The current layout entry supports named imports and Node `require()`. Keep the archived layouts package if you still
use `app.use(VueForgeLayouts)` or its layout preset configuration. [Archived layout consumer](../packages/layouts/README.md#documentation).

## Standalone Vanilla pages

Render canonical HTML in your server template, including stable IDs and initial state. Load the
same tokens and CSS as Vue. Add `ui-runtime` and register the required controllers for interactive
markup that the server renders. For example, register `createCmAccordionController` under
`accordion`. On a mixed page, let Vue own its components and start the runtime in the Vanilla region.
[Vanilla package and browser setup](./vanilla.md).

Run `npm run build:vanilla` and serve `examples/vanilla/dist` over HTTP. Keep the `tokens` and `css`
asset directories intact so their relative imports resolve. Open `index.html` for the standalone
catalog, `code-block-example.html` for semantic code with optional copying, or
`playground-example.html` for an editable sandboxed preview. [Code block recipe](./recipes/code-block.md) · [Playground recipe](./recipes/playground.md).
