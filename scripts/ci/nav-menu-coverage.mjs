// What the VfNavMenu catalog has to prove, read as semantics (M33).
//
// The first recursive catalog. The gate holds three things at once:
//
//   - the vocabularies are closed. A prop the reference does not have, an
//     item key it does not read - `to` above all, the router branch the Razor
//     adapter refuses - a content key no fixture renders, a step, key or
//     expectation the harness does not drive or measure, a click on a
//     target=_blank link (it would open a second page) or on a natively
//     disabled control (no pointer reaches it) - each is refused;
//   - the ownership budgets are derived, not trusted. The visible tree is
//     computed from the reference's own rules - the ancestry of the value,
//     the toggle, single mode, selection - and every case and every scenario
//     must declare exactly the branches, buttons and links it renders; a
//     scenario's expected expanded and current labels, events and hash are
//     checked against the same simulation;
//   - every place the nav menu's contract could be ported wrong is exercised
//     by a case that could only pass if it held.
//
// Violations are returned rather than asserted so a test can drive this with a
// deliberately eroded catalog and check which rule fired.

const ITEM_KEYS = ['value', 'label', 'kind', 'leadingIcon', 'href', 'target', 'rel', 'disabled', 'children'];
const itemProblem = (item, where) => {
  if (item === null || typeof item !== 'object' || Array.isArray(item)) return `${where} is not an item`;
  if (typeof item.value !== 'string' || typeof item.label !== 'string')
    return `${where} needs a string value and label`;
  if ('to' in item) return `${where} uses \`to\`: the router branch is Vue-only and outside the catalog`;
  const unknown = Object.keys(item).find((key) => !ITEM_KEYS.includes(key));
  if (unknown) return `${where} carries an unknown key [${unknown}]`;
  if (item.kind !== undefined && item.kind !== 'item' && item.kind !== 'group') return `${where} has an unknown kind`;
  for (const key of ['leadingIcon', 'href', 'target', 'rel']) {
    if (item[key] !== undefined && typeof item[key] !== 'string') return `${where}.${key} is not a string`;
  }
  if (item.disabled !== undefined && typeof item.disabled !== 'boolean') return `${where}.disabled is not a boolean`;
  if (item.href !== undefined && item.href !== '' && !item.href.startsWith('#')) {
    return `${where}.href is not a hash link: a click would leave the page`;
  }
  if (item.children !== undefined) {
    if (!Array.isArray(item.children)) return `${where}.children is not a list`;
    for (const [index, child] of item.children.entries()) {
      const problem = itemProblem(child, `${where}.children[${index}]`);
      if (problem) return problem;
    }
  }
  return null;
};
const PROPS = {
  items: (value) => Array.isArray(value),
  defaultValue: (value) => typeof value === 'string',
  modelValue: (value) => typeof value === 'string',
  ariaLabel: (value) => typeof value === 'string',
  expandMode: (value) => value === 'multiple' || value === 'single',
  variant: (value) => ['default', 'pills', 'sidebar'].includes(value),
  compact: (value) => typeof value === 'boolean',
};
const CONTENT = {
  box: (value) => Number.isInteger(value) && value > 0,
  boxes: (value) => Array.isArray(value) && value.every((width) => Number.isInteger(width) && width > 0),
};
const KEYS = ['Enter', ' ', 'Tab', 'ArrowDown'];
const EXPECT = [
  'expandedLabels',
  'currentLabels',
  'events',
  'locationHash',
  'settled',
  'focusItem',
  'keydownPrevented',
];

// ---------------------------------------------------------------- the model
// The reference's rules, written out once more for the gate. They are pinned
// against the reference by the characterization suite and the shared vectors;
// here they only derive what a case renders.
const isGroup = (item) => item.kind === 'group';
const isBranch = (item) => !isGroup(item) && Boolean(item.children?.length);
function ancestors(items, value, parents = []) {
  if (!value) return [];
  for (const item of items) {
    if (item.value === value) return parents;
    if (item.children?.length) {
      const found = ancestors(item.children, value, [...parents, item.value]);
      if (found.length) return found;
    }
  }
  return [];
}
const synced = (items, expanded, active) => [...new Set([...expanded, ...ancestors(items, active)])];
function atPath(items, path) {
  if (!path.length) return items;
  const match = items.find((item) => item.value === path[0]);
  return match?.children?.length ? atPath(match.children, path.slice(1)) : [];
}
const branchValues = (items) =>
  items.flatMap((item) => {
    const below = item.children?.length ? branchValues(item.children) : [];
    return isBranch(item) ? [item.value, ...below] : below;
  });
