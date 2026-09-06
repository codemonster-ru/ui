<?php

declare(strict_types=1);

/**
 * Renders the shared VfInput cases with the real Razor adapter.
 *
 * Maps the neutral case vocabulary onto the Razor component's own prop
 * spelling. No expectation lives here: this is a render target, and the
 * comparison happens in the browser harness.
 *
 * Usage: php render-razor-cases.php <cases.json> <output.html>
 */

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;

$repositoryRoot = dirname(__DIR__, 3);
require $repositoryRoot . '/packages/razor/vendor/autoload.php';

[$script, $casesPath, $outputPath] = array_pad($argv, 3, null);

if ($casesPath === null || $outputPath === null) {
    fwrite(STDERR, "Usage: php render-razor-cases.php <cases.json> <output.html>\n");
    exit(1);
}

$catalog = json_decode((string) file_get_contents($casesPath), true, 512, JSON_THROW_ON_ERROR);

$registry = new ComponentRegistry();
$registry->register(new VueForgeRazorProvider());
$input = $registry->resolve('vf-input');

if ($input === null) {
    fwrite(STDERR, "vf-input is not registered.\n");
    exit(1);
}

/** Neutral prop names onto the Razor spelling. */
const PROP_MAP = [
    'modelValue' => 'value',
    'size' => 'size',
    'invalid' => 'invalid',
    'leadingIcon' => 'leading-icon',
    'trailingIcon' => 'trailing-icon',
    'clearable' => 'clearable',
    'passwordReveal' => 'password-reveal',
];

$escape = static fn (string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

$renderInput = static function (array $case, array $extra = []) use ($input, $escape): string {
    $props = $extra;

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[PROP_MAP[$name] ?? $name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    $slots = [];
    foreach (['leading', 'trailing'] as $slot) {
        $text = $case['content'][$slot]['text'] ?? null;
        if ($text !== null) {
            $markup = '<span class="parity-content">' . $escape((string) $text) . '</span>';
            $slots[$slot] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
        }
    }

    return $input->render(new ComponentRenderContext($props, $slots))->value();
};

/**
 * Field shell for the field cases.
 *
 * Deliberately not a migrated public Razor VfField: it is the harness producing
 * the field DOM the controller bridges to, so the shared field cases can be
 * compared. Migrating VfField is its own milestone.
 */
$renderField = static function (array $case, string $controlId) use ($renderInput, $escape): string {
    $field = $case['field'];
    $floating = ($field['placement'] ?? 'top') === 'floating';
    $variant = $field['variant'] ?? 'in';
    $hasError = isset($field['error']);
    $describedByIds = [];

    $descriptionId = $controlId . '-description';
    $errorId = $controlId . '-error';

    if (isset($field['description'])) {
        $describedByIds[] = $descriptionId;
    }
    if ($hasError) {
        $describedByIds[] = $errorId;
    }

    $control = $renderInput($case, array_filter([
        'id' => $controlId,
        'aria-describedby' => $describedByIds === [] ? null : implode(' ', $describedByIds),
        'invalid' => $hasError ? true : null,
    ], static fn ($value): bool => $value !== null));

    $label = '<label class="vf-field__label' . ($floating ? ' vf-field__label--floating' : '') . '" for="'
        . $escape($controlId) . '">' . $escape((string) $field['label']) . '</label>';

    $rootClasses = 'vf-field'
        . ($hasError ? ' vf-field--invalid' : '')
        . ($floating ? ' vf-field--floating vf-field--floating-' . $escape((string) $variant) : '');
    $controlClasses = 'vf-field__control' . ($floating ? ' vf-field__control--floating' : '');

    $markup = '<div class="' . $rootClasses . '" data-vf-razor-field="' . ($floating ? 'floating' : 'top') . '">';
    $markup .= $floating ? '' : $label;
    $markup .= '<div class="' . $controlClasses . '">' . $control . ($floating ? $label : '') . '</div>';

    if (isset($field['description'])) {
        $markup .= '<p id="' . $escape($descriptionId) . '" class="vf-field__description">'
            . $escape((string) $field['description']) . '</p>';
    }
    if ($hasError) {
        $markup .= '<p id="' . $escape($errorId) . '" class="vf-field__error">'
            . $escape((string) $field['error']) . '</p>';
    }

    return $markup . '</div>';
};

$sections = '';

foreach ($catalog['cases'] as $case) {
    $caseId = (string) $case['id'];
    $body = isset($case['field'])
        ? $renderField($case, str_replace('/', '-', $caseId) . '-control')
        : $renderInput($case);

    if (($case['attrs']['aria-describedby'] ?? null) === 'aria-described-hint') {
        $body .= '<p id="aria-described-hint" class="parity-hint">Shown in workspace settings.</p>';
    }

    $sections .= '<div class="parity-case" data-parity-case="' . $escape($caseId) . '">' . $body . '</div>';
}

$html = <<<HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>VueForge Razor parity cases</title>
<link rel="stylesheet" href="./vueforge-razor.css">
<link rel="stylesheet" href="./parity-page.css">
</head>
<body>
<div id="parity-root"><div class="parity-cases">{$sections}</div></div>
<script type="module" src="./vueforge-razor.js"></script>
<script type="module">
  const theme = new URLSearchParams(window.location.search).get('theme') ?? 'light';
  document.documentElement.setAttribute('data-vf-theme', theme);
  document.documentElement.setAttribute('data-parity-ready', 'true');
</script>
</body>
</html>
HTML;

file_put_contents($outputPath, $html);
