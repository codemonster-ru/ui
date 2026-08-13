import { isDeepStrictEqual } from 'node:util';
import { parseFragment } from 'parse5';

const htmlNamespace = 'http://www.w3.org/1999/xhtml';
const booleanAttributes = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'inert',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
]);
const idReferenceAttributes = new Set([
  'aria-activedescendant',
  'aria-controls',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'aria-flowto',
  'aria-labelledby',
  'aria-owns',
  'for',
  'form',
  'list',
]);

function isFrameworkAttribute(name) {
  return (
    name === 'data-reactroot' ||
    name === 'ng-version' ||
    /^data-v-[a-z0-9-]+$/u.test(name) ||
    /^_ng(?:content|host)-[a-z0-9-]+$/u.test(name)
  );
}

function walkNodes(node, visit) {
  visit(node);
  const children = node.tagName === 'template' ? node.content?.childNodes : node.childNodes;
  for (const child of children ?? []) {
    walkNodes(child, visit);
  }
}

function createGeneratedIdAliases(fragment) {
  const aliases = new Map();
  walkNodes(fragment, (node) => {
    const id = node.attrs?.find(({ name }) => name === 'id')?.value;
    if (!id) {
      return;
    }
    if (aliases.has(id)) {
      throw new Error(`Cannot normalize duplicate generated id ${id}.`);
    }
    aliases.set(id, `$generated-id-${aliases.size + 1}`);
  });
  return aliases;
}

function splitCssAtTopLevel(value, delimiter) {
  const parts = [];
  let current = '';
  let depth = 0;
  let escaped = false;
  let quote = null;

  for (const character of value) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === '\\') {
      current += character;
      escaped = true;
      continue;
    }
    if (quote) {
      current += character;
      if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      current += character;
      quote = character;
      continue;
    }
    if (character === '(') {
      depth += 1;
    } else if (character === ')' && depth > 0) {
      depth -= 1;
    }
    if (character === delimiter && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += character;
    }
  }
  parts.push(current);
  return parts;
}

function normalizeStyle(value) {
  const declarations = [];
  for (const sourceDeclaration of splitCssAtTopLevel(value, ';')) {
    const declaration = sourceDeclaration.trim();
    if (!declaration) {
      continue;
    }
    const [propertySource, ...valueParts] = splitCssAtTopLevel(declaration, ':');
    if (valueParts.length === 0) {
      return value.trim();
    }
    const property = propertySource.trim();
    const normalizedProperty = property.startsWith('--') ? property : property.toLowerCase();
    declarations.push([normalizedProperty, valueParts.join(':').trim()]);
  }
  declarations.sort(([left], [right]) => left.localeCompare(right));
  return declarations.map(([property, declarationValue]) => `${property}: ${declarationValue}`).join('; ');
}

function replaceIdReferences(value, aliases) {
  return value
    .trim()
    .split(/\s+/u)
    .map((token) => aliases.get(token) ?? token)
    .join(' ');
}

function normalizeAttributeValue(attribute, aliases) {
  const { name } = attribute;
  if (booleanAttributes.has(name)) {
    return true;
  }
  if (name === 'class') {
    return [...new Set(attribute.value.split(/\s+/u).filter(Boolean))].sort().join(' ');
  }
  if (name === 'style') {
    return normalizeStyle(attribute.value);
  }
  if (aliases) {
    if (name === 'id') {
      return aliases.get(attribute.value) ?? attribute.value;
    }
    if (idReferenceAttributes.has(name)) {
      return replaceIdReferences(attribute.value, aliases);
    }
    if (name === 'href' && attribute.value.startsWith('#')) {
      const target = attribute.value.slice(1);
      return `#${aliases.get(target) ?? target}`;
    }
  }
  return attribute.value;
}

function normalizeNode(node, context) {
  if (node.nodeName === '#comment') {
    return null;
  }
  if (node.nodeName === '#text') {
    if (/^\s*$/u.test(node.value)) {
      return null;
    }
    return { type: 'text', value: node.value.replaceAll('\r\n', '\n') };
  }
  if (node.nodeName === '#document-fragment') {
    return {
      type: 'fragment',
      children: node.childNodes.map((child) => normalizeNode(child, context)).filter(Boolean),
    };
  }

  const attributes = {};
  for (const attribute of [...(node.attrs ?? [])].sort((left, right) => left.name.localeCompare(right.name))) {
    if (context.ignoreFrameworkAttributes && isFrameworkAttribute(attribute.name)) {
      continue;
    }
    attributes[attribute.name] = normalizeAttributeValue(attribute, context.generatedIdAliases);
  }

  const sourceChildren = node.tagName === 'template' ? node.content?.childNodes : node.childNodes;
  const normalized = {
    type: 'element',
    name: node.tagName,
    attributes,
    children: (sourceChildren ?? []).map((child) => normalizeNode(child, context)).filter(Boolean),
  };
  if (node.namespaceURI && node.namespaceURI !== htmlNamespace) {
    normalized.namespace = node.namespaceURI;
  }
  return normalized;
}

function parseHtmlFragment(html, label) {
  const parseErrors = [];
  const fragment = parseFragment(html, {
    onParseError(error) {
      parseErrors.push(error.code);
    },
  });
  if (parseErrors.length > 0) {
    throw new SyntaxError(`${label} contains invalid HTML: ${[...new Set(parseErrors)].join(', ')}.`);
  }
  return fragment;
}

export function normalizeSignificantDom(
  html,
  { ignoreFrameworkAttributes = true, label = 'HTML fixture', normalizeGeneratedIds = false } = {},
) {
  if (typeof html !== 'string') {
    throw new TypeError(`${label} must be a string.`);
  }
  const fragment = parseHtmlFragment(html, label);
  const generatedIdAliases = normalizeGeneratedIds ? createGeneratedIdAliases(fragment) : null;
  return normalizeNode(fragment, { generatedIdAliases, ignoreFrameworkAttributes });
}

function findFirstDifference(expected, actual, path = 'root') {
  if (isDeepStrictEqual(expected, actual)) {
    return null;
  }
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) {
      return `${path}.length: expected ${expected.length}, received ${actual.length}`;
    }
    for (let index = 0; index < expected.length; index += 1) {
      const difference = findFirstDifference(expected[index], actual[index], `${path}[${index}]`);
      if (difference) {
        return difference;
      }
    }
  }
  if (expected && actual && typeof expected === 'object' && typeof actual === 'object') {
    const keys = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort();
    for (const key of keys) {
      if (!Object.hasOwn(expected, key)) {
        return `${path}.${key}: unexpected value ${JSON.stringify(actual[key])}`;
      }
      if (!Object.hasOwn(actual, key)) {
        return `${path}.${key}: missing expected value ${JSON.stringify(expected[key])}`;
      }
      const difference = findFirstDifference(expected[key], actual[key], `${path}.${key}`);
      if (difference) {
        return difference;
      }
    }
  }
  return `${path}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`;
}

export function compareSignificantDom(expectedHtml, actualHtml, options) {
  const expected = normalizeSignificantDom(expectedHtml, { ...options, label: 'Expected HTML' });
  const actual = normalizeSignificantDom(actualHtml, { ...options, label: 'Actual HTML' });
  return {
    actual,
    difference: findFirstDifference(expected, actual),
    equal: isDeepStrictEqual(expected, actual),
    expected,
  };
}
