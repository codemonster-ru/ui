// What differs between components in the parity harness.
//
// M07 built the harness around VfInput, with the case catalog path, the
// measured roles, the interaction vocabulary and the post-scenario snapshot all
// written into the pipeline. At the second component that becomes a fork: two
// harnesses, two comparators, two sets of rules about what an approved
// divergence means, and no way to know the two agree.
//
// So the pipeline is parameterised instead. Everything that decides whether a
// difference matters - the extractor, the comparator, the divergence policy
// engine, the mutation harness - stays single-copy and component-blind. A
// profile carries only the component-shaped facts, and adding the third
// component means adding a profile and a catalog, not another gate.
export const profiles = {
  input: {
    id: 'input',
    label: 'VfInput',
    component: 'input',
    casesPath: 'contracts/input/cases.json',
    policyPath: 'contracts/input/parity-policy.json',
    // The Input artifact directory keeps its M07 name; renaming it would
    // invalidate stored evidence for no gain.
    artifactDirectory: 'parity',
    reportName: 'input-parity-report.json',
    // The roles a case can contain, measured by role rather than by selector
    // position so the two adapters are compared like for like.
    measuredRoles: {
      control: 'input.vf-input',
      wrapper: '.vf-input-wrap',
      leading: '.vf-input-wrap__icon--leading',
      leadingGlyph: '.vf-input-wrap__icon--leading svg',
      trailing: '.vf-input-wrap__icon--trailing',
      trailingGlyph: '.vf-input-wrap__icon--trailing svg',
      clear: '.vf-input-wrap__clear',
      clearGlyph: '.vf-input-wrap__clear svg',
      reveal: '.vf-input-wrap__password-toggle',
      revealGlyph: '.vf-input-wrap__password-toggle svg',
      fieldLabel: '.vf-field__label',
    },
    // Roles queried in the accessibility tree. A role that is not listed is
    // not checked at all, so this list is coverage, not configuration.
    accessibilityRoles: {
      control: 'input.vf-input',
      clear: '.vf-input-wrap__clear',
      reveal: '.vf-input-wrap__password-toggle',
    },
    snapshot: 'input',
  },
  'icon-button': {
    id: 'icon-button',
    label: 'VfIconButton',
    component: 'icon-button',
    casesPath: 'contracts/icon-button/cases.json',
    policyPath: 'contracts/icon-button/parity-policy.json',
    artifactDirectory: 'parity-icon-button',
    reportName: 'icon-button-parity-report.json',
    measuredRoles: {
      button: '.vf-icon-button',
      glyphWrapper: '.vf-icon-button .vf-icon-wrapper',
      glyph: '.vf-icon-button svg',
    },
    accessibilityRoles: {
      button: '.vf-icon-button',
      // The glyph is decorative and aria-hidden, so it is expected to be absent
      // from every target's accessibility tree. Listing it is what turns that
      // expectation into a measurement: an ignored node is not exposed, so a
      // glyph that started leaking into the tree would appear here on one
      // target and move an a11y dimension. Without the entry the selector is
      // never queried, and "no icon button exposes its glyph" is a claim no
      // dimension checks.
      glyph: '.vf-icon-button svg',
    },
    snapshot: 'icon-button',
  },
  field: {
    id: 'field',
    label: 'VfField',
    component: 'field',
    casesPath: 'contracts/field/cases.json',
    policyPath: 'contracts/field/parity-policy.json',
    artifactDirectory: 'parity-field',
    reportName: 'field-parity-report.json',
    measuredRoles: {
      field: '.vf-field',
      label: '.vf-field__label',
      requiredMark: '.vf-field__required-mark',
      controlWrapper: '.vf-field__control',
      control: 'input.vf-input',
      description: '.vf-field__description',
      error: '.vf-field__error',
    },
    // The control is what carries the accessible name the label provides and
    // the description the field wrote, so listing it is how the relationships
    // are checked as semantics rather than as attributes. The label and the
    // required mark are listed for the opposite reason: a label is exposed as
    // part of the control's name rather than as a node of its own, and the
    // mark is aria-hidden, so both are expected to be absent - which is only a
    // measurement if the selector is queried.
    accessibilityRoles: {
      control: 'input.vf-input',
      description: '.vf-field__description',
      error: '.vf-field__error',
      requiredMark: '.vf-field__required-mark',
    },
    snapshot: 'field',
  },
};

export function loadProfile(id) {
  const profile = profiles[id];

  if (!profile) {
    throw new Error(`Unknown parity component [${id}]. Known: ${Object.keys(profiles).join(', ')}.`);
  }

  return profile;
}

/** Reads `--component=<id>` from an argv slice, defaulting to VfInput. */
export function profileFromArgv(argv = process.argv.slice(2)) {
  const flag = argv.find((argument) => argument.startsWith('--component='));

  return loadProfile(flag ? flag.slice('--component='.length) : 'input');
}
