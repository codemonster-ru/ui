import axe from 'axe-core';
import { JSDOM } from 'jsdom';

const idReferenceAttributes = [
  'aria-activedescendant',
  'aria-controls',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'aria-flowto',
  'aria-labelledby',
  'aria-owns',
  'for',
];

function elementPath(element) {
  const parts = [];
  let current = element;
  while (current?.nodeType === 1 && current.tagName.toLowerCase() !== 'body') {
    const tagName = current.tagName.toLowerCase();
    const siblings = [...current.parentElement.children].filter((sibling) => sibling.tagName === current.tagName);
    const suffix = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(current) + 1})` : '';
    parts.unshift(`${tagName}${suffix}`);
    current = current.parentElement;
  }
  return parts.join(' > ');
}

function createStructuralViolation({ element, help, id, message }) {
  return {
    help,
    id,
    impact: 'serious',
    nodes: [
      {
        failureSummary: message,
        target: [elementPath(element)],
      },
    ],
    source: 'contract',
  };
}

function collectStructuralViolations(document) {
  const violations = [];
  const elementsById = new Map();

  for (const element of document.body.querySelectorAll('[id]')) {
    const id = element.getAttribute('id');
    const previous = elementsById.get(id);
    if (previous) {
      violations.push(
        createStructuralViolation({
          element,
          help: 'IDs must be unique inside a component fixture',
          id: 'cm-duplicate-id',
          message: `Duplicate id ${JSON.stringify(id)} also appears at ${elementPath(previous)}.`,
        }),
      );
    } else {
      elementsById.set(id, element);
    }
  }

  for (const element of document.body.querySelectorAll('*')) {
    const tabindex = element.getAttribute('tabindex');
    if (tabindex !== null && Number.parseInt(tabindex, 10) > 0) {
      violations.push(
        createStructuralViolation({
          element,
          help: 'Positive tabindex values must not control component focus order',
          id: 'cm-positive-tabindex',
          message: `Positive tabindex ${JSON.stringify(tabindex)} changes the natural focus order.`,
        }),
      );
    }

    for (const attributeName of idReferenceAttributes) {
      const value = element.getAttribute(attributeName);
      if (!value) {
        continue;
      }
      for (const reference of value.trim().split(/\s+/u)) {
        if (!elementsById.has(reference)) {
          violations.push(
            createStructuralViolation({
              element,
              help: 'Component accessibility relationships must resolve inside the fixture',
              id: 'cm-unresolved-id-reference',
              message: `${attributeName} references missing id ${JSON.stringify(reference)}.`,
            }),
          );
        }
      }
    }
  }

  return violations;
}

function normalizeAxeViolation(violation) {
  return {
    help: violation.help,
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => ({
      failureSummary: node.failureSummary,
      target: node.target.map((target) => String(target)),
    })),
    source: 'axe',
  };
}

export async function analyzeAccessibility(html, { label = 'HTML fixture' } = {}) {
  if (typeof html !== 'string') {
    throw new TypeError(`${label} must be a string.`);
  }

  const dom = new JSDOM(
    `<!doctype html><html lang="en"><head><title>${label}</title></head><body>${html}</body></html>`,
    {
      runScripts: 'outside-only',
    },
  );
  try {
    dom.window.eval(axe.source);
    const axeResult = await dom.window.axe.run(dom.window.document.body, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      },
      rules: {
        'color-contrast': { enabled: false },
        'target-size': { enabled: false },
      },
    });

    const violations = [
      ...collectStructuralViolations(dom.window.document),
      ...axeResult.violations.map(normalizeAxeViolation),
    ].sort((left, right) => left.id.localeCompare(right.id));

    return { label, violations };
  } finally {
    dom.window.close();
  }
}

export async function assertNoAccessibilityViolations(html, options) {
  const result = await analyzeAccessibility(html, options);
  if (result.violations.length === 0) {
    return result;
  }

  const details = result.violations
    .map((violation) => {
      const targets = violation.nodes.flatMap(({ target }) => target).join(', ');
      return `${violation.id} at ${targets}: ${violation.help}`;
    })
    .join('\n');
  throw new Error(`${result.label} has ${result.violations.length} accessibility violation(s):\n${details}`);
}
