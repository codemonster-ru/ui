import { resolve } from 'node:path';
import { collectComponentCases } from '../contracts/component-cases.mjs';
import { createVisualFixtureMatrix, readVisualConfig } from '../visual/code-monster-ui-fixtures.mjs';

const contractsDirectory = resolve(import.meta.dirname, '../../contracts');
const configPath = resolve(contractsDirectory, 'visual.config.json');
const collected = collectComponentCases(contractsDirectory);
const errors = [...collected.errors];
let fixtures = [];

try {
  fixtures = createVisualFixtureMatrix(collected.cases, readVisualConfig(configPath));
} catch (error) {
  errors.push(error.message);
}

if (errors.length > 0) {
  console.error(`[ui-visual-fixtures] FAILED with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`[ui-visual-fixtures] OK: ${fixtures.length} visual fixture permutation(s).`);
}
