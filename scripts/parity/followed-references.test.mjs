// Relationship parity for references that leave the case root (M28.0).
//
// The extractor has compared generated-id relationships since M22: every id in
// a case is replaced with a document-order token and every reference is
// rewritten through the same map, so three adapters that spell their generated
// ids differently compare equal while a reference to the wrong element still
// differs. That only ever worked *inside* the case root. An overlay moved to
// the body is outside it, and there the mechanism broke both ways at once:
//
//   - FALSE FAIL. A reference that resolved outside the case kept its literal
//     (#outside-case:<id>), so three correct adapters with differently spelled
//     generated ids always differed;
//   - FALSE PASS, hidden behind the false fail. The moved element was never
//     described at all, so its own reverse relationship - and everything
//     inside it - was never compared. A wrong or missing aria-labelledby on
//     the overlay produced *exactly* the differences a correct one did.
//
// A profile now declares which references to follow out of the case; nothing
// else changes. These tests drive the real extraction expression - the string
// the browser runs - under jsdom, and the real DOM comparator, against three
// targets whose generated ids are spelled differently.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

import { compareDom } from './compare.mjs';
import { extractCasesExpression, followedReferenceProblems } from './extract.mjs';

const FOLLOW = [{ source: '.vf-probe-trigger', attribute: 'aria-controls' }];

/**
 * One trigger/overlay pair. `ids` names the trigger and overlay ids; `wire`
 * overrides any of the four attributes to model a defect, with null meaning
 * "not written". `teleport` renders the overlay outside the case root.
 */
function instance(label, ids, { open = true, teleport = true, wire = {}, content } = {}) {
  const pick = (key, fallback) => (key in wire ? wire[key] : fallback);
  const attr = (name, value) => (value === null || value === undefined ? '' : ` ${name}="${value}"`);
  const items = content ?? `<button role="menuitem">${label}1</button><button role="menuitem">${label}2</button>`;
  const trigger =
    `<div class="vf-probe-trigger"${attr('id', pick('tid', ids.t))}${attr('aria-controls', pick('controls', ids.m))}>` +
    `${pick('innerControls', null) ? `<button aria-controls="${wire.innerControls}">x</button>` : '<button>x</button>'}</div>`;
  const overlay = open
    ? `<div class="vf-probe-overlay" role="menu"${attr('id', pick('mid', ids.m))}${attr('aria-labelledby', pick('labelled', ids.t))}>${items}</div>`
    : '';
  return teleport
    ? { inCase: `<div class="vf-probe-host">${trigger}</div>`, portal: overlay }
    : { inCase: `<div class="vf-probe-host">${trigger}${overlay}</div>`, portal: '' };
}

/** Renders the case the way a page would and runs the real extractor over it. */
function extract(parts, { follow = FOLLOW, extra = '', expression } = {}) {
  const body =
    `<div data-parity-case="probe">${parts.map((part) => part.inCase).join('')}${extra}</div>` +
    parts.map((part) => part.portal).join('');
  const { window } = new JSDOM(`<!doctype html><body>${body}</body>`, { runScripts: 'outside-only' });
  return window.eval(expression ?? extractCasesExpression({}, follow)).cases.probe.dom;
}

/** Generated-id spellings per target: the relationship is the contract, the literal is not. */
const SPELLING = { reference: ['reference', 1], current: ['current', 9], razor: ['razor', 42] };
const ids = (target, n = 0) => {
  const [prefix, base] = SPELLING[target];
  return { t: `${prefix}-trigger-${base + n}`, m: `${prefix}-menu-${base + n}` };
};

/** The reference, correctly wired, against a target built by `build`. */
function against(build, options = {}) {
  const reference = extract(build('reference', null), options);
  return (target, defect) => compareDom(reference, extract(build(target, defect), options));
}

const one = (opts = {}) => (target, defect) => [instance('A', ids(target), { ...opts, ...(defect?.A ?? {}) })];
const two = (opts = {}) => (target, defect) => [
  instance('A', ids(target, 0), { ...opts, ...(defect?.A ?? {}) }),
  instance('B', ids(target, 1), { ...opts, ...(defect?.B ?? {}) }),
];
const razor = (n) => ids('razor', n);
const fired = (differences, dimension, detail) =>
  differences.some((entry) => entry.dimension === dimension && (detail === undefined || entry.detail === detail));

// ------------------------------------------------------------- equivalence

test('three targets that spell their generated ids differently compare equal', () => {
  const compare = against(one());

  assert.deepEqual(compare('current'), []);
  assert.deepEqual(compare('razor'), []);
  assert.deepEqual(compareDom(extract(one()('current')), extract(one()('razor'))), []);
});

