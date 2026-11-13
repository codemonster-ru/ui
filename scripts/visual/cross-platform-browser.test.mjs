import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
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
  // compare-showcase.mjs requires an exact match on referenceCommit between the baseline manifest
  // and the current one. Dropping this from the generated manifest passed every local check --
  // verify never runs the live browser capture -- and only failed in CI, against a real baseline.
  assert.match(capture, /referenceCommit: config\.reference\.commit/u);
  assert.match(fixtureCss, /\.cm-visual-adapter-root \{[^}]*line-height: normal;/su);
});

test('checks both platforms against the reviewed fd baseline in macOS visual CI', () => {
  const workflow = read('../../.github/workflows/ci.yml');
  const baselineDirectory = resolve(import.meta.dirname, '../../visual-baselines/vueforge-cross-platform');
  const baselineManifest = JSON.parse(readFileSync(resolve(baselineDirectory, 'manifest.json'), 'utf8'));
  const screenshots = readdirSync(baselineDirectory).filter((filename) => filename.endsWith('.png'));

  assert.equal(baselineManifest.referenceCommit, 'fd793696f50d3be0fcd3788f0f8f751c63869963');
  assert.deepEqual(baselineManifest.sourceFixture, {
    caseIds: [
      'alert-danger-icon',
      'avatar-label',
      'badge-danger',
      'button-default',
      'card-title',
      'divider-horizontal',
      'link-default',
      'field-help-error',
      'input-enhanced',
      'select-clearable',
      'date-picker-clearable',
      'checkbox-checked',
    ],
    componentPackage: '@codemonster-ru/vueforge-core',
    renderer: 'Vue createApp at the reference commit',
  });
  assert.equal(screenshots.length, 48);
  assert.match(workflow, /runs-on: macos-26/u);
  assert.match(workflow, /visual:cross-platform:serve/u);
  assert.match(workflow, /CM_PARITY_BEHAVIOR=1 node scripts\/visual\/check-vanilla-parity.mjs/u);
  assert.match(workflow, /current="\$\{CROSS_PLATFORM_CAPTURE\}\/vue"/u);
  assert.match(workflow, /current="\$\{CROSS_PLATFORM_CAPTURE\}\/vanilla"/u);
});
