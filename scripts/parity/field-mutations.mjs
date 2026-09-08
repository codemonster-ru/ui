// The negative fixture for the VfField parity gate.
//
// The gate passes with zero approved divergences, which is the strongest
// possible result and also the easiest one to fake: a comparator that looked at
// nothing would report exactly the same thing. Every mutation below is a defect
// that must turn that pass into a failure, reported under the dimension that
// owns it.
//
// A field's defects are mostly invisible ones. A label that stops reaching its
// control, a description pointed at the wrong node, two fields sharing an id -
// none of them change how the page looks, and all of them break the component
// for the people who depend on it most. Those are the mutations worth having,
// so most of what follows perturbs relationships rather than appearance.
//
// Mutations perturb the captured description of a target, never a file on disk.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const isField = (node) => node.classes.includes('vf-field');
const isLabel = (node) => node.tag === 'label' && node.classes.includes('vf-field__label');
const isControl = (node) => node.tag === 'input' && node.classes.includes('vf-input');
const isControlWrapper = (node) => node.classes.includes('vf-field__control');
const isDescription = (node) => node.classes.includes('vf-field__description');
const isRequiredMark = (node) => node.classes.includes('vf-field__required-mark');

export const fieldParityMutations = [
  // ------------------------------------------------------ canonical classes
  {
    id: 'field-drops-the-floating-modifier',
    klass: 'canonical classes',
    description: 'the Razor field stops emitting the floating modifier',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['field/floating'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const field = findNode(capture, 'field/floating', isField, 'field');
        if (!field.classes.includes('vf-field--floating')) fail('the case was not floating to begin with');
        field.classes = field.classes.filter((name) => !name.startsWith('vf-field--floating'));
      });
    },
  },
  {
    id: 'field-drops-the-invalid-modifier',
    klass: 'canonical classes',
    description: 'an errored field stops looking invalid',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['field/error'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const field = findNode(capture, 'field/error', isField, 'field');
        if (!field.classes.includes('vf-field--invalid')) fail('the case was not invalid to begin with');
        field.classes = field.classes.filter((name) => name !== 'vf-field--invalid');
      });
    },
  },
  {
    id: 'field-drops-the-filled-modifier',
    klass: 'canonical classes',
    description: 'a filled field stops reporting it, so a floating label would sit over the text',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['field/floating-filled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const wrapper = findNode(capture, 'field/floating-filled', isControlWrapper, 'field control');
        if (!wrapper.classes.includes('vf-field__control--filled')) fail('the case was not filled to begin with');
        wrapper.classes = wrapper.classes.filter((name) => name !== 'vf-field__control--filled');
      });
    },
  },
  {
    id: 'field-loses-the-consumer-class',
    klass: 'canonical classes',
    description: 'a consumer class stops reaching the field root',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['field/consumer-class'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const field = findNode(capture, 'field/consumer-class', isField, 'field');
        // Consumer classes are extracted separately from the canonical vf-*
        // ones, which is the whole point of the dimension: a component that
        // dropped a caller's class while keeping its own would look correct.
        if (!field.consumerClasses.includes('consumer-field')) fail('the case carried no consumer class');
        field.consumerClasses = field.consumerClasses.filter((name) => name !== 'consumer-field');
      });
    },
  },

  // ------------------------------------------------------------ relationships
  {
    id: 'field-breaks-the-label-association',
    klass: 'relationships',
    description: 'the label points at nothing, so clicking it focuses no control',
    expect: { dimensions: ['dom.relationships'], caseIds: ['field/top-label'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const label = findNode(capture, 'field/top-label', isLabel, 'field label');
        if (label.attributes.for === undefined) fail('the label had no association to break');
        label.attributes.for = '#unresolved:nowhere';
      });
    },
  },
  {
    id: 'field-points-the-label-at-the-description',
    klass: 'relationships',
    description: 'the label targets the description instead of the control',
    expect: { dimensions: ['dom.relationships'], caseIds: ['field/description'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const label = findNode(capture, 'field/description', isLabel, 'field label');
        const description = findNode(capture, 'field/description', isDescription, 'field description');
        if (label.attributes.for === description.attributes.id) fail('the label already targeted the description');
        label.attributes.for = description.attributes.id;
      });
    },
  },
  {
    id: 'field-drops-aria-describedby',
    klass: 'relationships',
    description: 'the description stops being announced with the control',
    expect: { dimensions: ['dom.relationships'], caseIds: ['field/description'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'field/description', isControl, 'field control');
        if (control.attributes['aria-describedby'] === undefined) fail('the control was not described to begin with');
        delete control.attributes['aria-describedby'];
      });
    },
  },
  {
    id: 'field-describes-the-control-with-the-wrong-node',
    klass: 'relationships',
    description: 'aria-describedby names the error twice and never the description',
    expect: { dimensions: ['dom.relationships'], caseIds: ['field/description-and-error'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'field/description-and-error', isControl, 'field control');
        const described = control.attributes['aria-describedby'];
        if (typeof described !== 'string' || !described.includes(' ')) fail('the control named fewer than two nodes');
        const [, second] = described.split(' ');
        control.attributes['aria-describedby'] = `${second} ${second}`;
      });
    },
  },
  // ------------------------------------------------------------------- text
  {
    id: 'field-renders-a-different-label',
    klass: 'text',
    description: 'the label reads differently on one adapter',
    expect: { dimensions: ['dom.text'], caseIds: ['field/top-label'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const label = findNode(capture, 'field/top-label', isLabel, 'field label');
        label.text = 'Workspace name';
      });
    },
  },
  {
    id: 'field-renders-a-different-error',
    klass: 'text',
    description: 'the error text differs, so the two adapters tell the user different things',
    expect: { dimensions: ['dom.text'], caseIds: ['field/error'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const error = findNode(capture, 'field/error', (node) => node.classes.includes('vf-field__error'), 'error');
        error.text = 'Something went wrong';
      });
    },
  },

  // ------------------------------------------------------------------- aria
  {
    id: 'field-announces-the-required-marker',
    klass: 'aria',
    description: 'the decorative asterisk stops being hidden, so it is read out as part of the label',
    expect: { dimensions: ['dom.aria'], caseIds: ['field/top-label-required'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const mark = findNode(capture, 'field/top-label-required', isRequiredMark, 'required marker');
        if (mark.attributes['aria-hidden'] !== 'true') fail('the marker was not hidden to begin with');
        delete mark.attributes['aria-hidden'];
      });
    },
  },
  {
    id: 'field-drops-aria-invalid-from-the-control',
    klass: 'aria',
    description: 'an errored control stops reporting itself invalid to assistive tech',
    expect: { dimensions: ['dom.aria'], caseIds: ['field/error'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const control = findNode(capture, 'field/error', isControl, 'field control');
        if (control.attributes['aria-invalid'] !== 'true') fail('the control was not invalid to begin with');
        delete control.attributes['aria-invalid'];
      });
    },
  },

  // ---------------------------------------------------------- accessibility
  {
    id: 'field-exposes-a-different-accessible-name',
    klass: 'accessibility',
    description: 'the accessibility tree reports a name the label does not say',
    expect: { dimensions: ['a11y.name'], caseIds: ['field/top-label'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility['field/top-label'];
        if (!exposed?.control) fail('the control is not exposed to the accessibility tree');
        exposed.control.name = 'Something else';
      });
    },
  },
  {
    id: 'field-exposes-the-required-marker-to-assistive-tech',
    klass: 'accessibility',
    description: 'the decorative asterisk stops being ignored and reaches the accessibility tree',
    expect: { dimensions: ['a11y.role'], caseIds: ['field/top-label-required'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility['field/top-label-required'];
        if (!exposed) fail('field/top-label-required has no accessibility capture');
        // The precondition is the claim: the marker is aria-hidden, so it is an
        // ignored node and absent from the tree on every target.
        if (exposed.requiredMark) fail('the marker was already exposed to the accessibility tree');
        exposed.requiredMark = { role: 'generic', name: '*', states: {} };
      });
    },
  },

  // ------------------------------------------------------------- structure
  {
    id: 'field-renders-the-label-outside-the-control-when-floating',
    klass: 'structure',
    description: 'a floating label is placed as a sibling instead of inside the control',
    expect: { dimensions: ['dom.structure'], caseIds: ['field/floating'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const field = findNode(capture, 'field/floating', isField, 'field');
        const wrapper = field.children.find(isControlWrapper);
        if (!wrapper) fail('the field had no control wrapper');
        const labelIndex = wrapper.children.findIndex(isLabel);
        if (labelIndex === -1) fail('the floating label was not inside the control');
        const [label] = wrapper.children.splice(labelIndex, 1);
        field.children.unshift(label);
      });
    },
  },

  // ----------------------------------------------------------- interaction
  {
    id: 'field-does-not-fill-when-typed-into',
    klass: 'interaction',
    description: 'typing leaves the field reporting empty, so a floating label never lifts',
    expect: { dimensions: ['interaction.state'], caseIds: ['field/interaction-type-fills'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['field/interaction-type-fills'];
        if (interaction?.filled !== true) fail('the scenario did not fill the field to begin with');
        interaction.filled = false;
      });
    },
  },
  {
    id: 'field-stays-filled-after-clearing',
    klass: 'interaction',
    description: 'clearing leaves the field reporting filled',
    expect: { dimensions: ['interaction.state'], caseIds: ['field/interaction-clear-empties'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['field/interaction-clear-empties'];
        if (interaction?.filled !== false) fail('the scenario did not empty the field to begin with');
        interaction.filled = true;
      });
    },
  },
  {
    id: 'field-label-click-focuses-nothing',
    klass: 'interaction',
    description: 'clicking the label leaves focus on the body',
    expect: { dimensions: ['interaction.focus'], caseIds: ['field/interaction-label-click'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['field/interaction-label-click'];
        if (interaction?.focusRole !== 'control') fail('the label click did not focus the control to begin with');
        interaction.focusRole = 'body';
      });
    },
  },
  {
    id: 'field-loses-its-relationship-after-the-scenario',
    klass: 'interaction',
    description: 'the label stops reaching its control once the scenario has run',
    expect: { dimensions: ['interaction.relationships'], caseIds: ['field/interaction-type-fills'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['field/interaction-type-fills'];
        if (interaction?.labelTargetsControl !== true) fail('the label did not reach the control to begin with');
        interaction.labelTargetsControl = false;
      });
    },
  },
  {
    id: 'field-describes-a-foreign-node-after-the-scenario',
    klass: 'interaction',
    description: 'aria-describedby resolves somewhere else once the scenario has run',
    expect: { dimensions: ['interaction.relationships'], caseIds: ['field/interaction-type-fills-top'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions['field/interaction-type-fills-top'];
        if (!Array.isArray(interaction?.describedTargets) || interaction.describedTargets[0] !== 'description') {
          fail('the control did not describe its own description to begin with');
        }
        interaction.describedTargets = ['foreign'];
      });
    },
  },
];

