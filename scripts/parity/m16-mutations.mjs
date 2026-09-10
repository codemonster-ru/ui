// The negative fixtures for the three M16 parity gates.
//
// Three independent sets in one file, sharing helpers and nothing else. That is
// the batch's whole claim: three components migrated together, each still
// auditable on its own. A mutation aimed at one must fail that one's gate and
// leave the other two alone, which the batch isolation attacks then verify.
//
// The mutations that matter here are the ones that still render something
// plausible:
//
//   - a skeleton that lost vf-skeleton--animated is still a grey box, and a
//     static screenshot of it is indistinguishable from an animated one caught
//     mid-frame;
//   - an avatar whose fallback chain puts the icon before the label still shows
//     an avatar for every input anyone tries;
//   - a card whose header wrapper gained vf-card__header looks identical and
//     selects differently;
//   - a card that lost the empty body wrapper looks identical until the column
//     gap it was holding open disappears.
//
// The set that matters most is the last group in each: an approval broad enough
// to span the batch, which validation must reject three separate times.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const root = (block) => (node) => node.classes.includes(`vf-${block}`);
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
        if (snapshot === undefined) {
          fail(`${caseId} has no static snapshot; the stage did not run at all`);
        }
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

// ---------------------------------------------------------------- VfSkeleton

export const skeletonParityMutations = [
  {
    id: 'skeleton-drops-the-animation-modifier',
    klass: 'canonical classes',
    description: 'the skeleton stops shimmering, which no still screenshot can tell from one caught mid-frame',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['skeleton/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'skeleton/default', root('skeleton'), 'skeleton root');
        if (!node.classes.includes('vf-skeleton--animated')) fail('the default case did not carry the modifier');
        node.classes = node.classes.filter((name) => name !== 'vf-skeleton--animated');
      });
    },
  },
  {
    id: 'skeleton-animates-unconditionally',
    klass: 'canonical classes',
    description: 'animated=false stops being honoured, so a deliberately still placeholder shimmers',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['skeleton/static'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'skeleton/static', root('skeleton'), 'skeleton root');
        if (node.classes.includes('vf-skeleton--animated')) fail('the static case already carried the modifier');
        node.classes = [...node.classes, 'vf-skeleton--animated'].sort();
      });
    },
  },
  {
    id: 'skeleton-loses-the-consumer-class',
    klass: 'canonical classes',
    description: 'a consumer class stops reaching the root',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['skeleton/consumer-class'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'skeleton/consumer-class', root('skeleton'), 'skeleton root');
        if (!node.consumerClasses.includes('consumer-skeleton')) fail('the consumer class was not there');
        node.consumerClasses = node.consumerClasses.filter((name) => name !== 'consumer-skeleton');
      });
    },
  },
  {
    id: 'skeleton-normalises-the-empty-radius',
    klass: 'native attributes',
    description: 'an empty radius is "cleaned up" into border-radius:0, which the quirk says must not happen',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: ['skeleton/radius-empty'],
    },
    apply: setAttribute('skeleton/radius-empty', root('skeleton'), 'skeleton root', 'style', 'border-radius:0px'),
  },
  {
    id: 'skeleton-drops-the-min-height',
    klass: 'native attributes',
    description: 'the min-height declaration disappears, so the placeholder reserves no space',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: ['skeleton/min-height-number'],
    },
    apply: setAttribute(
      'skeleton/min-height-number',
      root('skeleton'),
      'skeleton root',
      'style',
      'border-radius:var(--vf-radius-surface)',
    ),
  },
  {
    id: 'skeleton-stops-hiding-itself',
    klass: 'aria',
    description: 'aria-hidden is dropped, so a screen reader starts reading out a loading placeholder',
    expect: {
      dimensions: ['dom.aria'],
      details: { 'dom.aria': ['aria-hidden'] },
      caseIds: ['skeleton/default'],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'skeleton/default', root('skeleton'), 'skeleton root');
        if (node.attributes['aria-hidden'] !== 'true') fail('the case was not aria-hidden to begin with');
        const { 'aria-hidden': removed, ...rest } = node.attributes;
        void removed;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'skeleton-refuses-the-aria-hidden-override',
    klass: 'aria',
    description: 'the consumer aria-hidden override is sanitised away, which is a silent API removal',
    expect: {
      dimensions: ['dom.aria'],
      details: { 'dom.aria': ['aria-hidden'] },
      caseIds: ['skeleton/aria-hidden-override'],
    },
    apply: setAttribute('skeleton/aria-hidden-override', root('skeleton'), 'skeleton root', 'aria-hidden', 'true'),
  },
  staticSnapshotMutation({
    id: 'skeleton-static-snapshot-reports-a-focusable',
    description: 'the skeleton reports a focusable element, which for a component with no children cannot be real',
    caseId: 'skeleton/default',
    field: 'focusableCount',
    from: 0,
    to: 1,
  }),
  staticSnapshotMutation({
    id: 'skeleton-static-snapshot-stops-declaring-its-posture',
    description: 'the snapshot stops declaring that there was nothing to drive',
    caseId: 'skeleton/default',
    field: 'interactionPosture',
    from: 'none',
    to: 'driven',
  }),
];

