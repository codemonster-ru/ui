import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const assetsDirectory = join(root, 'packages/razor/resources/assets');
const sources = [
  { packageDirectory: 'tokens', path: 'breakpoints.css', export: './breakpoints.css' },
  { packageDirectory: 'tokens', path: 'tokens.css', export: './tokens.css' },
  { packageDirectory: 'css', path: 'styles.css', export: './styles.css' },
  { packageDirectory: 'css', path: 'foundation.css', export: './foundation.css' },
  { packageDirectory: 'css', path: 'foundation/reset.css', export: './dist/foundation/reset.css' },
  { packageDirectory: 'css', path: 'foundation/document.css', export: './dist/foundation/document.css' },
  { packageDirectory: 'css', path: 'foundation/focus.css', export: './dist/foundation/focus.css' },
  { packageDirectory: 'css', path: 'foundation/preferences.css', export: './dist/foundation/preferences.css' },
  { packageDirectory: 'css', path: 'primitives/control.css', export: './dist/primitives/control.css' },
  { packageDirectory: 'css', path: 'primitives/surface.css', export: './dist/primitives/surface.css' },
  { packageDirectory: 'css', path: 'components/accordion.css', export: './accordion.css' },
  { packageDirectory: 'css', path: 'components/alert.css', export: './alert.css' },
  { packageDirectory: 'css', path: 'components/avatar.css', export: './avatar.css' },
  { packageDirectory: 'css', path: 'components/badge.css', export: './badge.css' },
  { packageDirectory: 'css', path: 'components/breadcrumbs.css', export: './breadcrumbs.css' },
  { packageDirectory: 'css', path: 'components/button.css', export: './button.css' },
  { packageDirectory: 'css', path: 'components/card.css', export: './card.css' },
  { packageDirectory: 'css', path: 'components/checkbox.css', export: './checkbox.css' },
  { packageDirectory: 'css', path: 'components/command-palette.css', export: './command-palette.css' },
  { packageDirectory: 'css', path: 'components/date-picker.css', export: './date-picker.css' },
  { packageDirectory: 'css', path: 'components/divider.css', export: './divider.css' },
  { packageDirectory: 'css', path: 'components/dialog.css', export: './dialog.css' },
  { packageDirectory: 'css', path: 'components/dropdown.css', export: './dropdown.css' },
  { packageDirectory: 'css', path: 'components/drawer.css', export: './drawer.css' },
  { packageDirectory: 'css', path: 'components/field.css', export: './field.css' },
  { packageDirectory: 'css', path: 'components/input.css', export: './input.css' },
  { packageDirectory: 'css', path: 'components/link.css', export: './link.css' },
  { packageDirectory: 'css', path: 'components/menu.css', export: './menu.css' },
  { packageDirectory: 'css', path: 'components/popover.css', export: './popover.css' },
  { packageDirectory: 'css', path: 'components/radio.css', export: './radio.css' },
  { packageDirectory: 'css', path: 'components/select.css', export: './select.css' },
  { packageDirectory: 'css', path: 'components/skeleton.css', export: './skeleton.css' },
  { packageDirectory: 'css', path: 'components/switch.css', export: './switch.css' },
  { packageDirectory: 'css', path: 'components/textarea.css', export: './textarea.css' },
  { packageDirectory: 'css', path: 'components/tabs.css', export: './tabs.css' },
  { packageDirectory: 'css', path: 'components/tooltip.css', export: './tooltip.css' },
];

await rm(join(assetsDirectory, 'css'), { force: true, recursive: true });

const artifacts = {};

for (const source of sources) {
  const packageRoot = join(root, 'packages', source.packageDirectory);
  const packageManifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
  const sourcePath = join(packageRoot, 'dist', source.path);
  const destinationPath = join(assetsDirectory, 'css', source.packageDirectory, source.path);
  const contents = await readFile(sourcePath);

  await mkdir(dirname(destinationPath), { recursive: true });
  await cp(sourcePath, destinationPath);

  const artifactName = `${source.packageDirectory}:${source.path}`;
  artifacts[artifactName] = {
    path: relative(assetsDirectory, destinationPath),
    mediaType: 'text/css',
    sha256: createHash('sha256').update(contents).digest('hex'),
    source: {
      package: packageManifest.name,
      version: packageManifest.version,
      export: source.export,
    },
  };
}

await writeFile(
  join(assetsDirectory, 'manifest.json'),
  `${JSON.stringify({ schemaVersion: 1, artifacts }, null, 2)}\n`,
);
