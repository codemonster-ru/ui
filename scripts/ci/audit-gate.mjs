#!/usr/bin/env node
// Release audit gate (M35.6c).
//
// `npm audit` has no way to accept one advisory: `--audit-level=high` fails on
// every high advisory, and an advisory with no patched version (braces
// GHSA-vfj7-8cjw-p6xm) would keep the release audit red until it is withdrawn.
// This gate accepts exactly the advisories listed in audit-exceptions.json and
// fails closed on everything else:
//
//   - the production audit (`--omit=dev`) must be empty; no exception applies;
//   - the full audit must have no high or critical entry except one whose every
//     high or critical root advisory is a listed exception, on the listed
//     versions, reached only through the listed dependency path, dev only;
//   - npm audit aggregates: `micromatch`, `stylelint` and the rest are high only
//     because they depend on braces. Such an entry is accepted only if it is in
//     the exception's `propagatesTo` list and has no advisory of its own;
//   - any other advisory on the excepted package fails, whatever its severity;
//   - an exception that is expired, no longer needed, or whose package has a
//     newer version on the registry fails the gate, so it cannot outlive the
//     reason it was accepted. So does a newer release of the package that
//     requires it (it may have dropped the dependency) and `fixAvailable: true`;
//   - output npm did not produce as expected (exit code, malformed JSON,
//     missing fields, inconsistent counts) fails, rather than being read as
//     "no vulnerabilities".
//
// The policy and its review date are documented in docs/security-audit-exceptions.md.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const exceptionsPath = resolve(repositoryRoot, 'scripts/ci/audit-exceptions.json');

export const SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];
const BLOCKING = SEVERITIES.indexOf('high');
// An exception is reviewed at least this often; a longer window is refused.
export const MAX_EXCEPTION_DAYS = 120;
const DAY = 24 * 60 * 60 * 1000;

export const REQUIRED_CHECKS = ['production-audit', 'full-audit', 'lockfile', 'registry'];

/** The npm invocations the gate runs. */
export const commands = {
  production: ['audit', '--omit=dev', '--audit-level=info', '--json'],
  // `--include=dev` so a NODE_ENV=production shell cannot turn this into a second production audit.
  full: ['audit', '--include=dev', '--audit-level=info', '--json'],
  registry: (name) => ['view', name, 'versions', '--json'],
};

/** What `audit:release` must run, and what `verify` must contain. */
export const AUDIT_RELEASE_SCRIPT = 'npm audit --omit=dev && node ./scripts/ci/audit-gate.mjs';

