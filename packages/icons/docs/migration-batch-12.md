# Icon Migration Batch 12

Status: approved by the project owner on 2026-08-01.

## Scope

- `arrowTurnUpLeft`, `arrowTurnUpRight`, `arrowTurnRightUp`, and `arrowTurnLeftDown`: normalize the
  legacy 512-unit turn arrows into a mirrored and rotationally related family with one canonical
  quarter-circle bend and the approved directional arrowheads.

The arrows use the canonical 24-unit canvas, 2-unit stroke, round terminals, and round joins. Their
public names and semantics are unchanged. The approved reference set and migration batches 02–11
remain frozen and are not modified by this batch.

## Review route

Open the playground at `/icons` and select `Batch 12 review` to compare the preserved old baseline,
approved geometry, and overlay samples at 16, 20, 24, and 32 px.
