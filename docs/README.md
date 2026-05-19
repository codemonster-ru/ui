# VueForge Docs (Monorepo Draft)

This folder is the source-of-truth draft for package documentation in this monorepo.

## Packages

- [Core](./core/index.md)
- [Theme](./theme/index.md)
- [Layouts](./layouts/index.md)
- [Icons](./icons/index.md)
- [CodeBlock](./codeblock/index.md)
- [Playground](./playground/index.md)
- [Playground Core](./playground-core/index.md)
- [Playground Vite Plugin](./playground-vite-plugin/index.md)

## Writing Rules

- Document only public API exported from package entrypoints.
- Package docs structure is split by sections:
  - `getting-started/introduction.md`
  - `installation/index.md`
  - `api/index.md`
  - `components/index.md` (optional, for UI-component packages)
  - `examples/index.md`
  - `guides/index.md`
- Prefer short executable examples over abstract prose.
- Keep package pages independent, with explicit cross-links for related packages.

## Workflow

1. Confirm API from `src/index.ts` and `package.json`.
2. Fill package page sections.
3. Add at least 2 examples per package (basic and advanced).
4. Add migration notes if a breaking change appears.

## Ready For Publish Checklist

- Frontmatter exists on every page: `title`, `description`, `slug`, `order`.
- Package index contains valid links to section pages.
- `installation/index.md` includes both install and import snippets.
- `api/index.md` documents only public exports from entrypoints.
- `examples/index.md` includes both `## Basic` and `## Advanced` with `playground-src`.
- `guides/index.md` includes limitations and related packages.
