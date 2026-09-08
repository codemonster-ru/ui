// Three-way comparison for the shared VfInput cases.
//
// Every difference is reported with the case, the dimension, and the value each
// target produced. A difference is only tolerated when the policy lists it; an
// unlisted one fails, which is what stops the harness from turning into a
// normalizer that makes any two implementations look equal.
//
// M07.1 hardening. The independent review proved a false PASS: a blanket
// `dom.structure` approval combined with a comparator that abandoned a subtree
// as soon as two tags differed, so six cases had no DOM comparison at all. The
// rules that follow from that:
//
//   - `dom.structure` is never approvable. A deliberate divergence gets its own
//     narrow dimension, named after what it actually is.
//   - A tag mismatch is reported and the comparison continues. For the one
//     shape VfInput actually produces - a bare control on one side, a wrapper
//     around the same control on the other - the control is still compared in
//     full, so native attributes, aria, product data and relationships cannot
//     hide behind the wrapper.
//   - An approval names its cases; `*` does not exist any more.
//   - A path selector matches one element exactly, not any path containing it.
//   - No dimension is silently skipped inside this file.
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';

export function loadPolicy(policyPath) {
  return JSON.parse(readFileSync(policyPath, 'utf8'));
}

/** The three directions the plan requires, named so a report reads unambiguously. */
export const directions = [
  { id: 'reference-vs-current', from: 'reference', to: 'current' },
  { id: 'reference-vs-razor', from: 'reference', to: 'razor' },
  { id: 'current-vs-razor', from: 'current', to: 'razor' },
];

export const targets = ['reference', 'current', 'razor'];

/** Dimensions that describe an unexplained difference and may never be waived. */
export const neverApprovable = new Set(['dom.structure', 'visual', 'visual.postInteraction']);

/** Dimensions whose approval has to name the element it applies to. */
const pathScopedDimensions = new Set([
  'dom.structure',
  'dom.canonicalClasses',
  'dom.nativeAttributes',
  'dom.aria',
  'dom.productData',
  'dom.text',
  'dom.relationships',
  'dom.actionPresence',
  'dom.wrapperPresence',
  'dom.inertAction',
]);

const approvalFields = new Set([
  'id',
  'dimension',
  'target',
  'directions',
  'caseIds',
  'detail',
  'path',
  'pathSelector',
  'left',
  'right',
  'reason',
  'classification',
  'expectedOccurrences',
]);

const classifications = new Set(['exact', 'semantic', 'framework-specific']);

/** The canonical shape of one element, used both in paths and in selectors. */
export function nodeSelector(node) {
  return `${node.tag}${node.classes.length > 0 ? `.${node.classes.join('.')}` : ''}`;
}

/**
 * The last element a difference path points at.
 *
 * A path is a `/`-separated list of `tag.class.class[childIndex]` segments, so
 * the element a difference belongs to is the last segment with its child index
 * stripped. Matching only that segment is what stops an approval written for a
 * wrapper from also covering everything nested inside it.
 */
export function pathTarget(path) {
  const segments = String(path ?? '')
    .split('/')
    .filter(Boolean);
  const last = segments[segments.length - 1] ?? '';

  return last.replace(/\[\d+\]$/, '');
}

/**
 * Whether the policy tolerates this specific difference.
 *
 * Every entry names its dimension, its target, the cases it covers and - for
 * anything anchored to an element - that exact element. There is no wildcard
 * and no substring match.
 */
function findApproval(policy, caseId, direction, difference) {
  return (
    policy.approvedDivergences.find((entry) => {
      if (entry.dimension !== difference.dimension) return false;
      if (entry.target !== direction.to || !entry.directions.includes(direction.id)) return false;
      if (!entry.caseIds.includes(caseId)) return false;
      if (entry.detail !== difference.detail) return false;
      if (entry.path !== undefined && entry.path !== difference.path) return false;
      if (entry.pathSelector !== undefined && entry.pathSelector !== pathTarget(difference.path)) return false;
      if (!isDeepStrictEqual(entry.left, difference.left) || !isDeepStrictEqual(entry.right, difference.right))
        return false;

      return true;
    }) ?? null
  );
}

/**
 * Validates the divergence registry itself.
 *
 * The registry is the part of the harness that can quietly stop protecting
 * anything, so its shape is machine-checked rather than reviewed by eye.
 */
