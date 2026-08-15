import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { PNG } from 'pngjs';

const scriptPath = resolve(import.meta.dirname, 'compare-showcase.mjs');

function writeCapture(directory, { channel = 0, routes = ['core'] } = {}) {
  mkdirSync(directory, { recursive: true });
  const image = new PNG({ height: 1, width: 1 });
  image.data.set([channel, 0, 0, 255]);
  writeFileSync(join(directory, 'core--light--desktop--01.png'), PNG.sync.write(image));
  writeFileSync(
    join(directory, 'manifest.json'),
    `${JSON.stringify({
      label: directory,
      referenceCommit: 'fd793696f50d3be0fcd3788f0f8f751c63869963',
      routes,
      screenshots: [{ filename: 'core--light--desktop--01.png' }],
      themes: ['light'],
      viewports: [{ height: 800, name: 'desktop', width: 1280 }],
    })}\n`,
  );
}

function compare(baseline, current, diff) {
  return spawnSync(process.execPath, [scriptPath, `--baseline=${baseline}`, `--current=${current}`, `--diff=${diff}`], {
    encoding: 'utf8',
  });
}

test('passes identical showcase captures with an exact default threshold', () => {
  const root = mkdtempSync(join(tmpdir(), 'cm-showcase-compare-'));
  const baseline = join(root, 'baseline');
  const current = join(root, 'current');
  const diff = join(root, 'diff');
  writeCapture(baseline);
  writeCapture(current);

  const result = compare(baseline, current, diff);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /0 changed/u);
  assert.equal(JSON.parse(readFileSync(join(diff, 'comparison.json'), 'utf8')).threshold, 0);
});

test('fails when one pixel channel changes', () => {
  const root = mkdtempSync(join(tmpdir(), 'cm-showcase-compare-'));
  const baseline = join(root, 'baseline');
  const current = join(root, 'current');
  const diff = join(root, 'diff');
  writeCapture(baseline);
  writeCapture(current, { channel: 1 });

  const result = compare(baseline, current, diff);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /1 changed/u);
});

test('rejects captures from different route matrices', () => {
  const root = mkdtempSync(join(tmpdir(), 'cm-showcase-compare-'));
  const baseline = join(root, 'baseline');
  const current = join(root, 'current');
  writeCapture(baseline);
  writeCapture(current, { routes: ['colors'] });

  const result = compare(baseline, current, join(root, 'diff'));

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /different routes/u);
});
