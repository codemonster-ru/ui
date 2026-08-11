import assert from 'node:assert/strict';
import test from 'node:test';
import { createVisualFixtureMatrix, validateVisualConfig } from './code-monster-ui-fixtures.mjs';

const config = {
  schemaVersion: 1,
  themes: [
    { name: 'light', attribute: 'light' },
    { name: 'dark', attribute: 'dark' },
  ],
  viewports: [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1280, height: 800 },
  ],
  stylesheets: ['/assets/ui.css'],
};

function createCase(visual) {
  return {
    canonicalHtml: '<button class="cm-button">Save</button>\n',
    data: { visual },
    id: 'button-default',
  };
}

test('creates a stable theme and viewport matrix', () => {
  const fixtures = createVisualFixtureMatrix([createCase()], config, { platform: 'vue' });

  assert.equal(fixtures.length, 4);
  assert.deepEqual(
    fixtures.map(({ snapshotPath }) => snapshotPath),
    [
      'vue/button-default--light--mobile.png',
      'vue/button-default--light--desktop.png',
      'vue/button-default--dark--mobile.png',
      'vue/button-default--dark--desktop.png',
    ],
  );
  assert.match(fixtures[0].document, /data-cm-theme="light"/u);
  assert.match(fixtures[0].document, /href="\/assets\/ui.css"/u);
  assert.match(fixtures[0].document, /class="cm-button"/u);
});

test('supports case-specific visual selections', () => {
  const [fixture] = createVisualFixtureMatrix([createCase({ themes: ['dark'], viewports: ['desktop'] })], config);

  assert.equal(fixture.id, 'button-default--dark--desktop');
});

test('skips cases that opt out of visual fixtures', () => {
  assert.deepEqual(createVisualFixtureMatrix([createCase({ enabled: false })], config), []);
});

test('rejects duplicate visual dimensions and unknown selections', () => {
  assert.ok(
    validateVisualConfig({ ...config, themes: [...config.themes, config.themes[0]] }).some((message) =>
      message.includes('Duplicate visual theme'),
    ),
  );
  assert.throws(
    () => createVisualFixtureMatrix([createCase({ themes: ['contrast'] })], config),
    /selects unknown visual theme contrast/u,
  );
});
