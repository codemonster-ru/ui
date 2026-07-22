import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const scriptPath = resolve('scripts/ci/prepare-release-from-tag.mjs');

function runReleasePreparation(version) {
  const fixtureDir = mkdtempSync(join(tmpdir(), 'vueforge-release-prep-'));
  const packageDir = join(fixtureDir, 'packages/example');
  const outputPath = join(fixtureDir, 'github-output.txt');

  mkdirSync(packageDir, { recursive: true });
  writeFileSync(
    join(packageDir, 'package.json'),
    `${JSON.stringify({ name: '@codemonster-ru/example', version }, null, 2)}\n`,
  );
  writeFileSync(
    join(packageDir, 'CHANGELOG.md'),
    `# Changelog\n\n## ${version}\n\n### Added\n\n- Release ${version}.\n`,
  );
  writeFileSync(outputPath, '');

  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: fixtureDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_OUTPUT: outputPath,
      GITHUB_REF_NAME: `@codemonster-ru/example@${version}`,
    },
  });

  try {
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const output = Object.fromEntries(
      readFileSync(outputPath, 'utf8')
        .trim()
        .split('\n')
        .map((line) => {
          const separatorIndex = line.indexOf('=');
          return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
        }),
    );
    return {
      ...output,
      releaseNotes: readFileSync(output.release_notes_path, 'utf8'),
    };
  } finally {
    rmSync(fixtureDir, { force: true, recursive: true });
  }
}

test('uses latest for a stable release', () => {
  const release = runReleasePreparation('1.2.3');
  assert.equal(release.dist_tag, 'latest');
  assert.equal(release.is_prerelease, 'false');
  assert.equal(release.tarball_name, 'codemonster-ru-example-1.2.3.tgz');
  assert.equal(
    release.releaseNotes,
    '# @codemonster-ru/example@1.2.3\n\n## Changes\n\n### Added\n\n- Release 1.2.3.\n',
  );
});

test('uses next for a prerelease', () => {
  const release = runReleasePreparation('1.2.3-beta.1');
  assert.equal(release.dist_tag, 'next');
  assert.equal(release.is_prerelease, 'true');
  assert.equal(release.tarball_name, 'codemonster-ru-example-1.2.3-beta.1.tgz');
});
