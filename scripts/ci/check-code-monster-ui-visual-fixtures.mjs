import { resolve } from 'node:path';
import { collectComponentCases } from '../contracts/component-cases.mjs';
import { readVisualConfig } from '../visual/code-monster-ui-fixtures.mjs';
import {
  createCrossPlatformBaselineMatrix,
  readCrossPlatformBaselineManifest,
} from '../visual/cross-platform-baselines.mjs';

const contractsDirectory = resolve(import.meta.dirname, '../../contracts');
const crossPlatformBaselinePath = resolve(contractsDirectory, 'cross-platform-visual-baselines.json');
const configPath = resolve(contractsDirectory, 'visual.config.json');
const collected = collectComponentCases(contractsDirectory);
const errors = [...collected.errors];
let crossPlatformBaselineFixtures = [];

try {
  const visualConfig = readVisualConfig(configPath);
  crossPlatformBaselineFixtures = createCrossPlatformBaselineMatrix(
    collected.cases,
    visualConfig,
    readCrossPlatformBaselineManifest(crossPlatformBaselinePath),
  );
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
  console.log(
    `[ui-visual-fixtures] OK: ${crossPlatformBaselineFixtures.length} cross-platform baseline fixture permutation(s).`,
  );
}
