// The tooltip profile's followedReferences, and the cross-wiring attacks (M31).
//
// The M28.0 edge used as it is, one hop: the tooltip declares its trigger's
// aria-describedby, the one reference that reaches a tooltip teleported to
// <body>. Nothing points back from a tooltip to its trigger, so the pairing of
// two instances is carried by the reference graph, by where each tooltip is -
// the document order the extractor numbers ids in - by its text and by its
// inline position. Run against the real extraction expression and the real
// comparator on pages shaped like tooltip cases:
//
//   T1. the profile declares exactly the trigger's aria-describedby;
//   T2. with it, a correct pair compares equal and the arrow and transition
//       classes are part of the followed evidence;
//   T3. without it, a correct teleported tooltip fails on a generated literal
//       and a wrong one is masked by the same record;
//   T4. the attacks: A trigger A names tooltip B, B names A, C duplicate ids,
//       D both triggers name one tooltip, E correct ids with the bodies
//       swapped, F identical texts swapped - caught by position - G an orphan
//       left in <body>, H the wrong <body> order;
//   T5. one hop is the whole tooltip: rich content needs no second one, and no
//       catalog case depends on a reference inside a tooltip.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

import { launchChrome, openPage } from '../baseline/cdp.mjs';
import { compareDom } from './compare.mjs';
import { extractCasesExpression } from './extract.mjs';
import { profiles } from './profiles.mjs';

const DECLARED = profiles.tooltip.followedReferences;
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CASE = 'tooltip/interaction-two-different-open';

/**
 * Two open tooltips in one case, their tooltips in <body>. `names` is which
 * tooltip each trigger's aria-describedby names, `ids` the id each tooltip
 * carries, `texts` and `lefts` their bodies and positions in body order.
 */
function page({
  suffix = 'v-',
  names = [0, 1],
  ids = [0, 1],
  texts = ['Alpha hint', 'Beta hint'],
  lefts = null,
  extra = '',
  transition = '',
} = {}) {
  const id = (index) => `vf-tooltip-${suffix}${index}`;
  return (
    `<div data-parity-case="${CASE}">` +
    [0, 1]
      .map(
        (index) =>
          `<span class="vf-tooltip"><span class="vf-tooltip__trigger" aria-describedby="${id(names[index])}">` +
          `<button type="button" class="parity-trigger-control">Info</button></span></span>`,
      )
      .join('') +
    `</div>` +
    [0, 1]
      .map(
        (index) =>
          `<span id="${id(ids[index])}" class="vf-tooltip__content vf-tooltip__content--top${transition}" role="tooltip"${lefts ? ` style="left: ${lefts[index]}px; top: 38.4px;"` : ''}>${texts[index]}` +
          `<span class="vf-tooltip__arrow vf-tooltip__arrow--top" aria-hidden="true"></span></span>`,
      )
      .join('') +
    extra
  );
}

function extract(body, follow) {
  const { window } = new JSDOM(`<!doctype html><body>${body}</body>`, { runScripts: 'outside-only' });
  // Through JSON: the jsdom realm's arrays are not this realm's.
  return JSON.parse(JSON.stringify(window.eval(extractCasesExpression({}, follow)).cases[CASE].dom));
}

const against = (reference, razor, follow = DECLARED) => compareDom(extract(reference, follow), extract(razor, follow));

/** The same extraction in real Chrome, whose CSSOM parses inline positions as the parity runner's does. */
async function extractInChrome(bodies) {
  const chrome = await launchChrome();
  try {
    const page = await openPage(chrome.endpoint);
    const doms = [];
    for (const body of bodies) {
      const html = `<!doctype html><body>${body}</body>`;
      await page.send('Page.navigate', { url: `data:text/html;base64,${Buffer.from(html).toString('base64')}` });
      await page.waitFor(`document.querySelector('[data-parity-case]') !== null`);
      doms.push((await page.evaluate(extractCasesExpression({}, DECLARED))).cases[CASE].dom);
    }
    await page.close();
    return doms;
  } finally {
    await chrome.close();
  }
}
const differs = (reference, razor, dimension) =>
  against(reference, razor).some((entry) => dimension === undefined || entry.dimension === dimension);

test("T1: the tooltip profile follows exactly its trigger's aria-describedby", () => {
  assert.deepEqual(DECLARED, [{ source: '.vf-tooltip__trigger', attribute: 'aria-describedby' }]);
});

