# Theming

`VfCodeBlock` uses the same semantic color roles as Core and ships a matched pair of VueForge Shiki themes. The editor
background and syntax background are one material in each mode; syntax colors are not borrowed from an unrelated theme.

With `theme="inherit"`, the component resolves the nearest `data-vf-theme` boundary. Explicit
`light` and `dark` values create a local boundary, so nested and scoped themes use the same token
contract as the document root.

## Color tokens

| CSS variable                                | Default role                                    | Purpose                         |
| ------------------------------------------- | ----------------------------------------------- | ------------------------------- |
| `--vf-codeblock-background-color`           | `--vf-color-background-surface-subtle`          | Editor material                 |
| `--vf-codeblock-syntax-background`          | `--vf-codeblock-background-color`               | Shared Shiki/code material      |
| `--vf-codeblock-syntax-foreground`          | matched VueForge Shiki foreground               | Base highlighted-code text      |
| `--vf-codeblock-text-color`                 | `--vf-color-text-primary`                       | Plain-code and fallback text    |
| `--vf-codeblock-border-color`               | `--vf-color-border-default`                     | Component boundary              |
| `--vf-codeblock-meta-color`                 | `--vf-color-text-secondary`                     | Language and metadata           |
| `--vf-codeblock-line-number-color`          | `--vf-color-text-secondary`                     | Line numbers and idle copy icon |
| `--vf-codeblock-action-background-color`    | `--vf-color-background-surface`                 | Copy action surface             |
| `--vf-codeblock-action-border-color`        | `--vf-color-border-interactive`                 | Copy action boundary            |
| `--vf-codeblock-copy-focus-ring-color`      | `--vf-color-focus-ring`                         | Keyboard focus indicator        |
| `--vf-codeblock-selection-background-color` | `--vf-color-background-surface-selected-active` | Selected code background        |
| `--vf-codeblock-selection-text-color`       | `--vf-color-text-primary`                       | Selected code foreground        |

The documented `--vf-codeblock-*` variables are the package customization surface. Color defaults
resolve through canonical semantic roles and keep exact standalone OKLCH fallbacks for installations
that do not include Core. The disabled copy action stays hidden and does not acquire hover/focus
treatment.

Layout, typography, motion, and copy-action variables are declared in
`@codemonster-ru/vueforge-codeblock/tokens.css`. Import `@codemonster-ru/vueforge-codeblock/style.css` for the complete
component styling, or import `@codemonster-ru/vueforge-codeblock/tokens.css` and
`@codemonster-ru/vueforge-codeblock/codeblock.css` explicitly.

## Syntax roles

The built-in `vueforge-light` and `vueforge-dark` Shiki registrations map syntax roles to semantic CSS variables with
OKLCH fallbacks. Base text, comments, strings, constants, keywords, parameters, functions, string expressions,
punctuation, inserted text, deleted text, and ANSI colors therefore resolve inside the active VueForge scope.

The base CSS hook is `--vf-codeblock-syntax-foreground`. Token hooks are
`--vf-codeblock-syntax-token-comment`, `-string`, `-constant`, `-keyword`, `-parameter`, `-function`,
`-string-expression`, `-punctuation`, `-link`, `-inserted`, `-deleted`, and `-changed`, plus the corresponding
`--vf-codeblock-syntax-ansi-*` variables. The built-in `diff` language uses the inserted/deleted
roles. The package does not expose an API for whole-line highlights or separate diff-line
backgrounds; those remain a documented limitation.

Normal code targets at least `4.5:1` against the code background. CI pins every Shiki-to-semantic adapter and validates
both the standalone fallback values and the resolved default Core semantic roles. Selection text and background are
validated at `4.5:1`, and the selection material is also required to remain at least `1.5:1` apart from the adjacent editor
surface. Consumers that replace individual syntax variables are responsible for preserving those pairings.

## Runtime overrides

Use plugin `themeVars` or `setCodeBlockThemeVars()` for scoped runtime overrides:

```ts
app.use(VueForgeCodeBlock, {
  themeScope: '#docs-content',
  themeVars: {
    light: {
      '--vf-codeblock-syntax-background': 'var(--brand-code-surface)',
    },
    dark: {
      '--vf-codeblock-syntax-background': 'var(--brand-code-surface-dark)',
    },
  },
});
```

`--vf-codeblock-background-color` is canonical: changing it also changes the syntax and code surfaces.
If `--vf-codeblock-syntax-background` or `--vf-codeblock-code-background-color` is overridden separately, keep all three
aligned; an independent outer or code background can reintroduce an incompatible Shiki/editor pairing.

## Styling hooks

| Class                        | Purpose                      |
| ---------------------------- | ---------------------------- |
| `.vf-codeblock`              | Component boundary           |
| `.vf-codeblock__header`      | Filename/language header     |
| `.vf-codeblock__code-shell`  | Scrollable code region       |
| `.vf-codeblock__copy`        | Copy action and focus target |
| `.vf-codeblock__line`        | Rendered code line           |
| `.vf-codeblock__line-number` | Optional line number         |
