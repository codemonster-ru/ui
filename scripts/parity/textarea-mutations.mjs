// The negative fixture for the VfTextarea parity gate.
//
// The gate passes with zero approved divergences, which is the strongest
// possible result and also the easiest one to fake: a comparator that looked at
// nothing would report exactly the same thing. Every mutation below is a defect
// that must turn that pass into a failure, reported under the dimension that
// owns it.
//
// Almost nothing this component does is visible in markup. The value lives in a
// property, the filled signal belongs to the field beside it, and the
// relationships come from the field around it - so most of what follows
// perturbs state and relationships rather than appearance, and the value
// mutations exist specifically to prove that dropping the two non-contract
// representations of the value (see the policy's notCompared block) left no
// hole behind.
//
// Mutations perturb the captured description of a target, never a file on disk.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const isControl = (node) => node.tag === 'textarea' && node.classes.includes('vf-textarea');
const isField = (node) => node.classes.includes('vf-field');
const isLabel = (node) => node.tag === 'label' && node.classes.includes('vf-field__label');
const isControlWrapper = (node) => node.classes.includes('vf-field__control');
const isDescription = (node) => node.classes.includes('vf-field__description');

export const textareaParityMutations = [
  // ------------------------------------------------------ canonical classes
  {
    id: 'textarea-drops-the-size-modifier',
    klass: 'canonical classes',
    description: 'a large control renders at the default size',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['textarea/size-lg'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/size-lg', isControl, 'textarea');
        if (!control.classes.includes('vf-textarea--lg')) fail('the case carried no size modifier');
        control.classes = control.classes.filter((name) => name !== 'vf-textarea--lg');
      });
    },
  },
  {
    id: 'textarea-drops-the-invalid-modifier',
    klass: 'canonical classes',
    description: 'an invalid control stops looking invalid',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['textarea/invalid'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/invalid', isControl, 'textarea');
        if (!control.classes.includes('vf-textarea--invalid')) fail('the case was not invalid');
        control.classes = control.classes.filter((name) => name !== 'vf-textarea--invalid');
      });
    },
  },
  {
    id: 'textarea-drops-the-floating-modifier',
    klass: 'canonical classes',
    description: 'the control stops carrying the floating modifier inside a floating field',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['textarea/field-floating-empty'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/field-floating-empty', isControl, 'textarea');
        if (!control.classes.includes('vf-textarea--floating')) fail('the case was not floating');
        control.classes = control.classes.filter((name) => name !== 'vf-textarea--floating');
      });
    },
  },
  {
    id: 'textarea-loses-the-consumer-class',
    klass: 'canonical classes',
    description: 'a consumer class stops reaching the control',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['textarea/consumer-class'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/consumer-class', isControl, 'textarea');
        if (!control.consumerClasses.includes('consumer-textarea')) fail('the case carried no consumer class');
        control.consumerClasses = control.consumerClasses.filter((name) => name !== 'consumer-textarea');
      });
    },
  },
  {
    id: 'textarea-drops-the-field-floating-class',
    klass: 'canonical classes',
    description: 'the field stops reporting that its label floats',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['textarea/field-floating-filled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const field = findNode(capture, 'textarea/field-floating-filled', isField, 'field');
        if (!field.classes.includes('vf-field--floating')) fail('the field was not floating');
        field.classes = field.classes.filter((name) => !name.startsWith('vf-field--floating'));
      });
    },
  },
  {
    id: 'textarea-drops-the-field-filled-class',
    klass: 'canonical classes',
    description: 'a filled floating field stops reporting it, so the label would sit over the text',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['textarea/field-floating-filled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const wrapper = findNode(capture, 'textarea/field-floating-filled', isControlWrapper, 'field control');
        if (!wrapper.classes.includes('vf-field__control--filled')) fail('the field was not filled');
        wrapper.classes = wrapper.classes.filter((name) => name !== 'vf-field__control--filled');
      });
    },
  },

  // ------------------------------------------------------ native attributes
  {
    id: 'textarea-loses-its-row-count',
    klass: 'native attributes',
    description: 'the explicit row count disappears, so the control renders at the browser default height',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['rows'] },
      caseIds: ['textarea/rows'],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/rows', isControl, 'textarea');
        if (control.attributes.rows === undefined) fail('the case carried no row count');
        delete control.attributes.rows;
      });
    },
  },
  {
    id: 'textarea-loses-the-disabled-state',
    klass: 'native attributes',
    description: 'a disabled control becomes editable',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['textarea/disabled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/disabled', isControl, 'textarea');
        if (control.attributes.disabled === undefined) fail('the case was not disabled');
        delete control.attributes.disabled;
      });
    },
  },
  {
    id: 'textarea-loses-the-readonly-state',
    klass: 'native attributes',
    description: 'a readonly control becomes editable',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['textarea/readonly'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/readonly', isControl, 'textarea');
        if (control.attributes.readonly === undefined) fail('the case was not readonly');
        delete control.attributes.readonly;
      });
    },
  },
  {
    id: 'textarea-loses-the-required-state',
    klass: 'native attributes',
    description: 'a required control stops being required',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['textarea/required'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/required', isControl, 'textarea');
        if (control.attributes.required === undefined) fail('the case was not required');
        delete control.attributes.required;
      });
    },
  },
  {
    id: 'textarea-loses-the-lesser-known-native-attributes',
    klass: 'native attributes',
    description: 'wrap, spellcheck and autocomplete stop reaching the control',
    // The M13 blind-spot attack as a permanent fixture: none of these three was
    // compared by anything before this milestone.
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['textarea/native-attributes'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/native-attributes', isControl, 'textarea');
        for (const attribute of ['wrap', 'spellcheck', 'autocomplete']) {
          if (control.attributes[attribute] === undefined) fail(`the case carried no ${attribute}`);
          delete control.attributes[attribute];
        }
      });
    },
  },
  {
    id: 'textarea-loses-its-length-limits',
    klass: 'native attributes',
    description: 'maxlength and minlength stop reaching the control',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['textarea/maxlength'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/maxlength', isControl, 'textarea');
        if (control.attributes.minlength === undefined) fail('the case carried no minlength');
        delete control.attributes.maxlength;
        delete control.attributes.minlength;
      });
    },
  },
  {
    id: 'textarea-renders-a-different-value',
    klass: 'value',
    description: 'the control holds a different value, which lives in no compared attribute on either adapter',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['textarea/multiline'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/multiline', isControl, 'textarea');
        if (typeof control.liveValue !== 'string' || !control.liveValue.includes('\n')) {
          fail('the case did not hold a multiline value');
        }
        control.liveValue = control.liveValue.replace(/\n/g, ' ');
      });
    },
  },
  {
    id: 'textarea-lets-markup-through-its-value',
    klass: 'value',
    description: 'the escaped value comes back as something other than the text that went in',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['textarea/markup-like-value'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/markup-like-value', isControl, 'textarea');
        if (!String(control.liveValue).includes('<script>')) fail('the case did not carry markup-like text');
        control.liveValue = String(control.liveValue).replace('<script>alert(1)</script>', '');
      });
    },
  },
  {
    id: 'textarea-drops-the-filled-marker',
    klass: 'product data',
    description: 'the filled marker disappears from the control',
    expect: { dimensions: ['dom.productData'], caseIds: ['textarea/filled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/filled', isControl, 'textarea');
        if (control.attributes['data-vf-filled'] !== 'true') fail('the case was not filled');
        delete control.attributes['data-vf-filled'];
      });
    },
  },

  // ------------------------------------------------------------------- aria
  {
    id: 'textarea-drops-aria-invalid',
    klass: 'aria',
    description: 'an invalid control stops reporting itself invalid to assistive tech',
    expect: { dimensions: ['dom.aria'], caseIds: ['textarea/invalid'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/invalid', isControl, 'textarea');
        if (control.attributes['aria-invalid'] !== 'true') fail('the case was not invalid');
        delete control.attributes['aria-invalid'];
      });
    },
  },
  {
    id: 'textarea-renders-a-different-accessible-name',
    klass: 'aria',
    description: 'the consumer accessible name differs between adapters',
    expect: { dimensions: ['dom.aria'], caseIds: ['textarea/aria-label'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/aria-label', isControl, 'textarea');
        if (control.attributes['aria-label'] !== 'Release notes') fail('the case carried no aria-label');
        control.attributes['aria-label'] = 'Something else';
      });
    },
  },

  // ------------------------------------------------------------ relationships
  {
    id: 'textarea-breaks-the-label-association',
    klass: 'relationships',
    description: 'the label points at nothing, so clicking it focuses no control',
    expect: { dimensions: ['dom.relationships'], caseIds: ['textarea/field-top-label'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const label = findNode(capture, 'textarea/field-top-label', isLabel, 'field label');
        if (label.attributes.for === undefined) fail('the label had no association to break');
        label.attributes.for = '#unresolved:nowhere';
      });
    },
  },
  {
    id: 'textarea-drops-aria-describedby',
    klass: 'relationships',
    description: 'the field description stops being announced with the control',
    expect: { dimensions: ['dom.relationships'], caseIds: ['textarea/field-description'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/field-description', isControl, 'textarea');
        if (control.attributes['aria-describedby'] === undefined) fail('the control was not described');
        delete control.attributes['aria-describedby'];
      });
    },
  },
  {
    id: 'textarea-points-the-label-at-the-description',
    klass: 'relationships',
    description: 'the label targets the description instead of the control',
    expect: { dimensions: ['dom.relationships'], caseIds: ['textarea/field-description'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const label = findNode(capture, 'textarea/field-description', isLabel, 'field label');
        const description = findNode(capture, 'textarea/field-description', isDescription, 'description');
        if (label.attributes.for === description.attributes.id) fail('already pointed at the description');
        label.attributes.for = description.attributes.id;
      });
    },
  },
  {
    id: 'textarea-describes-the-control-with-the-wrong-node',
    klass: 'relationships',
    description: 'aria-describedby names the error twice and never the description',
    expect: { dimensions: ['dom.relationships'], caseIds: ['textarea/field-description-and-error'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'textarea/field-description-and-error', isControl, 'textarea');
        const described = control.attributes['aria-describedby'];
        if (typeof described !== 'string' || !described.includes(' ')) fail('fewer than two described nodes');
        const [, second] = described.split(' ');
        control.attributes['aria-describedby'] = `${second} ${second}`;
      });
    },
  },

  // ---------------------------------------------------------- accessibility
  {
    id: 'textarea-exposes-a-different-name-to-assistive-tech',
    klass: 'accessibility',
    description: 'the accessibility tree reports a name the field label does not say',
    expect: { dimensions: ['a11y.name'], caseIds: ['textarea/field-top-label'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility['textarea/field-top-label'];
        if (!exposed?.control) fail('the control is not exposed to the accessibility tree');
        exposed.control.name = 'Something else';
      });
    },
  },
  {
    id: 'textarea-exposes-the-wrong-invalid-state',
    klass: 'accessibility',
    description: 'assistive tech is told the control is valid when the field says otherwise',
    expect: { dimensions: ['a11y.states'], caseIds: ['textarea/field-error'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility['textarea/field-error'];
        if (!exposed?.control) fail('the control is not exposed to the accessibility tree');
        if (exposed.control.states.invalid === undefined) fail('the control did not report an invalid state');
        exposed.control.states.invalid = 'false';
      });
    },
  },
  {
    id: 'textarea-stops-exposing-its-description',
    klass: 'accessibility',
    description: 'the field description stops being an exposed node',
    expect: { dimensions: ['a11y.role'], caseIds: ['textarea/field-description'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility['textarea/field-description'];
        if (!exposed?.description) fail('the description was not exposed to begin with');
        delete exposed.description;
      });
    },
  },

  // ----------------------------------------------------------- interaction
  {
    id: 'textarea-does-not-fill-when-typed-into',
    klass: 'interaction',
    description: 'typing leaves the field reporting empty, so a floating label never lifts',
    expect: { dimensions: ['interaction.state'], caseIds: ['textarea/interaction-typing'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['textarea/interaction-typing'];
        if (interaction?.filled !== true) fail('the scenario did not fill the field');
        interaction.filled = false;
      });
    },
  },
  {
    id: 'textarea-loses-typed-newlines',
    klass: 'interaction',
    description: 'the typed value comes back with its newlines collapsed',
    expect: { dimensions: ['interaction.value'], caseIds: ['textarea/interaction-typing-multiline'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['textarea/interaction-typing-multiline'];
        if (!String(interaction?.value).includes('\n')) fail('the scenario typed no newline');
        interaction.value = String(interaction.value).replace(/\n/g, ' ');
      });
    },
  },
  {
    id: 'textarea-stays-filled-after-being-emptied',
    klass: 'interaction',
    description: 'clearing leaves the field reporting filled',
    expect: { dimensions: ['interaction.state'], caseIds: ['textarea/interaction-emptied'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['textarea/interaction-emptied'];
        if (interaction?.filled !== false) fail('the scenario did not empty the field');
        interaction.filled = true;
      });
    },
  },
  {
    id: 'textarea-label-click-focuses-nothing',
    klass: 'interaction',
    description: 'clicking the label leaves focus on the body',
    expect: { dimensions: ['interaction.focus'], caseIds: ['textarea/interaction-label-click'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['textarea/interaction-label-click'];
        if (interaction?.focusRole !== 'control') fail('the label click did not focus the control');
        interaction.focusRole = 'body';
      });
    },
  },
  {
    id: 'textarea-accepts-typing-while-disabled',
    klass: 'interaction',
    description: 'a disabled control takes the typed text, which is the regression disabled exists to prevent',
    expect: { dimensions: ['interaction.value'], caseIds: ['textarea/interaction-disabled-typing'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['textarea/interaction-disabled-typing'];
        if (interaction?.value !== '') fail('the disabled control already held a value');
        interaction.value = 'nope';
      });
    },
  },
  {
    id: 'textarea-accepts-typing-while-readonly',
    klass: 'interaction',
    description: 'a readonly control loses its value to the typed text',
    expect: { dimensions: ['interaction.value'], caseIds: ['textarea/interaction-readonly-typing'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['textarea/interaction-readonly-typing'];
        if (interaction?.readOnly !== true) fail('the case was not readonly');
        interaction.value = 'nope';
      });
    },
  },
  {
    id: 'textarea-loses-its-relationship-after-the-scenario',
    klass: 'interaction',
    description: 'the label stops reaching its control once the scenario has run',
    expect: { dimensions: ['interaction.relationships'], caseIds: ['textarea/interaction-typing'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['textarea/interaction-typing'];
        if (interaction?.labelTargetsControl !== true) fail('the label did not reach the control');
        interaction.labelTargetsControl = false;
      });
    },
  },
];

