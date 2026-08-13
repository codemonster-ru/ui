import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { collectComponentCases } from './component-cases.mjs';

const identifierPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const actionNames = new Set(['click', 'focus', 'press', 'setValue', 'submit']);
const expectationNames = new Set(['attribute', 'eventCount', 'focus', 'formValue', 'validity', 'visible']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function displayPath(root, filePath) {
  return relative(root, filePath).replaceAll('\\', '/');
}

function validateStep(step, path, index) {
  const label = `${path} step ${index + 1}`;
  if (!isPlainObject(step)) {
    return [`${label} must be an object.`];
  }

  const hasAction = typeof step.action === 'string';
  const hasExpectation = typeof step.expect === 'string';
  if (hasAction === hasExpectation) {
    return [`${label} must define exactly one action or expect value.`];
  }

  const errors = [];
  if (hasAction && !actionNames.has(step.action)) {
    errors.push(`${label} uses unsupported action ${step.action}.`);
  }
  if (hasExpectation && !expectationNames.has(step.expect)) {
    errors.push(`${label} uses unsupported expectation ${step.expect}.`);
  }
  if (typeof step.target !== 'string' || !identifierPattern.test(step.target)) {
    errors.push(`${label} target must use lowercase kebab-case.`);
  }
  if ((step.action === 'press' && typeof step.key !== 'string')
    || (step.action === 'setValue' && typeof step.value !== 'string')) {
    errors.push(`${label} is missing its action value.`);
  }
  if (step.expect === 'attribute'
    && (typeof step.name !== 'string' || (step.value !== null && typeof step.value !== 'string'))) {
    errors.push(`${label} attribute expectation requires a name and string or null value.`);
  }
  if (step.expect === 'eventCount'
    && (typeof step.name !== 'string' || !Number.isInteger(step.count) || step.count < 0)) {
    errors.push(`${label} eventCount expectation requires a name and non-negative count.`);
  }
  if (step.expect === 'formValue'
    && (typeof step.name !== 'string' || (step.value !== null && typeof step.value !== 'string'))) {
    errors.push(`${label} formValue expectation requires a name and string or null value.`);
  }
  if (['focus', 'validity', 'visible'].includes(step.expect) && typeof step.value !== 'boolean') {
    errors.push(`${label} ${step.expect} expectation requires a boolean value.`);
  }

  return errors;
}

export function collectBehaviorScenarios(contractsDirectory) {
  const errors = [];
  const scenarios = [];
  const cases = collectComponentCases(contractsDirectory);
  const caseIds = new Set(cases.cases.map((entry) => entry.id));

  for (const component of readdirSync(contractsDirectory, { withFileTypes: true })) {
    if (!component.isDirectory() || component.name === 'schema') {
      continue;
    }

    const behaviorDirectory = join(contractsDirectory, component.name, 'behavior');
    if (!existsSync(behaviorDirectory)) {
      continue;
    }

    for (const entry of readdirSync(behaviorDirectory, { withFileTypes: true })) {
      const path = join(behaviorDirectory, entry.name);
      const shownPath = displayPath(contractsDirectory, path);
      if (!entry.isFile() || !entry.name.endsWith('.scenario.json')) {
        errors.push(`${shownPath} must be a *.scenario.json file.`);
        continue;
      }

      let scenario;
      try {
        scenario = JSON.parse(readFileSync(path, 'utf8'));
      } catch (error) {
        errors.push(`${shownPath} is not valid JSON: ${error.message}`);
        continue;
      }

      const basename = entry.name.slice(0, -'.scenario.json'.length);
      const expectedId = `${component.name}-${basename}`;
      if (!isPlainObject(scenario)) {
        errors.push(`${shownPath} must contain a JSON object.`);
        continue;
      }
      if (scenario.schemaVersion !== 1) {
        errors.push(`${shownPath} schemaVersion must be 1.`);
      }
      if (scenario.id !== expectedId) {
        errors.push(`${shownPath} id must be ${expectedId} (received ${scenario.id}).`);
      }
      if (!caseIds.has(scenario.case)) {
        errors.push(`${shownPath} references unknown case ${scenario.case}.`);
      }
      if (!Array.isArray(scenario.steps) || scenario.steps.length === 0) {
        errors.push(`${shownPath} steps must be a non-empty array.`);
      } else {
        scenario.steps.forEach((step, index) => errors.push(...validateStep(step, shownPath, index)));
      }

      scenarios.push({ componentSlug: component.name, data: scenario, inputPath: path });
    }
  }

  return { errors, scenarios };
}
