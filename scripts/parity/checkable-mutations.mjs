// The negative fixtures for the three checkable parity gates.
//
// Three independent sets in one file, sharing helpers and nothing else. That is
// the batch's whole claim: three components migrated together, each still
// auditable on its own. A mutation aimed at one must fail that one's gate and
// leave the other two alone, which the batch isolation attacks then verify.
//
// The mutations that matter are the invisible ones. A checkbox whose
// indeterminate stopped working renders a checkbox. A radio group that lost
// mutual exclusion renders two radios. A switch that stopped calling itself a
// switch toggles perfectly well.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const control = (block) => (node) => node.tag === 'input' && node.classes.includes(`vf-${block}__input`);
const root = (block) => (node) => node.classes.includes(`vf-${block}`);

/** A capture mutation that flips one field of a case's interaction snapshot. */
function interactionMutation({ id, klass, description, component, caseId, field, from, to, dimension }) {
  return {
    id,
    klass,
    description,
    expect: { dimensions: [dimension ?? 'interaction.state'], caseIds: [caseId] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const interaction = capture.interactions[caseId];
        if (interaction === undefined) fail(`${caseId} has no interaction capture`);
        if (interaction[field] !== from) {
          fail(`${caseId} recorded ${field}=${JSON.stringify(interaction[field])}, not ${JSON.stringify(from)}`);
        }
        interaction[field] = to;
      });
    },
    component,
  };
}