// ------------------------------------------------------------------ VfAvatar

export const avatarParityMutations = [
  {
    id: 'avatar-renders-the-icon-instead-of-the-label',
    klass: 'structure',
    description: 'the fallback chain is reordered so the icon beats the label - the pair most easily reversed',
    expect: { dimensions: ['dom.structure'], caseIds: ['avatar/label-beats-icon'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'avatar/label-beats-icon', root('avatar'), 'avatar root');
        const label = node.children.find((child) => child.classes.includes('vf-avatar__label'));
        if (!label) fail('the case was not rendering the label branch');
        node.children = [
          {
            tag: 'span',
            classes: ['vf-icon-wrapper'],
            consumerClasses: [],
            attributes: {},
            children: [
              {
                tag: 'svg',
                classes: ['vf-avatar__icon', 'vf-icon'],
                consumerClasses: [],
                attributes: { 'aria-hidden': 'true' },
                children: [],
              },
            ],
          },
        ];
      });
    },
  },
  {
    id: 'avatar-renders-the-label-instead-of-the-image',
    klass: 'structure',
    description: 'a label starts beating an image, which is the reverse of the historical priority',
    expect: { dimensions: ['dom.structure'], caseIds: ['avatar/image-beats-label'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'avatar/image-beats-label', root('avatar'), 'avatar root');
        if (!node.children.some((child) => child.tag === 'img')) fail('the case was not rendering the image branch');
        node.children = [
          {
            tag: 'span',
            classes: ['vf-avatar__label'],
            consumerClasses: [],
            attributes: {},
            children: [],
            text: 'MC',
          },
        ];
      });
    },
  },
  {
    id: 'avatar-renders-the-slot-instead-of-the-icon',
    klass: 'structure',
    description: 'the default slot is promoted above the icon branch',
    expect: { dimensions: ['dom.structure'], caseIds: ['avatar/icon-beats-slot'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'avatar/icon-beats-slot', root('avatar'), 'avatar root');
        if (node.children.length === 0) fail('the case was not rendering a glyph');
        node.children = [];
        node.text = 'SLOT';
      });
    },
  },
  {
    id: 'avatar-loses-the-alt',
    klass: 'native attributes',
    description: 'the image stops carrying alt, turning a decorative image into an unlabelled one',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['alt'] },
      caseIds: ['avatar/image'],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'avatar/image', tagged('img'), 'avatar image');
        if (node.attributes.alt === undefined) fail('the image had no alt to lose');
        const { alt, ...rest } = node.attributes;
        void alt;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'avatar-drops-the-empty-alt',
    klass: 'native attributes',
    description:
      'the decorative default alt="" is omitted rather than written, which changes what a screen reader does',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['alt'] },
      caseIds: ['avatar/image-decorative'],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'avatar/image-decorative', tagged('img'), 'avatar image');
        if (node.attributes.alt !== '') fail('the decorative case did not carry an empty alt');
        const { alt, ...rest } = node.attributes;
        void alt;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'avatar-exposes-the-decorative-glyph',
    klass: 'aria',
    description: 'the glyph loses aria-hidden, so an icon-only avatar starts announcing its icon',
    expect: {
      dimensions: ['dom.aria'],
      details: { 'dom.aria': ['aria-hidden'] },
      caseIds: ['avatar/icon'],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'avatar/icon', (entry) => entry.tag === 'svg', 'avatar glyph');
        if (node.attributes['aria-hidden'] !== 'true') fail('the glyph was not aria-hidden');
        const { 'aria-hidden': removed, ...rest } = node.attributes;
        void removed;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'avatar-emits-the-default-size-modifier',
    klass: 'canonical classes',
    description: 'the md size stops being suppressed, so every default avatar gains a class no stylesheet expects',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['avatar/size-md-explicit'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'avatar/size-md-explicit', root('avatar'), 'avatar root');
        node.classes = [...node.classes, 'vf-avatar--md'].sort();
      });
    },
  },
  {
    id: 'avatar-emits-a-square-modifier',
    klass: 'canonical classes',
    description: 'the default square shape starts emitting vf-avatar--square, which no stylesheet defines',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['avatar/shape-square-explicit'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'avatar/shape-square-explicit', root('avatar'), 'avatar root');
        node.classes = [...node.classes, 'vf-avatar--square'].sort();
      });
    },
  },
  {
    id: 'avatar-suppresses-the-circle-modifier',
    klass: 'canonical classes',
    description: 'the circle shape loses its modifier, so every avatar renders square',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['avatar/shape-circle'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'avatar/shape-circle', root('avatar'), 'avatar root');
        if (!node.classes.includes('vf-avatar--circle')) fail('the case did not carry the circle modifier');
        node.classes = node.classes.filter((name) => name !== 'vf-avatar--circle');
      });
    },
  },
  {
    id: 'avatar-moves-the-glyph-class-to-the-wrapper',
    klass: 'canonical classes',
    description:
      'vf-avatar__icon lands on the icon wrapper instead of the glyph, so the avatar stylesheet sizes the wrong box',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['avatar/icon'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const wrapper = findNode(
          capture,
          'avatar/icon',
          (entry) => entry.classes.includes('vf-icon-wrapper'),
          'icon wrapper',
        );
        const glyph = findNode(capture, 'avatar/icon', (entry) => entry.tag === 'svg', 'avatar glyph');
        if (!glyph.classes.includes('vf-avatar__icon')) fail('the glyph did not carry the avatar class');
        glyph.classes = glyph.classes.filter((name) => name !== 'vf-avatar__icon');
        wrapper.classes = [...wrapper.classes, 'vf-avatar__icon'].sort();
      });
    },
  },
  {
    id: 'avatar-loses-the-consumer-class',
    klass: 'canonical classes',
    description: 'a consumer class stops reaching the root',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['avatar/consumer-class'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'avatar/consumer-class', root('avatar'), 'avatar root');
        if (!node.consumerClasses.includes('consumer-avatar')) fail('the consumer class was not there');
        node.consumerClasses = node.consumerClasses.filter((name) => name !== 'consumer-avatar');
      });
    },
  },
  staticSnapshotMutation({
    id: 'avatar-static-snapshot-reports-a-focusable',
    description: 'the avatar reports a focusable element, which none of its four branches renders',
    caseId: 'avatar/icon',
    field: 'focusableCount',
    from: 0,
    to: 1,
  }),
];

