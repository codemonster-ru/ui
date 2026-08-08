# Icon Style Guide

The authoritative geometry and review specification is
[`icon-design-language.md`](./icon-design-language.md).

The catalog migration is complete. The 109 VueForge product icons use the 24-unit outline language;
the seven independent brand marks remain solid to preserve their official geometry. The `style`
catalog field describes geometry and does not select a runtime variant.

## Working rules

- Preserve public names, semantics, accessibility, and `VueIconify` behavior.
- Author new geometry on `0 0 24 24` with the shared 2-unit round stroke.
- Reuse canonical primitives from the design-language document.
- Build Duotone from an authored secondary mass or semantic subpart plus primary contours and details;
  never split or fade an arbitrary section of a Classic stroke.
- Let Regular, Light, and Thin control the primary contour/detail weight while keeping the secondary
  mass visually stable.
- Use primary-only rendering for indivisible Solid marks rather than reducing the opacity of the whole symbol.
- Never copy third-party SVG paths.
- Inspect 16, 20, 24, and 32 px, then compare family neighbors and real SaaS contexts.
- Run `npm run audit:icons`, `npm run validate-icons`, and the package test/build commands.
- Treat metric warnings as review candidates, not aesthetic verdicts.

The first approved geometry batch and its self-review are documented in
[`redesign-reference-set.md`](./redesign-reference-set.md).
