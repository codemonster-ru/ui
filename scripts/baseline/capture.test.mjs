// Pins how the showcase harness acquires its full-page pixels (M35.6d).
//
// The browser-level evidence - reference -> reference runs, the frame sequence
// after the resize, the negative controls - lives outside the repository. These
// tests keep the contract from eroding in source: the frame is never extended
// inside the capture call, the rest predicate fails on every condition it
// exists to wait for, and a screenshot is measured from its own bytes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { pngSize, restExpression, restFrameLimit, restQuietFrames } from './capture.mjs';

// Code only: the header comment describes the acquisition that was replaced.
const source = readFileSync(new URL('./capture.mjs', import.meta.url), 'utf8')
  .split('\n')
  .filter((line) => !line.trim().startsWith('//'))
  .join('\n');

test('no capture extends the frame inside the screenshot call', () => {
  assert.doesNotMatch(source, /captureBeyondViewport:\s*true/);
  assert.match(source, /captureBeyondViewport:\s*false/);
});

test('a capture is accepted only from two identical frames without a resize', () => {
  assert.match(source, /if \(!first\.equals\(second\)\) \{\s*throw rejected\(/);
  assert.match(source, /if \(resizedDuringCapture !== 0\) \{\s*throw rejected\(/);
  assert.doesNotMatch(source, /\bretry\b/i);
});

// A minimal page for the rest predicate. Every frame runs `tick` first, which
// may change the page the way a real one would between two frames.
function fakePage({ animations = [], codeBlocks = [], images = [], tick = () => {} } = {}) {
  const observers = new Set();
  let pending = [];
  const document = {
    fonts: { status: 'loaded' },
    documentElement: { scrollHeight: 1000, scrollWidth: 1440 },
    images,
    getAnimations: () => animations,
    querySelectorAll: (selector) => {
      assert.equal(selector, '.vf-codeblock');
      return codeBlocks;
    },
  };
  const page = {
    document,
    frame: 0,
    mutate(count = 1) {
      for (let index = 0; index < count; index += 1) pending.push({});
    },
  };
  class MutationObserver {
    constructor(callback) {
      this.callback = callback;
      observers.add(this);
    }
    observe() {}
    takeRecords() {
      const records = pending;
      pending = [];
      return records;
    }
    disconnect() {
      observers.delete(this);
    }
  }
  const requestAnimationFrame = (callback) =>
    setImmediate(() => {
      page.frame += 1;
      tick(page);
      for (const observer of observers) {
        if (pending.length > 0) observer.callback(observer.takeRecords());
      }
      callback();
    });
  page.context = { document, MutationObserver, requestAnimationFrame };
  return page;
}

const finiteAnimation = { playState: 'running', effect: { getComputedTiming: () => ({ endTime: 0.01 }) } };
const infiniteAnimation = { playState: 'running', effect: { getComputedTiming: () => ({ endTime: Infinity }) } };

function codeBlock({ language, highlighted }) {
  return {
    querySelector: (selector) => {
      if (selector === '.vf-codeblock__shiki-token') return highlighted ? {} : null;
      if (selector === '.vf-codeblock__language') return { textContent: `Language: ${language}` };
      return null;
    },
  };
}

const evaluateRest = (page) => runInNewContext(restExpression, page.context);

test('a page with nothing pending is at rest after the quiet frames', async () => {
  const rest = await evaluateRest(fakePage());
  assert.equal(rest.atRest, true);
  assert.equal(rest.frames, restQuietFrames);
});

test('infinite animations are left to the two-frame identity check', async () => {
  assert.equal((await evaluateRest(fakePage({ animations: [infiniteAnimation] }))).atRest, true);
});

test('a running finite animation keeps the page from rest until it ends', async () => {
  const animations = [finiteAnimation];
  const page = fakePage({ animations, tick: (current) => current.frame === 10 && animations.pop() });
  const rest = await evaluateRest(page);
  assert.equal(rest.atRest, true);
  assert.equal(rest.frames, 10 + restQuietFrames - 1);
});

test('an animation that never ends fails at the frame bound', async () => {
  const rest = await evaluateRest(fakePage({ animations: [finiteAnimation] }));
  assert.equal(rest.atRest, false);
  assert.equal(rest.frames, restFrameLimit);
  assert.equal(rest.last.finiteAnimations, 1);
});

test('a DOM that keeps mutating never comes to rest', async () => {
  const rest = await evaluateRest(fakePage({ tick: (page) => page.mutate() }));
  assert.equal(rest.atRest, false);
  assert.ok(rest.last.mutations > 0);
});

test('a document that keeps growing never comes to rest', async () => {
  const rest = await evaluateRest(fakePage({ tick: (page) => (page.document.documentElement.scrollHeight += 96) }));
  assert.equal(rest.atRest, false);
});

test('an image that never finishes loading keeps the page from rest', async () => {
  const rest = await evaluateRest(fakePage({ images: [{ complete: true }, { complete: false }] }));
  assert.equal(rest.atRest, false);
  assert.equal(rest.last.incompleteImages, 1);
});

test('a code block that stays plain keeps the page from rest unless its language is plain text', async () => {
  const late = await evaluateRest(fakePage({ codeBlocks: [codeBlock({ language: 'php', highlighted: false })] }));
  assert.equal(late.atRest, false);
  assert.equal(late.last.unhighlightedCodeBlocks, 1);

  for (const language of ['plaintext', 'text', 'txt']) {
    const plain = await evaluateRest(fakePage({ codeBlocks: [codeBlock({ language, highlighted: false })] }));
    assert.equal(plain.atRest, true, language);
  }

  const highlighted = await evaluateRest(fakePage({ codeBlocks: [codeBlock({ language: 'php', highlighted: true })] }));
  assert.equal(highlighted.atRest, true);
});

test('highlighting that arrives late is waited for', async () => {
  const block = codeBlock({ language: 'scss', highlighted: false });
  const page = fakePage({
    codeBlocks: [block],
    tick: (current) => {
      if (current.frame === 20) {
        block.querySelector = (selector) => (selector === '.vf-codeblock__shiki-token' ? {} : null);
        current.mutate();
      }
    },
  });
  const rest = await evaluateRest(page);
  assert.equal(rest.atRest, true);
  assert.ok(rest.frames >= 20 + restQuietFrames);
});

test('the screenshot size is read from the PNG header and anything else is refused', () => {
  const png = Buffer.alloc(33);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(png, 0);
  png.writeUInt32BE(13, 8);
  png.write('IHDR', 12, 'ascii');
  png.writeUInt32BE(1440, 16);
  png.writeUInt32BE(21610, 20);
  assert.deepEqual(pngSize(png), { width: 1440, height: 21610 });
  assert.equal(pngSize(Buffer.from('not a png at all, really not')), null);
  assert.equal(pngSize(png.subarray(0, 20)), null);
});
