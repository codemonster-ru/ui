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
    activationSelector: '.vf-icon-button',
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
  button: {
    id: 'button',
    label: 'VfButton',
    component: 'button',
    casesPath: 'contracts/button/cases.json',
    policyPath: 'contracts/button/parity-policy.json',
    artifactDirectory: 'parity-button',
    reportName: 'button-parity-report.json',
    measuredRoles: {
      button: '.vf-button',
      spinner: '.vf-button__spinner',
      spinnerArtwork: '.vf-button__spinner svg',
      glyph: '.vf-button .vf-icon',
    },
    // The spinner is listed because it is expected to be *present* in the tree:
    // the reference gives it role=progressbar and a name, so a loading button
    // announces both. Its artwork is listed for the opposite reason - it is
    // aria-hidden, so it should be absent, which is only a measurement if the
    // selector is queried.
    accessibilityRoles: {
      button: '.vf-button',
      spinner: '.vf-button__spinner',
      spinnerArtwork: '.vf-button__spinner svg',
      glyph: '.vf-button .vf-icon',
    },
    // A button's post-scenario state is the same shape as the icon button's:
    // did it activate, where did focus land, is it still operable and named.
    snapshot: 'button',
    activationSelector: '.vf-button',
  },
  textarea: {
    id: 'textarea',
    label: 'VfTextarea',
    component: 'textarea',
    casesPath: 'contracts/textarea/cases.json',
    policyPath: 'contracts/textarea/parity-policy.json',
    artifactDirectory: 'parity-textarea',
    reportName: 'textarea-parity-report.json',
    measuredRoles: {
      control: 'textarea.vf-textarea',
      field: '.vf-field',
      label: '.vf-field__label',
      controlWrapper: '.vf-field__control',
      description: '.vf-field__description',
      error: '.vf-field__error',
    },
    accessibilityRoles: {
      control: 'textarea.vf-textarea',
      description: '.vf-field__description',
      error: '.vf-field__error',
    },
    // The attributes this component's contract is made of, checked against the
    // comparison by scripts/ci/attribute-coverage.test.mjs. Declared because
    // M12 and M13 each found attributes that no comparison would ever have
    // reported: a profile should not be able to claim coverage it lacks.
    semanticAttributes: [
      'rows',
      'placeholder',
      'name',
      'maxlength',
      'minlength',
      'spellcheck',
      'autocomplete',
      'wrap',
      'disabled',
      'readonly',
      'required',
      'aria-invalid',
      'aria-label',
      'aria-describedby',
      'style',
      'data-vf-filled',
    ],
    snapshot: 'textarea',
  },
  checkbox: {
    id: 'checkbox',
    label: 'VfCheckbox',
    component: 'checkbox',
    casesPath: 'contracts/checkbox/cases.json',
    policyPath: 'contracts/checkbox/parity-policy.json',
    artifactDirectory: 'parity-checkbox',
    reportName: 'checkbox-parity-report.json',
    measuredRoles: {
      root: '.vf-checkbox',
      control: 'input.vf-checkbox__input',
      mark: '.vf-checkbox__mark',
      indeterminateMark: '.vf-checkbox__indeterminate-mark',
      content: '.vf-checkbox__content',
    },
    // The control is what carries the role, the name and the checked state. The
    // decorative parts are listed so their absence from the tree is measured
    // rather than assumed.
    accessibilityRoles: {
      control: 'input.vf-checkbox__input',
      content: '.vf-checkbox__content',
    },
    semanticAttributes: [
      'checked',
      'indeterminate',
      'disabled',
      'required',
      'name',
      'value',
      'aria-checked',
      'aria-invalid',
      'aria-label',
      'style',
      'data-testid',
    ],
    snapshot: 'checkable',
  },
  radio: {
    id: 'radio',
    label: 'VfRadio',
    component: 'radio',
    casesPath: 'contracts/radio/cases.json',
    policyPath: 'contracts/radio/parity-policy.json',
    artifactDirectory: 'parity-radio',
    reportName: 'radio-parity-report.json',
    measuredRoles: {
      root: '.vf-radio',
      control: 'input.vf-radio__input',
      dot: '.vf-radio__dot',
      content: '.vf-radio__content',
    },
    // The control is what carries the role, the name and the checked state. The
    // decorative parts are listed so their absence from the tree is measured
    // rather than assumed.
    accessibilityRoles: {
      control: 'input.vf-radio__input',
      content: '.vf-radio__content',
    },
    semanticAttributes: [
      'checked',
      'disabled',
      'required',
      'name',
      'value',
      'aria-invalid',
      'aria-label',
      'style',
      'data-testid',
    ],
    snapshot: 'checkable',
  },
  switch: {
    id: 'switch',
    label: 'VfSwitch',
    component: 'switch',
    casesPath: 'contracts/switch/cases.json',
    policyPath: 'contracts/switch/parity-policy.json',
    artifactDirectory: 'parity-switch',
    reportName: 'switch-parity-report.json',
    measuredRoles: {
      root: '.vf-switch',
      control: 'input.vf-switch__input',
      thumb: '.vf-switch__thumb',
      content: '.vf-switch__content',
    },
    // The control is what carries the role, the name and the checked state. The
    // decorative parts are listed so their absence from the tree is measured
    // rather than assumed.
    accessibilityRoles: {
      control: 'input.vf-switch__input',
      content: '.vf-switch__content',
    },
    semanticAttributes: [
      'checked',
      'disabled',
      'required',
      'name',
      'role',
      'aria-invalid',
      'aria-label',
      'style',
      'data-testid',
    ],
    snapshot: 'checkable',
  },
  // The three M15 presentation components. Each has a single measured role,
  // because each renders exactly one element and nothing inside it. They are
  // the first profiles whose snapshot is `static`: nothing here can be driven,
  // and that fact is measured rather than skipped.
  //
  // Three profiles rather than one shared 'presentation' profile. Badge and Tag
  // differ only in a block name at this level, and collapsing them would mean
  // one report, one artifact directory and one policy for two components - so a
  // difference in either would arrive without saying which one it belonged to.
  badge: {
    id: 'badge',
    label: 'VfBadge',
    component: 'badge',
    casesPath: 'contracts/badge/cases.json',
    policyPath: 'contracts/badge/parity-policy.json',
    artifactDirectory: 'parity-badge',
    reportName: 'badge-parity-report.json',
    measuredRoles: {
      root: '.vf-badge',
    },
    // Listed so the absence is measured rather than assumed: a badge is a plain
    // span, exposing no role and no accessible name. An adapter that started
    // exposing one - role=status, say - would be an accessibility improvement
    // and a product change, and this is what notices.
    accessibilityRoles: {
      root: '.vf-badge',
    },
    semanticAttributes: ['class', 'style', 'role', 'aria-label', 'data-testid'],
    snapshot: 'static',
  },
  tag: {
    id: 'tag',
    label: 'VfTag',
    component: 'tag',
    casesPath: 'contracts/tag/cases.json',
    policyPath: 'contracts/tag/parity-policy.json',
    artifactDirectory: 'parity-tag',
    reportName: 'tag-parity-report.json',
    measuredRoles: {
      root: '.vf-tag',
    },
    accessibilityRoles: {
      root: '.vf-tag',
    },
    semanticAttributes: ['class', 'style', 'role', 'aria-label', 'data-testid'],
    snapshot: 'static',
  },
  divider: {
    id: 'divider',
    label: 'VfDivider',
    component: 'divider',
    casesPath: 'contracts/divider/cases.json',
    policyPath: 'contracts/divider/parity-policy.json',
    artifactDirectory: 'parity-divider',
    reportName: 'divider-parity-report.json',
    measuredRoles: {
      root: '.vf-divider',
    },
    // The only accessibility surface in the batch, and the reason this entry
    // matters: a horizontal divider must expose *no* role, which is only a
    // measurement because the selector is queried in both orientations.
    accessibilityRoles: {
      root: '.vf-divider',
    },
    // role and aria-orientation are the contract here, not incidental markup:
    // one is conditional on the orientation and both are overridable.
    semanticAttributes: ['class', 'style', 'role', 'aria-orientation', 'data-testid'],
    snapshot: 'static',
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
