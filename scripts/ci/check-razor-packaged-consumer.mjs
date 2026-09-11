#!/usr/bin/env node
// The H2 proof: a clean external PHP consumer of the real Composer artifact.
//
// Everything the milestone asked to rule out is ruled out by construction:
//
//   the artifact is staged from `git archive`, so no untracked or stale file
//   the artifact is copied out of the repository before install
//   the consumer sees a Composer artifact repository, never a path repository
//   the installed package is a copy, never a symlink to packages/razor
//   the consumer phase runs with a PATH that has no node, npm or npx on it
//
// It then renders a real VfInput through the installed provider, serves it with
// the assets that provider advertises, and drives clear and reveal in a real
// browser.
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { get as httpGet } from 'node:http';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { delay, launchChrome, openPage } from '../baseline/cdp.mjs';
import { stageRazorPackage } from '../release/build-razor-package.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
/** Version the proof stamps on the artifact so Composer can resolve it. */
const PROOF_VERSION = '0.0.1';
const failures = [];
const passed = [];

function check(name, condition, detail = '') {
  if (condition) passed.push(name);
  else failures.push(`${name}${detail ? `: ${detail}` : ''}`);
}

async function freePort() {
  return new Promise((done, fail) => {
    const server = createServer();
    server.on('error', fail);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => done(port));
    });
  });
}

function probe(url) {
  return new Promise((done) => {
    const request = httpGet(url, { agent: false }, (response) => {
      response.resume();
      response.on('end', () => done(response.statusCode ?? 0));
    });
    request.on('error', () => done(0));
    request.setTimeout(4000, () => {
      request.destroy();
      done(0);
    });
  });
}

const workspace = mkdtempSync(resolve(tmpdir(), 'vueforge-razor-consumer-'));
const artifactDirectory = resolve(workspace, 'artifact');
const consumerRoot = resolve(workspace, 'consumer');
const chromeState = { chrome: null, server: null };

