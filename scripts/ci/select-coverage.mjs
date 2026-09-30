// What the VfSelect catalog has to prove, read as semantics (M32).
//
// The fourth overlay catalog, and the first whose overlay holds controls the
// component owns. The gate holds three things at once:
//
//   - the vocabularies are closed. A prop the reference does not have, a
//     teleportTo in the catalog, a content key no fixture renders, a step,
//     key or expectation the harness does not drive or measure, a Tab from a
//     teleported listbox (it would leave the document) - each is refused;
//   - the ownership budgets are derived, not trusted. Closed: one trigger per
//     rendered select and a clear button per filled, enabled, clearable one;
//     at the end of a scenario, the triggers, clear buttons and every option
//     of every open listbox the scenario's own expectations describe. The
//     consumer's controls are an after control, a reset button, a popover
//     trigger and an open popover panel; nobody's controls carry a role the
//     profile does not declare;
//   - every place the select's contract could be ported wrong is exercised by
//     a case that could only pass if it held: the write-back, both opening
//     paths, the four opening keys, the selected-or-first focus, the disabled
//     skip, both wraps, Home and End, Enter and Space, Tab leaving it open,
//     both Escape paths and their order, the pointer and keyboard focus
//     difference, the outside click, the clear button, the hidden input and
//     the form's entries, disabled submission, the reset nothing hears, the
//     dropped required, the field matrix, min-width, flip, shift, bottom-end,
//     the scroll into view, cross-wiring, the orphan census and the teardown
//     inside a popover - and the Vue-only half of the write-back is declared
//     as a platform divergence with both halves covered.
//
// Violations are returned rather than asserted so a test can drive this with a
// deliberately eroded catalog and check which rule fired.

const OPTION = (value) =>
  value !== null &&
  typeof value === 'object' &&
  typeof value.value === 'string' &&
  typeof value.label === 'string' &&
  Object.keys(value).every((key) => ['value', 'label', 'disabled'].includes(key)) &&
  (value.disabled === undefined || typeof value.disabled === 'boolean');
const PROPS = {
  options: (value) => Array.isArray(value) && value.every(OPTION),
  modelValue: (value) => typeof value === 'string',
  placeholder: (value) => typeof value === 'string',
  size: (value) => ['sm', 'md', 'lg'].includes(value),
  invalid: (value) => typeof value === 'boolean',
  leadingIcon: (value) => typeof value === 'string',
  trailingIcon: (value) => typeof value === 'string',
  clearable: (value) => typeof value === 'boolean',
  disabled: (value) => typeof value === 'boolean',
  placement: (value) => value === 'bottom-start' || value === 'bottom-end',
  disableTeleport: (value) => typeof value === 'boolean',
};
const TEXT = (value) =>
  value !== null && typeof value === 'object' && Object.keys(value).length === 1 && typeof value.text === 'string';
const CONTENT = {
  field: (value) =>
    value !== null &&
    typeof value === 'object' &&
    typeof value.label === 'string' &&
    Object.keys(value).every((key) => ['label', 'placement', 'description', 'error'].includes(key)) &&
    (value.placement === undefined || value.placement === 'top' || value.placement === 'floating'),
  form: (value) =>
    value !== null &&
    typeof value === 'object' &&
    Object.keys(value).every((key) => key === 'reset') &&
    (value.reset === undefined || value.reset === true),
  popover: (value) =>
    value !== null && typeof value === 'object' && Object.keys(value).length === 1 && typeof value.trigger === 'string',
  after: (value) =>
    value !== null && typeof value === 'object' && Object.keys(value).length === 1 && TEXT(value.control),
  leading: TEXT,
  trailing: TEXT,
};
const KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Escape', 'Tab'];
const OPENING_KEYS = ['ArrowDown', 'ArrowUp', 'Enter', ' '];
const CLICK_TARGETS = [
  'button.vf-select',
  '.vf-select-wrap__clear',
  '.vf-popover__trigger',
  '.parity-after-control',
  '.parity-reset-control',
];
const THROUGH = { selector: 'button.vf-select', attribute: 'aria-controls' };
const EXPECT_FIELDS = [
  'expandedStates',
  'focusRole',
  'focusOption',
  'events',
  'keydownPrevented',
  'triggerStates',
  'listboxStates',
  'listboxGeometryAfterResize',
  'listboxScroll',
  'listboxRelationships',
  'bodyListboxes',
  'hiddenInputs',
  'formData',
  'formValid',
  'fieldStates',
  'popoverStates',
  'transitions',
  'settled',
];
const DIVERGENCE_FIELDS = [
  'description',
  'reason',
  'comparedAs',
  'vueHalfCoveredBy',
  'razorHalfCoveredBy',
  'mutationCoveredBy',
];

