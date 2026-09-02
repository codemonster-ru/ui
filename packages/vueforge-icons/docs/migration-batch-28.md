# Icon Migration Batch 28

Status: approved by the project owner on 2026-08-02.

## Scope

- `globe`: replace the masked solid grid with a canonical circle, one meridian, a central axis,
  and a clear equator.
- `layers`: replace the solid stack with three equal-width rhombic outline levels on a shared
  vertical rhythm.

Both icons use the canonical 24-unit canvas, 2-unit stroke, round terminals, and round joins.
Their public names and semantics are unchanged. The approved reference set and migration batches
02–27 remain frozen and are not modified by this batch.

The legacy SVG for both candidates was captured before component or geometry changes in
`src/lib/iconMigrationBatch28Before.json`. No optical offsets are used by these icons; their
placement is resolved in source geometry.

## Review route

Open the playground at `/icons` and select `Batch 28 review` to compare the preserved old baseline,
candidate geometry, and overlay samples at 16, 20, 24, and 32 px.
