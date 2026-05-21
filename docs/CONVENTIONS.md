# Documentation Conventions

## Purpose

This file defines stable conventions for package docs in this repository.

## Directory Structure

Package docs are organized as:

`docs/<package>/...`

Recommended sections:

- `getting-started.md`
- `installation.md`
- `api/index.md`
- `components/index.md` and component pages
- `guides/index.md`

For non-UI packages, `components/` may be omitted.

## Frontmatter

Each page should include:

- `title`
- `description`
- `order`

Rules:

- `slug` must not be used in `docs/<package>/**/*.md`.
- `order` must be numeric and used for navigation sorting.
- Keep `title` and first `# Heading` aligned.

## Components Pages

Use a consistent section order:

1. `# ComponentName`
2. `## Summary`
3. `## Import`
4. `## Key Props`
5. `## Emits` (if applicable)
6. `## Slots` (if applicable)
7. `## Notes` (optional)
8. `## Usage`

Rules:

- Do not use `## Example`; use `## Usage`.
- Avoid placeholder text like `Refer to package-level API docs...`.
- Examples must be runnable and include required props.

## Interactive Example Format

Use `playground-src` blocks for interactive rendering:

Example structure:

- Fence header: ````playground-src`
- Metadata lines: `mode`, `framework`, `height`, `entry`
- Source block: ````vue file=/App.vue` with template and script
- Closing fence: `````

Guidelines:

- Use realistic scenarios, not empty component tags.
- Keep examples short and focused.
- Prefer explicit imports in every snippet.

## API, Installation, Guides Pages

Use consistent top-level sections:

- `installation.md`: `Overview`, `Install`, `Import`
- `api/index.md`: `Overview` + package-specific API sections
- `guides/index.md`: `Overview`, practical patterns, `Limitations`, `Related Packages`

## Index Pages

For `components/index.md`:

- Include all component pages in that package.
- Keep link order aligned with each page `order` value.
- Use relative links (`./vf-*.md`).

## Quality Checks

Before finalizing changes:

1. Run: `npx markdownlint-cli2 "docs/**/*.md"`
2. Ensure no placeholder or TODO text remains.
3. Ensure all new component pages include a valid `playground-src` example.
