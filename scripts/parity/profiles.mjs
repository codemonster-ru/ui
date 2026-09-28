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
  // The three M16 components. Also `static`, and the first batch where that
  // word means two different things: VfSkeleton and VfAvatar own no interaction
  // and hold nothing that could, while VfCard owns none and holds slots that
  // may hold anything. The profiles are identical in shape; what differs is
  // what the case catalog declares, and staticOwnershipViolations in extract.mjs
  // is where that difference is decided.
  //
  // Three profiles rather than one shared 'M16' profile, for the reason M15
  // recorded: one report, one artifact directory and one policy for three
  // components would mean a difference arriving without saying whose it was.
  skeleton: {
    id: 'skeleton',
    label: 'VfSkeleton',
    component: 'skeleton',
    casesPath: 'contracts/skeleton/cases.json',
    policyPath: 'contracts/skeleton/parity-policy.json',
    artifactDirectory: 'parity-skeleton',
    reportName: 'skeleton-parity-report.json',
    measuredRoles: {
      root: '.vf-skeleton',
    },
    // Listed so the absence is measured rather than assumed: a skeleton is
    // aria-hidden, so it should be absent from the accessibility tree entirely.
    // An adapter that started exposing it - as role=status, say - would be an
    // accessibility improvement and a product change, and this is what notices.
    accessibilityRoles: {
      root: '.vf-skeleton',
    },
    // style is the contract here rather than incidental markup: the component
    // writes min-height and border-radius itself and merges a consumer style
    // over them, and it is the only migrated component that does both.
    semanticAttributes: ['class', 'style', 'aria-hidden', 'role', 'aria-label', 'data-testid'],
    snapshot: 'static',
  },
  avatar: {
    id: 'avatar',
    label: 'VfAvatar',
    component: 'avatar',
    casesPath: 'contracts/avatar/cases.json',
    policyPath: 'contracts/avatar/parity-policy.json',
    artifactDirectory: 'parity-avatar',
    reportName: 'avatar-parity-report.json',
    // One role per branch of the fallback chain, so a branch that stopped
    // rendering is a missing measurement rather than a silently smaller DOM.
    measuredRoles: {
      root: '.vf-avatar',
      image: '.vf-avatar__image',
      label: '.vf-avatar__label',
      glyphWrapper: '.vf-avatar .vf-icon-wrapper',
      glyph: '.vf-avatar__icon',
    },
    // The root and the image are listed because their absence from the tree is
    // the contract - an avatar exposes no role, and a decorative image exposes
    // nothing either. The glyph is listed for the same reason: it is
    // aria-hidden, so an icon-only avatar must contribute no accessible name,
    // and that is only a measurement if the selector is queried.
    accessibilityRoles: {
      root: '.vf-avatar',
      image: '.vf-avatar__image',
      glyph: '.vf-avatar__icon',
    },
    semanticAttributes: [
      'class',
      'style',
      'alt',
      'src',
      'aria-hidden',
      'role',
      'aria-label',
      'width',
      'height',
      'data-testid',
    ],
    snapshot: 'static',
  },
  card: {
    id: 'card',
    label: 'VfCard',
    component: 'card',
    casesPath: 'contracts/card/cases.json',
    policyPath: 'contracts/card/parity-policy.json',
    artifactDirectory: 'parity-card',
    reportName: 'card-parity-report.json',
    // One role per region. The header and footer are addressed as direct
    // children of the root rather than by class, because they have no class -
    // which is the historical detail this component is here to preserve.
    measuredRoles: {
      root: '.vf-card',
      header: '.vf-card > header',
      title: '.vf-card__title',
      body: '.vf-card__body',
      footer: '.vf-card > footer',
    },
    // A section with no accessible name exposes no landmark role, and the card
    // never names itself. Listing the root is how "no landmark" becomes a
    // measurement instead of an assumption; listing the title is how "the
    // heading is a heading" stays one.
    accessibilityRoles: {
      root: '.vf-card',
      title: '.vf-card__title',
    },
    semanticAttributes: ['class', 'style', 'role', 'aria-label', 'data-testid'],
    snapshot: 'static',
  },
  // The M18 component, and the profile written to be *unlike* its neighbour.
  //
  // The measured roles are where that shows. VfCard's profile names five roles;
  // this one names three, and two of the missing ones are named here anyway as
  // absences the harness must keep measuring: `cardBody` and `footer` are
  // selectors for elements a panel does not have. A role that resolves to
  // nothing on every target is a clean measurement of "nothing is here"; a role
  // that started resolving on any target is a Card-shaped implementation, and
  // it fails as a structural difference rather than going unnoticed because
  // nobody thought to look for an element the component never renders.
  panel: {
    id: 'panel',
    label: 'VfPanel',
    component: 'panel',
    casesPath: 'contracts/panel/cases.json',
    policyPath: 'contracts/panel/parity-policy.json',
    artifactDirectory: 'parity-panel',
    reportName: 'panel-parity-report.json',
    measuredRoles: {
      root: '.vf-panel',
      // Addressed as a direct child rather than by class, because it has no
      // class - the historical detail this component shares with VfCard and
      // that both preserve independently.
      header: '.vf-panel > header',
      title: '.vf-panel__title',
      // The two elements a panel does not have, measured so that their absence
      // is a fact rather than an omission. A card renders both.
      body: '.vf-panel__body',
      footer: '.vf-panel > footer',
    },
    // A section with no accessible name exposes no landmark role, and the panel
    // never names itself. Listing the root is how "no landmark" becomes a
    // measurement instead of an assumption; listing the title is how "the
    // heading is a heading" stays one.
    accessibilityRoles: {
      root: '.vf-panel',
      title: '.vf-panel__title',
    },
    semanticAttributes: ['class', 'style', 'role', 'aria-label', 'data-testid'],
    snapshot: 'static',
    // Redundant beside `snapshot: 'static'`, which already selects the ownership
    // assertion, and declared anyway: the M17 separation exists so that a
    // profile whose snapshot shape changes does not silently stop being checked
    // for component-owned interaction. A panel owns none, and says so here
    // rather than inheriting the claim from a snapshot name.
    staticOwnership: true,
  },
  // The M19 component, and the first profile whose root is expected to expose
  // a role of the component's own making.
  //
  // Everything the alert writes is measured, and so are the two things it
  // does not have. The glyph, its wrapper and the icon container are three
  // roles rather than one: the container is where aria-hidden lives, the
  // wrapper is what the icon package emits, and the glyph is where the large
  // size lands. `ownedControl` is a selector for a focusable element sitting
  // directly in the section or directly in the content wrapper - the only
  // places a control the *component* rendered could be, since consumer slot
  // content is always inside the icon container, the title paragraph or the
  // body. It resolves to nothing on every target, and a target where it
  // started resolving has grown a dismiss button.
  alert: {
    id: 'alert',
    label: 'VfAlert',
    component: 'alert',
    casesPath: 'contracts/alert/cases.json',
    policyPath: 'contracts/alert/parity-policy.json',
    artifactDirectory: 'parity-alert',
    reportName: 'alert-parity-report.json',
    measuredRoles: {
      root: '.vf-alert',
      icon: '.vf-alert__icon',
      glyphWrapper: '.vf-alert__icon .vf-icon-wrapper',
      glyph: '.vf-alert__icon svg',
      content: '.vf-alert__content',
      title: '.vf-alert__title',
      body: '.vf-alert__body',
      ownedControl:
        '.vf-alert > button, .vf-alert > a, .vf-alert > [tabindex], ' +
        '.vf-alert__content > button, .vf-alert__content > a, .vf-alert__content > [tabindex]',
    },
    // The root is listed because exposing `alert` is the contract - for every
    // tone, and `status` only when a consumer says so. The icon container and
    // the glyph are listed because their absence from the tree is the
    // contract: the container is aria-hidden and the glyph is inside it, so an
    // alert contributes no name through its icon. The title is listed so "the
    // title is a paragraph and not a heading" stays a measurement. The consumer
    // control is listed so a consumer's button exposes its own role and name
    // and the alert adds nothing to either.
    accessibilityRoles: {
      root: '.vf-alert',
      icon: '.vf-alert__icon',
      glyph: '.vf-alert__icon svg',
      title: '.vf-alert__title',
      consumerControl: '.vf-alert button, .vf-alert a[href]',
    },
    // role and aria-hidden are the contract here rather than incidental
    // markup: the section's role is the first a migrated component writes
    // unconditionally, and the container's aria-hidden is what makes the glyph
    // decorative. aria-live and aria-atomic are listed because their *absence*
    // is the contract - the reference writes neither - and a comparison that
    // never looked at them could not report an adapter that started writing
    // one. width and height carry the large size the alert asks for.
    semanticAttributes: [
      'class',
      'style',
      'role',
      'aria-hidden',
      'aria-live',
      'aria-atomic',
      'aria-label',
      'width',
      'height',
      'data-testid',
    ],
    snapshot: 'static',
    staticOwnership: true,
  },
  // The M20 component, and the first profile for a component another profile
  // already measures: the button's `spinner` and `spinnerArtwork` roles are
  // this component, composed. This profile is the standalone one, and it
  // measures what the button never sends - eight tones, every size form, the
  // stroke on the track - as well as what a consumer can do to the root.
  //
  // Four roles rather than one, because the geometry is the contract: the
  // root box is the custom property resolved, the svg fills it, and the two
  // circles carry the radius and the stroke the stylesheet's dash lengths
  // were computed against. The circles are listed as roles so a radius that
  // moved is a geometry difference on a named node, not a screenshot.
  'progress-spinner': {
    id: 'progress-spinner',
    label: 'VfProgressSpinner',
    component: 'progress-spinner',
    casesPath: 'contracts/progress-spinner/cases.json',
    policyPath: 'contracts/progress-spinner/parity-policy.json',
    artifactDirectory: 'parity-progress-spinner',
    reportName: 'progress-spinner-parity-report.json',
    measuredRoles: {
      root: '.vf-progress-spinner',
      artwork: '.vf-progress-spinner__svg',
      track: '.vf-progress-spinner__track',
      value: '.vf-progress-spinner__value',
    },
    // The root is listed because exposing `progressbar` with a name is the
    // contract - for every tone, `status` only when a consumer says so, and
    // no value unless a consumer forwards one. The artwork is listed for the
    // opposite reason: it is aria-hidden, so its absence from the tree is the
    // contract, and that is only a measurement if the selector is queried.
    accessibilityRoles: {
      root: '.vf-progress-spinner',
      artwork: '.vf-progress-spinner__svg',
    },
    // role, aria-label and aria-hidden are the contract rather than incidental
    // markup: the root is the first migrated progressbar, its name is a prop,
    // and the svg's aria-hidden is what makes the artwork decorative. The
    // three aria-value* names are listed because their *absence* is the
    // contract - the reference writes none - and a comparison that never
    // looked at them could not report an adapter that started writing one.
    // focusable is the other half of the artwork's contract. viewBox and the
    // circle attributes are the geometry the stylesheet's dash keyframes were
    // computed against; stroke-width is the one prop that reaches the svg.
    semanticAttributes: [
      'class',
      'style',
      'role',
      'aria-label',
      'aria-hidden',
      'aria-valuenow',
      'aria-valuemin',
      'aria-valuemax',
      'focusable',
      'viewBox',
      'cx',
      'cy',
      'r',
      'fill',
      'stroke-width',
      'data-testid',
    ],
    snapshot: 'static',
    staticOwnership: true,
  },
  // The M21 component, and the profile beside the spinner's: the two share
  // the role name and the tone union, and this profile measures everything
  // the spinner's cannot - a value, a maximum, a fill whose width *is* the
  // value, and a label inside it.
  //
  // Three roles. The fill is listed because its box width is the painted
  // value measured in pixels of the track, which is how a wrong formula, a
  // rounded ratio or a fill that kept its width while indeterminate is caught
  // on a named node without a screenshot. The label is listed so its
  // presence, its text and its placement inside the fill stay measurements.
  'progress-bar': {
    id: 'progress-bar',
    label: 'VfProgressBar',
    component: 'progress-bar',
    casesPath: 'contracts/progress-bar/cases.json',
    policyPath: 'contracts/progress-bar/parity-policy.json',
    artifactDirectory: 'parity-progress-bar',
    reportName: 'progress-bar-parity-report.json',
    measuredRoles: {
      root: '.vf-progress-bar',
      fill: '.vf-progress-bar__value',
      label: '.vf-progress-bar__label',
    },
    // The root is listed because exposing `progressbar` with a name *and a
    // value* is the contract: the browser derives valuenow, valuemin and
    // valuemax from the three attributes, and the a11y.states dimension is
    // where a stale or missing one is caught from the tree rather than from
    // the markup. The fill and the label are listed for the opposite reason:
    // neither has a role, so what they expose - nothing, or a static text -
    // is only a measurement if the selector is queried.
    accessibilityRoles: {
      root: '.vf-progress-bar',
      fill: '.vf-progress-bar__value',
      label: '.vf-progress-bar__label',
    },
    // The three aria-value* names are the contract here rather than
    // incidental markup: the bar is the first migrated progressbar that
    // *writes* them, and their presence while determinate and absence while
    // indeterminate are both compared. aria-valuetext is listed because a
    // consumer forwards it and the reference never writes it. aria-labelledby
    // is a relationship edge; style on the fill is the painted value.
    semanticAttributes: [
      'class',
      'style',
      'role',
      'aria-label',
      'aria-labelledby',
      'aria-valuenow',
      'aria-valuemin',
      'aria-valuemax',
      'aria-valuetext',
      'aria-hidden',
      'data-testid',
    ],
    snapshot: 'static',
    staticOwnership: true,
  },
  // The M17 component, and the first profile that declares two things at once.
  // VfSkeletonGate owns no interaction, so it needs the static ownership
  // measurement every M15/M16 component has; and its state can change after
  // mount, so it also needs a driven transition. Those used to be the same
  // switch - `snapshot: 'static'` selected both the snapshot shape and the
  // ownership assertion - so the two are separated here into `snapshot` and
  // `staticOwnership`. That is the whole infrastructure change: no new stage,
  // no new engine, one flag that says what a profile already meant.
  'skeleton-gate': {
    id: 'skeleton-gate',
    label: 'VfSkeletonGate',
    component: 'skeleton-gate',
    casesPath: 'contracts/skeleton-gate/cases.json',
    policyPath: 'contracts/skeleton-gate/parity-policy.json',
    artifactDirectory: 'parity-skeleton-gate',
    reportName: 'skeleton-gate-parity-report.json',
    // One role per element, including the child skeleton. The child is listed
    // under its own name rather than folded into the overlay: a gate that
    // stopped rendering it, or rendered something else that happened to fill
    // the overlay, is a missing measurement here rather than an overlay that
    // merely looks the same.
    measuredRoles: {
      root: '.vf-skeleton-gate',
      content: '.vf-skeleton-gate__content',
      overlay: '.vf-skeleton-gate__overlay',
      childSkeleton: '.vf-skeleton-gate__overlay .vf-skeleton',
    },
    // All four are listed because their absence from the accessibility tree is
    // the contract. The gate writes no role anywhere; the overlay is
    // aria-hidden in both states; the content wrapper is aria-hidden and inert
    // while loading and must appear once ready, which is the one entry here
    // that is expected to be present in some cases and absent in others - and
    // that difference is the predicate's accessibility output.
    accessibilityRoles: {
      root: '.vf-skeleton-gate',
      content: '.vf-skeleton-gate__content',
      overlay: '.vf-skeleton-gate__overlay',
      childSkeleton: '.vf-skeleton-gate__overlay .vf-skeleton',
    },
    // aria-busy and inert are the contract here rather than incidental markup:
    // one is the loading state's announcement and the other is what makes the
    // faded content unreachable. `inert` had no comparison at all before M17.
    semanticAttributes: ['class', 'style', 'aria-busy', 'aria-hidden', 'inert', 'role', 'data-testid'],
    snapshot: 'skeleton-gate',
    staticOwnership: true,
    // Which targets can be driven through a state change, and why the third
    // cannot.
    //
    // `ready` is a prop. In Vue it is the *consumer* that changes it and the
    // component that reacts; the component owns no client behaviour of its own
    // and exposes no client API. The Razor adapter's equivalent of a consumer
    // changing a prop is the consumer rendering the page again, so a Razor gate
    // is a server render of one state and there is nothing to drive. Giving it
    // a browser controller that flipped `ready` would hand this adapter an API
    // the reference component never had.
    //
    // That is not a hole in the evidence, because the transition contract is
    // proved in two halves that meet:
    //
    //   - on the Vue targets, a driven transition must converge on the DOM of
    //     the case the catalog names - a within-target invariant, checked on
    //     reference and current independently;
    //   - that named case is itself compared three ways by the ordinary run,
    //     Razor included.
    //
    // So "a transition lands on the canonical state" and "Razor renders the
    // canonical state" together give "a transition lands on what Razor renders",
    // and each half is measured rather than assumed.
    //
    // Declared here rather than inferred from what each target happens to do,
    // which is the whole point: the runner asserts the actual capability
    // against this list in both directions. A Vue target that silently stopped
    // transitioning fails, and so does a Razor target that started.
    transitionTargets: ['reference', 'current'],
  },
  accordion: {
    id: 'accordion',
    label: 'VfAccordion',
    component: 'accordion',
    casesPath: 'contracts/accordion/cases.json',
    policyPath: 'contracts/accordion/parity-policy.json',
    artifactDirectory: 'parity-accordion',
    reportName: 'accordion-parity-report.json',
    measuredRoles: {
      root: '.vf-accordion',
      trigger: '.vf-accordion__trigger',
      icon: '.vf-accordion__icon',
      glyph: '.vf-accordion__icon svg',
      panel: '.vf-accordion__content',
      inner: '.vf-accordion__content-inner',
    },
    // The trigger carries the role, the name, the expanded and disabled
    // states; the panel is a region named by the trigger. The icon and its
    // glyph are listed for the opposite reason - aria-hidden, so expected
    // absent, which is only a measurement if the selector is queried.
    accessibilityRoles: {
      trigger: '.vf-accordion__trigger',
      panel: '.vf-accordion__content',
      icon: '.vf-accordion__icon',
      glyph: '.vf-accordion__icon svg',
    },
    semanticAttributes: [
      'class',
      'style',
      'id',
      'type',
      'disabled',
      'role',
      'hidden',
      'aria-expanded',
      'aria-controls',
      'aria-labelledby',
      'aria-disabled',
      'aria-label',
      'aria-hidden',
      'data-testid',
    ],
    snapshot: 'accordion',
    activationSelector: '.vf-accordion__trigger',
    // The first profile whose component owns a control, and the declaration
    // the ownership stage measures every case against: the role, the selector
    // that finds it, and the tag it has to be. The count comes from each case
    // (`componentInteractive`); the identity comes from here. A profile
    // declaring `{}` fails closed - see controlOwnershipViolations.
    controlOwnership: {
      trigger: { selector: '.vf-accordion__trigger', tag: 'button' },
    },
    // Every scenario is re-measured after it runs: DOM, accessibility tree,
    // ownership against the scenario's budget, and convergence on the case it
    // names. See the interaction loop in run.mjs.
    liveParity: true,
  },
  stepper: {
    id: 'stepper',
    label: 'VfStepper',
    component: 'stepper',
    casesPath: 'contracts/stepper/cases.json',
    policyPath: 'contracts/stepper/parity-policy.json',
    artifactDirectory: 'parity-stepper',
    reportName: 'stepper-parity-report.json',
    measuredRoles: {
      root: '.vf-stepper',
      list: '.vf-stepper__list',
      item: '.vf-stepper__item',
      trigger: '.vf-stepper__trigger',
      rail: '.vf-stepper__rail',
      connector: '.vf-stepper__connector',
      marker: '.vf-stepper__marker',
      content: '.vf-stepper__content',
      label: '.vf-stepper__label',
      description: '.vf-stepper__description',
    },
    // The nav carries the accessible name; each trigger carries the role, its
    // name, disabled and focusable. Three triggers are listed by position so
    // a post-interaction claim can name the one that moved. The rail is
    // listed for the opposite reason - aria-hidden, so expected absent. What
    // the tree does *not* expose is the current step: Chrome 153 derives no
    // changing property from aria-current=step, so the selection is proved
    // by the DOM and never claimed here (the coverage gate refuses the claim).
    accessibilityRoles: {
      nav: '.vf-stepper',
      firstTrigger: '.vf-stepper__item:nth-child(1) > .vf-stepper__trigger',
      secondTrigger: '.vf-stepper__item:nth-child(2) > .vf-stepper__trigger',
      thirdTrigger: '.vf-stepper__item:nth-child(3) > .vf-stepper__trigger',
      rail: '.vf-stepper__rail',
    },
    semanticAttributes: [
      'class',
      'style',
      'type',
      'disabled',
      'role',
      'aria-current',
      'aria-label',
      'aria-hidden',
      'aria-disabled',
      'data-vf-stepper-value',
      'data-testid',
    ],
    snapshot: 'stepper',
    activationSelector: '.vf-stepper__trigger',
    // The second profile whose component owns controls, and the first whose
    // instance owns several of one role. The identity is the same shape as
    // the accordion's: a role, the selector that finds it, the tag it has to
    // be. The count comes from each case (`componentInteractive`, one per
    // item over every instance); nothing here knows what an item is.
    controlOwnership: {
      trigger: { selector: '.vf-stepper__trigger', tag: 'button' },
    },
    liveParity: true,
  },
  tabs: {
    id: 'tabs',
    label: 'VfTabs',
    component: 'tabs',
    casesPath: 'contracts/tabs/cases.json',
    policyPath: 'contracts/tabs/parity-policy.json',
    artifactDirectory: 'parity-tabs',
    reportName: 'tabs-parity-report.json',
    measuredRoles: {
      root: '.vf-tabs',
      list: '.vf-tabs__list',
      viewport: '.vf-tabs__list-scroller',
      tablist: '[role="tablist"]',
      tab: '.vf-tabs__tab',
      scrollLeft: '.vf-tabs__scroll-button--left',
      scrollRight: '.vf-tabs__scroll-button--right',
      fade: '.vf-horizontal-scroller__fade',
      baseline: '.vf-tabs__baseline',
      indicator: '.vf-tabs__indicator',
      panel: '.vf-tabs__panel',
    },
    // The tablist carries the orientation; each tab carries the role, its
    // name, disabled, focusable and - Chrome 153 exposes it for role=tab -
    // selected, which is what makes the tree an independent proof of the
    // selection beside dom.aria. Three tabs are listed by position so a
    // post-interaction claim can name the one that moved. The panel is named
    // through aria-labelledby by the selected tab. The two scroll buttons are
    // listed for the opposite reason while hidden - aria-hidden, so expected
    // absent - and exposed as named buttons once an overflow shows them.
    accessibilityRoles: {
      tablist: '[role="tablist"]',
      firstTab: '[role="tablist"] > .vf-tabs__tab:nth-child(1)',
      secondTab: '[role="tablist"] > .vf-tabs__tab:nth-child(2)',
      thirdTab: '[role="tablist"] > .vf-tabs__tab:nth-child(3)',
      panel: '.vf-tabs__panel',
      scrollLeft: '.vf-tabs__scroll-button--left',
      scrollRight: '.vf-tabs__scroll-button--right',
    },
    semanticAttributes: [
      'class',
      'style',
      'type',
      'disabled',
      'role',
      'id',
      'tabindex',
      'aria-selected',
      'aria-controls',
      'aria-labelledby',
      'aria-orientation',
      'aria-label',
      'aria-hidden',
      'data-testid',
    ],
    snapshot: 'tabs',
    activationSelector: '.vf-tabs__tab',
    // The third profile whose component owns controls, and the first whose
    // controls carry an explicit interactive role and come in several kinds:
    // one tab per item, the two scroll buttons of the internal scroller, and
    // the panel (tabindex 0, so focusable, and the component's). Each rule is
    // the same shape as before - a role, the selector that finds it, the tag
    // it has to be - and the tab rule adds the one thing M24 needed: the
    // explicit `ariaRole` every matched control must carry. The count comes
    // from each case (`componentInteractive`); nothing here knows what an
    // item is.
    controlOwnership: {
      tab: { selector: '.vf-tabs__tab', tag: 'button', ariaRole: 'tab' },
      scrollLeft: { selector: '.vf-tabs__scroll-button--left', tag: 'button' },
      scrollRight: { selector: '.vf-tabs__scroll-button--right', tag: 'button' },
      panel: { selector: '.vf-tabs__panel', tag: 'div' },
    },
    liveParity: true,
  },
  // The M25 component, and the first whose owned control is a native anchor
  // rather than a button - and the first control-owning profile with no
  // interaction at all. A link handles no click and no key: activation is the
  // browser's, so the catalog declares no scenario, `liveParity` is not set,
  // and every case is measured once, in its initial state, by the same
  // ownership stage the accordion, the stepper and the tabs run after theirs.
  //
  // The catalog is the native branch only. The Vue component's other branch -
  // `to`, `component`, the RouterLink handoff and the unresolved element Vue
  // renders without a router - is pinned by the characterization suite and is
  // not a shape two of the three targets can render, so no case here spells
  // it and the coverage gate refuses one that does.
  link: {
    id: 'link',
    label: 'VfLink',
    component: 'link',
    casesPath: 'contracts/link/cases.json',
    policyPath: 'contracts/link/parity-policy.json',
    artifactDirectory: 'parity-link',
    reportName: 'link-parity-report.json',
    // One role. The anchor is the whole component; the slot content inside it
    // is the consumer's and is compared as DOM rather than measured as a role.
    measuredRoles: {
      anchor: '.vf-link',
    },
    // The anchor is listed because exposing `link` with an href, and nothing
    // at all without one, is the contract - an anchor with no destination is
    // ignored by the tree, and querying it is what makes that absence a
    // measurement. The consumer control is listed so a button a consumer put
    // inside the anchor exposes its own role and name and the link adds
    // nothing to either.
    accessibilityRoles: {
      anchor: '.vf-link',
      consumerControl: '.vf-link button',
    },
    // href, target and rel are the contract: the three attributes a native
    // link is made of, and the three M25 added to the compared vocabulary
    // after reproducing that a wrong href, a dropped target and a dropped rel
    // each passed unnoticed. aria-current is listed because Chrome 153 exposes
    // no current state in the accessibility tree, so the DOM attribute is the
    // only evidence of it. role and tabindex are listed because their
    // *absence* is the contract - the reference writes neither on any anchor,
    // and in particular not on the no-destination one.
    semanticAttributes: [
      'class',
      'style',
      'id',
      'href',
      'target',
      'rel',
      'role',
      'tabindex',
      'aria-label',
      'aria-current',
      'aria-describedby',
      'data-testid',
    ],
    snapshot: 'link',
    // The owned control is the anchor *with a destination*. The selector
    // carries `[href]` on purpose: an `<a>` without href is inert - not
    // focusable, ignored by the accessibility tree - and the reference renders
    // exactly that for a link with no destination, so link/no-destination
    // declares componentInteractive 0 and this selector finds nothing there.
    // Without the `[href]` the generic equation `owned + consumer ===
    // focusable` would reject the correct reference render of that case, and
    // the alternative - weakening the equation - would let every profile count
    // an unfocusable node as a control. The tag is `a`: an element with the
    // right attribute on the wrong tag is found by the selector and rejected
    // by identity, and an anchor that lost its href stops being found at all
    // and fails on count.
    controlOwnership: {
      anchor: { selector: '.vf-link[href]', tag: 'a' },
    },
  },
  breadcrumbs: {
    id: 'breadcrumbs',
    label: 'VfBreadcrumbs',
    component: 'breadcrumbs',
    casesPath: 'contracts/breadcrumbs/cases.json',
    policyPath: 'contracts/breadcrumbs/parity-policy.json',
    artifactDirectory: 'parity-breadcrumbs',
    reportName: 'breadcrumbs-parity-report.json',
    // The nav, the first link, the first current span and the first separator.
    // The disabled modifier is a colour and nothing else, and the separator
    // box is sized by the small icon token.
    measuredRoles: {
      nav: '.vf-breadcrumbs',
      link: '.vf-breadcrumbs__link',
      current: '.vf-breadcrumbs__current',
      separator: '.vf-breadcrumbs__separator',
    },
    // The landmark, the list, the first item, the first link and the first
    // current span are listed for what they expose; the separator and the
    // glyph inside it for what they must *not*: the separator is aria-hidden,
    // so both are ignored by the tree and absent here, and a separator that
    // lost its aria-hidden exposes the glyph as an image. Chrome 153 exposes
    // no current state for aria-current, so the current span is a generic
    // node whose presence is the whole of what the tree says about it; the
    // DOM carries the attribute.
    accessibilityRoles: {
      nav: '.vf-breadcrumbs',
      list: '.vf-breadcrumbs__list',
      item: '.vf-breadcrumbs__item',
      link: '.vf-breadcrumbs__link',
      current: '.vf-breadcrumbs__current',
      separator: '.vf-breadcrumbs__separator',
      glyph: '.vf-breadcrumbs__separator svg',
    },
    // href, target and rel on every anchor, aria-current on every current
    // span, aria-hidden on every separator, aria-label on the nav, the
    // consumer's class, style, id, data-* and aria-describedby on the nav -
    // and `points`, the separator glyph's geometry: the one attribute a
    // chevron-right and a chevron-down differ in, added to the compared
    // vocabulary in M26 after reproducing that the swap passed every DOM
    // dimension. role and tabindex are listed because their absence is the
    // contract: the reference writes neither on any anchor or span.
    semanticAttributes: [
      'class',
      'style',
      'id',
      'href',
      'target',
      'rel',
      'role',
      'tabindex',
      'aria-label',
      'aria-current',
      'aria-hidden',
      'aria-describedby',
      'data-testid',
      'points',
    ],
    snapshot: 'breadcrumbs',
    // The owned controls are the anchors *with a destination*, however many
    // the historical rule makes: the current item, a disabled item and an
    // item with no destination are spans and are not found. The selector
    // carries `[href]` for the reason the link's does - an anchor that lost
    // its href stops being found and fails on count - and no tag, so a button
    // or a div with role=link carrying the class is found and rejected by
    // identity. Each case declares the number its items produce, and the
    // coverage gate checks that number against the rule.
    controlOwnership: {
      link: { selector: '.vf-breadcrumbs__link[href]', tag: 'a' },
    },
  },
  // The M27 pair, and two profiles rather than one. VfMenu owns no control and
  // VfMenuItem owns exactly one, and folding them together would mean either
  // counting the items a menu contains as the menu's - which they are not, they
  // are another public component's - or giving the item catalog a menu wrapper
  // it does not need. The two components share a block name in one stylesheet
  // and nothing else: no import, no inject, no delegation, no descendant
  // selector.
  menu: {
    id: 'menu',
    label: 'VfMenu',
    component: 'menu',
    casesPath: 'contracts/menu/cases.json',
    policyPath: 'contracts/menu/parity-policy.json',
    artifactDirectory: 'parity-menu',
    reportName: 'menu-parity-report.json',
    // One element to measure, because there is one element. The flex column
    // and its gap are the whole of the menu's own geometry.
    measuredRoles: {
      menu: '.vf-menu',
    },
    // The root alone. What a menu contains is the consumer's and is compared
    // as ordinary DOM; the tree is asked only what the menu itself exposes -
    // which is a role, no name unless a consumer gives one, and no state.
    accessibilityRoles: {
      menu: '.vf-menu',
    },
    // The consumer's class, style, id, tabindex, data-* and the aria a
    // consumer forwards - and `role`, which is listed because it is the one
    // attribute this component writes and the one a consumer can take away
    // from it. Compared as a raw attribute so the consumer class landing
    // *after* the block class is part of the comparison rather than a sorted
    // set that hides the position.
    semanticAttributes: [
      'class',
      'style',
      'id',
      'role',
      'tabindex',
      'aria-label',
      'aria-labelledby',
      'aria-describedby',
      'data-testid',
    ],
    // The static posture, which is the honest one: the component owns no
    // control, so what is asserted is that every focusable element in a case
    // is the consumer's declared budget and that nothing carries an explicit
    // interactive role. No case gives consumer content a menuitem role, so
    // that total stays zero and stays meaningful - the composition of a menu
    // with items adds no node either component does not already produce
    // alone, and it is pinned by the characterization suites instead.
    snapshot: 'static',
  },
  menuItem: {
    id: 'menuItem',
    label: 'VfMenuItem',
    component: 'menu-item',
    casesPath: 'contracts/menu-item/cases.json',
    policyPath: 'contracts/menu-item/parity-policy.json',
    artifactDirectory: 'parity-menu-item',
    reportName: 'menu-item-parity-report.json',
    // The control, the glyph and the label. The control is where the overlay
    // token proves itself: its border width comes from
    // --vf-overlay-border-width, so a target without overlay-primitives.css
    // computes `medium` here instead of 1px.
    measuredRoles: {
      item: '.vf-menu__item',
      icon: '.vf-menu__item-icon',
      label: '.vf-menu__item-label',
    },
    // The control for its role, name and states; the glyph for what it must
    // *not* expose - it is aria-hidden, so it is ignored by the tree and
    // absent here, and a glyph that lost its aria-hidden appears as an image.
    // Chrome exposes no state for `active`, so the item's own node is where
    // that absence is visible: the DOM carries the modifier class and the
    // tree carries nothing.
    accessibilityRoles: {
      item: '.vf-menu__item',
      icon: '.vf-menu__item-icon',
      label: '.vf-menu__item-label',
    },
    // href, target, rel, type, disabled and tabindex on the control, the
    // consumer's style, id, data-* and aria - and `d`, the glyph's path
    // geometry.
    //
    // `d` is listed for a different reason from the rest. This is the first
    // migrated component whose glyph a *consumer* names, and `bookmark`,
    // `filter` and `moon` - the fallback - have identical structure, identical
    // svg presentation attributes and identical wrapper styles, differing in
    // nothing but this attribute. M27 reproduced the false PASS that follows,
    // and the reproduction has two halves.
    //
    // Striking `d` from *this list* changes nothing: the glyph mutations are
    // still detected, because extraction reads the extractor's global
    // vocabulary and not the profile's, and `d` has been in that vocabulary
    // since M07 - which the M26 note beside `points` says in as many words.
    //
    // Striking `d` from the *global vocabulary* is the genuine pre-`d`
    // comparator, and there a real Razor page rendering `filter` where the
    // reference renders `bookmark` passes every one of the fifteen non-pixel
    // dimensions, in both directions and both themes; the accessibility tree
    // cannot see it because the glyph is aria-hidden, and the capture
    // mutations cannot even apply because the DOM record carries no geometry.
    // Only the screenshot fires, and a screenshot-only catch is not closure.
    //
    // So what this declaration buys is the attribute-coverage gate, which
    // turns it into an assertion that the global list still carries `d`: the
    // component whose glyph a consumer names is the one that should notice if
    // it ever stops being compared.
    //
    // `type` is load-bearing beyond the comparison: it is what tells the two
    // ownership rules below which branch rendered.
    semanticAttributes: [
      'class',
      'style',
      'id',
      'href',
      'target',
      'rel',
      'role',
      'type',
      'disabled',
      'tabindex',
      'aria-label',
      'aria-hidden',
      'aria-disabled',
      'aria-describedby',
      'data-testid',
      'd',
    ],
    snapshot: 'menu-item',
    // Two rules, one per branch, because one rule cannot carry two tags. The
    // discriminator is `type`, not `href`: a disabled anchor drops its href
    // and would be matched by an `:not([href])` rule and rejected as the
    // wrong tag, so an href-based split cannot even describe the reference.
    // `type="button"` is written unconditionally on the button branch and
    // never on the anchor branch, so it splits all four states correctly.
    //
    // Neither selector names a tag, which is deliberate and the same choice
    // VfBreadcrumbs made: a div with role=menuitem carrying the class is
    // *found* and rejected by tag identity rather than silently vanishing
    // from the count. Both rules declare the explicit role, so the
    // explicit-role total equals the owned-control count and a substituted or
    // missing role fails by identity.
    controlOwnership: {
      action: { selector: '.vf-menu__item[type="button"]', tag: 'button', ariaRole: 'menuitem' },
      link: { selector: '.vf-menu__item:not([type])', tag: 'a', ariaRole: 'menuitem' },
    },
  },
  // The M28 component, and the first whose product DOM is partly outside its
  // case: the menu is teleported to <body> and found through the trigger's
  // aria-controls, which is the one declared reference the extractor follows
  // (followedReferences, M28.0) and the one the snapshot, the steps
  // (`through`) and the accessibility roles (`followed(...)`) resolve through
  // too. The component owns one control per instance - the trigger wrapper, a
  // div with tabindex and no role - and nothing else: the menu is a
  // structural overlay node, and every item in it is the consumer's,
  // counted against the case's consumer budget and, for its explicit
  // role=menuitem, against its declared consumer roles.
  dropdown: {
    id: 'dropdown',
    label: 'VfDropdown',
    component: 'dropdown',
    casesPath: 'contracts/dropdown/cases.json',
    policyPath: 'contracts/dropdown/parity-policy.json',
    artifactDirectory: 'parity-dropdown',
    reportName: 'dropdown-parity-report.json',
    measuredRoles: {
      root: '.vf-dropdown',
      trigger: '.vf-dropdown__trigger',
      triggerControl: '.parity-trigger-control',
      inPlaceMenu: '.vf-dropdown__menu',
    },
    // The trigger is a generic element Chrome names nothing and exposes as
    // focusable with a menu popup - not expanded: aria-expanded is DOM-only
    // on a generic role. The menu and its items are read where they are,
    // through the trigger's aria-controls; the menu is named by its trigger.
    accessibilityRoles: {
      trigger: '.vf-dropdown__trigger',
      triggerControl: '.parity-trigger-control',
      menu: 'followed(.vf-dropdown__trigger, aria-controls)',
      firstItem: 'followed(.vf-dropdown__trigger, aria-controls) [role="menuitem"]',
      disabledItem:
        'followed(.vf-dropdown__trigger, aria-controls) [role="menuitem"]:is([disabled], [aria-disabled="true"])',
      arrow: 'followed(.vf-dropdown__trigger, aria-controls) .vf-dropdown__arrow',
    },
    semanticAttributes: [
      'class',
      'style',
      'id',
      'role',
      'type',
      'disabled',
      'href',
      'tabindex',
      'aria-controls',
      'aria-labelledby',
      'aria-expanded',
      'aria-haspopup',
      'aria-disabled',
      'aria-hidden',
      'aria-label',
      'data-testid',
    ],
    snapshot: 'dropdown',
    activationSelector: '.vf-dropdown__trigger',
    controlOwnership: {
      trigger: { selector: '.vf-dropdown__trigger', tag: 'div' },
    },
    followedReferences: [{ source: '.vf-dropdown__trigger', attribute: 'aria-controls' }],
    liveParity: true,
  },
  // The M29 component: a native fieldset whose legend holds a disclosure
  // trigger - a ghost VfButton - only when the group is collapsible and titled.
  // The first owning profile whose cases legitimately own zero controls as
  // often as one: every static form (untitled, titled and not collapsible,
  // collapsible without a title) declares componentInteractive: 0 and is
  // measured against the same rule. Everything is inside the case root, so
  // there is no followedReferences declaration: the closed aria-controls
  // dangles inside the case and is compared as #dangling, as the accordion's.
  'group-box': {
    id: 'group-box',
    label: 'VfGroupBox',
    component: 'group-box',
    casesPath: 'contracts/group-box/cases.json',
    policyPath: 'contracts/group-box/parity-policy.json',
    artifactDirectory: 'parity-group-box',
    reportName: 'group-box-parity-report.json',
    measuredRoles: {
      root: '.vf-group-box',
      legend: '.vf-group-box__legend',
      trigger: '.vf-group-box__trigger',
      icon: '.vf-group-box__icon',
      glyph: '.vf-group-box__icon svg',
      title: '.vf-group-box__title',
      content: '.vf-group-box__content',
    },
    // The fieldset is a group named by its legend - or an unnamed group
    // without one - and the legend is exposed as a legend. The trigger carries
    // the role, the name, the expanded and disabled states; the content is a
    // region named by the trigger only when the group is collapsible. The
    // icon and its glyph are listed because they are aria-hidden and so
    // expected absent, which is only a measurement if the selector is queried.
    accessibilityRoles: {
      root: '.vf-group-box',
      legend: '.vf-group-box__legend',
      trigger: '.vf-group-box__trigger',
      content: '.vf-group-box__content',
      icon: '.vf-group-box__icon',
      glyph: '.vf-group-box__icon svg',
    },
    semanticAttributes: [
      'class',
      'style',
      'id',
      'name',
      'type',
      'disabled',
      'role',
      'aria-expanded',
      'aria-controls',
      'aria-labelledby',
      'aria-disabled',
      'aria-label',
      'aria-hidden',
      'data-testid',
    ],
    snapshot: 'group-box',
    activationSelector: '.vf-group-box__trigger',
    controlOwnership: {
      trigger: { selector: '.vf-group-box__trigger', tag: 'button' },
    },
    liveParity: true,
  },
  // The M30 component: the second overlay, and the first that holds another.
  // It owns its trigger wrapper and, while open, its panel - a section with
  // role=dialog and tabindex=-1 that takes focus on every open, which is why
  // it is a control and not a structural node like the dropdown's menu. The
  // panel is followed through the trigger's aria-controls, one hop, as the
  // dropdown's menu is; a dropdown inside the panel or beside the popover is
  // consumer content, measured by the snapshot's nestedMenus and bodyOverlays.
  popover: {
    id: 'popover',
    label: 'VfPopover',
    component: 'popover',
    casesPath: 'contracts/popover/cases.json',
    policyPath: 'contracts/popover/parity-policy.json',
    artifactDirectory: 'parity-popover',
    reportName: 'popover-parity-report.json',
    measuredRoles: {
      root: '.vf-popover',
      trigger: '.vf-popover__trigger',
      triggerControl: '.parity-trigger-control',
      inPlacePanel: '.vf-popover__content',
    },
    // The trigger and the panel are read where they are - the panel through
    // the trigger's aria-controls. The arrow is listed because it is
    // aria-hidden and so expected absent, which is only a measurement if the
    // selector is queried.
    accessibilityRoles: {
      trigger: '.vf-popover__trigger',
      triggerControl: '.parity-trigger-control',
      panel: 'followed(.vf-popover__trigger, aria-controls)',
      panelControl: 'followed(.vf-popover__trigger, aria-controls) .parity-panel-control',
      arrow: 'followed(.vf-popover__trigger, aria-controls) .vf-popover__arrow',
    },
    semanticAttributes: [
      'class',
      'style',
      'id',
      'role',
      'type',
      'tabindex',
      'aria-controls',
      'aria-labelledby',
      'aria-expanded',
      'aria-haspopup',
      'aria-hidden',
      'aria-label',
      'data-testid',
      'data-autofocus',
    ],
    snapshot: 'popover',
    activationSelector: '.vf-popover__trigger',
    controlOwnership: {
      trigger: { selector: '.vf-popover__trigger', tag: 'div' },
      panel: { selector: '.vf-popover__content', tag: 'section' },
    },
    followedReferences: [{ source: '.vf-popover__trigger', attribute: 'aria-controls' }],
    liveParity: true,
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
