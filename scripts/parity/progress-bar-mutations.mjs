// The negative fixtures for the VfProgressBar parity gate.
//
// The M21 set, and the first written for a component whose contract has two
// halves that can disagree. A bar announces a value through aria-valuenow and
// paints one through the fill's inline size, and the reference computes both
// from one resolved number - but nothing in the DOM ties them together, so a
// port can get one right and the other wrong. Three groups carry the set:
//
//   - the announced value. aria-valuenow stale, missing while determinate,
//     present while indeterminate, aria-valuemax stale under a custom
//     maximum, the floor moved, the role lost or downgraded, the component
//     beating a consumer's attribute. Each has to move dom.aria and, in the
//     browser, the tree's a11y.states - and none of them may touch the fill;
//   - the painted value. The fill's width computed with the wrong formula,
//     rounded, kept while indeterminate, lost while determinate, written on
//     the root. Each has to move the fill's style and its measured box, and
//     none of them may touch an attribute the aria comparison reads;
//   - everything else a port could get wrong that a screenshot would not
//     show: the label beside the fill instead of inside it, the label as
//     the accessible name, the spinner's block class, the badge's tone rule,
//     a control grown inside the bar.
//
// Each mutation names the dimension that must catch it, and each fails the
// harness rather than counting as a detection if it cannot find what it is
// supposed to break. Nothing here touches the source tree.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const root = (node) => node.classes.includes('vf-progress-bar');
const fill = (node) => node.classes.includes('vf-progress-bar__value');
const label = (node) => node.classes.includes('vf-progress-bar__label');

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

