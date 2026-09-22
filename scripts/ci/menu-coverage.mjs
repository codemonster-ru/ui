// What the VfMenu and VfMenuItem catalogs have to prove, read as semantics.
//
// Two catalogs and two exported rule sets, because the components own
// different things and folding them together is exactly the mistake the gate
// exists to prevent:
//
//   - VfMenu owns ZERO controls. Its budget rule is therefore about the
//     consumer's content only, and a menu case may not declare a
//     component-owned control at all. A menu case that put an element with an
//     explicit interactive role in its content is rejected too - not because
//     such a menu is wrong, but because the static-ownership posture asserts
//     that total is zero, and a catalog that needed the rule relaxed would be
//     buying coverage with a weaker invariant. What a menu holding items looks
//     like is pinned by the two characterization suites instead;
//   - VfMenuItem owns EXACTLY ONE control in every state, including both
//     disabled states. A case cannot lose the control by declaring zero and
//     cannot buy a second by declaring two.
//
// The vocabularies are closed. A menu case naming a prop is rejected because
// the reference declares none; a menu-item case naming `to`, `component` or a
// slot is rejected because the reference has none of those either - and unlike
// VfLink and VfBreadcrumbs that is not a Vue-only branch being held back, it
// is a branch that does not exist. An interaction on either is rejected: the
// menu handles nothing, and the item's only handler emits a Vue event that
// changes no DOM.
//
// Violations are returned rather than asserted so a test can drive these with
// a deliberately eroded catalog and check which rule fired.

const MENU_CHILDREN = ['none', 'text', 'spans', 'nested', 'button'];
const FOCUSABLE_CHILDREN = ['button'];

const ITEM_PROPS = ['label', 'icon', 'disabled', 'active', 'tone', 'href', 'target', 'rel'];
const ITEM_ABSENT_PROPS = ['to', 'component', 'selected', 'value', 'shortcut', 'description', 'download'];

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const content = (entry) => entry.content ?? {};
const isLink = (entry) => typeof props(entry).href === 'string' && props(entry).href !== '';
const hasConsumerAria = (entry) => Object.keys(attrs(entry)).some((key) => key.startsWith('aria-') || key === 'role');

