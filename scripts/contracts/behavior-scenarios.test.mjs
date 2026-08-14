import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { collectBehaviorScenarios } from './behavior-scenarios.mjs';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'codemonster-ui-behavior-'));
  mkdirSync(join(root, 'input/cases'), { recursive: true });
  mkdirSync(join(root, 'input/behavior'), { recursive: true });
  writeFileSync(join(root, 'input/cases/default.case.json'), '{"schemaVersion":1,"id":"input-default","props":{},"slots":{}}\n');
  writeFileSync(join(root, 'input/cases/default.html'), '<input aria-label="Value">\n');
  return root;
}

test('collects a scenario tied to a canonical case', () => {
  const root = fixture();
  try {
    writeFileSync(join(root, 'input/behavior/submit.scenario.json'), JSON.stringify({
      schemaVersion: 1,
      id: 'input-submit',
      case: 'input-default',
      steps: [
        { action: 'submit', target: 'form' },
        { expect: 'formValue', target: 'form', name: 'value', value: 'saved' },
        { expect: 'text', target: 'status', value: 'Saved' },
      ],
    }));

    const result = collectBehaviorScenarios(root);
    assert.deepEqual(result.errors, []);
    assert.equal(result.scenarios.length, 1);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

test('reports unknown cases and incomplete steps', () => {
  const root = fixture();
  try {
    writeFileSync(join(root, 'input/behavior/submit.scenario.json'), JSON.stringify({
      schemaVersion: 1,
      id: 'input-submit',
      case: 'input-missing',
      steps: [{ action: 'setValue', target: 'control' }],
    }));

    const result = collectBehaviorScenarios(root);
    assert.deepEqual(result.errors, [
      'input/behavior/submit.scenario.json references unknown case input-missing.',
      'input/behavior/submit.scenario.json step 1 is missing its action value.',
    ]);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});
