import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { CmRuntime } from '../dist/index.js';

function createRuntime(markup) {
  const dom = new JSDOM(`<!doctype html><body>${markup}</body>`);
  const connected = [];
  const runtime = new CmRuntime().register('probe', (element) => ({
    connect: () => connected.push(element),
    disconnect: () => {},
  }));
  return { connected, dom, runtime };
}

test('attaches to an element a framework has not claimed', () => {
  const { connected, dom, runtime } = createRuntime('<div id="a" data-cm-controller="probe"></div>');
  runtime.start(dom.window.document);
  assert.equal(connected.length, 1);
});

test('leaves an element a framework adapter already owns', () => {
  const { connected, dom, runtime } = createRuntime('<div id="a" data-cm-controller="probe" data-cm-hydrated></div>');
  runtime.start(dom.window.document);
  assert.deepEqual(connected, []);
});

test('releases an element that is claimed after the runtime attached', async () => {
  const { connected, dom, runtime } = createRuntime('<div id="a" data-cm-controller="probe"></div>');
  const document = dom.window.document;
  const dispose = runtime.observe(document);
  assert.equal(connected.length, 1);

  document.getElementById('a').setAttribute('data-cm-hydrated', '');
  await delay(0);
  document.getElementById('a').setAttribute('data-cm-controller', 'probe');
  await delay(0);

  assert.equal(connected.length, 1, 'a claimed element must not be re-attached');
  dispose();
});
