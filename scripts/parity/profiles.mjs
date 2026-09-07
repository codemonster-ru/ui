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
    },
    snapshot: 'icon-button',
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
