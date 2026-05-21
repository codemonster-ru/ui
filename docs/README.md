# VueForge Docs (Monorepo Draft)

This folder is the source-of-truth draft for package documentation in this monorepo.

## Packages

- [Core](./core/)
- [Theme](./theme/)
- [Layouts](./layouts/)
- [Icons](./icons/)
- [CodeBlock](./codeblock/)
- [Playground](./playground/)
- [Playground Core](./playground-core/)
- [Playground Vite Plugin](./playground-vite-plugin/)

## Writing Rules

- Document only public API exported from package entrypoints.
- Package docs structure is split by sections:
  - `getting-started.md`
  - `installation.md`
  - `api/index.md`
  - `components/` pages (optional, for UI-component packages; no overview index)
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

- Frontmatter exists on every page: `title`, `description`, `order` (no `slug`).
- Package landing page (if present) contains valid links to section pages.
- `installation.md` includes both install and import snippets.
- `api/index.md` documents only public exports from entrypoints.
- `examples/index.md` includes both `## Basic` and `## Advanced` with `playground-src`.
- `guides/index.md` includes limitations and related packages.
