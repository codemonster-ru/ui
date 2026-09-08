// The negative fixture for the VfIconButton parity gate.
//
// The gate passes with zero approved divergences, which is the strongest
// possible result and also the easiest one to fake: a comparator that looked at
// nothing would report exactly the same thing. Every mutation below is a defect
// that must turn that pass into a failure, reported under the dimension that
// owns it.
//
// Mutations perturb the captured description of a target, never a file on disk.
import { eachTheme, fail, findNode } from './mutations.mjs';

const isButton = (node) => node.tag === 'button' && node.classes.includes('vf-icon-button');
const isGlyph = (node) => node.tag === 'svg' && node.classes.includes('vf-icon');
const isGlyphWrapper = (node) => node.tag === 'span' && node.classes.includes('vf-icon-wrapper');

/** The documented variant modifiers, so a mutation can strip whichever one a case carries. */
const variantModifiers = [
  'primary', 'secondary', 'success', 'info', 'warn', 'help', 'danger', 'contrast', 'ghost',
].map((variant) => `vf-icon-button--${variant}`);

/** Cases that carry a non-default variant modifier. */
const variantCases = ['icon-button/variant-primary', 'icon-button/variant-danger', 'icon-button/size-sm-primary'];

export const iconButtonParityMutations = [
  // -------------------------------------------------------- canonical classes
  {
    id: 'icon-button-drops-variant-modifier',
    klass: 'canonical classes',
    description: 'the Razor button stops emitting the variant modifier class',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: variantCases, requireAll: true },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        for (const caseId of variantCases) {
          const button = findNode(capture, caseId, isButton, 'icon button');
          const before = button.classes.length;
          button.classes = button.classes.filter((name) => !variantModifiers.includes(name));
          if (button.classes.length === before) fail(`${caseId} carried no variant modifier to drop`);
        }
      });
    },
  },
  {
    id: 'icon-button-emits-a-default-size-modifier',
    klass: 'canonical classes',
    description: 'the Razor button starts emitting vf-icon-button--md, which the reference never emits',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['icon-button/default', 'icon-button/size-md'], requireAll: true },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        for (const caseId of ['icon-button/default', 'icon-button/size-md']) {
          findNode(capture, caseId, isButton, 'icon button').classes.push('vf-icon-button--md');
        }
      });
    },
  },
  {
    id: 'icon-button-drops-the-consumer-class',
    klass: 'canonical classes',
    description: 'a consumer class is replaced by the canonical classes instead of merged with them',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['icon-button/consumer-class'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'icon-button/consumer-class', isButton, 'icon button');
        // Not a `parity-` prefixed name: the extractor drops those as harness
        // scaffolding, so a case using one would never be compared at all.
        if (!button.consumerClasses.includes('consumer-class')) fail('the consumer class was never rendered');
        button.consumerClasses = button.consumerClasses.filter((name) => name !== 'consumer-class');
      });
    },
  },

  // ------------------------------------------------------- native attributes
  {
    id: 'icon-button-drops-the-explicit-type',
    klass: 'native attributes',
    description: 'the button loses type="button", so it would submit a surrounding form',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['type'] }, caseIds: ['icon-button/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'icon-button/default', isButton, 'icon button');
        if (button.attributes.type !== 'button') fail('icon-button/default did not render type="button"');
        delete button.attributes.type;
      });
    },
  },
  {
    id: 'icon-button-ignores-the-type-override',
    klass: 'native attributes',
    description: 'a consumer type="submit" is overwritten with the default',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['type'] }, caseIds: ['icon-button/type-submit'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'icon-button/type-submit', isButton, 'icon button');
        if (button.attributes.type !== 'submit') fail('icon-button/type-submit did not render type="submit"');
        button.attributes.type = 'button';
      });
    },
  },
  {
    id: 'icon-button-loses-the-disabled-state',
    klass: 'native attributes',
    description: 'a disabled button renders enabled',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['icon-button/disabled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'icon-button/disabled', isButton, 'icon button');
        if (button.attributes.disabled === undefined) fail('icon-button/disabled was not disabled');
        delete button.attributes.disabled;
      });
    },
  },
  {
    id: 'icon-button-reintroduces-inline-icon-layout',
    klass: 'native attributes',
    description: 'the icon layout comes back as an inline style, the divergence M10 removed',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['style'] }, caseIds: ['icon-button/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const wrapper = findNode(capture, 'icon-button/default', isGlyphWrapper, 'glyph wrapper');
        wrapper.attributes.style = `${wrapper.attributes.style};display:inline-grid;place-items:center`;
      });
    },
  },

  // -------------------------------------------------------------- accessible
  {
    id: 'icon-button-exposes-the-glyph-to-assistive-tech',
    klass: 'aria',
    description: 'the glyph loses aria-hidden, so it competes with the button accessible name',
    expect: { dimensions: ['dom.aria'], caseIds: ['icon-button/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const glyph = findNode(capture, 'icon-button/default', isGlyph, 'glyph');
        if (glyph.attributes['aria-hidden'] !== 'true') fail('the glyph was not aria-hidden to begin with');
        delete glyph.attributes['aria-hidden'];
      });
    },
  },
  {
    id: 'icon-button-drops-the-pressed-state',
    klass: 'aria',
    description: 'aria-pressed disappears, so a toggle stops reporting its state',
    expect: { dimensions: ['dom.aria'], caseIds: ['icon-button/aria-pressed'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const button = findNode(capture, 'icon-button/aria-pressed', isButton, 'icon button');
        if (button.attributes['aria-pressed'] === undefined) fail('icon-button/aria-pressed had no pressed state');
        delete button.attributes['aria-pressed'];
      });
    },
  },
  {
    id: 'icon-button-exposes-a-different-accessible-name',
    klass: 'accessibility',
    description: 'the accessibility tree reports a different name than the other adapters',
    expect: { dimensions: ['a11y.name'], caseIds: ['icon-button/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility['icon-button/default'];
        if (!exposed?.button) fail('the button is not exposed to the accessibility tree');
        exposed.button.name = 'Dismiss';
      });
    },
  },
  {
    id: 'icon-button-exposes-its-decorative-glyph',
    klass: 'accessibility',
    description: 'the decorative glyph stops being ignored and reaches the accessibility tree',
    expect: { dimensions: ['a11y.role'], caseIds: ['icon-button/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility['icon-button/default'];
        if (!exposed) fail('icon-button/default has no accessibility capture');
        // The precondition is the claim: the glyph is aria-hidden, so it is an
        // ignored node and absent from the tree on every target. If it were
        // already present this mutation would be perturbing nothing.
        if (exposed.glyph) fail('the glyph was already exposed to the accessibility tree');
        exposed.glyph = { role: 'graphics-symbol', name: '', states: {} };
      });
    },
  },

  // ---------------------------------------------------------------- structure
  {
    id: 'icon-button-renders-an-extra-child',
    klass: 'structure',
    description: 'a stray element appears inside the button',
    expect: { dimensions: ['dom.structure'], caseIds: ['icon-button/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, 'icon-button/default', isButton, 'icon button').children.push({
          tag: 'span',
          classes: ['vf-icon-button__badge'],
          consumerClasses: [],
          attributes: {},
          children: [],
          text: '1',
        });
      });
    },
  },
  {
    id: 'icon-button-renders-the-wrong-glyph',
    klass: 'glyph',
    description: 'the requested glyph is replaced by another registry entry',
    expect: { dimensions: ['dom.structure'], caseIds: ['icon-button/glyph-eye'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const glyph = findNode(capture, 'icon-button/glyph-eye', isGlyph, 'glyph');
        if (glyph.children.length === 0) fail('the glyph has no geometry to replace');
        glyph.children = [glyph.children[0]];
      });
    },
  },
  {
    id: 'icon-button-sizes-the-glyph-with-the-wrong-token',
    klass: 'native attributes',
    description: 'a small button renders a medium glyph',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['icon-button/size-sm'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const glyph = findNode(capture, 'icon-button/size-sm', isGlyph, 'glyph');
        if (glyph.attributes.width !== 'var(--vf-icon-size-sm)') fail('icon-button/size-sm was not rendered small');
        glyph.attributes.width = 'var(--vf-icon-size-md)';
        glyph.attributes.height = 'var(--vf-icon-size-md)';
      });
    },
  },

  // ------------------------------------------------------------- interaction
  {
    id: 'icon-button-does-not-activate-on-enter',
    klass: 'interaction',
    description: 'pressing Enter on the focused button activates nothing',
    expect: { dimensions: ['interaction.state'], caseIds: ['icon-button/interaction-enter'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const result = capture.interactions['icon-button/interaction-enter'];
        if (!result) fail('icon-button/interaction-enter was not run');
        if (result.activations !== 1) fail('icon-button/interaction-enter did not activate, so this proves nothing');
        result.activations = 0;
      });
    },
  },
  {
    id: 'icon-button-does-not-activate-on-space',
    klass: 'interaction',
    description: 'pressing Space on the focused button activates nothing',
    expect: { dimensions: ['interaction.state'], caseIds: ['icon-button/interaction-space'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const result = capture.interactions['icon-button/interaction-space'];
        if (!result) fail('icon-button/interaction-space was not run');
        if (result.activations !== 1) fail('icon-button/interaction-space did not activate, so this proves nothing');
        result.activations = 0;
      });
    },
  },
  {
    id: 'icon-button-activates-while-disabled',
    klass: 'interaction',
    description: 'a disabled button activates on Enter',
    expect: { dimensions: ['interaction.state'], caseIds: ['icon-button/interaction-disabled-keyboard'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const result = capture.interactions['icon-button/interaction-disabled-keyboard'];
        if (!result) fail('icon-button/interaction-disabled-keyboard was not run');
        if (result.activations !== 0) fail('the disabled button already activated, which is a real defect');
        result.activations = 1;
      });
    },
  },
  {
    id: 'icon-button-loses-focus-after-a-pointer-click',
    klass: 'interaction',
    description: 'clicking the button leaves focus on the body',
    expect: { dimensions: ['interaction.focus'], caseIds: ['icon-button/interaction-pointer-click'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const result = capture.interactions['icon-button/interaction-pointer-click'];
        if (!result) fail('icon-button/interaction-pointer-click was not run');
        if (result.focusRole !== 'button') fail('the click did not focus the button, so this proves nothing');
        result.focusRole = 'body';
      });
    },
  },
  {
    id: 'icon-button-changes-class-after-interaction',
    klass: 'interaction',
    description: 'the button gains a modifier class only after being used',
    expect: { dimensions: ['interaction.state'], caseIds: ['icon-button/interaction-focus'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const result = capture.interactions['icon-button/interaction-focus'];
        if (!result) fail('icon-button/interaction-focus was not run');
        result.buttonClasses = [...result.buttonClasses, 'vf-icon-button--active'];
      });
    },
  },
];