const content = (entry) => entry.content ?? {};
const members = (entry) => (Array.isArray(entry.group) ? entry.group : [entry.props ?? {}]);
const steps = (entry) => entry.interaction?.steps ?? [];
const expectOf = (entry) => entry.interaction?.expect ?? {};
const keysOf = (entry) =>
  steps(entry)
    .filter((step) => step.action === 'pressKey')
    .map((step) => step.key);
const scenarios = (catalog) => (catalog.cases ?? []).filter((entry) => entry.interaction);
const filledClear = (props) => props.clearable === true && (props.modelValue ?? '') !== '' && props.disabled !== true;
const labelsOf = (props) => (props.options ?? []).map((option) => option.label);
const enabledOf = (props) => (props.options ?? []).filter((option) => !option.disabled);
const isKeyboardOpen = (entry, key) =>
  steps(entry).length === 2 &&
  steps(entry)[0].action === 'focusButton' &&
  steps(entry)[1].action === 'pressKey' &&
  steps(entry)[1].key === key;
const endsOpen = (entry) => (expectOf(entry).expandedStates ?? []).includes('true');
const endsClosed = (entry) =>
  Array.isArray(expectOf(entry).expandedStates) && expectOf(entry).expandedStates.every((state) => state === 'false');
const openListboxes = (entry) => (expectOf(entry).listboxStates ?? []).filter(Boolean);
const geometry = (entry) => (expectOf(entry).listboxGeometryAfterResize ?? []).filter(Boolean);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

/** Whether a step is one the harness drives, spelled exactly as the vocabulary allows. */
export function stepProblem(step, entry) {
  const keys = Object.keys(step ?? {}).sort();
  const index = step?.index;
  const indexOk = index === undefined || (Number.isInteger(index) && index >= 0);
  const allowed = (...names) => keys.every((key) => ['action', ...names].includes(key));
  switch (step?.action) {
    case 'clickButton':
      if (!allowed('selector', 'index', 'through') || !indexOk) return 'a click takes only selector, index and through';
      if (step.through !== undefined) {
        const through = step.through;
        const throughOk =
          through.selector === THROUGH.selector &&
          through.attribute === THROUGH.attribute &&
          Object.keys(through).every((key) => ['selector', 'attribute', 'index'].includes(key));
        return throughOk && step.selector === '[role="option"]'
          ? null
          : "a click through the listbox can only land on an option, reached through a trigger's aria-controls";
      }
      return CLICK_TARGETS.includes(step.selector) ? null : `a click cannot target [${step.selector}]`;
    case 'focusButton':
      return allowed('selector', 'index') && indexOk && step.selector === 'button.vf-select'
        ? null
        : 'a focus can only land on a select trigger';
    case 'pressKey':
      if (!allowed('key') || !KEYS.includes(step.key)) return `the harness does not press [${step.key}]`;
      if (step.key === 'Tab' && !members(entry).every((props) => props.disableTeleport === true)) {
        return 'Tab from a teleported listbox leaves the document: a Tab scenario renders its listbox in place';
      }
      return null;
    case 'wait':
      return allowed('ms') && Number.isInteger(step.ms) && step.ms >= 0 ? null : 'a wait takes a whole number of ms';
    default:
      return `unknown step [${step?.action}]`;
  }
}

/** The closed budget of a case: triggers and clear buttons, and the consumer's controls. */
export function derivedCaseBudget(entry) {
  // A select inside a closed popover renders nothing until the popover opens.
  return {
    componentInteractive: members(entry).length + members(entry).filter(filledClear).length,
    consumerInteractive:
      (content(entry).after ? 1 : 0) + (content(entry).form?.reset ? 1 : 0) + (content(entry).popover ? 1 : 0),
  };
}

