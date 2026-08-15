import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const read = (path) => readFileSync(resolve(import.meta.dirname, path), 'utf8');

test('uses executable Vue and Annabel Razor Button adapters instead of canonical HTML aliases', () => {
  const vueFixture = read('cross-platform-button/main.ts');
  const razorRenderer = read('render-cross-platform-button.php');

  assert.match(vueFixture, /import \{ CmButton \} from '@codemonster-ru\/ui-vue';/u);
  assert.match(vueFixture, /createApp\(/u);
  assert.match(vueFixture, /\.mount\(root\)/u);
  assert.match(vueFixture, /buttonDefaultCase\.props/u);
  assert.match(vueFixture, /buttonDefaultCase\.slots\.default/u);
  assert.match(razorRenderer, /new UiComponentProvider\(\)/u);
  assert.match(razorRenderer, /new ComponentRenderContext\(/u);
  assert.match(razorRenderer, /->render\(/u);
  assert.doesNotMatch(vueFixture, /canonicalHtml|default\.html/u);
  assert.doesNotMatch(razorRenderer, /canonicalHtml|default\.html/u);
});

test('fails clearly when local PHP or Composer dependencies are unavailable', () => {
  const wrapper = read('render-cross-platform-button.mjs');

  assert.match(wrapper, /PHP is unavailable/u);
  assert.match(wrapper, /Razor Composer dependencies are unavailable/u);
  assert.match(wrapper, /Razor visual output was not generated/u);
});

test('keeps one frozen baseline filename matrix for both current platforms', () => {
  const capture = read('capture-cross-platform-button.mjs');

  assert.match(capture, /platforms = source === 'vueforge' \? \['reference'\] : \['vue', 'razor'\]/u);
  assert.match(capture, /button-default--\$\{theme\.name\}--\$\{viewport\.name\}\.png/u);
  assert.match(capture, /routes: \['button-default'\]/u);
  assert.match(capture, /component: '@codemonster-ru\/vueforge-core\/VfButton'/u);
  assert.match(capture, /renderer: 'Vue createApp at the reference commit'/u);
  assert.match(capture, /slots: \{ default: 'Save' \}/u);
});

test('checks both actual adapters against the reviewed fd baseline in macOS visual CI', () => {
  const workflow = read('../../.github/workflows/ci.yml');
  const baselineDirectory = resolve(import.meta.dirname, '../../visual-baselines/vueforge-button-default');
  const baselineManifest = JSON.parse(readFileSync(resolve(baselineDirectory, 'manifest.json'), 'utf8'));
  const screenshots = readdirSync(baselineDirectory).filter((filename) => filename.endsWith('.png'));

  assert.equal(baselineManifest.referenceCommit, 'fd793696f50d3be0fcd3788f0f8f751c63869963');
  assert.deepEqual(baselineManifest.sourceFixture, {
    component: '@codemonster-ru/vueforge-core/VfButton',
    props: {},
    renderer: 'Vue createApp at the reference commit',
    slots: { default: 'Save' },
  });
  assert.equal(screenshots.length, 4);
  assert.match(workflow, /runs-on: macos-15/u);
  assert.match(workflow, /visual:cross-platform:razor-render/u);
  assert.match(workflow, /current="\$\{CROSS_PLATFORM_CAPTURE\}\/vue"/u);
  assert.match(workflow, /current="\$\{CROSS_PLATFORM_CAPTURE\}\/razor"/u);
});