// -------------------------------------------------------------------- VfCard

export const cardParityMutations = [
  {
    id: 'card-header-gains-a-class',
    klass: 'canonical classes',
    description: 'the unclassed header wrapper gains vf-card__header, which looks identical and selects differently',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['card/full'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'card/full', tagged('header'), 'card header');
        if (node.classes.length > 0) fail('the header already carried a class');
        node.classes = ['vf-card__header'];
      });
    },
  },
  {
    id: 'card-footer-gains-a-class',
    klass: 'canonical classes',
    description: 'the unclassed footer wrapper gains vf-card__footer',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['card/full'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'card/full', tagged('footer'), 'card footer');
        if (node.classes.length > 0) fail('the footer already carried a class');
        node.classes = ['vf-card__footer'];
      });
    },
  },
  {
    id: 'card-header-becomes-a-div',
    klass: 'structure',
    description: 'the native header element becomes a generic div, losing its implicit semantics',
    expect: { dimensions: ['dom.structure'], caseIds: ['card/full'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'card/full', tagged('header'), 'card header');
        node.tag = 'div';
      });
    },
  },
  {
    id: 'card-drops-the-empty-body-wrapper',
    klass: 'structure',
    description:
      'the body wrapper is keyed on rendered content rather than on the slot, so an empty body silently closes ' +
      'the gap it was holding open',
    expect: { dimensions: ['dom.structure'], caseIds: ['card/body-empty'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'card/body-empty', root('card'), 'card root');
        const before = node.children.length;
        node.children = node.children.filter((child) => !child.classes.includes('vf-card__body'));
        if (node.children.length === before) fail('the case had no body wrapper to drop');
      });
    },
  },
  {
    id: 'card-drops-the-empty-footer-wrapper',
    klass: 'structure',
    description: 'the footer wrapper is keyed on rendered content rather than on the slot',
    expect: { dimensions: ['dom.structure'], caseIds: ['card/footer-empty'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'card/footer-empty', root('card'), 'card root');
        const before = node.children.length;
        node.children = node.children.filter((child) => child.tag !== 'footer');
        if (node.children.length === before) fail('the case had no footer wrapper to drop');
      });
    },
  },
  {
    id: 'card-reorders-the-regions',
    klass: 'structure',
    description: 'the footer is rendered before the body',
    expect: { dimensions: ['dom.structure'], caseIds: ['card/full'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'card/full', root('card'), 'card root');
        if (node.children.length !== 3) fail('the case did not render all three regions');
        node.children = [node.children[0], node.children[2], node.children[1]];
      });
    },
  },
  {
    id: 'card-loses-the-fallback-heading',
    klass: 'structure',
    description:
      'an empty header slot stops bringing the fallback heading back, which is the subtlest rule in the batch',
    expect: { dimensions: ['dom.structure'], caseIds: ['card/header-slot-empty'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'card/header-slot-empty', tagged('header'), 'card header');
        if (node.children.length === 0) fail('the header had no fallback heading to lose');
        node.children = [];
        node.text = '';
      });
    },
  },
  {
    id: 'card-opens-a-header-for-an-empty-title',
    klass: 'structure',
    description: 'an empty-string title starts rendering an empty header instead of none',
    expect: { dimensions: ['dom.structure'], caseIds: ['card/title-empty'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'card/title-empty', root('card'), 'card root');
        if (node.children.length !== 0) fail('the empty-title case already rendered something');
        node.children = [
          {
            tag: 'header',
            classes: [],
            consumerClasses: [],
            attributes: {},
            children: [
              {
                tag: 'h3',
                classes: ['vf-card__title'],
                consumerClasses: [],
                attributes: {},
                children: [],
              },
            ],
          },
        ];
      });
    },
  },
  {
    id: 'card-becomes-a-panel',
    klass: 'canonical classes',
    description: "VfPanel's block name is reused for VfCard - the substitution the unmigrated neighbour makes possible",
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['card/compact'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'card/compact', root('card'), 'card root');
        node.classes = node.classes.map((name) => name.replace('vf-card', 'vf-panel'));
      });
    },
  },
  {
    id: 'card-loses-the-consumer-class',
    klass: 'canonical classes',
    description: 'a consumer class stops reaching the root',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['card/consumer-class'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'card/consumer-class', root('card'), 'card root');
        if (!node.consumerClasses.includes('consumer-card')) fail('the consumer class was not there');
        node.consumerClasses = node.consumerClasses.filter((name) => name !== 'consumer-card');
      });
    },
  },
  {
    id: 'card-names-itself-as-a-landmark',
    klass: 'aria',
    description:
      'the card starts labelling itself, which turns every section into a landmark in every existing application',
    expect: {
      dimensions: ['dom.aria'],
      details: { 'dom.aria': ['aria-label'] },
      caseIds: ['card/full'],
    },
    apply: setAttribute('card/full', root('card'), 'card root', 'aria-label', 'Workspace'),
  },
  staticSnapshotMutation({
    id: 'card-static-snapshot-loses-the-consumer-control',
    description:
      'the consumer control the case declared stops being measured, so a target that dropped it would go unnoticed',
    caseId: 'card/interactive-slot-content',
    field: 'focusableCount',
    from: 1,
    to: 0,
  }),
  staticSnapshotMutation({
    id: 'card-static-snapshot-gains-a-control-the-consumer-did-not-provide',
    description: 'the card reports two focusable elements where the consumer provided one',
    caseId: 'card/interactive-slot-content',
    field: 'focusableCount',
    from: 1,
    to: 2,
  }),
];