/** The budget a scenario ends with, from its own expectations. */
export function derivedScenarioBudget(entry) {
  const expect = expectOf(entry);
  const triggers = (expect.triggerStates ?? []).length;
  const clears = (expect.triggerStates ?? []).filter((state) => state?.clear === true).length;
  const options = openListboxes(entry).reduce((sum, listbox) => sum + (listbox.options ?? []).length, 0);
  const panelOpen = (expect.popoverStates ?? []).includes('true') ? 1 : 0;
  return {
    componentInteractive: triggers + clears + options,
    consumerInteractive:
      (content(entry).after ? 1 : 0) +
      (content(entry).form?.reset ? 1 : 0) +
      (content(entry).popover ? 1 + panelOpen : 0),
  };
}

/**
 * Every requirement the catalog must meet, by name. Each is a predicate over
 * the whole catalog that only a case exercising the named contract satisfies.
 */
export const REQUIREMENTS = {
  'controlled-writeback': (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        (expectOf(entry).events ?? []).length > 0 &&
        typeof entry.matches === 'string' &&
        (catalog.cases ?? []).some(
          (target) =>
            target.id === entry.matches &&
            (target.props?.modelValue ?? '') === (expectOf(entry).events ?? []).at(-1)?.value,
        ),
    ),
  'no-writeback-divergence': (catalog, policy) => {
    const divergence = (policy?.platformDivergences ?? []).find((entry) => entry.id === 'razor-has-no-controlled-mode');
    return (
      Boolean(divergence) &&
      DIVERGENCE_FIELDS.every((field) => typeof divergence[field] === 'string' && divergence[field] !== '')
    );
  },
  ...Object.fromEntries(
    OPENING_KEYS.map((key) => [
      `keyboard-open:${key === ' ' ? 'Space' : key}`,
      (catalog) =>
        scenarios(catalog).some(
          (entry) =>
            isKeyboardOpen(entry, key) &&
            same(expectOf(entry).expandedStates, ['true']) &&
            same(expectOf(entry).keydownPrevented, [`${key}:true`]) &&
            expectOf(entry).focusRole === 'option',
        ),
    ]),
  ),
  'pointer-open': (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        steps(entry).length === 1 &&
        steps(entry)[0].action === 'clickButton' &&
        steps(entry)[0].selector === 'button.vf-select' &&
        same(expectOf(entry).expandedStates, ['true']) &&
        expectOf(entry).focusRole === 'trigger',
    ),
  'closed-keys-not-handled': (catalog) =>
    ['Home', 'End', 'Escape'].every((key) =>
      scenarios(catalog).some(
        (entry) => endsClosed(entry) && (expectOf(entry).keydownPrevented ?? []).includes(`${key}:false`),
      ),
    ),
  'selected-option-focus': (catalog) =>
    scenarios(catalog).some((entry) => {
      const props = members(entry)[0];
      const selected = enabledOf(props).find((option) => option.value === props.modelValue);
      return (
        isKeyboardOpen(entry, steps(entry)[1]?.key) &&
        selected !== undefined &&
        selected !== enabledOf(props)[0] &&
        expectOf(entry).focusOption === selected.label
      );
    }),
  'first-option-fallback': (catalog) =>
    ['none', 'disabled'].every((kind) =>
      scenarios(catalog).some((entry) => {
        const props = members(entry)[0];
        const model = props.modelValue ?? '';
        const selectedDisabled = (props.options ?? []).some((option) => option.value === model && option.disabled);
        return (
          isKeyboardOpen(entry, steps(entry)[1]?.key) &&
          (kind === 'none' ? model === '' : selectedDisabled) &&
          expectOf(entry).focusOption === enabledOf(props)[0]?.label
        );
      }),
    ),
  'disabled-skip': (catalog) =>
    scenarios(catalog).some((entry) => {
      const props = members(entry)[0];
      const options = props.options ?? [];
      const start = options.findIndex((option) => option.value === props.modelValue);
      const next = options.slice(start + 1).find((option) => !option.disabled);
      return (
        start >= 0 &&
        options[start + 1]?.disabled === true &&
        same(keysOf(entry), ['ArrowDown', 'ArrowDown']) &&
        expectOf(entry).focusOption === next?.label
      );
    }),
  'wrap-down': (catalog) =>
    scenarios(catalog).some((entry) => {
      const enabled = enabledOf(members(entry)[0]);
      return (
        keysOf(entry).filter((key) => key === 'ArrowDown').length > enabled.length &&
        !keysOf(entry).includes('ArrowUp') &&
        endsOpen(entry) &&
        expectOf(entry).focusOption === enabled[0]?.label
      );
    }),
  'wrap-up': (catalog) =>
    scenarios(catalog).some((entry) => {
      const props = members(entry)[0];
      const enabled = enabledOf(props);
      return (
        props.modelValue === enabled[0]?.value &&
        same(keysOf(entry), ['ArrowDown', 'ArrowUp']) &&
        expectOf(entry).focusOption === enabled.at(-1)?.label
      );
    }),
  'home-end': (catalog) =>
    scenarios(catalog).some((entry) => {
      const enabled = enabledOf(members(entry)[0]);
      return keysOf(entry).at(-1) === 'End' && expectOf(entry).focusOption === enabled.at(-1)?.label;
    }) &&
    scenarios(catalog).some((entry) => {
      const enabled = enabledOf(members(entry)[0]);
      return (
        keysOf(entry).at(-1) === 'Home' &&
        keysOf(entry).includes('End') &&
        expectOf(entry).focusOption === enabled[0]?.label
      );
    }),
  ...Object.fromEntries(
    ['Enter', ' '].map((key) => [
      `select:${key === ' ' ? 'Space' : key}`,
      (catalog) =>
        scenarios(catalog).some(
          (entry) =>
            keysOf(entry).at(-1) === key &&
            keysOf(entry).length > 1 &&
            endsClosed(entry) &&
            expectOf(entry).focusRole === 'trigger' &&
            (expectOf(entry).events ?? []).length === 1 &&
            (expectOf(entry).keydownPrevented ?? []).at(-1) === `${key}:true`,
        ),
    ]),
  ),
  'tab-stays-open': (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        keysOf(entry).at(-1) === 'Tab' &&
        endsOpen(entry) &&
        (expectOf(entry).keydownPrevented ?? []).at(-1) === 'Tab:false' &&
        expectOf(entry).focusRole !== 'option',
    ),
  'escape-local': (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        same(keysOf(entry), ['ArrowDown', 'Escape']) &&
        endsClosed(entry) &&
        expectOf(entry).focusRole === 'trigger' &&
        (expectOf(entry).keydownPrevented ?? []).at(-1) === 'Escape:true',
    ),
  'escape-stack': (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        steps(entry)[0]?.action === 'clickButton' &&
        same(keysOf(entry), ['Escape']) &&
        endsClosed(entry) &&
        expectOf(entry).focusRole === 'trigger' &&
        same(expectOf(entry).keydownPrevented, ['Escape:true']),
    ),
  'escape-order': (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        members(entry).length === 2 &&
        same(expectOf(entry).expandedStates, ['true', 'false']) &&
        keysOf(entry).at(-1) === 'Escape',
    ) &&
    scenarios(catalog).some(
      (entry) =>
        content(entry).popover &&
        keysOf(entry).filter((key) => key === 'Escape').length === 2 &&
        same(expectOf(entry).popoverStates, ['false']),
    ),
  'pointer-selection-keeps-focus': (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        steps(entry).some((step) => step.through !== undefined) &&
        !content(entry).popover &&
        endsClosed(entry) &&
        (expectOf(entry).events ?? []).length === 1 &&
        expectOf(entry).focusRole !== 'trigger',
    ),
  'outside-click': (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        steps(entry).some((step) => step.selector === '.parity-after-control') &&
        steps(entry).some((step) => step.selector === 'button.vf-select') &&
        endsClosed(entry) &&
        expectOf(entry).focusRole !== 'trigger',
    ),
  clear: (catalog) =>
    scenarios(catalog).filter(
      (entry) =>
        steps(entry).some((step) => step.selector === '.vf-select-wrap__clear') &&
        same(expectOf(entry).events, [{ instance: 0, value: '' }]) &&
        expectOf(entry).focusRole === 'trigger' &&
        endsClosed(entry),
    ).length >= 2,
  'hidden-input': (catalog) =>
    (catalog.cases ?? []).some((entry) => typeof entry.attrs?.name === 'string' && content(entry).form) &&
    scenarios(catalog).some((entry) => (expectOf(entry).hiddenInputs ?? []).some((input) => input?.first === true)),
  'form-data': (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        (expectOf(entry).events ?? []).length === 1 &&
        same(expectOf(entry).formData, [[entry.attrs?.name, expectOf(entry).events[0].value]]),
    ),
  'disabled-submission': (catalog) =>
    scenarios(catalog).some((entry) => members(entry)[0].disabled === true && same(expectOf(entry).formData, [])),
  'reset-ignored': (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        steps(entry).at(-1)?.selector === '.parity-reset-control' &&
        (expectOf(entry).events ?? []).length === 1 &&
        same(expectOf(entry).formData, [[entry.attrs?.name, expectOf(entry).events[0].value]]),
    ),
  'required-dropped': (catalog) =>
    scenarios(catalog).some((entry) => entry.attrs?.required === true && expectOf(entry).formValid === true),
  'field-matrix': (catalog) => {
    const field = scenarios(catalog).filter((entry) => content(entry).field?.placement === 'floating');
    const filledOf = (entry) =>
      (expectOf(entry).fieldStates ?? []).some((state) =>
        (state.controlClasses ?? []).includes('vf-field__control--filled'),
      );
    const empty = (entry) => (members(entry)[0].modelValue ?? '') === '';
    return (
      field.some((entry) => empty(entry) && endsOpen(entry) && filledOf(entry)) &&
      field.some(
        (entry) => empty(entry) && endsClosed(entry) && (expectOf(entry).events ?? []).length === 0 && !filledOf(entry),
      ) &&
      field.some((entry) => endsClosed(entry) && (expectOf(entry).events ?? []).length === 1 && filledOf(entry)) &&
      field.some((entry) => !empty(entry) && endsOpen(entry) && filledOf(entry))
    );
  },
  'placeholder-suppressed': (catalog) =>
    (catalog.cases ?? []).some(
      (entry) => content(entry).field?.placement === 'floating' && typeof members(entry)[0].placeholder === 'string',
    ) &&
    scenarios(catalog).some(
      (entry) =>
        content(entry).field?.placement === 'floating' &&
        typeof members(entry)[0].placeholder === 'string' &&
        (expectOf(entry).triggerStates ?? [])[0]?.label === '',
    ),
  'min-width': (catalog) =>
    scenarios(catalog).some((entry) => geometry(entry).some((box) => box.minWidth === box.triggerWidth)),
  flip: (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        geometry(entry).some((box) => box.side === 'above') &&
        openListboxes(entry).some((listbox) => (listbox.classes ?? []).includes('vf-dropdown__menu--top')),
    ),
  shift: (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        members(entry)[0].placement !== 'bottom-end' &&
        geometry(entry).some((box) => box.left < 0 && box.withinViewport === true),
    ),
  'bottom-end': (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        members(entry)[0].placement === 'bottom-end' && geometry(entry).some((box) => box.right === 0 && box.left < 0),
    ),
  'scroll-into-view': (catalog) =>
    scenarios(catalog).some((entry) =>
      (expectOf(entry).listboxScroll ?? []).some((scroll) => scroll?.scrollTop > 0 && scroll?.focusedInView === true),
    ) &&
    scenarios(catalog).some((entry) =>
      (expectOf(entry).listboxScroll ?? []).some((scroll) => scroll?.scrollTop > 0 && scroll?.focusedInView === null),
    ),
  'cross-wiring': (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        same(expectOf(entry).listboxRelationships, [
          { controls: 'listbox', labelledBy: 'own-trigger', activedescendant: false },
          { controls: 'listbox', labelledBy: 'own-trigger', activedescendant: false },
        ]) && same(expectOf(entry).bodyListboxes, ['listbox:0', 'listbox:1']),
    ),
  'teardown-in-popover': (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        content(entry).popover &&
        same(expectOf(entry).bodyListboxes, []) &&
        (expectOf(entry).keydownPrevented ?? []).at(-1) === 'Escape:false',
    ),
  'option-click-closes-popover': (catalog) =>
    scenarios(catalog).some(
      (entry) =>
        content(entry).popover &&
        steps(entry).some((step) => step.through !== undefined) &&
        (expectOf(entry).events ?? []).length === 1 &&
        same(expectOf(entry).popoverStates, ['false']),
    ),
  'no-activedescendant': (catalog) =>
    scenarios(catalog).every((entry) =>
      (expectOf(entry).listboxRelationships ?? []).every((relationship) => relationship.activedescendant === false),
    ),
};