/**
 * Mutations of the divergence registry itself.
 *
 * The VfIconButton policy has no approvals at all, so unlike VfInput there is
 * nothing to widen. The attack is therefore to smuggle one in, and each of
 * these has to be rejected.
 */
export const iconButtonPolicyMutations = [
  {
    id: 'smuggled-structure-approval',
    description: 'an approval for dom.structure, which must never be waivable',
    rejectedBy: 'validation',
    apply(policy) {
      policy.approvedDivergences.push({
        id: 'smuggled-structure-approval',
        dimension: 'dom.structure',
        target: 'razor',
        caseIds: ['icon-button/default'],
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
        caseIds: ['icon-button/default'],
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
        dimension: 'dom.canonicalClasses',
        target: 'razor',
        caseIds: ['*'],
        classification: 'framework-specific',
        expectedOccurrences: 4,
        directions: ['reference-vs-razor', 'current-vs-razor'],
        reason: 'smuggled',
      });
    },
  },
  {
    id: 'smuggled-dead-rule',
    description: 'an approval that matches nothing, so nobody can audit what it tolerates',
    rejectedBy: 'usage',
    apply(policy) {
      // Well formed on purpose: it has to survive validation so that the
      // occurrence accounting is what rejects it. A rule rejected earlier
      // would prove the validator works, which another mutation already does.
      policy.approvedDivergences.push({
        id: 'never-matches-anything',
        dimension: 'dom.nativeAttributes',
        detail: 'style',
        target: 'razor',
        caseIds: ['icon-button/default'],
        classification: 'framework-specific',
        expectedOccurrences: 4,
        directions: ['reference-vs-razor', 'current-vs-razor'],
        pathSelector: 'button.vf-icon-button.vf-icon-button--ghost',
        left: 'nothing-like-this',
        right: 'nothing-like-this-either',
        reason: 'A deliberately dead entry used by the parity mutation harness.',
      });
    },
  },
];

