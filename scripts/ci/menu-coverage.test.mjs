// The VfMenu and VfMenuItem catalogs cannot quietly shrink, cannot invent API
// the reference does not have, and cannot buy or lose a control through their
// ownership declarations.
//
// This is the M27 gate, and the attacks that matter here are the ones that
// come from the two components being migrated together:
//
//   A. a menu case declaring a component-owned control - the menu claiming
//      credit for a control that is VfMenuItem's or the consumer's;
//   B. a menu-item case declaring zero or two owned controls - the item losing
//      its control, or a catalog padding the count;
//   C. the role cases dropped from either catalog, which is what erases the
//      attrs-ordering inversion between the two components;
//   D. the rel case dropped, which is what erases the VfLink boundary;
//   E. a menu-item case naming `to` or `component` - API this component, unlike
//      VfLink and VfBreadcrumbs, does not have at all;
//   F. an interaction declared on either component, neither of which owns one;
//   G. padding: cases added in equal number that satisfy nothing new.
//
// Each has to fail semantically, naming the rule that stopped being proved.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { menuCoverageViolations, menuItemCoverageViolations } from './menu-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

const MENU_FLOOR = 10;
const ITEM_FLOOR = 20;

/** Menu cases that satisfy nothing new: three spans and a data attribute. */
function menuPadding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `menu/padding-${index}`,
    title: `padding ${index}`,
    props: {},
    attrs: { 'data-padding': String(index) },
    content: { children: 'spans' },
    consumerInteractive: 0,
    visual: false,
  }));
}

/** Menu-item cases that satisfy nothing new: plain buttons with a data attribute. */
function itemPadding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `menu-item/padding-${index}`,
    title: `padding ${index}`,
    props: { label: `Padding ${index}` },
    attrs: { 'data-padding': String(index) },
    componentInteractive: 1,
    consumerInteractive: 0,
    visual: false,
  }));
}

const fired = (violations, fragment) => violations.some((violation) => violation.includes(fragment));

test('the shipped menu catalog satisfies every rule', () => {
  assert.deepEqual(menuCoverageViolations(load('menu')), []);
});

test('the shipped menu-item catalog satisfies every rule', () => {
  assert.deepEqual(menuItemCoverageViolations(load('menu-item')), []);
});

test('both catalogs carry enough cases to be worth gating', () => {
  assert.ok(load('menu').length >= MENU_FLOOR, 'the menu catalog has shrunk below its floor');
  assert.ok(load('menu-item').length >= ITEM_FLOOR, 'the menu-item catalog has shrunk below its floor');
});

test('A: a menu case may not declare a component-owned control', () => {
  const cases = load('menu').map((entry) =>
    entry.id === 'menu/spans' ? { ...entry, componentInteractive: 1 } : entry,
  );

  assert.ok(
    fired(menuCoverageViolations(cases), 'VfMenu owns no control'),
    'a menu claiming an owned control has to be rejected: the controls inside a menu are VfMenuItem\'s or the consumer\'s',
  );
});

test('A: a menu case may not misdeclare the consumer budget', () => {
  const dropped = load('menu').map((entry) =>
    entry.id === 'menu/consumer-control' ? { ...entry, consumerInteractive: 0 } : entry,
  );
  const invented = load('menu').map((entry) =>
    entry.id === 'menu/spans' ? { ...entry, consumerInteractive: 1 } : entry,
  );

  assert.ok(fired(menuCoverageViolations(dropped), 'consumer control(s) but its content and attrs render'));
  assert.ok(fired(menuCoverageViolations(invented), 'consumer control(s) but its content and attrs render'));
});

test('B: a menu-item case may not lose or duplicate its one owned control', () => {
  for (const budget of [0, 2]) {
    const cases = load('menu-item').map((entry) =>
      entry.id === 'menu-item/button' ? { ...entry, componentInteractive: budget } : entry,
    );

    assert.ok(
      fired(menuItemCoverageViolations(cases), 'renders exactly one in every'),
      `a menu item declaring ${budget} owned controls has to be rejected`,
    );
  }
});

test('B: a menu-item case may not declare a consumer control it has no slot to hold', () => {
  const cases = load('menu-item').map((entry) =>
    entry.id === 'menu-item/button' ? { ...entry, consumerInteractive: 1 } : entry,
  );

  assert.ok(fired(menuItemCoverageViolations(cases), 'has no slot'));
});