/** Every violation, as a string naming the rule and the case. */
export function selectCoverageViolations(catalog, policy) {
  const violations = [];
  if (catalog?.component !== 'select') violations.push('the catalog is not the select catalog');

  for (const entry of catalog?.cases ?? []) {
    const id = entry.id;
    for (const member of members(entry)) {
      for (const [name, value] of Object.entries(member)) {
        if (!(name in PROPS)) violations.push(`${id}: prop [${name}] is not in the select vocabulary`);
        else if (!PROPS[name](value)) violations.push(`${id}: prop [${name}] has a value the vocabulary refuses`);
      }
      if (!Array.isArray(member.options)) violations.push(`${id}: every select renders its options`);
    }
    for (const [name, value] of Object.entries(content(entry))) {
      if (!(name in CONTENT)) violations.push(`${id}: content [${name}] is not in the select vocabulary`);
      else if (!CONTENT[name](value)) violations.push(`${id}: content [${name}] has a shape no fixture renders`);
    }
    if (content(entry).field && members(entry).length !== 1) violations.push(`${id}: a field wraps exactly one select`);

    const budget = derivedCaseBudget(entry);
    if (entry.componentInteractive !== budget.componentInteractive) {
      violations.push(
        `${id}: componentInteractive ${entry.componentInteractive} is not the derived ${budget.componentInteractive}`,
      );
    }
    if (entry.consumerInteractive !== budget.consumerInteractive) {
      violations.push(
        `${id}: consumerInteractive ${entry.consumerInteractive} is not the derived ${budget.consumerInteractive}`,
      );
    }
    if ((entry.consumerInteractiveRoles ?? 0) !== 0)
      violations.push(`${id}: no consumer control carries an interactive role`);

    if (!entry.interaction) continue;
    if (steps(entry).length === 0) violations.push(`${id}: a scenario drives at least one step`);
    for (const step of steps(entry)) {
      const problem = stepProblem(step, entry);
      if (problem) violations.push(`${id}: ${problem}`);
    }
    for (const field of Object.keys(expectOf(entry))) {
      if (!EXPECT_FIELDS.includes(field)) violations.push(`${id}: the snapshot does not record [${field}]`);
    }
    for (const field of ['expandedStates', 'focusRole', 'events', 'triggerStates', 'settled']) {
      if (!(field in expectOf(entry))) violations.push(`${id}: every scenario claims [${field}]`);
    }
    if (expectOf(entry).settled !== true) violations.push(`${id}: a scenario ends settled`);
    const scenarioBudget = derivedScenarioBudget(entry);
    if (entry.interaction.componentInteractive !== scenarioBudget.componentInteractive) {
      violations.push(
        `${id}: the scenario ends with componentInteractive ${entry.interaction.componentInteractive}, not the derived ${scenarioBudget.componentInteractive}`,
      );
    }
    if (entry.interaction.consumerInteractive !== scenarioBudget.consumerInteractive) {
      violations.push(
        `${id}: the scenario ends with consumerInteractive ${entry.interaction.consumerInteractive}, not the derived ${scenarioBudget.consumerInteractive}`,
      );
    }
    if ((entry.interaction.consumerInteractiveRoles ?? 0) !== 0) {
      violations.push(`${id}: a scenario ends with no consumer interactive role`);
    }
    for (const listbox of openListboxes(entry)) {
      const expected = labelsOf(members(entry)[0]);
      if (
        members(entry).length === 1 &&
        !content(entry).popover &&
        !same(
          (listbox.options ?? []).map((option) => option.label),
          expected,
        )
      ) {
        violations.push(`${id}: an open listbox lists every option in order`);
      }
    }
    if (typeof entry.matches === 'string') {
      const target = (catalog.cases ?? []).find((candidate) => candidate.id === entry.matches);
      if (!target || target.interaction) violations.push(`${id}: matches names no static case`);
      else if (!endsClosed(entry)) violations.push(`${id}: only a closing scenario converges`);
    }
  }

  for (const [name, requirement] of Object.entries(REQUIREMENTS)) {
    if (!requirement(catalog ?? {}, policy)) violations.push(`requirement [${name}] is not exercised by any case`);
  }

  return violations;
}