function toggle(items, expanded, value, parentPath, mode) {
  if (expanded.includes(value)) return expanded.filter((entry) => entry !== value);
  let next = [...expanded];
  if (mode === 'single') {
    const siblings = atPath(items, parentPath)
      .filter((item) => item.value !== value && isBranch(item))
      .flatMap((item) => branchValues([item]));
    next = next.filter((entry) => !siblings.includes(entry));
  }
  return [...next, value];
}
/** Every rendered control - not the groups - with its parent path, in document order. */
function controls(items, expanded, parentPath = []) {
  return items.flatMap((item) => {
    const self = isGroup(item) ? [] : [{ item, parentPath }];
    const open = isGroup(item) ? Boolean(item.children?.length) : isBranch(item) && expanded.includes(item.value);
    return [...self, ...(open ? controls(item.children, expanded, [...parentPath, item.value]) : [])];
  });
}

/** Runs a case's steps against the model; throws on a step the harness cannot drive. */
export function simulate(props, steps = []) {
  const items = props.items ?? [];
  let active = props.modelValue ?? props.defaultValue;
  let expanded = synced(items, [], active);
  let focus = null;
  let hash = '';
  const events = [];
  const keys = [];
  const activate = (entry) => {
    const { item, parentPath } = entry;
    if (isBranch(item)) {
      expanded = toggle(items, expanded, item.value, parentPath, props.expandMode ?? 'multiple');
      return;
    }
    if (item.disabled) return;
    active = item.value;
    expanded = synced(items, expanded, item.value);
    events.push({ instance: 0, value: item.value });
    if (item.href !== undefined) hash = item.href;
  };
  for (const step of steps) {
    const visible = controls(items, expanded);
    if (step.action === 'clickButton' || step.action === 'focusButton') {
      const entry = visible[step.index];
      if (!entry) throw new Error(`step targets item ${step.index}, which is not rendered`);
      if (step.action === 'clickButton') {
        if (entry.item.disabled && !(entry.item.href !== undefined && !isBranch(entry.item))) {
          throw new Error(`step clicks the natively disabled ${entry.item.label}, which no pointer reaches`);
        }
        if (entry.item.target === '_blank' && entry.item.href !== undefined && !isBranch(entry.item)) {
          throw new Error(`step clicks the _blank link ${entry.item.label}, which would open a second page`);
        }
        focus = entry.item.label;
        activate(entry);
      } else {
        focus = entry.item.label;
      }
    } else if (step.action === 'pressKey') {
      keys.push(`${step.key}:false`);
      const index = visible.findIndex((entry) => entry.item.label === focus);
      if (step.key === 'Enter' || step.key === ' ') {
        if (index >= 0) activate(visible[index]);
      } else if (step.key === 'Tab') {
        const next = visible.slice(index + 1).find((entry) => !entry.item.disabled);
        focus = next?.item.label ?? null;
      }
    }
  }
  const rendered = controls(items, expanded);
  return {
    budget: rendered.length,
    expandedLabels: rendered
      .filter(({ item }) => isBranch(item) && expanded.includes(item.value))
      .map(({ item }) => item.label),
    currentLabels: rendered
      .filter(({ item }) => !isBranch(item) && item.value === active)
      .map(({ item }) => `${item.label}:page`),
    events,
    locationHash: hash,
    focusItem: focus === null ? 'body' : `item:${focus}`,
    keydownPrevented: keys,
  };
}

