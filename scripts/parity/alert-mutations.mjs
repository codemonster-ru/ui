// The negative fixtures for the VfAlert parity gate.
//
// The M19 set, and the first written for a component that owns a semantic role
// and - the milestone's finding - owns no interaction. Three groups of
// mutations carry it:
//
//   - the dismiss control the reference does not have. A close button grown
//     by the component is the one thing a migration would "complete", and it
//     has to fail on every target at once: identically on all three, which a
//     three-way comparison cannot see, and only the static-ownership budget
//     can. The mutations here grow one in a static case, grow one beside a
//     consumer's button, and drop the consumer's button;
//   - the role and the live region. Every tone writes role=alert and nothing
//     else; a tone that started exposing status, an aria-live that appeared,
//     or an icon that stopped being decorative is an accessibility change, and
//     each has to move both the DOM dimension and the browser's tree;
//   - the tone rule borrowed from the badge or the tag. The three share eight
//     tone names, and the substitution differs at exactly two tones - primary
//     and neutral - and in the block name everywhere.
//
// Each mutation names the dimension that must catch it, and each fails the
// harness rather than counting as a detection if it cannot find what it is
// supposed to break. Nothing here touches the source tree.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const root = (node) => node.classes.includes('vf-alert');
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

/** The dismiss button the reference never renders, as the extractor would describe it. */
const dismissButton = () => ({
  tag: 'button',
  classes: ['vf-alert__dismiss'],
  consumerClasses: [],
  attributes: { 'aria-label': 'Dismiss', type: 'button' },
  children: [],
});

