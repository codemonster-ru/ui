import { resolve } from 'node:path';
import { collectComponentCases } from '../contracts/component-cases.mjs';

const contractsDirectory = resolve(import.meta.dirname, '../../contracts');
const result = collectComponentCases(contractsDirectory);

if (result.errors.length > 0) {
  console.error(`[ui-contract-cases] FAILED with ${result.errors.length} error(s):`);
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`[ui-contract-cases] OK: ${result.cases.length} canonical component case(s).`);
}
