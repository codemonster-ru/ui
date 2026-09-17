// What the VfBreadcrumbs catalog has to prove, read as semantics.
//
// The second coverage module for a component whose owned controls are anchors,
// and the first whose owned count is decided per item by a rule rather than
// per case by a prop. Three halves:
//
//   - the native half: the trail shapes (empty, one, several, five), the
//     current-selection rule (implicit last, explicit middle, two explicit
//     flags, the last item's href dropped), the link-selection rule (disabled,
//     disabled and current, no destination, an empty href), the rel derivation
//     (`_blank` without rel, `_blank` with rel, another target, rel alone), the
//     nav label (given, empty), the consumer attribute contract (class, style,
//     id, data-*, ARIA), the separator (default, text, markup);
//   - the ownership half: every case declares how many controls the component
//     itself renders, and that number is what the historical rule produces
//     for its items - not N-1, not the number of items with an href. A catalog
//     cannot buy the component a control for the current item, a disabled
//     item or an empty href, and cannot lose an anchor by under-declaring;
//   - the boundary half: the vocabulary is closed to the native branch. An
//     item that named `to`, a case that named `component`, or a case that
//     declared an interaction would be describing the Vue adapter's router
//     handoff or driving something the reference does not handle. All three
//     are rejected outright, by name.
//
// Violations are returned rather than asserted so a test can drive these with
// a deliberately eroded catalog and check which rule fired.
// The historical rule, restated here on purpose rather than imported from
// shared-core: the gate is what checks that the catalog's budgets say what the
// rule produces, and a gate that read the rule it was checking would agree
// with any drift in it. Explicit flags if any item carries one, else the last
// item; a link is an item that is not disabled, not current, and has a
// truthy href.
function currentFlags(list) {
  const explicit = list.some((item) => item.current === true);

  return list.map((item, index) => item.current === true || (!explicit && index === list.length - 1));
}

const PROPS = ['items', 'ariaLabel'];
const VUE_ONLY_PROPS = ['component'];
const ITEM_KEYS = ['label', 'href', 'target', 'rel', 'disabled', 'current'];
const VUE_ONLY_ITEM_KEYS = ['to'];
const CONTENT_KEYS = ['separator'];
const SEPARATOR_KEYS = ['text', 'markup'];
const MARKUP_SHAPES = ['label'];

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const items = (entry) => props(entry).items ?? [];
const separator = (entry) => entry.content?.separator;
const hasConsumerAria = (entry) => Object.keys(attrs(entry)).some((key) => key.startsWith('aria-') || key === 'role');

/** The number of items the historical rule renders as links. */
export function expectedOwnedAnchors(entry) {
  const current = currentFlags(items(entry));

  return items(entry).filter((item, index) => !item.disabled && !current[index] && Boolean(item.href)).length;
}

