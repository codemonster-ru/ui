// The negative fixtures for the three M15 parity gates.
//
// Three independent sets in one file, sharing helpers and nothing else. That is
// the batch's whole claim: three components migrated together, each still
// auditable on its own. A mutation aimed at one must fail that one's gate and
// leave the other two alone, which the batch isolation attacks then verify.
//
// The mutations that matter here are the ones that still render something
// plausible. A badge that emits vf-badge--neutral is still a badge. A tag that
// gained a background is still a tag, and looks fine. A divider corrected to
// expose role="separator" on both orientations is still a divider and is
// arguably more correct than the reference - which is exactly why the gate has
// to reject it.
//
// Two of them are the substitution attack the batch exists for: rewriting
// VfBadge's block name to VfTag's and vice versa. Near-identical components are
// where shared evidence quietly stops being evidence.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

const root = (block) => (node) => node.classes.includes(`vf-${block}`);

/** A capture mutation that flips one field of a case's static snapshot. */
function staticSnapshotMutation({ id, description, component, caseId, field, from, to }) {
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
    component,
  };
}

/** The tone modifier a toned span emits, removed from a capture. */
function dropToneModifier(block, caseId, modifier) {
  return (captures) => {
    eachTheme(captures, 'razor', (capture) => {
      const node = findNode(capture, caseId, root(block), `${block} root`);
      if (!node.classes.includes(modifier)) fail(`the case did not carry ${modifier}`);
      node.classes = node.classes.filter((name) => name !== modifier);
    });
  };
}

export const badgeParityMutations = [
  {
    id: 'badge-drops-the-tone-modifier',
    klass: 'canonical classes',
    description: 'a toned badge stops emitting its tone class and silently renders as neutral',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['badge/tone-danger'] },
    apply: dropToneModifier('badge', 'badge/tone-danger', 'vf-badge--danger'),
  },
  {
    id: 'badge-emits-a-neutral-modifier',
    klass: 'canonical classes',
    description: 'the neutral tone starts emitting vf-badge--neutral, breaking the convention that neutral is absence',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['badge/neutral-default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'badge/neutral-default', root('badge'), 'badge root');
        if (node.classes.length !== 1) fail('the neutral case already carried a modifier');
        node.classes = [...node.classes, 'vf-badge--neutral'].sort();
      });
    },
  },
  {
    id: 'badge-becomes-a-tag',
    klass: 'canonical classes',
    description: "VfTag's block name is reused for VfBadge - the substitution this batch exists to catch",
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['badge/tone-primary'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'badge/tone-primary', root('badge'), 'badge root');
        node.classes = node.classes.map((name) => name.replace('vf-badge', 'vf-tag'));
      });
    },
  },
  {
    id: 'badge-loses-the-consumer-class',
    klass: 'canonical classes',
    description: 'a consumer class stops reaching the root, so the class-merge contract is broken',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['badge/consumer-class'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'badge/consumer-class', root('badge'), 'badge root');
        if (node.consumerClasses.length === 0) fail('the case carried no consumer class');
        node.consumerClasses = [];
      });
    },
  },
  {
    id: 'badge-renders-a-div-root',
    klass: 'structure',
    description: 'the badge stops being an inline span',
    expect: { dimensions: ['dom.structure'], caseIds: ['badge/neutral-default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'badge/neutral-default', root('badge'), 'badge root');
        if (node.tag !== 'span') fail('the badge root was not a span');
        node.tag = 'div';
      });
    },
  },
  {
    id: 'badge-loses-its-text',
    klass: 'text',
    description: 'slot content stops rendering',
    expect: { dimensions: ['dom.text'], caseIds: ['badge/neutral-default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'badge/neutral-default', root('badge'), 'badge root');
        if (!node.text) fail('the case had no text');
        delete node.text;
      });
    },
  },
  {
    id: 'badge-writes-an-unrequested-role',
    klass: 'aria',
    description: 'the badge starts announcing itself as a status, which is an accessibility change nobody asked for',
    expect: { dimensions: ['dom.aria'], caseIds: ['badge/neutral-default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'badge/neutral-default', root('badge'), 'badge root');
        if (node.attributes.role !== undefined) fail('the case already carried a role');
        node.attributes = { ...node.attributes, role: 'status' };
      });
    },
  },
  staticSnapshotMutation({
    id: 'badge-reports-a-focusable-descendant',
    description: 'something focusable appears inside a badge, which has no interaction at all',
    caseId: 'badge/neutral-default',
    field: 'focusableCount',
    from: 0,
    to: 1,
  }),
  staticSnapshotMutation({
    id: 'badge-stops-reporting-its-static-posture',
    description: 'the static snapshot silently stops declaring that there was nothing to drive',
    caseId: 'badge/neutral-default',
    field: 'interactionPosture',
    from: 'none',
    to: 'skipped',
  }),
];

