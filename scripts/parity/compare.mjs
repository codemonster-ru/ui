// Three-way comparison for the shared VfInput cases.
//
// Every difference is reported with the case, the dimension, and the value each
// target produced. A difference is only tolerated when the policy lists it; an
// unlisted one fails, which is what stops the harness from turning into a
// normalizer that makes any two implementations look equal.
import { readFileSync } from 'node:fs';

export function loadPolicy(policyPath) {
  return JSON.parse(readFileSync(policyPath, 'utf8'));
}

/** The three directions the plan requires, named so a report reads unambiguously. */
export const directions = [
  { id: 'reference-vs-current', from: 'reference', to: 'current' },
  { id: 'reference-vs-razor', from: 'reference', to: 'razor' },
  { id: 'current-vs-razor', from: 'current', to: 'razor' },
];

/**
 * Whether the policy tolerates this specific difference.
 *
 * An entry may narrow itself by case, target, attribute detail and the element
 * path it applies to, so an approval covers one attribute on one kind of
 * element rather than a whole dimension.
 */
function isApproved(policy, caseId, target, difference) {
  return policy.approvedDivergences.some((entry) => {
    if (entry.caseId !== '*' && entry.caseId !== caseId) return false;
    if (entry.dimension !== difference.dimension) return false;
    if (entry.target !== undefined && entry.target !== '*' && entry.target !== target) return false;
    if (entry.detail !== undefined && entry.detail !== difference.detail) return false;
    if (entry.pathPattern !== undefined && !String(difference.path ?? '').includes(entry.pathPattern)) return false;

    return true;
  });
}

/**
 * Structural diff of two extracted DOM descriptions.
 *
 * Reports the first meaningful difference per path rather than a whole-tree
 * dump, so a failure names the element and attribute that moved.
 */
function diffNodes(left, right, path, differences) {
  if (left === undefined || right === undefined) {
    differences.push({
      dimension: 'dom.structure',
      path,
      detail: left === undefined ? 'missing on the left' : 'missing on the right',
      left: left ? left.tag : null,
      right: right ? right.tag : null,
    });
    return;
  }

  if (left.tag !== right.tag) {
    differences.push({ dimension: 'dom.structure', path, detail: 'tag', left: left.tag, right: right.tag });
    return;
  }

  const nodePath = `${path}/${left.tag}${left.classes.length > 0 ? `.${left.classes.join('.')}` : ''}`;

  if (JSON.stringify(left.classes) !== JSON.stringify(right.classes)) {
    differences.push({
      dimension: 'dom.canonicalClasses',
      path: nodePath,
      left: left.classes.join(' '),
      right: right.classes.join(' '),
    });
  }

  if (JSON.stringify(left.consumerClasses) !== JSON.stringify(right.consumerClasses)) {
    differences.push({
      dimension: 'dom.canonicalClasses',
      path: nodePath,
      detail: 'consumer classes',
      left: left.consumerClasses.join(' '),
      right: right.consumerClasses.join(' '),
    });
  }

  if ((left.text ?? '') !== (right.text ?? '')) {
    differences.push({ dimension: 'dom.text', path: nodePath, left: left.text ?? '', right: right.text ?? '' });
  }

  if ((left.liveValue ?? null) !== (right.liveValue ?? null)) {
    differences.push({
      dimension: 'dom.nativeAttributes',
      path: nodePath,
      detail: 'live value',
      left: left.liveValue ?? null,
      right: right.liveValue ?? null,
    });
  }

  if ((left.operable ?? null) !== (right.operable ?? null)) {
    differences.push({
      dimension: 'dom.actionPresence',
      path: nodePath,
      detail: 'operable',
      left: left.operable ?? null,
      right: right.operable ?? null,
    });
  }

  for (const name of new Set([...Object.keys(left.attributes), ...Object.keys(right.attributes)])) {
    const leftValue = left.attributes[name] ?? null;
    const rightValue = right.attributes[name] ?? null;
    if (leftValue === rightValue) continue;

    differences.push({
      dimension: attributeDimension(name),
      path: nodePath,
      detail: name,
      left: leftValue,
      right: rightValue,
    });
  }

  const childCount = Math.max(left.children.length, right.children.length);
  for (let index = 0; index < childCount; index += 1) {
    diffNodes(left.children[index], right.children[index], `${nodePath}[${index}]`, differences);
  }
}

function attributeDimension(name) {
  if (name === 'id' || name === 'for' || name.startsWith('aria-describedby') || name === 'aria-labelledby') {
    return 'dom.relationships';
  }
  if (name.startsWith('aria-') || name === 'role') return 'dom.aria';
  if (name.startsWith('data-')) return 'dom.productData';
  return 'dom.nativeAttributes';
}

