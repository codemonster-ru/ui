// Negative controls for the release audit gate (M35.6c).
//
// Every case starts from real npm output captured for this repository
// (fixtures/audit-gate, see its README) and changes one thing. The real
// lockfile and npm are never touched: the gate's decision function takes the
// npm runs and the lockfile text as plain data.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  AUDIT_RELEASE_SCRIPT,
  MAX_EXCEPTION_DAYS,
  checkComposition,
  commands,
  evaluate,
  exceptionsPath,
  repositoryRoot,
} from './audit-gate.mjs';

const fixtures = resolve(repositoryRoot, 'scripts/ci/fixtures/audit-gate');
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const realExceptions = readJson(exceptionsPath);
const ACCEPTED_ON = new Date('2026-10-11T12:00:00Z');

/** Fresh, mutable copies of the captured inputs. */
function inputs() {
  return {
    production: readJson(resolve(fixtures, 'production-audit.json')),
    productionStatus: 0,
    full: readJson(resolve(fixtures, 'full-audit.json')),
    fullStatus: 1,
    lock: readJson(resolve(fixtures, 'lockfile.json')),
    versions: readJson(resolve(fixtures, 'braces-versions.json')),
    micromatchVersions: readJson(resolve(fixtures, 'micromatch-versions.json')),
    exceptions: structuredClone(realExceptions),
    now: ACCEPTED_ON,
  };
}

/** Runs the gate on `inputs()` after `change` edits them. Raw overrides replace a whole npm run. */
function gate(change = () => {}, raw = {}) {
  const data = inputs();
  change(data);
  const run = (json, status) => ({ status, stdout: typeof json === 'string' ? json : JSON.stringify(json) });
  return evaluate({
    production: 'production' in raw ? raw.production : run(data.production, data.productionStatus),
    full: 'full' in raw ? raw.full : run(data.full, data.fullStatus),
    registry:
      'registry' in raw ? raw.registry : { braces: run(data.versions, 0), micromatch: run(data.micromatchVersions, 0) },
    lockfile: 'lockfile' in raw ? raw.lockfile : JSON.stringify(data.lock),
    exceptions: data.exceptions,
    now: data.now,
  });
}

function assertFails(result, pattern) {
  assert.equal(result.ok, false, 'the gate passed');
  assert.ok(
    result.problems.some((problem) => pattern.test(problem)),
    `no problem matches ${pattern}:\n${result.problems.join('\n')}`,
  );
}

const braces = (data) => data.full.vulnerabilities.braces;
const bracesAdvisory = (data) => braces(data).via[0];

/** Adds a vulnerability entry with one advisory of its own and keeps the metadata consistent. */
function addEntry(data, name, severity, overrides = {}) {
  data.full.vulnerabilities[name] = {
    name,
    severity,
    isDirect: false,
    via: [
      {
        source: 9_000_001,
        name,
        dependency: name,
        title: `${name} test advisory`,
        url: 'https://github.com/advisories/GHSA-xxxx-xxxx-xxxx',
        severity,
        cwe: [],
        cvss: { score: 9, vectorString: null },
        range: '<99.0.0',
      },
    ],
    effects: [],
    range: '<99.0.0',
    nodes: [`node_modules/${name}`],
    fixAvailable: true,
    ...overrides,
  };
  data.full.metadata.vulnerabilities[severity] += 1;
  data.full.metadata.vulnerabilities.total += 1;
  data.lock.packages[`node_modules/${name}`] = { version: '1.0.0', dev: true };
}

test('the captured audit of this repository passes with the braces exception', () => {
  const result = gate();
  assert.deepEqual(result.problems, []);
  assert.equal(result.ok, true);
  assert.deepEqual(result.checks.sort(), ['full-audit', 'lockfile', 'production-audit', 'registry']);
  assert.deepEqual(
    result.accepted.map((item) => item.name).sort(),
    ['braces', ...realExceptions.exceptions[0].propagatesTo].sort(),
  );
  assert.deepEqual(result.rejected, []);
  // Moderate and low findings stay visible but do not block, as under --audit-level=high.
  assert.ok(result.belowThreshold.every((item) => ['info', 'low', 'moderate'].includes(item.severity)));
});