test('C: dropping either role case erases the attrs-ordering inversion', () => {
  const menu = load('menu').filter((entry) => entry.id !== 'menu/role-override');
  const item = load('menu-item').filter((entry) => entry.id !== 'menu-item/consumer-role-loses');

  assert.ok(
    fired(menuCoverageViolations([...menu, ...menuPadding(1)]), 'role="menu" is replaceable'),
    'the menu role override is what proves attrs are bound last',
  );
  assert.ok(
    fired(menuItemCoverageViolations([...item, ...itemPadding(1)]), 'is NOT replaceable'),
    'the item role attempt is what proves attrs are bound first',
  );
});

test('D: dropping the _blank case erases the VfLink rel boundary', () => {
  const cases = load('menu-item').filter((entry) => entry.id !== 'menu-item/blank-without-rel');

  assert.ok(
    fired(menuItemCoverageViolations([...cases, ...itemPadding(1)]), 'derives NO rel where VfLink derives'),
    'the _blank-without-rel case is the one that separates this component from VfLink',
  );
});

test('D: dropping the empty-href case erases the branch boundary', () => {
  const cases = load('menu-item').filter((entry) => entry.id !== 'menu-item/empty-href');

  assert.ok(fired(menuItemCoverageViolations([...cases, ...itemPadding(1)]), 'truthiness branch test'));
});

test('D: dropping the disabled-anchor case erases the quirk that carries the component', () => {
  const cases = load('menu-item').filter((entry) => entry.id !== 'menu-item/anchor-disabled');

  assert.ok(fired(menuItemCoverageViolations([...cases, ...itemPadding(1)]), 'href dropped, target and rel kept'));
});

test('D: dropping the unknown-icon case erases the moon fallback', () => {
  const cases = load('menu-item').filter((entry) => entry.id !== 'menu-item/icon-unknown');

  assert.ok(fired(menuItemCoverageViolations([...cases, ...itemPadding(1)]), 'moon fallback is never measured'));
});

test('E: a menu-item case may not name API the reference does not have', () => {
  for (const name of ['to', 'component', 'selected', 'value']) {
    const cases = load('menu-item').map((entry) =>
      entry.id === 'menu-item/button' ? { ...entry, props: { ...entry.props, [name]: 'x' } } : entry,
    );

    assert.ok(
      fired(menuItemCoverageViolations(cases), `declares prop [${name}]`),
      `[${name}] is not a VfMenuItem prop and a case naming it invents API`,
    );
  }
});

test('E: a menu case may not name a prop at all', () => {
  const cases = load('menu').map((entry) =>
    entry.id === 'menu/spans' ? { ...entry, props: { orientation: 'vertical' } } : entry,
  );

  assert.ok(fired(menuCoverageViolations(cases), 'declares no props at all'));
});

test('E: a menu-item case may not declare slot content', () => {
  const cases = load('menu-item').map((entry) =>
    entry.id === 'menu-item/button' ? { ...entry, content: { text: 'Edit' } } : entry,
  );

  assert.ok(fired(menuItemCoverageViolations(cases), 'has no slots at all'));
});

test('F: neither component may declare an interaction', () => {
  const menu = load('menu').map((entry) =>
    entry.id === 'menu/spans' ? { ...entry, interaction: { key: 'ArrowDown' } } : entry,
  );
  const item = load('menu-item').map((entry) =>
    entry.id === 'menu-item/button' ? { ...entry, interaction: { click: true } } : entry,
  );

  assert.ok(fired(menuCoverageViolations(menu), 'VfMenu handles no click and no key'));
  assert.ok(fired(menuItemCoverageViolations(item), 'emits a Vue event'));
});

test('G: padding cannot restore coverage a deleted case was carrying', () => {
  const menu = load('menu').filter((entry) => !['menu/role-override', 'menu/tabindex'].includes(entry.id));
  const item = load('menu-item').filter(
    (entry) => !['menu-item/blank-without-rel', 'menu-item/icon-unknown'].includes(entry.id),
  );

  const menuViolations = menuCoverageViolations([...menu, ...menuPadding(2)]);
  const itemViolations = menuItemCoverageViolations([...item, ...itemPadding(2)]);

  assert.equal(menu.length + 2, load('menu').length, 'the padded menu catalog is the same size as the shipped one');
  assert.equal(item.length + 2, load('menu-item').length, 'the padded item catalog is the same size');
  assert.ok(menuViolations.length >= 2, 'equal-count padding must not restore the menu rules');
  assert.ok(itemViolations.length >= 2, 'equal-count padding must not restore the item rules');
});

test('the two catalogs stay separate: neither accepts the other\'s cases', () => {
  assert.ok(fired(menuCoverageViolations(load('menu-item')), 'is not a menu case'));
  assert.ok(fired(menuItemCoverageViolations(load('menu')), 'is not a menu-item case'));
});