export const alertParityMutations = [
  // ------------------------------------------ the dismiss control it never had

  {
    // Both the DOM and the static snapshot move, because a real button would
    // move both: it is an element the reference does not render and a
    // focusable the case did not declare.
    id: 'alert-grows-a-dismiss-button',
    klass: 'structure',
    description:
      'a component-owned close button appears in a static alert - the control every other design system has and ' +
      'the reference does not',
    expect: { dimensions: ['dom.structure', 'static.noInteraction'], caseIds: ['alert/title-and-content'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'alert/title-and-content', root, 'alert root');
        if (node.children.some((child) => child.tag === 'button')) fail('the case already rendered a button');
        node.children = [...node.children, dismissButton()];
        const snapshot = capture.interactions['alert/title-and-content'];
        if (snapshot?.focusableCount !== 0) fail('the case did not record zero focusable elements');
        snapshot.focusableCount = 1;
      });
    },
  },
  {
    id: 'alert-grows-a-dismiss-button-beside-a-consumer-control',
    klass: 'structure',
    description:
      'a component-owned close button appears next to the consumer button the case declared, so the total is two ' +
      'where the consumer provided one',
    expect: { dimensions: ['dom.structure', 'static.noInteraction'], caseIds: ['alert/interactive-slot-content'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'alert/interactive-slot-content', root, 'alert root');
        node.children = [...node.children, dismissButton()];
        const snapshot = capture.interactions['alert/interactive-slot-content'];
        if (snapshot?.focusableCount !== 1) fail('the case did not record the one consumer control');
        snapshot.focusableCount = 2;
      });
    },
  },
  staticSnapshotMutation({
    id: 'alert-static-snapshot-gains-a-control-in-a-static-case',
    description: 'something focusable appears inside an alert whose consumer provided nothing interactive',
    caseId: 'alert/default',
    field: 'focusableCount',
    from: 0,
    to: 1,
  }),
  staticSnapshotMutation({
    id: 'alert-static-snapshot-loses-the-consumer-control',
    description:
      'the consumer control the case declared stops being measured, so a target that dropped it would go unnoticed',
    caseId: 'alert/interactive-slot-content',
    field: 'focusableCount',
    from: 1,
    to: 0,
  }),
  staticSnapshotMutation({
    id: 'alert-static-snapshot-gains-a-control-the-consumer-did-not-provide',
    description: 'the alert reports two focusable elements where the consumer provided one',
    caseId: 'alert/interactive-title-content',
    field: 'focusableCount',
    from: 1,
    to: 2,
  }),
  staticSnapshotMutation({
    id: 'alert-static-snapshot-exposes-an-interactive-role',
    description: 'an element inside the alert starts carrying an explicit interactive role',
    caseId: 'alert/default',
    field: 'interactiveRoleCount',
    from: 0,
    to: 1,
  }),

  // ------------------------------------------------- the role and the live region

  {
    id: 'alert-loses-its-role',
    klass: 'aria',
    description: 'the section stops writing role=alert, so nothing is announced at all',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['role'] }, caseIds: ['alert/tone-danger'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'alert/tone-danger', root, 'alert root');
        if (node.attributes.role !== 'alert') fail('the case did not carry role=alert');
        const { role, ...rest } = node.attributes;
        void role;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'alert-info-tone-becomes-a-status',
    klass: 'aria',
    description:
      'tone starts carrying semantics: an info alert exposes role=status while a danger alert keeps role=alert. ' +
      'The mapping every "improved" alert has, and the reference does not',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['role'] }, caseIds: ['alert/tone-info'] },
    apply: setAttribute('alert/tone-info', root, 'alert root', 'role', 'status'),
  },
  {
    id: 'alert-gains-a-live-region-attribute',
    klass: 'aria',
    description: 'the alert starts writing aria-live=polite, which changes how it is announced',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-live'] }, caseIds: ['alert/tone-danger'] },
    apply: setAttribute('alert/tone-danger', root, 'alert root', 'aria-live', 'polite'),
  },
  {
    id: 'alert-gains-aria-atomic',
    klass: 'aria',
    description: 'the alert starts writing aria-atomic, redundantly for the role and observably in the DOM',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-atomic'] }, caseIds: ['alert/tone-danger'] },
    apply: setAttribute('alert/tone-danger', root, 'alert root', 'aria-atomic', 'true'),
  },
  {
    id: 'alert-names-itself',
    klass: 'aria',
    description: 'the alert starts labelling itself with its title, which the reference never does',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-label'] }, caseIds: ['alert/tone-danger'] },
    apply: setAttribute('alert/tone-danger', root, 'alert root', 'aria-label', 'Failed'),
  },
  {
    id: 'alert-lets-its-own-role-beat-the-consumer',
    klass: 'aria',
    description: 'the component role is written after the forwarded attrs, so a consumer role=status loses',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['role'] }, caseIds: ['alert/consumer-role'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'alert/consumer-role', root, 'alert root');
        if (node.attributes.role !== 'status') fail('the case did not carry the consumer role');
        node.attributes = { ...node.attributes, role: 'alert' };
      });
    },
  },
  {
    id: 'alert-icon-stops-being-decorative',
    klass: 'aria',
    description: 'aria-hidden leaves the icon container, so the glyph enters the accessibility tree',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-hidden'] }, caseIds: ['alert/tone-warn'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'alert/tone-warn', classed('vf-alert__icon'), 'alert icon container');
        if (node.attributes['aria-hidden'] !== 'true') fail('the container was not aria-hidden');
        const { 'aria-hidden': hidden, ...rest } = node.attributes;
        void hidden;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'alert-hides-the-glyph-twice',
    klass: 'aria',
    description:
      'aria-hidden is written on the svg as well as on the container - invisible to a user, a DOM difference',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-hidden'] }, caseIds: ['alert/tone-warn'] },
    apply: setAttribute('alert/tone-warn', tagged('svg'), 'alert glyph', 'aria-hidden', 'true'),
  },

  // ------------------------------------------------- tone: paint and glyph

  {
    id: 'alert-drops-the-tone-modifier',
    klass: 'canonical classes',
    description: 'the danger modifier stops reaching the class list, so the alert paints as primary',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['alert/tone-danger'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'alert/tone-danger', root, 'alert root');
        if (!node.classes.includes('vf-alert--danger')) fail('the case did not carry the danger modifier');
        node.classes = node.classes.filter((name) => name !== 'vf-alert--danger');
      });
    },
  },
  {
    // The badge/tag rule under the alert's block name: it suppresses `neutral`
    // where the alert suppresses `primary`. Visually nothing changes, because
    // no stylesheet defines vf-alert--neutral; only the class list notices.
    id: 'alert-suppresses-neutral-instead-of-primary',
    klass: 'canonical classes',
    description:
      'the tone rule is borrowed from VfBadge or VfTag, so neutral emits no modifier - identical on screen, different in ' +
      'the class list',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['alert/tone-neutral'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'alert/tone-neutral', root, 'alert root');
        if (!node.classes.includes('vf-alert--neutral')) fail('the case did not carry the neutral modifier');
        node.classes = node.classes.filter((name) => name !== 'vf-alert--neutral');
      });
    },
  },
  {
    id: 'alert-emits-a-primary-modifier',
    klass: 'canonical classes',
    description: 'the other half of the borrowed rule: the default tone emits vf-alert--primary',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['alert/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'alert/default', root, 'alert root');
        if (node.classes.length !== 1) fail('the default case carried a modifier already');
        node.classes = [...node.classes, 'vf-alert--primary'].sort();
      });
    },
  },
  {
    id: 'alert-becomes-a-badge',
    klass: 'canonical classes',
    description:
      "VfBadge's block name is reused for VfAlert - the substitution the shared tone vocabulary makes possible",
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['alert/tone-success'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'alert/tone-success', root, 'alert root');
        node.classes = node.classes.map((name) => name.replace('vf-alert', 'vf-badge'));
      });
    },
  },
  {
    id: 'alert-glyph-loses-the-large-size',
    klass: 'native attributes',
    description:
      "the glyph is rendered at the icon package's default size rather than the large size the alert asks for",
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['width', 'height'] },
      caseIds: ['alert/tone-success'],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'alert/tone-success', tagged('svg'), 'alert glyph');
        if (node.attributes.width !== 'var(--vf-icon-size-lg)') fail('the glyph did not carry the large size');
        node.attributes = {
          ...node.attributes,
          width: 'var(--vf-icon-current-size, var(--vf-icon-size-md))',
          height: 'var(--vf-icon-current-size, var(--vf-icon-size-md))',
        };
      });
    },
  },

  // ------------------------------------------------------------- structure

  {
    id: 'alert-root-becomes-a-div',
    klass: 'structure',
    description: 'the section root becomes a div, which looks identical and exposes a different element',
    expect: { dimensions: ['dom.structure'], caseIds: ['alert/title-and-content'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, 'alert/title-and-content', root, 'alert root').tag = 'div';
      });
    },
  },
  {
    id: 'alert-title-becomes-a-heading',
    klass: 'structure',
    description: 'the title paragraph becomes an h3, which adds a heading to every alert in every application',
    expect: { dimensions: ['dom.structure'], caseIds: ['alert/title-and-content'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, 'alert/title-and-content', classed('vf-alert__title'), 'alert title').tag = 'h3';
      });
    },
  },
  {
    id: 'alert-drops-the-body-wrapper',
    klass: 'structure',
    description: 'default-slot content renders straight into the content wrapper, the way a panel renders its slot',
    expect: { dimensions: ['dom.structure'], caseIds: ['alert/multiple-root-nodes'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const content = findNode(capture, 'alert/multiple-root-nodes', classed('vf-alert__content'), 'alert content');
        const body = content.children.find((child) => child.classes.includes('vf-alert__body'));
        if (!body || body.children.length === 0) fail('the case rendered no body content to unwrap');
        content.children = content.children.flatMap((child) => (child === body ? body.children : [child]));
      });
    },
  },
  {
    id: 'alert-keys-the-body-on-the-slot',
    klass: 'structure',
    description: 'the unconditional body wrapper starts rendering only when the default slot was passed',
    expect: { dimensions: ['dom.structure'], caseIds: ['alert/default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const content = findNode(capture, 'alert/default', classed('vf-alert__content'), 'alert content');
        if (!content.children.some((child) => child.classes.includes('vf-alert__body'))) {
          fail('the empty case rendered no body wrapper');
        }
        content.children = content.children.filter((child) => !child.classes.includes('vf-alert__body'));
      });
    },
  },
  {
    id: 'alert-opens-a-title-for-an-empty-title',
    klass: 'structure',
    description: 'an empty-string title starts rendering an empty paragraph instead of none',
    expect: { dimensions: ['dom.structure'], caseIds: ['alert/title-empty'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const content = findNode(capture, 'alert/title-empty', classed('vf-alert__content'), 'alert content');
        if (content.children.some((child) => child.classes.includes('vf-alert__title'))) {
          fail('the empty-title case already rendered a paragraph');
        }
        content.children = [
          { tag: 'p', classes: ['vf-alert__title'], consumerClasses: [], attributes: {}, children: [] },
          ...content.children,
        ];
      });
    },
  },
  {
    id: 'alert-loses-the-title-fallback',
    klass: 'text',
    description: 'a title slot that renders nothing stops bringing the prop text back',
    expect: { dimensions: ['dom.text'], caseIds: ['alert/title-slot-empty'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const title = findNode(capture, 'alert/title-slot-empty', classed('vf-alert__title'), 'alert title');
        if (title.text !== 'Saved') fail('the fallback text was not there');
        delete title.text;
      });
    },
  },
  {
    id: 'alert-renders-the-hidden-icon',
    klass: 'structure',
    description: 'hideIcon stops removing the container, so the glyph comes back',
    expect: { dimensions: ['dom.structure'], caseIds: ['alert/hide-icon'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'alert/hide-icon', root, 'alert root');
        if (node.children.some((child) => child.classes.includes('vf-alert__icon'))) {
          fail('the hidden-icon case rendered an icon container');
        }
        node.children = [
          {
            tag: 'div',
            classes: ['vf-alert__icon'],
            consumerClasses: [],
            attributes: { 'aria-hidden': 'true' },
            children: [],
          },
          ...node.children,
        ];
      });
    },
  },
  {
    id: 'alert-reorders-the-icon-and-the-content',
    klass: 'structure',
    description: 'the content wrapper is rendered before the icon container',
    expect: { dimensions: ['dom.structure'], caseIds: ['alert/title-and-content'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'alert/title-and-content', root, 'alert root');
        if (node.children.length !== 2) fail('the case did not render two children');
        node.children = [node.children[1], node.children[0]];
      });
    },
  },
  {
    id: 'alert-loses-the-consumer-class',
    klass: 'canonical classes',
    description: 'a consumer class stops reaching the root',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['alert/consumer-class'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'alert/consumer-class', root, 'alert root');
        if (!node.consumerClasses.includes('consumer-alert')) fail('the consumer class was not there');
        node.consumerClasses = node.consumerClasses.filter((name) => name !== 'consumer-alert');
      });
    },
  },
  {
    id: 'alert-leaks-a-product-data-attribute-onto-the-body',
    klass: 'product data',
    description: 'a consumer data attribute reaches the body wrapper as well as the root',
    expect: { dimensions: ['dom.productData'], caseIds: ['alert/product-data'] },
    apply: setAttribute(
      'alert/product-data',
      classed('vf-alert__body'),
      'alert body',
      'data-testid',
      'alert-product-data',
    ),
  },
];

