# Icon Migration Batch 29

Status: approved by the project owner on 2026-08-02.

## Scope

- Preserve `github`, `telegram`, `vk`, `x`, `youtube`, `facebook`, and `instagram` as independent
  fill-based brand marks.
- Keep their existing component geometry, public names, 24×24 view boxes, and `solid` catalog
  classification unchanged.
- Exclude them from the VueForge stroke-2 outline grammar and from optical-offset normalization.

This batch closes the catalog migration without redrawing third-party trademarks. The 109 approved
VueForge product icons use the shared outline language; these seven marks continue to follow their
owners' independent visual identities.

The exact pre-review SVG for every mark is stored in `src/lib/iconMigrationBatch29Before.json`.
Validation compares current components with that baseline and fails if their geometry changes.

Official brand resources consulted for the preservation decision include the
[GitHub Brand Toolkit](https://brand.github.com/), [X Brand Toolkit](https://about.x.com/en/who-we-are/brand-toolkit),
[Telegram press resources](https://telegram.org/press),
[YouTube Brand Resources](https://www.youtube.com/howyoutubeworks/resources/brand-resources/), and
[Meta Brand Resources](https://about.meta.com/brand/resources/).

## Review route

Open the playground at `/icons` and select `Batch 29 review`. At 16, 20, 24, and 32 px, old and
current renders should be visually identical; overlays should show no displacement or geometry
change.