export const textareaBrowserMutations = [
  {
    id: 'browser-textarea-label-loses-its-target',
    target: 'razor',
    caseIds: ['textarea/interaction-label-click'],
    description: 'the real label points at a control that does not exist, so clicking it focuses nothing',
    expect: { dimensions: ['interaction.focus'], caseIds: ['textarea/interaction-label-click'] },
    beforeInteraction: mutateElements(
      ['textarea/interaction-label-click'],
      '.vf-field__label',
      `
      if (!element.getAttribute('for')) throw new Error('MUTATION_NOT_APPLIED: no association');
      element.setAttribute('for', 'no-such-control');
    `,
    ),
  },
  {
    id: 'browser-textarea-cross-wired-labels',
    target: 'razor',
    caseIds: ['textarea/interaction-label-click'],
    description: "the real label points at another field's control, so the wrong control takes focus",
    expect: { dimensions: ['interaction.focus'], caseIds: ['textarea/interaction-label-click'] },
    beforeInteraction: mutateElements(
      ['textarea/interaction-label-click'],
      '.vf-field__label',
      `
      const other = document.querySelector('[data-parity-case="textarea/field-top-label"] textarea.vf-textarea');
      if (!other || !other.id) throw new Error('MUTATION_NOT_APPLIED: no other control');
      element.setAttribute('for', other.id);
    `,
    ),
  },
  {
    id: 'browser-textarea-becomes-editable-while-readonly',
    target: 'razor',
    caseIds: ['textarea/interaction-readonly-typing'],
    description: 'the real readonly control accepts the typed text, replacing the value it was given',
    expect: { dimensions: ['interaction.state'], caseIds: ['textarea/interaction-readonly-typing'] },
    beforeInteraction: mutateElements(
      ['textarea/interaction-readonly-typing'],
      'textarea.vf-textarea',
      `
      if (!element.readOnly) throw new Error('MUTATION_NOT_APPLIED: the control was not readonly');
      element.readOnly = false;
    `,
    ),
  },
  {
    id: 'browser-textarea-does-not-track-filled',
    target: 'razor',
    caseIds: ['textarea/interaction-typing'],
    description: 'the real field controller stops tracking filled, so a floating label never lifts',
    expect: { dimensions: ['interaction.state'], caseIds: ['textarea/interaction-typing'] },
    beforeInteraction: mutateElements(
      ['textarea/interaction-typing'],
      '.vf-field__control',
      `
      const frozen = element.className;
      Object.defineProperty(element, 'className', { get: () => frozen, set: () => {} });
      element.classList.toggle = () => false;
      element.classList.add = () => {};
    `,
    ),
  },
  {
    id: 'browser-textarea-geometry',
    target: 'razor',
    caseIds: ['textarea/rows'],
    description: 'a real CSS change to the control box, which must show up as geometry and as pixels',
    expect: { dimensions: ['style.geometry'], caseIds: ['textarea/rows'] },
    beforeExtract: mutateElements(
      ['textarea/rows'],
      'textarea.vf-textarea',
      "element.style.setProperty('padding', '17px', 'important');",
    ),
  },
];

export const textareaPolicyMutations = [
  {
    id: 'smuggled-structure-approval',
    description: 'an approval for dom.structure, which must never be waivable',
    rejectedBy: 'validation',
    apply(policy) {
      policy.approvedDivergences.push({
        id: 'smuggled-structure-approval',
        dimension: 'dom.structure',
        target: 'razor',
        caseIds: ['textarea/default'],
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
        caseIds: ['textarea/default'],
        classification: 'framework-specific',
        expectedOccurrences: 4,
        directions: ['reference-vs-razor', 'current-vs-razor'],
        reason: 'smuggled',
      });
    },
  },
  {
    id: 'smuggled-wildcard-relationship-approval',
    description: 'an approval covering every case at once, which would waive the whole id graph',
    rejectedBy: 'validation',
    apply(policy) {
      policy.approvedDivergences.push({
        id: 'smuggled-wildcard-relationship-approval',
        dimension: 'dom.relationships',
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
