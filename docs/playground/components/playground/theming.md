# Theming

`VfPlayground` consumes Core semantic roles through its existing `--vf-playground-*` customization tokens. Its toolbar,
tabs, console, CodeBlock, and preview sandbox resolve the same light or dark decision.

With `theme="inherit"`, the component observes the nearest `data-theme` or `data-vf-theme` boundary. Explicit `light` and
`dark` values create a local boundary. The effective mode is exposed as `data-vf-resolved-theme`.

## Color tokens

| CSS variable                        | Default role                             | Purpose                  |
| ----------------------------------- | ---------------------------------------- | ------------------------ |
| `--vf-playground-surface`           | `--vf-color-background-surface`          | Component surface        |
| `--vf-playground-surface-muted`     | `--vf-color-background-surface-subtle`   | Retained 1.x alias       |
| `--vf-playground-border`            | `--vf-color-border-default`              | Component boundary       |
| `--vf-playground-text`              | `--vf-color-text-primary`                | Primary text             |
| `--vf-playground-text-muted`        | `--vf-color-text-secondary`              | Retained 1.x alias       |
| `--vf-playground-tab-bg`            | `--vf-color-background-surface-subtle`   | Inactive tab surface     |
| `--vf-playground-tab-active-bg`     | `--vf-color-background-surface-selected` | Active tab surface       |
| `--vf-playground-tab-active-text`   | `--vf-color-selected-foreground`         | Active tab text          |
| `--vf-playground-tab-active-border` | `--vf-color-border-focus`                | Active tab indicator     |
| `--vf-playground-console-bg`        | `--vf-color-background-surface-subtle`   | Console surface          |
| `--vf-playground-console-text`      | `--vf-color-text-primary`                | Console text             |
| `--vf-playground-iframe-bg`         | `--vf-color-background-canvas`           | Preview canvas           |
| `--vf-playground-focus-ring-color`  | `--vf-color-focus-ring`                  | Keyboard focus indicator |

The existing Playground variables remain the VueForge 1.x override surface. Their defaults are semantic-first and keep
legacy fallbacks for presets that do not yet define the additive color contract.

The built-in file tabs consume `--vf-playground-focus-ring-color` through `VfTabs`. The declared
`--vf-playground-surface-muted` and `--vf-playground-text-muted` variables remain compatibility aliases, but the current
built-in renderer uses the narrower tab, console, and CodeBlock hooks instead; overriding either alias alone has no
rendered effect.

## Sandbox theme synchronization

Sandbox previews receive the resolved mode and the transitive closure of CSS custom properties used by the active theme.
This includes aliases whose names use a custom prefix rather than `--vf-*`. The same payload is used for direct iframe
access and the message bridge, so runtime, scoped-theme, and cross-origin-capable paths do not diverge.

For a custom prefix, generate the theme through the VueForge runtime or static builder. The canonical compatibility bridge
must remain available because package CSS intentionally keeps `--vf-*` component variables.

```ts
app.use(VueForgeCore, {
  theme: {
    preset: brandPreset,
    options: {
      prefix: 'brand',
    },
  },
});
```

## CodeBlock integration

The source panel delegates syntax rendering to `VfCodeBlock`. Playground maps its CodeBlock border, radius, header, and
height variables without replacing the VueForge Shiki color pair. Override CodeBlock syntax colors through the
`--vf-codeblock-*` surface documented in the CodeBlock theming guide.

## Styling hooks

| Class                               | Purpose                                      |
| ----------------------------------- | -------------------------------------------- |
| `.vf-playground`                    | Component and scoped-theme boundary          |
| `.vf-playground__tabs`              | Tabs region supplied through the `tabs` slot |
| `.vf-playground__tabs-default`      | Built-in file tabs region                    |
| `.vf-playground__files`             | Source-file panel                            |
| `.vf-playground__panel--code`       | Code source panel                            |
| `.vf-playground__iframe`            | Sandbox preview frame                        |
| `.vf-playground__component-preview` | Inline component preview surface             |
| `.vf-playground__console`           | Runtime messages                             |