// ------------------------------------------------------------ browser mutations

/** Real DOM mutations on the pages the three targets actually served. */
export const skeletonBrowserMutations = [
  {
    id: 'browser-skeleton-loses-its-shimmer',
    target: 'razor',
    caseIds: ['skeleton/default'],
    description: 'the animation modifier removed from the real Razor skeleton',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['skeleton/default'] },
    beforeExtract: mutateElements(
      ['skeleton/default'],
      '.vf-skeleton',
      `
      if (!element.classList.contains('vf-skeleton--animated')) throw new Error('MUTATION_NOT_APPLIED: modifier');
      element.classList.remove('vf-skeleton--animated');
    `,
    ),
  },
  {
    id: 'browser-skeleton-becomes-visible-to-assistive-technology',
    target: 'razor',
    caseIds: ['skeleton/default'],
    description: 'aria-hidden removed from the real Razor skeleton, so it enters the accessibility tree',
    expect: { dimensions: ['dom.aria', 'a11y.role'], caseIds: ['skeleton/default'] },
    beforeExtract: mutateElements(
      ['skeleton/default'],
      '.vf-skeleton',
      `
      if (element.getAttribute('aria-hidden') !== 'true') throw new Error('MUTATION_NOT_APPLIED: aria-hidden');
      element.removeAttribute('aria-hidden');
      element.setAttribute('role', 'status');
    `,
    ),
  },
];

