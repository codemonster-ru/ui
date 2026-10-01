#!/usr/bin/env node
// Stages the distributable Composer artifact for the Razor adapter.
//
// H2 was that no such artifact existed. The consumer proof installed the
// working tree through a path repository, and the assets it found were a
// gitignored `packages/razor/dist` that no real consumer would ever receive.
// Installing the package from a VCS archive produced a package whose
// `assetPath()` pointed at a directory that does not exist.
//
// This script builds the thing that ships:
//
//   git archive HEAD packages/razor   ->  only tracked files, so nothing
//                                         untracked or stale can leak in
//   build the assets into the stage   ->  never copied from a previous run
//   drop development-only files       ->  a consumer needs no tests or build
//   validate                          ->  fail closed rather than ship a
//                                         package with no stylesheet
//
// Model B of the two the milestone allowed: `dist` stays out of the repository
// day to day, and the release stage produces it. Publishing must therefore use
// this artifact; a bare Packagist-from-VCS install would carry no assets, which
// is exactly what `npm run check:razor-package` refuses to let happen silently.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Files a consumer never needs and that must not travel with the package. */
export const developmentOnlyEntries = ['tests', 'phpunit.xml.dist', 'build-assets.mjs', 'style-sources.mjs', 'browser'];

/** Everything the installed package must contain to be usable. */
export const requiredEntries = [
  'composer.json',
  'README.md',
  'src/VueForgeRazorProvider.php',
  'src/Components/InputComponent.php',
  'src/Components/IconButtonComponent.php',
  'src/Components/FieldComponent.php',
  'src/Components/ButtonComponent.php',
  'src/Components/TextareaComponent.php',
  'src/Components/CheckboxComponent.php',
  'src/Components/RadioComponent.php',
  'src/Components/SwitchComponent.php',
  'src/Support/CheckableState.php',
  'src/Support/TextareaState.php',
  'src/Support/ButtonState.php',
  'src/Support/FieldContext.php',
  'src/Support/FieldIds.php',
  'src/Support/FieldState.php',
  'src/Support/Html.php',
  'src/Support/IconButton.php',
  'src/Support/IconButtonState.php',
  'src/Support/IconRenderer.php',
  'src/Support/InputState.php',
  // The M17 composition pair, listed together and deliberately so. The gate is
  // unusable without the child it renders: an artifact that shipped
  // SkeletonGateComponent and left SkeletonComponent behind would install, and
  // would fatal the first time a consumer rendered a gate without a skeleton
  // slot. Naming both is how "the release contains everything the gate needs"
  // becomes an assertion rather than a consequence of how git archive happens
  // to work.
  'src/Components/SkeletonGateComponent.php',
  'src/Components/SkeletonComponent.php',
  'src/Support/SkeletonGateState.php',
  'src/Support/SkeletonState.php',
  // The M19 component. Server-complete - no browser controller travels with
  // it, and dist/vueforge-razor.js must not grow one on its account.
  'src/Components/AlertComponent.php',
  'src/Support/AlertState.php',
  // The M20 component, and the one renderer of spinner markup in the package:
  // the button's loading state renders this same instance. Server-complete -
  // no browser controller travels with it. There is no Support/ProgressSpinner
  // any more, and the packaged-consumer proof asserts nothing ships under that
  // name.
  'src/Components/ProgressSpinnerComponent.php',
  'src/Support/ProgressSpinnerState.php',
  // The M21 component, registered beside the spinner and sharing no code
  // with it. Server-complete - no browser controller travels with it, and
  // the packaged-consumer proof asserts the controller never mentions it.
  'src/Components/ProgressBarComponent.php',
  'src/Support/ProgressBarState.php',
  // The M22 component: the first with a control of its own and a browser
  // controller that owns a state change. The controller travels inside
  // dist/vueforge-razor.js; the packaged-consumer proof asserts it is there.
  'src/Components/AccordionComponent.php',
  'src/Support/AccordionState.php',
  // The M23 component: the second with controls of its own - several native
  // buttons per instance - and a browser controller that moves a selection
  // and the focus between them. The controller travels inside
  // dist/vueforge-razor.js; the packaged-consumer proof asserts it is there.
  'src/Components/StepperComponent.php',
  'src/Support/StepperState.php',
  // The M24 component: the third with controls of its own and the first
  // whose controls carry an explicit interactive role - N tabs, two scroll
  // buttons and at most one panel per instance - and a browser controller
  // that moves the selection, the focus and the panel, measures the
  // indicator and drives the internal scroller. The controller travels
  // inside dist/vueforge-razor.js; the packaged-consumer proof asserts it
  // is there, and that the stylesheet carries the scroller and the tabs.
  'src/Components/TabsComponent.php',
  'src/Support/TabsState.php',
  // The M25 component: the first whose owned control is a native anchor, and
  // server-complete - no browser controller travels with it, and the
  // packaged-consumer proof asserts the controller never mentions it. The
  // Vue adapter's router branch has no file here by design.
  'src/Components/LinkComponent.php',
  'src/Support/LinkState.php',
  // The M26 component: N native anchors decided per item by a rule, and
  // server-complete like the link - no browser controller travels with it,
  // and the packaged-consumer proof asserts the controller never mentions
  // it. Its rel derivation is LinkState's; its own rules are BreadcrumbsState.
  'src/Components/BreadcrumbsComponent.php',
  'src/Support/BreadcrumbsState.php',
  // The M27 pair, server-complete like the link and the trail: no browser
  // controller travels with either, and the packaged-consumer proof asserts
  // the controller never mentions them. The menu has no state class at all -
  // it makes no decision - and the item's rules are MenuItemState's, which
  // deliberately does not include a rel derivation: that is LinkState's, and
  // this component has none.
  'src/Components/MenuComponent.php',
  'src/Components/MenuItemComponent.php',
  'src/Support/MenuItemState.php',
  'src/Components/DropdownComponent.php',
  'src/Support/DropdownState.php',
  // The M29 component: a fieldset whose trigger is the canonical vf-button,
  // handed in by the provider, and a browser controller that reproduces the
  // trigger's click and nothing else. The controller travels inside
  // dist/vueforge-razor.js; the packaged-consumer proof asserts it is there.
  'src/Components/GroupBoxComponent.php',
  'src/Support/GroupBoxState.php',
  // The M30 component: the second overlay. Its browser controller, the
  // page-wide escape stack it shares with the dropdown and the disposal of
  // what a closing panel holds all travel inside dist/vueforge-razor.js.
  'src/Components/PopoverComponent.php',
  'src/Support/PopoverState.php',
  // The M31 component: the third overlay. Its browser controller travels
  // inside dist/vueforge-razor.js beside the popover's and shares its
  // disposal, not its escape stack - the tooltip has no entry on it.
  'src/Components/TooltipComponent.php',
  'src/Support/TooltipState.php',
  // The M32 component: a listbox on the dropdown's floating layer. Its
  // browser controller travels inside dist/vueforge-razor.js on the shared
  // escape stack and disposal registry, and reports its filled state to the
  // field through the declared-control seam in the field controller.
  'src/Components/SelectComponent.php',
  'src/Support/SelectState.php',
  // The M33 component: a recursive navigation tree. Its browser controller
  // travels inside dist/vueforge-razor.js on the shared disposal registry and
  // depends on no overlay controller; its stylesheet is the last one inlined.
  'src/Components/NavMenuComponent.php',
  'src/Support/NavMenuState.php',
  'resources/icons/icon-registry.json',
  'dist/vueforge-razor.css',
  'dist/vueforge-razor.js',
  'dist/assets-manifest.json',
];