export function stepProblem(step) {
  if (step.action === 'clickButton' || step.action === 'focusButton') {
    if (step.selector !== '.vf-nav-menu__item') return `${step.action} targets ${step.selector}`;
    if (!Number.isInteger(step.index) || step.index < 0) return `${step.action} has no index`;
    if (Object.keys(step).some((key) => !['action', 'selector', 'index'].includes(key)))
      return `${step.action} carries an unknown key`;
    return null;
  }
  if (step.action === 'pressKey')
    return KEYS.includes(step.key) ? null : `pressKey ${JSON.stringify(step.key)} is not in the vocabulary`;
  return `unknown step ${step.action}`;
}

/** The budget a case declares for its initial render, derived. */
export function derivedCaseBudget(parityCase) {
  const members = Array.isArray(parityCase.group) ? parityCase.group : [parityCase.props];
  return members.reduce((total, member) => total + simulate(member).budget, 0);
}

// ------------------------------------------------------------- requirements
const allItems = (items) => items.flatMap((item) => [item, ...allItems(item.children ?? [])]);
const statics = (catalog) => catalog.cases.filter((entry) => !entry.interaction);
const scenarios = (catalog) => catalog.cases.filter((entry) => entry.interaction);
const members = (entry) => (Array.isArray(entry.group) ? entry.group : [entry.props]);
const anyStatic = (catalog, predicate) =>
  statics(catalog).some((entry) => members(entry).some((props) => predicate(props, entry)));
const anyItem = (catalog, predicate) =>
  anyStatic(catalog, (props) => allItems(props.items ?? []).some((item) => predicate(item, props)));
const depthOf = (items, depth = 0) => Math.max(depth, ...items.map((item) => depthOf(item.children ?? [], depth + 1)));
const anyScenario = (catalog, predicate) =>
  scenarios(catalog).some((entry) => {
    try {
      return predicate(entry, simulate(entry.props, entry.interaction.steps));
    } catch {
      return false;
    }
  });
const clicks = (entry) => entry.interaction.steps.filter((step) => step.action === 'clickButton').length;
const labelsOpenedThenHidden = (entry) => {
  // A branch that was expanded at some point and whose subtree was hidden by
  // its parent closing - and, for `reopen`, shown again.
  const steps = entry.interaction.steps;
  let expandedBefore = [];
  const trace = [];
  for (let index = 1; index <= steps.length; index += 1) {
    const state = simulate(entry.props, steps.slice(0, index));
    trace.push(state.expandedLabels);
    expandedBefore = state.expandedLabels;
  }
  return { trace, end: expandedBefore };
};

