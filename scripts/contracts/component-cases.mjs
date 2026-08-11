import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const kebabIdentifierPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const caseJsonSuffix = '.case.json';
const canonicalHtmlSuffix = '.html';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function formatPath(root, filePath) {
  return relative(root, filePath).replaceAll('\\', '/');
}

function validateCaseData({ basename, componentSlug, data, displayPath }) {
  const errors = [];
  const expectedId = `${componentSlug}-${basename}`;

  if (!isPlainObject(data)) {
    return [`${displayPath} must contain a JSON object.`];
  }
  const allowedKeys = new Set(['attributes', 'description', 'id', 'props', 'schemaVersion', 'slots']);
  for (const key of Object.keys(data)) {
    if (!allowedKeys.has(key)) {
      errors.push(`${displayPath} contains unsupported field ${key}.`);
    }
  }
  if (data.schemaVersion !== 1) {
    errors.push(`${displayPath} schemaVersion must be 1.`);
  }
  if (data.id !== expectedId) {
    errors.push(`${displayPath} id must be ${expectedId} (received ${data.id}).`);
  }
  if (!isPlainObject(data.props)) {
    errors.push(`${displayPath} props must be an object.`);
  }
  if (!isPlainObject(data.slots)) {
    errors.push(`${displayPath} slots must be an object.`);
  } else {
    for (const [slotName, value] of Object.entries(data.slots)) {
      if (!/^(?:default|[a-z][A-Za-z0-9]*)$/u.test(slotName)) {
        errors.push(`${displayPath} slot name ${slotName} must be default or lower camel case.`);
      }
      if (typeof value !== 'string') {
        errors.push(`${displayPath} slot ${slotName} must be a string.`);
      }
    }
  }
  if (data.attributes !== undefined && !isPlainObject(data.attributes)) {
    errors.push(`${displayPath} attributes must be an object when present.`);
  } else {
    for (const [attributeName, value] of Object.entries(data.attributes ?? {})) {
      if (!/^[^\s"'>/=]+$/u.test(attributeName)) {
        errors.push(`${displayPath} contains invalid attribute name ${attributeName}.`);
      }
      if (value !== null && !['boolean', 'number', 'string'].includes(typeof value)) {
        errors.push(`${displayPath} attribute ${attributeName} must be a scalar or null.`);
      }
    }
  }
  if (data.description !== undefined && (typeof data.description !== 'string' || data.description.trim() === '')) {
    errors.push(`${displayPath} description must be a non-empty string when present.`);
  }

  return errors;
}

export function collectComponentCases(contractsDirectory) {
  const errors = [];
  const cases = [];
  const seenCaseIds = new Map();

  if (!existsSync(contractsDirectory)) {
    return { cases, errors: [`Contracts directory does not exist: ${contractsDirectory}.`] };
  }

  const componentEntries = readdirSync(contractsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'schema')
    .sort((left, right) => left.name.localeCompare(right.name));

  for (const componentEntry of componentEntries) {
    const componentSlug = componentEntry.name;
    if (!kebabIdentifierPattern.test(componentSlug)) {
      errors.push(`Component contract directory must use lowercase kebab-case: ${componentSlug}.`);
      continue;
    }

    const casesDirectory = join(contractsDirectory, componentSlug, 'cases');
    if (!existsSync(casesDirectory)) {
      errors.push(`${componentSlug} contract is missing its cases directory.`);
      continue;
    }

    const entries = readdirSync(casesDirectory, { withFileTypes: true });
    const caseBasenames = new Set();
    const htmlBasenames = new Set();

    for (const entry of entries) {
      if (!entry.isFile()) {
        errors.push(`${formatPath(contractsDirectory, join(casesDirectory, entry.name))} must be a file.`);
      } else if (entry.name.endsWith(caseJsonSuffix)) {
        caseBasenames.add(entry.name.slice(0, -caseJsonSuffix.length));
      } else if (entry.name.endsWith(canonicalHtmlSuffix)) {
        htmlBasenames.add(entry.name.slice(0, -canonicalHtmlSuffix.length));
      } else {
        errors.push(
          `${formatPath(contractsDirectory, join(casesDirectory, entry.name))} is not a supported case file.`,
        );
      }
    }

    const basenames = [...new Set([...caseBasenames, ...htmlBasenames])].sort();
    for (const basename of basenames) {
      if (!kebabIdentifierPattern.test(basename)) {
        errors.push(`${componentSlug}/cases/${basename} must use a lowercase kebab-case basename.`);
      }

      const casePath = join(casesDirectory, `${basename}${caseJsonSuffix}`);
      const htmlPath = join(casesDirectory, `${basename}${canonicalHtmlSuffix}`);
      if (!caseBasenames.has(basename)) {
        errors.push(`${formatPath(contractsDirectory, htmlPath)} is missing its paired ${basename}${caseJsonSuffix}.`);
        continue;
      }
      if (!htmlBasenames.has(basename)) {
        errors.push(
          `${formatPath(contractsDirectory, casePath)} is missing its paired ${basename}${canonicalHtmlSuffix}.`,
        );
        continue;
      }

      const displayPath = formatPath(contractsDirectory, casePath);
      let data;
      try {
        data = JSON.parse(readFileSync(casePath, 'utf8'));
      } catch (error) {
        errors.push(`${displayPath} is not valid JSON: ${error.message}`);
        continue;
      }

      const caseErrors = validateCaseData({ basename, componentSlug, data, displayPath });
      errors.push(...caseErrors);

      const canonicalHtml = readFileSync(htmlPath, 'utf8');
      if (canonicalHtml.trim() === '') {
        errors.push(`${formatPath(contractsDirectory, htmlPath)} must not be empty.`);
      }

      if (typeof data.id === 'string') {
        const previousPath = seenCaseIds.get(data.id);
        if (previousPath) {
          errors.push(`Duplicate component case id ${data.id}: ${previousPath} and ${displayPath}.`);
        } else {
          seenCaseIds.set(data.id, displayPath);
        }
      }

      cases.push({
        basename,
        canonicalHtml,
        componentSlug,
        data,
        htmlPath,
        id: data.id,
        inputPath: casePath,
      });
    }
  }

  return { cases, errors };
}
