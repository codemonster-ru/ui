# Visual baselines

`vueforge-cross-platform` holds the approved rendering of each cross-platform contract case in
`contracts/cross-platform-visual-baselines.json`, in light and dark themes at the mobile and
desktop viewport sizes declared in `contracts/visual.config.json`. Both the Vue and the Annabel
Razor adapter are compared against it, which is what proves the two platforms render the same
component identically rather than merely producing the same DOM.

The capture disables animation and transition rendering. Comparison allows at most four levels per
color channel by default (`--threshold=4`) to absorb non-deterministic browser anti-aliasing. Any
larger channel difference is a visual regression.

Capture a running candidate and compare it with the baseline:

```sh
npm run visual:cross-platform:razor-render -- --output=/tmp/codemonster-razor-fixtures.json
npm run visual:cross-platform:serve -- --razor-fixtures=/tmp/codemonster-razor-fixtures.json --port=5176

npm run visual:cross-platform:capture -- \
  --origin=http://127.0.0.1:5176 \
  --output=/tmp/codemonster-cross-platform \
  --label=codemonster-current

node scripts/visual/compare-showcase.mjs \
  --baseline=visual-baselines/vueforge-cross-platform \
  --current=/tmp/codemonster-cross-platform/vue \
  --diff=/tmp/codemonster-cross-platform-diff \
  --threshold=4
```

Chrome must already be running with remote debugging enabled. The endpoint defaults to
`http://127.0.0.1:9226` and can be overridden with `--chrome=` or `CHROME_REMOTE_ENDPOINT`.

Start that browser fresh for each comparison you intend to trust. Captures are deterministic within
one browser session, but a long-lived one drifts: a session left running through many captures
shifted sub-pixel text rendering on six frames, worth roughly seven hundred pixels, with no change
to the page or its computed styles. Restarting Chrome reproduced the earlier images exactly. CI is
unaffected because it launches the browser per run, so this only bites during local work, and it
makes any local difference below about a thousand pixels unsafe to read as a real change.

Restart the Vite dev server on the same schedule. A server carried through a long editing session
serves module state that no longer matches the working tree: after one such session a capture
reported eight hundred pixels of change across frames the edit could not reach, and the difference
vanished on a restarted server.

The baseline's `manifest.json` records `fd793696f50d3be0fcd3788f0f8f751c63869963` as the commit its
pixels were originally captured from, back when this comparison proved the migration from VueForge
reproduced it exactly. That provenance stays accurate and is kept for the record; the comparison
itself no longer depends on that commit or on anything being checked out from it.