export const REQUIREMENTS = {
  'closed-tree': (catalog) =>
    anyStatic(
      catalog,
      (props) =>
        (props.items ?? []).some(isBranch) && props.defaultValue === undefined && props.modelValue === undefined,
    ),
  'active-nested-leaf': (catalog) =>
    anyStatic(catalog, (props) => ancestors(props.items ?? [], props.defaultValue).length >= 2),
  'active-link': (catalog) =>
    anyStatic(catalog, (props) =>
      allItems(props.items ?? []).some((item) => item.value === props.defaultValue && item.href !== undefined),
    ),
  'active-branch': (catalog) =>
    anyStatic(catalog, (props) =>
      allItems(props.items ?? []).some((item) => item.value === props.defaultValue && isBranch(item)),
    ),
  'active-unknown': (catalog) =>
    anyStatic(
      catalog,
      (props) =>
        typeof props.defaultValue === 'string' &&
        !allItems(props.items ?? []).some((item) => item.value === props.defaultValue),
    ),
  'active-duplicate': (catalog) =>
    anyStatic(
      catalog,
      (props) => allItems(props.items ?? []).filter((item) => item.value === props.defaultValue).length >= 2,
    ),
  group: (catalog) => anyItem(catalog, (item) => isGroup(item) && item.children?.length),
  'group-ancestor': (catalog) =>
    anyStatic(catalog, (props) =>
      ancestors(props.items ?? [], props.defaultValue).some((value) =>
        allItems(props.items).some((item) => item.value === value && isGroup(item)),
      ),
    ),
  'group-active': (catalog) =>
    anyStatic(catalog, (props) =>
      allItems(props.items ?? []).some((item) => item.value === props.defaultValue && isGroup(item)),
    ),
  'empty-group': (catalog) => anyItem(catalog, (item) => isGroup(item) && !item.children?.length),
  deep: (catalog) =>
    anyStatic(
      catalog,
      (props) => depthOf(props.items ?? []) >= 4 && ancestors(props.items, props.defaultValue).length >= 3,
    ),
  'leading-icons': (catalog) => anyItem(catalog, (item) => !isGroup(item) && item.leadingIcon === 'bell'),
  'unknown-icon': (catalog) => anyItem(catalog, (item) => item.leadingIcon === 'not-a-glyph'),
  'group-icon-dropped': (catalog) => anyItem(catalog, (item) => isGroup(item) && item.leadingIcon),
  'derived-rel': (catalog) =>
    anyItem(catalog, (item) => item.href !== undefined && item.target === '_blank' && item.rel === undefined),
  'explicit-rel': (catalog) =>
    anyItem(catalog, (item) => item.href !== undefined && item.target === '_blank' && item.rel),
  'self-target': (catalog) => anyItem(catalog, (item) => item.href !== undefined && item.target === '_self'),
  'empty-href': (catalog) => anyItem(catalog, (item) => item.href === ''),
  'target-without-href': (catalog) =>
    anyItem(catalog, (item) => item.target && item.href === undefined && !isBranch(item)),
  'disabled-link': (catalog) => anyItem(catalog, (item) => item.disabled && item.href !== undefined && !isBranch(item)),
  'disabled-button': (catalog) =>
    anyItem(catalog, (item) => item.disabled && item.href === undefined && !isBranch(item)),
  'disabled-branch': (catalog) => anyItem(catalog, (item) => item.disabled && isBranch(item)),
  'disabled-current': (catalog) =>
    anyStatic(catalog, (props) =>
      allItems(props.items ?? []).some((item) => item.value === props.defaultValue && item.disabled),
    ),
  'disabled-branch-on-path': (catalog) =>
    anyStatic(catalog, (props) =>
      ancestors(props.items ?? [], props.defaultValue).some((value) =>
        allItems(props.items).some((item) => item.value === value && item.disabled),
      ),
    ),
  'empty-children': (catalog) =>
    anyItem(catalog, (item) => Array.isArray(item.children) && item.children.length === 0 && !isGroup(item)),
  'branch-with-destination': (catalog) => anyItem(catalog, (item) => isBranch(item) && item.href !== undefined),
  'empty-items': (catalog) => anyStatic(catalog, (props) => Array.isArray(props.items) && props.items.length === 0),
  pills: (catalog) => anyStatic(catalog, (props) => props.variant === 'pills'),
  'sidebar-narrow': (catalog) =>
    anyStatic(
      catalog,
      (props, entry) => props.variant === 'sidebar' && props.compact === undefined && (entry.content?.box ?? 999) < 128,
    ),
  'sidebar-wide': (catalog) =>
    anyStatic(
      catalog,
      (props, entry) => props.variant === 'sidebar' && props.compact === undefined && (entry.content?.box ?? 0) > 128,
    ),
  'sidebar-boundary': (catalog) =>
    anyStatic(catalog, (props, entry) => props.variant === 'sidebar' && entry.content?.box === 128),
  'compact-true-wide': (catalog) =>
    anyStatic(
      catalog,
      (props, entry) => props.variant === 'sidebar' && props.compact === true && (entry.content?.box ?? 0) > 128,
    ),
  'compact-false-narrow': (catalog) =>
    anyStatic(
      catalog,
      (props, entry) => props.variant === 'sidebar' && props.compact === false && (entry.content?.box ?? 999) < 128,
    ),
  'compact-ignored': (catalog) => anyStatic(catalog, (props) => props.variant !== 'sidebar' && props.compact === true),
  'two-sidebars': (catalog) =>
    statics(catalog).some(
      (entry) =>
        Array.isArray(entry.group) &&
        entry.group.filter((props) => props.variant === 'sidebar').length >= 2 &&
        new Set(entry.content?.boxes ?? []).size >= 2,
    ),
  'consumer-attrs': (catalog) =>
    statics(catalog).some((entry) =>
      ['id', 'class', 'data-testid', 'title', 'style'].every((name) => name in (entry.attrs ?? {})),
    ),
  'empty-aria-label': (catalog) => anyStatic(catalog, (props) => props.ariaLabel === ''),
  controlled: (catalog) => anyStatic(catalog, (props) => typeof props.modelValue === 'string'),
  'scenario-open': (catalog) =>
    anyScenario(
      catalog,
      (entry, end) => clicks(entry) === 1 && end.expandedLabels.length === 1 && end.events.length === 0,
    ),
  'scenario-close-converges': (catalog) =>
    anyScenario(
      catalog,
      (entry, end) => entry.interaction.matches && end.expandedLabels.length === 0 && clicks(entry) === 2,
    ),
  'scenario-nested': (catalog) => anyScenario(catalog, (_, end) => end.expandedLabels.length >= 2),
  'scenario-parent-reopen': (catalog) =>
    anyScenario(catalog, (entry) => {
      const { trace } = labelsOpenedThenHidden(entry);
      return trace.some(
        (labels, index) =>
          labels.length >= 2 && trace.slice(index + 1).some((later) => later.length === 0) && trace.at(-1).length >= 2,
      );
    }),
  'scenario-single-siblings': (catalog) =>
    anyScenario(
      catalog,
      (entry, end) => entry.props.expandMode === 'single' && clicks(entry) === 2 && end.expandedLabels.length === 1,
    ),
  'scenario-single-descendants': (catalog) =>
    anyScenario(
      catalog,
      (entry) =>
        entry.props.expandMode === 'single' &&
        allItems(entry.props.items).some(isGroup) &&
        entry.interaction.steps.length >= 4,
    ),
  'scenario-single-group-skip': (catalog) =>
    anyScenario(
      catalog,
      (entry, end) =>
        entry.props.expandMode === 'single' &&
        allItems(entry.props.items).some(isGroup) &&
        end.expandedLabels.length >= 3,
    ),
  'scenario-single-reopen': (catalog) =>
    anyScenario(
      catalog,
      (entry, end) => entry.props.expandMode === 'single' && end.expandedLabels.length >= 2 && clicks(entry) >= 4,
    ),
  'scenario-select-button': (catalog) =>
    anyScenario(
      catalog,
      (entry, end) => end.events.length === 1 && end.locationHash === '' && entry.interaction.matches,
    ),
  'scenario-select-again': (catalog) =>
    anyScenario(catalog, (_, end) => end.events.length === 2 && end.events[0].value === end.events[1].value),
  'scenario-select-link': (catalog) =>
    anyScenario(catalog, (_, end) => end.locationHash !== '' && end.events.length >= 1),
  'scenario-disabled-link': (catalog) =>
    anyScenario(catalog, (entry, end) => {
      const visible = controls(entry.props.items, synced(entry.props.items, [], entry.props.defaultValue));
      return (
        entry.interaction.steps.some((step) => step.action === 'clickButton' && visible[step.index]?.item.disabled) &&
        end.events.length === 0
      );
    }),
  'scenario-controlled': (catalog) =>
    anyScenario(catalog, (entry, end) => typeof entry.props.modelValue === 'string' && end.events.length >= 1),
  'scenario-enter-key': (catalog) =>
    anyScenario(catalog, (entry) => entry.interaction.steps.some((step) => step.key === 'Enter')),
  'scenario-space-key': (catalog) =>
    anyScenario(catalog, (entry) => entry.interaction.steps.some((step) => step.key === ' ')),
  'scenario-arrow-ignored': (catalog) =>
    anyScenario(
      catalog,
      (entry, end) =>
        entry.interaction.steps.some((step) => step.key === 'ArrowDown') && end.expandedLabels.length === 0,
    ),
  'scenario-tab-skips-disabled': (catalog) =>
    anyScenario(
      catalog,
      (entry) =>
        entry.interaction.steps.some((step) => step.key === 'Tab') &&
        allItems(entry.props.items).some((item) => item.disabled),
    ),
  'scenario-compact-sidebar': (catalog) =>
    anyScenario(catalog, (entry) => entry.props.variant === 'sidebar' && (entry.content?.box ?? 999) < 128),
  'scenario-convergence': (catalog) => scenarios(catalog).filter((entry) => entry.interaction.matches).length >= 5,
  'no-controlled-divergence': (_, policy) => {
    const divergence = policy?.platformDivergences?.find((entry) => entry.id === 'razor-has-no-controlled-mode');
    return Boolean(divergence?.vueHalfCoveredBy && divergence?.razorHalfCoveredBy && divergence?.mutationCoveredBy);
  },
  'no-approvals': (_, policy) => Array.isArray(policy?.approvedDivergences) && policy.approvedDivergences.length === 0,
};

