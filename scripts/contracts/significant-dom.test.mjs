import assert from 'node:assert/strict';
import test from 'node:test';
import { compareSignificantDom, normalizeSignificantDom } from './significant-dom.mjs';

test('normalizes attribute order, class order, booleans, comments, and framework attributes', () => {
  const expected = '<button class="cm-button extra" disabled>Save</button>';
  const actual = `
    <!--[-->
    <button data-v-ab123 class="extra cm-button" disabled="disabled">Save</button>
    <!--]-->
  `;

  assert.equal(compareSignificantDom(expected, actual).equal, true);
});

test('preserves significant text and structure differences', () => {
  const textResult = compareSignificantDom('<button>Save</button>', '<button>Delete</button>');
  assert.equal(textResult.equal, false);
  assert.match(textResult.difference, /children\[0\]\.children\[0\]\.value/u);

  const structureResult = compareSignificantDom('<button>Save</button>', '<a>Save</a>');
  assert.equal(structureResult.equal, false);
  assert.match(structureResult.difference, /children\[0\]\.name/u);
});

test('normalizes generated identifiers and their relationships by document order', () => {
  const expected = `
    <button id="button-trigger-id" aria-controls="button-panel-id">Toggle</button>
    <div id="button-panel-id" aria-labelledby="button-trigger-id">Panel</div>
  `;
  const actual = `
    <button id=":r1:" aria-controls=":r2:">Toggle</button>
    <div id=":r2:" aria-labelledby=":r1:">Panel</div>
  `;

  assert.equal(compareSignificantDom(expected, actual, { normalizeGeneratedIds: true }).equal, true);
  assert.equal(compareSignificantDom(expected, actual).equal, false);
});

test('normalizes inline style declaration order without changing custom property casing', () => {
  const expected = '<div style="color: red; --cm-Offset: calc(1px + 2px)"></div>';
  const actual = '<div style="--cm-Offset: calc(1px + 2px); COLOR: red"></div>';

  assert.equal(compareSignificantDom(expected, actual).equal, true);
});

test('reports the first significant DOM difference with its structural path', () => {
  const result = compareSignificantDom(
    '<button class="cm-button" aria-busy="true">Save</button>',
    '<button class="cm-button" aria-busy="false">Save</button>',
  );

  assert.equal(result.equal, false);
  assert.equal(result.difference, 'root.children[0].attributes.aria-busy: expected "true", received "false"');
});

test('rejects non-string fixture input', () => {
  assert.throws(() => normalizeSignificantDom(null), /HTML fixture must be a string/u);
});