export function checkComposition(scripts) {
  const problems = [];
  if (scripts?.['audit:release'] !== AUDIT_RELEASE_SCRIPT) {
    problems.push(
      `audit:release must be exactly ${JSON.stringify(AUDIT_RELEASE_SCRIPT)}, found ${JSON.stringify(scripts?.['audit:release'])}`,
    );
  }
  if (!(scripts?.verify ?? '').split(' && ').includes('npm run audit:release')) {
    problems.push('verify no longer runs npm run audit:release');
  }
  if (!(scripts?.check ?? '').split(' && ').includes('npm run test:audit-gate')) {
    problems.push('check no longer runs npm run test:audit-gate');
  }
  return problems;
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isDate = (value) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
const ghsaUrl = (id) => `https://github.com/advisories/${id}`;

const EXCEPTION_FIELDS = {
  advisory: (v) => typeof v === 'string' && /^GHSA(-[23456789cfghjmpqrvwx]{4}){3}$/.test(v),
  source: (v) => Number.isInteger(v) && v > 0,
  package: (v) => typeof v === 'string' && v.length > 0,
  versions: (v) => Array.isArray(v) && v.length > 0 && v.every((x) => semver.valid(x) === x),
  severity: (v) => SEVERITIES.includes(v),
  advisoryRange: (v) => typeof v === 'string' && v.length > 0,
  nodes: (v) => Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string' && x.length > 0),
  dependents: (v) =>
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((d) => isObject(d) && typeof d.path === 'string' && semver.valid(d.version) === d.version),
  propagatesTo: (v) => Array.isArray(v) && v.every((x) => typeof x === 'string' && x.length > 0),
  scope: (v) => v === 'dev',
  reason: (v) => typeof v === 'string' && v.trim().length > 0,
  acceptedAt: isDate,
  reviewBy: isDate,
  documentation: (v) => typeof v === 'string' && v.length > 0,
};

/** Validates the exceptions file. Returns the problems; an empty list means usable. */
export function validateExceptions(document, now) {
  const problems = [];
  if (!isObject(document) || document.schemaVersion !== 1 || !Array.isArray(document.exceptions)) {
    return ['audit-exceptions.json: expected { schemaVersion: 1, exceptions: [...] }'];
  }
  const unknownTop = Object.keys(document).filter((key) => !['schemaVersion', 'exceptions'].includes(key));
  if (unknownTop.length) problems.push(`audit-exceptions.json: unknown fields ${unknownTop.join(', ')}`);

  const seen = new Set();
  for (const [index, exception] of document.exceptions.entries()) {
    const label = `exception #${index} (${exception?.advisory ?? '?'})`;
    if (!isObject(exception)) {
      problems.push(`${label}: not an object`);
      continue;
    }
    for (const [field, valid] of Object.entries(EXCEPTION_FIELDS)) {
      if (!valid(exception[field])) problems.push(`${label}: missing or invalid field "${field}"`);
    }
    const unknown = Object.keys(exception).filter((key) => !(key in EXCEPTION_FIELDS));
    if (unknown.length) problems.push(`${label}: unknown fields ${unknown.join(', ')}`);
    if (seen.has(exception.advisory)) problems.push(`${label}: listed twice`);
    seen.add(exception.advisory);

    if (isDate(exception.acceptedAt) && isDate(exception.reviewBy)) {
      const accepted = Date.parse(exception.acceptedAt);
      const reviewBy = Date.parse(exception.reviewBy);
      if (reviewBy <= accepted) problems.push(`${label}: reviewBy must be after acceptedAt`);
      if (reviewBy - accepted > MAX_EXCEPTION_DAYS * DAY) {
        problems.push(`${label}: review window exceeds ${MAX_EXCEPTION_DAYS} days`);
      }
      if (accepted > now.getTime()) problems.push(`${label}: acceptedAt is in the future`);
      // reviewBy is the last day the exception is valid (UTC).
      if (now.getTime() >= reviewBy + DAY) {
        problems.push(
          `${label}: EXPIRED on ${exception.reviewBy}; review the advisory and renew or remove the exception`,
        );
      }
    }
  }
  return problems;
}

/** Parses one npm invocation. Returns { json } or { problem }. */
function parseInvocation(name, invocation, allowedStatuses) {
  if (!invocation) return { problem: `${name}: did not run` };
  if (invocation.error)
    return { problem: `${name}: npm could not be run (${invocation.error.message ?? invocation.error})` };
  if (invocation.signal) return { problem: `${name}: npm was killed by ${invocation.signal}` };
  if (!allowedStatuses.includes(invocation.status)) {
    return { problem: `${name}: npm exited with ${invocation.status}` };
  }
  let json;
  try {
    json = JSON.parse(invocation.stdout);
  } catch (error) {
    return { problem: `${name}: output is not JSON (${error.message})` };
  }
  if (isObject(json) && 'error' in json) {
    return { problem: `${name}: npm reported an error: ${JSON.stringify(json.error)}` };
  }
  return { json };
}

const ADVISORY_FIELDS = {
  source: (v) => Number.isInteger(v),
  name: (v) => typeof v === 'string' && v.length > 0,
  dependency: (v) => typeof v === 'string' && v.length > 0,
  title: (v) => typeof v === 'string',
  url: (v) => typeof v === 'string' && /^https:\/\/github\.com\/advisories\/GHSA(-[a-z0-9]{4}){3}$/.test(v),
  severity: (v) => SEVERITIES.includes(v),
  range: (v) => typeof v === 'string' && v.length > 0,
};

/** Structural validation of an audit report (auditReportVersion 2). */
function validateReport(name, report) {
  const problems = [];
  if (!isObject(report) || report.auditReportVersion !== 2) {
    return [`${name}: expected auditReportVersion 2`];
  }
  if (!isObject(report.vulnerabilities) || !isObject(report.metadata?.vulnerabilities)) {
    return [`${name}: missing vulnerabilities or metadata.vulnerabilities`];
  }

  const counted = Object.fromEntries(SEVERITIES.map((s) => [s, 0]));
  for (const [key, entry] of Object.entries(report.vulnerabilities)) {
    const label = `${name}: entry ${key}`;
    if (!isObject(entry) || entry.name !== key) {
      problems.push(`${label}: malformed entry`);
      continue;
    }
    if (!SEVERITIES.includes(entry.severity)) problems.push(`${label}: unknown severity ${entry.severity}`);
    else counted[entry.severity] += 1;
    if (!Array.isArray(entry.via) || entry.via.length === 0) problems.push(`${label}: missing via`);
    if (!Array.isArray(entry.effects)) problems.push(`${label}: missing effects`);
    if (!Array.isArray(entry.nodes) || entry.nodes.length === 0 || !entry.nodes.every((n) => typeof n === 'string')) {
      problems.push(`${label}: missing nodes`);
    }
    if (typeof entry.fixAvailable !== 'boolean' && !isObject(entry.fixAvailable)) {
      problems.push(`${label}: missing fixAvailable`);
    }
    for (const via of entry.via ?? []) {
      if (typeof via === 'string') {
        if (!(via in report.vulnerabilities)) problems.push(`${label}: via references unknown entry ${via}`);
        continue;
      }
      if (!isObject(via)) {
        problems.push(`${label}: malformed via item`);
        continue;
      }
      for (const [field, valid] of Object.entries(ADVISORY_FIELDS)) {
        if (!valid(via[field])) problems.push(`${label}: advisory is missing or has an invalid "${field}"`);
      }
    }
  }

  const declared = report.metadata.vulnerabilities;
  for (const severity of SEVERITIES) {
    if (declared[severity] !== counted[severity]) {
      problems.push(
        `${name}: metadata reports ${declared[severity]} ${severity}, entries contain ${counted[severity]}`,
      );
    }
  }
  const total = SEVERITIES.reduce((sum, s) => sum + counted[s], 0);
  if (declared.total !== total) problems.push(`${name}: metadata total ${declared.total} != ${total} entries`);
  return problems;
}

/** Every advisory an entry inherits, following `via` names through the report. */
function rootAdvisories(report, name, trail = new Set()) {
  if (trail.has(name)) return [];
  trail.add(name);
  const entry = report.vulnerabilities[name];
  return entry.via.flatMap((via) => (typeof via === 'string' ? rootAdvisories(report, via, trail) : [{ ...via }]));
}

const advisoryId = (advisory) => advisory.url.split('/').pop();
const rank = (severity) => SEVERITIES.indexOf(severity);

function matchesException(advisory, exception) {
  return (
    advisory.url === ghsaUrl(exception.advisory) &&
    advisory.source === exception.source &&
    advisory.name === exception.package &&
    advisory.dependency === exception.package &&
    advisory.severity === exception.severity &&
    advisory.range === exception.advisoryRange
  );
}

/** The lockfile node a package at `fromPath` resolves `name` to, by Node's lookup. */
function resolveNode(lockPackages, fromPath, name) {
  let base = fromPath;
  for (;;) {
    const candidate = base ? `${base}/node_modules/${name}` : `node_modules/${name}`;
    if (candidate in lockPackages) return candidate;
    if (!base) return null;
    const index = base.lastIndexOf('/node_modules/');
    base = index === -1 ? '' : base.slice(0, index);
  }
}

/** Every lockfile node that depends on `name`, with the node it resolves to. */
function dependentsOf(lockPackages, name) {
  const dependents = [];
  for (const [path, entry] of Object.entries(lockPackages)) {
    const declared = { ...entry.dependencies, ...entry.optionalDependencies, ...entry.peerDependencies };
    if (!(name in declared)) continue;
    dependents.push({ path, version: entry.version, resolved: resolveNode(lockPackages, path, name) });
  }
  return dependents;
}

/** `node_modules/a/node_modules/@scope/b` -> `@scope/b`. */
const packageNameOf = (path) => path.slice(path.lastIndexOf('node_modules/') + 'node_modules/'.length);

const isDevOnly = (lockEntry) =>
  lockEntry?.dev === true && !lockEntry.devOptional && !lockEntry.optional && !lockEntry.peer;

/**
 * Decides the gate.
 *
 *   production, full, registry  { status, stdout, error?, signal? } of the npm runs
 *                               (registry: keyed by package name)
 *   lockfile                    package-lock.json text
 *   exceptions                  parsed audit-exceptions.json
 *   now                         Date
 */
export function evaluate({ production, full, registry, lockfile, exceptions, now }) {
  const problems = [];
  const accepted = [];
  const rejected = [];
  const belowThreshold = [];
  const notes = [];
  const checks = new Set();

  if (!(now instanceof Date) || Number.isNaN(now.getTime())) problems.push('no valid current date');
  const exceptionProblems = validateExceptions(exceptions, now ?? new Date(NaN));
  problems.push(...exceptionProblems);
  const list = exceptionProblems.length ? [] : exceptions.exceptions;

  // 1. Production: strict, no exception applies.
  const prod = parseInvocation('production audit', production, [0, 1]);
  if (prod.problem) problems.push(prod.problem);
  else {
    const structure = validateReport('production audit', prod.json);
    problems.push(...structure);
    if (!structure.length) {
      for (const [name, entry] of Object.entries(prod.json.vulnerabilities)) {
        rejected.push({ scope: 'production', name, severity: entry.severity, reason: 'production dependency' });
      }
      if (prod.json.metadata.vulnerabilities.total !== 0 || production.status !== 0) {
        problems.push(
          `production audit: ${prod.json.metadata.vulnerabilities.total} vulnerabilities (exit ${production.status}); production allows none`,
        );
      }
      checks.add('production-audit');
    }
  }

  // 2. Lockfile.
  let lockPackages = null;
  try {
    const lock = JSON.parse(lockfile);
    if (!isObject(lock?.packages) || lock.lockfileVersion !== 3) throw new Error('expected lockfileVersion 3');
    lockPackages = lock.packages;
    checks.add('lockfile');
  } catch (error) {
    problems.push(`package-lock.json: unusable (${error.message})`);
  }

  // 3. Full audit.
  const fullRun = parseInvocation('full audit', full, [0, 1]);
  if (fullRun.problem) problems.push(fullRun.problem);
  else {
    const report = fullRun.json;
    const structure = validateReport('full audit', report);
    problems.push(...structure);
    if (!structure.length) {
      const total = report.metadata.vulnerabilities.total;
      if ((full.status === 1) !== total > 0) {
        problems.push(`full audit: exit ${full.status} does not match ${total} reported vulnerabilities`);
      }
      evaluateFull(report, list, lockPackages, { problems, accepted, rejected, belowThreshold, notes });
      checks.add('full-audit');
    }
  }

  // 4. Registry: a newer excepted package may be the fix; a newer direct dependent may drop it.
  let registryChecked = true;
  for (const exception of list) {
    const watched = [
      {
        name: exception.package,
        version: semver.rsort([...exception.versions])[0],
        means: 'a fixed version may exist',
      },
      ...exception.dependents.map((dependent) => ({
        name: packageNameOf(dependent.path),
        version: dependent.version,
        means: `it may no longer require ${exception.package}`,
      })),
    ];
    for (const { name, version, means } of watched) {
      const run = parseInvocation(`registry versions of ${name}`, registry?.[name], [0]);
      const versions = run.json === undefined ? [] : Array.isArray(run.json) ? run.json : [run.json];
      if (run.problem || !versions.length || !versions.every((v) => typeof v === 'string' && semver.valid(v))) {
        problems.push(run.problem ?? `registry versions of ${name}: unexpected output`);
        registryChecked = false;
        continue;
      }
      const newer = versions.filter((v) => semver.gt(v, version));
      if (newer.length) {
        problems.push(
          `${exception.advisory}: ${name} ${newer.join(', ')} is published; ${means}, re-evaluate the exception`,
        );
      }
    }
  }
  if (registryChecked) checks.add('registry');

  for (const check of REQUIRED_CHECKS) {
    if (!checks.has(check)) problems.push(`expected check did not complete: ${check}`);
  }

  return { ok: problems.length === 0, problems, accepted, rejected, belowThreshold, notes, checks: [...checks] };
}

function evaluateFull(report, exceptions, lockPackages, out) {
  const { problems, accepted, rejected, belowThreshold, notes } = out;
  const used = new Map(exceptions.map((exception) => [exception.advisory, new Set()]));

  for (const [name, entry] of Object.entries(report.vulnerabilities)) {
    const roots = rootAdvisories(report, name);
    const own = entry.via.filter((via) => typeof via !== 'string');
    const highest = roots.reduce((max, advisory) => Math.max(max, rank(advisory.severity)), -1);
    if (highest !== rank(entry.severity)) {
      problems.push(`full audit: ${name} is ${entry.severity}, but its advisories reach ${SEVERITIES[highest]}`);
    }

    // Any advisory on an excepted package other than the excepted one fails, whatever its severity.
    for (const advisory of own) {
      const forPackage = exceptions.filter((exception) => exception.package === advisory.name);
      if (forPackage.length && !forPackage.some((exception) => matchesException(advisory, exception))) {
        rejected.push({
          scope: 'dev',
          name,
          severity: advisory.severity,
          advisory: advisoryId(advisory),
          reason: 'not the excepted advisory of an excepted package',
        });
        problems.push(
          `${advisoryId(advisory)} (${advisory.severity}) on excepted package ${advisory.name} is not covered by its exception`,
        );
      }
    }

    const matched = exceptions.filter((exception) => roots.some((advisory) => matchesException(advisory, exception)));
    for (const exception of matched) used.get(exception.advisory).add(name);

    if (rank(entry.severity) < BLOCKING) {
      belowThreshold.push({ name, severity: entry.severity, advisories: [...new Set(roots.map(advisoryId))] });
      continue;
    }

    const blockingRoots = roots.filter((advisory) => rank(advisory.severity) >= BLOCKING);
    const uncovered = blockingRoots.filter(
      (advisory) => !exceptions.some((exception) => matchesException(advisory, exception)),
    );
    if (uncovered.length) {
      for (const advisory of uncovered) {
        rejected.push({
          scope: 'dev',
          name,
          severity: advisory.severity,
          advisory: advisoryId(advisory),
          reason: 'no exception',
        });
      }
      problems.push(
        `${name} (${entry.severity}): ${[...new Set(uncovered.map((a) => `${advisoryId(a)} ${a.severity} in ${a.name}`))].join(', ')} has no exception`,
      );
      continue;
    }

    // Accepted only through an exception: prove the path.
    const covering = matched.filter((exception) =>
      blockingRoots.some((advisory) => matchesException(advisory, exception)),
    );
    const entryProblems = [];
    for (const exception of covering) {
      if (name !== exception.package && !exception.propagatesTo.includes(name)) {
        entryProblems.push(
          `${name} reaches ${exception.advisory} but is not in its propagatesTo list (the dependency path changed)`,
        );
      }
      if (name !== exception.package && own.some((advisory) => rank(advisory.severity) >= BLOCKING)) {
        entryProblems.push(`${name} has an advisory of its own`);
      }
    }
    for (const node of entry.nodes) {
      if (!lockPackages) entryProblems.push(`${name}: cannot prove ${node} is dev only without the lockfile`);
      else if (!isDevOnly(lockPackages[node])) entryProblems.push(`${name}: ${node} is not a dev-only dependency`);
    }
    if (entryProblems.length) {
      problems.push(...entryProblems);
      rejected.push({ scope: 'dev', name, severity: entry.severity, reason: entryProblems.join('; ') });
    } else {
      accepted.push({ name, severity: entry.severity, advisories: covering.map((exception) => exception.advisory) });
    }
  }

  for (const exception of exceptions) {
    const reached = used.get(exception.advisory);
    const label = exception.advisory;
    if (!reached.has(exception.package)) {
      problems.push(`${label}: no longer reported for ${exception.package}; the exception is not needed, remove it`);
      continue;
    }
    const expected = new Set([exception.package, ...exception.propagatesTo]);
    const missing = [...expected].filter((name) => !reached.has(name));
    const extra = [...reached].filter((name) => !expected.has(name));
    if (missing.length || extra.length) {
      problems.push(
        `${label}: dependency path changed (no longer reached: ${missing.join(', ') || '-'}; newly reached: ${extra.join(', ') || '-'})`,
      );
    }

    const entry = report.vulnerabilities[exception.package];
    // `true`: a patched version fits the installed ranges. An object is a change npm proposes to a
    // direct dependency. It is not a decision input: on an unchanged tree consecutive audits return
    // false, markdownlint-cli2@0.21.0 or stylelint-config-standard@15.0.1, and both downgrades keep
    // micromatch -> braces. The advisory range and the registry checks detect a fix deterministically.
    if (entry.fixAvailable === true) {
      problems.push(
        `${label}: npm reports a fix for ${exception.package} within the installed ranges; remove the exception`,
      );
    } else if (entry.fixAvailable !== false) {
      notes.push(`${label}: npm suggests ${JSON.stringify(entry.fixAvailable)}; not used, see audit-gate.mjs`);
    }
    if (JSON.stringify([...entry.nodes].sort()) !== JSON.stringify([...exception.nodes].sort())) {
      problems.push(
        `${label}: ${exception.package} is installed at ${entry.nodes.join(', ')}, expected ${exception.nodes.join(', ')}`,
      );
    }
    if (!lockPackages) continue;

    for (const node of entry.nodes) {
      const lockEntry = lockPackages[node];
      if (!exception.versions.includes(lockEntry?.version)) {
        problems.push(
          `${label}: ${node} is ${lockEntry?.version ?? 'missing'}, the exception covers ${exception.versions.join(', ')}`,
        );
      }
      if (!isDevOnly(lockEntry)) problems.push(`${label}: ${node} is not a dev-only dependency`);
    }
    const dependents = dependentsOf(lockPackages, exception.package);
    const describe = (list) =>
      list
        .map((d) => `${d.path}@${d.version}`)
        .sort()
        .join(', ');
    if (describe(dependents) !== describe(exception.dependents)) {
      problems.push(
        `${label}: ${exception.package} is required by ${describe(dependents) || 'nothing'}, expected ${describe(exception.dependents)}`,
      );
    }
    for (const dependent of dependents) {
      if (!exception.nodes.includes(dependent.resolved)) {
        problems.push(
          `${label}: ${dependent.path} resolves ${exception.package} to ${dependent.resolved}, outside the exception`,
        );
      }
      if (!isDevOnly(lockPackages[dependent.path]))
        problems.push(`${label}: dependent ${dependent.path} is not dev only`);
    }
  }
}

export function formatReport(result, exceptions) {
  const lines = [];
  const byAdvisory = new Map((exceptions?.exceptions ?? []).map((exception) => [exception.advisory, exception]));
  lines.push(`[audit-gate] checks completed: ${result.checks.join(', ') || 'none'}`);
  for (const item of result.accepted) {
    const reviews = item.advisories.map((id) => `${id}, review by ${byAdvisory.get(id)?.reviewBy}`).join('; ');
    lines.push(`  ACCEPTED   ${item.name} (${item.severity}) via exception ${reviews}`);
  }
  for (const item of result.rejected) {
    lines.push(
      `  REJECTED   ${item.scope} ${item.name} (${item.severity})${item.advisory ? ` ${item.advisory}` : ''}: ${item.reason}`,
    );
  }
  for (const item of result.belowThreshold) {
    lines.push(`  BELOW HIGH ${item.name} (${item.severity}) ${item.advisories.join(', ')} - not blocking`);
  }
  for (const note of result.notes) lines.push(`  NOTE       ${note}`);
  for (const problem of result.problems) lines.push(`  PROBLEM    ${problem}`);
  lines.push(result.ok ? '[audit-gate] PASS' : `[audit-gate] FAIL: ${result.problems.length} problem(s)`);
  return lines.join('\n');
}

function npm(args) {
  return spawnSync('npm', args, { cwd: repositoryRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let exceptions;
  try {
    exceptions = JSON.parse(readFileSync(exceptionsPath, 'utf8'));
  } catch (error) {
    exceptions = { invalid: error.message };
  }
  const packages = Array.isArray(exceptions?.exceptions)
    ? [
        ...new Set(
          exceptions.exceptions.flatMap((e) => [
            e?.package,
            ...(Array.isArray(e?.dependents) ? e.dependents.map((d) => d?.path && packageNameOf(d.path)) : []),
          ]),
        ),
      ]
    : [];
  let lockfile = '';
  try {
    lockfile = readFileSync(resolve(repositoryRoot, 'package-lock.json'), 'utf8');
  } catch {
    // evaluate() reports the unusable lockfile.
  }
  const result = evaluate({
    production: npm(commands.production),
    full: npm(commands.full),
    registry: Object.fromEntries(
      packages.filter((name) => typeof name === 'string').map((name) => [name, npm(commands.registry(name))]),
    ),
    lockfile,
    exceptions,
    now: new Date(),
  });
  process.stdout.write(`${formatReport(result, exceptions)}\n`);
  process.exit(result.ok ? 0 : 1);
}
