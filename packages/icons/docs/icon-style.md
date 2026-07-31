# Icon Style Guide

The authoritative geometry and review specification is
[`icon-design-language.md`](./icon-design-language.md).

VueForge Icons are moving from the legacy 512-unit solid catalog to the 24-unit outline language in
reviewed batches. `solid` remains a supported catalog value for untouched legacy icons; `outline`
identifies redesigned or newly authored icons. Do not convert unreviewed icons merely to make the
metadata uniform.

## Working rules

- Preserve public names, semantics, accessibility, and `VueIconify` behavior.
- Author new geometry on `0 0 24 24` with the shared 2-unit round stroke.
- Reuse canonical primitives from the design-language document.
- Never copy third-party SVG paths.
- Inspect 16, 20, 24, and 32 px, then compare family neighbors and real SaaS contexts.
- Run `npm run audit:icons`, `npm run validate-icons`, and the package test/build commands.
- Treat metric warnings as review candidates, not aesthetic verdicts.

The first approved geometry batch and its self-review are documented in
[`redesign-reference-set.md`](./redesign-reference-set.md).
