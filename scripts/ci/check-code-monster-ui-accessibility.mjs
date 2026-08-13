import { resolve } from 'node:path';
import { analyzeAccessibility } from '../contracts/accessibility.mjs';
import { collectComponentCases } from '../contracts/component-cases.mjs';

const contractsDirectory = resolve(import.meta.dirname, '../../contracts');
const collected = collectComponentCases(contractsDirectory);
const errors = [...collected.errors];

for (const componentCase of collected.cases) {
  const result = await analyzeAccessibility(componentCase.canonicalHtml, { label: componentCase.id });
  for (const violation of result.violations) {
    const targets = violation.nodes.flatMap(({ target }) => target).join(', ');
    errors.push(`${componentCase.id}: ${violation.id} at ${targets}: ${violation.help}.`);
  }
}

if (errors.length > 0) {
  console.error(`[ui-accessibility] FAILED with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`[ui-accessibility] OK: ${collected.cases.length} canonical component case(s).`);
}
