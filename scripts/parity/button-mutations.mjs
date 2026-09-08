// The negative fixture for the VfButton parity gate.
//
// The gate passes with zero approved divergences, which is the strongest
// possible result and also the easiest one to fake: a comparator that looked at
// nothing would report exactly the same thing. Every mutation below is a defect
// that must turn that pass into a failure, reported under the dimension that
// owns it.
//
// A button's dangerous defects are the ones that change nothing visible. A
// loading button that stopped applying `disabled` renders identically and is
// operable again; a decorative glyph that stops being hidden reads out over the
// label. Those get mutations of their own rather than being assumed covered by
// the class comparison.
//
// Mutations perturb the captured description of a target, never a file on disk.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const isButton = (node) => node.tag === 'button' && node.classes.includes('vf-button');
const isSpinner = (node) => node.classes.includes('vf-button__spinner');
const isGlyph = (node) => node.tag === 'svg' && node.classes.includes('vf-icon');

export const buttonParityMutations = [
  // ------------------------------------------------------ canonical classes
  {
    id: 'button-drops-the-variant-modifier',
    klass: 'canonical classes',
    description: 'the Razor button stops emitting the variant modifier class',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['button/variant-danger'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'button/variant-danger', isButton, 'button');
        if (!button.classes.includes('vf-button--danger')) fail('the case carried no variant modifier');
        button.classes = button.classes.filter((name) => name !== 'vf-button--danger');
      });
    },
  },
  {
    id: 'button-emits-a-default-size-modifier',
    klass: 'canonical classes',
    description: 'the medium size starts emitting a modifier the stylesheet never defined',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['button/size-md'], requireAll: true },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'button/size-md', isButton, 'button');
        if (button.classes.includes('vf-button--md')) fail('the case already carried a medium modifier');
        button.classes = [...button.classes, 'vf-button--md'].sort();
      });
    },
  },
  {
    id: 'button-drops-the-size-modifier',
    klass: 'canonical classes',
    description: 'a small button renders at the default size',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['button/size-sm'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'button/size-sm', isButton, 'button');
        if (!button.classes.includes('vf-button--sm')) fail('the case carried no size modifier');
        button.classes = button.classes.filter((name) => name !== 'vf-button--sm');
      });
    },
  },
  {
    id: 'button-drops-the-loading-modifier',
    klass: 'canonical classes',
    description: 'a loading button stops looking like one',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['button/loading'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'button/loading', isButton, 'button');
        if (!button.classes.includes('vf-button--loading')) fail('the case was not loading');
        button.classes = button.classes.filter((name) => name !== 'vf-button--loading');
      });
    },
  },
  {
    id: 'button-loses-the-consumer-class',
    klass: 'canonical classes',
    description: 'a consumer class stops reaching the button',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['button/consumer-class'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'button/consumer-class', isButton, 'button');
        if (!button.consumerClasses.includes('consumer-button')) fail('the case carried no consumer class');
        button.consumerClasses = button.consumerClasses.filter((name) => name !== 'consumer-button');
      });
    },
  },

  // ------------------------------------------------------ native attributes
  {
    id: 'button-drops-the-explicit-type',
    klass: 'native attributes',
    description: 'the explicit type disappears, so the button submits a surrounding form',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['type'] },
      caseIds: ['button/default'],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'button/default', isButton, 'button');
        if (button.attributes.type !== 'button') fail('the case did not carry an explicit button type');
        delete button.attributes.type;
      });
    },
  },
  {
    id: 'button-ignores-the-type-override',
    klass: 'native attributes',
    description: 'a submit button renders as a plain button',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['type'] },
      caseIds: ['button/type-submit'],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'button/type-submit', isButton, 'button');
        if (button.attributes.type !== 'submit') fail('the case was not a submit button');
        button.attributes.type = 'button';
      });
    },
  },
  {
    id: 'button-loses-the-disabled-state',
    klass: 'native attributes',
    description: 'a disabled button becomes operable',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['button/disabled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'button/disabled', isButton, 'button');
        if (button.attributes.disabled === undefined) fail('the case was not disabled');
        delete button.attributes.disabled;
      });
    },
  },
  {
    id: 'button-loading-stops-disabling',
    klass: 'native attributes',
    description: 'a loading button becomes operable again, which no class comparison would show',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['button/loading'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'button/loading', isButton, 'button');
        if (button.attributes.disabled === undefined) fail('the loading case was not disabled to begin with');
        delete button.attributes.disabled;
      });
    },
  },
  {
    id: 'button-loses-a-forwarded-native-attribute',
    klass: 'native attributes',
    description: 'a forwarded name and data attribute stop reaching the button',
    expect: { dimensions: ['dom.nativeAttributes', 'dom.productData'], caseIds: ['button/native-attributes'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'button/native-attributes', isButton, 'button');
        if (button.attributes.name === undefined) fail('the case forwarded no name');
        delete button.attributes.name;
        delete button.attributes['data-testid'];
      });
    },
  },

  // ------------------------------------------------------------------- aria
  {
    id: 'button-drops-aria-busy',
    klass: 'aria',
    description: 'a loading button stops announcing itself busy',
    expect: { dimensions: ['dom.aria'], caseIds: ['button/loading'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'button/loading', isButton, 'button');
        if (button.attributes['aria-busy'] !== 'true') fail('the case was not busy to begin with');
        delete button.attributes['aria-busy'];
      });
    },
  },
  {
    id: 'button-exposes-the-decorative-glyph',
    klass: 'aria',
    description: 'the icon stops being aria-hidden, so it competes with the accessible name',
    expect: { dimensions: ['dom.aria'], caseIds: ['button/icon-in-slot'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const glyph = findNode(capture, 'button/icon-in-slot', isGlyph, 'glyph');
        if (glyph.attributes['aria-hidden'] !== 'true') fail('the glyph was not hidden to begin with');
        delete glyph.attributes['aria-hidden'];
      });
    },
  },
  {
    id: 'button-renders-a-different-accessible-name',
    klass: 'aria',
    description: 'the consumer accessible name differs between adapters',
    expect: { dimensions: ['dom.aria'], caseIds: ['button/aria-label'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'button/aria-label', isButton, 'button');
        if (button.attributes['aria-label'] !== 'Save the workspace') fail('the case carried no aria-label');
        button.attributes['aria-label'] = 'Something else';
      });
    },
  },

  // ------------------------------------------------------------------- text
  {
    id: 'button-renders-a-different-label',
    klass: 'text',
    description: 'the label reads differently on one adapter',
    expect: { dimensions: ['dom.text'], caseIds: ['button/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'button/default', isButton, 'button');
        button.text = 'Save now';
      });
    },
  },

  // -------------------------------------------------------------- structure
  {
    id: 'button-renders-no-spinner-while-loading',
    klass: 'structure',
    description: 'a loading button loses its spinner entirely',
    expect: { dimensions: ['dom.structure'], caseIds: ['button/loading'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'button/loading', isButton, 'button');
        const before = button.children.length;
        button.children = button.children.filter((child) => !isSpinner(child));
        if (button.children.length === before) fail('the loading case rendered no spinner to remove');
      });
    },
  },
  {
    id: 'button-renders-the-wrong-glyph',
    klass: 'glyph',
    description: 'the icon in the slot is a different glyph',
    expect: { dimensions: ['dom.structure', 'dom.nativeAttributes'], caseIds: ['button/icon-in-slot'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const glyph = findNode(capture, 'button/icon-in-slot', isGlyph, 'glyph');
        if (glyph.children.length === 0) fail('the glyph had no geometry to replace');
        glyph.children = [
          { tag: 'circle', classes: [], consumerClasses: [], attributes: { cx: '12', cy: '12', r: '9' }, children: [] },
        ];
      });
    },
  },

  // ---------------------------------------------------------- accessibility
  {
    id: 'button-exposes-a-different-name-to-assistive-tech',
    klass: 'accessibility',
    description: 'the accessibility tree reports a name the label does not say',
    expect: { dimensions: ['a11y.name'], caseIds: ['button/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility['button/default'];
        if (!exposed?.button) fail('the button is not exposed to the accessibility tree');
        exposed.button.name = 'Something else';
      });
    },
  },
  {
    id: 'button-exposes-the-spinner-artwork',
    klass: 'accessibility',
    description: 'the spinner artwork stops being ignored and reaches the accessibility tree',
    expect: { dimensions: ['a11y.role'], caseIds: ['button/loading'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility['button/loading'];
        if (!exposed) fail('button/loading has no accessibility capture');
        // The precondition is the claim: the artwork is aria-hidden, so it is
        // an ignored node and absent, while the spinner itself is present.
        if (exposed.spinnerArtwork) fail('the artwork was already exposed');
        if (!exposed.spinner) fail('the spinner itself should be exposed as a progressbar');
        exposed.spinnerArtwork = { role: 'graphics-symbol', name: '', states: {} };
      });
    },
  },
  {
    id: 'button-hides-the-loading-spinner-from-assistive-tech',
    klass: 'accessibility',
    description: 'the spinner stops being exposed, so a loading button never announces it',
    expect: { dimensions: ['a11y.role'], caseIds: ['button/loading'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility['button/loading'];
        if (!exposed?.spinner) fail('the spinner was not exposed to begin with');
        delete exposed.spinner;
      });
    },
  },
  {
    id: 'button-exposes-the-decorative-glyph-to-assistive-tech',
    klass: 'accessibility',
    description: 'the decorative glyph stops being ignored and reaches the accessibility tree',
    expect: { dimensions: ['a11y.role'], caseIds: ['button/icon-in-slot'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility['button/icon-in-slot'];
        if (!exposed) fail('button/icon-in-slot has no accessibility capture');
        if (exposed.glyph) fail('the glyph was already exposed to the accessibility tree');
        exposed.glyph = { role: 'graphics-symbol', name: '', states: {} };
      });
    },
  },

  // ----------------------------------------------------------- interaction
  {
    id: 'button-does-not-activate-on-enter',
    klass: 'interaction',
    description: 'Enter stops activating the button',
    expect: { dimensions: ['interaction.state'], caseIds: ['button/interaction-enter'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['button/interaction-enter'];
        if (interaction?.activations !== 1) fail('Enter did not activate the button to begin with');
        interaction.activations = 0;
      });
    },
  },
  {
    id: 'button-does-not-activate-on-space',
    klass: 'interaction',
    description: 'Space stops activating the button',
    expect: { dimensions: ['interaction.state'], caseIds: ['button/interaction-space'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['button/interaction-space'];
        if (interaction?.activations !== 1) fail('Space did not activate the button to begin with');
        interaction.activations = 0;
      });
    },
  },
  {
    id: 'button-activates-while-disabled',
    klass: 'interaction',
    description: 'a disabled button activates on the keyboard',
    expect: { dimensions: ['interaction.state'], caseIds: ['button/interaction-disabled-keyboard'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['button/interaction-disabled-keyboard'];
        if (interaction?.activations !== 0) fail('the disabled case activated to begin with');
        interaction.activations = 1;
      });
    },
  },
  {
    id: 'button-activates-while-loading',
    klass: 'interaction',
    description: 'a loading button activates on the keyboard, which is the regression loading exists to prevent',
    expect: { dimensions: ['interaction.state'], caseIds: ['button/interaction-loading-keyboard'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['button/interaction-loading-keyboard'];
        if (interaction?.activations !== 0) fail('the loading case activated to begin with');
        interaction.activations = 1;
      });
    },
  },
  {
    id: 'button-loses-focus-after-being-focused',
    klass: 'interaction',
    description: 'focus lands somewhere other than the button',
    expect: { dimensions: ['interaction.focus'], caseIds: ['button/interaction-focus'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['button/interaction-focus'];
        if (interaction?.focusRole !== 'button') fail('focus was not on the button to begin with');
        interaction.focusRole = 'body';
      });
    },
  },
];