test('two instances with different spellings compare equal', () => {
  const compare = against(two());

  assert.deepEqual(compare('current'), []);
  assert.deepEqual(compare('razor'), []);
});

test('a spelling change that keeps the topology is not a difference', () => {
  const compare = against(one());

  assert.deepEqual(compare('razor', { A: { wire: { tid: 'zz-t', mid: 'zz-m', controls: 'zz-m', labelled: 'zz-t' } } }), []);
});

test('ids inside a followed target are canonicalised too, so references within it compare by topology', () => {
  // An overlay whose own relationship points at something inside it - the
  // shape a moved dialog labelled by its own title has. The id inside the
  // overlay has to be numbered with the overlay, or the reference to it leaks
  // its literal and three correct targets differ again.
  const described = (target) => {
    const [prefix, base] = SPELLING[target];
    const note = `${prefix}-note-${base}`;
    return one({ content: `<span id="${note}">note</span><button role="menuitem" aria-describedby="${note}">A1</button>` })(target);
  };
  const reference = extract(described('reference'));

  assert.deepEqual(compareDom(reference, extract(described('current'))), []);
  assert.deepEqual(compareDom(reference, extract(described('razor'))), []);
  assert.match(reference[1].children[1].attributes['aria-describedby'], /^#id\d+$/, 'the inner reference is a token, not a literal');
});

test('equal literal ids compare equal too', () => {
  const same = (target) => [instance('A', { t: 'shared-trigger', m: 'shared-menu' })];

  assert.deepEqual(compareDom(extract(same('reference')), extract(same('razor'))), []);
});

test('a closed overlay leaves aria-controls naming a target that is not rendered, and that compares equal', () => {
  // The historical closed state: the trigger still names the overlay's future
  // id, and the overlay does not exist. It is recorded as #dangling rather than
  // by its literal, so three adapters agree - and it is not *valid* for that
  // reason. It is compared: a target that dangles where the reference
  // resolves, or resolves where the reference dangles, differs.
  const closed = one({ open: false });
  const reference = extract(closed('reference'));

  assert.equal(reference[0].children[0].attributes['aria-controls'], '#dangling');
  assert.deepEqual(against(closed)('current'), []);
  assert.deepEqual(against(closed)('razor'), []);
});

// --------------------------------------------------------- open-state edges

test('open: aria-controls resolves to the overlay and aria-labelledby resolves back to the trigger', () => {
  const [host, overlay] = extract(one()('razor'));
  const trigger = host.children[0];

  assert.equal(trigger.attributes['aria-controls'], overlay.attributes.id);
  assert.equal(overlay.attributes['aria-labelledby'], trigger.attributes.id);
});

test('open, two instances: each trigger and each overlay point at their own partner', () => {
  const [hostA, hostB, overlayA, overlayB] = extract(two()('razor'));

  assert.equal(hostA.children[0].attributes['aria-controls'], overlayA.attributes.id);
  assert.equal(overlayA.attributes['aria-labelledby'], hostA.children[0].attributes.id);
  assert.equal(hostB.children[0].attributes['aria-controls'], overlayB.attributes.id);
  assert.equal(overlayB.attributes['aria-labelledby'], hostB.children[0].attributes.id);
  assert.notEqual(overlayA.attributes.id, overlayB.attributes.id);
});

// ------------------------------------------------------------------ defects

const defects = {
  'A. aria-controls names the wrong overlay': [two(), { A: { wire: { controls: razor(1).m } } }, 'aria-controls'],
  'B. aria-labelledby names the wrong trigger': [two(), { A: { wire: { labelled: razor(1).t } } }, 'aria-labelledby'],
  'C. the two relationship values are swapped': [one(), { A: { wire: { controls: razor(0).t, labelled: razor(0).m } } }, 'aria-controls'],
  'E. overlay ids swapped between instances, references left behind': [two(), { A: { wire: { mid: razor(1).m } }, B: { wire: { mid: razor(0).m } } }, 'aria-controls'],
  'G. two triggers share one id': [two(), { B: { wire: { tid: razor(0).t } } }, 'id'],
  'I. the trigger has no id': [one(), { A: { wire: { tid: null } } }, 'id'],
  'K. the trigger has no aria-controls': [one(), { A: { wire: { controls: null } } }, 'aria-controls'],
  'L. the open overlay has no aria-labelledby': [one(), { A: { wire: { labelled: null } } }, 'aria-labelledby'],
};

for (const [name, [build, defect, detail]] of Object.entries(defects)) {
  test(`${name} is a relationship difference`, () => {
    const differences = against(build)('razor', defect);

    assert.ok(fired(differences, 'dom.relationships', detail), JSON.stringify(differences));
  });
}

test('D. trigger ids swapped between instances, references left behind, is caught on the reverse edges', () => {
  // Tokens are positional: trigger A is still the first id in the case whatever
  // literal it carries, so its id token does not move. What the swap breaks is
  // every reference that named the old literal - each overlay's
  // aria-labelledby now lands on the other trigger - and that is where it shows.
  const differences = against(two())('razor', { A: { wire: { tid: razor(1).t } }, B: { wire: { tid: razor(0).t } } });

  assert.ok(differences.every((entry) => entry.detail !== 'id'), 'the id tokens are positional and do not move');
  assert.ok(fired(differences, 'dom.relationships', 'aria-labelledby'), JSON.stringify(differences));
});

test('B and L are caught on the overlay itself - the node the old extractor never described', () => {
  // The masked false PASS. Before M28.0 these two defects produced exactly the
  // differences a correct target did, because the moved overlay was not part
  // of the case. They have to be caught *on the overlay*, not by coincidence.
  for (const defect of [{ A: { wire: { labelled: razor(1).t } } }, { A: { wire: { labelled: null } } }]) {
    const build = defect.A.wire.labelled === null ? one() : two();
    const differences = against(build)('razor', defect).filter((entry) => entry.detail === 'aria-labelledby');

    assert.ok(differences.length > 0);
    assert.ok(differences.every((entry) => entry.path.endsWith('div.vf-probe-overlay')), JSON.stringify(differences));
  }
});

test('F. two instances consistently cross-wired to each other are caught', () => {
  // Every id resolves, and every pair is internally consistent: trigger A <->
  // overlay B and trigger B <-> overlay A. Local consistency is not enough.
  const differences = against(two())('razor', {
    A: { wire: { controls: razor(1).m, labelled: razor(1).t } },
    B: { wire: { controls: razor(0).m, labelled: razor(0).t } },
  });

  assert.ok(fired(differences, 'dom.relationships', 'aria-controls'));
  assert.ok(fired(differences, 'dom.relationships', 'aria-labelledby'));
});

test('F. cross-wiring is caught even when both overlays have identical content', () => {
  // With identical content, the only thing that tells the overlays apart is
  // where each one is. This is what document-order numbering of followed
  // targets buys; see the mutation below.
  const same = '<button role="menuitem">Same</button>';
  const differences = against(two({ content: same }))('razor', {
    A: { wire: { controls: razor(1).m, labelled: razor(1).t } },
    B: { wire: { controls: razor(0).m, labelled: razor(0).t } },
  });

  assert.ok(fired(differences, 'dom.relationships', 'aria-controls'), JSON.stringify(differences));
});

test('H. two overlays sharing one id lose one overlay from the case', () => {
  const differences = against(two())('razor', { B: { wire: { mid: razor(0).m, controls: razor(0).m } } });

  assert.ok(fired(differences, 'dom.structure') || fired(differences, 'dom.relationships'), JSON.stringify(differences));
});

test('J. an open overlay with no id is unreachable, and the trigger dangles', () => {
  const differences = against(one())('razor', { A: { wire: { mid: null } } });

  assert.ok(fired(differences, 'dom.relationships', 'aria-controls'));
  assert.ok(fired(differences, 'dom.structure'), 'the overlay is no longer part of the case');
});

test('M. the relationship moved onto the wrong node is caught', () => {
  const differences = against(one())('razor', { A: { wire: { controls: null, innerControls: razor(0).m } } });

  assert.ok(fired(differences, 'dom.relationships', 'aria-controls'), JSON.stringify(differences));
});

test('N. an extra element carrying the referenced id does not make a wrong reference right', () => {
  // The trigger names an unrelated element inside the case rather than its
  // overlay. The reference resolves - but to the wrong node, and the overlay
  // it should have reached is no longer followed.
  //
  // The decoy happens to sit where the overlay did, so the trigger's
  // aria-controls token is the *same* on both sides. A token is a position, not
  // an identity: identity is the token together with the node described at
  // that position, and the node there is a span where the reference has the
  // overlay. That is why the relationship tokens and the structure are compared
  // together rather than either alone.
  const reference = extract(one()('reference'));
  const decoyed = extract(one()('razor', { A: { wire: { controls: 'decoy' } } }), { extra: '<span id="decoy">decoy</span>' });
  const differences = compareDom(reference, decoyed);

  assert.equal(decoyed[0].children[0].attributes['aria-controls'], reference[0].children[0].attributes['aria-controls']);
  assert.ok(fired(differences, 'dom.structure'), JSON.stringify(differences));
  assert.ok(fired(differences, 'dom.relationships', 'aria-labelledby'), 'the overlay the trigger should reach is gone');
});

test('an overlay rendered where the reference keeps it closed is a difference', () => {
  const differences = compareDom(extract(one({ open: false })('reference')), extract(one()('razor')));

  assert.ok(fired(differences, 'dom.relationships', 'aria-controls'));
  assert.ok(fired(differences, 'dom.structure'));
});

test('an overlay rendered in place where the reference moves it out of the case is a difference', () => {
  const differences = compareDom(extract(one()('reference')), extract(one({ teleport: false })('razor')));

  assert.ok(fired(differences, 'dom.structure'), JSON.stringify(differences));
});

// ------------------------------------------------ why the rejected designs fail

test('without a declaration, correct targets differ and a broken reverse relationship is invisible', () => {
  // The pre-M28.0 behaviour, kept as evidence rather than as a mode: undeclared
  // extraction is byte-for-byte what every existing profile still gets.
  const correct = against(one(), { follow: [] })('razor');
  const broken = against(one(), { follow: [] })('razor', { A: { wire: { labelled: null } } });

  assert.ok(correct.length > 0, 'the literal leaked through #outside-case: a false FAIL');
  assert.deepEqual(broken, correct, 'the missing aria-labelledby changed nothing: a false PASS');
});

test('normalising every generated id to one constant would pass consistent cross-wiring', () => {
  // The forbidden shortcut. Topology tokens are what make F fail.
  const constant = (dom) => JSON.parse(JSON.stringify(dom).replace(/#id\d+/g, '#generated'));
  const reference = constant(extract(two()('reference')));
  const crossWired = constant(
    extract(
      two()('razor', {
        A: { wire: { controls: razor(1).m, labelled: razor(1).t } },
        B: { wire: { controls: razor(0).m, labelled: razor(0).t } },
      }),
    ),
  );

  assert.ok(compareDom(reference, crossWired).every((entry) => entry.dimension !== 'dom.relationships'));
});

test('numbering followed targets in the order they are reached would pass identical-content cross-wiring', () => {
  // The mutation that proves the document-order sort is load-bearing. The
  // same extractor with the sort removed cannot tell the two overlays apart.
  const sortLine = /return followed\.sort\([^\n]*\);/;
  const real = extractCasesExpression({}, FOLLOW);
  assert.match(real, sortLine, 'the sort this test mutates is still where the test expects it');
  const reachOrder = real.replace(sortLine, 'return followed;');
  const same = '<button role="menuitem">Same</button>';
  const crossWired = {
    A: { wire: { controls: razor(1).m, labelled: razor(1).t } },
    B: { wire: { controls: razor(0).m, labelled: razor(0).t } },
  };

  const mutated = compareDom(
    extract(two({ content: same })('reference'), { expression: reachOrder }),
    extract(two({ content: same })('razor', crossWired), { expression: reachOrder }),
  );

  assert.deepEqual(mutated, [], 'without the sort the cross-wiring is invisible');
});

// ----------------------------------------------------------- fail-closed

test('a well-formed declaration has no problems, and no declaration is an empty one', () => {
  assert.deepEqual(followedReferenceProblems(FOLLOW), []);
  assert.deepEqual(followedReferenceProblems([]), []);
  assert.doesNotThrow(() => extractCasesExpression({}));
});

test('malformed declarations are refused before any page runs', () => {
  const refused = {
    'not an array': { source: '.vf-probe-trigger', attribute: 'aria-controls' },
    'no source': [{ attribute: 'aria-controls' }],
    'empty source': [{ source: '', attribute: 'aria-controls' }],
    'an attribute that is not an id reference': [{ source: '.vf-probe-trigger', attribute: 'aria-label' }],
    'an unknown field': [{ source: '.vf-probe-trigger', attribute: 'aria-controls', target: '.vf-probe-overlay' }],
    'the same rule twice': [FOLLOW[0], { ...FOLLOW[0] }],
    null: null,
  };

  for (const [name, declaration] of Object.entries(refused)) {
    assert.ok(followedReferenceProblems(declaration).length > 0, name);
    assert.throws(() => extractCasesExpression({}, declaration), /Malformed followedReferences/, name);
  }
});

test('a declared source the case does not render is refused, not skipped', () => {
  assert.throws(() => extract(one()('razor'), { follow: [{ source: '.missing', attribute: 'aria-controls' }] }), /matched nothing/);
});

test('a reference that follows into another case is refused', () => {
  const { window } = new JSDOM(
    '<!doctype html><body>' +
      '<div data-parity-case="one"><div class="vf-probe-trigger" id="t" aria-controls="m"></div></div>' +
      '<div data-parity-case="two"><div id="m">elsewhere</div><div class="vf-probe-trigger" id="t2"></div></div>' +
      '</body>',
    { runScripts: 'outside-only' },
  );

  assert.throws(() => window.eval(extractCasesExpression({}, FOLLOW)), /follows into another case/);
});
