import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { createCmEvent, dispatchCmEvent } from '../dist/index.js';

test('creates namespaced bubbling composed custom events', () => {
  const dom = new JSDOM('<button></button>');
  const button = dom.window.document.querySelector('button');
  const detail = { open: true, reason: 'keyboard' };
  const event = createCmEvent(button, 'open-change', detail);

  assert.equal(event.type, 'cm:open-change');
  assert.equal(event.bubbles, true);
  assert.equal(event.composed, true);
  assert.equal(event.cancelable, false);
  assert.equal(event.detail, detail);
});

test('dispatches cancelable events and returns their final state', () => {
  const dom = new JSDOM('<main><button></button></main>');
  const button = dom.window.document.querySelector('button');
  dom.window.document.querySelector('main').addEventListener('cm:activate', (event) => event.preventDefault());

  const event = dispatchCmEvent(button, 'activate', { source: 'pointer' }, { cancelable: true });

  assert.equal(event.defaultPrevented, true);
});

test('rejects invalid event names and unavailable constructors', () => {
  const dom = new JSDOM('<button></button>');
  const button = dom.window.document.querySelector('button');
  const target = new dom.window.EventTarget();

  assert.throws(() => createCmEvent(button, 'BadName', null), /lowercase kebab-case/u);
  assert.throws(() => createCmEvent(target, 'activate', null), /CustomEvent is not available/u);
});