test('the exceptions file is valid, documented and bounded', () => {
  const [exception] = realExceptions.exceptions;
  assert.equal(realExceptions.exceptions.length, 1);
  assert.equal(exception.advisory, 'GHSA-vfj7-8cjw-p6xm');
  assert.equal(exception.package, 'braces');
  assert.equal(exception.scope, 'dev');
  assert.ok(existsSync(resolve(repositoryRoot, exception.documentation)));
  const days = (Date.parse(exception.reviewBy) - Date.parse(exception.acceptedAt)) / 86_400_000;
  assert.ok(days > 0 && days <= MAX_EXCEPTION_DAYS);
  const doc = readFileSync(resolve(repositoryRoot, exception.documentation), 'utf8');
  for (const fact of [exception.advisory, exception.reviewBy, exception.acceptedAt, 'micromatch@4.0.8']) {
    assert.ok(doc.includes(fact), `the documentation does not state ${fact}`);
  }
});

test('package.json runs the strict production audit and the gate', () => {
  const { scripts } = readJson(resolve(repositoryRoot, 'package.json'));
  assert.deepEqual(checkComposition(scripts), []);
  assert.equal(scripts['audit:release'], AUDIT_RELEASE_SCRIPT);
  assert.ok(commands.production.includes('--omit=dev'));
  assert.ok(commands.full.includes('--include=dev'));
});

// --- Negative controls -------------------------------------------------------

test('fails on an additional high advisory', () => {
  assertFails(
    gate((data) => addEntry(data, 'left-pad', 'high')),
    /left-pad \(high\).*has no exception/,
  );
});

test('fails on an additional critical advisory', () => {
  assertFails(
    gate((data) => addEntry(data, 'left-pad', 'critical')),
    /left-pad \(critical\).*has no exception/,
  );
});

test('fails on another advisory for braces, even below high', () => {
  for (const severity of ['moderate', 'high']) {
    const result = gate((data) => {
      braces(data).via.push({
        ...bracesAdvisory(data),
        source: 9_000_002,
        url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc',
        severity,
        range: '<=3.0.3',
      });
    });
    assertFails(result, /GHSA-aaaa-bbbb-cccc .* on excepted package braces is not covered/);
  }
});

test('fails when the braces advisory changes severity or identity', () => {
  assertFails(
    gate((data) => {
      bracesAdvisory(data).severity = 'critical';
      for (const entry of Object.values(data.full.vulnerabilities)) {
        if (entry.severity === 'high') entry.severity = 'critical';
      }
      const counts = data.full.metadata.vulnerabilities;
      counts.critical += counts.high;
      counts.high = 0;
    }),
    /has no exception/,
  );
  assertFails(
    gate((data) => {
      bracesAdvisory(data).source = 1;
    }),
    /has no exception/,
  );
});

test('fails on a braces version outside the exception', () => {
  assertFails(
    gate((data) => {
      data.lock.packages['node_modules/braces'].version = '3.0.2';
    }),
    /node_modules\/braces is 3\.0\.2, the exception covers 3\.0\.3/,
  );
  assertFails(
    gate((data) => {
      braces(data).nodes.push('node_modules/fast-glob/node_modules/braces');
      data.lock.packages['node_modules/fast-glob/node_modules/braces'] = { version: '3.0.3', dev: true };
    }),
    /braces is installed at .*fast-glob\/node_modules\/braces/,
  );
});

test('fails when braces reaches the production graph', () => {
  assertFails(
    gate((data) => {
      data.production.vulnerabilities.braces = structuredClone(braces(data));
      data.production.vulnerabilities.braces.effects = [];
      data.production.metadata.vulnerabilities.high = 1;
      data.production.metadata.vulnerabilities.total = 1;
      data.productionStatus = 1;
    }),
    /production audit: 1 vulnerabilities/,
  );
  assertFails(
    gate((data) => {
      delete data.lock.packages['node_modules/braces'].dev;
    }),
    /node_modules\/braces is not a dev-only dependency/,
  );
  assertFails(
    gate((data) => {
      delete data.lock.packages['node_modules/braces'].dev;
      data.lock.packages['node_modules/braces'].devOptional = true;
    }),
    /node_modules\/braces is not a dev-only dependency/,
  );
  assertFails(
    gate((data) => {
      delete data.lock.packages['node_modules/stylelint'].dev;
    }),
    /stylelint: node_modules\/stylelint is not a dev-only dependency/,
  );
});

