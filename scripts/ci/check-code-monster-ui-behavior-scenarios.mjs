import { resolve } from 'node:path';
import { collectBehaviorScenarios } from '../contracts/behavior-scenarios.mjs';

const result = collectBehaviorScenarios(resolve(import.meta.dirname, '../../contracts'));

if (result.errors.length > 0) {
  console.error(`[ui-behavior-scenarios] FAILED with ${result.errors.length} error(s):`);
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`[ui-behavior-scenarios] OK: ${result.scenarios.length} behavior scenario(s).`);
}