export const tagParityMutations = [
  {
    id: 'tag-drops-the-tone-modifier',
    klass: 'canonical classes',
    description: 'a toned tag stops emitting its tone class and silently renders as neutral',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['tag/tone-danger'] },
    apply: dropToneModifier('tag', 'tag/tone-danger', 'vf-tag--danger'),
  },
  {
    id: 'tag-emits-a-neutral-modifier',
    klass: 'canonical classes',
    description: 'the neutral tone starts emitting vf-tag--neutral, breaking the convention that neutral is absence',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['tag/neutral-default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'tag/neutral-default', root('tag'), 'tag root');
        if (node.classes.length !== 1) fail('the neutral case already carried a modifier');
        node.classes = [...node.classes, 'vf-tag--neutral'].sort();
      });
    },
  },
  {
    id: 'tag-becomes-a-badge',
    klass: 'canonical classes',
    description: "VfBadge's block name is reused for VfTag - the substitution this batch exists to catch",
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['tag/tone-primary'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'tag/tone-primary', root('tag'), 'tag root');
        node.classes = node.classes.map((name) => name.replace('vf-tag', 'vf-badge'));
      });
    },
  },
  {
    id: 'tag-loses-the-consumer-class',
    klass: 'canonical classes',
    description: 'a consumer class stops reaching the root, so the class-merge contract is broken',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['tag/consumer-class'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'tag/consumer-class', root('tag'), 'tag root');
        if (node.consumerClasses.length === 0) fail('the case carried no consumer class');
        node.consumerClasses = [];
      });
    },
  },
  {
    id: 'tag-renders-a-div-root',
    klass: 'structure',
    description: 'the tag stops being an inline span',
    expect: { dimensions: ['dom.structure'], caseIds: ['tag/neutral-default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'tag/neutral-default', root('tag'), 'tag root');
        if (node.tag !== 'span') fail('the tag root was not a span');
        node.tag = 'div';
      });
    },
  },
  {
    id: 'tag-loses-its-text',
    klass: 'text',
    description: 'slot content stops rendering',
    expect: { dimensions: ['dom.text'], caseIds: ['tag/neutral-default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'tag/neutral-default', root('tag'), 'tag root');
        if (!node.text) fail('the case had no text');
        delete node.text;
      });
    },
  },
  {
    id: 'tag-writes-an-unrequested-role',
    klass: 'aria',
    description: 'the tag starts announcing itself, which is an accessibility change nobody asked for',
    expect: { dimensions: ['dom.aria'], caseIds: ['tag/neutral-default'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'tag/neutral-default', root('tag'), 'tag root');
        if (node.attributes.role !== undefined) fail('the case already carried a role');
        node.attributes = { ...node.attributes, role: 'note' };
      });
    },
  },
  staticSnapshotMutation({
    id: 'tag-reports-a-focusable-descendant',
    description: 'something focusable appears inside a tag, which has no interaction at all',
    caseId: 'tag/neutral-default',
    field: 'focusableCount',
    from: 0,
    to: 1,
  }),
  staticSnapshotMutation({
    id: 'tag-stops-reporting-its-static-posture',
    description: 'the static snapshot silently stops declaring that there was nothing to drive',
    caseId: 'tag/neutral-default',
    field: 'interactionPosture',
    from: 'none',
    to: 'skipped',
  }),
];