export function compareDom(left, right) {
  const differences = [];
  const count = Math.max(left.length, right.length);

  for (let index = 0; index < count; index += 1) {
    diffNodes(left[index], right[index], `[${index}]`, differences);
  }

  return differences;
}

export function compareStyles(left, right) {
  const differences = [];

  for (const role of new Set([...Object.keys(left), ...Object.keys(right)])) {
    // Whether a role is rendered at all is structure, not geometry. Only the
    // measured values of a role both sides render are a geometry comparison.
    if (!(role in left) || !(role in right)) {
      differences.push({
        dimension: 'dom.structure',
        path: `style/${role}`,
        detail: 'visible role present on one side only',
        left: role in left ? 'present' : 'absent',
        right: role in right ? 'present' : 'absent',
      });
      continue;
    }

    for (const property of new Set([...Object.keys(left[role]), ...Object.keys(right[role])])) {
      const leftValue = left[role][property];
      const rightValue = right[role][property];
      if (leftValue === rightValue) continue;

      differences.push({
        dimension: /color/.test(property) ? 'style.colour' : 'style.geometry',
        path: `${role}.${property}`,
        left: leftValue,
        right: rightValue,
      });
    }
  }

  return differences;
}

export function compareInteraction(left, right) {
  const differences = [];
  const fields = [
    ['value', 'interaction.value'],
    ['type', 'interaction.state'],
    ['filled', 'interaction.state'],
    ['focusRole', 'interaction.focus'],
  ];

  for (const [field, dimension] of fields) {
    if (left[field] !== right[field]) {
      differences.push({ dimension, path: field, left: left[field], right: right[field] });
    }
  }

  if (JSON.stringify(left.selection) !== JSON.stringify(right.selection)) {
    differences.push({
      dimension: 'interaction.selection',
      path: 'selection',
      left: JSON.stringify(left.selection),
      right: JSON.stringify(right.selection),
    });
  }

  for (const action of ['clear', 'reveal']) {
    if (JSON.stringify(left[action]) !== JSON.stringify(right[action])) {
      differences.push({
        dimension: 'interaction.state',
        path: action,
        left: JSON.stringify(left[action]),
        right: JSON.stringify(right[action]),
      });
    }
  }

  for (const field of ['wrapperClasses', 'controlClasses']) {
    // A wrapper that exists on only one side is the approved structural
    // divergence, already reported by dom.structure; its class list is only
    // comparable when both sides render one.
    if (field === 'wrapperClasses' && (left[field] === null || right[field] === null)) continue;

    if (JSON.stringify(left[field]) !== JSON.stringify(right[field])) {
      differences.push({
        dimension: 'interaction.state',
        path: field,
        left: (left[field] ?? []).join(' '),
        right: (right[field] ?? []).join(' '),
      });
    }
  }

  return differences;
}

export function compareAccessibility(left, right) {
  const differences = [];

  for (const role of new Set([...Object.keys(left), ...Object.keys(right)])) {
    const leftNode = left[role];
    const rightNode = right[role];

    if (!leftNode || !rightNode) {
      differences.push({
        dimension: 'a11y.role',
        path: role,
        detail: 'exposed on one side only',
        left: leftNode ? 'present' : 'absent',
        right: rightNode ? 'present' : 'absent',
      });
      continue;
    }

    if (leftNode.role !== rightNode.role) {
      differences.push({ dimension: 'a11y.role', path: role, left: leftNode.role, right: rightNode.role });
    }
    if (leftNode.name !== rightNode.name) {
      differences.push({ dimension: 'a11y.name', path: role, left: leftNode.name, right: rightNode.name });
    }
    if (JSON.stringify(leftNode.states) !== JSON.stringify(rightNode.states)) {
      differences.push({
        dimension: 'a11y.states',
        path: role,
        left: JSON.stringify(leftNode.states),
        right: JSON.stringify(rightNode.states),
      });
    }
  }

  return differences;
}

/**
 * Applies the policy to raw differences.
 *
 * Returns them split into failures and approved divergences, each annotated
 * with the classification the policy gives its dimension.
 */
export function classify(policy, caseId, direction, differences) {
  const failures = [];
  const approved = [];

  for (const difference of differences) {
    const dimension = policy.dimensions[difference.dimension];
    const classification = dimension ? dimension.classification : 'exact';
    const target = direction.to;
    const annotated = { caseId, direction: direction.id, classification, ...difference };

    if (isApproved(policy, caseId, target, difference)) {
      approved.push(annotated);
    } else {
      failures.push(annotated);
    }
  }

  return { failures, approved };
}
