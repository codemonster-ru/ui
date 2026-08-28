import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const read = (path) => readFileSync(resolve(import.meta.dirname, path), 'utf8');

test('captures the showcase and state baselines from the frozen reference commit', () => {
  const workflow = read('../../.github/workflows/refresh-visual-baselines.yml');

  // A baseline captured from the working tree would compare the product against itself and
  // silently hide every difference from the reviewed VueForge reference.
  assert.match(workflow, /fetch-depth: 0/u);
  assert.match(workflow, /require\('\.\/contracts\/visual\.config\.json'\)\.reference\.commit/u);
  assert.match(workflow, /git worktree add --detach "\$\{RUNNER_TEMP\}\/vueforge-reference" "\$\{reference_commit\}"/u);
  assert.match(
    workflow,
    /\(cd "\$\{RUNNER_TEMP\}\/vueforge-reference" && npm run dev -w @codemonster-ru\/vueforge-playground-example -- --host 127\.0\.0\.1 --port 5175\)/u,
  );

  const captureLines = workflow
    .split('\n')
    .filter((line) => line.includes('capture-showcase.mjs') || line.includes('states:capture'));
  assert.equal(captureLines.length, 2);
  for (const line of captureLines) {
    assert.match(line, /--origin=http:\/\/127\.0\.0\.1:5175/u);
  }
});

test('probes showcase readiness in a way both application shells satisfy', () => {
  const capture = read('capture-showcase.mjs');

  // The reference commit renders VfAppShell; the current showcase renders a native shell. Probing
  // the application root instead of route content lets a short page height drop trailing tiles.
  assert.match(capture, /const showcaseContentReady =\s/u);
  assert.match(capture, /document\.querySelector\("\.demo-page"\)\?\.children\.length > 0/u);
  assert.doesNotMatch(capture, /querySelector\("\.showcase-shell__content-body"\)/u);
  assert.match(capture, /\[data-showcase-loading-content=ready\] \.vf-codeblock, \.vf-codeblock/u);
  assert.match(capture, /\[data-showcase-loading-content=ready\] \.vf-playground, \.vf-playground/u);
});
