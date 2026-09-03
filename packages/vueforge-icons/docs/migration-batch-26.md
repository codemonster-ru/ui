# Icon Migration Batch 26

Status: approved by the project owner on 2026-08-02.

## Scope

- `cpu`: replace the masked solid chip with a rounded outline frame, compact core, and eight
  symmetric contacts.
- `plug`: replace the off-center solid plug with a centered outline body, two equal prongs, and a
  short cable stem.

Both icons use the canonical 24-unit canvas, 2-unit stroke, round terminals, and round joins.
Their public names and semantics are unchanged. The approved reference set and migration batches
02–25 remain frozen and are not modified by this batch.

The legacy SVG for both candidates was captured before component or geometry changes in
`src/lib/iconMigrationBatch26Before.json`. No optical offsets are used by these icons; their
placement is resolved in source geometry.

## Review route

Open the playground at `/icons` and select `Batch 26 review` to compare the preserved old baseline,
candidate geometry, and overlay samples at 16, 20, 24, and 32 px.