export const dividerParityMutations = [
  {
    id: 'divider-becomes-an-hr',
    klass: 'structure',
    description: 'the divider is "corrected" to the conventional hr element',
    expect: { dimensions: ['dom.structure'], caseIds: ['divider/horizontal'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'divider/horizontal', root('divider'), 'divider root');
        if (node.tag !== 'div') fail('the divider root was not a div');
        node.tag = 'hr';
      });
    },
  },
  {
    id: 'divider-gains-a-role-when-horizontal',
    klass: 'aria',
    description: 'the horizontal divider is "corrected" to expose role=separator, which the reference never does',
    expect: { dimensions: ['dom.aria'], caseIds: ['divider/horizontal'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'divider/horizontal', root('divider'), 'divider root');
        if (node.attributes.role !== undefined) fail('the horizontal divider already carried a role');
        node.attributes = { ...node.attributes, role: 'separator' };
      });
    },
  },
  {
    id: 'divider-loses-the-separator-role',
    klass: 'aria',
    description: 'the vertical divider stops exposing role=separator and becomes an anonymous box',
    expect: { dimensions: ['dom.aria'], caseIds: ['divider/vertical'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'divider/vertical', root('divider'), 'divider root');
        if (node.attributes.role !== 'separator') fail('the vertical divider carried no separator role');
        const { role, ...rest } = node.attributes;
        void role;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'divider-drops-aria-orientation',
    klass: 'aria',
    description:
      'aria-orientation is "cleaned up" off the roleless horizontal divider - the attribute the M15 coverage gate found nothing was comparing',
    expect: { dimensions: ['dom.aria'], caseIds: ['divider/horizontal'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'divider/horizontal', root('divider'), 'divider root');
        if (node.attributes['aria-orientation'] !== 'horizontal') fail('the case carried no aria-orientation');
        const { 'aria-orientation': orientation, ...rest } = node.attributes;
        void orientation;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'divider-ignores-a-consumer-role-override',
    klass: 'aria',
    description: 'a consumer role is sanitised away, silently removing a documented override path',
    expect: { dimensions: ['dom.aria'], caseIds: ['divider/role-override-horizontal'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'divider/role-override-horizontal', root('divider'), 'divider root');
        if (node.attributes.role !== 'presentation') fail('the case carried no consumer role');
        const { role, ...rest } = node.attributes;
        void role;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'divider-ignores-a-consumer-aria-orientation-override',
    klass: 'aria',
    description:
      'a consumer aria-orientation is overwritten by the prop, reconciling two values the reference lets disagree',
    expect: { dimensions: ['dom.aria'], caseIds: ['divider/aria-orientation-override'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'divider/aria-orientation-override', root('divider'), 'divider root');
        if (node.attributes['aria-orientation'] !== 'vertical') fail('the case did not carry the override');
        node.attributes = { ...node.attributes, 'aria-orientation': 'horizontal' };
      });
    },
  },
  {
    id: 'divider-drops-the-orientation-modifier',
    klass: 'canonical classes',
    description:
      'the default orientation stops emitting its modifier, copying the toned-span convention onto a component that does not use it',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['divider/horizontal'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'divider/horizontal', root('divider'), 'divider root');
        if (!node.classes.includes('vf-divider--horizontal')) fail('the case carried no orientation modifier');
        node.classes = node.classes.filter((name) => name !== 'vf-divider--horizontal');
      });
    },
  },
  {
    id: 'divider-loses-the-consumer-class',
    klass: 'canonical classes',
    description: 'a consumer class stops reaching the root',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['divider/consumer-class'] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, 'divider/consumer-class', root('divider'), 'divider root');
        if (node.consumerClasses.length === 0) fail('the case carried no consumer class');
        node.consumerClasses = [];
      });
    },
  },
  staticSnapshotMutation({
    id: 'divider-reports-an-interactive-role',
    description: 'an interactive role appears inside a divider, which has no interaction at all',
    caseId: 'divider/horizontal',
    field: 'interactiveRoleCount',
    from: 0,
    to: 1,
  }),
  staticSnapshotMutation({
    id: 'divider-stops-reporting-its-static-posture',
    description: 'the static snapshot silently stops declaring that there was nothing to drive',
    caseId: 'divider/horizontal',
    field: 'interactionPosture',
    from: 'none',
    to: 'skipped',
  }),
];

/**
 * Browser-side mutations: real elements on a real page, before extraction.
 *
 * A capture mutation proves the comparator notices a difference in the
 * description. These prove the extractor notices a difference in the page,
 * which is a different claim and the one a capture mutation cannot make.
 */