export function navMenuCoverageViolations(catalog, policy) {
  const violations = [];
  if (catalog.component !== 'nav-menu') violations.push('the catalog is not the nav menu catalog');
  const ids = new Set();
  for (const entry of catalog.cases ?? []) {
    const where = entry.id;
    if (ids.has(where)) violations.push(`${where} is not unique`);
    ids.add(where);
    for (const props of members(entry)) {
      for (const [name, value] of Object.entries(props)) {
        if (!PROPS[name]) violations.push(`${where} uses prop [${name}], which the reference does not have`);
        else if (!PROPS[name](value)) violations.push(`${where} has a malformed [${name}]`);
      }
      for (const [index, item] of (props.items ?? []).entries()) {
        const problem = itemProblem(item, `${where} items[${index}]`);
        if (problem) violations.push(problem);
      }
    }
    for (const [name, value] of Object.entries(entry.content ?? {})) {
      if (!CONTENT[name]) violations.push(`${where} uses content [${name}], which no fixture renders`);
      else if (!CONTENT[name](value)) violations.push(`${where} has a malformed content [${name}]`);
    }
    if (entry.componentInteractive !== derivedCaseBudget(entry)) {
      violations.push(
        `${where} declares ${entry.componentInteractive} owned control(s) but renders ${derivedCaseBudget(entry)}`,
      );
    }
    if (entry.consumerInteractive !== 0 || entry.consumerInteractiveRoles !== 0)
      violations.push(`${where} declares consumer controls`);
    if (!entry.interaction) continue;
    for (const step of entry.interaction.steps ?? []) {
      const problem = stepProblem(step);
      if (problem) violations.push(`${where}: ${problem}`);
    }
    let end;
    try {
      end = simulate(entry.props, entry.interaction.steps);
    } catch (error) {
      violations.push(`${where}: ${error.message}`);
      continue;
    }
    if (entry.interaction.componentInteractive !== end.budget) {
      violations.push(
        `${where} declares an end budget of ${entry.interaction.componentInteractive} but ends with ${end.budget}`,
      );
    }
    if (entry.interaction.consumerInteractive !== 0) violations.push(`${where} declares consumer controls at its end`);
    for (const [key, want] of Object.entries(entry.interaction.expect ?? {})) {
      if (!EXPECT.includes(key)) {
        violations.push(`${where} expects [${key}], which the snapshot does not measure`);
        continue;
      }
      if (key === 'settled') {
        if (want !== true) violations.push(`${where} expects an unsettled end`);
        continue;
      }
      if (JSON.stringify(want) !== JSON.stringify(end[key])) {
        violations.push(
          `${where} expects ${key}=${JSON.stringify(want)}, but the reference's rules give ${JSON.stringify(end[key])}`,
        );
      }
    }
    const matches = entry.interaction.matches;
    if (matches !== undefined) {
      const target = catalog.cases.find((candidate) => candidate.id === matches);
      if (!target || target.interaction)
        violations.push(`${where} converges on [${matches}], which is not a static case`);
      else if (JSON.stringify(target.props.items) !== JSON.stringify(entry.props.items)) {
        violations.push(`${where} converges on [${matches}], which renders other items`);
      }
    }
  }
  for (const [name, requirement] of Object.entries(REQUIREMENTS)) {
    if (!requirement(catalog, policy)) violations.push(`requirement [${name}] is not met by any case`);
  }
  return violations;
}