export const buttonBrowserMutations = [
  {
    id: 'browser-button-not-clickable',
    target: 'razor',
    caseIds: ['button/interaction-pointer-click'],
    description: 'the real button stops receiving pointer events, so a genuine click activates nothing',
    expect: { dimensions: ['interaction.state'], caseIds: ['button/interaction-pointer-click'] },
    beforeInteraction: mutateElements(
      ['button/interaction-pointer-click'],
      '.vf-button',
      "element.style.setProperty('pointer-events', 'none', 'important');",
    ),
  },
  {
    id: 'browser-button-loading-becomes-operable',
    target: 'razor',
    caseIds: ['button/interaction-loading-keyboard'],
    description: 'the real loading button loses its disabled attribute, so the keyboard activates it again',
    expect: { dimensions: ['interaction.state'], caseIds: ['button/interaction-loading-keyboard'] },
    beforeInteraction: mutateElements(
      ['button/interaction-loading-keyboard'],
      '.vf-button',
      `
      if (!element.disabled) throw new Error('MUTATION_NOT_APPLIED: the loading button was not disabled');
      element.disabled = false;
    `,
    ),
  },
  {
    id: 'browser-button-spinner-after-the-label',
    target: 'razor',
    caseIds: ['button/loading'],
    description: 'the real spinner moves to the far side of the label, which only the pixels can show',
    // Deliberately a browser mutation rather than a capture one. The extractor
    // records a node's text on the node itself rather than as a child, so the
    // order of a spinner relative to a text label has no representation in the
    // captured description - but it is plainly visible on the page.
    expect: { dimensions: ['visual'], caseIds: ['button/loading'] },
    beforeExtract: mutateElements(
      ['button/loading'],
      '.vf-button',
      `
      const spinner = element.querySelector('.vf-button__spinner');
      if (!spinner) throw new Error('MUTATION_NOT_APPLIED: no spinner');
      element.appendChild(spinner);
    `,
    ),
  },
  {
    id: 'browser-button-padding',
    target: 'razor',
    caseIds: ['button/default'],
    description: 'a real CSS change to the button box, which must show up as geometry and as pixels',
    expect: { dimensions: ['style.geometry'], caseIds: ['button/default'] },
    beforeExtract: mutateElements(
      ['button/default'],
      '.vf-button',
      "element.style.setProperty('padding', '13px', 'important');",
    ),
  },
  {
    id: 'browser-button-missing-glyph',
    target: 'razor',
    caseIds: ['button/icon-in-slot'],
    description: 'the real glyph is removed, leaving the label alone',
    expect: { dimensions: ['dom.structure'], caseIds: ['button/icon-in-slot'] },
    beforeExtract: mutateElements(['button/icon-in-slot'], '.vf-button .vf-icon', 'element.remove();'),
  },
  {
    id: 'browser-button-glyph-reaches-assistive-tech',
    target: 'razor',
    caseIds: ['button/icon-only'],
    description: 'the real decorative glyph stops being hidden, so it competes with the accessible name',
    expect: { dimensions: ['dom.aria'], caseIds: ['button/icon-only'] },
    beforeExtract: mutateElements(
      ['button/icon-only'],
      '.vf-button .vf-icon',
      `
      if (element.getAttribute('aria-hidden') !== 'true') throw new Error('MUTATION_NOT_APPLIED: not hidden');
      element.removeAttribute('aria-hidden');
    `,
    ),
  },
];