// ------------------------------------------------------------ browser mutations

/** Real DOM mutations on the pages the three targets actually served. */
export const alertBrowserMutations = [
  {
    // The whole dismiss attack in one real page: the button is an element the
    // reference does not render, a focusable the case did not declare, and a
    // node the ownedControl role starts resolving to.
    id: 'browser-alert-grows-a-dismiss-button',
    target: 'razor',
    caseIds: ['alert/title-and-content'],
    description: 'a real close button is appended to the real Razor alert',
    expect: { dimensions: ['dom.structure', 'static.noInteraction'], caseIds: ['alert/title-and-content'] },
    beforeExtract: mutateElements(
      ['alert/title-and-content'],
      '.vf-alert',
      `
      if (element.querySelector('button')) throw new Error('MUTATION_NOT_APPLIED: a button was already there');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'vf-alert__dismiss';
      button.setAttribute('aria-label', 'Dismiss');
      button.textContent = '×';
      element.appendChild(button);
    `,
    ),
  },
  {
    id: 'browser-alert-grows-a-dismiss-button-beside-a-consumer-control',
    target: 'razor',
    caseIds: ['alert/interactive-slot-content'],
    description: 'a real close button is appended beside the consumer button the case declared',
    expect: { dimensions: ['dom.structure', 'static.noInteraction'], caseIds: ['alert/interactive-slot-content'] },
    beforeExtract: mutateElements(
      ['alert/interactive-slot-content'],
      '.vf-alert',
      `
      if (element.querySelectorAll('button').length !== 1) throw new Error('MUTATION_NOT_APPLIED: consumer button');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'vf-alert__dismiss';
      button.setAttribute('aria-label', 'Dismiss');
      element.appendChild(button);
    `,
    ),
  },
  {
    id: 'browser-alert-danger-becomes-a-status',
    target: 'razor',
    caseIds: ['alert/tone-danger'],
    description:
      'the real danger alert is given role=status, so the tree exposes a different role and a polite live region',
    expect: { dimensions: ['dom.aria', 'a11y.role', 'a11y.states'], caseIds: ['alert/tone-danger'] },
    beforeExtract: mutateElements(
      ['alert/tone-danger'],
      '.vf-alert',
      `
      if (element.getAttribute('role') !== 'alert') throw new Error('MUTATION_NOT_APPLIED: role');
      element.setAttribute('role', 'status');
    `,
    ),
  },
  {
    // The role stays; only the politeness moves. This is what the `live`
    // state recording added in M19 exists to catch, and it is the only
    // mutation that moves a11y.states without moving a11y.role.
    id: 'browser-alert-gains-a-polite-live-region',
    target: 'razor',
    caseIds: ['alert/tone-danger'],
    description: 'the real danger alert is given aria-live=polite, which downgrades the announcement the role implies',
    expect: { dimensions: ['dom.aria', 'a11y.states'], caseIds: ['alert/tone-danger'] },
    beforeExtract: mutateElements(
      ['alert/tone-danger'],
      '.vf-alert',
      `
      if (element.hasAttribute('aria-live')) throw new Error('MUTATION_NOT_APPLIED: aria-live');
      element.setAttribute('aria-live', 'polite');
    `,
    ),
  },
  {
    id: 'browser-alert-icon-enters-the-accessibility-tree',
    target: 'razor',
    caseIds: ['alert/tone-warn'],
    description: 'aria-hidden removed from the real icon container, so the container and its glyph are exposed',
    expect: { dimensions: ['dom.aria', 'a11y.role'], caseIds: ['alert/tone-warn'] },
    beforeExtract: mutateElements(
      ['alert/tone-warn'],
      '.vf-alert__icon',
      `
      if (element.getAttribute('aria-hidden') !== 'true') throw new Error('MUTATION_NOT_APPLIED: aria-hidden');
      element.removeAttribute('aria-hidden');
    `,
    ),
  },
  {
    id: 'browser-alert-title-becomes-a-heading',
    target: 'razor',
    caseIds: ['alert/title-and-content'],
    description: 'the real title paragraph is replaced by an h3, so the tree gains a heading',
    expect: { dimensions: ['dom.structure', 'a11y.role'], caseIds: ['alert/title-and-content'] },
    beforeExtract: mutateElements(
      ['alert/title-and-content'],
      '.vf-alert__title',
      `
      if (element.tagName !== 'P') throw new Error('MUTATION_NOT_APPLIED: not a paragraph');
      const heading = document.createElement('h3');
      heading.className = element.className;
      heading.textContent = element.textContent;
      element.replaceWith(heading);
    `,
    ),
  },
  {
    id: 'browser-alert-success-renders-the-info-glyph',
    target: 'razor',
    caseIds: ['alert/tone-success'],
    description:
      "the real success alert's glyph is replaced by the info alert's - the tone-to-glyph rule broken in the one " +
      'way no class or role comparison would report',
    expect: { dimensions: ['dom.nativeAttributes'], caseIds: ['alert/tone-success'] },
    beforeExtract: mutateElements(
      ['alert/tone-success'],
      '.vf-alert__icon',
      `
      const donor = document.querySelector('[data-parity-case="alert/tone-info"] .vf-alert__icon');
      if (!donor || donor.innerHTML === element.innerHTML) throw new Error('MUTATION_NOT_APPLIED: no donor glyph');
      element.innerHTML = donor.innerHTML;
    `,
    ),
  },
  {
    id: 'browser-alert-success-surface',
    target: 'razor',
    caseIds: ['alert/tone-success'],
    description:
      'the real success surface is repainted, which is what the modifier does and which no DOM comparison reports',
    expect: { dimensions: ['style.colour', 'visual'], caseIds: ['alert/tone-success'] },
    beforeExtract: mutateElements(
      ['alert/tone-success'],
      '.vf-alert',
      `
      element.style.backgroundColor = 'rgb(214, 51, 132)';
    `,
    ),
  },
  {
    // The neutral modifier paints nothing, so the only way to prove the harness
    // is *measuring* a neutral alert rather than assuming it is to paint one.
    id: 'browser-alert-neutral-gets-painted',
    target: 'razor',
    caseIds: ['alert/tone-neutral'],
    description: 'the real neutral alert is given a background, which no stylesheet gives it',
    expect: { dimensions: ['style.colour', 'visual'], caseIds: ['alert/tone-neutral'] },
    beforeExtract: mutateElements(
      ['alert/tone-neutral'],
      '.vf-alert',
      `
      element.style.backgroundColor = 'rgb(214, 51, 132)';
    `,
    ),
  },
];

