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
