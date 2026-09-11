// The negative fixtures for the VfProgressSpinner parity gate.
//
// The M20 set, and the first written for a component another migrated
// component already renders. Three groups carry it:
//
//   - the drawing. A spinner's contract is mostly geometry the stylesheet
//     depends on: a 50-unit viewBox, two circles of radius 20, the stroke on
//     both. A radius that moved, a track that vanished, a width that pinned the
//     svg - each has to fail on a named node and a named attribute, not only
//     on a screenshot, because the screenshot is the final keyframe of an
//     animation and a pixel difference there says nothing about which value
//     moved;
//   - the progressbar. The root is exposed and named on every tone, hides only
//     its artwork, writes no value, and yields its role and its name to a
//     consumer. A spinner that became a status, hid itself, gained 0..100 or
//     beat the consumer's role is an accessibility change, and each has to
//     move both the DOM dimension and the browser's tree;
//   - the tone rule borrowed from the badge, and the size written as a width.
//     Both are invisible at one tone or one size and visible on the neutral
//     and the consumer-override cases, which is why those cases exist.
//
// Each mutation names the dimension that must catch it, and each fails the
// harness rather than counting as a detection if it cannot find what it is
// supposed to break. Nothing here touches the source tree.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const root = (node) => node.classes.includes('vf-progress-spinner');
const classed = (name) => (node) => node.classes.includes(name);
const tagged = (tag) => (node) => node.tag === tag;

/** A capture mutation that flips one field of a case's static snapshot. */
function staticSnapshotMutation({ id, description, caseId, field, from, to }) {
  return {
    id,
    klass: 'static snapshot',
    description,
    expect: { dimensions: ['static.noInteraction'], caseIds: [caseId] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const snapshot = capture.interactions[caseId];
        if (snapshot === undefined) fail(`${caseId} has no static snapshot; the stage did not run at all`);
        if (snapshot[field] !== from) {
          fail(`${caseId} recorded ${field}=${JSON.stringify(snapshot[field])}, not ${JSON.stringify(from)}`);
        }
        snapshot[field] = to;
      });
    },
  };
}

/** Rewrites one attribute of a node in a capture. */
function setAttribute(caseId, predicate, what, name, value) {
  return (captures) => {
    eachTheme(captures, 'razor', (capture) => {
      const node = findNode(capture, caseId, predicate, what);
      if (node.attributes[name] === value) fail(`${caseId} already carried ${name}=${value}`);
      node.attributes = { ...node.attributes, [name]: value };
    });
  };
}

/** Removes one attribute of a node in a capture. */
function dropAttribute(caseId, predicate, what, name) {
  return (captures) => {
    eachTheme(captures, 'razor', (capture) => {
      const node = findNode(capture, caseId, predicate, what);
      if (!(name in node.attributes)) fail(`${caseId} did not carry ${name}`);
      const { [name]: dropped, ...rest } = node.attributes;
      void dropped;
      node.attributes = rest;
    });
  };
}

const aria = (id, description, caseId, detail, apply) => ({
  id,
  klass: 'aria',
  description,
  expect: { dimensions: ['dom.aria'], details: { 'dom.aria': [detail] }, caseIds: [caseId] },
  apply,
});

const native = (id, description, caseId, details, apply) => ({
  id,
  klass: 'native attributes',
  description,
  expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': details }, caseIds: [caseId] },
  apply,
});