export function validatePolicy(policy, knownCaseIds) {
  const problems = [];
  const caseIds = new Set(knownCaseIds);
  const seenIds = new Set();

  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
    return ['policy must be an object'];
  }
  if (!policy.dimensions || typeof policy.dimensions !== 'object' || Array.isArray(policy.dimensions)) {
    return ['dimensions must be an object'];
  }
  if (!Array.isArray(policy.approvedDivergences)) {
    return ['approvedDivergences must be an array'];
  }

  for (const [index, entry] of policy.approvedDivergences.entries()) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      problems.push(`approvedDivergences[${index}]: approval must be an object`);
      continue;
    }
    const where = `approvedDivergences[${index}]${entry.id ? ` (${entry.id})` : ''}`;

    for (const field of Object.keys(entry)) {
      if (!approvalFields.has(field)) {
        problems.push(
          `${where}: unknown field "${field}". Allowed: ${[...approvalFields].join(', ')}. ` +
            'A field the code does not read is a constraint that does not exist.',
        );
      }
    }

    if (typeof entry.id !== 'string' || entry.id === '') {
      problems.push(`${where}: id is required so the report can attribute every tolerated difference`);
    } else if (seenIds.has(entry.id)) {
      problems.push(`${where}: duplicate id "${entry.id}"`);
    } else {
      seenIds.add(entry.id);
    }

    if (!Object.hasOwn(policy.dimensions, entry.dimension)) {
      problems.push(`${where}: unknown dimension "${entry.dimension}"`);
    } else if (neverApprovable.has(entry.dimension)) {
      problems.push(
        `${where}: "${entry.dimension}" may never be approved. ` +
          'An intentional divergence needs its own narrow dimension; an unexplained one has to fail.',
      );
    }

    if (entry.target !== 'razor') {
      problems.push(`${where}: target must be razor; reference-vs-current must remain strictly zero drift`);
    }

    if (!Array.isArray(entry.directions) || entry.directions.length === 0) {
      problems.push(`${where}: directions must be a non-empty finite list`);
    } else if (
      new Set(entry.directions).size !== entry.directions.length ||
      entry.directions.some(
        (id) => !directions.some((direction) => direction.id === id && direction.to === entry.target),
      )
    ) {
      problems.push(`${where}: directions must name distinct comparisons ending at the declared target`);
    }

    if (!Array.isArray(entry.caseIds) || entry.caseIds.length === 0) {
      problems.push(`${where}: caseIds must be a non-empty list of case ids (no wildcard)`);
    } else {
      if (new Set(entry.caseIds).size !== entry.caseIds.length) problems.push(`${where}: caseIds must be distinct`);
      for (const caseId of entry.caseIds) {
        if (caseId === '*') {
          problems.push(`${where}: caseIds may not contain "*"`);
        } else if (!caseIds.has(caseId)) {
          problems.push(`${where}: caseIds names "${caseId}", which is not in the case catalog`);
        }
      }
    }

    if (pathScopedDimensions.has(entry.dimension) && entry.pathSelector === undefined && entry.path === undefined) {
      problems.push(`${where}: "${entry.dimension}" approvals must name the element through pathSelector`);
    }

    if ((entry.path === undefined) === (entry.pathSelector === undefined)) {
      problems.push(`${where}: specify exactly one exact path or pathSelector`);
    }
    if (entry.path !== undefined && (typeof entry.path !== 'string' || entry.path === '' || /[*?]/.test(entry.path))) {
      problems.push(`${where}: path must be a non-empty exact path without wildcards`);
    }
    if (typeof entry.detail !== 'string' || entry.detail === '') {
      problems.push(`${where}: detail must name the exact difference category or attribute`);
    }
    if (!Object.hasOwn(entry, 'left') || !Object.hasOwn(entry, 'right')) {
      problems.push(`${where}: exact left and right values are required; a value-independent waiver is too broad`);
    }

    if (entry.pathSelector !== undefined) {
      if (typeof entry.pathSelector !== 'string' || entry.pathSelector === '') {
        problems.push(`${where}: pathSelector must be a non-empty string`);
      } else if (/[*?]/.test(entry.pathSelector)) {
        problems.push(`${where}: pathSelector is matched exactly; wildcards are not supported`);
      } else if (/\[\d+\]$/.test(entry.pathSelector)) {
        problems.push(`${where}: pathSelector names an element, not a child index; drop the trailing [n]`);
      }
    }

    if (!Number.isInteger(entry.expectedOccurrences) || entry.expectedOccurrences <= 0) {
      problems.push(`${where}: expectedOccurrences must be a positive integer`);
    }

    if (typeof entry.reason !== 'string' || entry.reason.length < 20) {
      problems.push(`${where}: reason must explain the divergence`);
    }

    if (!classifications.has(entry.classification)) {
      problems.push(`${where}: classification must be one of ${[...classifications].join(', ')}`);
    }
  }

  return problems;
}