export const checkboxParityMutations = [
  {
    id: 'checkbox-drops-the-checked-modifier',
    klass: 'canonical classes',
    description: 'a checked box stops looking checked',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['checkbox/checked'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'checkbox/checked', root('checkbox'), 'checkbox root');
        if (!node.classes.includes('vf-checkbox--checked')) fail('the case was not checked');
        node.classes = node.classes.filter((name) => name !== 'vf-checkbox--checked');
      });
    },
  },
  {
    id: 'checkbox-drops-the-size-modifier',
    klass: 'canonical classes',
    description: 'the default size stops emitting its modifier, which is the convention this component keeps',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['checkbox/size-md'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'checkbox/size-md', root('checkbox'), 'checkbox root');
        if (!node.classes.includes('vf-checkbox--md')) fail('the case carried no size modifier');
        node.classes = node.classes.filter((name) => name !== 'vf-checkbox--md');
      });
    },
  },
  {
    id: 'checkbox-drops-the-indeterminate-modifier',
    klass: 'canonical classes',
    description: 'an indeterminate box stops looking indeterminate',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['checkbox/indeterminate'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'checkbox/indeterminate', root('checkbox'), 'checkbox root');
        if (!node.classes.includes('vf-checkbox--indeterminate')) fail('the case was not indeterminate');
        node.classes = node.classes.filter((name) => name !== 'vf-checkbox--indeterminate');
      });
    },
  },
  {
    id: 'checkbox-loses-the-consumer-class',
    klass: 'canonical classes',
    description: 'a consumer class stops reaching the root label',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['checkbox/consumer-class'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'checkbox/consumer-class', root('checkbox'), 'checkbox root');
        if (!node.consumerClasses.includes('consumer-checkbox')) fail('the case carried no consumer class');
        node.consumerClasses = node.consumerClasses.filter((name) => name !== 'consumer-checkbox');
      });
    },
  },
  {
    id: 'checkbox-loses-its-live-checked-state',
    klass: 'live state',
    description: 'the rendered box is not actually checked, which the checked attribute alone would hide',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['checkbox/checked'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'checkbox/checked', control('checkbox'), 'checkbox input');
        if (node.liveChecked !== true) fail('the case was not checked');
        node.liveChecked = false;
      });
    },
  },
  {
    id: 'checkbox-loses-its-indeterminate-property',
    klass: 'live state',
    description: 'the indeterminate property is never set, which no attribute would show',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['checkbox/indeterminate'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'checkbox/indeterminate', control('checkbox'), 'checkbox input');
        if (node.liveIndeterminate !== true) fail('the case was not indeterminate');
        node.liveIndeterminate = false;
      });
    },
  },
  {
    id: 'checkbox-reports-indeterminate-as-checked',
    klass: 'aria',
    description: 'aria-checked stops saying mixed',
    expect: { dimensions: ['dom.aria'], caseIds: ['checkbox/indeterminate'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'checkbox/indeterminate', control('checkbox'), 'checkbox input');
        if (node.attributes['aria-checked'] !== 'mixed') fail('the case did not report mixed');
        node.attributes['aria-checked'] = 'false';
      });
    },
  },
  {
    id: 'checkbox-drops-aria-invalid',
    klass: 'aria',
    description: 'an invalid box stops reporting itself invalid',
    expect: { dimensions: ['dom.aria'], caseIds: ['checkbox/invalid'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'checkbox/invalid', control('checkbox'), 'checkbox input');
        if (node.attributes['aria-invalid'] !== 'true') fail('the case was not invalid');
        delete node.attributes['aria-invalid'];
      });
    },
  },
  {
    id: 'checkbox-loses-a-forwarded-native-attribute',
    klass: 'native attributes',
    description: 'name, value and required stop reaching the input',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['checkbox/native-attributes'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'checkbox/native-attributes', control('checkbox'), 'checkbox input');
        if (node.attributes.name === undefined) fail('the case forwarded no name');
        delete node.attributes.name;
        delete node.attributes.value;
        delete node.attributes.required;
      });
    },
  },
  {
    id: 'checkbox-loses-its-disabled-state',
    klass: 'native attributes',
    description: 'a disabled box becomes operable',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['checkbox/disabled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'checkbox/disabled', control('checkbox'), 'checkbox input');
        if (node.attributes.disabled === undefined) fail('the case was not disabled');
        delete node.attributes.disabled;
      });
    },
  },
  {
    id: 'checkbox-renders-a-different-label',
    klass: 'text',
    description: 'the label reads differently on one adapter',
    expect: { dimensions: ['dom.text'], caseIds: ['checkbox/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(
          capture,
          'checkbox/default',
          (candidate) => candidate.classes.includes('vf-checkbox__content'),
          'checkbox content',
        );
        node.text = 'Something else';
      });
    },
  },
  {
    id: 'checkbox-exposes-a-different-name-to-assistive-tech',
    klass: 'accessibility',
    description: 'the accessibility tree reports a name the label does not say',
    expect: { dimensions: ['a11y.name'], caseIds: ['checkbox/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility['checkbox/default'];
        if (!exposed?.control) fail('the control is not exposed to the accessibility tree');
        exposed.control.name = 'Something else';
      });
    },
  },
  interactionMutation({
    id: 'checkbox-does-not-check-on-a-pointer-click',
    klass: 'interaction',
    component: 'checkbox',
    description: 'a real pointer click leaves the box unchecked',
    caseId: 'checkbox/interaction-pointer',
    field: 'liveChecked',
    from: true,
    to: false,
  }),
  interactionMutation({
    id: 'checkbox-does-not-check-on-space',
    klass: 'interaction',
    component: 'checkbox',
    description: 'Space leaves the box unchecked',
    caseId: 'checkbox/interaction-space',
    field: 'liveChecked',
    from: true,
    to: false,
  }),
  interactionMutation({
    id: 'checkbox-activates-while-disabled',
    klass: 'interaction',
    component: 'checkbox',
    description: 'a disabled box checks itself, which is the regression disabled exists to prevent',
    caseId: 'checkbox/interaction-disabled-pointer',
    field: 'liveChecked',
    from: false,
    to: true,
  }),
  interactionMutation({
    id: 'checkbox-keeps-indeterminate-after-a-click',
    klass: 'interaction',
    component: 'checkbox',
    description: 'clicking an indeterminate box leaves it indeterminate rather than resolving it',
    caseId: 'checkbox/interaction-indeterminate-click',
    field: 'liveIndeterminate',
    from: false,
    to: true,
  }),
  interactionMutation({
    id: 'checkbox-label-click-reaches-nothing',
    klass: 'interaction',
    component: 'checkbox',
    description: 'clicking the label leaves the control untouched, so the label wrapper is not doing its job',
    caseId: 'checkbox/interaction-label-click',
    field: 'liveChecked',
    from: true,
    to: false,
  }),
];