export const buttonPolicyMutations = [
  {
    id: 'smuggled-structure-approval',
    description: 'an approval for dom.structure, which must never be waivable',
    rejectedBy: 'validation',
    apply(policy) {
      policy.approvedDivergences.push({
        id: 'smuggled-structure-approval',
        dimension: 'dom.structure',
        target: 'razor',
        caseIds: ['button/default'],
        classification: 'framework-specific',
        expectedOccurrences: 4,
        directions: ['reference-vs-razor', 'current-vs-razor'],
        reason: 'smuggled',
      });
    },
  },
  {
    id: 'smuggled-visual-approval',
    description: 'an approval for rendered pixels',
    rejectedBy: 'validation',
    apply(policy) {
      policy.approvedDivergences.push({
        id: 'smuggled-visual-approval',
        dimension: 'visual',
        target: 'razor',
        caseIds: ['button/default'],
        classification: 'framework-specific',
        expectedOccurrences: 4,
        directions: ['reference-vs-razor', 'current-vs-razor'],
        reason: 'smuggled',
      });
    },
  },
  {
    id: 'smuggled-wildcard-case',
    description: 'an approval that covers every case at once',
    rejectedBy: 'validation',
    apply(policy) {
      policy.approvedDivergences.push({
        id: 'smuggled-wildcard-case',
        dimension: 'dom.nativeAttributes',
        target: 'razor',
        caseIds: ['*'],
        classification: 'framework-specific',
        expectedOccurrences: 4,
        directions: ['reference-vs-razor', 'current-vs-razor'],
        reason: 'smuggled',
      });
    },
  },
];
