import { resolve } from 'node:path';
import { collectComponentCases } from '../contracts/component-cases.mjs';
import { createVisualFixtureMatrix, readVisualConfig } from '../visual/code-monster-ui-fixtures.mjs';
import {
  createCrossPlatformBaselineMatrix,
  readCrossPlatformBaselineManifest,
} from '../visual/cross-platform-baselines.mjs';
import { createShowcaseStateMatrix, readShowcaseStateConfig } from '../visual/showcase-state-cases.mjs';

const contractsDirectory = resolve(import.meta.dirname, '../../contracts');
const crossPlatformBaselinePath = resolve(contractsDirectory, 'cross-platform-visual-baselines.json');
const configPath = resolve(contractsDirectory, 'visual.config.json');
const stateConfigPath = resolve(contractsDirectory, 'visual.states.json');
const collected = collectComponentCases(contractsDirectory);
const errors = [...collected.errors];
let fixtures = [];
let crossPlatformBaselineFixtures = [];
let stateFixtures = [];

try {
  const visualConfig = readVisualConfig(configPath);
  fixtures = createVisualFixtureMatrix(collected.cases, visualConfig);
  crossPlatformBaselineFixtures = createCrossPlatformBaselineMatrix(
    collected.cases,
    visualConfig,
    readCrossPlatformBaselineManifest(crossPlatformBaselinePath),
  );
  stateFixtures = createShowcaseStateMatrix(readShowcaseStateConfig(stateConfigPath), visualConfig);
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
    `[ui-visual-fixtures] OK: ${fixtures.length} visual fixture permutation(s), ${stateFixtures.length} showcase state permutation(s), ${crossPlatformBaselineFixtures.length} cross-platform baseline fixture permutation(s).`,
  );
}
