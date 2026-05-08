import fs from 'node:fs';
import path from 'node:path';

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const rootDir = process.cwd();
const tag = process.env.GITHUB_REF_NAME;
const outputFile = process.env.GITHUB_OUTPUT;

if (!tag) {
  fail('GITHUB_REF_NAME is not set.');
}

if (!outputFile) {
  fail('GITHUB_OUTPUT is not set.');
}

const tagMatch = tag.match(/^(@[^/]+\/[A-Za-z0-9._-]+)@([0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?)$/);
if (!tagMatch) {
  fail(`Tag "${tag}" must match "@scope/package@x.y.z".`);
}

const [, packageName, versionFromTag] = tagMatch;
const packageSlug = packageName.includes('/') ? packageName.split('/')[1] : packageName;
const packagesDir = path.join(rootDir, 'packages');

if (!fs.existsSync(packagesDir)) {
  fail('packages directory not found.');
}

const packageDirs = fs.readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

let packageDir = null;
let packageJson = null;

for (const dirName of packageDirs) {
  const packageJsonPath = path.join(packagesDir, dirName, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    continue;
  }

  const json = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (json.name === packageName) {
    packageDir = path.join('packages', dirName);
    packageJson = json;
    break;
  }
}

if (!packageDir || !packageJson) {
  fail(`Package "${packageName}" was not found under packages/*/package.json.`);
}

if (String(packageJson.private) === 'true') {
  fail(`Package "${packageName}" is private and cannot be published.`);
}

if (packageJson.version !== versionFromTag) {
  fail(
    `Version mismatch for "${packageName}": tag has ${versionFromTag}, package.json has ${packageJson.version}.`
  );
}

const changelogPath = path.join(rootDir, packageDir, 'CHANGELOG.md');
if (!fs.existsSync(changelogPath)) {
  fail(`CHANGELOG.md not found for ${packageName} at ${packageDir}/CHANGELOG.md.`);
}

const changelogContent = fs.readFileSync(changelogPath, 'utf8');
const lines = changelogContent.split(/\r?\n/);

const versionHeadingRegex = new RegExp(`^##\\s+\\[?v?${escapeRegExp(versionFromTag)}\\]?(?:\\s+-.*)?\\s*$`);
const anyHeadingRegex = /^##\s+/;

let startIndex = -1;
for (let i = 0; i < lines.length; i += 1) {
  if (versionHeadingRegex.test(lines[i])) {
    startIndex = i;
    break;
  }
}

if (startIndex === -1) {
  fail(`Version section ${versionFromTag} was not found in ${packageDir}/CHANGELOG.md.`);
}

let endIndex = lines.length;
for (let i = startIndex + 1; i < lines.length; i += 1) {
  if (anyHeadingRegex.test(lines[i])) {
    endIndex = i;
    break;
  }
}

const releaseNotes = lines.slice(startIndex + 1, endIndex).join('\n').trim();
if (!releaseNotes) {
  fail(`Changelog section for ${versionFromTag} is empty in ${packageDir}/CHANGELOG.md.`);
}

const releaseNotesPath = path.join(rootDir, '.release-notes.md');
fs.writeFileSync(releaseNotesPath, `${releaseNotes}\n`, 'utf8');

const output = [
  `package_name=${packageName}`,
  `package_version=${versionFromTag}`,
  `package_dir=${packageDir}`,
  `release_notes_path=${releaseNotesPath}`,
  `release_name=${packageSlug} v${versionFromTag}`,
].join('\n');

fs.appendFileSync(outputFile, `${output}\n`, 'utf8');

console.log(`Prepared release for ${packageName}@${versionFromTag} from tag ${tag}.`);
