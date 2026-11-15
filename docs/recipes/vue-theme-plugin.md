# Use the historical Vue theme plugin

The default `VueForgeCore` plugin, its named export, and `createVueForgeCore()` are available from
`@codemonster-ru/ui-vue/historical`. Install the plugin on the Vue app that renders
`VfThemeProvider`, then import the components the app renders. Plugin installation sets app-level
defaults and works during SSR.

```ts
import { createApp } from 'vue';
import { createVueForgeCore } from '@codemonster-ru/ui-vue/historical';
import App from './App.vue';

const app = createApp(App);
app.use(createVueForgeCore(), {
  defaultTheme: 'system',
  themeStorageKey: 'app-theme',
  themeAttribute: 'data-app-theme',
});
app.mount('#app');
```

`VfThemeProvider` props `defaultTheme`, `storageKey`, and `attribute` take precedence over plugin
defaults. On the client the provider reads a stored preference or an authored root theme before
using the default. The provider writes the document's `data-cm-theme` preference and a resolved
`data-vf-theme` value, plus the custom resolved attribute if configured. Multiple Vue apps can
install different options. Apps on the same page share the document-wide CSS theme.

Use `useTheme()` from `@codemonster-ru/ui-vue` for the `theme`, `resolvedTheme`, `setTheme`, and
`toggleTheme` bindings provided by `VfThemeProvider`.

Move legacy `theme` preset or token overrides to a stylesheet loaded after the shared token CSS.
Use the shared `--cm-*` properties under the appropriate theme selector. This example sets the
canvas color for an explicit dark preference.

```css
@import '@codemonster-ru/ui-tokens/tokens.css';

:root[data-cm-theme='dark'] {
  --cm-color-background-canvas: #101525;
}
```

To also override the canvas when `system` resolves to dark, apply the same declaration under
`:root:not([data-cm-theme='light'])` inside a `prefers-color-scheme: dark` media query.

The plugin rejects a legacy `theme` option and points to the stylesheet migration. The current
provider uses the shared theme configuration in the document. Applications that still need the
VueForge preset engine can continue to use their archived `@codemonster-ru/vueforge-core` package.
Browser bundlers can load styles when importing [historical component subpaths](../migrate-from-vueforge.md#component-subpaths).
