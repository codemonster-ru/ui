import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const read = (path) => readFileSync(resolve(import.meta.dirname, path), 'utf8');

test('mounts the Vue component and enhances canonical HTML with the Vanilla runtime', () => {
  const vueFixture = read('cross-platform-fixture/main.ts');
  const server = read('serve-cross-platform-cases.mjs');

  assert.match(vueFixture, /import \* as UiVue from '@codemonster-ru\/ui-vue';/u);
  assert.match(vueFixture, /import\.meta\.glob/u);
  assert.match(vueFixture, /createApp\(/u);
  assert.match(vueFixture, /\.mount\(root\)/u);
  assert.match(vueFixture, /componentCase\.props/u);
  assert.match(vueFixture, /componentCase\.slots/u);
  assert.match(vueFixture, /createStaticVNode/u);
  assert.match(server, /response.end\(componentCase.canonicalHtml\)/u);
  assert.match(vueFixture, /createRuntime\(\).start\(root\)/u);
  assert.doesNotMatch(vueFixture, /canonicalHtml|default\.html/u);
});

test('keeps one baseline filename matrix for both current platforms', () => {
  const capture = read('capture-cross-platform-cases.mjs');
  const fixtureCss = read('cross-platform-fixture/fixture.css');

  assert.match(capture, /const platforms = \['vue', 'vanilla'\];/u);
  assert.match(capture, /\$\{caseId\}--\$\{theme\.name\}--\$\{viewport\.name\}\.png/u);
  assert.match(capture, /routes: caseIds/u);
  // The standalone comparison requires the same reference commit in both capture manifests.
  assert.match(capture, /referenceCommit: config\.reference\.commit/u);
  assert.match(fixtureCss, /\.cm-visual-adapter-root \{[^}]*line-height: normal;/su);
});

test('compares adapter rendering and behavior in macOS visual CI', () => {
  const workflow = read('../../.github/workflows/ci.yml');

  assert.match(workflow, /runs-on: macos-26/u);
  assert.match(workflow, /visual:cross-platform:serve/u);
  assert.match(workflow, /CM_PARITY_REPORT="[^"]+" node scripts\/visual\/check-vanilla-parity.mjs/u);
  assert.match(workflow, /CM_PARITY_BEHAVIOR=1 node scripts\/visual\/check-vanilla-parity.mjs/u);
  assert.doesNotMatch(workflow, /compare-showcase\.mjs|visual:cross-platform:capture/u);
});