export const fieldBrowserMutations = [
  {
    id: 'browser-field-label-loses-its-target',
    target: 'razor',
    caseIds: ['field/interaction-label-click'],
    description: 'the real label points at a control that does not exist, so clicking it focuses nothing',
    expect: { dimensions: ['interaction.focus'], caseIds: ['field/interaction-label-click'] },
    beforeInteraction: mutateElements(
      ['field/interaction-label-click'],
      '.vf-field__label',
      `
      if (!element.getAttribute('for')) throw new Error('MUTATION_NOT_APPLIED: no association');
      element.setAttribute('for', 'no-such-control');
    `,
    ),
  },
  {
    id: 'browser-field-cross-wired-labels',
    target: 'razor',
    caseIds: ['field/interaction-label-click'],
    description: "the real label points at another field's control, so the wrong input takes focus",
    expect: { dimensions: ['interaction.focus'], caseIds: ['field/interaction-label-click'] },
    beforeInteraction: mutateElements(
      ['field/interaction-label-click'],
      '.vf-field__label',
      `
      const other = document.querySelector('[data-parity-case="field/top-label"] input.vf-input');
      if (!other || !other.id) throw new Error('MUTATION_NOT_APPLIED: no other control');
      element.setAttribute('for', other.id);
    `,
    ),
  },
  {
    id: 'browser-field-duplicate-generated-ids',
    target: 'razor',
    caseIds: ['field/interaction-label-click'],
    description: "a second element claims this control's id, so the label resolves to the wrong node",
    expect: { dimensions: ['interaction.focus'], caseIds: ['field/interaction-label-click'] },
    beforeInteraction: mutateElements(
      ['field/interaction-label-click'],
      'input.vf-input',
      `
      const duplicate = document.createElement('input');
      duplicate.id = element.id;
      // Inserted before the real control, so getElementById resolves to it.
      document.body.insertBefore(duplicate, document.body.firstChild);
    `,
    ),
  },
  {
    id: 'browser-field-does-not-fill-on-input',
    target: 'razor',
    caseIds: ['field/interaction-type-fills'],
    description: 'the real field controller stops tracking filled, so a floating label never lifts',
    expect: { dimensions: ['interaction.state'], caseIds: ['field/interaction-type-fills'] },
    beforeInteraction: mutateElements(
      ['field/interaction-type-fills'],
      '.vf-field__control',
      `
      // Freeze the class list so the controller's toggle has no effect.
      const frozen = element.className;
      Object.defineProperty(element, 'className', { get: () => frozen, set: () => {} });
      element.classList.toggle = () => false;
      element.classList.add = () => {};
    `,
    ),
  },
  {
    id: 'browser-field-label-spacing',
    target: 'razor',
    caseIds: ['field/top-label'],
    description: 'a real CSS change to the gap between label and control, visible as geometry and as pixels',
    expect: { dimensions: ['style.geometry'], caseIds: ['field/top-label'] },
    beforeExtract: mutateElements(
      ['field/top-label'],
      '.vf-field__label',
      `
      element.style.setProperty('padding-bottom', '9px', 'important');
    `,
    ),
  },
];