/** Every way the VfMenu catalog's coverage can be eroded. */
export function menuCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // ------------------------------------------------------------ vocabulary
  for (const entry of cases) {
    if (!entry.id?.startsWith('menu/')) {
      violations.push(`${entry.id} is not a menu case, so it cannot count towards menu coverage`);
    }
    for (const name of Object.keys(props(entry))) {
      violations.push(
        `${entry.id} declares prop [${name}], and the reference VfMenu declares no props at all. Everything a ` +
          'consumer passes is an attr, and putting it in `props` would hide that',
      );
    }
    for (const name of Object.keys(content(entry))) {
      if (name !== 'children') {
        violations.push(`${entry.id} puts [${name}] in the slot vocabulary; VfMenu has one unscoped default slot`);
      }
    }
    const children = content(entry).children;
    if (children !== undefined && !MENU_CHILDREN.includes(children)) {
      violations.push(`${entry.id} names consumer content [${children}], which no fixture renders`);
    }
    if (entry.interaction !== undefined) {
      violations.push(
        `${entry.id} declares an interaction. VfMenu handles no click and no key - the arrows, Escape and ` +
          'focus-on-open belong to VfDropdown - so there is nothing of the component\'s to drive',
      );
    }
    if (entry.componentInteractive !== undefined) {
      violations.push(
        `${entry.id} declares a componentInteractive budget. VfMenu owns no control, and its evidence is the ` +
          'static-ownership posture, where every focusable element is the consumer\'s. Declaring one here would be ' +
          'the catalog claiming the menu renders a control it does not',
      );
    }
  }

  // ------------------------------------------------------------- ownership
  //
  // The consumer budget has to equal what the named content actually renders,
  // plus the root itself when a consumer tabindex makes it focusable.
  for (const entry of cases) {
    const declared = entry.consumerInteractive;
    const fromChildren = FOCUSABLE_CHILDREN.includes(content(entry).children ?? 'none') ? 1 : 0;
    const fromRoot = attrs(entry).tabindex !== undefined ? 1 : 0;
    const expected = fromChildren + fromRoot;

    if (!Number.isInteger(declared)) {
      violations.push(
        `${entry.id} declares no consumerInteractive budget. The static-ownership stage asserts the focusable ` +
          'count against this number, so a case without one cannot be measured against anything',
      );
    } else if (declared !== expected) {
      violations.push(
        `${entry.id} declares ${declared} consumer control(s) but its content and attrs render ${expected}; the ` +
          'ownership stage is asserted against the declaration, so the two must agree',
      );
    }
  }

  // --------------------------------------------------------------- content
  require('no shared menu case is empty, so a menu with nothing in it is never measured', (entry) =>
    (content(entry).children ?? 'none') === 'none');
  require('no shared menu case renders a bare text child, so nothing proves the slot is unwrapped', (entry) =>
    content(entry).children === 'text');
  require('no shared menu case renders several children, so nothing proves the menu adds no wrapper or separator', (
    entry,
  ) => content(entry).children === 'spans');
  require('no shared menu case renders nested consumer markup, so nothing proves depth is preserved', (entry) =>
    content(entry).children === 'nested');
  require(
    'no shared menu case puts a consumer control in the menu, so the static-ownership budget is never exercised ' +
      'against a non-zero number and a component that grew a control of its own would pass on every target',
    (entry) => content(entry).children === 'button' && entry.consumerInteractive === 1,
  );

  // ----------------------------------------------------------------- attrs
  require('no shared menu case forwards an id', (entry) => attrs(entry).id !== undefined);
  require('no shared menu case forwards a product data attribute', (entry) =>
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));
  require(
    'no shared menu case forwards a consumer class, so nothing proves it lands AFTER the block class - the ' +
      "position that is the inverse of VfMenuItem's and may not be normalised",
    (entry) => attrs(entry).class !== undefined,
  );
  require('no shared menu case forwards an inline style', (entry) => attrs(entry).style !== undefined);
  require('no shared menu case forwards aria-label, so the menu never has an accessible name to compare', (entry) =>
    attrs(entry)['aria-label'] !== undefined);
  require('no shared menu case forwards aria-describedby, so a relationship out of the menu is never measured', (
    entry,
  ) => attrs(entry)['aria-describedby'] !== undefined);
  require(
    'no shared menu case forwards a tabindex, so nothing proves the component writes none of its own and a ' +
      'consumer can make the root focusable',
    (entry) => attrs(entry).tabindex !== undefined,
  );
  require(
    'no shared menu case overrides role, so the load-bearing quirk - attrs are bound LAST, so role="menu" is ' +
      'replaceable - is never measured. This is the inverse of VfMenuItem and the one thing VfMenu decides',
    (entry) => attrs(entry).role !== undefined,
  );
  require("no shared menu case renders without any consumer ARIA, so the menu's own role is never measured alone", (
    entry,
  ) => !hasConsumerAria(entry));

  // ---------------------------------------------------------------- visual
  const visual = cases.filter((entry) => entry.visual === true);
  // The empty menu is deliberately not among these. A flex column with no
  // children, no padding and no border has no box at all, so there is nothing
  // to capture - the browser refuses a zero-height screenshot - and its
  // evidence is the DOM, ARIA and ownership dimensions instead.
  const seen = [
    ['a menu with several children, whose gap is the whole of its own geometry', (entry) =>
      content(entry).children === 'spans'],
    ['a menu with nested consumer markup', (entry) => content(entry).children === 'nested'],
    ['a menu with a consumer class and style', (entry) => attrs(entry).class !== undefined],
    ['a menu holding a consumer control', (entry) => content(entry).children === 'button'],
  ];
  for (const [what, predicate] of seen) {
    if (!visual.some(predicate)) {
      violations.push(`no menu screenshot renders ${what}, so its geometry or colour could move unseen`);
    }
  }

  return violations;
}