// ---------------------------------------------------------------- DOM shapes
//
// The three helpers below are the only structural knowledge the comparator has.
// They describe VfInput and nothing else: this is deliberately not a general
// tree-alignment algorithm.

function isControlNode(node) {
  return node.tag === 'input' && node.classes.includes('vf-input');
}

function isWrapperNode(node) {
  return node.tag === 'div' && node.classes.includes('vf-input-wrap');
}

function isActionNode(node) {
  return (
    node.tag === 'button' &&
    (node.classes.includes('vf-input-wrap__clear') || node.classes.includes('vf-input-wrap__password-toggle'))
  );
}

/**
 * Reports every child a wrapper adds beside the control.
 *
 * Each one is reported on its own, anchored to the element, so an approval
 * covers one known inert action rather than "whatever else is in there".
 */
function reportWrapperExtras(wrapper, control, side, path, differences) {
  for (const [index, child] of wrapper.children.entries()) {
    if (child === control) continue;

    differences.push({
      dimension: isActionNode(child) ? 'dom.inertAction' : 'dom.structure',
      path: `${path}[${index}]/${nodeSelector(child)}`,
      detail: side === 'left' ? 'rendered on the left only' : 'rendered on the right only',
      // An approval must describe the complete inert subtree, not merely a
      // button selector. This also checks disabled/hidden/display:none and
      // rejects extra descendants, changed glyphs and product attributes.
      left: side === 'left' ? child : null,
      right: side === 'right' ? child : null,
    });
  }
}

/**
 * Structural diff of two extracted DOM descriptions.
 *
 * A tag mismatch no longer abandons the subtree. For the one shape VfInput
 * produces - a bare control against a wrapper holding the same control - the
 * control is compared in full and the wrapper's extra children are reported
 * individually. Any other mismatch is an unexplained structural difference,
 * which cannot be approved at all.
 */
function diffNodes(left, right, path, differences) {
  if (left === undefined || right === undefined) {
    const present = left ?? right;
    const side = left === undefined ? 'right' : 'left';

    differences.push({
      dimension: isActionNode(present) ? 'dom.inertAction' : 'dom.structure',
      path: `${path}/${nodeSelector(present)}`,
      detail: side === 'left' ? 'rendered on the left only' : 'rendered on the right only',
      left: left ?? null,
      right: right ?? null,
    });
    return;
  }

  if (left.tag !== right.tag) {
    const wrapper = isWrapperNode(left) ? left : isWrapperNode(right) ? right : null;
    const bare = isControlNode(left) ? left : isControlNode(right) ? right : null;
    const controls = wrapper?.children.filter(isControlNode) ?? [];
    const wrapped = controls.length === 1 && wrapper.children[0] === controls[0] ? controls[0] : null;

    if (wrapper && bare && wrapped) {
      // The deliberate divergence: one adapter wraps the control, the other
      // renders it bare. Reported once, and only for the wrapper itself.
      differences.push({
        dimension: 'dom.wrapperPresence',
        path: `${path}/${nodeSelector(wrapper)}`,
        detail: 'wrapper rendered on one side only',
        left: nodeSelector(left),
        right: nodeSelector(right),
      });

      // Only the bare neutral wrapper is expected in these six cases. Its
      // presence does not waive new attributes, text or consumer classes.
      const neutralWrapper = {
        tag: 'div',
        classes: ['vf-input-wrap'],
        consumerClasses: [],
        attributes: {},
        children: [],
      };
      compareNodeProperties(
        wrapper === left ? wrapper : neutralWrapper,
        wrapper === right ? wrapper : neutralWrapper,
        `${path}/${nodeSelector(wrapper)}`,
        differences,
      );

      // The control carries the whole native, aria, product-data and
      // relationship contract, so it is compared regardless of the wrapper.
      diffNodes(wrapper === left ? wrapped : bare, wrapper === right ? wrapped : bare, `${path}<control>`, differences);

      reportWrapperExtras(wrapper, wrapped, wrapper === left ? 'left' : 'right', path, differences);
      return;
    }

    // Report incompatible tags, then keep comparing their attributes and
    // descendants. No unexplained structure can be approved, and useful
    // control/attribute diagnostics must not disappear with the tag report.
    differences.push({ dimension: 'dom.structure', path, detail: 'tag', left: left.tag, right: right.tag });
  }

  const nodePath = `${path}/${nodeSelector(left)}`;
  compareNodeProperties(left, right, nodePath, differences);

  const childCount = Math.max(left.children.length, right.children.length);
  for (let index = 0; index < childCount; index += 1) {
    diffNodes(left.children[index], right.children[index], `${nodePath}[${index}]`, differences);
  }
}