export const fieldPolicyMutations = [
  {
    id: 'smuggled-structure-approval',
    description: 'an approval for dom.structure, which must never be waivable',
    rejectedBy: 'validation',
    apply(policy) {
      policy.approvedDivergences.push({
        id: 'smuggled-structure-approval',
        dimension: 'dom.structure',
        target: 'razor',
        caseIds: ['field/top-label'],
        classification: 'framework-specific',
        expectedOccurrences: 4,
        directions: ['reference-vs-razor', 'current-vs-razor'],
        reason: 'smuggled',
      });
    },
  },
  {
    id: 'smuggled-relationship-approval',
    description: 'an approval covering every case at once, which would waive the whole id graph',
    rejectedBy: 'validation',
    apply(policy) {
      policy.approvedDivergences.push({
        id: 'smuggled-relationship-approval',
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
  {
    id: 'smuggled-visual-approval',
    description: 'an approval for rendered pixels',
    rejectedBy: 'validation',
    apply(policy) {
      policy.approvedDivergences.push({
        id: 'smuggled-visual-approval',
        dimension: 'visual',
        target: 'razor',
        caseIds: ['field/top-label'],
        classification: 'framework-specific',
        expectedOccurrences: 4,
        directions: ['reference-vs-razor', 'current-vs-razor'],
        reason: 'smuggled',
      });
    },
  },
];