export const badgeBrowserMutations = [
  {
    id: 'browser-badge-tone-loses-its-background',
    target: 'razor',
    caseIds: ['badge/tone-primary'],
    description: "a badge tone stops painting a background, which is the one thing VfTag's tones never do",
    expect: { dimensions: ['style.colour', 'visual'], caseIds: ['badge/tone-primary'] },
    beforeExtract: mutateElements(
      ['badge/tone-primary'],
      '.vf-badge',
      "element.style.setProperty('background', 'transparent', 'important');",
    ),
  },
  {
    id: 'browser-badge-drops-its-text',
    target: 'razor',
    caseIds: ['badge/neutral-default'],
    description: 'the rendered badge loses its content in the page rather than in the description',
    expect: { dimensions: ['dom.text', 'visual'], caseIds: ['badge/neutral-default'] },
    beforeExtract: mutateElements(['badge/neutral-default'], '.vf-badge', "element.textContent = '';"),
  },
];

export const tagBrowserMutations = [
  {
    id: 'browser-tag-gains-a-badge-style-background',
    target: 'razor',
    caseIds: ['tag/tone-primary'],
    description:
      'a tag tone starts painting a background the way a badge tone does - the CSS half of the substitution attack',
    expect: { dimensions: ['style.colour', 'visual'], caseIds: ['tag/tone-primary'] },
    beforeExtract: mutateElements(
      ['tag/tone-primary'],
      '.vf-tag',
      "element.style.setProperty('background', 'rgb(37, 99, 235)', 'important');",
    ),
  },
  {
    id: 'browser-tag-drops-its-text',
    target: 'razor',
    caseIds: ['tag/neutral-default'],
    description: 'the rendered tag loses its content in the page rather than in the description',
    expect: { dimensions: ['dom.text', 'visual'], caseIds: ['tag/neutral-default'] },
    beforeExtract: mutateElements(['tag/neutral-default'], '.vf-tag', "element.textContent = '';"),
  },
];

export const dividerBrowserMutations = [
  {
    id: 'browser-divider-loses-its-colour',
    target: 'razor',
    caseIds: ['divider/vertical'],
    description: 'the separator stops being visible at all while still occupying its box',
    expect: { dimensions: ['style.colour', 'visual'], caseIds: ['divider/vertical'] },
    beforeExtract: mutateElements(
      ['divider/vertical'],
      '.vf-divider',
      "element.style.setProperty('background', 'transparent', 'important');",
    ),
  },
  {
    id: 'browser-divider-gains-a-role-in-the-page',
    target: 'razor',
    caseIds: ['divider/horizontal'],
    description: 'the horizontal divider is given role=separator in the live DOM, so the a11y tree changes too',
    expect: {
      dimensions: ['dom.aria', 'a11y.role'],
      caseIds: ['divider/horizontal'],
    },
    beforeExtract: mutateElements(['divider/horizontal'], '.vf-divider', "element.setAttribute('role', 'separator');"),
  },
];

/**
 * Policy mutations: the divergence registry must reject these outright.
 *
 * Written per component rather than once for the batch, because the point is
 * that a badge approval cannot excuse a tag difference. `broad-batch-approval`
 * is the M15-specific one: an approval whose caseIds span all three components.
 */
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
      description: 'an approval that covers every case at once instead of naming them',
      rejectedBy: 'validation',
      apply(policy) {
        push(policy, {
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
      id: 'smuggled-static-snapshot-approval',
      description:
        'an approval for static.noInteraction - the batch would be able to waive the very evidence that the ' +
        'interaction stage ran at all',
      rejectedBy: 'validation',
      apply(policy) {
        push(policy, {
          id: 'smuggled-static-snapshot-approval',
          dimension: 'static.noInteraction',
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
      id: 'broad-batch-approval',
      description:
        'one approval naming cases from all three M15 components, so a difference in any of them would be excused ' +
        'by a rule reviewed for another',
      rejectedBy: 'validation',
      apply(policy) {
        push(policy, {
          id: 'broad-batch-approval',
          dimension: 'dom.canonicalClasses',
          target: 'razor',
          caseIds: ['badge/neutral-default', 'tag/neutral-default', 'divider/horizontal'],
          classification: 'framework-specific',
          expectedOccurrences: 12,
          directions: ['reference-vs-razor', 'current-vs-razor'],
          pathSelector: `span.vf-${component}`,
          reason: 'smuggled batch-wide approval',
        });
      },
    },
  ];
}

export const badgePolicyMutations = policyMutationsFor('badge', 'badge/neutral-default');
export const tagPolicyMutations = policyMutationsFor('tag', 'tag/neutral-default');
export const dividerPolicyMutations = policyMutationsFor('divider', 'divider/horizontal');