export const progressSpinnerParityMutations = [
  // ------------------------------------------------------------- the drawing

  {
    id: 'spinner-root-becomes-a-div',
    klass: 'structure',
    description:
      'the inline span becomes a div, which looks identical at the default display and is a different element',
    expect: { dimensions: ['dom.structure'], caseIds: ['progress-spinner/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, 'progress-spinner/default', root, 'spinner root').tag = 'div';
      });
    },
  },
  {
    id: 'spinner-loses-the-track',
    klass: 'structure',
    description: 'the track circle is removed, leaving the arc to spin over nothing',
    expect: { dimensions: ['dom.structure'], caseIds: ['progress-spinner/stroke-width-thick'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const svg = findNode(capture, 'progress-spinner/stroke-width-thick', tagged('svg'), 'spinner artwork');
        if (svg.children.length !== 2) fail('the artwork did not hold two circles');
        svg.children = svg.children.filter((child) => !child.classes.includes('vf-progress-spinner__track'));
      });
    },
  },
  {
    id: 'spinner-grows-a-control',
    klass: 'structure',
    description: 'a component-owned button appears inside the spinner, which no case declares and no target renders',
    expect: { dimensions: ['dom.structure', 'static.noInteraction'], caseIds: ['progress-spinner/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-spinner/default', root, 'spinner root');
        node.children = [
          ...node.children,
          {
            tag: 'button',
            classes: ['vf-progress-spinner__cancel'],
            consumerClasses: [],
            attributes: { type: 'button' },
            children: [],
          },
        ];
        const snapshot = capture.interactions['progress-spinner/default'];
        if (snapshot?.focusableCount !== 0) fail('the case did not record zero focusable elements');
        snapshot.focusableCount = 1;
      });
    },
  },
  native(
    'spinner-changes-the-viewbox',
    'the viewBox shrinks to 48 units, so the 20-unit circles no longer fit the dash lengths computed for 50',
    'progress-spinner/default',
    ['viewBox'],
    setAttribute('progress-spinner/default', tagged('svg'), 'spinner artwork', 'viewBox', '0 0 48 48'),
  ),
  native(
    'spinner-pins-the-svg-to-fifty-pixels',
    'the svg gains width and height attributes, so the custom property stops sizing the artwork',
    'progress-spinner/size-number',
    ['width', 'height'],
    (captures) => {
      eachTheme(captures, 'razor', (capture) => {
        const svg = findNode(capture, 'progress-spinner/size-number', tagged('svg'), 'spinner artwork');
        if ('width' in svg.attributes) fail('the artwork already carried a width');
        svg.attributes = { ...svg.attributes, width: '50', height: '50' };
      });
    },
  ),
  native(
    'spinner-shrinks-the-radius',
    'both circles draw at radius 18 - a geometry difference on a named node, caught without a screenshot',
    'progress-spinner/default',
    ['r'],
    (captures) => {
      eachTheme(captures, 'razor', (capture) => {
        for (const name of ['vf-progress-spinner__track', 'vf-progress-spinner__value']) {
          const circle = findNode(capture, 'progress-spinner/default', classed(name), name);
          if (circle.attributes.r !== '20') fail(`${name} did not carry r=20`);
          circle.attributes = { ...circle.attributes, r: '18' };
        }
      });
    },
  ),
  native(
    'spinner-moves-the-centre',
    'the value arc is drawn off-centre, so it no longer sits on the track',
    'progress-spinner/default',
    ['cx'],
    setAttribute('progress-spinner/default', classed('vf-progress-spinner__value'), 'value arc', 'cx', '24'),
  ),
  native(
    'spinner-strokes-only-the-arc',
    'the track keeps the default stroke while the arc takes the thick one - a plausible spinner with a hairline track',
    'progress-spinner/stroke-width-thick',
    ['stroke-width'],
    (captures) => {
      eachTheme(captures, 'razor', (capture) => {
        const track = findNode(
          capture,
          'progress-spinner/stroke-width-thick',
          classed('vf-progress-spinner__track'),
          'track',
        );
        if (track.attributes['stroke-width'] !== '8') fail('the track did not carry the thick stroke');
        track.attributes = { ...track.attributes, 'stroke-width': '4' };
      });
    },
  ),
  native(
    'spinner-fills-the-track',
    'the track gains a fill, which paints a disc under the arc',
    'progress-spinner/default',
    ['fill'],
    setAttribute('progress-spinner/default', classed('vf-progress-spinner__track'), 'track', 'fill', 'currentColor'),
  ),
  native(
    'spinner-artwork-becomes-focusable',
    'focusable="false" leaves the svg',
    'progress-spinner/default',
    ['focusable'],
    dropAttribute('progress-spinner/default', tagged('svg'), 'spinner artwork', 'focusable'),
  ),

  // ------------------------------------------------------------ the size

  native(
    'spinner-loses-the-size-declaration',
    'a numeric size stops reaching the custom property, so the spinner renders at the token default',
    'progress-spinner/size-number',
    ['style'],
    dropAttribute('progress-spinner/size-number', root, 'spinner root', 'style'),
  ),
  native(
    'spinner-writes-the-size-as-a-width',
    'the size is written as width and height declarations rather than the custom property the stylesheet reads',
    'progress-spinner/size-number',
    ['style'],
    setAttribute('progress-spinner/size-number', root, 'spinner root', 'style', 'height:40px;width:40px'),
  ),
  native(
    'spinner-drops-the-px-suffix',
    'a numeric size reaches the custom property as a bare number, which is not a length',
    'progress-spinner/size-number',
    ['style'],
    setAttribute('progress-spinner/size-number', root, 'spinner root', 'style', '--vf-progress-spinner-size:40'),
  ),
  native(
    'spinner-lets-the-prop-beat-the-consumer-style',
    "the component's size declaration is written after the consumer's, so the consumer override loses",
    'progress-spinner/consumer-style-overrides-size',
    ['style'],
    setAttribute(
      'progress-spinner/consumer-style-overrides-size',
      root,
      'spinner root',
      'style',
      '--vf-progress-spinner-size:40px',
    ),
  ),
  native(
    'spinner-writes-an-empty-size',
    'an empty-string size reaches the style attribute as an empty declaration',
    'progress-spinner/size-empty',
    ['style'],
    setAttribute('progress-spinner/size-empty', root, 'spinner root', 'style', '--vf-progress-spinner-size:0'),
  ),

  // ------------------------------------------------------- the progressbar

  aria(
    'spinner-loses-its-role',
    'the root stops being a progressbar, so a loading state is announced by nothing',
    'progress-spinner/default',
    'role',
    dropAttribute('progress-spinner/default', root, 'spinner root', 'role'),
  ),
  aria(
    'spinner-becomes-a-status',
    'the root exposes role=status - the "improvement" every polite loading indicator has and the reference does not',
    'progress-spinner/tone-danger',
    'role',
    setAttribute('progress-spinner/tone-danger', root, 'spinner root', 'role', 'status'),
  ),
  aria(
    'spinner-loses-its-name',
    'aria-label leaves the root, so the progressbar is unnamed',
    'progress-spinner/default',
    'aria-label',
    dropAttribute('progress-spinner/default', root, 'spinner root', 'aria-label'),
  ),
  aria(
    'spinner-hides-itself',
    'aria-hidden is written on the root as well as the svg, so the name is exposed to nothing',
    'progress-spinner/default',
    'aria-hidden',
    setAttribute('progress-spinner/default', root, 'spinner root', 'aria-hidden', 'true'),
  ),
  aria(
    'spinner-exposes-its-artwork',
    'aria-hidden leaves the svg, so the tree gains a nameless graphic beside the progressbar',
    'progress-spinner/default',
    'aria-hidden',
    dropAttribute('progress-spinner/default', tagged('svg'), 'spinner artwork', 'aria-hidden'),
  ),
  aria(
    'spinner-gains-a-value-range',
    'the root starts writing aria-valuemin=0 and aria-valuemax=100 - a completed progressbar the reference never was',
    'progress-spinner/default',
    'aria-valuemin',
    (captures) => {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-spinner/default', root, 'spinner root');
        if ('aria-valuemin' in node.attributes) fail('the root already carried a value range');
        node.attributes = { ...node.attributes, 'aria-valuemin': '0', 'aria-valuemax': '100' };
      });
    },
  ),
  aria(
    'spinner-drops-the-consumer-value',
    'a consumer aria-valuenow is filtered out rather than forwarded',
    'progress-spinner/consumer-value-semantics',
    'aria-valuenow',
    dropAttribute('progress-spinner/consumer-value-semantics', root, 'spinner root', 'aria-valuenow'),
  ),
  aria(
    'spinner-lets-its-own-role-beat-the-consumer',
    'the component role is written after the forwarded attrs, so a consumer role=status loses',
    'progress-spinner/consumer-role',
    'role',
    (captures) => {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-spinner/consumer-role', root, 'spinner root');
        if (node.attributes.role !== 'status') fail('the case did not carry the consumer role');
        node.attributes = { ...node.attributes, role: 'progressbar' };
      });
    },
  ),
  aria(
    'spinner-lets-its-own-name-beat-the-consumer',
    'the label prop is written after the forwarded attrs, so a consumer aria-label loses',
    'progress-spinner/consumer-aria-label',
    'aria-label',
    (captures) => {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-spinner/consumer-aria-label', root, 'spinner root');
        if (node.attributes['aria-label'] !== 'Busy') fail('the case did not carry the consumer name');
        node.attributes = { ...node.attributes, 'aria-label': 'Loading' };
      });
    },
  ),
  aria(
    'spinner-drops-an-empty-name',
    'an empty label prop is dropped rather than written empty',
    'progress-spinner/label-empty',
    'aria-label',
    dropAttribute('progress-spinner/label-empty', root, 'spinner root', 'aria-label'),
  ),

  // ------------------------------------------------------------- the tone

  {
    id: 'spinner-drops-the-tone-modifier',
    klass: 'canonical classes',
    description: 'the danger modifier stops reaching the class list, so the arc paints as primary',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['progress-spinner/tone-danger'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-spinner/tone-danger', root, 'spinner root');
        if (!node.classes.includes('vf-progress-spinner--danger')) fail('the case did not carry the danger modifier');
        node.classes = node.classes.filter((name) => name !== 'vf-progress-spinner--danger');
      });
    },
  },
  {
    // The badge's rule under the spinner's block name: it suppresses `neutral`
    // where the spinner suppresses `primary`.
    id: 'spinner-suppresses-neutral-instead-of-primary',
    klass: 'canonical classes',
    description: 'the tone rule is borrowed from VfBadge, so neutral emits no modifier',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['progress-spinner/tone-neutral'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-spinner/tone-neutral', root, 'spinner root');
        if (!node.classes.includes('vf-progress-spinner--neutral')) fail('the case did not carry the neutral modifier');
        node.classes = node.classes.filter((name) => name !== 'vf-progress-spinner--neutral');
      });
    },
  },
  {
    id: 'spinner-emits-a-primary-modifier',
    klass: 'canonical classes',
    description: 'the other half of the borrowed rule: the default tone emits vf-progress-spinner--primary',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['progress-spinner/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-spinner/default', root, 'spinner root');
        if (node.classes.length !== 1) fail('the default case carried a modifier already');
        node.classes = [...node.classes, 'vf-progress-spinner--primary'].sort();
      });
    },
  },
  {
    id: 'spinner-becomes-a-badge',
    klass: 'canonical classes',
    description: "VfBadge's block name is reused for the spinner root",
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['progress-spinner/tone-success'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-spinner/tone-success', root, 'spinner root');
        node.classes = node.classes.map((name) => name.replace('vf-progress-spinner', 'vf-badge'));
      });
    },
  },
  {
    id: 'spinner-loses-the-svg-class',
    klass: 'canonical classes',
    description: 'the svg loses the class the rotate animation is keyed on',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['progress-spinner/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const svg = findNode(capture, 'progress-spinner/default', tagged('svg'), 'spinner artwork');
        if (!svg.classes.includes('vf-progress-spinner__svg')) fail('the artwork did not carry its class');
        svg.classes = [];
      });
    },
  },
  {
    id: 'spinner-loses-the-consumer-class',
    klass: 'canonical classes',
    description: 'the consumer class stops reaching the root',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['progress-spinner/consumer-class-with-tone'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-spinner/consumer-class-with-tone', root, 'spinner root');
        if (!node.consumerClasses.includes('consumer-spinner')) fail('the case did not carry the consumer class');
        node.consumerClasses = [];
      });
    },
  },
  {
    id: 'spinner-leaks-a-product-data-attribute-onto-the-svg',
    klass: 'product data',
    description: 'the consumer data attribute lands on the svg as well as the root',
    expect: { dimensions: ['dom.productData'], caseIds: ['progress-spinner/product-data'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const svg = findNode(capture, 'progress-spinner/product-data', tagged('svg'), 'spinner artwork');
        svg.attributes = { ...svg.attributes, 'data-testid': 'export-spinner' };
      });
    },
  },

  // ------------------------------------------------------ static snapshot

  staticSnapshotMutation({
    id: 'spinner-static-snapshot-gains-a-control',
    description: 'something focusable appears inside a spinner, which has no slot for a consumer to put one in',
    caseId: 'progress-spinner/default',
    field: 'focusableCount',
    from: 0,
    to: 1,
  }),
  staticSnapshotMutation({
    id: 'spinner-static-snapshot-exposes-an-interactive-role',
    description: 'an element inside the spinner starts carrying an explicit interactive role',
    caseId: 'progress-spinner/consumer-role',
    field: 'interactiveRoleCount',
    from: 0,
    to: 1,
  }),
];

