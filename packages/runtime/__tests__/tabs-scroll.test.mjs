import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { observeTabScroll, scrollTabList } from '@codemonster-ru/ui-runtime/tabs-scroll';

test('observes logical overflow, transfers focus at an edge, and disconnects', () => {
  const { window } = new JSDOM(`<div id="tabs" dir="rtl"><button class="cm-tabs__tab" role="tab">First</button>
    <button class="cm-tabs__tab" role="tab" disabled>Unavailable</button><button class="cm-tabs__tab" role="tab">Last</button></div>
    <button id="end">Show later tabs</button>`);
  const viewport = window.document.querySelector('#tabs');
  const end = window.document.querySelector('#end');
  const visible = [];
  const calls = [];
  const observed = [];
  let disposed = false;
  let offset = 0;
  window.ResizeObserver = class {
    observe(node) {
      observed.push(node);
    }
    disconnect() {
      disposed = true;
    }
  };
  window.matchMedia = () => ({ matches: true });
  viewport.style.direction = 'rtl';
  Object.defineProperties(viewport, {
    clientWidth: { value: 160 },
    scrollWidth: { value: 240 },
    scrollLeft: { get: () => offset },
  });
  viewport.scrollBy = (options) => {
    calls.push(options);
    offset = Math.max(-80, offset + options.left);
    viewport.dispatchEvent(new window.Event('scroll'));
  };
  const stop = observeTabScroll(viewport, (edges) => visible.push(edges));
  assert.equal(observed.length, 4);
  assert.deepEqual(visible, [{ start: false, end: true }]);
  end.focus();
  scrollTabList(viewport, 'end', end);
  assert.deepEqual(calls, [{ left: -120, behavior: 'instant' }]);
  assert.equal(window.document.activeElement.textContent, 'Last');
  assert.deepEqual(visible, [
    { start: false, end: true },
    { start: true, end: false },
  ]);
  stop();
  assert.equal(disposed, true);
  offset = 0;
  viewport.dispatchEvent(new window.Event('scroll'));
  window.dispatchEvent(new window.Event('resize'));
  assert.equal(visible.length, 2);
  window.close();
});