/** Every way the VfMenuItem catalog's coverage can be eroded. */
export function menuItemCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // ------------------------------------------------------------ vocabulary
  for (const entry of cases) {
    if (!entry.id?.startsWith('menu-item/')) {
      violations.push(`${entry.id} is not a menu-item case, so it cannot count towards menu-item coverage`);
    }
    for (const name of Object.keys(props(entry))) {
      if (ITEM_ABSENT_PROPS.includes(name)) {
        violations.push(
          `${entry.id} declares prop [${name}], which the reference VfMenuItem does not have. Unlike VfLink and ` +
            'VfBreadcrumbs this component has no router branch being held back: the prop simply does not exist, ' +
            'and a case naming it would be the catalog inventing API',
        );
      } else if (!ITEM_PROPS.includes(name)) {
        violations.push(`${entry.id} declares prop [${name}], which the reference VfMenuItem does not have`);
      }
    }
    if (typeof props(entry).label !== 'string') {
      violations.push(`${entry.id} declares no label, which is a required prop and the item's whole accessible name`);
    }
    if (Object.keys(content(entry)).length > 0) {
      violations.push(
        `${entry.id} declares slot content. VfMenuItem has no slots at all - its label is a prop rendered into a ` +
          'span - so a case with content would describe a component that does not exist',
      );
    }
    if (entry.interaction !== undefined) {
      violations.push(
        `${entry.id} declares an interaction. The only handler the component owns emits a Vue event and changes ` +
          'no DOM and no state, so a three-way live comparison of it would be comparing nothing',
      );
    }
  }

  // ------------------------------------------------------------- ownership
  //
  // Exactly one owned control per case, in all four states, and no consumer
  // control anywhere: the component has no slot to put one in.
  for (const entry of cases) {
    const declared = entry.componentInteractive;

    if (!Number.isInteger(declared)) {
      violations.push(
        `${entry.id} declares no componentInteractive budget. Every menu-item case owns exactly one control, and ` +
          'a case that does not say so cannot be measured against anything',
      );
    } else if (declared !== 1) {
      violations.push(
        `${entry.id} declares ${declared} component-owned control(s). VfMenuItem renders exactly one in every ` +
          'state - an enabled or disabled button, an enabled or disabled anchor - and never zero or two',
      );
    }

    const consumer = entry.consumerInteractive ?? 0;
    if (consumer !== 0) {
      violations.push(
        `${entry.id} declares ${consumer} consumer control(s), but VfMenuItem has no slot, so a consumer cannot ` +
          'put a control inside it and the ownership totals would not add up',
      );
    }
  }

  // -------------------------------------------------------------- branches
  require('no shared menu-item case renders the button branch, so the default shape is never measured', (entry) =>
    props(entry).href === undefined && props(entry).disabled !== true);
  require('no shared menu-item case renders the anchor branch, so a destination is never measured', (entry) =>
    isLink(entry) && props(entry).disabled !== true);
  require(
    'no shared menu-item case renders a disabled button, so the native disabled attribute beside aria-disabled - ' +
      'and the absence of a tabindex - is never measured',
    (entry) => props(entry).href === undefined && props(entry).disabled === true,
  );
  require(
    'no shared menu-item case renders a disabled anchor, so the quirk that carries this component - href dropped, ' +
      'target and rel kept, tabindex -1, no disabled attribute - is never measured',
    (entry) => isLink(entry) && props(entry).disabled === true,
  );
  require(
    "no shared menu-item case renders href='', so the truthiness branch test is never measured and nothing " +
      'separates this component from VfLink, which keeps an empty href on its anchor',
    (entry) => props(entry).href === '',
  );

  // ------------------------------------------------------------- modifiers
  require('no shared menu-item case renders active', (entry) => props(entry).active === true);
  require('no shared menu-item case renders tone=danger', (entry) => props(entry).tone === 'danger');
  require('no shared menu-item case renders active and danger together, so their order is never measured', (entry) =>
    props(entry).active === true && props(entry).tone === 'danger');
  require(
    'no shared menu-item case renders a disabled item that is also active and danger, so nothing proves disabled ' +
      'neither clears the other modifiers nor adds one of its own',
    (entry) => props(entry).disabled === true && props(entry).active === true && props(entry).tone === 'danger',
  );
  require('no shared menu-item case renders the defaults with no modifier at all', (entry) =>
    props(entry).active === undefined && props(entry).tone === undefined && props(entry).icon === undefined);

  // ------------------------------------------------------------------- rel
  require(
    'no shared menu-item case renders target=_blank without rel, so the boundary that carries this milestone - ' +
      'this component derives NO rel where VfLink derives noopener noreferrer - is never measured',
    (entry) => props(entry).target === '_blank' && props(entry).rel === undefined,
  );
  require('no shared menu-item case renders target=_blank with an explicit rel, so nothing proves the value is written as given', (
    entry,
  ) => props(entry).target === '_blank' && typeof props(entry).rel === 'string' && props(entry).rel !== '');
  require('no shared menu-item case renders another target, so nothing proves target is written as given on its own', (
    entry,
  ) => typeof props(entry).target === 'string' && props(entry).target !== '_blank');

  // ------------------------------------------------------------------ icon
  require('no shared menu-item case renders a glyph, so the icon markup is never measured', (entry) =>
    typeof props(entry).icon === 'string' && props(entry).icon !== '');
  require('no shared menu-item case renders a glyph on the anchor branch, so nothing proves the icon markup is the same on both', (
    entry,
  ) => isLink(entry) && typeof props(entry).icon === 'string');
  require(
    'no shared menu-item case renders a camel-case glyph name, so nothing proves both public spellings of a name ' +
      'reach one glyph on both platforms',
    (entry) => typeof props(entry).icon === 'string' && /[A-Z]/.test(props(entry).icon),
  );
  require(
    'no shared menu-item case renders a glyph name no registry holds, so the moon fallback is never measured - ' +
      'and it is reachable public behaviour, because the prop accepts an arbitrary string',
    (entry) => props(entry).icon === 'no-such-glyph',
  );

  // ----------------------------------------------------------------- attrs
  require('no shared menu-item case forwards an id', (entry) => attrs(entry).id !== undefined);
  require('no shared menu-item case forwards a product data attribute', (entry) =>
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));
  require(
    'no shared menu-item case forwards a consumer class beside a modifier, so nothing proves it lands BEFORE the ' +
      "block class - the position that is the inverse of VfMenu's and VfLink's and may not be normalised",
    (entry) => attrs(entry).class !== undefined && props(entry).active === true,
  );
  require('no shared menu-item case forwards an inline style', (entry) => attrs(entry).style !== undefined);
  require('no shared menu-item case forwards aria-label, so a consumer name replacing the label is never measured', (
    entry,
  ) => attrs(entry)['aria-label'] !== undefined);
  require('no shared menu-item case forwards aria-describedby, so a relationship out of the control is never measured', (
    entry,
  ) => attrs(entry)['aria-describedby'] !== undefined);
  require(
    'no shared menu-item case forwards a role, so the load-bearing quirk - attrs are bound FIRST, so ' +
      'role="menuitem" is NOT replaceable - is never measured. This is the inverse of VfMenu',
    (entry) => attrs(entry).role !== undefined,
  );
  require(
    'no shared menu-item case forwards a tabindex to the button branch, so nothing proves a consumer value ' +
      'survives where that branch binds none',
    (entry) => attrs(entry).tabindex !== undefined && props(entry).href === undefined,
  );
  require(
    'no shared menu-item case forwards a tabindex to an enabled anchor, so nothing proves that branch removes it ' +
      'by binding undefined over it - the half of the pair that makes the two branches genuinely differ',
    (entry) => attrs(entry).tabindex !== undefined && isLink(entry) && props(entry).disabled !== true,
  );
  require("no shared menu-item case renders without any consumer ARIA, so the control's own silence is never measured", (
    entry,
  ) => !hasConsumerAria(entry));

  // ---------------------------------------------------------------- visual
  const visual = cases.filter((entry) => entry.visual === true);
  const seen = [
    [
      'a plain button item',
      (entry) =>
        props(entry).href === undefined &&
        props(entry).disabled !== true &&
        props(entry).active === undefined &&
        props(entry).tone === undefined &&
        props(entry).icon === undefined,
    ],
    ['an anchor item', (entry) => isLink(entry) && props(entry).disabled !== true],
    ['a disabled button, whose colours and cursor are the whole modifier', (entry) =>
      props(entry).href === undefined && props(entry).disabled === true],
    ['a disabled anchor, which the same CSS rule has to reach through aria-disabled', (entry) =>
      isLink(entry) && props(entry).disabled === true],
    ['an active item, whose surface is painted', (entry) => props(entry).active === true],
    ['the danger tone', (entry) => props(entry).tone === 'danger'],
    ['a glyph, whose box is sized by the icon token and whose border width comes from the overlay token', (entry) =>
      typeof props(entry).icon === 'string'],
  ];
  for (const [what, predicate] of seen) {
    if (!visual.some(predicate)) {
      violations.push(`no menu-item screenshot renders ${what}, so its geometry or colour could move unseen`);
    }
  }

  return violations;
}