function compareNodeProperties(left, right, nodePath, differences) {
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
}

function attributeDimension(name) {
  if (['id', 'for', 'aria-describedby', 'aria-labelledby', 'aria-controls'].includes(name)) {
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
    //
    // A role that one side renders and the other does not is only tolerable for
    // the wrapper; anything else - an icon that turned invisible, an action
    // that vanished - is an unexplained structural difference.
    if (!(role in left) || !(role in right)) {
      differences.push({
        dimension: role === 'wrapper' ? 'dom.wrapperPresence' : 'dom.structure',
        path: `style:${role}`,
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

/**
 * Every field a post-scenario snapshot can carry, and the dimension it belongs
 * to.
 *
 * Declared exhaustively, and in the order VfInput's fields were compared before
 * M10, so that gate's output is unchanged. The map exists because the previous
 * version compared a hardcoded list: when VfIconButton added `activations`,
 * `pressed` and `accessibleName` to its snapshot, those were recorded in the
 * report and silently never compared. A gate that reads a value and does not
 * check it is worse than one that never read it, because the report makes it
 * look checked.
 *
 * `classList` formats an array as a space-joined string; `json` compares whole
 * objects. `presence` marks a field whose appearing on one side only is its own
 * dimension rather than a value difference.
 */
const INTERACTION_FIELDS = {
  value: { dimension: 'interaction.value' },
  type: { dimension: 'interaction.state' },
  filled: { dimension: 'interaction.state' },
  focusRole: { dimension: 'interaction.focus' },
  selection: { dimension: 'interaction.selection', format: 'json' },
  clear: { dimension: 'interaction.state', format: 'json' },
  reveal: { dimension: 'interaction.state', format: 'json' },
  wrapperClasses: {
    dimension: 'interaction.state',
    format: 'classList',
    presence: { dimension: 'interaction.wrapperPresence', detail: 'wrapper rendered on one side only' },
  },
  controlClasses: { dimension: 'interaction.state', format: 'classList' },
  activations: { dimension: 'interaction.state' },
  disabled: { dimension: 'interaction.state' },
  operable: { dimension: 'interaction.state' },
  accessibleName: { dimension: 'interaction.state' },
  pressed: { dimension: 'interaction.state' },
  buttonClasses: { dimension: 'interaction.state', format: 'classList' },
  glyphHidden: { dimension: 'interaction.state' },
  // VfField. The two relationship fields are their own dimension: a field whose
  // label stops reaching its control still renders identically, so a value
  // difference here has to be reported as a broken relationship rather than as
  // one more class that moved.
  labelTargetsControl: { dimension: 'interaction.relationships' },
  describedTargets: { dimension: 'interaction.relationships', format: 'json' },
  floating: { dimension: 'interaction.state' },
  invalid: { dimension: 'interaction.state' },
  fieldClasses: { dimension: 'interaction.state', format: 'classList' },
  controlInvalid: { dimension: 'interaction.state' },
  // VfTextarea. `controlFilled` is the marker on the control itself, which the
  // textarea controller owns; `filled` above is the field's class, which the
  // field controller owns. They are compared separately so a regression in one
  // owner cannot be masked by the other still being right.
  controlFilled: { dimension: 'interaction.state' },
  readOnly: { dimension: 'interaction.state' },
};

/**
 * Snapshot keys that are deliberately not compared, each for a stated reason.
 *
 * `clip` is where the screenshot was taken, not what it showed; the pixels it
 * produced are compared as visual.postInteraction. `inputEvents` is the event
 * transport, which the policy already records as not compared: Vue emits its
 * own events and the Razor controller dispatches native ones, so only the
 * resulting state is a contract.
 */
const IGNORED_INTERACTION_FIELDS = new Set(['clip', 'inputEvents']);

export function compareInteraction(left, right) {
  const differences = [];

  // Both sides come from the same profile, so a key on one and not the other
  // means the two targets were captured with different snapshot shapes and no
  // comparison below would be meaningful.
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (JSON.stringify(leftKeys) !== JSON.stringify(rightKeys)) {
    throw new Error(
      `Interaction snapshots have different shapes: [${leftKeys.join(', ')}] vs [${rightKeys.join(', ')}].`,
    );
  }

  const unmapped = leftKeys.filter((key) => !INTERACTION_FIELDS[key] && !IGNORED_INTERACTION_FIELDS.has(key));
  if (unmapped.length > 0) {
    throw new Error(
      `Interaction snapshot fields [${unmapped.join(', ')}] are neither compared nor explicitly ignored. ` +
        'Add them to INTERACTION_FIELDS or IGNORED_INTERACTION_FIELDS in scripts/parity/compare.mjs.',
    );
  }

  for (const [field, rule] of Object.entries(INTERACTION_FIELDS)) {
    if (!(field in left)) continue;

    const leftValue = left[field];
    const rightValue = right[field];

    if (rule.presence && (leftValue === null) !== (rightValue === null)) {
      differences.push({
        dimension: rule.presence.dimension,
        path: field,
        detail: rule.presence.detail,
        left: leftValue === null ? 'absent' : leftValue.join(' '),
        right: rightValue === null ? 'absent' : rightValue.join(' '),
      });
      continue;
    }

    if (rule.format === 'json') {
      if (JSON.stringify(leftValue) !== JSON.stringify(rightValue)) {
        differences.push({
          dimension: rule.dimension,
          path: field,
          ...(field === 'selection' ? {} : {}),
          left: JSON.stringify(leftValue),
          right: JSON.stringify(rightValue),
        });
      }
      continue;
    }

    if (rule.format === 'classList') {
      if (JSON.stringify(leftValue) !== JSON.stringify(rightValue)) {
        differences.push({
          dimension: rule.dimension,
          path: field,
          left: (leftValue ?? []).join(' '),
          right: (rightValue ?? []).join(' '),
        });
      }
      continue;
    }

    if (leftValue !== rightValue) {
      differences.push({ dimension: rule.dimension, path: field, detail: field, left: leftValue, right: rightValue });
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
 * with the classification the policy gives its dimension and, for an approved
 * one, the registry entry that tolerated it.
 */
export function classify(policy, caseId, direction, differences) {
  const failures = [];
  const approved = [];

  for (const difference of differences) {
    const dimension = policy.dimensions[difference.dimension];
    const classification = dimension ? dimension.classification : 'exact';
    const annotated = { caseId, direction: direction.id, classification, ...difference };
    const approval = findApproval(policy, caseId, direction, difference);

    if (approval) {
      approved.push({ ...annotated, approvalId: approval.id });
    } else {
      failures.push(annotated);
    }
  }

  return { failures, approved };
}

/**
 * Per-rule usage of the registry.
 *
 * A count on its own is not a signal: the review found 224 tolerated
 * differences hiding a defect. This attributes every one of them to the rule
 * that allowed it, and reports a rule that matched nothing or matched more than
 * it was written for.
 */
export function summariseApprovals(policy, approved) {
  const byId = new Map(policy.approvedDivergences.map((entry) => [entry.id, entry]));
  const usage = new Map(
    policy.approvedDivergences.map((entry) => [
      entry.id,
      {
        id: entry.id,
        dimension: entry.dimension,
        target: entry.target,
        allowedDirections: entry.directions,
        detail: entry.detail ?? null,
        path: entry.path ?? null,
        pathSelector: entry.pathSelector ?? null,
        expectedOccurrences: entry.expectedOccurrences,
        occurrences: 0,
        caseIds: new Set(),
        directions: new Set(),
        paths: new Set(),
      },
    ]),
  );

  for (const entry of approved) {
    const record = usage.get(entry.approvalId);
    if (!record) continue;
    record.occurrences += 1;
    record.caseIds.add(entry.caseId);
    record.directions.add(entry.direction);
    record.paths.add(String(entry.path));
  }

  const rows = [...usage.values()].map((record) => ({
    ...record,
    caseIds: [...record.caseIds].sort(),
    directions: [...record.directions].sort(),
    paths: [...record.paths].sort(),
  }));

  const problems = [];
  for (const row of rows) {
    const entry = byId.get(row.id);
    if (row.occurrences === 0) {
      problems.push(
        `approval "${row.id}" matched nothing. A rule that tolerates no real difference is a rule nobody can ` +
          'audit; delete it or explain what changed.',
      );
      continue;
    }
    if (row.occurrences !== entry.expectedOccurrences) {
      problems.push(
        `approval "${row.id}" matched ${row.occurrences} difference(s), the registry expects ` +
          `${entry.expectedOccurrences}. Update the entry deliberately, or find out what grew: ` +
          `cases ${row.caseIds.join(', ')}.`,
      );
    }
  }

  return { rows, problems };
}