export const stageDirectory = resolve(repositoryRoot, '.release/razor-package');

function isGitRepository() {
  try {
    execFileSync('git', ['-C', repositoryRoot, 'rev-parse', '--git-dir'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options });
}

/**
 * Materialises the package from tracked files at a chosen commit.
 *
 * `git archive` rather than a directory copy: the working tree carries a
 * gitignored dist, a vendor tree and whatever a previous run left behind, and
 * none of that may decide what a consumer receives.
 */
export function stageRazorPackage({ commit = 'HEAD', target = stageDirectory } = {}) {
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });

  // An exported tree has no .git and, by construction, contains only tracked
  // content, so copying it is equivalent to archiving it. The source is
  // recorded either way rather than guessed at by a reader.
  const source = isGitRepository() ? 'git' : 'exported-tree';

  if (source === 'git') {
    const archive = execFileSync('git', ['-C', repositoryRoot, 'archive', '--format=tar', commit, 'packages/razor'], {
      maxBuffer: 256 * 1024 * 1024,
    });
    execFileSync('tar', ['-x', '-C', target, '--strip-components=2'], { input: archive, maxBuffer: 256 * 1024 * 1024 });
  } else {
    cpSync(resolve(repositoryRoot, 'packages/razor'), target, {
      recursive: true,
      filter: (entry) => !/(^|\/)(dist|vendor|node_modules)(\/|$)/.test(relative(repositoryRoot, entry)),
    });
  }

  if (!existsSync(resolve(target, 'composer.json'))) {
    throw new Error(`Staging from ${source} produced no Razor package in ${target}.`);
  }

  // Assets are generated into the stage, so a stale local dist cannot be what
  // ships even if one is lying around.
  run('npm', ['run', 'theme:tokens'], { cwd: repositoryRoot });
  run(
    process.execPath,
    [resolve(repositoryRoot, 'packages/razor/build-assets.mjs'), `--out-dir=${resolve(target, 'dist')}`],
    {
      cwd: repositoryRoot,
    },
  );

  for (const entry of developmentOnlyEntries) {
    rmSync(resolve(target, entry), { recursive: true, force: true });
  }

  const manifest = JSON.parse(readFileSync(resolve(target, 'dist/assets-manifest.json'), 'utf8'));
  const provenance = {
    $comment:
      'Generated by scripts/release/build-razor-package.mjs. Identifies the artifact without naming the machine ' +
      'that built it, so two builds of the same commit produce the same record.',
    source,
    commit: source === 'git' ? run('git', ['-C', repositoryRoot, 'rev-parse', commit]).trim() : null,
    packageName: JSON.parse(readFileSync(resolve(target, 'composer.json'), 'utf8')).name,
    assets: manifest,
  };
  writeFileSync(resolve(target, 'dist/package-provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);

  return { target, provenance };
}

/** Everything the staged package contains, as repo-style relative paths. */
export function listStagedFiles(target) {
  return run('find', [target, '-type', 'f'])
    .split('\n')
    .filter(Boolean)
    .map((path) => relative(target, path))
    .sort();
}

// Node resolves a module URL through symlinks while argv[1] keeps the path as
// it was typed, so comparing the two directly makes this block silently skip
// whenever the tree is reached through a symlink - /var/folders on macOS, for
// one. The script would then exit 0 having staged nothing.
function isDirectlyExecuted() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isDirectlyExecuted()) {
  const { target, provenance } = stageRazorPackage();
  const files = listStagedFiles(target);
  const missing = requiredEntries.filter((entry) => !existsSync(resolve(target, entry)));

  if (missing.length > 0) {
    process.stderr.write(`[razor-package] FAILED: the staged package is missing ${missing.join(', ')}\n`);
    process.exit(1);
  }

  const digest = createHash('sha256')
    .update(
      files
        .map(
          (file) =>
            `${file}:${createHash('sha256')
              .update(readFileSync(resolve(target, file)))
              .digest('hex')}`,
        )
        .join('\n'),
    )
    .digest('hex');

  process.stdout.write(
    `Staged ${provenance.packageName} from ${provenance.source} ` +
      `${provenance.commit ? `at ${provenance.commit.slice(0, 12)} ` : ''}into ` +
      `${relative(repositoryRoot, target)}\n  ${files.length} files, content digest ${digest.slice(0, 16)}\n`,
  );
}
