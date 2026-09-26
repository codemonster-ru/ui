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

// ---------------------------------------------------------------- accordion
//
// The M22 sections. Real vf-accordion renders in the states the browser suite
// drives: closed, open, disabled, a consumer button in the panel, two
// siblings, a nested pair, an input inside a closed panel (so the content the
// controller renders on open is itself enhanced), and a copy of the accordion
// markup *without* the ownership marker, which the controller must ignore.
$accordion = $registry->resolve('vf-accordion');
if ($accordion === null) {
    fwrite(STDERR, "vf-accordion must be registered.\n");
    exit(1);
}
$renderAccordion = static function (array $props, array $slots = []) use ($accordion): string {
    $closures = [];
    foreach ($slots as $name => $markup) {
        $closures[$name] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    return $accordion->render(new ComponentRenderContext($props, $closures))->value();
};
$accordionCases = [
    'accordion-closed' => $renderAccordion(['title' => 'Closed'], ['default' => '<p>Closed content.</p>']),
    'accordion-open' => $renderAccordion(['title' => 'Open', 'default-open' => true], ['default' => '<p>Open content.</p>']),
    'accordion-disabled' => $renderAccordion(['title' => 'Disabled', 'disabled' => true], ['default' => '<p>Never.</p>']),
    'accordion-consumer' => $renderAccordion(['title' => 'Export'], ['default' => '<p>Failed.</p><button type="button" id="consumer-retry">Retry</button>']),
    'accordion-siblings' => $renderAccordion(['title' => 'First']) . $renderAccordion(['title' => 'Second', 'default-open' => true], ['default' => '<p>Second content.</p>']),
    'accordion-nested' => $renderAccordion(
        ['title' => 'Outer', 'default-open' => true],
        ['default' => '<p>Outer content.</p>' . $renderAccordion(['title' => 'Inner'], ['default' => '<p>Inner content.</p>'])],
    ),
    'accordion-with-input' => $renderAccordion(
        ['title' => 'Form'],
        ['default' => $render(['name' => 'inside', 'id' => 'inside-accordion', 'value' => 'typed', 'clearable' => true])],
    ),
    // The same markup with the marker stripped: not Razor-owned, must not mount.
    'accordion-unowned' => str_replace(' data-vf-razor="accordion"', '', $renderAccordion(['title' => 'Unowned'], ['default' => '<p>No.</p>'])),
];
foreach ($accordionCases as $name => $markup) {
    $sections .= '<section class="case" data-case="' . $name . '"><h2>' . $name . '</h2>' . $markup . '</section>';
}

// ------------------------------------------------------------------ stepper
//
// The M23 sections. Real vf-stepper renders in the states the browser suite
// drives: a horizontal default, a vertical one, one with a disabled middle
// step, two siblings *sharing* values (the shared-value focus quirk the Razor
// controller does not reproduce), a consumer button beside a stepper, and a
// copy of the stepper markup without the ownership marker, which the
// controller must ignore.
$stepper = $registry->resolve('vf-stepper');
if ($stepper === null) {
    fwrite(STDERR, "vf-stepper must be registered.\n");
    exit(1);
}
$stepperItems = [
    ['value' => 'account', 'label' => 'Account'],
    ['value' => 'profile', 'label' => 'Profile', 'description' => 'Tell us about yourself'],
    ['value' => 'confirm', 'label' => 'Confirm'],
];
$renderStepper = static function (array $props) use ($stepper, $stepperItems): string {
    return $stepper->render(new ComponentRenderContext($props + ['items' => $stepperItems], []))->value();
};
$stepperCases = [
    'stepper-horizontal' => $renderStepper([]),
    'stepper-vertical' => $renderStepper(['orientation' => 'vertical', 'default-value' => 'profile']),
    'stepper-disabled' => $renderStepper(['items' => [
        $stepperItems[0],
        $stepperItems[1] + ['disabled' => true],
        $stepperItems[2],
    ]]),
    'stepper-siblings' => $renderStepper(['aria-label' => 'First']) . $renderStepper(['aria-label' => 'Second', 'default-value' => 'confirm']),
    'stepper-consumer' => $renderStepper(['default-value' => 'profile']) . '<button type="button" id="stepper-continue">Continue</button>',
    // The same markup with the marker stripped: not Razor-owned, must not mount.
    'stepper-unowned' => str_replace(' data-vf-razor="stepper"', '', $renderStepper(['aria-label' => 'Unowned'])),
];
foreach ($stepperCases as $name => $markup) {
    $sections .= '<section class="case" data-case="' . $name . '"><h2>' . $name . '</h2>' . $markup . '</section>';
}

// --------------------------------------------------------------------- tabs
//
// The M24 sections. Real vf-tabs renders in the states the browser suite
// drives: three tabs with a per-item panel, one with a disabled middle tab, an
// overflowing seven-tab list in a 360px case, two siblings *sharing* values
// (the Razor controller focuses within its own root), a consumer button
// inside the panel, a controlled unknown value, and a copy of the tabs markup
// without the ownership marker, which the controller must ignore.
$tabs = $registry->resolve('vf-tabs');
if ($tabs === null) {
    fwrite(STDERR, "vf-tabs must be registered.\n");
    exit(1);
}
$tabItems = [
    ['value' => 'overview', 'label' => 'Overview'],
    ['value' => 'settings', 'label' => 'Settings'],
    ['value' => 'billing', 'label' => 'Billing'],
];
$manyTabItems = [
    ...$tabItems,
    ['value' => 'docs', 'label' => 'Documentation'],
    ['value' => 'release', 'label' => 'Release notes'],
    ['value' => 'security', 'label' => 'Security'],
    ['value' => 'team', 'label' => 'Team members'],
];
$renderTabs = static function (array $props, ?string $panelText = 'Panel for', bool $control = false) use ($tabs, $tabItems): string {
    $items = $props['items'] ?? $tabItems;
    $slots = [];
    if ($panelText !== null) {
        foreach ($items as $index => $item) {
            $markup = '<p>' . $panelText . ' ' . htmlspecialchars($item['value'], ENT_QUOTES) . '</p>'
                . ($control ? '<button type="button" class="tabs-panel-control">Save</button>' : '');
            $slots['panel' . $index] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
        }
    }
    return $tabs->render(new ComponentRenderContext($props + ['items' => $tabItems], $slots))->value();
};
$tabsCases = [
    'tabs-default' => $renderTabs(['aria-label' => 'Default']),
    'tabs-disabled' => $renderTabs(['aria-label' => 'Disabled', 'items' => [
        $tabItems[0],
        $tabItems[1] + ['disabled' => true],
        $tabItems[2],
    ]]),
    'tabs-overflow' => $renderTabs(['aria-label' => 'Overflow', 'items' => $manyTabItems], null),
    'tabs-siblings' => $renderTabs(['aria-label' => 'First']) . $renderTabs(['aria-label' => 'Second', 'default-value' => 'billing']),
    'tabs-consumer' => $renderTabs(['aria-label' => 'Consumer'], 'Panel for', true),
    'tabs-unknown' => $renderTabs(['aria-label' => 'Unknown', 'model-value' => 'nope']),
    // The same markup with the marker stripped: not Razor-owned, must not mount.
    'tabs-unowned' => str_replace(' data-vf-razor="tabs"', '', $renderTabs(['aria-label' => 'Unowned'])),
];
foreach ($tabsCases as $name => $markup) {
    $sections .= '<section class="case case--tabs" data-case="' . $name . '"><h2>' . $name . '</h2>' . $markup . '</section>';
}

// ----------------------------------------------------------------- dropdown

// The M28 sections. Real vf-dropdown renders in the states the browser suite
// drives: closed and initially open, in place, into a named overlay root,
// two siblings for the escape stack and the outside click, disabled,
// closeOnSelect off, a menu of vf-menu-item with a disabled item and a real
// vf-input inside it (content the controller must enhance each time it
// renders a menu), and a copy with the ownership marker stripped.
$dropdown = $registry->resolve('vf-dropdown');
$menuComponent = $registry->resolve('vf-menu');
$menuItemComponent = $registry->resolve('vf-menu-item');
if ($dropdown === null || $menuComponent === null || $menuItemComponent === null) {
    fwrite(STDERR, "vf-dropdown, vf-menu and vf-menu-item must be registered.\n");
    exit(1);
}
$dropdownItems = '<button type="button" role="menuitem" class="vf-dropdown__item">Alpha</button>'
    . '<button type="button" role="menuitem" class="vf-dropdown__item">Beta</button>'
    . '<button type="button" role="menuitem" class="vf-dropdown__item">Gamma</button>';
$renderDropdown = static function (array $props, string $trigger, string $content = '') use ($dropdown, $dropdownItems): string {
    return $dropdown->render(new ComponentRenderContext($props, [
        'trigger' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($trigger),
        'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($content !== '' ? $content : $dropdownItems),
    ]))->value();
};
$dropdownMenu = $menuComponent->render(new ComponentRenderContext([], [
    'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString(
        $menuItemComponent->render(new ComponentRenderContext(['label' => 'Edit'], []))->value()
        . $menuItemComponent->render(new ComponentRenderContext(['label' => 'Duplicate', 'disabled' => true], []))->value()
        . $menuItemComponent->render(new ComponentRenderContext(['label' => 'Delete', 'tone' => 'danger'], []))->value(),
    ),
]))->value();
$dropdownInput = $input->render(new ComponentRenderContext(['name' => 'menu-search', 'value' => 'find', 'clearable' => true, 'aria-label' => 'Search'], []))->value();
$dropdownCases = [
    'dropdown-default' => $renderDropdown(['aria-label' => 'Default'], '<span>Actions</span>'),
    // Inert until the browser suite inserts it: an open dropdown closes on
    // any click outside it and focuses its own trigger - the reference's
    // behaviour - which would take focus from every other suite on the page.
    'dropdown-open' => '<template id="dropdown-open-source">'
        . $renderDropdown(['aria-label' => 'Open', 'default-open' => true], '<span>Open</span>')
        . '</template>',
    'dropdown-inline' => $renderDropdown(['aria-label' => 'Inline', 'disable-teleport' => true], '<span>Inline</span>'),
    'dropdown-target' => $renderDropdown(['aria-label' => 'Target', 'teleport-to' => '#razor-overlay-root'], '<span>Target</span>'),
    'dropdown-siblings' => $renderDropdown(['aria-label' => 'First'], '<span>First</span>')
        . $renderDropdown(['aria-label' => 'Second'], '<span>Second</span>')
        . '<button type="button" class="dropdown-outside">Outside</button>',
    'dropdown-disabled' => $renderDropdown(['aria-label' => 'Disabled', 'disabled' => true, 'default-open' => true], '<span>Disabled</span>'),
    'dropdown-keep' => $renderDropdown(['aria-label' => 'Keep', 'close-on-select' => false], '<span>Keep</span>'),
    'dropdown-menu' => $renderDropdown(['aria-label' => 'Menu', 'placement' => 'bottom-end', 'variant' => 'pills'], '<button type="button" class="dropdown-trigger-control">Menu</button>', $dropdownMenu . $dropdownInput),
    // The same markup with the marker stripped: not Razor-owned, must not mount.
    'dropdown-unowned' => str_replace(' data-vf-razor="dropdown"', '', $renderDropdown(['aria-label' => 'Unowned'], '<span>Unowned</span>')),
];
foreach ($dropdownCases as $name => $markup) {
    $sections .= '<section class="case case--dropdown" data-case="' . $name . '"><h2>' . $name . '</h2>' . $markup . '</section>';
}

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
.case--tabs { width: 360px; }
.case--dropdown { width: 360px; }
.case h2 { font-size: 12px; margin: 0 0 6px; color: var(--vf-color-text-secondary); font-weight: 400; }
</style>
</head>
<body>
<form id="fixture-form" action="#" method="get">
{$sections}
{$vueSection}
<button type="submit" id="submit">Submit</button>
</form>
<div id="razor-overlay-root"></div>
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
