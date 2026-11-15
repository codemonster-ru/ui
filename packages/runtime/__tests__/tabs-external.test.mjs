import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';

import { CmRuntime, createCmTabsController } from '../dist/index.js';

test('Vanilla tabs select external custom panels and tabs without panels', (t) => {
  const { window } = new JSDOM(`
    <div class="cm-tabs" data-cm-controller="tabs" data-cm-tabs-value="overview">
      <div role="tablist">
        <button id="control:overview" class="cm-tabs__tab" role="tab" data-cm-tab-value="overview"
          aria-controls="content:overview">Overview</button>
        <button id="control:members" class="cm-tabs__tab" role="tab" data-cm-tab-value="members"
          aria-controls="content:members">Members</button>
        <button id="control:closed" class="cm-tabs__tab" role="tab" data-cm-tab-value="closed">Closed</button>
      </div>
    </div>
    <section role="tabpanel" id="content:overview" aria-labelledby="control:overview">Overview panel</section>
    <section role="tabpanel" id="content:members" aria-labelledby="control:members">Members panel</section>
  `);
  const { document } = window;
  const runtime = new CmRuntime().register('tabs', createCmTabsController);
  const root = document.querySelector('.cm-tabs');
  const [overview, members, closed] = root.querySelectorAll('[role="tab"]');
  const firstPanel = document.getElementById('content:overview');
  const secondPanel = document.getElementById('content:members');
  const selection = [];
  root.addEventListener('cm:tabs-value-change', (event) => selection.push(event.detail.value));
  runtime.start(document);
  t.after(() => {
    runtime.stop();
    window.close();
  });
  assert.equal(firstPanel.hidden, false);
  assert.equal(secondPanel.hidden, true);

  overview.focus();
  overview.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(document.activeElement, members);
  assert.equal(members.getAttribute('aria-selected'), 'true');
  assert.equal(firstPanel.hidden, true);
  assert.equal(secondPanel.hidden, false);

  members.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.equal(document.activeElement, closed);
  assert.equal(closed.getAttribute('aria-selected'), 'true');
  assert.equal(closed.hasAttribute('aria-controls'), false);
  assert.equal(secondPanel.hidden, true);
  assert.deepEqual(selection, ['members', 'closed']);
});
