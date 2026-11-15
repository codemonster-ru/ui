import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { URL } from 'node:url';
import { JSDOM } from 'jsdom';

import { CmRuntime, createCmStepperController } from '../dist/index.js';

test('vertical Stepper skips disabled steps and keeps authored classes when the current step changes', (t) => {
  const html = readFileSync(new URL('../../../contracts/stepper/cases/vertical-start.html', import.meta.url), 'utf8');
  const { window } = new JSDOM(html);
  const { document } = window;
  const root = document.querySelector('.cm-stepper');
  const [account, , review] = root.querySelectorAll('button');
  const reviewItem = review.closest('li');
  reviewItem.classList.add('authored');
  review.dataset.cmStepperValue = 'review"]';
  const changes = [];
  root.addEventListener('cm:stepper-value-change', (event) => changes.push(event.detail.value));
  const runtime = new CmRuntime().register('stepper', createCmStepperController);
  runtime.start(document);
  t.after(() => {
    runtime.stop();
    window.close();
  });

  const press = (target, key) => target.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true }));
  account.focus();
  press(account, 'ArrowDown');
  assert.equal(document.activeElement, review);
  assert.equal(review.getAttribute('aria-current'), 'step');
  assert.equal(reviewItem.classList.contains('authored'), true);
  assert.equal(root.style.getPropertyValue('--cm-stepper-progress-factor'), '1');
  account.focus();
  press(account, 'End');
  assert.equal(document.activeElement, review);
  assert.deepEqual(changes, ['review"]']);
});