// ---------------------------------------------------------- policy mutations

/**
 * The approvals validation must refuse.
 *
 * The last one is the Badge/Alert approval: a single rule naming cases from
 * both components, so a difference in either would be excused by a rule
 * reviewed for the other. That is the shape a reviewer would reach for because
 * the tone vocabularies look alike, and it has to be rejected as firmly as a
 * wildcard.
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

export const alertPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    ['alert/title-and-content'],
    'an approval for dom.structure, which must never be waivable - and which in M19 is the dimension a dismiss ' +
      'button lands in first',
  ),
  smuggled('smuggled-visual-approval', 'visual', ['alert/default'], 'an approval for rendered pixels'),
  smuggled(
    'smuggled-wildcard-case',
    'dom.aria',
    ['*'],
    'an approval that covers every case at once instead of naming them',
  ),
  smuggled(
    'smuggled-static-snapshot-approval',
    'static.noInteraction',
    ['alert/interactive-slot-content'],
    'an approval for static.noInteraction - the evidence that tells a consumer control from a component-owned ' +
      'one, and the only evidence that catches a dismiss button grown on all three targets',
  ),
  smuggled(
    'broad-badge-alert-approval',
    'dom.canonicalClasses',
    ['alert/tone-neutral', 'badge/neutral-default'],
    'one approval naming cases from both VfAlert and VfBadge, so a difference in either would be excused by a ' +
      'rule reviewed for the other - the approval a reviewer reaches for because the tone names look alike',
  ),
];