// ---------------------------------------------------------- browser mutations

/**
 * Mutations applied to the real Razor page before extraction.
 *
 * These are the ones the capture-level set cannot express: the browser's own
 * accessibility tree, the computed geometry of a circle, the resolved custom
 * property and the pixels at the final keyframe.
 */
export const progressSpinnerBrowserMutations = [
  {
    id: 'browser-spinner-becomes-a-status',
    target: 'razor',
    caseIds: ['progress-spinner/tone-danger'],
    description:
      'the real danger spinner is given role=status, so the tree exposes a status where every other target exposes a progressbar',
    expect: { dimensions: ['dom.aria', 'a11y.role'], caseIds: ['progress-spinner/tone-danger'] },
    beforeExtract: mutateElements(
      ['progress-spinner/tone-danger'],
      '.vf-progress-spinner',
      `
      if (element.getAttribute('role') !== 'progressbar') throw new Error('MUTATION_NOT_APPLIED: role');
      element.setAttribute('role', 'status');
    `,
    ),
  },
  {
    id: 'browser-spinner-loses-its-name',
    target: 'razor',
    caseIds: ['progress-spinner/default'],
    description: 'the real spinner loses its aria-label, so the tree exposes an unnamed progressbar',
    expect: { dimensions: ['dom.aria', 'a11y.name'], caseIds: ['progress-spinner/default'] },
    beforeExtract: mutateElements(
      ['progress-spinner/default'],
      '.vf-progress-spinner',
      `
      if (!element.hasAttribute('aria-label')) throw new Error('MUTATION_NOT_APPLIED: aria-label');
      element.removeAttribute('aria-label');
    `,
    ),
  },
  {
    id: 'browser-spinner-lets-its-own-role-beat-the-consumer',
    target: 'razor',
    caseIds: ['progress-spinner/consumer-role'],
    description: 'the real consumer-role spinner exposes progressbar after all',
    expect: { dimensions: ['dom.aria', 'a11y.role'], caseIds: ['progress-spinner/consumer-role'] },
    beforeExtract: mutateElements(
      ['progress-spinner/consumer-role'],
      '.vf-progress-spinner',
      `
      if (element.getAttribute('role') !== 'status') throw new Error('MUTATION_NOT_APPLIED: consumer role');
      element.setAttribute('role', 'progressbar');
    `,
    ),
  },
  {
    // The role stays; the value appears. This is what the value states added
    // to the AX snapshot in M20 exist to catch.
    id: 'browser-spinner-gains-a-value',
    target: 'razor',
    caseIds: ['progress-spinner/default'],
    description:
      'the real spinner is given aria-valuenow=0 and a range, so the tree exposes a value the reference never has',
    expect: { dimensions: ['dom.aria', 'a11y.states'], caseIds: ['progress-spinner/default'] },
    beforeExtract: mutateElements(
      ['progress-spinner/default'],
      '.vf-progress-spinner',
      `
      if (element.hasAttribute('aria-valuenow')) throw new Error('MUTATION_NOT_APPLIED: aria-valuenow');
      element.setAttribute('aria-valuenow', '0');
      element.setAttribute('aria-valuemin', '0');
      element.setAttribute('aria-valuemax', '100');
    `,
    ),
  },
  {
    id: 'browser-spinner-hides-itself',
    target: 'razor',
    caseIds: ['progress-spinner/default'],
    description: 'the real spinner is aria-hidden, so it leaves the tree entirely',
    expect: { dimensions: ['dom.aria', 'a11y.role'], caseIds: ['progress-spinner/default'] },
    beforeExtract: mutateElements(
      ['progress-spinner/default'],
      '.vf-progress-spinner',
      `
      if (element.hasAttribute('aria-hidden')) throw new Error('MUTATION_NOT_APPLIED: aria-hidden');
      element.setAttribute('aria-hidden', 'true');
    `,
    ),
  },
  {
    id: 'browser-spinner-shrinks-the-radius',
    target: 'razor',
    caseIds: ['progress-spinner/size-number'],
    description:
      'both real circles are redrawn at radius 12 - the geometry of two named nodes moves, and no class or role notices',
    expect: { dimensions: ['dom.nativeAttributes', 'style.geometry'], caseIds: ['progress-spinner/size-number'] },
    beforeExtract: mutateElements(
      ['progress-spinner/size-number'],
      '.vf-progress-spinner circle',
      `
      if (element.getAttribute('r') !== '20') throw new Error('MUTATION_NOT_APPLIED: r');
      element.setAttribute('r', '12');
    `,
    ),
  },
  {
    id: 'browser-spinner-pins-the-artwork',
    target: 'razor',
    caseIds: ['progress-spinner/size-number'],
    description:
      'the real svg is given width and height attributes, so the artwork stops filling the 40px box the property sizes',
    expect: { dimensions: ['dom.nativeAttributes', 'style.geometry'], caseIds: ['progress-spinner/size-number'] },
    beforeExtract: mutateElements(
      ['progress-spinner/size-number'],
      '.vf-progress-spinner__svg',
      `
      if (element.hasAttribute('width')) throw new Error('MUTATION_NOT_APPLIED: width');
      element.setAttribute('width', '64');
      element.setAttribute('height', '64');
      element.style.inlineSize = '64px';
      element.style.blockSize = '64px';
    `,
    ),
  },
  {
    id: 'browser-spinner-ignores-the-consumer-override',
    target: 'razor',
    caseIds: ['progress-spinner/consumer-style-overrides-size'],
    description: 'the real spinner is resized to the prop value, as if the consumer override of the property had lost',
    expect: { dimensions: ['style.geometry', 'visual'], caseIds: ['progress-spinner/consumer-style-overrides-size'] },
    beforeExtract: mutateElements(
      ['progress-spinner/consumer-style-overrides-size'],
      '.vf-progress-spinner',
      `
      if (getComputedStyle(element).width !== '16px') throw new Error('MUTATION_NOT_APPLIED: not at the consumer size');
      element.style.inlineSize = '40px';
      element.style.blockSize = '40px';
    `,
    ),
  },
  {
    id: 'browser-spinner-thickens-the-track',
    target: 'razor',
    caseIds: ['progress-spinner/default'],
    description:
      'the real track is drawn at stroke 12 under the default arc, which only the attribute and the pixels show',
    expect: { dimensions: ['dom.nativeAttributes', 'visual'], caseIds: ['progress-spinner/default'] },
    beforeExtract: mutateElements(
      ['progress-spinner/default'],
      '.vf-progress-spinner__track',
      `
      if (element.getAttribute('stroke-width') !== '4') throw new Error('MUTATION_NOT_APPLIED: stroke-width');
      element.setAttribute('stroke-width', '12');
    `,
    ),
  },
  {
    // The neutral modifier paints with the secondary icon colour, and the
    // proof that the harness measures the paint rather than the class is to
    // repaint it.
    id: 'browser-spinner-neutral-gets-repainted',
    target: 'razor',
    caseIds: ['progress-spinner/tone-neutral'],
    description: 'the real neutral spinner is given a different arc colour',
    expect: { dimensions: ['style.colour', 'visual'], caseIds: ['progress-spinner/tone-neutral'] },
    beforeExtract: mutateElements(
      ['progress-spinner/tone-neutral'],
      '.vf-progress-spinner',
      `
      element.style.color = 'rgb(214, 51, 132)';
    `,
    ),
  },
  {
    id: 'browser-spinner-grows-a-control',
    target: 'razor',
    caseIds: ['progress-spinner/default'],
    description: 'a real cancel button is appended inside the spinner - the control no case declares',
    expect: { dimensions: ['dom.structure', 'static.noInteraction'], caseIds: ['progress-spinner/default'] },
    beforeExtract: mutateElements(
      ['progress-spinner/default'],
      '.vf-progress-spinner',
      `
      if (element.querySelector('button')) throw new Error('MUTATION_NOT_APPLIED: already has a button');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'vf-progress-spinner__cancel';
      button.textContent = 'Cancel';
      element.appendChild(button);
    `,
    ),
  },
];

