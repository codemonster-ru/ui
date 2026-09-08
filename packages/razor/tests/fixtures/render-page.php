<?php

declare(strict_types=1);

/**
 * Renders the browser-test fixture page.
 *
 * This is a test fixture, not a showcase: it exists so the browser suite has a
 * real PHP-rendered page with real assets to drive. Building a Razor showcase is
 * a later milestone.
 *
 * Usage: php render-page.php <output.html>
 */

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;

require dirname(__DIR__, 2) . '/vendor/autoload.php';

$registry = new ComponentRegistry();
$registry->register(new VueForgeRazorProvider());
$input = $registry->resolve('vf-input');
$field = $registry->resolve('vf-field');

if ($input === null || $field === null) {
    fwrite(STDERR, "vf-input and vf-field must both be registered.\n");
    exit(1);
}

/**
 * @param array<string, mixed> $props
 * @param array<string, string> $slots
 */
$render = static function (array $props, array $slots = []) use ($input): string {
    $closures = [];
    foreach ($slots as $name => $markup) {
        $closures[$name] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    return $input->render(new ComponentRenderContext($props, $closures))->value();
};

/**
 * The real vf-field wrapping the real vf-input.
 *
 * M11 replaced the handwritten shell that used to stand here. The control is
 * rendered inside the field's default slot, so the id, the label association
 * and the floating and filled classes all come from the component rather than
 * from the fixture agreeing with itself.
 *
 * @param array<string, mixed> $inputProps
 */
$fieldShell = static function (string $id, string $label, array $inputProps, bool $floating) use ($field, $input): string {
    return $field->render(new ComponentRenderContext([
        'label' => $label,
        'control-id' => $id,
        'label-placement' => $floating ? 'floating' : 'top',
        'data-testid' => 'field-' . $id,
    ], [
        'default' => static fn (): RenderedHtml => $input->render(
            new ComponentRenderContext($inputProps, []),
        ),
    ]))->value();
};

$cases = [
    'plain' => $render(['name' => 'plain', 'id' => 'plain', 'placeholder' => 'Plain']),
    'filled' => $render(['name' => 'filled', 'id' => 'filled', 'value' => 'Acme']),
    'clearable' => $render(['name' => 'clearable', 'id' => 'clearable', 'value' => 'billing', 'clearable' => true]),
    'clearable-empty' => $render(['name' => 'clearable-empty', 'id' => 'clearable-empty', 'clearable' => true]),
    'password' => $render([
        'name' => 'password',
        'id' => 'password',
        'type' => 'password',
        'value' => 'typed-secret',
        'password-reveal' => true,
    ]),
    'password-clearable' => $render([
        'name' => 'password-clearable',
        'id' => 'password-clearable',
        'type' => 'password',
        'value' => 'secret',
        'password-reveal' => true,
        'clearable' => true,
        'trailing-icon' => 'eye',
    ]),
    'leading' => $render(['name' => 'leading', 'id' => 'leading', 'leading-icon' => 'eye']),
    'trailing' => $render(['name' => 'trailing', 'id' => 'trailing', 'trailing-icon' => 'xmark']),
    'invalid' => $render(['name' => 'invalid', 'id' => 'invalid', 'invalid' => true, 'value' => 'bad']),
    'disabled' => $render([
        'name' => 'disabled',
        'id' => 'disabled',
        'value' => 'locked',
        'disabled' => true,
        'clearable' => true,
    ]),
    'readonly' => $render([
        'name' => 'readonly',
        'id' => 'readonly',
        'value' => 'fixed',
        'readonly' => true,
        'clearable' => true,
    ]),
    'number' => $render([
        'name' => 'number',
        'id' => 'number',
        'type' => 'number',
        'value' => '5',
        'min' => '1',
        'max' => '99',
        'step' => '1',
    ]),
    'size-sm' => $render(['name' => 'size-sm', 'id' => 'size-sm', 'size' => 'sm', 'value' => 'Small']),
    'size-lg' => $render(['name' => 'size-lg', 'id' => 'size-lg', 'size' => 'lg', 'value' => 'Large']),
];

$sections = '';
foreach ($cases as $name => $markup) {
    $sections .= '<section class="case" data-case="' . $name . '"><h2>' . $name . '</h2>' . $markup . '</section>';
}

$sections .= '<section class="case" data-case="field-top"><h2>field-top</h2>'
    . $fieldShell('field-top-input', 'Workspace', [
        'name' => 'field-top',
        'value' => '',
    ], false)
    . '</section>';

$sections .= '<section class="case" data-case="field-floating"><h2>field-floating</h2>'
    . $fieldShell('field-floating-input', 'Workspace', [
        'name' => 'field-floating',
        'value' => '',
        'clearable' => true,
    ], true)
    . '</section>';

$withVue = ($argv[2] ?? '') === '--with-vue';
$vueSection = $withVue
    ? '<section class="case" data-case="vue"><h2>vue</h2><div id="vue-input"></div></section>'
        . '<script type="module" src="./vue-input.js"></script>'
    : '';

$noScript = ($argv[2] ?? '') === '--no-js';
$controllerScript = $noScript ? '' : '<script type="module" src="./vueforge-razor.js"></script>';

$html = <<<HTML
<!doctype html>
<html lang="en" data-vf-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VueForge Razor fixture</title>
<link rel="stylesheet" href="./vueforge-razor.css">
<style>
body { margin: 0; padding: 24px; background: var(--vf-color-background-canvas); font-family: var(--vf-font-family-base); }
.case { margin-bottom: 20px; max-width: 420px; }
.case h2 { font-size: 12px; margin: 0 0 6px; color: var(--vf-color-text-secondary); font-weight: 400; }
</style>
</head>
<body>
<form id="fixture-form" action="#" method="get">
{$sections}
{$vueSection}
<button type="submit" id="submit">Submit</button>
</form>
{$controllerScript}
</body>
</html>
HTML;

$output = $argv[1] ?? '';
if ($output === '') {
    fwrite(STDERR, "Usage: php render-page.php <output.html> [--with-vue|--no-js]\n");
    exit(1);
}

file_put_contents($output, $html);