test('T2: with the declaration a correct pair compares equal, and the followed tooltip carries its arrow and transition', () => {
  assert.deepEqual(against(page(), page({ suffix: 'r-' })), []);
  const dom = extract(page({ transition: ' vf-floating-transition-leave-active' }), DECLARED);
  const followed = dom.slice(-2);
  assert.deepEqual(
    followed.map((node) => node.classes),
    [0, 1].map(() => ['vf-floating-transition-leave-active', 'vf-tooltip__content', 'vf-tooltip__content--top']),
  );
  assert.ok(followed.every((node) => node.children[0].classes.includes('vf-tooltip__arrow')));
  assert.ok(
    differs(page(), page({ suffix: 'r-', transition: ' vf-floating-transition-leave-active' }), 'dom.canonicalClasses'),
  );
});

test('T3: without the declaration a correct tooltip fails on a literal and a wrong one is masked by it', () => {
  const correct = against(page(), page({ suffix: 'r-' }), []);
  assert.ok(correct.length > 0, 'a correct teleported tooltip compared equal without the declaration');
  assert.deepEqual(against(page(), page({ suffix: 'r-', texts: ['Wrong', 'Beta hint'] }), []), correct);
});

test('T4 A-B: a trigger naming the other tooltip differs in the reference graph, one way or both', () => {
  assert.ok(differs(page(), page({ suffix: 'r-', names: [1, 1] }), 'dom.relationships'));
  assert.ok(differs(page(), page({ suffix: 'r-', names: [0, 0] }), 'dom.relationships'));
  assert.ok(differs(page(), page({ suffix: 'r-', names: [1, 0] }), 'dom.relationships'));
});

test('T4 C-D: duplicate ids and two triggers naming one tooltip differ', () => {
  assert.ok(differs(page(), page({ suffix: 'r-', ids: [0, 0], names: [0, 0] })));
  // Both triggers name the first; the second tooltip is named by nothing and
  // is not followed at all - a structural difference.
  assert.ok(differs(page(), page({ suffix: 'r-', names: [0, 0] }), 'dom.structure'));
});

test('T4 E: correct ids with the bodies swapped differ in text', () => {
  assert.ok(differs(page(), page({ suffix: 'r-', texts: ['Beta hint', 'Alpha hint'] }), 'dom.text'));
});

test('T4 F: identical texts swapped are invisible to the graph and the text, and caught by position', async () => {
  const same = ['Same hint', 'Same hint'];
  // Each trigger names the tooltip placed over the other one: ids and
  // references are consistent, the texts identical. Without positions the swap
  // is isomorphic to the correct page - why the catalog gives identical texts
  // different geometry and records it.
  assert.deepEqual(against(page({ texts: same }), page({ suffix: 'r-', texts: same, names: [1, 0], ids: [1, 0] })), []);
  const [correct, swapped] = await extractInChrome([
    page({ texts: same, lefts: [120, 300] }),
    page({ suffix: 'r-', texts: same, lefts: [300, 120] }),
  ]);
  assert.ok(compareDom(correct, swapped).some((entry) => entry.dimension === 'dom.nativeAttributes'));
});

test('T4 G: an orphan tooltip left in <body> is invisible to the followed DOM - the snapshot has to count it', () => {
  const orphan =
    '<span id="vf-tooltip-r-9" class="vf-tooltip__content vf-tooltip__content--top" role="tooltip">Stale</span>';
  assert.deepEqual(against(page(), page({ suffix: 'r-', extra: orphan })), []);
  const snapshotSource = readFileSync(resolve(repositoryRoot, 'scripts/parity/extract.mjs'), 'utf8');
  assert.match(snapshotSource, /owner: owner < 0 \? 'orphan' : 'instance:' \+ owner/);
});

test('T4 H: tooltips in <body> in the wrong order differ: ids are numbered in document order, not in reference order', () => {
  assert.ok(differs(page(), page({ suffix: 'r-', names: [1, 0], texts: ['Beta hint', 'Alpha hint'] })));
});

test('T5: one hop is the whole tooltip - rich content needs no second one, and no case follows a reference inside a tooltip', () => {
  const rich = (suffix) =>
    page({ suffix }).replace('Alpha hint', '<strong>Rich</strong> body').replace('Beta hint', '<em>Other</em> body');
  assert.deepEqual(against(rich('v-'), rich('r-')), []);
  const cases = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/tooltip/cases.json'), 'utf8')).cases;
  const throughTooltip = cases
    .flatMap((entry) => entry.interaction?.steps ?? [])
    .filter((step) => step.through?.attribute === 'aria-describedby');
  assert.ok(throughTooltip.every((step) => step.selector === 'strong'));
});