export const radioParityMutations = [
  {
    id: 'radio-drops-the-checked-modifier',
    klass: 'canonical classes',
    description: 'the selected member stops looking selected',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['radio/checked'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'radio/checked', root('radio'), 'radio root');
        if (!node.classes.includes('vf-radio--checked')) fail('the case was not selected');
        node.classes = node.classes.filter((name) => name !== 'vf-radio--checked');
      });
    },
  },
  {
    id: 'radio-selects-on-a-loose-comparison',
    klass: 'canonical classes',
    description: 'a string-valued radio starts matching a numeric model',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['radio/strict-mismatch'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'radio/strict-mismatch', root('radio'), 'radio root');
        if (node.classes.includes('vf-radio--checked')) fail('the case was already selected');
        node.classes = [...node.classes, 'vf-radio--checked'].sort();
      });
    },
  },
  {
    id: 'radio-loses-its-value',
    klass: 'native attributes',
    description: 'the value never reaches the input, so a submitted group carries nothing',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['radio/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'radio/default', control('radio'), 'radio input');
        if (node.attributes.value === undefined) fail('the case rendered no value');
        delete node.attributes.value;
      });
    },
  },
  {
    id: 'radio-loses-its-group-name',
    klass: 'native attributes',
    description: 'the shared name disappears, so the members stop being one group at all',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['radio/group-first-selected'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'radio/group-first-selected', control('radio'), 'radio input');
        if (node.attributes.name === undefined) fail('the group carried no name');
        delete node.attributes.name;
      });
    },
  },
  {
    id: 'radio-loses-its-live-checked-state',
    klass: 'live state',
    description: 'the selected member is not actually checked',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['radio/checked'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'radio/checked', control('radio'), 'radio input');
        if (node.liveChecked !== true) fail('the case was not selected');
        node.liveChecked = false;
      });
    },
  },
  {
    id: 'radio-loses-its-disabled-state',
    klass: 'native attributes',
    description: 'a disabled radio becomes operable',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['radio/disabled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'radio/disabled', control('radio'), 'radio input');
        if (node.attributes.disabled === undefined) fail('the case was not disabled');
        delete node.attributes.disabled;
      });
    },
  },
  {
    id: 'radio-drops-aria-invalid',
    klass: 'aria',
    description: 'an invalid radio stops reporting itself invalid',
    expect: { dimensions: ['dom.aria'], caseIds: ['radio/invalid'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'radio/invalid', control('radio'), 'radio input');
        if (node.attributes['aria-invalid'] !== 'true') fail('the case was not invalid');
        delete node.attributes['aria-invalid'];
      });
    },
  },
  {
    id: 'radio-exposes-a-different-name-to-assistive-tech',
    klass: 'accessibility',
    description: 'the accessibility tree reports a name the label does not say',
    expect: { dimensions: ['a11y.name'], caseIds: ['radio/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility['radio/default'];
        if (!exposed?.control) fail('the control is not exposed to the accessibility tree');
        exposed.control.name = 'Something else';
      });
    },
  },
  interactionMutation({
    id: 'radio-does-not-select-on-a-pointer-click',
    klass: 'interaction',
    component: 'radio',
    description: 'a real pointer click leaves the radio unselected',
    caseId: 'radio/interaction-pointer',
    field: 'liveChecked',
    from: true,
    to: false,
  }),
  interactionMutation({
    id: 'radio-group-loses-mutual-exclusion',
    klass: 'interaction',
    component: 'radio',
    description: 'both members end up checked, which renders identically to a working group',
    caseId: 'radio/interaction-group-exclusion',
    field: 'groupCheckedCount',
    from: 1,
    to: 2,
    dimension: 'interaction.group',
  }),
  interactionMutation({
    id: 'radio-group-selects-the-wrong-member',
    klass: 'interaction',
    component: 'radio',
    description: 'clicking the second member selects the first instead',
    caseId: 'radio/interaction-group-exclusion',
    field: 'groupChecked',
    from: 'b',
    to: 'a',
    dimension: 'interaction.group',
  }),
  interactionMutation({
    id: 'radio-activates-while-disabled',
    klass: 'interaction',
    component: 'radio',
    description: 'a disabled radio selects itself',
    caseId: 'radio/interaction-disabled-pointer',
    field: 'liveChecked',
    from: false,
    to: true,
  }),
];

