# Icon Migration Batch 27

Status: approved by the project owner on 2026-08-02.

## Scope

- `activity`: replace the bottom-heavy solid waveform with one centered continuous monitoring
  pulse.
- `sparkles`: replace the solid starbursts with one dominant and one supporting soft outline
  sparkle.

Both icons use the canonical 24-unit canvas, 2-unit stroke, round terminals, and round joins.
Their public names and semantics are unchanged. The approved reference set and migration batches
02–26 remain frozen and are not modified by this batch.

The legacy SVG for both candidates was captured before component or geometry changes in
`src/lib/iconMigrationBatch27Before.json`. No optical offsets are used by these icons; their
placement is resolved in source geometry.

## Review route

Open the playground at `/icons` and select `Batch 27 review` to compare the preserved old baseline,
candidate geometry, and overlay samples at 16, 20, 24, and 32 px.
