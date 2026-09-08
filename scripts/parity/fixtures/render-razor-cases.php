<?php

declare(strict_types=1);

/**
 * Renders a component's shared cases with the real Razor adapter.
 *
 * Maps the neutral case vocabulary onto the Razor component's own prop
 * spelling. No expectation lives here: this is a render target, and the
 * comparison happens in the browser harness.
 *
 * One renderer serves every component; the catalog's `component` field says
 * which one it is rendering. A second fixture per component is how two
 * adapters end up compared under two slightly different sets of assumptions.
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

$component = (string) ($catalog['component'] ?? 'input');

$registry = new ComponentRegistry();
$registry->register(new VueForgeRazorProvider());
$input = $registry->resolve('vf-input');
$iconButton = $registry->resolve('vf-icon-button');
$fieldComponent = $registry->resolve('vf-field');
$buttonComponent = $registry->resolve('vf-button');
$textareaComponent = $registry->resolve('vf-textarea');

if (
    $input === null || $iconButton === null || $fieldComponent === null
    || $buttonComponent === null || $textareaComponent === null
) {
    fwrite(STDERR, "The VueForge components are not registered.\n");
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

/**
 * VfIconButton needs no prop map: the neutral vocabulary and the Razor spelling
 * are the same words, because the historical Vue props are already
 * single-word. Props and attrs are merged the same way for both components.
 */
$renderIconButton = static function (array $case) use ($iconButton): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    return $iconButton->render(new ComponentRenderContext($props, []))->value();
};

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
 * The real Razor VfField wrapping the real Razor VfInput.
 *
 * This is what M11 closed. Until now the harness authored the field DOM here -
 * the label, the ids, the described-by, the floating classes - which meant the
 * field half of every VfInput case was comparing Vue's component against this
 * file's idea of a field. A defect the two agreed on was invisible, and the
 * markup carried no required marker at all because nothing here needed one.
 *
 * The control id is passed explicitly rather than generated, because the case
 * id is what makes a failure readable; everything else - the label, the
 * association, the description and error ids, aria-describedby, the floating
 * and filled classes - now comes from the component.
 */
$renderField = static function (array $case, string $controlId) use ($fieldComponent, $renderInput): string {
    $field = $case['field'];
    $props = [
        'label' => $field['label'],
        'control-id' => $controlId,
        'label-placement' => $field['placement'] ?? 'top',
    ];

    if (isset($field['variant'])) {
        $props['floating-variant'] = $field['variant'];
    }
    if (isset($field['description'])) {
        $props['description'] = $field['description'];
    }
    if (isset($field['error'])) {
        $props['error'] = $field['error'];
    }
    if (($field['required'] ?? false) === true) {
        $props['required'] = true;
    }
    if (($field['invalid'] ?? false) === true) {
        $props['invalid'] = true;
    }

    return $fieldComponent->render(new ComponentRenderContext($props, [
        'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($renderInput($case)),
    ]))->value();
};

/**
 * A field case: the field component wrapping its control.
 *
 * The VfField catalog keeps the control's own props under `control` and the
 * field root's attributes under `fieldAttrs`, so neither can be mistaken for
 * the other the way a single flat map would allow.
 */
$renderFieldCase = static function (array $case, string $controlId) use ($fieldComponent, $renderInput, $escape): string {
    $field = $case['field'] ?? [];
    $props = ['control-id' => $controlId];

    if (isset($field['label'])) {
        $props['label'] = $field['label'];
    }
    if (isset($field['placement'])) {
        $props['label-placement'] = $field['placement'];
    }
    if (isset($field['variant'])) {
        $props['floating-variant'] = $field['variant'];
    }
    if (isset($field['description'])) {
        $props['description'] = $field['description'];
    }
    if (isset($field['error'])) {
        $props['error'] = $field['error'];
    }
    if (($field['required'] ?? false) === true) {
        $props['required'] = true;
    }
    if (($field['invalid'] ?? false) === true) {
        $props['invalid'] = true;
    }

    foreach ($case['fieldAttrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    $controlCase = ['props' => $case['control'] ?? [], 'attrs' => $case['attrs'] ?? []];
    $slots = [
        'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($renderInput($controlCase)),
    ];

    foreach (['label', 'description', 'error'] as $slot) {
        $text = $case['content'][$slot]['text'] ?? null;
        if ($text !== null) {
            $markup = $escape((string) $text);
            $slots[$slot] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
        }
    }

    return $fieldComponent->render(new ComponentRenderContext($props, $slots))->value();
};

/**
 * A button case: props, forwarded attrs and whatever the default slot holds.
 *
 * The historical component has no icon props, so an icon is slot content -
 * rendered from the neutral registry, the same source the Vue side reads.
 */
$renderButton = static function (array $case) use ($buttonComponent, $escape): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    $slot = '';
    if (isset($case['content']['icon'])) {
        // The literal default the Vue icon component uses when no size prop is
        // given, so both adapters write the same width and height.
        $slot .= \Codemonster\VueForge\Razor\Support\IconRenderer::render(
            (string) $case['content']['icon'],
            'var(--vf-icon-current-size, var(--vf-icon-size-md))',
            true,
        );
    }
    if (isset($case['content']['label'])) {
        $slot .= $escape((string) $case['content']['label']);
    }

    return $buttonComponent->render(new ComponentRenderContext($props, [
        'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($slot),
    ]))->value();
};

/**
 * A textarea case, optionally wrapped in the real vf-field.
 *
 * The control takes its id and relationships from the field context, so
 * nothing here wires them by hand - which is the point of the field being real.
 */
$renderTextareaCase = static function (array $case, string $controlId) use ($textareaComponent, $fieldComponent): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name === 'modelValue' ? 'value' : $name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    $control = static fn (): RenderedHtml => $textareaComponent->render(new ComponentRenderContext($props, []));

    if (!isset($case['field'])) {
        return $control()->value();
    }

    $field = $case['field'];
    $fieldProps = ['control-id' => $controlId];

    foreach ([
        'label' => 'label',
        'placement' => 'label-placement',
        'description' => 'description',
        'error' => 'error',
    ] as $from => $to) {
        if (isset($field[$from])) {
            $fieldProps[$to] = $field[$from];
        }
    }
    if (($field['required'] ?? false) === true) {
        $fieldProps['required'] = true;
    }

    return $fieldComponent->render(new ComponentRenderContext($fieldProps, ['default' => $control]))->value();
};

$sections = '';

foreach ($catalog['cases'] as $case) {
    $caseId = (string) $case['id'];

    if ($component === 'icon-button') {
        $body = $renderIconButton($case);
    } elseif ($component === 'textarea') {
        $body = $renderTextareaCase($case, str_replace('/', '-', $caseId) . '-control');
    } elseif ($component === 'button') {
        $body = $renderButton($case);
    } elseif ($component === 'field') {
        $body = $renderFieldCase($case, str_replace('/', '-', $caseId) . '-control');
    } else {
        $body = isset($case['field'])
            ? $renderField($case, str_replace('/', '-', $caseId) . '-control')
            : $renderInput($case);
    }

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
