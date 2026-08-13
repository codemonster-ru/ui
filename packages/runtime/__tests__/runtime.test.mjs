import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { CmRuntime } from '../dist/index.js';

test('discovers registered controllers and disconnects them in reverse order', () => {
  const dom = new JSDOM(`
    <main data-cm-controller="menu unknown">
      <section data-cm-controller="menu"></section>
    </main>
  `);
  const calls = [];
  const runtime = new CmRuntime().register('menu', (element) => ({
    connect() {
      calls.push(`connect:${element.tagName}`);
    },
    disconnect() {
      calls.push(`disconnect:${element.tagName}`);
    },
  }));

  runtime.start(dom.window.document);
  runtime.stop();

  assert.deepEqual(calls, ['connect:MAIN', 'connect:SECTION', 'disconnect:SECTION', 'disconnect:MAIN']);
});

test('includes an element root in discovery', () => {
  const dom = new JSDOM('<div data-cm-controller="demo"><span data-cm-controller="demo"></span></div>');
  const elements = [];
  const runtime = new CmRuntime().register('demo', (element) => ({
    connect() {
      elements.push(element.tagName);
    },
    disconnect() {},
  }));

  runtime.start(dom.window.document.querySelector('div'));

  assert.deepEqual(elements, ['DIV', 'SPAN']);
});

test('rejects invalid and duplicate controller registrations', () => {
  const factory = () => ({ connect() {}, disconnect() {} });
  const runtime = new CmRuntime().register('accordion', factory);

  assert.throws(() => runtime.register('BadName', factory), /lowercase kebab-case/u);
  assert.throws(() => runtime.register('accordion', factory), /already registered/u);
});

test('initializes each element and controller name only once', () => {
  const dom = new JSDOM('<div data-cm-controller="demo demo"></div>');
  let connections = 0;
  const runtime = new CmRuntime().register('demo', () => ({
    connect() {
      connections += 1;
    },
    disconnect() {},
  }));

  runtime.start(dom.window.document);
  runtime.start(dom.window.document);

  assert.equal(connections, 1);
});

test('disposes one subtree and allows it to reconnect', () => {
  const dom = new JSDOM(`
    <main>
      <section id="first" data-cm-controller="demo"></section>
      <section id="second" data-cm-controller="demo"></section>
    </main>
  `);
  const calls = [];
  const runtime = new CmRuntime().register('demo', (element) => ({
    connect() {
      calls.push(`connect:${element.id}`);
    },
    disconnect() {
      calls.push(`disconnect:${element.id}`);
    },
  }));
  const first = dom.window.document.querySelector('#first');

  runtime.start(dom.window.document);
  runtime.stop(first);
  runtime.start(first);
  runtime.stop();

  assert.deepEqual(calls, [
    'connect:first',
    'connect:second',
    'disconnect:first',
    'connect:first',
    'disconnect:first',
    'disconnect:second',
  ]);
});

test('optionally observes inserted removed and retargeted controllers', async () => {
  const dom = new JSDOM('<main></main>');
  const calls = [];
  const runtime = new CmRuntime()
    .register('first', controllerFactory('first', calls))
    .register('second', controllerFactory('second', calls));
  const main = dom.window.document.querySelector('main');
  const dispose = runtime.observe(main);

  assert.equal(runtime.observe(main), dispose);

  const element = dom.window.document.createElement('section');
  element.dataset.cmController = 'first';
  main.append(element);
  await mutations(dom);

  element.dataset.cmController = 'second';
  await mutations(dom);

  element.remove();
  await mutations(dom);
  dispose();

  assert.deepEqual(calls, [
    'connect:first',
    'disconnect:first',
    'connect:second',
    'disconnect:second',
  ]);
});

test('reports roots without a MutationObserver implementation', () => {
  const root = { nodeType: 11, ownerDocument: null, querySelectorAll: () => [] };

  assert.throws(() => new CmRuntime().observe(root), /MutationObserver is not available/u);
});

function controllerFactory(name, calls) {
  return () => ({
    connect() {
      calls.push(`connect:${name}`);
    },
    disconnect() {
      calls.push(`disconnect:${name}`);
    },
  });
}

function mutations(dom) {
  return new Promise((resolve) => dom.window.setTimeout(resolve, 0));
}
