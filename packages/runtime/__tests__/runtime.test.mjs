import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { cmFrameworkOwnership } from '../dist/core/index.js';
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

test('enhances existing AdminShell markup with registered shell metrics and releases Vue-owned shells', () => {
  const dom = new JSDOM(`
    <main class="cm-admin-shell">
      <section class="cm-admin-shell" data-cm-controller="shell-metrics"></section>
    </main>
  `);
  const { document, Event } = dom.window;
  const calls = [];
  const root = document.querySelector('main');
  const runtime = new CmRuntime().register('shell-metrics', (element) => {
    return controllerFactory(element.tagName, calls)();
  });

  try {
    runtime.start(root);
    root.setAttribute(cmFrameworkOwnership.attribute, '');
    root.dispatchEvent(new Event(cmFrameworkOwnership.claimEvent));
    runtime.start(root);
    runtime.stop();

    assert.deepEqual(calls, ['connect:MAIN', 'connect:SECTION', 'disconnect:MAIN', 'disconnect:SECTION']);
  } finally {
    runtime.stop();
    dom.window.close();
  }
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

test('synchronously releases exactly the marked framework root without an observer', () => {
  const dom = new JSDOM(
    '<main data-cm-controller="first second"><section data-cm-controller="child"></section></main>',
  );
  const { document, Event } = dom.window;
  const calls = [];
  const runtime = new CmRuntime()
    .register('first', controllerFactory('first', calls))
    .register('second', controllerFactory('second', calls))
    .register('child', controllerFactory('child', calls));
  const main = document.querySelector('main');

  try {
    const claim = () => main.dispatchEvent(new Event(cmFrameworkOwnership.claimEvent));
    runtime.start(document);
    claim();
    assert.deepEqual(calls, ['connect:first', 'connect:second', 'connect:child']);
    main.setAttribute(cmFrameworkOwnership.attribute, '');
    claim();
    runtime.start(document);
    assert.deepEqual(calls.slice(3), ['disconnect:second', 'disconnect:first']);
    runtime.stop();
    assert.equal(calls.at(-1), 'disconnect:child');
  } finally {
    runtime.stop();
    dom.window.close();
  }
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

  assert.deepEqual(calls, ['connect:first', 'disconnect:first', 'connect:second', 'disconnect:second']);
});

test('ignores a subtree inserted and removed in the same mutation batch', async () => {
  const dom = new JSDOM('<main></main>');
  const calls = [];
  const runtime = new CmRuntime().register('demo', controllerFactory('demo', calls));
  const main = dom.window.document.querySelector('main');
  const dispose = runtime.observe(main);
  const element = dom.window.document.createElement('section');
  element.dataset.cmController = 'demo';

  main.append(element);
  element.remove();
  await mutations(dom);
  dispose();
  runtime.stop();

  assert.deepEqual(calls, []);
});

test('releases a controller moved out of a subtree after the subtree was removed', async () => {
  const dom = new JSDOM('<main><section><button data-cm-controller="demo"></button></section></main>');
  const calls = [];
  const runtime = new CmRuntime().register('demo', controllerFactory('demo', calls));
  const main = dom.window.document.querySelector('main');
  const section = main.firstElementChild;
  const dispose = runtime.observe(main);

  section.remove();
  section.firstElementChild.remove();
  await mutations(dom);

  assert.deepEqual(calls, ['connect:demo', 'disconnect:demo']);
  dispose();
});

test('keeps controllers connected for DOM moves between observed roots', async () => {
  const dom = new JSDOM('<main><section data-cm-controller="demo"></section></main><aside></aside>');
  const calls = [];
  const runtime = new CmRuntime().register('demo', controllerFactory('demo', calls));
  const document = dom.window.document;
  const main = document.querySelector('main');
  const aside = document.querySelector('aside');
  const disposeAside = runtime.observe(aside);
  const disposeMain = runtime.observe(main);

  aside.append(document.querySelector('section'));
  await mutations(dom);
  disposeMain();

  assert.deepEqual(calls, ['connect:demo']);

  disposeAside();
  assert.deepEqual(calls, ['connect:demo', 'disconnect:demo']);
});

test('updates only changed controller names on the affected element', async () => {
  const dom = new JSDOM('<main data-cm-controller="old own"><section data-cm-controller="child"></section></main>');
  const calls = [];
  const runtime = new CmRuntime()
    .register('old', controllerFactory('old', calls))
    .register('own', controllerFactory('own', calls))
    .register('new', controllerFactory('new', calls))
    .register('child', controllerFactory('child', calls));
  const main = dom.window.document.querySelector('main');
  const dispose = runtime.observe(main);

  main.dataset.cmController = 'own new';
  await mutations(dom);

  assert.deepEqual(calls, ['connect:old', 'connect:own', 'connect:child', 'disconnect:old', 'connect:new']);
  dispose();
});

test('disposes pending removals and leaves a restarted observation active', async () => {
  const dom = new JSDOM('<main><section data-cm-controller="demo"></section></main>');
  const calls = [];
  const runtime = new CmRuntime().register('demo', controllerFactory('demo', calls));
  const main = dom.window.document.querySelector('main');
  const dispose = runtime.observe(main);
  const element = main.firstElementChild;

  element.remove();
  dispose();

  const disposeAgain = runtime.observe(main);
  dispose();
  main.append(element);
  await mutations(dom);
  disposeAgain();

  assert.deepEqual(calls, ['connect:demo', 'disconnect:demo', 'connect:demo', 'disconnect:demo']);
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