export const switchParityMutations = [
  {
    id: 'switch-drops-its-role',
    klass: 'aria',
    description: 'the control stops calling itself a switch and reads as a plain checkbox',
    expect: { dimensions: ['dom.aria'], caseIds: ['switch/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'switch/default', control('switch'), 'switch input');
        if (node.attributes.role !== 'switch') fail('the case did not carry the switch role');
        delete node.attributes.role;
      });
    },
  },
  {
    id: 'switch-starts-reporting-aria-checked',
    klass: 'aria',
    description: 'the switch grows an aria-checked the reference deliberately leaves off',
    expect: { dimensions: ['dom.aria'], caseIds: ['switch/checked'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'switch/checked', control('switch'), 'switch input');
        if (node.attributes['aria-checked'] !== undefined) fail('the case already reported aria-checked');
        node.attributes['aria-checked'] = 'true';
      });
    },
  },
  {
    id: 'switch-drops-the-checked-modifier',
    klass: 'canonical classes',
    description: 'an on switch stops looking on',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['switch/checked'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'switch/checked', root('switch'), 'switch root');
        if (!node.classes.includes('vf-switch--checked')) fail('the case was not on');
        node.classes = node.classes.filter((name) => name !== 'vf-switch--checked');
      });
    },
  },
  {
    id: 'switch-drops-the-static-modifier',
    klass: 'canonical classes',
    description: 'the static presentation disappears',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['switch/static'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'switch/static', root('switch'), 'switch root');
        if (!node.classes.includes('vf-switch--static')) fail('the case was not static');
        node.classes = node.classes.filter((name) => name !== 'vf-switch--static');
      });
    },
  },
  {
    id: 'switch-drops-the-thumb-contrast-modifier',
    klass: 'canonical classes',
    description: 'the inverse thumb contrast falls back to auto',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['switch/thumb-contrast-inverse'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'switch/thumb-contrast-inverse', root('switch'), 'switch root');
        if (!node.classes.includes('vf-switch--thumb-contrast-inverse')) fail('the case carried no contrast modifier');
        node.classes = node.classes.filter((name) => name !== 'vf-switch--thumb-contrast-inverse');
      });
    },
  },
  {
    id: 'switch-renders-content-for-a-whitespace-slot',
    klass: 'structure',
    description: 'a blank slot starts rendering an empty content element',
    expect: { dimensions: ['dom.structure'], caseIds: ['switch/whitespace-slot'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'switch/whitespace-slot', root('switch'), 'switch root');
        if (node.children.some((child) => child.classes.includes('vf-switch__content'))) {
          fail('the case already rendered content');
        }
        node.children.push({
          tag: 'span',
          classes: ['vf-switch__content'],
          consumerClasses: [],
          attributes: {},
          children: [],
        });
      });
    },
  },
  {
    id: 'switch-loses-its-live-checked-state',
    klass: 'live state',
    description: 'the rendered switch is not actually on',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['switch/checked'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'switch/checked', control('switch'), 'switch input');
        if (node.liveChecked !== true) fail('the case was not on');
        node.liveChecked = false;
      });
    },
  },
  {
    id: 'switch-loses-its-disabled-state',
    klass: 'native attributes',
    description: 'a disabled switch becomes operable',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['switch/disabled'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'switch/disabled', control('switch'), 'switch input');
        if (node.attributes.disabled === undefined) fail('the case was not disabled');
        delete node.attributes.disabled;
      });
    },
  },
  {
    id: 'switch-exposes-a-different-name-to-assistive-tech',
    klass: 'accessibility',
    description: 'the accessibility tree reports a name the label does not say',
    expect: { dimensions: ['a11y.name'], caseIds: ['switch/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const exposed = capture.accessibility['switch/default'];
        if (!exposed?.control) fail('the control is not exposed to the accessibility tree');
        exposed.control.name = 'Something else';
      });
    },
  },
  interactionMutation({
    id: 'switch-does-not-turn-on-with-a-pointer',
    klass: 'interaction',
    component: 'switch',
    description: 'a real pointer click leaves the switch off',
    caseId: 'switch/interaction-pointer',
    field: 'liveChecked',
    from: true,
    to: false,
  }),
  interactionMutation({
    id: 'switch-does-not-toggle-on-space',
    klass: 'interaction',
    component: 'switch',
    description: 'Space leaves the switch off, so the native keyboard contract is gone',
    caseId: 'switch/interaction-space',
    field: 'liveChecked',
    from: true,
    to: false,
  }),
  interactionMutation({
    id: 'switch-does-not-turn-off',
    klass: 'interaction',
    component: 'switch',
    description: 'clicking an on switch leaves it on',
    caseId: 'switch/interaction-off',
    field: 'liveChecked',
    from: false,
    to: true,
  }),
  interactionMutation({
    id: 'switch-activates-while-disabled',
    klass: 'interaction',
    component: 'switch',
    description: 'a disabled switch toggles itself',
    caseId: 'switch/interaction-disabled-pointer',
    field: 'liveChecked',
    from: false,
    to: true,
  }),
];