function mutateElements(caseIds, selector, operation) {
  return `(() => {
    const evidence = [];
    let applied = 0;
    for (const caseId of ${JSON.stringify(caseIds)}) {
      const root = document.querySelector('[data-parity-case="' + caseId + '"]');
      const elements = [...(root?.querySelectorAll(${JSON.stringify(selector)}) ?? [])];
      if (elements.length === 0) throw new Error('MUTATION_NOT_APPLIED: ' + caseId + ' ${selector}');
      for (const element of elements) {
        ${operation}
        applied += 1;
      }
      evidence.push({caseId, elements: elements.length});
    }
    return {applied, evidence};
  })()`;
}

/**
 * Real DOM and CSS mutations on fresh pages served by the three real targets.
 *
 * These exercise extraction, geometry and screenshots as well as the
 * comparator, which the capture mutations above cannot: a perturbed capture
 * never proves the browser was looked at correctly in the first place.
 */
export const iconButtonBrowserMutations = [
  {
    id: 'browser-icon-button-missing-glyph',
    target: 'razor',
    caseIds: ['icon-button/default'],
    description: 'remove the glyph, leaving an empty button',
    expect: { dimensions: ['dom.structure'], caseIds: ['icon-button/default'] },
    beforeExtract: mutateElements(['icon-button/default'], '.vf-icon-button svg', 'element.remove();'),
  },
  {
    id: 'browser-icon-button-missing-variant-class',
    target: 'razor',
    caseIds: ['icon-button/variant-primary'],
    description: 'remove the canonical variant modifier from the real button',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['icon-button/variant-primary'] },
    beforeExtract: mutateElements(
      ['icon-button/variant-primary'],
      '.vf-icon-button',
      `
      if (!element.classList.contains('vf-icon-button--primary')) throw new Error('MUTATION_NOT_APPLIED: no modifier');
      element.classList.remove('vf-icon-button--primary');
    `,
    ),
  },
  {
    id: 'browser-icon-button-wrong-aria-label',
    target: 'razor',
    caseIds: ['icon-button/default'],
    description: 'the real button exposes a different accessible name',
    expect: { dimensions: ['dom.aria', 'a11y.name'], caseIds: ['icon-button/default'] },
    beforeExtract: mutateElements(
      ['icon-button/default'],
      '.vf-icon-button',
      `
      if (element.getAttribute('aria-label') !== 'Close') throw new Error('MUTATION_NOT_APPLIED: label');
      element.setAttribute('aria-label', 'Dismiss');
    `,
    ),
  },
  {
    id: 'browser-icon-button-padding',
    target: 'razor',
    caseIds: ['icon-button/default'],
    description: 'a real CSS change to the button box, which must show up as geometry and as pixels',
    expect: { dimensions: ['style.geometry'], caseIds: ['icon-button/default'] },
    beforeExtract: mutateElements(
      ['icon-button/default'],
      '.vf-icon-button',
      `
      element.style.setProperty('padding', '11px', 'important');
    `,
    ),
  },
  {
    id: 'browser-icon-button-not-clickable',
    target: 'razor',
    caseIds: ['icon-button/interaction-pointer-click'],
    description: 'the real button stops receiving pointer events, so a genuine click activates nothing',
    expect: { dimensions: ['interaction.state'], caseIds: ['icon-button/interaction-pointer-click'] },
    beforeInteraction: mutateElements(
      ['icon-button/interaction-pointer-click'],
      '.vf-icon-button',
      `
      element.style.setProperty('pointer-events', 'none', 'important');
    `,
    ),
  },
];
