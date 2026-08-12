# VueForge feature baseline

The final VueForge feature baseline was frozen on 2026-08-13 for CodeMonster UI migration item
`CMUI-149`. Its machine-readable source is
[`migration/vueforge-feature-baseline.json`](../migration/vueforge-feature-baseline.json).

| Package                                           | Frozen version | Public export subpaths |
| ------------------------------------------------- | -------------: | ---------------------: |
| `@codemonster-ru/vueforge-theme`                  |          2.0.1 |                      1 |
| `@codemonster-ru/vueforge-icons`                  |          3.2.0 |                      2 |
| `@codemonster-ru/vueforge-core`                   |          2.4.0 |                     99 |
| `@codemonster-ru/vueforge-layouts`                |          2.1.2 |                     40 |
| `@codemonster-ru/vueforge-codeblock`              |          4.0.1 |                      6 |
| `@codemonster-ru/vueforge-playground-core`        |          2.1.0 |                      1 |
| `@codemonster-ru/vueforge-playground-vite-plugin` |          1.0.0 |                      1 |
| `@codemonster-ru/vueforge-playground`             |          3.0.1 |                      6 |

The freeze prevents unreviewed VueForge packages, version changes, and public export-subpath drift.
It does not hash implementation files or prevent security, correctness, accessibility, and
supported-consumer fixes inside the existing public surface. An intentional release or public API
change must update the baseline and explain why it does not add a conflicting legacy feature.

Run the gate with:

```bash
npm run check:vueforge-baseline
```

The package-to-component disposition is deliberately separate and is published by `CMUI-150`.
CodeBlock and Playground ownership are already fixed by their dedicated architecture decisions.