/** Browser mutations, per component, on the real page. */
export const checkboxBrowserMutations = [
  {
    id: 'browser-checkbox-not-clickable',
    target: 'razor',
    caseIds: ['checkbox/interaction-pointer'],
    description: 'the real control stops receiving pointer events, so a genuine click checks nothing',
    expect: { dimensions: ['interaction.state'], caseIds: ['checkbox/interaction-pointer'] },
    // The whole label, not just the painted control. Blocking pointer events
    // on the control alone changes nothing: the root of all three components
    // is a <label>, so a click that falls through to it still activates the
    // input. That robustness is the contract, and this mutation only proves
    // anything if it removes the click target the user actually has.
    beforeInteraction: mutateElements(
      ['checkbox/interaction-pointer'],
      '.vf-checkbox',
      "element.style.setProperty('pointer-events', 'none', 'important');",
    ),
  },
  {
    id: 'browser-checkbox-loses-its-indeterminate-property',
    target: 'razor',
    caseIds: ['checkbox/indeterminate'],
    description: 'the real indeterminate property is cleared, which no attribute would reveal',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['checkbox/indeterminate'] },
    beforeExtract: mutateElements(
      ['checkbox/indeterminate'],
      'input.vf-checkbox__input',
      `
      if (!element.indeterminate) throw new Error('MUTATION_NOT_APPLIED: not indeterminate');
      element.indeterminate = false;
    `,
    ),
  },
  {
    id: 'browser-checkbox-geometry',
    target: 'razor',
    caseIds: ['checkbox/default'],
    description: 'a real CSS change to the control box, visible as geometry and as pixels',
    expect: { dimensions: ['style.geometry'], caseIds: ['checkbox/default'] },
    beforeExtract: mutateElements(
      ['checkbox/default'],
      '.vf-checkbox__control',
      "element.style.setProperty('width', '31px', 'important');",
    ),
  },
];