try {
  // ------------------------------------------------------- the real artifact
  process.stdout.write('Staging the Composer artifact\n');
  const { target } = stageRazorPackage();

  // Out of the repository entirely, so nothing the consumer does can reach back
  // into the working tree even by accident.
  mkdirSync(artifactDirectory, { recursive: true });
  cpSync(target, resolve(artifactDirectory, 'vueforge-razor'), { recursive: true });

  // An artifact repository is how Composer installs a published package: it
  // reads a zip, not a directory it can link to.
  const zipDirectory = resolve(workspace, 'zips');
  mkdirSync(zipDirectory, { recursive: true });
  const stagedManifestPath = resolve(artifactDirectory, 'vueforge-razor/composer.json');
  const stagedManifest = JSON.parse(readFileSync(stagedManifestPath, 'utf8'));
  // An artifact repository needs the version inside the package. This is
  // packaging metadata for the proof: the tracked composer.json is untouched
  // and no repository package version is bumped.
  stagedManifest.version = PROOF_VERSION;
  writeFileSync(stagedManifestPath, `${JSON.stringify(stagedManifest, null, 4)}\n`);
  execFileSync('zip', ['-q', '-r', resolve(zipDirectory, 'vueforge-razor.zip'), '.'], {
    cwd: resolve(artifactDirectory, 'vueforge-razor'),
  });

  // ------------------------------------------------------------ the consumer
  mkdirSync(consumerRoot, { recursive: true });
  writeFileSync(
    resolve(consumerRoot, 'composer.json'),
    `${JSON.stringify(
      {
        name: 'vueforge/packaged-consumer',
        version: '1.0.0',
        repositories: [{ type: 'artifact', url: zipDirectory }],
        require: { 'codemonster-ru/vueforge-razor': PROOF_VERSION },
        config: { 'allow-plugins': {} },
      },
      null,
      2,
    )}\n`,
  );

  // A PATH with php and composer on it and nothing else: the consumer phase
  // must not be able to reach node, npm or a workspace script even if it tried.
  const sanitizedBin = resolve(workspace, 'bin');
  mkdirSync(sanitizedBin, { recursive: true });
  for (const tool of ['php', 'composer', 'zip', 'unzip']) {
    const found = execFileSync('/bin/sh', ['-c', `command -v ${tool}`], { encoding: 'utf8' }).trim();
    execFileSync('ln', ['-sf', realpathSync(found), resolve(sanitizedBin, tool)]);
  }
  const consumerEnv = {
    PATH: `${sanitizedBin}:/usr/bin:/bin`,
    HOME: workspace,
    COMPOSER_HOME: resolve(workspace, '.composer'),
  };

  for (const tool of ['node', 'npm', 'npx', 'pnpm', 'vite', 'esbuild']) {
    const available = execFileSync('/bin/sh', ['-c', `command -v ${tool} || true`], {
      encoding: 'utf8',
      env: consumerEnv,
    }).trim();
    check(`the consumer environment has no ${tool}`, available === '', available);
  }

  process.stdout.write('Installing the artifact into an isolated consumer\n');
  execFileSync('composer', ['install', '--no-interaction', '--no-progress', '--quiet'], {
    cwd: consumerRoot,
    env: consumerEnv,
    stdio: ['ignore', 'ignore', 'pipe'],
  });

  // ------------------------------------------------------------- isolation
  const installed = resolve(consumerRoot, 'vendor/codemonster-ru/vueforge-razor');
  check('the package installed into the consumer vendor directory', existsSync(installed));
  check('the installed package is a real directory, not a symlink', !lstatSync(installed).isSymbolicLink());
  check(
    'the installed package is not the repository working tree',
    !realpathSync(installed).startsWith(realpathSync(resolve(repositoryRoot, 'packages/razor'))),
    realpathSync(installed),
  );

  // -------------------------------------------------------------- the render
  writeFileSync(
    resolve(consumerRoot, 'render.php'),
    `<?php
require __DIR__ . '/vendor/autoload.php';

use Codemonster\\Razor\\Components\\ComponentRegistry;
use Codemonster\\Razor\\Components\\ComponentRenderContext;
use Codemonster\\Razor\\Components\\RenderedHtml;
use Codemonster\\VueForge\\Razor\\VueForgeRazorProvider;

$registry = new ComponentRegistry();
$registry->register(new VueForgeRazorProvider());
$input = $registry->resolve('vf-input');
$iconButton = $registry->resolve('vf-icon-button');
$field = $registry->resolve('vf-field');
$button = $registry->resolve('vf-button');
$textarea = $registry->resolve('vf-textarea');
$checkbox = $registry->resolve('vf-checkbox');
$radio = $registry->resolve('vf-radio');
$switch = $registry->resolve('vf-switch');
$badge = $registry->resolve('vf-badge');
$tag = $registry->resolve('vf-tag');
$divider = $registry->resolve('vf-divider');
$skeleton = $registry->resolve('vf-skeleton');
$avatar = $registry->resolve('vf-avatar');
$card = $registry->resolve('vf-card');
$panel = $registry->resolve('vf-panel');
$alert = $registry->resolve('vf-alert');
$skeletonGate = $registry->resolve('vf-skeleton-gate');
$assetPath = VueForgeRazorProvider::assetPath();

echo json_encode([
    'handles' => [
        'vf-input' => $registry->handles('vf-input'),
        'vf-icon-button' => $registry->handles('vf-icon-button'),
        'vf-field' => $registry->handles('vf-field'),
        'vf-button' => $registry->handles('vf-button'),
        'vf-textarea' => $registry->handles('vf-textarea'),
        'vf-checkbox' => $registry->handles('vf-checkbox'),
        'vf-radio' => $registry->handles('vf-radio'),
        'vf-switch' => $registry->handles('vf-switch'),
        'vf-badge' => $registry->handles('vf-badge'),
        'vf-tag' => $registry->handles('vf-tag'),
        'vf-divider' => $registry->handles('vf-divider'),
        'vf-skeleton' => $registry->handles('vf-skeleton'),
        'vf-avatar' => $registry->handles('vf-avatar'),
        'vf-card' => $registry->handles('vf-card'),
        'vf-panel' => $registry->handles('vf-panel'),
        'vf-alert' => $registry->handles('vf-alert'),
        'vf-skeleton-gate' => $registry->handles('vf-skeleton-gate'),
    ],
    'markup' => $input->render(new ComponentRenderContext(
        ['name' => 'workspace', 'value' => 'Acme', 'clearable' => true, 'password-reveal' => false],
        [],
    ))->value(),
    'password' => $input->render(new ComponentRenderContext(
        ['name' => 'secret', 'value' => 'hunter2', 'type' => 'password', 'password-reveal' => true],
        [],
    ))->value(),
    'iconButton' => $iconButton->render(new ComponentRenderContext(
        ['icon' => 'magnifying-glass', 'variant' => 'danger', 'size' => 'lg', 'aria-label' => 'Search'],
        [],
    ))->value(),
    // A field composing a real input, which is the composition that matters:
    // the id, the label association and aria-describedby have to survive
    // packaging, and nothing in the consumer wires them by hand.
    'field' => $field->render(new ComponentRenderContext(
        ['label' => 'Workspace', 'description' => 'Shown to collaborators', 'required' => true],
        ['default' => static fn () => $input->render(new ComponentRenderContext(['name' => 'workspace'], []))],
    ))->value(),
    'floatingField' => $field->render(new ComponentRenderContext(
        ['label' => 'Workspace', 'label-placement' => 'floating'],
        ['default' => static fn () => $input->render(new ComponentRenderContext(
            ['name' => 'workspace', 'value' => 'Acme'],
            [],
        ))],
    ))->value(),
    'button' => $button->render(new ComponentRenderContext(
        ['variant' => 'danger', 'size' => 'lg', 'name' => 'save'],
        ['default' => static fn () => RenderedHtml::fromTrustedString('Save')],
    ))->value(),
    // Loading is the half packaging could plausibly break without breaking a
    // tag: the spinner markup, the native disabled attribute and aria-busy all
    // have to survive the artifact.
    'loadingButton' => $button->render(new ComponentRenderContext(
        ['loading' => true],
        ['default' => static fn () => RenderedHtml::fromTrustedString('Saving')],
    ))->value(),
    // A standalone textarea carrying a value that must stay text, and the same
    // control composed inside a real field. Packaging could plausibly break the
    // escaping or the relationships without breaking a tag.
    'textarea' => $textarea->render(new ComponentRenderContext(
        ['value' => "first line\\nsecond <b>line</b> & \\"quoted\\"", 'rows' => 4, 'name' => 'notes'],
        [],
    ))->value(),
    'textareaField' => $field->render(new ComponentRenderContext(
        ['label' => 'Release notes', 'description' => 'Shown to everyone', 'label-placement' => 'floating'],
        ['default' => static fn () => $textarea->render(new ComponentRenderContext(['value' => 'Shipped it'], []))],
    ))->value(),
    // The three checkable controls. The indeterminate checkbox and the real
    // radio group are the states packaging could plausibly break without
    // breaking a tag.
    'checkbox' => $checkbox->render(new ComponentRenderContext(
        ['checked' => true, 'label' => 'Ship it', 'name' => 'ship'],
        [],
    ))->value(),
    'indeterminateCheckbox' => $checkbox->render(new ComponentRenderContext(
        ['indeterminate' => true, 'label' => 'Some selected'],
        [],
    ))->value(),
    'radioGroup' => $radio->render(new ComponentRenderContext(
        ['name' => 'pick', 'value' => 'a', 'model-value' => 'a', 'label' => 'Alpha'],
        [],
    ))->value() . $radio->render(new ComponentRenderContext(
        ['name' => 'pick', 'value' => 'b', 'model-value' => 'a', 'label' => 'Beta'],
        [],
    ))->value(),
    'switchOn' => $switch->render(new ComponentRenderContext(
        ['checked' => true, 'label' => 'Notify me'],
        [],
    ))->value(),
    // The three M15 presentation components. Neutral and non-neutral are both
    // rendered because the neutral tone is expressed by the *absence* of a
    // modifier, which is the half a packaging defect could silently produce.
    'badgeNeutral' => $badge->render(new ComponentRenderContext(
        [],
        ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Draft')],
    ))->value(),
    'badgeToned' => $badge->render(new ComponentRenderContext(
        ['tone' => 'danger', 'class' => 'consumer-badge'],
        ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Blocked')],
    ))->value(),
    'tagNeutral' => $tag->render(new ComponentRenderContext(
        [],
        ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Unassigned')],
    ))->value(),
    'tagToned' => $tag->render(new ComponentRenderContext(
        ['tone' => 'info', 'class' => 'consumer-tag'],
        ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Docs')],
    ))->value(),
    // Both orientations, because the divider's historical accessibility
    // behaviour differs between them and only one of them exposes a role.
    'dividerHorizontal' => $divider->render(new ComponentRenderContext([], []))->value(),
    'dividerVertical' => $divider->render(new ComponentRenderContext(['orientation' => 'vertical'], []))->value(),
    'dividerOverride' => $divider->render(new ComponentRenderContext(['role' => 'presentation'], []))->value(),
    // The three M16 components.
    //
    // VfSkeleton twice, because its whole contract is two attributes: the
    // animation modifier is present at the default and absent only when the
    // caller says so, and an empty radius drops the declaration rather than
    // zeroing it. A packaging defect could produce either half silently.
    'skeletonDefault' => $skeleton->render(new ComponentRenderContext([], []))->value(),
    'skeletonSized' => $skeleton->render(new ComponentRenderContext(
        ['min-height' => '40', 'animated' => 'false', 'class' => 'consumer-skeleton'],
        [],
    ))->value(),
    'skeletonEmptyRadius' => $skeleton->render(new ComponentRenderContext(['radius' => ''], []))->value(),
    // VfAvatar once per branch of the fallback chain. The icon branch is the
    // one that matters most here: it renders through the neutral glyph registry
    // shipped inside the artifact, so this is where "no Node runtime" stops
    // being a claim about the build and becomes a claim about the glyph on the
    // page. The label case also carries an icon, so a reordered chain fails.
    'avatarImage' => $avatar->render(new ComponentRenderContext(
        ['image' => '/avatar.png', 'image-alt' => 'Maya Chen'],
        [],
    ))->value(),
    'avatarLabel' => $avatar->render(new ComponentRenderContext(
        ['label' => 'MC', 'icon' => 'user', 'size' => 'sm'],
        [],
    ))->value(),
    'avatarIcon' => $avatar->render(new ComponentRenderContext(
        ['icon' => 'user', 'shape' => 'circle'],
        [],
    ))->value(),
    'avatarSlot' => $avatar->render(new ComponentRenderContext(
        [],
        ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<b>JS</b>')],
    ))->value(),
    // VfCard composed and empty. The composed one proves the region order and
    // the unclassed wrappers; the empty one proves that no region renders
    // without its slot, which is what a packaging defect would get wrong by
    // rendering all three.
    'cardFull' => $card->render(new ComponentRenderContext(
        ['title' => 'Workspace'],
        [
            'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Shared with your team.'),
            'footer' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Updated 3 minutes ago'),
        ],
    ))->value(),
    'cardEmpty' => $card->render(new ComponentRenderContext([], []))->value(),
    'cardSlotControl' => $card->render(new ComponentRenderContext(
        [],
        ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<button type="button">Rename</button>')],
    ))->value(),
    // VfPanel, the sixteenth component and the one whose packaging proof is
    // written against its neighbour. Four renders, because the defect this
    // component can have that no other can is *rendering as a card*: the first
    // proves the header and the unwrapped default slot, the second that an
    // empty default slot produces nothing where a card produces an empty
    // classed div, the third that a footer slot is dropped rather than
    // rendered, and the fourth the modifier, the consumer class and the
    // forwarded attributes.
    'panelFull' => $panel->render(new ComponentRenderContext(
        ['title' => 'Workspace'],
        ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Shared with your team.')],
    ))->value(),
    'panelEmptyContent' => $panel->render(new ComponentRenderContext(
        ['title' => 'Workspace'],
        ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('')],
    ))->value(),
    'panelIgnoredFooter' => $panel->render(new ComponentRenderContext(
        ['title' => 'Workspace'],
        [
            'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Shared with your team.'),
            'footer' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Updated 3 minutes ago'),
        ],
    ))->value(),
    'panelSubtle' => $panel->render(new ComponentRenderContext(
        ['subtle' => true, 'class' => 'consumer-panel', 'style' => 'opacity: 0.6', 'data-testid' => 'notes'],
        ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Quick notes.')],
    ))->value(),
    'panelHeaderSlotControl' => $panel->render(new ComponentRenderContext(
        [],
        ['header' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<button type="button">Edit</button>')],
    ))->value(),
    // VfAlert, the seventeenth component and the first whose root carries a
    // role of its own. Five renders: the composition with its tone, glyph and
    // role; the danger tone with the *same* role, because tone is paint; a
    // consumer role replacing the component's; a consumer control in the body
    // as the only focusable element; and the hidden icon. What none of them
    // renders is a dismiss button, and the proof below says so by absence.
    'alertFull' => $alert->render(new ComponentRenderContext(
        ['tone' => 'success', 'title' => 'Saved'],
        ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Changes were saved.')],
    ))->value(),
    'alertDanger' => $alert->render(new ComponentRenderContext(
        ['tone' => 'danger', 'title' => 'Failed', 'class' => 'consumer-alert', 'style' => 'opacity: 0.6', 'data-testid' => 'export'],
        [],
    ))->value(),
    'alertConsumerRole' => $alert->render(new ComponentRenderContext(
        ['role' => 'status', 'aria-label' => 'Export status'],
        [],
    ))->value(),
    'alertSlotControl' => $alert->render(new ComponentRenderContext(
        ['hide-icon' => true],
        ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<button type="button">Retry</button>')],
    ))->value(),
    'alertGlyph' => $alert->render(new ComponentRenderContext(['tone' => 'warn'], []))->value(),
    'alertCss' => is_file($assetPath . '/vueforge-razor.css')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-alert {')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-alert--danger .vf-alert__icon')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-alert__body')
        && !str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-alert--neutral')
        && !str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-alert__dismiss'),
    // The packaged controller must not have grown an alert enhancement: the
    // reference owns no interaction, so there is nothing for a browser to do.
    'alertBrowserCode' => is_file($assetPath . '/vueforge-razor.js')
        && preg_match('/vf-alert|data-vf-razor="alert"|alert-enhanced/', (string) file_get_contents($assetPath . '/vueforge-razor.js')) === 1,
    // VfSkeletonGate, the fifteenth component and the first that renders
    // another. Five renders, because a packaging defect here has a shape no
    // other component's does: the gate could install and resolve perfectly and
    // still be missing the class it delegates to.
    //
    // The loading render is the one that matters. Its overlay must contain the
    // canonical vf-skeleton markup, produced by SkeletonComponent inside the
    // installed package - not by anything this file wrote, and not by markup
    // copied into the gate. The composition check below asserts exactly
    // that: the same bytes the standalone vf-skeleton produces for the same two
    // props appear inside the gate's overlay.
    'gateLoading' => $skeletonGate->render(new ComponentRenderContext(
        ['min-height' => '64'],
        ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Usage for this period.')],
    ))->value(),
    'gateReady' => $skeletonGate->render(new ComponentRenderContext(
        ['min-height' => '64', 'ready' => true],
        ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Usage for this period.')],
    ))->value(),
    // The forwarded child configuration, and the standalone render of the same
    // two props. If the gate ever grew its own copy of the skeleton, these two
    // would drift and the comparison in the gate would fail.
    'gateForwarded' => $skeletonGate->render(new ComponentRenderContext(
        ['min-height' => '40', 'radius' => '8px', 'reserve-height' => '120'],
        [],
    ))->value(),
    'gateChildStandalone' => $skeleton->render(new ComponentRenderContext(
        ['min-height' => '40', 'radius' => '8px'],
        [],
    ))->value(),
    'gateConsumerAttributes' => $skeletonGate->render(new ComponentRenderContext(
        ['class' => 'consumer-gate', 'style' => 'opacity: 0.6', 'data-testid' => 'usage', 'aria-busy' => 'false'],
        [],
    ))->value(),
    'gateCss' => is_file($assetPath . '/vueforge-razor.css')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-skeleton-gate')
        && str_contains(
            (string) file_get_contents($assetPath . '/vueforge-razor.css'),
            '.vf-skeleton-gate__content--ready',
        ),
    'm16Css' => is_file($assetPath . '/vueforge-razor.css')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-skeleton')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-avatar')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-card'),
    // VfPanel's own rules, and its own stylesheet. The three selectors are
    // asserted individually rather than as one substring, because '.vf-panel'
    // alone would also be satisfied by a card stylesheet with the block name
    // rewritten - and the modifier is the rule that says which component this
    // actually is. A compact modifier is asserted absent for the same reason:
    // a stylesheet folded together with the card's would carry one.
    'panelCss' => is_file($assetPath . '/vueforge-razor.css')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-panel {')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-panel--subtle')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-panel__title')
        && !str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-panel--compact')
        && !str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-panel__body'),
    'presentationCss' => is_file($assetPath . '/vueforge-razor.css')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-badge')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-tag')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-divider'),
    'checkableCss' => is_file($assetPath . '/vueforge-razor.css')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-checkbox')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-radio')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-switch'),
    'assetPath' => $assetPath,
    'css' => is_file($assetPath . '/vueforge-razor.css') ? filesize($assetPath . '/vueforge-razor.css') : 0,
    'textareaCss' => is_file($assetPath . '/vueforge-razor.css')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-textarea'),
    'buttonCss' => is_file($assetPath . '/vueforge-razor.css')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-button'),
    'spinnerCss' => is_file($assetPath . '/vueforge-razor.css')
        && str_contains((string) file_get_contents($assetPath . '/vueforge-razor.css'), '.vf-progress-spinner'),
    'js' => is_file($assetPath . '/vueforge-razor.js') ? filesize($assetPath . '/vueforge-razor.js') : 0,
]);
`,
  );

  const rendered = JSON.parse(
    execFileSync('php', [resolve(consumerRoot, 'render.php')], {
      encoding: 'utf8',
      cwd: consumerRoot,
      env: consumerEnv,
    }),
  );

  check('the consumer renders a native input', rendered.markup.includes('<input'), rendered.markup.slice(0, 120));
  check('the consumer renders the canonical classes', rendered.markup.includes('class="vf-input'));
  check('the consumer renders the ownership marker', rendered.markup.includes('data-vf-razor="input"'));
  check('the consumer renders the clear action', rendered.markup.includes('data-vf-razor-input="clear"'));
  check('the consumer renders the reveal action', rendered.password.includes('data-vf-razor-input="password-reveal"'));
  check('the consumer renders the packaged icon data', rendered.markup.includes('<svg'));
  check(
    'the installed provider registers every migrated component',
    [
      'vf-input',
      'vf-icon-button',
      'vf-field',
      'vf-button',
      'vf-textarea',
      'vf-checkbox',
      'vf-radio',
      'vf-switch',
      'vf-badge',
      'vf-tag',
      'vf-divider',
      'vf-skeleton',
      'vf-avatar',
      'vf-card',
      'vf-panel',
      'vf-skeleton-gate',
      'vf-alert',
    ].every((tag) => rendered.handles[tag] === true),
    JSON.stringify(rendered.handles),
  );

  // The second migrated component, proved from the same installed package. A
  // glyph no VfInput case uses is deliberate: it fails if the package ever goes
  // back to shipping only the handful of icons one component needed.
  check(
    'the consumer renders the icon button',
    rendered.iconButton.includes('<button') && rendered.iconButton.includes('class="vf-icon-button'),
    rendered.iconButton.slice(0, 160),
  );
  check(
    'the icon button carries its variant and size modifiers',
    rendered.iconButton.includes('vf-icon-button--danger') && rendered.iconButton.includes('vf-icon-button--lg'),
  );
  check(
    'the packaged registry holds glyphs beyond the ones VfInput needs',
    rendered.iconButton.includes('<svg') && rendered.iconButton.includes('aria-hidden="true"'),
  );
  check(
    'the icon button carries no inline layout, because the stylesheet owns it',
    !/<svg[^>]*\sstyle=/.test(rendered.iconButton),
    rendered.iconButton.slice(0, 200),
  );

  // A provider that points outside its package is a packaging defect, not a
  // crash: report it like every other failure so the whole run is readable.
  const resolvedAssetPath = existsSync(rendered.assetPath) ? realpathSync(rendered.assetPath) : null;
  check(
    'assetPath resolves inside the installed package',
    resolvedAssetPath !== null && resolvedAssetPath.startsWith(realpathSync(installed)),
    resolvedAssetPath === null ? `${rendered.assetPath} does not exist` : resolvedAssetPath,
  );
  // ------------------------------------------------------------- vf-field
  // The relationships are what packaging could plausibly break, so they are
  // read back out of the markup rather than assumed from the tags being there.
  const fieldControlId = /<label for="([^"]+)" class="vf-field__label">/.exec(rendered.field)?.[1];
  const fieldDescriptionId = /<p id="([^"]+)" class="vf-field__description">/.exec(rendered.field)?.[1];
  check('the consumer renders a field root', rendered.field.includes('class="vf-field"'), rendered.field.slice(0, 120));
  check('the consumer renders the field label', /<label [^>]*class="vf-field__label"/.test(rendered.field));
  check(
    'the packaged field binds its label to the control it wraps',
    fieldControlId !== undefined && rendered.field.includes(`id="${fieldControlId}"`),
    fieldControlId ?? 'no association',
  );
  check(
    'the packaged field describes its control with its own description',
    fieldDescriptionId !== undefined && rendered.field.includes(`aria-describedby="${fieldDescriptionId}"`),
    fieldDescriptionId ?? 'no description relationship',
  );
  check(
    'the packaged field renders the required marker, hidden from assistive tech',
    rendered.field.includes('<span class="vf-field__required-mark" aria-hidden="true">*</span>'),
  );
  check(
    'the packaged field composes a real input inside itself',
    rendered.field.includes('class="vf-input') && rendered.field.includes('data-vf-razor="input"'),
  );
  check(
    'the packaged field server-renders the floating composition',
    rendered.floatingField.includes('vf-field--floating') &&
      rendered.floatingField.includes('vf-field__label--floating'),
  );
  check(
    'the packaged field server-renders the filled state of a pre-filled control',
    rendered.floatingField.includes('vf-field__control--filled'),
  );
  check('the packaged field carries its own enhancement marker', rendered.field.includes('data-vf-razor="field"'));

  // ------------------------------------------------------------ vf-button
  check(
    'the consumer renders a native button with the canonical classes',
    rendered.button.includes('<button') && rendered.button.includes('class="vf-button vf-button--danger vf-button--lg'),
    rendered.button.slice(0, 140),
  );
  check('the packaged button carries an explicit type', rendered.button.includes('type="button"'));
  check('the packaged button forwards native attributes', rendered.button.includes('name="save"'));
  check('the packaged button renders its slot label', rendered.button.includes('>Save<'));
  check(
    'the packaged button needs no browser controller',
    !rendered.button.includes('data-vf-razor'),
    'a native button is complete server-side',
  );
  check(
    'the packaged loading button is natively disabled and marked busy',
    rendered.loadingButton.includes('disabled') && rendered.loadingButton.includes('aria-busy="true"'),
    rendered.loadingButton.slice(0, 160),
  );
  check(
    'the packaged loading button renders the spinner as a named progressbar',
    rendered.loadingButton.includes('vf-button__spinner') &&
      rendered.loadingButton.includes('role="progressbar"') &&
      rendered.loadingButton.includes('aria-label="Loading"'),
  );
  check(
    'the packaged loading button hides only the spinner artwork',
    rendered.loadingButton.includes('aria-hidden="true"') && rendered.loadingButton.includes('Saving'),
  );
  check(
    'the packaged stylesheet carries the button and spinner rules',
    rendered.buttonCss && rendered.spinnerCss,
    JSON.stringify({ button: rendered.buttonCss, spinner: rendered.spinnerCss }),
  );

  // ---------------------------------------------------------- vf-textarea
  check(
    'the consumer renders a native textarea with the canonical class',
    rendered.textarea.includes('<textarea') && rendered.textarea.includes('class="vf-textarea"'),
    rendered.textarea.slice(0, 140),
  );
  check('the packaged textarea forwards its row count', rendered.textarea.includes('rows="4"'));
  check(
    'the packaged textarea puts its value in element text, not a value attribute',
    rendered.textarea.includes('>first line\n') && !/<textarea[^>]*\svalue=/.test(rendered.textarea),
    rendered.textarea.slice(0, 200),
  );
  check(
    'the packaged textarea escapes markup in its value',
    rendered.textarea.includes('&lt;b&gt;') &&
      rendered.textarea.includes('&amp;') &&
      !rendered.textarea.includes('<b>'),
  );
  check(
    'the packaged textarea carries its own enhancement marker',
    rendered.textarea.includes('data-vf-razor="textarea"'),
  );

  const textareaControlId = /<label for="([^"]+)" class="vf-field__label/.exec(rendered.textareaField)?.[1];
  const textareaDescriptionId = /<p id="([^"]+)" class="vf-field__description">/.exec(rendered.textareaField)?.[1];
  check(
    'the packaged textarea composes inside a real field and takes its id from it',
    textareaControlId !== undefined && rendered.textareaField.includes(`id="${textareaControlId}"`),
    textareaControlId ?? 'no association',
  );
  check(
    'the packaged field describes its textarea with its own description',
    textareaDescriptionId !== undefined &&
      rendered.textareaField.includes(`aria-describedby="${textareaDescriptionId}"`),
    textareaDescriptionId ?? 'no description relationship',
  );
  check(
    'the packaged textarea reports its filled state to the field it is inside',
    rendered.textareaField.includes('vf-field__control--filled') &&
      rendered.textareaField.includes('data-vf-filled="true"'),
  );
  check(
    'the packaged field floats around its textarea',
    rendered.textareaField.includes('vf-field--floating') && rendered.textareaField.includes('vf-textarea--floating'),
  );
  check(
    'the packaged stylesheet carries the textarea rules',
    rendered.textareaCss,
    'the textarea would render unstyled in a consumer application',
  );

  // --------------------------------------- vf-checkbox, vf-radio, vf-switch
  check(
    'the packaged checkbox renders a label wrapping a native checkbox',
    rendered.checkbox.includes('<label class="vf-checkbox vf-checkbox--md vf-checkbox--checked"') &&
      rendered.checkbox.includes('type="checkbox"') &&
      rendered.checkbox.includes('checked'),
    rendered.checkbox.slice(0, 160),
  );
  check('the packaged checkbox carries its explicit aria-checked', rendered.checkbox.includes('aria-checked="true"'));
  check(
    'the packaged indeterminate checkbox reports mixed and marks itself for enhancement',
    rendered.indeterminateCheckbox.includes('aria-checked="mixed"') &&
      rendered.indeterminateCheckbox.includes('vf-checkbox--indeterminate') &&
      rendered.indeterminateCheckbox.includes('data-vf-razor="checkbox-indeterminate"'),
    rendered.indeterminateCheckbox.slice(0, 200),
  );
  check(
    'the packaged radio group shares one name and selects exactly one member',
    (rendered.radioGroup.match(/name="pick"/g) ?? []).length === 2 &&
      (rendered.radioGroup.match(/\schecked/g) ?? []).length === 1,
    rendered.radioGroup.slice(0, 200),
  );
  check(
    'the packaged radio group gives each member its own value',
    rendered.radioGroup.includes('value="a"') && rendered.radioGroup.includes('value="b"'),
  );
  check(
    'the packaged switch is a native checkbox carrying the switch role and no aria-checked',
    rendered.switchOn.includes('type="checkbox"') &&
      rendered.switchOn.includes('role="switch"') &&
      !rendered.switchOn.includes('aria-checked'),
    rendered.switchOn.slice(0, 160),
  );
  check(
    'neither the radio nor the switch needs a browser controller',
    !rendered.radioGroup.includes('data-vf-razor') && !rendered.switchOn.includes('data-vf-razor'),
  );
  check(
    'the packaged stylesheet carries all three checkable rule sets',
    rendered.checkableCss,
    'a checkable control would render unstyled in a consumer application',
  );

  // ------------------------------------------- vf-badge, vf-tag, vf-divider
  // The M15 batch. What packaging could plausibly break without breaking a tag
  // is the neutral tone - which is the *absence* of a modifier - and the
  // divider's conditional role, so both are read out of the markup rather than
  // assumed from the components resolving.
  check(
    'the consumer renders a neutral badge with no tone modifier at all',
    rendered.badgeNeutral === '<span class="vf-badge">Draft</span>',
    rendered.badgeNeutral,
  );
  check(
    'the consumer renders a toned badge with its consumer class appended after the canonical ones',
    rendered.badgeToned.includes('class="vf-badge vf-badge--danger consumer-badge"'),
    rendered.badgeToned,
  );
  check(
    'the consumer renders a neutral tag with no tone modifier at all',
    rendered.tagNeutral === '<span class="vf-tag">Unassigned</span>',
    rendered.tagNeutral,
  );
  check(
    'the consumer renders a toned tag with its consumer class appended after the canonical ones',
    rendered.tagToned.includes('class="vf-tag vf-tag--info consumer-tag"'),
    rendered.tagToned,
  );
  check(
    'the packaged badge and tag stay distinct components rather than one block name',
    !rendered.badgeToned.includes('vf-tag') && !rendered.tagToned.includes('vf-badge'),
    `${rendered.badgeToned} | ${rendered.tagToned}`,
  );
  // The historical quirk, proved from the installed package: a horizontal
  // divider is a div carrying aria-orientation and no role at all, and only the
  // vertical one is a separator.
  check(
    'the consumer renders a horizontal divider as a roleless div carrying aria-orientation',
    rendered.dividerHorizontal ===
      '<div class="vf-divider vf-divider--horizontal" aria-orientation="horizontal"></div>',
    rendered.dividerHorizontal,
  );
  check(
    'the consumer renders a vertical divider with role=separator',
    rendered.dividerVertical ===
      '<div class="vf-divider vf-divider--vertical" aria-orientation="vertical" role="separator"></div>',
    rendered.dividerVertical,
  );
  check(
    'a consumer role reaches a horizontal divider that would otherwise expose none',
    rendered.dividerOverride.includes('role="presentation"'),
    rendered.dividerOverride,
  );
  // ------------------------------------------ vf-skeleton, vf-avatar, vf-card

  check(
    'the consumer renders a default skeleton with its animation modifier and radius',
    rendered.skeletonDefault ===
      '<div class="vf-skeleton vf-skeleton--animated" style="border-radius: var(--vf-radius-surface);" ' +
        'aria-hidden="true"></div>',
    rendered.skeletonDefault,
  );
  check(
    'the consumer renders a sized, unanimated skeleton with its consumer class appended',
    rendered.skeletonSized ===
      '<div class="vf-skeleton consumer-skeleton" style="min-height: 40px; border-radius: var(--vf-radius-surface);" ' +
        'aria-hidden="true"></div>',
    rendered.skeletonSized,
  );
  check(
    'an empty radius drops the declaration rather than zeroing it, through the packaged component',
    rendered.skeletonEmptyRadius === '<div class="vf-skeleton vf-skeleton--animated" aria-hidden="true"></div>',
    rendered.skeletonEmptyRadius,
  );
  check(
    'the consumer renders the avatar image branch with its decorative alt',
    rendered.avatarImage ===
      '<span class="vf-avatar"><img class="vf-avatar__image" src="/avatar.png" alt="Maya Chen">' + '</span>',
    rendered.avatarImage,
  );
  check(
    'the label branch beats the icon branch through the packaged component',
    rendered.avatarLabel === '<span class="vf-avatar vf-avatar--sm"><span class="vf-avatar__label">MC</span></span>',
    rendered.avatarLabel,
  );
  check(
    'the consumer renders the avatar icon branch from the neutral glyph registry, with no Node runtime',
    rendered.avatarIcon.includes('<span class="vf-icon-wrapper"') &&
      rendered.avatarIcon.includes('<svg class="vf-avatar__icon vf-icon') &&
      rendered.avatarIcon.includes('aria-hidden="true"') &&
      rendered.avatarIcon.includes('<circle') &&
      rendered.avatarIcon.startsWith('<span class="vf-avatar vf-avatar--circle">'),
    rendered.avatarIcon,
  );
  check(
    'the consumer renders the avatar default slot branch',
    rendered.avatarSlot === '<span class="vf-avatar"><b>JS</b></span>',
    rendered.avatarSlot,
  );
  check(
    'the consumer renders a composed card with unclassed header and footer wrappers',
    rendered.cardFull ===
      '<section class="vf-card"><header><h3 class="vf-card__title">Workspace</h3></header>' +
        '<div class="vf-card__body">Shared with your team.</div><footer>Updated 3 minutes ago</footer></section>',
    rendered.cardFull,
  );
  check(
    'an empty card renders no region at all',
    rendered.cardEmpty === '<section class="vf-card"></section>',
    rendered.cardEmpty,
  );

  // ------------------------------------------------------ vf-skeleton-gate
  //
  // The fifteenth component, and the only packaging assertion in this file that
  // is about two components at once.
  check(
    'the packaged gate renders both halves while loading',
    rendered.gateLoading.startsWith(
      '<div class="vf-skeleton-gate" style="min-height: 64px; --vf-skeleton-gate-fade-duration: 220ms;"' +
        ' aria-busy="true"><div class="vf-skeleton-gate__content" aria-hidden="true" inert>' +
        'Usage for this period.</div>',
    ) && rendered.gateLoading.includes('vf-skeleton-gate__overlay'),
    rendered.gateLoading.slice(0, 200),
  );
  check(
    'the packaged gate marks its faded content inert rather than removing it',
    rendered.gateLoading.includes('inert') && rendered.gateLoading.includes('Usage for this period.'),
    rendered.gateLoading.slice(0, 200),
  );
  check(
    'the packaged gate hides the overlay rather than dropping it once ready',
    rendered.gateReady.includes('<div class="vf-skeleton-gate__overlay" style="display: none;" aria-hidden="true">') &&
      rendered.gateReady.includes('vf-skeleton vf-skeleton--animated') &&
      !rendered.gateReady.includes('aria-busy'),
    rendered.gateReady.slice(0, 240),
  );
  check(
    'the packaged gate marks its content ready rather than revealing it by removing the skeleton',
    rendered.gateReady.includes('class="vf-skeleton-gate__content vf-skeleton-gate__content--ready"'),
    rendered.gateReady.slice(0, 240),
  );
  // The composition assertion. Not "the overlay looks like a skeleton" but
  // "the overlay contains, byte for byte, what the packaged vf-skeleton
  // produces for the props the gate forwards". A gate carrying its own copy of
  // the markup passes every other check in this block and fails this one.
  check(
    'the packaged gate renders the canonical packaged skeleton rather than a copy of its markup',
    rendered.gateForwarded.includes(rendered.gateChildStandalone),
    `${rendered.gateChildStandalone}\n  not found in\n  ${rendered.gateForwarded}`,
  );
  check(
    'the packaged gate forwards min-height to the child while reserving the reserve-height itself',
    rendered.gateForwarded.includes('style="min-height: 120px;') &&
      rendered.gateForwarded.includes('style="min-height: 40px; border-radius: 8px;"'),
    rendered.gateForwarded.slice(0, 260),
  );
  check(
    'the packaged gate merges consumer class, style and attributes onto its root',
    rendered.gateConsumerAttributes.includes('class="vf-skeleton-gate consumer-gate"') &&
      rendered.gateConsumerAttributes.includes('--vf-skeleton-gate-fade-duration: 220ms; opacity: 0.6;') &&
      rendered.gateConsumerAttributes.includes('data-testid="usage"') &&
      rendered.gateConsumerAttributes.includes('aria-busy="false"'),
    rendered.gateConsumerAttributes.slice(0, 260),
  );
  check(
    'the packaged stylesheet carries the gate rules the component depends on',
    rendered.gateCss,
    'vueforge-razor.css is missing .vf-skeleton-gate rules',
  );
  check(
    'a consumer control inside a card slot survives packaging unchanged',
    rendered.cardSlotControl ===
      '<section class="vf-card"><div class="vf-card__body"><button type="button">Rename</button></div></section>',
    rendered.cardSlotControl,
  );
  check('the packaged stylesheet carries the M16 rules', rendered.m16Css);

  // ------------------------------------------------------------------ vf-panel
  //
  // The sixteenth component. Every assertion here is written against VfCard:
  // a packaged panel that had become a card would satisfy a looser proof.
  check(
    'the consumer renders a panel whose default slot goes straight into the section, with no body wrapper',
    rendered.panelFull ===
      '<section class="vf-panel"><header><h3 class="vf-panel__title">Workspace</h3></header>' +
        'Shared with your team.</section>',
    rendered.panelFull,
  );
  check(
    'an empty default slot produces nothing at all, where a card would produce an empty classed div',
    rendered.panelEmptyContent ===
      '<section class="vf-panel"><header><h3 class="vf-panel__title">Workspace</h3></header></section>',
    rendered.panelEmptyContent,
  );
  check(
    'a footer slot handed to the packaged panel is dropped rather than rendered',
    rendered.panelIgnoredFooter ===
      '<section class="vf-panel"><header><h3 class="vf-panel__title">Workspace</h3></header>' +
        'Shared with your team.</section>',
    rendered.panelIgnoredFooter,
  );
  check(
    'the subtle modifier, the consumer class, the style and a data attribute all survive packaging',
    // Forwarded consumer attributes are serialised before the component's own
    // class and style, which is the same order CardComponent produces. Order
    // carries no meaning - the parity extractor sorts attributes into a map -
    // but this assertion is a literal byte comparison, so it states the order
    // the adapter actually emits rather than a tidier one.
    rendered.panelSubtle ===
      '<section data-testid="notes" class="vf-panel vf-panel--subtle consumer-panel" style="opacity: 0.6">' +
        'Quick notes.</section>',
    rendered.panelSubtle,
  );
  check(
    'a consumer control inside a panel header slot survives packaging unchanged',
    rendered.panelHeaderSlotControl ===
      '<section class="vf-panel"><header><button type="button">Edit</button></header></section>',
    rendered.panelHeaderSlotControl,
  );
  check(
    'the packaged panel never renders a card block name',
    !rendered.panelFull.includes('vf-card') &&
      !rendered.panelSubtle.includes('vf-card') &&
      !rendered.panelIgnoredFooter.includes('vf-card'),
    rendered.panelFull,
  );
  check(
    'the packaged stylesheet carries VfPanel rules of its own, with no card-shaped modifier or body rule',
    rendered.panelCss,
    'vueforge-razor.css is missing .vf-panel rules, or carries rules a panel stylesheet never had',
  );
  // ------------------------------------------------------------------ vf-alert
  //
  // The seventeenth component. The assertions are literal, and the two that
  // matter most are absences: no dismiss button in any render, and no alert
  // code in the packaged controller.
  check(
    'the consumer renders an alert with its role, its tone modifier, its decorative glyph and its body wrapper',
    rendered.alertFull.startsWith('<section class="vf-alert vf-alert--success" role="alert">') &&
      rendered.alertFull.includes('<div class="vf-alert__icon" aria-hidden="true"><span class="vf-icon-wrapper"') &&
      rendered.alertFull.includes('width="var(--vf-icon-size-lg)"') &&
      rendered.alertFull.includes('<p class="vf-alert__title">Saved</p>') &&
      rendered.alertFull.endsWith('<div class="vf-alert__body">Changes were saved.</div></div></section>'),
    rendered.alertFull.slice(0, 200),
  );
  check(
    'the danger tone keeps role=alert, and the consumer class, style and data attribute survive packaging',
    rendered.alertDanger.startsWith(
      '<section data-testid="export" class="vf-alert vf-alert--danger consumer-alert" style="opacity: 0.6" role="alert">',
    ) && !rendered.alertDanger.includes('aria-live'),
    rendered.alertDanger.slice(0, 200),
  );
  check(
    'a consumer role and accessible name replace and extend the component role',
    rendered.alertConsumerRole.startsWith('<section role="status" aria-label="Export status" class="vf-alert">') &&
      !rendered.alertConsumerRole.includes('role="alert"'),
    rendered.alertConsumerRole.slice(0, 200),
  );
  check(
    'a consumer control in the alert body is the only focusable element, and the hidden icon renders no container',
    rendered.alertSlotControl ===
      '<section class="vf-alert" role="alert"><div class="vf-alert__content">' +
        '<div class="vf-alert__body"><button type="button">Retry</button></div></div></section>',
    rendered.alertSlotControl,
  );
  check(
    'the packaged alert renders no dismiss control in any configuration',
    [rendered.alertFull, rendered.alertDanger, rendered.alertConsumerRole, rendered.alertGlyph].every(
      (markup) => !markup.includes('<button') && !markup.includes('dismiss') && !markup.includes('tabindex'),
    ) && (rendered.alertSlotControl.match(/<button/g) ?? []).length === 1,
    'a packaged alert grew a control the reference never had',
  );
  check(
    'the warn tone renders the alert-circle glyph through the packaged registry',
    rendered.alertGlyph.includes('<svg') && rendered.alertGlyph.includes('vf-alert--warn'),
    rendered.alertGlyph.slice(0, 200),
  );
  check(
    'the packaged stylesheet carries VfAlert rules of its own, with no neutral paint and no dismiss selector',
    rendered.alertCss,
    'vueforge-razor.css is missing .vf-alert rules, or carries rules an alert stylesheet never had',
  );
  check(
    'the packaged controller carries no alert code, because the alert owns no interaction',
    rendered.alertBrowserCode === false,
    'vueforge-razor.js mentions the alert; the reference has no browser behaviour for it',
  );

  check(
    'the packaged stylesheet carries the presentation rules',
    rendered.presentationCss,
    'a badge, tag or divider would render unstyled in a consumer application',
  );

  check('the packaged stylesheet exists and is not empty', rendered.css > 10_000, `${rendered.css} bytes`);
  check('the packaged controller exists and is not empty', rendered.js > 1_000, `${rendered.js} bytes`);

  // ------------------------------------------------------------ the browser
  if (resolvedAssetPath === null || rendered.css === 0 || rendered.js === 0) {
    check('the packaged assets are servable to a browser', false, 'no assets to serve; skipping the browser smoke');
  } else {
    const port = await freePort();
    const documentRoot = resolve(consumerRoot, 'public');
    mkdirSync(documentRoot, { recursive: true });
    cpSync(rendered.assetPath, resolve(documentRoot, 'assets'), { recursive: true });
    writeFileSync(
      resolve(documentRoot, 'index.html'),
      `<!doctype html><html lang="en" data-vf-theme="light"><head><meta charset="utf-8">
<link rel="stylesheet" href="/assets/vueforge-razor.css"></head><body>
${rendered.markup}
${rendered.password}
<script type="module" src="/assets/vueforge-razor.js"></script></body></html>`,
    );

    const server = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', documentRoot], {
      cwd: consumerRoot,
      stdio: 'ignore',
      detached: true,
      env: { ...consumerEnv, PHP_CLI_SERVER_WORKERS: '4' },
    });
    chromeState.server = server;

    const origin = `http://127.0.0.1:${port}`;
    const startedAt = Date.now();
    while (Date.now() - startedAt < 30_000 && (await probe(`${origin}/`)) !== 200) await delay(250);

    const chrome = await launchChrome();
    chromeState.chrome = chrome;
    const page = await openPage(chrome.endpoint);

    try {
      await page.send('Page.enable');
      await page.send('Runtime.enable');
      await page.send('Page.navigate', { url: `${origin}/` });
      await page.waitFor(`Boolean(document.querySelector('[data-vf-razor-enhanced]'))`);
      await delay(250);

      const smoke = await page.evaluate(`(() => {
      const control = document.querySelector('input[name="workspace"]');
      const clear = control.closest('[data-vf-razor="input"]').querySelector('[data-vf-razor-input="clear"]');
      const password = document.querySelector('input[name="secret"]');
      const reveal = password.closest('[data-vf-razor="input"]').querySelector('[data-vf-razor-input="password-reveal"]');
      const styled = getComputedStyle(control);

      const before = { value: control.value, clearVisible: getComputedStyle(clear).display !== 'none' };
      clear.click();
      const afterClear = { value: control.value, focused: document.activeElement === control };
      const typeBefore = password.getAttribute('type');
      reveal.click();
      const typeAfter = password.getAttribute('type');

      return {
        before,
        afterClear,
        typeBefore,
        typeAfter,
        enhanced: document.querySelectorAll('[data-vf-razor-enhanced]').length,
        styledPadding: styled.paddingTop,
        styledBorder: styled.borderTopWidth,
      };
    })()`);

      check('the packaged controller enhanced both controls', smoke.enhanced === 2, JSON.stringify(smoke.enhanced));
      check(
        'the packaged stylesheet actually styles the control',
        smoke.styledPadding !== '0px' && smoke.styledBorder !== '0px',
        JSON.stringify(smoke),
      );
      check('the clear action is offered for a filled control', smoke.before.clearVisible === true);
      check('clear empties the control', smoke.afterClear.value === '', JSON.stringify(smoke.afterClear));
      check('clear returns focus to the control', smoke.afterClear.focused === true);
      check(
        'reveal switches the password to text',
        smoke.typeBefore === 'password' && smoke.typeAfter === 'text',
        JSON.stringify(smoke),
      );
      check(
        'the page produced no script error',
        page.diagnostics.pageErrors.length === 0,
        page.diagnostics.pageErrors.join('; '),
      );
    } finally {
      await page.close();
    }
  }
} finally {
  if (chromeState.chrome) await chromeState.chrome.close();
  if (chromeState.server) {
    try {
      process.kill(-chromeState.server.pid, 'SIGKILL');
    } catch {
      chromeState.server.kill('SIGKILL');
    }
  }
  rmSync(workspace, { recursive: true, force: true });
}

process.stdout.write(`\n${passed.length} consumer assertion(s) passed.\n`);

if (failures.length > 0) {
  process.stderr.write(`\n[razor-packaged-consumer] FAILED with ${failures.length} failure(s):\n`);
  for (const failure of failures) process.stderr.write(`  - ${failure}\n`);
  process.exit(1);
}

process.stdout.write(
  '[razor-packaged-consumer] OK: the published artifact installs outside the repository, resolves its own assets ' +
    `and works in a browser with no Node available (${relative(repositoryRoot, repositoryRoot) || '.'}).\n`,
);