/** Every way the VfBreadcrumbs catalog's coverage can be eroded. */
export function breadcrumbsCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // ------------------------------------------------------------ vocabulary
  for (const entry of cases) {
    if (!entry.id?.startsWith('breadcrumbs/')) {
      violations.push(`${entry.id} is not a breadcrumbs case, so it cannot count towards breadcrumbs coverage`);
    }
    for (const name of Object.keys(props(entry))) {
      if (VUE_ONLY_PROPS.includes(name)) {
        violations.push(
          `${entry.id} declares prop [${name}], which replaces the Vue adapter's router component. That branch is a ` +
            'handoff to a component the reference never ships and a Razor target cannot render; it is pinned by ' +
            'VfBreadcrumbs.characterization.spec.ts and is not a cross-platform case',
        );
      } else if (!PROPS.includes(name)) {
        violations.push(`${entry.id} declares prop [${name}], which the reference VfBreadcrumbs does not have`);
      }
    }
    if (!Array.isArray(items(entry))) {
      violations.push(`${entry.id} declares items that are not a list`);
      continue;
    }
    for (const [index, item] of items(entry).entries()) {
      for (const key of Object.keys(item)) {
        if (VUE_ONLY_ITEM_KEYS.includes(key)) {
          violations.push(
            `${entry.id} item ${index} declares [${key}], which selects the Vue adapter's router branch for that item. ` +
              'It is pinned by VfBreadcrumbs.characterization.spec.ts and refused by name by the Razor component; it is ' +
              'not a cross-platform case',
          );
        } else if (!ITEM_KEYS.includes(key)) {
          violations.push(
            `${entry.id} item ${index} declares [${key}], which the reference VfBreadcrumbItem does not have`,
          );
        }
      }
      if (typeof item.label !== 'string') violations.push(`${entry.id} item ${index} has no string label`);
    }
    for (const name of Object.keys(entry.content ?? {})) {
      if (!CONTENT_KEYS.includes(name)) {
        violations.push(`${entry.id} puts [${name}] in the slot vocabulary; VfBreadcrumbs has one separator slot`);
      }
    }
    for (const name of Object.keys(separator(entry) ?? {})) {
      if (!SEPARATOR_KEYS.includes(name))
        violations.push(`${entry.id} puts [${name}] in the separator slot vocabulary`);
    }
    if (separator(entry)?.markup !== undefined && !MARKUP_SHAPES.includes(separator(entry).markup)) {
      violations.push(`${entry.id} names markup shape [${separator(entry).markup}], which no fixture renders`);
    }
    if (entry.interaction !== undefined) {
      violations.push(
        `${entry.id} declares an interaction. The reference handles no click and no key - activating a link is ` +
          "the browser's - so there is nothing of the component's to drive",
      );
    }
    if (entry.consumerInteractive !== undefined && entry.consumerInteractive !== 0) {
      violations.push(
        `${entry.id} declares ${entry.consumerInteractive} consumer control(s). No shared case puts a control in the ` +
          'separator: it would be focusable inside an aria-hidden wrapper, which is characterized and kept out of parity',
      );
    }
  }

  // ------------------------------------------------------------- ownership
  //
  // As many anchors as the historical rule makes links, decided per item.
  for (const entry of cases) {
    const declared = entry.componentInteractive;
    const expected = expectedOwnedAnchors(entry);

    if (!Number.isInteger(declared)) {
      violations.push(
        `${entry.id} declares no componentInteractive budget. Every breadcrumbs case owns as many anchors as the ` +
          'rule makes links, and a case that does not say how many cannot be measured against anything',
      );
    } else if (declared !== expected) {
      violations.push(
        `${entry.id} declares ${declared} component-owned control(s) but the historical rule renders ${expected} of ` +
          'its items as links: the current item, a disabled item and an item with no destination are spans',
      );
    }
  }

  // ---------------------------------------------------------------- shapes
  require('no shared breadcrumbs case renders an empty trail, so the empty landmark and list are never measured', (
    entry,
  ) => items(entry).length === 0);
  require('no shared breadcrumbs case renders one item, so the lone current span is never measured', (entry) =>
    items(entry).length === 1);
  require('no shared breadcrumbs case renders five or more items', (entry) => items(entry).length >= 5);
  require('no shared breadcrumbs case renders three items with two plain links and a current span', (entry) =>
    items(entry).length === 3 && expectedOwnedAnchors(entry) === 2 && items(entry)[2].href === undefined);

  // ------------------------------------------------------------- current
  require('no shared breadcrumbs case gives the last item an href without an explicit current, so the dropped href is never measured', (
    entry,
  ) =>
    items(entry).length >= 2 &&
    items(entry).every((item) => !item.current) &&
    typeof items(entry).at(-1).href === 'string' &&
    items(entry).at(-1).href !== '');
  require('no shared breadcrumbs case flags a middle item current, so an explicit current beside a last-item link is never measured', (
    entry,
  ) =>
    items(entry).some((item, index) => item.current === true && index < items(entry).length - 1) &&
    items(entry).at(-1).href);
  require('no shared breadcrumbs case flags two items current, so multiple aria-current are never measured', (entry) =>
    items(entry).filter((item) => item.current === true).length >= 2);
  require('no shared breadcrumbs case renders one item with an href, so its dropped href is never measured', (entry) =>
    items(entry).length === 1 && items(entry)[0].href);

  // --------------------------------------------------------------- links
  require('no shared breadcrumbs case renders a disabled item that is not current', (entry) =>
    items(entry).some((item, index) => item.disabled === true && !currentFlags(items(entry))[index]));
  require('no shared breadcrumbs case renders a disabled item that is current, so the modifier beside aria-current is never measured', (
    entry,
  ) => items(entry).some((item, index) => item.disabled === true && currentFlags(items(entry))[index]));
  require('no shared breadcrumbs case renders a middle item with no destination', (entry) =>
    items(entry).some(
      (item, index) => item.href === undefined && !item.disabled && index < items(entry).length - 1 && !item.current,
    ));
  require("no shared breadcrumbs case renders href='', so the truthiness rule that differs from VfLink is never measured", (
    entry,
  ) => items(entry).some((item) => item.href === ''));
  require('no shared breadcrumbs case renders an empty label, so a nameless link is never measured', (entry) =>
    items(entry).some((item) => item.label === '' && item.href));
  require('no shared breadcrumbs case renders two links to one destination', (entry) => {
    const hrefs = items(entry)
      .filter((item) => item.href)
      .map((item) => item.href);
    return new Set(hrefs).size < hrefs.length;
  });

  // ------------------------------------------------------------------ rel
  const anyItem = (predicate) => (entry) => items(entry).some(predicate);
  require('no shared breadcrumbs case renders target=_blank without rel, so the derived rel is never measured', anyItem(
    (item) => item.target === '_blank' && item.rel === undefined,
  ));
  require('no shared breadcrumbs case renders target=_blank with an explicit rel, so nothing proves the explicit value wins without merging', anyItem(
    (item) => item.target === '_blank' && typeof item.rel === 'string' && item.rel !== '',
  ));
  require('no shared breadcrumbs case renders another target without rel, so nothing proves the derivation is _blank-only', anyItem(
    (item) => typeof item.target === 'string' && item.target !== '_blank' && item.rel === undefined,
  ));
  require('no shared breadcrumbs case renders rel without target, so nothing proves an explicit rel is written on its own', anyItem(
    (item) => typeof item.rel === 'string' && item.rel !== '' && item.target === undefined,
  ));

  // ----------------------------------------------------------------- root
  require('no shared breadcrumbs case gives the nav a label, so the prop-driven name is never measured', (entry) =>
    typeof props(entry).ariaLabel === 'string' && props(entry).ariaLabel !== '');
  require('no shared breadcrumbs case gives the nav an empty label, so the empty attribute is never measured', (
    entry,
  ) => props(entry).ariaLabel === '');
  require('no shared breadcrumbs case forwards a consumer class, so nothing proves it lands after the block class', (
    entry,
  ) => attrs(entry).class !== undefined);
  require('no shared breadcrumbs case forwards an inline style', (entry) => attrs(entry).style !== undefined);
  require('no shared breadcrumbs case forwards an id', (entry) => attrs(entry).id !== undefined);
  require('no shared breadcrumbs case forwards a product data attribute', (entry) =>
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));
  require('no shared breadcrumbs case forwards aria-describedby, so a relationship out of the nav is never measured', (
    entry,
  ) => attrs(entry)['aria-describedby'] !== undefined);
  require("no shared breadcrumbs case renders without any consumer ARIA, so the component's own ARIA is never measured alone", (
    entry,
  ) => items(entry).length >= 2 && !hasConsumerAria(entry) && props(entry).ariaLabel === undefined);

  // ------------------------------------------------------------ separator
  require('no shared breadcrumbs case renders the default separator between two links, so the glyph is never measured', (
    entry,
  ) => separator(entry) === undefined && expectedOwnedAnchors(entry) >= 2);
  require('no shared breadcrumbs case puts text in the separator slot', (entry) =>
    separator(entry)?.text !== undefined && separator(entry).markup === undefined);
  require('no shared breadcrumbs case puts consumer markup in the separator slot', (entry) =>
    separator(entry)?.markup === 'label');

  // ---------------------------------------------------------------- visual
  const visual = cases.filter((entry) => entry.visual === true);
  const seen = [
    [
      'a plain trail with the default separator',
      (entry) =>
        items(entry).length === 3 &&
        separator(entry) === undefined &&
        attrs(entry).class === undefined &&
        expectedOwnedAnchors(entry) === 2,
    ],
    ['a lone current span', (entry) => items(entry).length === 1],
    [
      'an explicit current item beside a last-item link',
      (entry) => items(entry).some((item, index) => item.current === true && index < items(entry).length - 1),
    ],
    [
      'a disabled item, whose colour is the whole modifier',
      (entry) => items(entry).some((item) => item.disabled === true),
    ],
    ['a text separator', (entry) => separator(entry)?.text !== undefined && separator(entry).markup === undefined],
    ['consumer markup as the separator', (entry) => separator(entry)?.markup === 'label'],
    ['a five-item trail, which wraps', (entry) => items(entry).length >= 5],
  ];
  for (const [what, predicate] of seen) {
    if (!visual.some(predicate)) {
      violations.push(`no breadcrumbs screenshot renders ${what}, so its geometry or colour could move unseen`);
    }
  }

  return violations;
}
