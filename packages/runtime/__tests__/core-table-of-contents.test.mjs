import assert from 'node:assert/strict';
import test from 'node:test';
import {
  needsScrollEnhancement,
  resolveAnchorTargetId,
  resolveHeadingLevel,
  resolveItemHref,
  resolveScrollTarget,
} from '../dist/core/index.js';

test('heading levels are clamped to the six that exist', () => {
  assert.equal(resolveHeadingLevel(3), 3);
  assert.equal(resolveHeadingLevel(9), 6);
  assert.equal(resolveHeadingLevel(0), 1);
  assert.equal(resolveHeadingLevel(-2), 1);
  assert.equal(resolveHeadingLevel(undefined), 1);
  assert.equal(resolveHeadingLevel(2.7), 2);
});

test('an item links to its own anchor unless it names somewhere else', () => {
  assert.equal(resolveItemHref({ id: 'intro', label: 'Intro' }), '#intro');
  assert.equal(resolveItemHref({ id: 'intro', label: 'Intro', href: '/guide#intro' }), '/guide#intro');
});

test('the enhancement stays out of the way when native anchors already work', () => {
  assert.equal(needsScrollEnhancement(false, 0), false);
  assert.equal(needsScrollEnhancement(true, 0), true);
  assert.equal(needsScrollEnhancement(false, 64), true);
});

test('the scroll destination accounts for the current scroll and the offset', () => {
  assert.equal(resolveScrollTarget({ scrollY: 100, targetTop: 250, scrollOffset: 0 }), 350);
  assert.equal(resolveScrollTarget({ scrollY: 100, targetTop: 250, scrollOffset: 64 }), 286);
});

test('an offset larger than the target position stops at the top', () => {
  assert.equal(resolveScrollTarget({ scrollY: 0, targetTop: 10, scrollOffset: 200 }), 0);
});

test('only a same-document link names a target', () => {
  assert.equal(resolveAnchorTargetId('#section-two'), 'section-two');
  assert.equal(resolveAnchorTargetId('#caf%C3%A9'), 'café');
  assert.equal(resolveAnchorTargetId('/guide'), null);
  assert.equal(resolveAnchorTargetId('#'), null);
});
