# VueForge Core release supplement

The canonical ecosystem publication process is
[docs/release-checklist.md](../../../docs/release-checklist.md). It defines complete verification,
tarball consumers, topological sequential tags, provenance checks, and rollback. Do not publish Core
with this supplement alone.

Before the Core tag is pushed, additionally confirm:

- [src/index.ts](../src/index.ts), component subpaths, `foundation`, `theme`, and `async` match
  `package.json#exports` and their declarations;
- browser component subpaths retain auto CSS while Node ESM conditions are CSS-free;
- root, foundation, and theme CommonJS entries resolve with their `.d.cts` facades;
- `styles.css`, `foundation.css`, token/theme/base CSS, and every component CSS export exist in the
  tarball;
- runtime/static token parity, canonical CSS names, and full/component entry parity pass;
- a packed `VfButton` consumer remains within the tree-shaking budget;
- SSR IDs, ThemeProvider hydration, overlay ownership, focus trap, and scroll lock tests pass;
- light/dark, reduced-motion, forced-colors, RTL, touch, and 400% zoom smoke checks remain valid;
- [README.md](../README.md), [CHANGELOG.md](../CHANGELOG.md), [foundation-api.md](./foundation-api.md),
  [theme-api.md](./theme-api.md), and [visual-baseline.md](./visual-baseline.md) match the release.

Core `1.36.0` is published only after Theme `1.4.0`, Icons `1.6.0`, Playground Core `1.2.0`, and the
Playground Vite Plugin `0.2.0` have passed their registry smokes. Layouts, CodeBlock, and Playground
follow Core in the canonical sequence.