test('fails when the dependency path changes', () => {
  // A new consumer of the vulnerable chain.
  assertFails(
    gate((data) => {
      data.full.vulnerabilities.micromatch.effects.push('eslint');
      data.full.vulnerabilities.eslint = {
        name: 'eslint',
        severity: 'high',
        isDirect: true,
        via: ['micromatch'],
        effects: [],
        range: '*',
        nodes: ['node_modules/eslint'],
        fixAvailable: false,
      };
      data.full.metadata.vulnerabilities.high += 1;
      data.full.metadata.vulnerabilities.total += 1;
      data.lock.packages['node_modules/eslint'] = { version: '10.0.0', dev: true };
    }),
    /eslint reaches GHSA-vfj7-8cjw-p6xm but is not in its propagatesTo list/,
  );
  // A second direct dependent of braces.
  assertFails(
    gate((data) => {
      data.lock.packages['node_modules/expand-glob'] = {
        version: '1.0.0',
        dev: true,
        dependencies: { braces: '^3.0.0' },
      };
    }),
    /braces is required by node_modules\/expand-glob@1\.0\.0, node_modules\/micromatch@4\.0\.8/,
  );
  // micromatch moved to another version.
  assertFails(
    gate((data) => {
      data.lock.packages['node_modules/micromatch'].version = '4.0.9';
    }),
    /expected node_modules\/micromatch@4\.0\.8/,
  );
  // A package that no longer reaches braces.
  assertFails(
    gate((data) => {
      data.full.vulnerabilities.stylelint.via = data.full.vulnerabilities.stylelint.via.filter(
        (via) => via !== 'micromatch',
      );
      data.full.vulnerabilities.micromatch.effects = data.full.vulnerabilities.micromatch.effects.filter(
        (name) => name !== 'stylelint',
      );
      data.exceptions.exceptions[0].propagatesTo.push('stylelint-config-unused');
    }),
    /dependency path changed \(no longer reached: stylelint-config-unused/,
  );
  // An aggregated entry with a high advisory of its own.
  assertFails(
    gate((data) => {
      const own = {
        ...bracesAdvisory(data),
        source: 9_000_003,
        name: 'micromatch',
        dependency: 'micromatch',
        url: 'https://github.com/advisories/GHSA-mmmm-mmmm-mmmm',
        range: '<5.0.0',
      };
      data.full.vulnerabilities.micromatch.via.push(own);
    }),
    /micromatch \(high\): GHSA-mmmm-mmmm-mmmm high in micromatch has no exception/,
  );
});

test('does not decide on npm fix suggestions, which change between identical runs', () => {
  // Consecutive audits of one unchanged tree returned all three of these for braces. Both
  // downgrades keep micromatch -> braces; the advisory range and the registry decide instead.
  for (const suggestion of [
    false,
    { name: 'markdownlint-cli2', version: '0.21.0', isSemVerMajor: true },
    { name: 'stylelint-config-standard', version: '15.0.1', isSemVerMajor: true },
  ]) {
    const result = gate((data) => (braces(data).fixAvailable = suggestion));
    assert.deepEqual(result.problems, []);
    assert.equal(result.notes.length, suggestion ? 1 : 0);
  }
});

test('fails when a fixed version appears', () => {
  assertFails(
    gate((data) => {
      braces(data).fixAvailable = true;
    }),
    /npm reports a fix for braces within the installed ranges/,
  );
  assertFails(
    gate((data) => {
      data.versions.push('3.0.4');
    }),
    /braces 3\.0\.4 is published; a fixed version may exist/,
  );
  assertFails(
    gate((data) => {
      data.micromatchVersions.push('4.0.9');
    }),
    /micromatch 4\.0\.9 is published; it may no longer require braces/,
  );
  assertFails(
    gate((data) => {
      bracesAdvisory(data).range = '<3.0.4';
    }),
    /has no exception/,
  );
});

test('fails once the exception expires', () => {
  assert.equal(gate((data) => (data.now = new Date('2027-01-11T23:59:59Z'))).ok, true);
  assertFails(
    gate((data) => (data.now = new Date('2027-01-12T00:00:00Z'))),
    /EXPIRED on 2027-01-11/,
  );
  assertFails(
    gate((data) => (data.exceptions.exceptions[0].reviewBy = '2027-12-31')),
    /review window exceeds/,
  );
});

test('fails when the exception is no longer needed', () => {
  assertFails(
    gate((data) => {
      for (const name of ['braces', ...data.exceptions.exceptions[0].propagatesTo]) {
        const { severity } = data.full.vulnerabilities[name];
        delete data.full.vulnerabilities[name];
        data.full.metadata.vulnerabilities[severity] -= 1;
        data.full.metadata.vulnerabilities.total -= 1;
      }
    }),
    /no longer reported for braces; the exception is not needed/,
  );
});

test('fails on malformed JSON', () => {
  assertFails(
    gate(() => {}, { full: { status: 1, stdout: '{"auditReportVersion": 2,' } }),
    /full audit: output is not JSON/,
  );
  assertFails(
    gate(() => {}, { production: { status: 0, stdout: 'npm WARN something' } }),
    /production audit: output is not JSON/,
  );
  assertFails(
    gate(() => {}, { lockfile: '{' }),
    /package-lock\.json: unusable/,
  );
  assertFails(
    gate(() => {}, { registry: { braces: { status: 0, stdout: '<html>' } } }),
    /registry versions of braces: output is not JSON/,
  );
  assertFails(
    gate((data) => {
      data.full.auditReportVersion = 1;
    }),
    /expected auditReportVersion 2/,
  );
});

test('fails when an advisory field is missing', () => {
  for (const field of ['url', 'source', 'severity', 'range', 'name', 'dependency']) {
    assertFails(
      gate((data) => {
        delete bracesAdvisory(data)[field];
      }),
      new RegExp(`advisory is missing or has an invalid "${field}"`),
    );
  }
  assertFails(
    gate((data) => {
      delete braces(data).nodes;
    }),
    /entry braces: missing nodes/,
  );
  assertFails(
    gate((data) => {
      delete data.exceptions.exceptions[0].reviewBy;
    }),
    /missing or invalid field "reviewBy"/,
  );
});

test('fails when npm audit fails', () => {
  assertFails(
    gate(() => {}, { full: { status: 2, stdout: '' } }),
    /full audit: npm exited with 2/,
  );
  assertFails(
    gate(() => {}, { full: { status: null, signal: 'SIGKILL', stdout: '' } }),
    /killed by SIGKILL/,
  );
  assertFails(
    gate(() => {}, { production: { error: new Error('spawn npm ENOENT') } }),
    /npm could not be run/,
  );
  assertFails(
    gate(() => {}, {
      full: { status: 1, stdout: JSON.stringify({ error: { code: 'ENOLOCK', summary: 'no lockfile' } }) },
    }),
    /npm reported an error/,
  );
  // Exit code and report disagree: something other than the audit decided the status.
  assertFails(
    gate((data) => (data.fullStatus = 0)),
    /exit 0 does not match/,
  );
  // Counts that do not add up.
  assertFails(
    gate((data) => {
      data.full.metadata.vulnerabilities.high -= 1;
    }),
    /metadata reports/,
  );
});

test('fails when an expected check is missing', () => {
  assertFails(
    gate(() => {}, { production: undefined }),
    /production audit: did not run/,
  );
  assertFails(
    gate(() => {}, { production: undefined }),
    /expected check did not complete: production-audit/,
  );
  assertFails(
    gate(() => {}, { full: undefined }),
    /expected check did not complete: full-audit/,
  );
  assertFails(
    gate(() => {}, { registry: {} }),
    /expected check did not complete: registry/,
  );
  assertFails(
    gate((data) => data, { registry: { braces: { status: 0, stdout: JSON.stringify(['3.0.3']) } } }),
    /registry versions of micromatch: did not run/,
  );

  const { scripts } = readJson(resolve(repositoryRoot, 'package.json'));
  const withScript = (name, value) => checkComposition({ ...scripts, [name]: value });
  assert.match(withScript('audit:release', 'npm audit --omit=dev').join('\n'), /audit:release must be exactly/);
  assert.match(
    withScript('audit:release', 'node ./scripts/ci/audit-gate.mjs').join('\n'),
    /audit:release must be exactly/,
  );
  assert.match(
    withScript('verify', scripts.verify.replace('npm run audit:release && ', '')).join('\n'),
    /verify no longer runs/,
  );
  assert.match(
    withScript('check', scripts.check.replace(' && npm run test:audit-gate', '')).join('\n'),
    /check no longer runs/,
  );
});