export const avatarBrowserMutations = [
  {
    id: 'browser-avatar-glyph-loses-the-avatar-class',
    target: 'razor',
    // Aimed at the lg case rather than the default one, and the reason is worth
    // recording. The avatar sizes its glyph with --vf-avatar-icon-size: 1em,
    // while the icon package's own default is --vf-icon-size-md: 1rem. At the
    // md avatar those resolve to the same number, so removing the class there
    // moves no geometry at all and the mutation would prove nothing. At lg the
    // avatar's font-size is larger, 1em is no longer 1rem, and the avatar's own
    // rule is the one actually governing the glyph.
    caseIds: ['avatar/icon-circle-lg'],
    description: 'the real glyph stops carrying vf-avatar__icon, so the avatar stylesheet no longer sizes it',
    expect: {
      dimensions: ['dom.canonicalClasses', 'style.geometry', 'visual'],
      caseIds: ['avatar/icon-circle-lg'],
    },
    beforeExtract: mutateElements(
      ['avatar/icon-circle-lg'],
      '.vf-avatar__icon',
      `
      element.classList.remove('vf-avatar__icon');
    `,
    ),
  },
  {
    id: 'browser-avatar-image-loses-its-alt',
    target: 'razor',
    caseIds: ['avatar/image'],
    description: 'the real image stops carrying alt, changing what a screen reader announces',
    expect: { dimensions: ['dom.nativeAttributes', 'a11y.name'], caseIds: ['avatar/image'] },
    beforeExtract: mutateElements(
      ['avatar/image'],
      '.vf-avatar__image',
      `
      if (!element.hasAttribute('alt')) throw new Error('MUTATION_NOT_APPLIED: alt');
      element.removeAttribute('alt');
    `,
    ),
  },
];

export const cardBrowserMutations = [
  {
    id: 'browser-card-header-gains-a-class',
    target: 'razor',
    caseIds: ['card/full'],
    description: 'the real unclassed header gains vf-card__header',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['card/full'] },
    beforeExtract: mutateElements(
      ['card/full'],
      '.vf-card > header',
      `
      if (element.classList.length > 0) throw new Error('MUTATION_NOT_APPLIED: header already classed');
      element.classList.add('vf-card__header');
    `,
    ),
  },
  {
    id: 'browser-card-body-padding',
    target: 'razor',
    caseIds: ['card/full'],
    description: 'real card padding and column gap changed, which no DOM comparison would report',
    expect: { dimensions: ['style.geometry', 'visual'], caseIds: ['card/full'] },
    beforeExtract: mutateElements(
      ['card/full'],
      '.vf-card',
      `
      element.style.paddingTop = '31px';
      element.style.rowGap = '19px';
    `,
    ),
  },
];

// ---------------------------------------------------------- policy mutations

/**
 * The approvals each component's validation must refuse.
 *
 * The last one is the batch-wide approval: a single rule naming cases from all
 * three M16 components, so a difference in any of them would be excused by a
 * rule reviewed for another. Each component's gate rejects it independently,
 * which is what makes "no broad approvals" a property of the batch rather than
 * of whichever component happened to be checked first.
 */
function policyMutationsFor(caseId) {
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

  return [
    smuggled(
      'smuggled-structure-approval',
      'dom.structure',
      [caseId],
      'an approval for dom.structure, which must never be waivable',
    ),
    smuggled('smuggled-visual-approval', 'visual', [caseId], 'an approval for rendered pixels'),
    smuggled(
      'smuggled-wildcard-case',
      'dom.canonicalClasses',
      ['*'],
      'an approval that covers every case at once instead of naming them',
    ),
    smuggled(
      'smuggled-static-snapshot-approval',
      'static.noInteraction',
      [caseId],
      'an approval for static.noInteraction - the batch would be able to waive the very evidence that the ' +
        'interaction stage ran at all, and in M16 that evidence is also what tells a consumer control from a ' +
        'component-owned one',
    ),
    smuggled(
      'broad-batch-approval',
      'dom.canonicalClasses',
      ['skeleton/default', 'avatar/empty', 'card/empty'],
      'one approval naming cases from all three M16 components, so a difference in any of them would be excused ' +
        'by a rule reviewed for another',
    ),
  ];
}

export const skeletonPolicyMutations = policyMutationsFor('skeleton/default');
export const avatarPolicyMutations = policyMutationsFor('avatar/empty');
export const cardPolicyMutations = policyMutationsFor('card/empty');
