import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { findBaselineManifestIssues } from './baseline-manifest.mjs';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const config = JSON.parse(
  readFileSync(join(repositoryRoot, 'contracts/visual.config.json'), 'utf8'),
);
const baselineDirectory = join(repositoryRoot, 'visual-baselines/vueforge-showcase');

const manifest = JSON.parse(readFileSync(join(baselineDirectory, 'manifest.json'), 'utf8'));
const files = readdirSync(baselineDirectory).filter((name) => name.endsWith('.png'));
const issues = findBaselineManifestIssues({
  configuredRoutes: config.reference.routes,
  files,
  manifest,
});

if (issues.length > 0) {
  console.error(`[visual-baselines] FAILED with ${issues.length} issue(s):`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(
  `[visual-baselines] OK: ${manifest.screenshots.length} baseline(s) across ${manifest.routes.length} route(s) match the capture config and the files on disk.`,
);
