import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { URL } from 'node:url';
import { JSDOM } from 'jsdom';
import { CmRuntime, createCmTableOfContentsController } from '../dist/index.js';

const markup = readFileSync(new URL('../../../contracts/table-of-contents/cases/offset.html', import.meta.url), 'utf8');

function setup(context, hash = '') {
  const { window } = new JSDOM(`${markup}<h2 id="install" tabindex="-1">Installation</h2>`, {
    url: `https://example.test/guide${hash}`,
  });
  const document = window.document;
  const heading = document.getElementById('install');
  const link = document.querySelector('a');
  const runtime = new CmRuntime().register('table-of-contents', createCmTableOfContentsController);
  const scrolls = [];
  const frames = new Map();
  let frameId = 0;
  window.scrollTo = (options) => scrolls.push(options);
  window.requestAnimationFrame = (callback) => {
    frames.set(++frameId, callback);
    return frameId;
  };
  window.cancelAnimationFrame = (id) => frames.delete(id);
  Object.defineProperty(window, 'scrollY', { value: 100 });
  heading.getBoundingClientRect = () => ({ top: 250 });
  context.after(() => {
    runtime.stop();
    window.close();
  });

  function click(options) {
    const event = new window.MouseEvent('click', { bubbles: true, cancelable: true, ...options });
    link.dispatchEvent(event);
    return event.defaultPrevented;
  }
  return { click, document, frames, heading, link, runtime, scrolls, window };
}

test('updates the fragment, focuses the heading and scrolls with the declared offset', (context) => {
  const { click, document, heading, runtime, scrolls, window } = setup(context);
  runtime.start(document);

  assert.equal(click(), true);
  assert.equal(window.location.hash, '#install');
  assert.equal(document.activeElement, heading);
  assert.deepEqual(scrolls, [{ behavior: 'smooth', top: 286 }]);

  window.matchMedia = () => ({ matches: true });
  assert.equal(click(), true);
  assert.equal(window.history.length, 2);
  assert.deepEqual(scrolls.at(-1), { behavior: 'instant', top: 286 });

  runtime.stop(document);
  assert.equal(click(), false);
  assert.equal(scrolls.length, 2);
});

test('keeps unenhanced, modified, missing and malformed destinations native', (context) => {
  const { click, document, link, runtime, scrolls } = setup(context);
  runtime.start(document);
  assert.equal(click({ metaKey: true }), false);
  assert.equal(click({ ctrlKey: true }), false);
  link.target = '_blank';
  assert.equal(click(), false);
  link.removeAttribute('target');
  link.href = '#bad%zz';
  assert.equal(click(), false);
  link.href = '#missing';
  assert.equal(click(), false);
  link.href = '#install';
  const root = document.querySelector('nav');
  root.removeAttribute('data-cm-toc-smooth');
  root.removeAttribute('data-cm-toc-scroll-offset');
  assert.equal(click(), false);
  assert.deepEqual(scrolls, []);
});

test('adjusts an initial deep link and cancels a pending adjustment on teardown', (context) => {
  const { document, frames, runtime, scrolls, window } = setup(context, '#install');
  runtime.start(document);
  runtime.start(document);
  assert.equal(frames.size, 1);

  const [id, callback] = frames.entries().next().value;
  frames.delete(id);
  callback();
  assert.deepEqual(scrolls, [{ behavior: 'smooth', top: 286 }]);
  assert.equal(document.activeElement, document.body);
  assert.equal(window.history.length, 1);
  runtime.stop(document);

  runtime.start(document);
  assert.equal(frames.size, 1);
  runtime.stop(document);
  assert.equal(frames.size, 0);
});
