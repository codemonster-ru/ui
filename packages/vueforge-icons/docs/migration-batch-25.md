# Icon Migration Batch 25

Status: approved by the project owner on 2026-08-02.

## Scope

- `share`: replace the mixed solid-and-stroke symbol with three equal outlined nodes and two clear
  connections.
- `send`: replace the dense solid plane with a broad outlined paper plane and one readable fold.
- `phone`: replace the solid handset with one continuous outlined call contour.

All three icons use the canonical 24-unit canvas, 2-unit stroke, round terminals, and round
joins. Their public names and semantics are unchanged. The approved reference set and migration
batches 02–24 remain frozen and are not modified by this batch.

The legacy SVG for every candidate was captured before component or geometry changes in
`src/lib/iconMigrationBatch25Before.json`. No optical offsets are used by these icons; their
placement is resolved in source geometry.

## Review route

Open the playground at `/icons` and select `Batch 25 review` to compare the preserved old baseline,
candidate geometry, and overlay samples at 16, 20, 24, and 32 px.