// ---------------------------------------------------------- policy mutations

/**
 * The approvals validation must refuse.
 *
 * The last one is the Button/Spinner approval: a single rule naming cases from
 * both components, so a difference in either would be excused by a rule
 * reviewed for the other. That is the shape a reviewer would reach for because
 * the button's spinner *is* this component, and it has to be rejected as firmly
 * as a wildcard.
 */
const push = (policy, entry) => policy.approvedDivergences.push(entry);
const smuggled = (id, dimension, caseIds, description) => ({
  id,
  description,
  rejectedBy: 'validation',
  apply(policy) {
    push(policy, {
      id,
      dimension,
      target: 'razor',
      caseIds,
      classification: 'framework-specific',
      expectedOccurrences: 4,
      directions: ['reference-vs-razor', 'current-vs-razor'],
      reason: 'smuggled',
    });
  },
});

export const progressSpinnerPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    ['progress-spinner/default'],
    'an approval for dom.structure, which must never be waivable',
  ),
  smuggled('smuggled-visual-approval', 'visual', ['progress-spinner/default'], 'an approval for rendered pixels'),
  smuggled(
    'smuggled-wildcard-case',
    'dom.aria',
    ['*'],
    'an approval that covers every case at once instead of naming them',
  ),
  smuggled(
    'smuggled-geometry-approval',
    'style.geometry',
    ['progress-spinner/size-number'],
    'an approval for style.geometry - the evidence every size form is proved on',
  ),
  smuggled(
    'smuggled-static-snapshot-approval',
    'static.noInteraction',
    ['progress-spinner/default'],
    'an approval for static.noInteraction - the only evidence that catches a control grown on all three targets',
  ),
  smuggled(
    'broad-button-spinner-approval',
    'dom.aria',
    ['progress-spinner/default', 'button/loading'],
    'one approval naming cases from both VfProgressSpinner and VfButton, so a difference in either would be excused ' +
      'by a rule reviewed for the other - the approval a reviewer reaches for because the button renders this component',
  ),
];