/** Rewrites the fill's recorded width - the declaration and the measured box together, as a real port would move them. */
function setFillWidth(caseId, declaration, boxWidth) {
  return (captures) => {
    eachTheme(captures, 'razor', (capture) => {
      const node = findNode(capture, caseId, fill, 'fill');
      if (node.attributes.style === declaration) fail(`${caseId} already carried ${declaration}`);
      node.attributes = { ...node.attributes, style: declaration };
      const measured = capture.extracted[caseId].styles.fill;
      if (!measured) fail(`${caseId} has no measured fill`);
      if (measured.boxWidth === boxWidth) fail(`${caseId} already measured ${boxWidth}`);
      measured.boxWidth = boxWidth;
      measured.width = `${boxWidth}px`;
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

const painted = (id, description, caseId, apply) => ({
  id,
  klass: 'painted value',
  description,
  expect: {
    dimensions: ['dom.nativeAttributes', 'style.geometry'],
    details: { 'dom.nativeAttributes': ['style'] },
    caseIds: [caseId],
  },
  apply,
});

export const progressBarParityMutations = [
  // ------------------------------------------------------ the announced value

  aria(
    'bar-announces-a-stale-value',
    'aria-valuenow says 40 on a bar painted at 50% - the paint is right, the announcement is not',
    'progress-bar/middle',
    'aria-valuenow',
    setAttribute('progress-bar/middle', root, 'bar root', 'aria-valuenow', '40'),
  ),
  aria(
    'bar-drops-aria-valuenow-while-determinate',
    'a determinate bar stops writing aria-valuenow, so the tree announces a progressbar with no value',
    'progress-bar/middle',
    'aria-valuenow',
    dropAttribute('progress-bar/middle', root, 'bar root', 'aria-valuenow'),
  ),
  aria(
    'bar-writes-aria-valuenow-while-indeterminate',
    'an indeterminate bar gains aria-valuenow=0 and a range - the ARIA-recommended shape the reference does not have',
    'progress-bar/indeterminate',
    'aria-valuenow',
    (captures) => {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-bar/indeterminate', root, 'bar root');
        if ('aria-valuenow' in node.attributes) fail('the indeterminate bar already carried a value');
        node.attributes = { ...node.attributes, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' };
      });
    },
  ),
  aria(
    'bar-announces-a-stale-maximum',
    'aria-valuemax stays 100 under a custom maximum of 12, so 7 is announced as 7 of 100 while it paints 7 of 12',
    'progress-bar/custom-max',
    'aria-valuemax',
    setAttribute('progress-bar/custom-max', root, 'bar root', 'aria-valuemax', '100'),
  ),
  aria(
    'bar-drops-aria-valuemax',
    'aria-valuemax stops being written, leaving the maximum to the browser default',
    'progress-bar/custom-max',
    'aria-valuemax',
    dropAttribute('progress-bar/custom-max', root, 'bar root', 'aria-valuemax'),
  ),
  aria(
    'bar-drops-aria-valuemin',
    'aria-valuemin stops being written',
    'progress-bar/default',
    'aria-valuemin',
    dropAttribute('progress-bar/default', root, 'bar root', 'aria-valuemin'),
  ),
  aria(
    'bar-raises-the-floor',
    'aria-valuemin becomes 1',
    'progress-bar/default',
    'aria-valuemin',
    setAttribute('progress-bar/default', root, 'bar root', 'aria-valuemin', '1'),
  ),
  aria(
    'bar-rounds-the-announced-value',
    'aria-valuenow is rounded to 33 while the fill stays at 33.3333%',
    'progress-bar/fractional-value',
    'aria-valuenow',
    setAttribute('progress-bar/fractional-value', root, 'bar root', 'aria-valuenow', '33'),
  ),
  aria(
    'bar-announces-with-php-precision',
    "aria-valuenow is written as PHP's default float cast would write it - fourteen digits and 1.0E-7",
    'progress-bar/tiny-value',
    'aria-valuenow',
    setAttribute('progress-bar/tiny-value', root, 'bar root', 'aria-valuenow', '1.0E-7'),
  ),
  aria(
    'bar-treats-zero-as-absent',
    'aria-valuenow=0 is dropped as falsy, so an empty bar announces no value',
    'progress-bar/zero',
    'aria-valuenow',
    dropAttribute('progress-bar/zero', root, 'bar root', 'aria-valuenow'),
  ),
  aria(
    'bar-loses-its-role',
    'the root stops being a progressbar, so the value is announced by nothing',
    'progress-bar/default',
    'role',
    dropAttribute('progress-bar/default', root, 'bar root', 'role'),
  ),
  aria(
    'bar-becomes-a-status',
    'the root exposes role=status',
    'progress-bar/tone-danger',
    'role',
    setAttribute('progress-bar/tone-danger', root, 'bar root', 'role', 'status'),
  ),
  aria(
    'bar-loses-its-name',
    'aria-label leaves the root, so the progressbar is unnamed',
    'progress-bar/default',
    'aria-label',
    dropAttribute('progress-bar/default', root, 'bar root', 'aria-label'),
  ),
  aria(
    'bar-drops-an-empty-name',
    'an empty label prop is dropped rather than written empty',
    'progress-bar/label-empty',
    'aria-label',
    dropAttribute('progress-bar/label-empty', root, 'bar root', 'aria-label'),
  ),
  aria(
    'bar-label-becomes-the-name',
    'the visible percentage is written as aria-label, replacing the label prop',
    'progress-bar/show-value-custom-name',
    'aria-label',
    setAttribute('progress-bar/show-value-custom-name', root, 'bar root', 'aria-label', '50%'),
  ),
  aria(
    'bar-writes-aria-valuetext',
    'the visible percentage is also written as aria-valuetext, which changes how the value is announced',
    'progress-bar/show-value',
    'aria-valuetext',
    setAttribute('progress-bar/show-value', root, 'bar root', 'aria-valuetext', '50%'),
  ),
  aria(
    'bar-lets-its-own-value-beat-the-consumer',
    'the component aria-valuenow is written after the forwarded attrs, so a consumer aria-valuenow loses',
    'progress-bar/consumer-valuenow',
    'aria-valuenow',
    (captures) => {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-bar/consumer-valuenow', root, 'bar root');
        if (node.attributes['aria-valuenow'] !== '40') fail('the case did not carry the consumer value');
        node.attributes = { ...node.attributes, 'aria-valuenow': '50' };
      });
    },
  ),
  aria(
    'bar-lets-its-own-role-beat-the-consumer',
    'the component role is written after the forwarded attrs, so a consumer role=status loses',
    'progress-bar/consumer-role',
    'role',
    (captures) => {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-bar/consumer-role', root, 'bar root');
        if (node.attributes.role !== 'status') fail('the case did not carry the consumer role');
        node.attributes = { ...node.attributes, role: 'progressbar' };
      });
    },
  ),
  aria(
    'bar-drops-the-consumer-valuetext',
    'a consumer aria-valuetext is filtered out rather than forwarded',
    'progress-bar/consumer-valuetext',
    'aria-valuetext',
    dropAttribute('progress-bar/consumer-valuetext', root, 'bar root', 'aria-valuetext'),
  ),
  aria(
    'bar-strips-the-consumer-value-while-indeterminate',
    'a consumer aria-valuenow on an indeterminate bar is stripped rather than forwarded',
    'progress-bar/consumer-valuenow-indeterminate',
    'aria-valuenow',
    dropAttribute('progress-bar/consumer-valuenow-indeterminate', root, 'bar root', 'aria-valuenow'),
  ),
  {
    id: 'bar-drops-the-consumer-labelledby',
    klass: 'relationships',
    description: 'a consumer aria-labelledby is filtered out, so the heading no longer names the bar',
    expect: {
      dimensions: ['dom.relationships'],
      details: { 'dom.relationships': ['aria-labelledby'] },
      caseIds: ['progress-bar/consumer-aria-labelledby'],
    },
    apply: dropAttribute('progress-bar/consumer-aria-labelledby', root, 'bar root', 'aria-labelledby'),
  },

  // -------------------------------------------------------- the painted value

  painted(
    'bar-paints-a-stale-width',
    'the fill is painted at 40% on a bar announcing 50 - the announcement is right, the paint is not',
    'progress-bar/middle',
    setFillWidth('progress-bar/middle', 'inline-size:40%', 144),
  ),
  painted(
    'bar-paints-with-the-wrong-formula',
    'the width ignores the maximum, so 7 of 12 paints as 7% while aria-valuemax=12 and aria-valuenow=7 stay right',
    'progress-bar/custom-max',
    setFillWidth('progress-bar/custom-max', 'inline-size:7%', 25),
  ),
  painted(
    'bar-rounds-the-width',
    'the width is rounded to 58% while the announced value and maximum stay unrounded',
    'progress-bar/custom-max',
    setFillWidth('progress-bar/custom-max', 'inline-size:58%', 209),
  ),
  painted(
    'bar-loses-the-fill-width-while-determinate',
    'a determinate fill carries no inline size, so every bar paints empty while announcing its value',
    'progress-bar/full',
    (captures) => {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-bar/full', fill, 'fill');
        if (!('style' in node.attributes)) fail('the fill did not carry a style');
        const { style, ...rest } = node.attributes;
        void style;
        node.attributes = rest;
        capture.extracted['progress-bar/full'].styles.fill.boxWidth = 0;
        capture.extracted['progress-bar/full'].styles.fill.width = '0px';
      });
    },
  ),
  painted(
    'bar-keeps-the-fill-width-while-indeterminate',
    'the indeterminate fill keeps an inline size of 40%, so the stylesheet sweep runs inside a clamped box',
    'progress-bar/indeterminate-with-value',
    setFillWidth('progress-bar/indeterminate-with-value', 'inline-size:40%', 144),
  ),
  painted(
    'bar-does-not-clamp-the-overflow',
    'a value above the maximum paints at 150% and the announced value stays clamped at 100',
    'progress-bar/overflow',
    setFillWidth('progress-bar/overflow', 'inline-size:150%', 540),
  ),
  {
    // The declaration alone: the stylesheet's own inline-size: 0% leaves the
    // box where it was, so this is the one painted-value mutation geometry
    // cannot see and the attribute comparison must.
    id: 'bar-paints-zero-as-nothing',
    klass: 'painted value',
    description: 'the fill at zero carries no declaration at all instead of inline-size 0%',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: ['progress-bar/zero'],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-bar/zero', fill, 'fill');
        if (!('style' in node.attributes)) fail('the zero fill did not carry a style');
        const { style, ...rest } = node.attributes;
        void style;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'bar-writes-the-width-onto-the-root',
    klass: 'painted value',
    description: 'the inline size is written on the root as well as the fill, so the track itself shrinks',
    expect: {
      dimensions: ['dom.nativeAttributes', 'style.geometry'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: ['progress-bar/middle'],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-bar/middle', root, 'bar root');
        if ('style' in node.attributes) fail('the root already carried a style');
        node.attributes = { ...node.attributes, style: 'inline-size:50%' };
        capture.extracted['progress-bar/middle'].styles.root.boxWidth = 180;
        capture.extracted['progress-bar/middle'].styles.fill.boxWidth = 90;
      });
    },
  },
  {
    id: 'bar-writes-the-height-as-block-size',
    klass: 'native attributes',
    description:
      'the height is written as a block-size declaration rather than the custom property the stylesheet reads',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: ['progress-bar/height-number'],
    },
    apply: setAttribute('progress-bar/height-number', root, 'bar root', 'style', 'block-size:12px'),
  },
  {
    id: 'bar-lets-the-prop-beat-the-consumer-height',
    klass: 'native attributes',
    description: "the component's height declaration is written after the consumer's, so the consumer override loses",
    expect: {
      dimensions: ['dom.nativeAttributes', 'style.geometry'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: ['progress-bar/consumer-style-overrides-height'],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-bar/consumer-style-overrides-height', root, 'bar root');
        node.attributes = { ...node.attributes, style: '--vf-progress-bar-height:12px' };
        const styles = capture.extracted['progress-bar/consumer-style-overrides-height'].styles;
        if (styles.root.boxHeight !== 4) fail('the case did not measure the consumer height');
        styles.root.boxHeight = 12;
        styles.fill.boxHeight = 12;
      });
    },
  },

  // ---------------------------------------------------------------- the label

  {
    id: 'bar-moves-the-label-out-of-the-fill',
    klass: 'structure',
    description: 'the label is rendered beside the fill rather than inside it',
    expect: { dimensions: ['dom.structure'], caseIds: ['progress-bar/show-value'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const bar = findNode(capture, 'progress-bar/show-value', root, 'bar root');
        const fillNode = findNode(capture, 'progress-bar/show-value', fill, 'fill');
        const labelNode = findNode(capture, 'progress-bar/show-value', label, 'label');
        fillNode.children = fillNode.children.filter((child) => child !== labelNode);
        bar.children = [...bar.children, labelNode];
      });
    },
  },
  {
    id: 'bar-loses-the-label',
    klass: 'structure',
    description: 'showValue renders no label element',
    expect: { dimensions: ['dom.structure'], caseIds: ['progress-bar/show-value-rounds'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const fillNode = findNode(capture, 'progress-bar/show-value-rounds', fill, 'fill');
        if (fillNode.children.length !== 1) fail('the fill did not hold the label');
        fillNode.children = [];
      });
    },
  },
  {
    id: 'bar-renders-the-label-without-show-value',
    klass: 'structure',
    description: 'the label is rendered on a bar that did not ask for it',
    expect: { dimensions: ['dom.structure'], caseIds: ['progress-bar/middle'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const fillNode = findNode(capture, 'progress-bar/middle', fill, 'fill');
        if (fillNode.children.length !== 0) fail('the fill already held something');
        fillNode.children = [
          {
            tag: 'span',
            classes: ['vf-progress-bar__label'],
            consumerClasses: [],
            attributes: {},
            children: [],
            text: '50%',
          },
        ];
      });
    },
  },
  {
    id: 'bar-floors-the-label',
    klass: 'text',
    description: 'the label reads 12% where the reference rounds 12.5 up to 13%',
    expect: { dimensions: ['dom.text'], caseIds: ['progress-bar/show-value-rounds'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const labelNode = findNode(capture, 'progress-bar/show-value-rounds', label, 'label');
        if (labelNode.text !== '13%') fail(`the label read ${labelNode.text}`);
        labelNode.text = '12%';
      });
    },
  },
  {
    id: 'bar-label-reads-the-unrounded-ratio',
    klass: 'text',
    description: 'the label reads the raw percentage instead of the rounded one',
    expect: { dimensions: ['dom.text'], caseIds: ['progress-bar/show-value-rounds'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, 'progress-bar/show-value-rounds', label, 'label').text = '12.5%';
      });
    },
  },

  // ------------------------------------------------------------- the classes

  {
    id: 'bar-drops-the-indeterminate-modifier',
    klass: 'canonical classes',
    description: 'the indeterminate modifier stops reaching the class list, so the sweep never runs',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['progress-bar/indeterminate'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-bar/indeterminate', root, 'bar root');
        if (!node.classes.includes('vf-progress-bar--indeterminate')) fail('the case did not carry the modifier');
        node.classes = node.classes.filter((name) => name !== 'vf-progress-bar--indeterminate');
      });
    },
  },
  {
    id: 'bar-suppresses-neutral-instead-of-primary',
    klass: 'canonical classes',
    description: 'the tone rule is borrowed from VfBadge, so neutral emits no modifier',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['progress-bar/tone-neutral'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-bar/tone-neutral', root, 'bar root');
        if (!node.classes.includes('vf-progress-bar--neutral')) fail('the case did not carry the neutral modifier');
        node.classes = node.classes.filter((name) => name !== 'vf-progress-bar--neutral');
      });
    },
  },
  {
    id: 'bar-animates-without-stripes',
    klass: 'canonical classes',
    description: 'animated emits its modifier without striped',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['progress-bar/animated-only'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-bar/animated-only', root, 'bar root');
        if (node.classes.includes('vf-progress-bar--animated')) fail('the case already carried the modifier');
        node.classes = [...node.classes, 'vf-progress-bar--animated'].sort();
      });
    },
  },
  {
    id: 'bar-gains-the-spinner-class',
    klass: 'canonical classes',
    description:
      "the spinner's block class is emitted beside the bar's - the coupling a shared progress helper would leak",
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['progress-bar/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-bar/default', root, 'bar root');
        node.classes = [...node.classes, 'vf-progress-spinner'].sort();
      });
    },
  },
  {
    id: 'bar-loses-the-fill-class',
    klass: 'canonical classes',
    description: 'the fill loses the class every stylesheet rule about it is keyed on',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['progress-bar/middle'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, 'progress-bar/middle', fill, 'fill').classes = [];
      });
    },
  },
  {
    id: 'bar-loses-the-consumer-class',
    klass: 'canonical classes',
    description: 'the consumer class stops reaching the root',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['progress-bar/consumer-class-with-modifiers'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-bar/consumer-class-with-modifiers', root, 'bar root');
        if (!node.consumerClasses.includes('consumer-bar')) fail('the case did not carry the consumer class');
        node.consumerClasses = [];
      });
    },
  },
  {
    id: 'bar-leaks-a-product-data-attribute-onto-the-fill',
    klass: 'product data',
    description: 'the consumer data attribute lands on the fill as well as the root',
    expect: { dimensions: ['dom.productData'], caseIds: ['progress-bar/product-data'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-bar/product-data', fill, 'fill');
        node.attributes = { ...node.attributes, 'data-testid': 'export-bar' };
      });
    },
  },

  // ------------------------------------------------------------ the structure

  {
    id: 'bar-root-becomes-a-section',
    klass: 'structure',
    description: 'the div root becomes a section, which looks identical and is a different element',
    expect: { dimensions: ['dom.structure'], caseIds: ['progress-bar/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, 'progress-bar/default', root, 'bar root').tag = 'section';
      });
    },
  },
  {
    id: 'bar-grows-a-control',
    klass: 'structure',
    description: 'a component-owned cancel button appears inside the bar, which no case declares and no target renders',
    expect: { dimensions: ['dom.structure', 'static.noInteraction'], caseIds: ['progress-bar/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'progress-bar/default', root, 'bar root');
        node.children = [
          ...node.children,
          {
            tag: 'button',
            classes: ['vf-progress-bar__cancel'],
            consumerClasses: [],
            attributes: { type: 'button' },
            children: [],
          },
        ];
        const snapshot = capture.interactions['progress-bar/default'];
        if (snapshot?.focusableCount !== 0) fail('the case did not record zero focusable elements');
        snapshot.focusableCount = 1;
      });
    },
  },

  // -------------------------------------------------------- static snapshot

  staticSnapshotMutation({
    id: 'bar-static-snapshot-gains-a-control',
    description: 'something focusable appears inside a bar, which has no slot for a consumer to put one in',
    caseId: 'progress-bar/default',
    field: 'focusableCount',
    from: 0,
    to: 1,
  }),
  staticSnapshotMutation({
    id: 'bar-static-snapshot-exposes-an-interactive-role',
    description: 'an element inside the bar starts carrying an explicit interactive role',
    caseId: 'progress-bar/consumer-role',
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
 * accessibility tree deriving a value from an attribute, and the real
 * computed width of a real fill. The first five are the milestone's
 * aria-versus-visual attacks, A to E, run against a real page: each moves
 * exactly one of the two halves and must be caught by that half's evidence.
 */
export const progressBarBrowserMutations = [
  {
    // A. visual says 50%, aria-valuenow says 40.
    id: 'browser-bar-announces-40-while-painting-50',
    target: 'razor',
    caseIds: ['progress-bar/middle'],
    description:
      'the real bar keeps its 50% fill and announces 40, so the tree exposes a value the paint does not show',
    expect: { dimensions: ['dom.aria', 'a11y.states'], caseIds: ['progress-bar/middle'] },
    beforeExtract: mutateElements(
      ['progress-bar/middle'],
      '.vf-progress-bar',
      `
      if (element.getAttribute('aria-valuenow') !== '50') throw new Error('MUTATION_NOT_APPLIED: aria-valuenow');
      element.setAttribute('aria-valuenow', '40');
    `,
    ),
  },
  {
    // B. visual says 40%, aria-valuenow says 50.
    id: 'browser-bar-paints-40-while-announcing-50',
    target: 'razor',
    caseIds: ['progress-bar/middle'],
    description:
      'the real fill is resized to 40% under an unchanged aria-valuenow=50 - caught by the fill box, not a screenshot',
    expect: { dimensions: ['dom.nativeAttributes', 'style.geometry'], caseIds: ['progress-bar/middle'] },
    beforeExtract: mutateElements(
      ['progress-bar/middle'],
      '.vf-progress-bar__value',
      `
      if (getComputedStyle(element).width !== '180px') throw new Error('MUTATION_NOT_APPLIED: not at 50%');
      element.style.inlineSize = '40%';
    `,
    ),
  },
  {
    // C. max changes visually, aria-valuemax stale.
    id: 'browser-bar-announces-a-stale-maximum',
    target: 'razor',
    caseIds: ['progress-bar/custom-max'],
    description: 'the real bar paints 7 of 12 and announces a maximum of 100, so the tree exposes 7 of 100',
    expect: { dimensions: ['dom.aria', 'a11y.states'], caseIds: ['progress-bar/custom-max'] },
    beforeExtract: mutateElements(
      ['progress-bar/custom-max'],
      '.vf-progress-bar',
      `
      if (element.getAttribute('aria-valuemax') !== '12') throw new Error('MUTATION_NOT_APPLIED: aria-valuemax');
      element.setAttribute('aria-valuemax', '100');
    `,
    ),
  },
  {
    // D. aria-valuenow omitted in determinate state.
    id: 'browser-bar-omits-aria-valuenow-while-determinate',
    target: 'razor',
    caseIds: ['progress-bar/full'],
    description:
      'the real full bar loses aria-valuenow, so the tree exposes a progressbar with no value under a full fill',
    expect: { dimensions: ['dom.aria', 'a11y.states'], caseIds: ['progress-bar/full'] },
    beforeExtract: mutateElements(
      ['progress-bar/full'],
      '.vf-progress-bar',
      `
      if (!element.hasAttribute('aria-valuenow')) throw new Error('MUTATION_NOT_APPLIED: aria-valuenow');
      element.removeAttribute('aria-valuenow');
    `,
    ),
  },
  {
    // E. aria-valuenow added in indeterminate state.
    id: 'browser-bar-gains-a-value-while-indeterminate',
    target: 'razor',
    caseIds: ['progress-bar/indeterminate'],
    description:
      'the real indeterminate bar is given aria-valuenow=0, so the tree exposes a value the reference never has',
    expect: { dimensions: ['dom.aria', 'a11y.states'], caseIds: ['progress-bar/indeterminate'] },
    beforeExtract: mutateElements(
      ['progress-bar/indeterminate'],
      '.vf-progress-bar',
      `
      if (element.hasAttribute('aria-valuenow')) throw new Error('MUTATION_NOT_APPLIED: aria-valuenow');
      element.setAttribute('aria-valuenow', '0');
    `,
    ),
  },
  {
    // Zero versus absent, in the tree: the M20 hardening exercised at the
    // value the bar actually writes.
    id: 'browser-bar-treats-zero-as-absent',
    target: 'razor',
    caseIds: ['progress-bar/zero'],
    description:
      'the real zero bar loses aria-valuenow=0, so the tree exposes no value where every other target exposes 0',
    expect: { dimensions: ['dom.aria', 'a11y.states'], caseIds: ['progress-bar/zero'] },
    beforeExtract: mutateElements(
      ['progress-bar/zero'],
      '.vf-progress-bar',
      `
      if (element.getAttribute('aria-valuenow') !== '0') throw new Error('MUTATION_NOT_APPLIED: aria-valuenow');
      element.removeAttribute('aria-valuenow');
    `,
    ),
  },
  {
    id: 'browser-bar-raises-the-floor',
    target: 'razor',
    caseIds: ['progress-bar/middle'],
    description: 'the real bar announces aria-valuemin=10, so the tree exposes a different range',
    expect: { dimensions: ['dom.aria', 'a11y.states'], caseIds: ['progress-bar/middle'] },
    beforeExtract: mutateElements(
      ['progress-bar/middle'],
      '.vf-progress-bar',
      `
      if (element.getAttribute('aria-valuemin') !== '0') throw new Error('MUTATION_NOT_APPLIED: aria-valuemin');
      element.setAttribute('aria-valuemin', '10');
    `,
    ),
  },
  {
    id: 'browser-bar-paints-with-the-wrong-formula',
    target: 'razor',
    caseIds: ['progress-bar/custom-max'],
    description:
      'the real fill of 7 of 12 is resized to 7%, as a formula that ignored the maximum would - geometry only',
    expect: { dimensions: ['dom.nativeAttributes', 'style.geometry', 'visual'], caseIds: ['progress-bar/custom-max'] },
    beforeExtract: mutateElements(
      ['progress-bar/custom-max'],
      '.vf-progress-bar__value',
      `
      if (getComputedStyle(element).width !== '210px') throw new Error('MUTATION_NOT_APPLIED: not at 7 of 12');
      element.style.inlineSize = '7%';
    `,
    ),
  },
  {
    // Geometry alone: the declaration text is left as the target wrote it
    // and only the resolved box moves, which is the one mutation nothing but
    // the measured fill can see. A screenshot is deliberately not required.
    id: 'browser-bar-shrinks-the-fill-box-only',
    target: 'razor',
    caseIds: ['progress-bar/full'],
    description:
      'the real full fill is boxed to half the track through a max-inline-size the extractor does not read, so only the measured box moves',
    expect: { dimensions: ['style.geometry'], caseIds: ['progress-bar/full'] },
    beforeExtract: mutateElements(
      ['progress-bar/full'],
      '.vf-progress-bar__value',
      `
      if (getComputedStyle(element).width !== '360px') throw new Error('MUTATION_NOT_APPLIED: not full');
      const sheet = document.createElement('style');
      sheet.textContent = '[data-parity-case="progress-bar/full"] .vf-progress-bar__value { max-inline-size: 50%; }';
      document.head.appendChild(sheet);
      if (getComputedStyle(element).width !== '180px') throw new Error('MUTATION_NOT_APPLIED: still full');
    `,
    ),
  },
  {
    id: 'browser-bar-keeps-the-fill-width-while-indeterminate',
    target: 'razor',
    caseIds: ['progress-bar/indeterminate-with-value'],
    description: 'the real indeterminate fill is given inline-size 50%, so the sweep runs inside a clamped box',
    expect: {
      dimensions: ['dom.nativeAttributes', 'style.geometry'],
      caseIds: ['progress-bar/indeterminate-with-value'],
    },
    beforeExtract: mutateElements(
      ['progress-bar/indeterminate-with-value'],
      '.vf-progress-bar__value',
      `
      if (element.hasAttribute('style')) throw new Error('MUTATION_NOT_APPLIED: already sized');
      element.style.inlineSize = '50%';
    `,
    ),
  },
  {
    id: 'browser-bar-becomes-a-status',
    target: 'razor',
    caseIds: ['progress-bar/tone-danger'],
    description:
      'the real danger bar is given role=status, so the tree exposes a status where every other target exposes a progressbar',
    expect: { dimensions: ['dom.aria', 'a11y.role', 'a11y.states'], caseIds: ['progress-bar/tone-danger'] },
    beforeExtract: mutateElements(
      ['progress-bar/tone-danger'],
      '.vf-progress-bar',
      `
      if (element.getAttribute('role') !== 'progressbar') throw new Error('MUTATION_NOT_APPLIED: role');
      element.setAttribute('role', 'status');
    `,
    ),
  },
  {
    id: 'browser-bar-label-becomes-the-name',
    target: 'razor',
    caseIds: ['progress-bar/show-value-custom-name'],
    description:
      'the real bar is renamed to its visible percentage, so the tree exposes 50% where every other target exposes Upload',
    expect: { dimensions: ['dom.aria', 'a11y.name'], caseIds: ['progress-bar/show-value-custom-name'] },
    beforeExtract: mutateElements(
      ['progress-bar/show-value-custom-name'],
      '.vf-progress-bar',
      `
      if (element.getAttribute('aria-label') !== 'Upload') throw new Error('MUTATION_NOT_APPLIED: aria-label');
      element.setAttribute('aria-label', '50%');
    `,
    ),
  },
  {
    id: 'browser-bar-drops-the-consumer-labelledby',
    target: 'razor',
    caseIds: ['progress-bar/consumer-aria-labelledby'],
    description:
      'the real bar loses its aria-labelledby, so the tree names it Progress where every other target names it from the heading',
    expect: { dimensions: ['dom.relationships', 'a11y.name'], caseIds: ['progress-bar/consumer-aria-labelledby'] },
    beforeExtract: mutateElements(
      ['progress-bar/consumer-aria-labelledby'],
      '.vf-progress-bar',
      `
      if (!element.hasAttribute('aria-labelledby')) throw new Error('MUTATION_NOT_APPLIED: aria-labelledby');
      element.removeAttribute('aria-labelledby');
    `,
    ),
  },
  {
    id: 'browser-bar-lets-its-own-value-beat-the-consumer',
    target: 'razor',
    caseIds: ['progress-bar/consumer-valuenow'],
    description:
      'the real consumer-valuenow bar announces the prop after all, so the tree exposes 50 where every other target exposes 40',
    expect: { dimensions: ['dom.aria', 'a11y.states'], caseIds: ['progress-bar/consumer-valuenow'] },
    beforeExtract: mutateElements(
      ['progress-bar/consumer-valuenow'],
      '.vf-progress-bar',
      `
      if (element.getAttribute('aria-valuenow') !== '40') throw new Error('MUTATION_NOT_APPLIED: consumer value');
      element.setAttribute('aria-valuenow', '50');
    `,
    ),
  },
  {
    id: 'browser-bar-moves-the-label-out-of-the-fill',
    target: 'razor',
    caseIds: ['progress-bar/show-value'],
    description: 'the real label is moved beside the fill, which the structure sees and the tree does not',
    expect: { dimensions: ['dom.structure', 'visual'], caseIds: ['progress-bar/show-value'] },
    beforeExtract: mutateElements(
      ['progress-bar/show-value'],
      '.vf-progress-bar',
      `
      const label = element.querySelector('.vf-progress-bar__label');
      if (!label) throw new Error('MUTATION_NOT_APPLIED: no label');
      element.appendChild(label);
    `,
    ),
  },
  {
    id: 'browser-bar-neutral-gets-repainted',
    target: 'razor',
    caseIds: ['progress-bar/tone-neutral'],
    description: 'the real neutral fill is given a different colour',
    expect: { dimensions: ['style.colour', 'visual'], caseIds: ['progress-bar/tone-neutral'] },
    beforeExtract: mutateElements(
      ['progress-bar/tone-neutral'],
      '.vf-progress-bar__value',
      `
      element.style.backgroundColor = 'rgb(214, 51, 132)';
    `,
    ),
  },
  {
    id: 'browser-bar-grows-a-control',
    target: 'razor',
    caseIds: ['progress-bar/default'],
    description: 'a real cancel button is appended inside the bar - the control no case declares',
    expect: { dimensions: ['dom.structure', 'static.noInteraction'], caseIds: ['progress-bar/default'] },
    beforeExtract: mutateElements(
      ['progress-bar/default'],
      '.vf-progress-bar',
      `
      if (element.querySelector('button')) throw new Error('MUTATION_NOT_APPLIED: already has a button');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'vf-progress-bar__cancel';
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
 * Two are this milestone's: an approval for dom.aria on the consumer-valuenow
 * case and one for style.geometry on the middle case, which are the two
 * halves of the announced-versus-painted proof and must not be waivable
 * separately; and one naming cases from both the bar and the spinner, so a
 * difference in either would be excused by a rule reviewed for the other.
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

export const progressBarPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    ['progress-bar/default'],
    'an approval for dom.structure, which must never be waivable',
  ),
  smuggled('smuggled-visual-approval', 'visual', ['progress-bar/default'], 'an approval for rendered pixels'),
  smuggled(
    'smuggled-wildcard-case',
    'dom.aria',
    ['*'],
    'an approval that covers every case at once instead of naming them',
  ),
  smuggled(
    'smuggled-aria-value-approval',
    'dom.aria',
    ['progress-bar/consumer-valuenow'],
    'an approval for dom.aria on the case where the announced and the painted values differ by design - the one that would let a stale aria-valuenow through',
  ),
  smuggled(
    'smuggled-geometry-approval',
    'style.geometry',
    ['progress-bar/middle'],
    'an approval for style.geometry - the evidence the painted value is proved on',
  ),
  smuggled(
    'smuggled-a11y-states-approval',
    'a11y.states',
    ['progress-bar/custom-max'],
    'an approval for a11y.states, the tree-derived value under a custom maximum',
  ),
  smuggled(
    'smuggled-static-snapshot-approval',
    'static.noInteraction',
    ['progress-bar/default'],
    'an approval for static.noInteraction - the only evidence that catches a control grown on all three targets',
  ),
  smuggled(
    'broad-bar-spinner-approval',
    'dom.aria',
    ['progress-bar/default', 'progress-spinner/default'],
    'one approval naming cases from both VfProgressBar and VfProgressSpinner, so a difference in either would be excused ' +
      'by a rule reviewed for the other - the approval a reviewer reaches for because both are progressbars',
  ),
];
