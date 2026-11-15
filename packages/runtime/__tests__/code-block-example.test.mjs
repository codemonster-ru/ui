import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { URL } from 'node:url';
import { JSDOM } from 'jsdom';
import { connectCodeBlock } from '../../../examples/vanilla/code-block-example.mjs';

const markup = readFileSync(new URL('../../../examples/vanilla/code-block-example.html', import.meta.url), 'utf8');

function setup(context, clipboard) {
  const { window } = new JSDOM(markup);
  context.after(() => window.close());
  Object.defineProperty(window.navigator, 'clipboard', { value: clipboard });

  const figure = window.document.querySelector('[data-code-block]');
  return {
    figure,
    copy: figure.querySelector('[data-code-copy]'),
    status: figure.querySelector('[role="status"]'),
  };
}

test('copies escaped source as plain text with its original indentation', async (context) => {
  const writes = [];
  const { figure, copy, status } = setup(context, { writeText: async (source) => writes.push(source) });
  assert.equal(copy.hidden, true);
  const disconnect = connectCodeBlock(figure);
  assert.equal(copy.hidden, false);

  copy.click();
  await Promise.resolve();
  assert.equal(writes[0], figure.querySelector('pre > code').textContent);
  assert.ok(writes[0].includes("\n  message: 'Use <main> for the page content & keep headings in order.'"));
  assert.equal(status.textContent, 'Code copied.');

  disconnect();
  assert.equal(copy.hidden, true);
  assert.equal(status.textContent, '');
});

test('disposes pending copy feedback and ignores duplicate clicks during a write', async (context) => {
  const { promise, resolve } = Promise.withResolvers();
  let writes = 0;
  const { figure, copy, status } = setup(context, {
    writeText() {
      writes += 1;
      return promise;
    },
  });
  const disconnect = connectCodeBlock(figure);

  copy.click();
  copy.click();
  disconnect();
  copy.click();
  resolve();
  await promise;
  assert.equal(writes, 1);
  assert.equal(copy.hidden, true);
  assert.equal(status.textContent, '');
});

test('offers manual selection when clipboard access is denied or unavailable', async (context) => {
  for (const clipboard of [undefined, { writeText: () => Promise.reject(new Error('Denied')) }]) {
    const { figure, copy, status } = setup(context, clipboard);
    connectCodeBlock(figure);
    copy.click();
    await Promise.resolve();
    assert.equal(status.textContent, 'Could not copy code. Select and copy it manually.');
    assert.equal(copy.hidden, false);
  }
});
