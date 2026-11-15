# Stored component visual baseline renderer

## Capture provenance

The stored component suite contains 48 PNGs from 12 VueForge fixtures in two themes and two
viewports. The manifest names `fd793696f50d3be0fcd3788f0f8f751c63869963`, whose Git tree is
identical to `d9879116`. The baseline refresh published as upstream `98e83624` and appears as
`1969f1f7` in this history. Both commits have the same component baseline tree. The refresh ran
on `macos-26-arm64` image `20260728.0273.1` with macOS 26.5.2 (`25F84`) and Chrome for Testing
`151.0.7922.138`. [Baseline capture job](https://github.com/codemonster-ru/ui/actions/runs/33261680572/job/99124591247)

That refresh built the frozen VueForge packages and captured them with `--font=inject`. The
reference named Inter in its font stack. The capture supplied the bundled Inter WOFF2 faces and
waited for them to load. The earlier refresh in `449d3cee` used the reference's default font
fallback. Its manifest remained unchanged when the later refresh replaced the glyph-bearing
images. [Earlier capture job](https://github.com/codemonster-ru/ui/actions/runs/33246104469)

## Local comparison

Fresh archives of `d9879116`, both refresh versions, and `8cae4010` installed and built offline
on macOS 27.2.1 (`26B131`) with the pinned Chrome version. The refresh workspaces and frozen
reference produced identical `styles.css` files. The original scripts captured all 48 historical
fixtures with the fallback font and again with the recorded Inter injection. The raw fallback
capture differed in 20 image dimensions from the current stored set.

The Inter capture matched every PNG byte-for-byte in both adapters at `8cae4010`, and in the
local captures for the starting commit `49574d25` and preceding `34649ac4` snapshot. Each set
had the same 520 changed pixel positions out of 559,172 at channel threshold 4, affecting 44 of
48 files against the stored set. The text-mask experiment placed all 520 pixels inside glyph
paint. This reproduces the residual with the frozen component code under the local renderer.
The exact difference within the native text-rendering stack remains unresolved.

Capture logs, archived scripts and detailed pixel counts are in
`/private/tmp/cmui-hosted-renderer.SBIdDJ`, including `pixel-normalized-comparison.json`. The
original text-mask evidence is in `/private/tmp/cmui-original-pinned.L9JYfo`.

## Hosted verification

The same stored PNGs passed both 48-frame comparisons at upstream `f51882ea` on November 14, 2026. That hosted job used `macos-26-arm64` image `20261102.0473.1`, macOS 26.7.2 (`25G332`),
and the same Chrome version. GitHub listed no run for the reviewed local `8cae4010` revision.
The restored candidate's hosted result is **UNVERIFIED**. [Passing upstream visual job](https://github.com/codemonster-ru/ui/actions/runs/43601426317/job/132466793156)

To verify the exact candidate, publish an authorized verification ref at its SHA and dispatch
`ci.yml` on that ref. The `visual` job should report that SHA, the runner image, the Chrome version,
and both strict comparisons against the existing stored PNGs. Repository write access is required
to dispatch the workflow. [Manual workflow dispatch](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