export const radioBrowserMutations = [
  {
    id: 'browser-radio-group-loses-its-shared-name',
    target: 'razor',
    caseIds: ['radio/interaction-group-exclusion'],
    description: 'the real members stop sharing a name, so both can be checked at once',
    expect: { dimensions: ['interaction.group'], caseIds: ['radio/interaction-group-exclusion'] },
    beforeInteraction: mutateElements(
      ['radio/interaction-group-exclusion'],
      'input.vf-radio__input',
      `
      if (!element.name) throw new Error('MUTATION_NOT_APPLIED: no group name');
      element.name = element.name + '-' + element.value;
    `,
    ),
  },
  {
    id: 'browser-radio-not-clickable',
    target: 'razor',
    caseIds: ['radio/interaction-pointer'],
    description: 'the real control stops receiving pointer events',
    expect: { dimensions: ['interaction.state'], caseIds: ['radio/interaction-pointer'] },
    // The whole label, not just the painted control. Blocking pointer events
    // on the control alone changes nothing: the root of all three components
    // is a <label>, so a click that falls through to it still activates the
    // input. That robustness is the contract, and this mutation only proves
    // anything if it removes the click target the user actually has.
    beforeInteraction: mutateElements(
      ['radio/interaction-pointer'],
      '.vf-radio',
      "element.style.setProperty('pointer-events', 'none', 'important');",
    ),
  },
  {
    id: 'browser-radio-geometry',
    target: 'razor',
    caseIds: ['radio/default'],
    description: 'a real CSS change to the control box',
    expect: { dimensions: ['style.geometry'], caseIds: ['radio/default'] },
    beforeExtract: mutateElements(
      ['radio/default'],
      '.vf-radio__control',
      "element.style.setProperty('width', '29px', 'important');",
    ),
  },
];

export const switchBrowserMutations = [
  {
    id: 'browser-switch-becomes-operable-while-disabled',
    target: 'razor',
    caseIds: ['switch/interaction-disabled-pointer'],
    description: 'the real disabled switch loses its disabled state and the pointer toggles it',
    expect: { dimensions: ['interaction.state'], caseIds: ['switch/interaction-disabled-pointer'] },
    beforeInteraction: mutateElements(
      ['switch/interaction-disabled-pointer'],
      'input.vf-switch__input',
      `
      if (!element.disabled) throw new Error('MUTATION_NOT_APPLIED: the control was not disabled');
      element.disabled = false;
    `,
    ),
  },
  {
    id: 'browser-switch-not-clickable',
    target: 'razor',
    caseIds: ['switch/interaction-pointer'],
    description: 'the real control stops receiving pointer events',
    expect: { dimensions: ['interaction.state'], caseIds: ['switch/interaction-pointer'] },
    // The whole label, not just the painted control. Blocking pointer events
    // on the control alone changes nothing: the root of all three components
    // is a <label>, so a click that falls through to it still activates the
    // input. That robustness is the contract, and this mutation only proves
    // anything if it removes the click target the user actually has.
    beforeInteraction: mutateElements(
      ['switch/interaction-pointer'],
      '.vf-switch',
      "element.style.setProperty('pointer-events', 'none', 'important');",
    ),
  },
  {
    id: 'browser-switch-geometry',
    target: 'razor',
    caseIds: ['switch/default'],
    description: 'a real CSS change to the track box',
    expect: { dimensions: ['style.geometry'], caseIds: ['switch/default'] },
    beforeExtract: mutateElements(
      ['switch/default'],
      '.vf-switch__control',
      "element.style.setProperty('width', '73px', 'important');",
    ),
  },
];

/** Policy mutations, generated per component from one shape. */
function policyMutationsFor(component, caseId) {
  const push = (policy, entry) => policy.approvedDivergences.push(entry);

  return [
    {
      id: 'smuggled-structure-approval',
      description: 'an approval for dom.structure, which must never be waivable',
      rejectedBy: 'validation',
      apply(policy) {
        push(policy, {
          id: 'smuggled-structure-approval',
          dimension: 'dom.structure',
          target: 'razor',
          caseIds: [caseId],
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
        push(policy, {
          id: 'smuggled-visual-approval',
          dimension: 'visual',
          target: 'razor',
          caseIds: [caseId],
          classification: 'framework-specific',
          expectedOccurrences: 4,
          directions: ['reference-vs-razor', 'current-vs-razor'],
          reason: 'smuggled',
        });
      },
    },
    {
      id: 'smuggled-wildcard-case',
      description: `an approval covering every ${component} case at once`,
      rejectedBy: 'validation',
      apply(policy) {
        push(policy, {
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
}

export const checkboxPolicyMutations = policyMutationsFor('checkbox', 'checkbox/default');
export const radioPolicyMutations = policyMutationsFor('radio', 'radio/default');
export const switchPolicyMutations = policyMutationsFor('switch', 'switch/default');
