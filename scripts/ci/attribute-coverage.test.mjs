// Every attribute a profile calls semantic must actually be compared.
//
// M12 found aria-busy missing from the comparison list: the loading state's
// ARIA had never been compared by any component, and the only reason anyone
// noticed was that a mutation aimed at it could not be detected. M13 found four
// more the same way - rows, minlength, spellcheck and wrap - which is twice in
// two milestones, so the check stops being a mutation's side effect here.
//
// This is deliberately not a mechanism. A profile lists the attribute names it
// considers part of its component's contract, and this test asserts each is
// reachable by an actual comparison: named in the compared list, resolved as a
// relationship edge, or captured as a product data attribute. Nothing is
// generated, and nothing here decides what gets compared - it only refuses to
// let a profile claim coverage the extractor does not provide.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { COMPARED_ATTRIBUTES, REFERENCE_ATTRIBUTES } from '../parity/extract.mjs';
import { profiles } from '../parity/profiles.mjs';

/** How an attribute reaches a comparison, or null when nothing compares it. */
function comparedBy(attribute) {
  if (COMPARED_ATTRIBUTES.includes(attribute)) return 'dom.nativeAttributes';
  if (REFERENCE_ATTRIBUTES.includes(attribute)) return 'dom.relationships';
  // Every data-* attribute is captured, except the renderer's own markers.
  if (attribute.startsWith('data-') && !attribute.startsWith('data-vf-razor')) return 'dom.productData';

  return null;
}

test('every semantic attribute a profile declares is actually compared', () => {
  const unreachable = [];

  for (const [id, profile] of Object.entries(profiles)) {
    for (const attribute of profile.semanticAttributes ?? []) {
      if (comparedBy(attribute) === null) unreachable.push(`${id}: ${attribute}`);
    }
  }

  assert.deepEqual(
    unreachable,
    [],
    'A profile calls these attributes part of its contract, but no comparison would ever report a difference in them.',
  );
});

test('a profile cannot declare a renderer marker as semantic', () => {
  // data-vf-razor and data-v-* identify the renderer, not the product, and are
  // dropped by the extractor. Declaring one would be claiming coverage that the
  // comparison deliberately does not provide.
  assert.equal(comparedBy('data-vf-razor'), null);
  assert.equal(comparedBy('data-vf-filled'), 'dom.productData');
});

test('the check itself fails when an attribute is not compared', () => {
  // A self-test: without this, a comparedBy() that returned a truthy value for
  // everything would make the gate above vacuous.
  assert.equal(comparedBy('there-is-no-such-attribute'), null);
  assert.equal(comparedBy('rows'), 'dom.nativeAttributes');
  assert.equal(comparedBy('aria-describedby'), 'dom.relationships');
});

test('at least one profile declares semantic attributes, so the gate has work to do', () => {
  const declaring = Object.values(profiles).filter((profile) => (profile.semanticAttributes ?? []).length > 0);

  assert.ok(declaring.length > 0, 'no profile declares any semantic attribute, so the gate proves nothing');
});
