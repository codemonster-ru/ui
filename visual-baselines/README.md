# Visual baselines

`vueforge-showcase` is the immutable browser reference captured from commit
`fd793696f50d3be0fcd3788f0f8f751c63869963`. It contains the Core, Colors, Layouts, Icons,
CodeBlock, and Playground routes in light and dark themes at the mobile and desktop viewport sizes
declared in `contracts/visual.config.json`.

The capture disables animation and transition rendering. The two randomized progress examples are
normalized to 50% by `scripts/visual/capture-showcase.mjs`; application source is not modified.
Comparison allows at most two levels per color channel by default (`--threshold=2`) to absorb
non-deterministic browser anti-aliasing. Any larger channel difference is a visual regression; the
M12 gate does not allow a changed-pixel ratio above zero after that threshold is applied.

Capture a running candidate and compare it with the reference:

```sh
npm run visual:showcase:capture -- \
  --origin=http://127.0.0.1:5175 \
  --output=/tmp/codemonster-showcase \
  --label=codemonster-current

npm run visual:showcase:compare -- \
  --baseline=visual-baselines/vueforge-showcase \
  --current=/tmp/codemonster-showcase \
  --diff=/tmp/codemonster-showcase-diff
```

Chrome must already be running with remote debugging enabled. The endpoint defaults to
`http://127.0.0.1:9226` and can be overridden with `--chrome=` or `CHROME_REMOTE_ENDPOINT`.
