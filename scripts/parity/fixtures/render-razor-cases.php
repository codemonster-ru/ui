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
$checkableComponents = [
    'checkbox' => $registry->resolve('vf-checkbox'),
    'radio' => $registry->resolve('vf-radio'),
    'switch' => $registry->resolve('vf-switch'),
];
// The M15 presentation components. Resolved separately rather than through a
// shared list: a fixture that looked up "the toned span for this catalog" is
// exactly where VfBadge could quietly start rendering VfTag.
$badgeComponent = $registry->resolve('vf-badge');
$tagComponent = $registry->resolve('vf-tag');
$dividerComponent = $registry->resolve('vf-divider');
// The M16 components. Resolved separately for the same reason.
$skeletonComponent = $registry->resolve('vf-skeleton');
$avatarComponent = $registry->resolve('vf-avatar');
$cardComponent = $registry->resolve('vf-card');
// The M18 component. Resolved on its own account, never through the card:
// these two are the pair M18 exists to keep apart.
$panelComponent = $registry->resolve('vf-panel');
// The M19 component. Resolved on its own account, never through the badge or
// the tag whose tone names it shares.
$alertComponent = $registry->resolve('vf-alert');
// The M20 component. Resolved on its own account, never through the button
// whose loading state renders it: the button reaches this same instance
// through the provider, and this fixture renders the standalone tag.
$progressSpinnerComponent = $registry->resolve('vf-progress-spinner');
// The M21 component. Resolved on its own account, never through the spinner
// whose role name it shares: the two are registered side by side and the
// provider hands neither to the other.
$progressBarComponent = $registry->resolve('vf-progress-bar');
// The M17 component. Resolved through the registry like every other one, which
// is also how the gate reaches its child: the provider hands the registered
// skeleton to the gate, so this single resolve() produces a gate that renders
// the canonical migrated skeleton and there is nothing here that could
// substitute a different one.
$skeletonGateComponent = $registry->resolve('vf-skeleton-gate');
// The M22 component. Resolved on its own account: the first component with a
// control of its own, and nothing else in the fixture renders a button that is
// not a consumer's declared control.
$accordionComponent = $registry->resolve('vf-accordion');
// The M23 component. Resolved on its own account.
$stepperComponent = $registry->resolve('vf-stepper');
// The M24 component. Resolved on its own account.
$tabsComponent = $registry->resolve('vf-tabs');
// The M25 component. Resolved on its own account: the first whose owned
// control is an anchor, and one that ships no browser controller at all.
$linkComponent = $registry->resolve('vf-link');
// The M26 component. Resolved on its own account: N anchors at once, no
// browser controller, and no router branch by design.
$breadcrumbsComponent = $registry->resolve('vf-breadcrumbs');
// The M27 pair. Resolved separately, never through each other: vf-menu owns no
// control and knows nothing about vf-menu-item, and each has its own catalog.
$menuComponent = $registry->resolve('vf-menu');
$menuItemComponent = $registry->resolve('vf-menu-item');
// The M28 component. Resolved on its own account; its menu content is built
// from the real vf-menu and vf-menu-item above, never from this component.
$dropdownComponent = $registry->resolve('vf-dropdown');
// The M29 component. Resolved on its own account: its trigger is the canonical
// vf-button the provider hands it, never a button this fixture writes.
$groupBoxComponent = $registry->resolve('vf-group-box');
if ($groupBoxComponent === null) {
    fwrite(STDERR, "The VueForge vf-group-box component is not registered.\n");
    exit(1);
}
// The M30 component. Resolved on its own account; a dropdown inside or beside
// it is the real vf-dropdown above, rendered as consumer content.
$popoverComponent = $registry->resolve('vf-popover');
if ($popoverComponent === null) {
    fwrite(STDERR, "The VueForge vf-popover component is not registered.\n");
    exit(1);
}

if (
    $input === null || $iconButton === null || $fieldComponent === null
    || $buttonComponent === null || $textareaComponent === null
) {
    fwrite(STDERR, "The VueForge components are not registered.\n");
    exit(1);
}

if ($badgeComponent === null || $tagComponent === null || $dividerComponent === null) {
    fwrite(STDERR, "The VueForge presentation components are not registered.\n");
    exit(1);
}

if ($skeletonComponent === null || $avatarComponent === null || $cardComponent === null) {
    fwrite(STDERR, "The VueForge M16 components are not registered.\n");
    exit(1);
}

if ($panelComponent === null) {
    fwrite(STDERR, "The VueForge vf-panel component is not registered.\n");
    exit(1);
}

if ($skeletonGateComponent === null) {
    fwrite(STDERR, "The VueForge vf-skeleton-gate component is not registered.\n");
    exit(1);
}

if ($alertComponent === null) {
    fwrite(STDERR, "The VueForge vf-alert component is not registered.\n");
    exit(1);
}

if ($progressSpinnerComponent === null) {
    fwrite(STDERR, "The VueForge vf-progress-spinner component is not registered.\n");
    exit(1);
}

if ($progressBarComponent === null) {
    fwrite(STDERR, "The VueForge vf-progress-bar component is not registered.\n");
    exit(1);
}

if ($linkComponent === null) {
    fwrite(STDERR, "The VueForge vf-link component is not registered.\n");
    exit(1);
}

if ($breadcrumbsComponent === null) {
    fwrite(STDERR, "The VueForge vf-breadcrumbs component is not registered.\n");
    exit(1);
}

if ($dropdownComponent === null) {
    fwrite(STDERR, "The VueForge vf-dropdown component is not registered.\n");
    exit(1);
}

if ($menuComponent === null || $menuItemComponent === null) {
    fwrite(STDERR, "The VueForge vf-menu and vf-menu-item components are not registered.\n");
    exit(1);
}

if ($stepperComponent === null) {
    fwrite(STDERR, "The VueForge vf-stepper component is not registered.\n");
    exit(1);
}
if ($tabsComponent === null) {
    fwrite(STDERR, "The VueForge vf-tabs component is not registered.\n");
    exit(1);
}
if ($accordionComponent === null) {
    fwrite(STDERR, "The VueForge vf-accordion component is not registered.\n");
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

/**
 * One of the three checkable controls, or a whole radio group.
 *
 * The neutral catalog spells props the Vue way; the map below is the only place
 * that difference lives. A group renders several members sharing the case's
 * name, because mutual exclusion is native and belongs to the group.
 */
$renderCheckable = static function (array $case, string $component) use ($checkableComponents, $escape): string {
    $target = $checkableComponents[$component];
    // The neutral catalog spells props the Vue way; this is the only place
    // that difference lives.
    $rename = static function (string $name) use ($component): string {
        if ($name === 'modelValue') {
            return $component === 'radio' ? 'model-value' : 'checked';
        }
        if ($name === 'thumbContrast') {
            return 'thumb-contrast';
        }

        return $name;
    };

    $base = [];
    foreach ($case['props'] ?? [] as $name => $value) {
        $base[$rename($name)] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $base[$name] = $value;
    }

    $slots = [];
    if (isset($case['content']['label'])) {
        $text = $escape((string) $case['content']['label']);
        $slots['default'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($text);
    }
    if (isset($case['content']['thumb'])) {
        $thumb = $escape((string) $case['content']['thumb']);
        $slots['thumb'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($thumb);
    }

    if (isset($case['group']) && is_array($case['group'])) {
        $markup = '<div class="parity-group">';
        foreach ($case['group'] as $member) {
            $props = $base;
            foreach ($member as $name => $value) {
                $props[$rename($name)] = $value;
            }
            $markup .= $target->render(new ComponentRenderContext($props, []))->value();
        }

        return $markup . '</div>';
    }

    return $target->render(new ComponentRenderContext($base, $slots))->value();
};

/**
 * VfBadge, for the badge catalog.
 *
 * Written out separately from the tag renderer rather than as one helper taking
 * the component. The fixture is where a substitution would be easiest to
 * introduce and hardest to see, so each component names its own here, exactly
 * as the Vue fixture does. `content.text` is the default slot; the Razor slot
 * contract takes already-rendered markup, so the text is escaped first.
 */
$renderBadge = static function (array $case) use ($badgeComponent, $escape): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    $slots = [];
    if (isset($case['content']['text'])) {
        $text = $escape((string) $case['content']['text']);
        $slots['default'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($text);
    }

    return $badgeComponent->render(new ComponentRenderContext($props, $slots))->value();
};

/** VfTag, for the tag catalog. Deliberately not the badge renderer. */
$renderTag = static function (array $case) use ($tagComponent, $escape): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    $slots = [];
    if (isset($case['content']['text'])) {
        $text = $escape((string) $case['content']['text']);
        $slots['default'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($text);
    }

    return $tagComponent->render(new ComponentRenderContext($props, $slots))->value();
};

/** The divider, which has no slot at all. */
$renderDivider = static function (array $case) use ($dividerComponent): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    return $dividerComponent->render(new ComponentRenderContext($props, []))->value();
};

/**
 * VfSkeleton, for the skeleton catalog. No slot at all.
 *
 * min-height reaches the component as the catalog wrote it, including as a JSON
 * number, because the prop is typed `string | number` and the two travel
 * different paths through the length rule.
 */
$renderSkeleton = static function (array $case) use ($skeletonComponent): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name === 'minHeight' ? 'min-height' : $name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    return $skeletonComponent->render(new ComponentRenderContext($props, []))->value();
};

/**
 * VfAvatar, for the avatar catalog.
 *
 * The default slot is passed only when the case declares slot content: "no
 * slot" and "a slot rendering nothing" are different inputs to the fallback
 * chain, and the catalog distinguishes them.
 */
$renderAvatar = static function (array $case) use ($avatarComponent, $escape): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name === 'imageAlt' ? 'image-alt' : $name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    $slots = [];
    if (isset($case['content']['text'])) {
        $text = $escape((string) $case['content']['text']);
        $slots['default'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($text);
    }

    return $avatarComponent->render(new ComponentRenderContext($props, $slots))->value();
};

/**
 * VfCard, for the card catalog.
 *
 * Each slot is passed only when the case declares it, because every one of the
 * card's wrappers is keyed on the slot being present rather than on what it
 * renders. Passing all three unconditionally would make every card render every
 * wrapper and would delete the component's contract from the fixture.
 *
 * A control is a real consumer button, unmarked and unwrapped. The static
 * snapshot is asserted against the number the case declares, not against
 * anything recognisable in the markup, so there is nothing here for the
 * component to imitate.
 */
$renderCard = static function (array $case) use ($cardComponent, $escape): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    $slots = [];
    foreach (['header' => 'header', 'body' => 'default', 'footer' => 'footer'] as $from => $to) {
        if (!array_key_exists($from, $case['content'] ?? [])) {
            continue;
        }

        $slot = $case['content'][$from];
        $markup = '';

        if (isset($slot['text']) && $slot['text'] !== '') {
            $markup .= $escape((string) $slot['text']);
        }
        if (isset($slot['control'])) {
            $markup .= '<button type="button">' . $escape((string) $slot['control']['text']) . '</button>';
        }

        $slots[$to] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    return $cardComponent->render(new ComponentRenderContext($props, $slots))->value();
};

/**
 * VfPanel, for the panel catalog.
 *
 * Its own closure, and deliberately not $renderCard pointed at another
 * component. Three things differ and all three are visible here:
 *
 *   - the `footer` slot is handed to the panel even though a panel has no
 *     footer. The component must drop it, and a slot that is never handed over
 *     is a rule that is never tested;
 *   - the default slot may carry a `markup` shape, which puts several
 *     root-level nodes in it. A card wraps them; a panel does not;
 *   - an empty slot is still handed over. For a card that opens an empty
 *     classed wrapper; for a panel it produces nothing at all.
 *
 * A control is a real consumer button, unmarked and unwrapped. The static
 * snapshot is asserted against the number the case declares, not against
 * anything recognisable in the markup.
 */
$renderPanel = static function (array $case) use ($panelComponent, $escape): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    $slots = [];
    foreach (['header' => 'header', 'body' => 'default', 'footer' => 'footer'] as $from => $to) {
        if (!array_key_exists($from, $case['content'] ?? [])) {
            continue;
        }

        $slot = $case['content'][$from];
        $markup = '';

        if (isset($slot['text']) && $slot['text'] !== '') {
            $markup .= $escape((string) $slot['text']);
        }
        if (($slot['markup'] ?? null) === 'paragraphs') {
            $markup .= '<p>Storage, seats and outbound transfer.</p><p>Updated hourly.</p>';
        }
        if (isset($slot['control'])) {
            $markup .= '<button type="button">' . $escape((string) $slot['control']['text']) . '</button>';
        }

        $slots[$to] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    return $panelComponent->render(new ComponentRenderContext($props, $slots))->value();
};

/**
 * VfAlert, for the alert catalog.
 *
 * Its own closure, and deliberately not $renderBadge or $renderTag pointed at
 * another component: the three share eight tone names and nothing else.
 *
 * Each slot is handed over only when the case declares it, because "no slot"
 * and "a slot rendering nothing" are different inputs to both fallbacks. An
 * empty-string text is handed over as a slot that renders nothing, which is
 * what brings the tone glyph or the prop text back.
 *
 * A control is a real consumer button, unmarked and unwrapped. Nothing here
 * renders a dismiss control, because the reference has none.
 */
$renderAlert = static function (array $case) use ($alertComponent, $escape): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name === 'hideIcon' ? 'hide-icon' : $name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    $slots = [];
    foreach (['icon' => 'icon', 'title' => 'title', 'body' => 'default'] as $from => $to) {
        if (!array_key_exists($from, $case['content'] ?? [])) {
            continue;
        }

        $slot = $case['content'][$from];
        $markup = '';

        if (isset($slot['text']) && $slot['text'] !== '') {
            $markup .= $escape((string) $slot['text']);
        }
        if (($slot['markup'] ?? null) === 'paragraphs') {
            $markup .= '<p>Storage, seats and outbound transfer.</p><p>Updated hourly.</p>';
        }
        if (isset($slot['control'])) {
            $markup .= '<button type="button">' . $escape((string) $slot['control']['text']) . '</button>';
        }

        $slots[$to] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    return $alertComponent->render(new ComponentRenderContext($props, $slots))->value();
};

/**
 * VfProgressSpinner, for the progress-spinner catalog.
 *
 * No slots. `strokeWidth` is the one prop whose Razor spelling differs from
 * the neutral vocabulary; everything else is the same word, and attrs are
 * merged the way every other leaf merges them. Not `$renderButton` with a
 * loading prop: the button renders this component, and a fixture that reached
 * the spinner through the button would measure the button's subset.
 */
$renderProgressSpinner = static function (array $case) use ($progressSpinnerComponent): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name === 'strokeWidth' ? 'stroke-width' : $name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    return $progressSpinnerComponent->render(new ComponentRenderContext($props, []))->value();
};

/**
 * VfProgressBar, for the progress-bar catalog.
 *
 * No slots. `showValue` is the one prop whose Razor spelling differs from the
 * neutral vocabulary; everything else is the same word, and attrs are merged
 * the way every other leaf merges them. Not `$renderProgressSpinner` with a
 * value: the two components share a role name and no rule, and a fixture
 * that reached one through the other would measure the wrong contract. The
 * labelledby heading is appended after the bar, as it is in the Vue entry.
 */
$renderProgressBar = static function (array $case) use ($progressBarComponent, $escape): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name === 'showValue' ? 'show-value' : $name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    $markup = $progressBarComponent->render(new ComponentRenderContext($props, []))->value();

    if (($case['attrs']['aria-labelledby'] ?? null) === 'progress-bar-heading') {
        $markup .= '<p id="progress-bar-heading" class="parity-hint">' . $escape('Upload progress') . '</p>';
    }

    return $markup;
};

/**
 * The consumer markup a gate case names, built the same way in both fixtures.
 *
 * The catalog names a shape rather than carrying HTML, so this and the Vue
 * entry build the same elements from the same name and neither can quietly
 * render something the other does not.
 */
$gateSlotMarkup = static function (array $slot) use ($escape): string {
    $markup = '';

    if (isset($slot['text']) && $slot['text'] !== '') {
        $markup .= $escape((string) $slot['text']);
    }

    $shape = $slot['markup'] ?? null;
    if ($shape === 'paragraphs') {
        $markup .= '<p>Storage, seats and outbound transfer.</p><p>Updated hourly.</p>';
    }
    if ($shape === 'article') {
        $markup .= '<h4>Billing period</h4>'
            . '<p>Storage, seats and outbound transfer for the current period.</p>'
            . '<ul><li>Storage: 42 GB</li><li>Seats: 12</li></ul>';
    }
    if ($shape === 'bars') {
        $markup .= '<div class="parity-bar" style="height: 12px; background: #ccc"></div>'
            . '<div class="parity-bar" style="height: 12px; background: #ccc; margin-top: 6px"></div>';
    }

    if (isset($slot['control'])) {
        $markup .= '<button type="button">' . $escape((string) $slot['control']['text']) . '</button>';
    }

    return $markup;
};

/**
 * VfSkeletonGate, for the skeleton-gate catalog.
 *
 * Each slot is passed only when the case declares it: "no skeleton slot" and "a
 * skeleton slot" are different inputs, and the first is what makes the gate
 * render the canonical child component. Passing it unconditionally would delete
 * the composition contract from the fixture.
 *
 * There is no transition mechanism here, and that is the contract rather than a
 * gap. In Vue it is the *consumer* that changes `ready`; the component owns no
 * client behaviour at all. A Razor gate is a server render of one state, and
 * inventing a browser controller to flip it would give this adapter an API the
 * reference component never had.
 */
$renderSkeletonGate = static function (array $case) use ($skeletonGateComponent, $gateSlotMarkup): string {
    $rename = ['minHeight' => 'min-height', 'reserveHeight' => 'reserve-height',
        'preserveLastHeight' => 'preserve-last-height', 'normalizeContentSpacing' => 'normalize-content-spacing',
        'fadeDuration' => 'fade-duration'];

    $props = [];
    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$rename[$name] ?? $name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    $slots = [];
    foreach (['body' => 'default', 'skeleton' => 'skeleton'] as $from => $to) {
        if (!array_key_exists($from, $case['content'] ?? [])) {
            continue;
        }

        $markup = $gateSlotMarkup($case['content'][$from]);
        $slots[$to] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    return $skeletonGateComponent->render(new ComponentRenderContext($props, $slots))->value();
};

/**
 * One VfAccordion slot's markup, built the same way the Vue fixture builds it.
 *
 * A control is a real consumer link inside the trigger and a real consumer
 * button inside the panel, unmarked and unwrapped. A nested accordion is a
 * real vf-accordion render placed into the slot markup, exactly as a template
 * engine would place it.
 */
$accordionSlotMarkup = static function (array $slot, bool $inTrigger) use (&$renderAccordionInstance, $escape): string {
    $markup = '';

    if (isset($slot['text']) && $slot['text'] !== '') {
        $markup .= $escape((string) $slot['text']);
    }
    if (($slot['markup'] ?? null) === 'article') {
        $markup .= '<h4>Billing period</h4>'
            . '<p>Storage, seats and outbound transfer for the current period.</p>'
            . '<ul><li>Storage: 42 GB</li><li>Seats: 12</li></ul>';
    }
    if (isset($slot['control'])) {
        $markup .= $inTrigger
            ? '<a href="#">' . $escape((string) $slot['control']['text']) . '</a>'
            : '<button type="button">' . $escape((string) $slot['control']['text']) . '</button>';
    }
    if (isset($slot['accordion'])) {
        $nested = $slot['accordion'];
        $text = $nested['text'] ?? null;
        unset($nested['text']);
        $markup .= $renderAccordionInstance($nested, [], $text === null ? [] : ['body' => ['text' => $text]]);
    }

    return $markup;
};

/**
 * One vf-accordion render from neutral props, attrs and slots.
 *
 * `defaultOpen` is spelled `default-open` here, as a template would spell it.
 * There is no v-model to wire: the Razor adapter reads `open` as the initial
 * state and its controller toggles on its own.
 */
$renderAccordionInstance = static function (array $props, array $attrs, array $content) use (
    $accordionComponent,
    $accordionSlotMarkup,
): string {
    $rename = ['defaultOpen' => 'default-open'];
    $resolved = [];
    foreach ($props as $name => $value) {
        $resolved[$rename[$name] ?? $name] = $value;
    }
    foreach ($attrs as $name => $value) {
        $resolved[$name] = $value;
    }

    $slots = [];
    foreach (['trigger' => true, 'body' => false] as $from => $inTrigger) {
        if (!array_key_exists($from, $content)) {
            continue;
        }
        $markup = $accordionSlotMarkup($content[$from], $inTrigger);
        $slots[$inTrigger ? 'trigger' : 'default'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    return $accordionComponent->render(new ComponentRenderContext($resolved, $slots))->value();
};

/**
 * One VfGroupBox slot's markup, built the same way the Vue fixture builds it.
 *
 * A control is a real consumer link in the title slot and a real consumer
 * button in the content, unmarked and unwrapped. A nested group box is a real
 * vf-group-box render placed into the slot markup, exactly as a template
 * engine would place it.
 */
$groupBoxSlotMarkup = static function (array $slot, bool $inTitle) use (&$renderGroupBoxInstance, $escape): string {
    $markup = '';

    if (isset($slot['text']) && $slot['text'] !== '') {
        $markup .= $escape((string) $slot['text']);
    }
    if (($slot['markup'] ?? null) === 'rich') {
        $markup .= '<strong>Invoice</strong> <em>#1024</em>';
    }
    if (($slot['markup'] ?? null) === 'paragraphs') {
        $markup .= '<p>Invoice #1024 · Design service.</p><p>Due on receipt.</p>';
    }
    if (isset($slot['control'])) {
        $markup .= $inTitle
            ? '<a href="#">' . $escape((string) $slot['control']['text']) . '</a>'
            : '<button type="button">' . $escape((string) $slot['control']['text']) . '</button>';
    }
    if (isset($slot['groupBox'])) {
        $nested = $slot['groupBox'];
        $text = $nested['text'] ?? null;
        unset($nested['text']);
        $markup .= $renderGroupBoxInstance($nested, [], $text === null ? [] : ['body' => ['text' => $text]]);
    }

    return $markup;
};

/**
 * One vf-group-box render from neutral props, attrs and slots.
 *
 * `defaultCollapsed` is spelled `default-collapsed`, as a template would spell
 * it. There is no v-model to wire: the Razor adapter reads `collapsed` as the
 * initial state and its controller toggles on its own - the documented
 * platform divergence.
 */
$renderGroupBoxInstance = static function (array $props, array $attrs, array $content) use (
    $groupBoxComponent,
    $groupBoxSlotMarkup,
    $escape,
): string {
    $rename = ['defaultCollapsed' => 'default-collapsed'];
    $resolved = [];
    foreach ($props as $name => $value) {
        $resolved[$rename[$name] ?? $name] = $value;
    }
    foreach ($attrs as $name => $value) {
        $resolved[$name] = $value;
    }

    $slots = [];
    if (array_key_exists('title', $content)) {
        $markup = $groupBoxSlotMarkup($content['title'], true);
        $slots['title'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }
    if (array_key_exists('toggleIcon', $content)) {
        $icon = $escape((string) ($content['toggleIcon']['text'] ?? ''));
        $slots['toggle-icon'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($icon);
    }
    if (array_key_exists('body', $content)) {
        $body = $groupBoxSlotMarkup($content['body'], false);
        $slots['default'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($body);
    }

    return $groupBoxComponent->render(new ComponentRenderContext($resolved, $slots))->value();
};

/**
 * VfGroupBox, for the group box catalog. A `group` renders each member as its
 * own instance with the case's content.
 */
$renderGroupBox = static function (array $case) use ($renderGroupBoxInstance): string {
    $content = $case['content'] ?? [];

    if (isset($case['group']) && is_array($case['group'])) {
        $markup = '';
        foreach ($case['group'] as $member) {
            $markup .= $renderGroupBoxInstance($member, $case['attrs'] ?? [], $content);
        }

        return $markup;
    }

    return $renderGroupBoxInstance($case['props'] ?? [], $case['attrs'] ?? [], $content);
};

/**
 * VfAccordion, for the accordion catalog.
 *
 * Its own closure, and deliberately not $renderPanel or $renderCard with a
 * trigger bolted on: the fixture is where "the trigger is really a consumer
 * button the fixture wrote" would be easiest to introduce and hardest to see.
 * A `group` renders each member as its own instance with the case's content.
 */
$renderAccordion = static function (array $case) use ($renderAccordionInstance): string {
    $content = $case['content'] ?? [];

    if (isset($case['group']) && is_array($case['group'])) {
        $markup = '';
        foreach ($case['group'] as $member) {
            $markup .= $renderAccordionInstance($member, $case['attrs'] ?? [], $content);
        }

        return $markup;
    }

    return $renderAccordionInstance($case['props'] ?? [], $case['attrs'] ?? [], $content);
};

/**
 * One vf-stepper render from neutral props and attrs.
 *
 * `modelValue`, `defaultValue`, `contentPosition` and `ariaLabel` are spelled
 * in kebab-case here, as a template would spell them. There is no v-model to
 * wire: the Razor adapter reads `model-value` as the initial value and its
 * controller selects on its own.
 */
$renderStepperInstance = static function (array $props, array $attrs) use ($stepperComponent): string {
    $rename = [
        'modelValue' => 'model-value',
        'defaultValue' => 'default-value',
        'contentPosition' => 'content-position',
        'ariaLabel' => 'aria-label',
    ];
    $resolved = [];
    foreach ($props as $name => $value) {
        $resolved[$rename[$name] ?? $name] = $value;
    }
    foreach ($attrs as $name => $value) {
        $resolved[$name] = $value;
    }

    return $stepperComponent->render(new ComponentRenderContext($resolved, []))->value();
};

/**
 * VfStepper, for the stepper catalog.
 *
 * Its own closure. The stepper has no slot, so the only consumer control a
 * case can hold is the `beside` one: a real button written after the
 * stepper's root, the way any consumer would write it. A `group` renders each
 * member as its own instance.
 */
$renderStepper = static function (array $case) use ($renderStepperInstance, $escape): string {
    $markup = '';

    if (isset($case['group']) && is_array($case['group'])) {
        foreach ($case['group'] as $member) {
            $markup .= $renderStepperInstance($member, $case['attrs'] ?? []);
        }
    } else {
        $markup .= $renderStepperInstance($case['props'] ?? [], $case['attrs'] ?? []);
    }

    if (isset($case['content']['beside']['control'])) {
        $markup .= '<button type="button">' . $escape((string) $case['content']['beside']['control']['text']) . '</button>';
    }

    return $markup;
};

/**
 * One vf-tabs render from neutral props, attrs and content.
 *
 * `modelValue` and `defaultValue` are spelled in kebab-case here, as a
 * template would spell them. There is no v-model to wire: the Razor adapter
 * reads `model-value` as the initial value and its controller selects on its
 * own. The panel slot is spelled per item - `panel{index}` - because a Razor
 * named slot takes no argument: each holds the same paragraph the Vue slot
 * renders for that item's value, and the consumer button after it when the
 * case declares one. The tab slot is `tab{index}`, static per item.
 */
$renderTabsInstance = static function (array $props, array $attrs, array $content) use ($tabsComponent, $escape): string {
    $rename = ['modelValue' => 'model-value', 'defaultValue' => 'default-value'];
    $resolved = [];
    foreach ($props as $name => $value) {
        $resolved[$rename[$name] ?? $name] = $value;
    }
    foreach ($attrs as $name => $value) {
        $resolved[$name] = $value;
    }

    $slots = [];
    foreach ($props['items'] ?? [] as $index => $item) {
        if (array_key_exists('panel', $content)) {
            $markup = '<p>' . $escape((string) ($content['panel']['text'] ?? '')) . ' ' . $escape((string) $item['value']) . '</p>';
            if (isset($content['panel']['control'])) {
                $markup .= '<button type="button" class="parity-panel-control">' . $escape((string) $content['panel']['control']['text']) . '</button>';
            }
            $slots['panel' . $index] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
        }
        if (($content['tab']['numbered'] ?? false) === true) {
            $label = '<span>' . ($index + 1) . '. ' . $escape((string) $item['label']) . '</span>';
            $slots['tab' . $index] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($label);
        }
    }
    // A panel slot with no items still has to be a panel slot: the shared
    // `panel` is what an empty list declares it through.
    if (array_key_exists('panel', $content) && ($props['items'] ?? []) === []) {
        $slots['panel'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString('');
    }

    return $tabsComponent->render(new ComponentRenderContext($resolved, $slots))->value();
};

/**
 * VfTabs, for the tabs catalog.
 *
 * Its own closure. A `before` control is a real consumer button written
 * before the root, the way any consumer would write it; a `group` renders
 * each member as its own instance with the case's content.
 */
$renderTabs = static function (array $case) use ($renderTabsInstance, $escape): string {
    $content = $case['content'] ?? [];
    $markup = '';

    if (isset($content['before']['control'])) {
        $markup .= '<button type="button" class="parity-before">' . $escape((string) $content['before']['control']['text']) . '</button>';
    }
    if (isset($case['group']) && is_array($case['group'])) {
        foreach ($case['group'] as $member) {
            $markup .= $renderTabsInstance($member, $case['attrs'] ?? [], $content);
        }
    } else {
        $markup .= $renderTabsInstance($case['props'] ?? [], $case['attrs'] ?? [], $content);
    }

    return $markup;
};

/**
 * VfLink, for the link catalog.
 *
 * The native branch only: props and attrs are handed to the component as a
 * consumer would write them, and the default slot is the text, a consumer
 * span, and a real consumer button. No case names `to`, and the component
 * would refuse one that did rather than render an anchor for it.
 */
$renderLink = static function (array $case) use ($linkComponent, $escape): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    $content = $case['content'] ?? [];
    $markup = '';

    if (($content['markup'] ?? null) === 'label') {
        $markup .= '<span class="consumer-label">' . $escape((string) ($content['text'] ?? '')) . '</span>';
    } elseif (isset($content['text']) && $content['text'] !== '') {
        $markup .= $escape((string) $content['text']);
    }
    if (isset($content['control'])) {
        $markup .= '<button type="button">' . $escape((string) $content['control']['text']) . '</button>';
    }

    $slots = $content === []
        ? []
        : ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup)];

    return $linkComponent->render(new ComponentRenderContext($props, $slots))->value();
};

/**
 * VfBreadcrumbs, for the breadcrumbs catalog.
 *
 * The native half only: the items are handed to the component as a consumer
 * would write them, props and attrs beside them, and the separator slot -
 * when the case has one - is the text or a consumer span. No item names `to`
 * and no case names `component`; the component would refuse either rather
 * than render an anchor for it.
 */
$renderBreadcrumbs = static function (array $case) use ($breadcrumbsComponent, $escape): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    $separator = $case['content']['separator'] ?? null;
    $slots = [];

    if ($separator !== null) {
        $markup = ($separator['markup'] ?? null) === 'label'
            ? '<span class="consumer-separator">' . $escape((string) ($separator['text'] ?? '')) . '</span>'
            : $escape((string) ($separator['text'] ?? ''));
        $slots['separator'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    // The described-by hint is appended by the shared loop below, as it is for
    // every component whose case points aria-describedby outside the root.
    return $breadcrumbsComponent->render(new ComponentRenderContext($props, $slots))->value();
};

/**
 * The consumer content a VfMenu case declares.
 *
 * Named rather than spelled as markup so this fixture and the Vue one build
 * the same nodes from the same word. Only `button` is focusable, and nothing
 * here carries an explicit interactive role.
 */
$menuChildren = static function (?string $children): string {
    if ($children === 'text') {
        return '<span class="parity-menu-text">Plain content</span>';
    }
    if ($children === 'spans') {
        return '<span class="parity-menu-child">One</span>'
            . '<span class="parity-menu-child">Two</span>'
            . '<span class="parity-menu-child">Three</span>';
    }
    if ($children === 'nested') {
        return '<div class="parity-menu-group"><span class="parity-menu-child">Deep</span></div>';
    }
    if ($children === 'button') {
        return '<button type="button" class="consumer-control">Consumer action</button>';
    }

    return '';
};

/**
 * VfMenu, for the menu catalog.
 *
 * Props and attrs go in together, because VfMenu declares no props at all and
 * every one of them is an attr.
 */
$renderMenu = static function (array $case) use ($menuComponent, $menuChildren): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    $markup = $menuChildren($case['content']['children'] ?? null);
    $slots = $markup === ''
        ? []
        : ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup)];

    return $menuComponent->render(new ComponentRenderContext($props, $slots))->value();
};

/**
 * VfMenuItem, for the menu-item catalog.
 *
 * One component, props and attrs beside each other, and no slot: the component
 * has none and its label is a prop. Nothing is refused here, because the Vue
 * component has no router branch for this adapter to decline.
 */
$renderMenuItem = static function (array $case) use ($menuItemComponent): string {
    $props = [];

    foreach ($case['props'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }
    foreach ($case['attrs'] ?? [] as $name => $value) {
        $props[$name] = $value;
    }

    return $menuItemComponent->render(new ComponentRenderContext($props, []))->value();
};

/**
 * VfDropdown's default slot, from the neutral menu vocabulary: a consumer
 * input first, raw consumer buttons carrying role=menuitem and the
 * `.vf-dropdown__item` family, a real vf-menu of real vf-menu-items, a plain
 * paragraph - in the order the Vue fixture builds them.
 */
$dropdownMenu = static function (array $menu) use ($menuComponent, $menuItemComponent, $escape): string {
    $markup = '';

    if (isset($menu['control'])) {
        $markup .= '<input class="parity-menu-control" aria-label="' . $escape((string) $menu['control']['text']) . '">';
    }
    foreach ($menu['items'] ?? [] as $item) {
        $class = 'vf-dropdown__item' . (($item['active'] ?? false) ? ' vf-dropdown__item--active' : '');
        $markup .= '<button type="button" role="menuitem" class="' . $class . '">' . $escape((string) $item['label']) . '</button>';
    }
    if (isset($menu['menuItems'])) {
        $items = '';
        foreach ($menu['menuItems'] as $item) {
            $items .= $menuItemComponent->render(new ComponentRenderContext($item, []))->value();
        }
        $markup .= $menuComponent->render(new ComponentRenderContext([], [
            'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($items),
        ]))->value();
    }
    if (isset($menu['note'])) {
        $markup .= '<p class="parity-menu-note">' . $escape((string) $menu['note']) . '</p>';
    }

    return $markup;
};

/**
 * VfDropdown, for the dropdown catalog.
 *
 * The camelCase props of the catalog are the component's own alternative
 * spellings, so they go through as they are; attrs fall through to the root.
 * A `group` renders each member as its own instance with the case's content;
 * an `after` control is a real consumer button after the roots.
 */
$renderDropdown = static function (array $case) use ($dropdownComponent, $dropdownMenu, $escape): string {
    $content = $case['content'] ?? [];
    $trigger = $content['trigger'] ?? null;
    $slots = [];

    if (isset($trigger['control'])) {
        $html = '<button type="button" class="parity-trigger-control">' . $escape((string) $trigger['control']['text']) . '</button>';
        $slots['trigger'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($html);
    } elseif (isset($trigger['text'])) {
        $html = '<span>' . $escape((string) $trigger['text']) . '</span>';
        $slots['trigger'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($html);
    }
    $menu = $dropdownMenu($content['menu'] ?? []);
    $slots['default'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($menu);

    $members = isset($case['group']) && is_array($case['group']) ? $case['group'] : [$case['props'] ?? []];
    $markup = '';
    foreach ($members as $props) {
        $markup .= $dropdownComponent->render(new ComponentRenderContext($props + ($case['attrs'] ?? []), $slots))->value();
    }
    if (isset($content['after']['control'])) {
        $markup .= '<button type="button" class="parity-after-control">' . $escape((string) $content['after']['control']['text']) . '</button>';
    }

    return $markup;
};

/**
 * A real vf-dropdown beside or inside a popover, as the Vue fixture builds it:
 * trigger text, two role=menuitem consumer buttons, in place when asked.
 */
$overlayDropdown = static function (string $label, bool $inPlace) use ($dropdownComponent, $escape): string {
    $trigger = '<span>' . $escape($label) . '</span>';
    $items = '<button type="button" role="menuitem" class="vf-dropdown__item">Edit</button>'
        . '<button type="button" role="menuitem" class="vf-dropdown__item">Duplicate</button>';

    return $dropdownComponent->render(new ComponentRenderContext($inPlace ? ['teleportTo' => false] : [], [
        'trigger' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($trigger),
        'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($items),
    ]))->value();
};

/**
 * VfPopover, for the popover catalog: a `beside` dropdown first, then the
 * popover roots - one, or one per `group` member - then an `after` control.
 * The camelCase props of the catalog are the component's own alternative
 * spellings; attrs fall through to the root.
 */
$renderPopover = static function (array $case) use ($popoverComponent, $overlayDropdown, $escape): string {
    $content = $case['content'] ?? [];
    $trigger = $content['trigger'] ?? null;
    $panel = $content['panel'] ?? [];
    $slots = [];

    if (isset($trigger['control'])) {
        $html = '<button type="button" class="parity-trigger-control">' . $escape((string) $trigger['control']['text']) . '</button>';
        $slots['trigger'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($html);
    } elseif (isset($trigger['text'])) {
        $html = '<span>' . $escape((string) $trigger['text']) . '</span>';
        $slots['trigger'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($html);
    }

    $inner = '';
    if (isset($panel['note'])) {
        $inner .= '<p class="parity-panel-note">' . $escape((string) $panel['note']) . '</p>';
    }
    foreach ($panel['controls'] ?? [] as $control) {
        $focus = match ($control['autofocus'] ?? null) {
            'attribute' => ' autofocus',
            'data' => ' data-autofocus',
            default => '',
        };
        $text = $escape((string) $control['text']);
        $inner .= ($control['tag'] ?? 'button') === 'span'
            ? '<span class="parity-panel-control"' . $focus . '>' . $text . '</span>'
            : '<button type="button" class="parity-panel-control"' . $focus . '>' . $text . '</button>';
    }
    if (isset($panel['dropdown'])) {
        $inner .= $overlayDropdown('Inner', (bool) ($panel['dropdown']['inPlace'] ?? false));
    }
    $slots['default'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($inner);

    $markup = isset($content['beside']['dropdown'])
        ? $overlayDropdown('Menu', (bool) ($content['beside']['dropdown']['inPlace'] ?? false))
        : '';
    $members = isset($case['group']) && is_array($case['group']) ? $case['group'] : [$case['props'] ?? []];
    foreach ($members as $props) {
        $markup .= $popoverComponent->render(new ComponentRenderContext($props + ($case['attrs'] ?? []), $slots))->value();
    }
    if (isset($content['after']['control'])) {
        $markup .= '<button type="button" class="parity-after-control">' . $escape((string) $content['after']['control']['text']) . '</button>';
    }

    return $markup;
};

$sections = '';

foreach ($catalog['cases'] as $case) {
    $caseId = (string) $case['id'];

    if ($component === 'dropdown') {
        $body = $renderDropdown($case);
    } elseif ($component === 'popover') {
        $body = $renderPopover($case);
    } elseif ($component === 'group-box') {
        $body = $renderGroupBox($case);
    } elseif ($component === 'breadcrumbs') {
        $body = $renderBreadcrumbs($case);
    } elseif ($component === 'menu') {
        $body = $renderMenu($case);
    } elseif ($component === 'menu-item') {
        $body = $renderMenuItem($case);
    } elseif ($component === 'link') {
        $body = $renderLink($case);
    } elseif ($component === 'tabs') {
        $body = $renderTabs($case);
    } elseif ($component === 'stepper') {
        $body = $renderStepper($case);
    } elseif ($component === 'accordion') {
        $body = $renderAccordion($case);
    } elseif ($component === 'progress-bar') {
        $body = $renderProgressBar($case);
    } elseif ($component === 'progress-spinner') {
        $body = $renderProgressSpinner($case);
    } elseif ($component === 'skeleton-gate') {
        $body = $renderSkeletonGate($case);
    } elseif ($component === 'skeleton') {
        $body = $renderSkeleton($case);
    } elseif ($component === 'avatar') {
        $body = $renderAvatar($case);
    } elseif ($component === 'card') {
        $body = $renderCard($case);
    } elseif ($component === 'panel') {
        $body = $renderPanel($case);
    } elseif ($component === 'alert') {
        $body = $renderAlert($case);
    } elseif ($component === 'badge') {
        $body = $renderBadge($case);
    } elseif ($component === 'tag') {
        $body = $renderTag($case);
    } elseif ($component === 'divider') {
        $body = $renderDivider($case);
    } elseif ($component === 'icon-button') {
        $body = $renderIconButton($case);
    } elseif (in_array($component, ['checkbox', 'radio', 'switch'], true)) {
        $body = $renderCheckable($case, $component);
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

// The dropdown's page-level logs, installed only on the dropdown catalog's
// page, as the Vue fixture installs them only when the catalog is the
// dropdown's. Their window keydown listener swallows unconsumed navigation
// keys, which every other catalog measures with the default left alone.
$dropdownLogs = $component === 'dropdown' ? <<<'JS'
  // The neutral dropdown logs, kept exactly as the Vue fixture keeps them: one
  // open-change entry per notification with the instance's index in the
  // case, one entry per keydown with whether it was prevented, and every
  // enter and leave a menu completes after the first real pointer or key
  // input, with its duration from the menu's own class changes.
  window.__parityDropdownEvents = {};
  window.__parityDropdownKeys = [];
  window.__parityDropdownTransitions = {};
  document.addEventListener('vf-dropdown:open-change', (event) => {
    const caseRoot = event.target.closest('[data-parity-case]');
    if (!caseRoot) return;
    const instance = [...caseRoot.querySelectorAll('.vf-dropdown')].indexOf(event.target);
    (window.__parityDropdownEvents[caseRoot.getAttribute('data-parity-case')] ??= []).push({ instance, open: event.detail.open });
  });
  let observing = false;
  for (const type of ['pointerdown', 'keydown']) document.addEventListener(type, () => (observing = true), true);
  // Filled on window, after every product handler, and only then is an
  // unconsumed navigation key's or Escape's browser default swallowed - see
  // the Vue fixture for the headless Chrome defect this avoids.
  const entries = new WeakMap();
  const swallowed = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Escape']);
  document.addEventListener('keydown', (event) => {
    const entry = { key: event.key, prevented: false };
    window.__parityDropdownKeys.push(entry);
    entries.set(event, entry);
  }, true);
  window.addEventListener('keydown', (event) => {
    const entry = entries.get(event);
    if (entry) entry.prevented = event.defaultPrevented;
    if (!event.defaultPrevented && swallowed.has(event.key)) event.preventDefault();
  });
  const running = new Map();
  const phase = (element) => !element.isConnected
    ? 'removed'
    : [...element.classList].some((name) => name.startsWith('vf-floating-transition-leave'))
      ? 'leave'
      : [...element.classList].some((name) => name.startsWith('vf-floating-transition-enter')) ? 'enter' : 'none';
  new MutationObserver((records) => {
    if (!observing) return;
    const now = performance.now();
    for (const record of records) {
      const nodes = record.type === 'childList' ? [...record.addedNodes, ...record.removedNodes] : [record.target];
      for (const node of nodes) {
        if (!(node instanceof HTMLElement) || !node.classList.contains('vf-dropdown__menu')) continue;
        const state = phase(node);
        const current = running.get(node);
        if (current && (current.kind === 'enter' ? state !== 'enter' : state === 'removed')) {
          current.ms = Math.round(now - current.start);
          running.delete(node);
        }
        if (!running.has(node) && (state === 'enter' || state === 'leave')) {
          const entry = { kind: state, start: now, ms: null };
          (window.__parityDropdownTransitions[node.id] ??= []).push(entry);
          running.set(node, entry);
        }
      }
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
JS : '';

// The popover's page-level logs, the dropdown's in shape, installed only on the
// popover catalog's page. A popover's instance is its index among the case's
// popovers; a dropdown's is 0, its one place in a popover case. A dropdown
// inside a teleported panel is outside the case root, so its case is the one
// whose trigger names the panel it is in.
$popoverLogs = $component === 'popover' ? <<<'JS'
  window.__parityPopoverEvents = {};
  window.__parityPopoverKeys = [];
  window.__parityPopoverTransitions = {};
  const caseOf = (element) => {
    const direct = element.closest('[data-parity-case]');
    if (direct) return direct;
    const panel = element.closest('.vf-popover__content');
    const owner = panel ? document.querySelector('[aria-controls="' + panel.id + '"]') : null;
    return owner ? owner.closest('[data-parity-case]') : null;
  };
  const log = (event, component) => {
    const caseRoot = caseOf(event.target);
    if (!caseRoot) return;
    const instance = component === 'popover' ? [...caseRoot.querySelectorAll('.vf-popover')].indexOf(event.target) : 0;
    (window.__parityPopoverEvents[caseRoot.getAttribute('data-parity-case')] ??= []).push({ component, instance, open: event.detail.open });
  };
  document.addEventListener('vf-popover:open-change', (event) => log(event, 'popover'));
  document.addEventListener('vf-dropdown:open-change', (event) => log(event, 'dropdown'));
  let observing = false;
  for (const type of ['pointerdown', 'keydown']) document.addEventListener(type, () => (observing = true), true);
  const entries = new WeakMap();
  const swallowed = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Escape']);
  document.addEventListener('keydown', (event) => {
    const entry = { key: event.key, prevented: false };
    window.__parityPopoverKeys.push(entry);
    entries.set(event, entry);
  }, true);
  window.addEventListener('keydown', (event) => {
    const entry = entries.get(event);
    if (entry) entry.prevented = event.defaultPrevented;
    if (!event.defaultPrevented && swallowed.has(event.key)) event.preventDefault();
  });
  const running = new Map();
  const phase = (element) => !element.isConnected
    ? 'removed'
    : [...element.classList].some((name) => name.startsWith('vf-floating-transition-leave'))
      ? 'leave'
      : [...element.classList].some((name) => name.startsWith('vf-floating-transition-enter')) ? 'enter' : 'none';
  new MutationObserver((records) => {
    if (!observing) return;
    const now = performance.now();
    for (const record of records) {
      const nodes = record.type === 'childList' ? [...record.addedNodes, ...record.removedNodes] : [record.target];
      for (const node of nodes) {
        if (!(node instanceof HTMLElement) || !node.matches('.vf-popover__content, .vf-dropdown__menu')) continue;
        const state = phase(node);
        const current = running.get(node);
        if (current && (current.kind === 'enter' ? state !== 'enter' : state === 'removed')) {
          current.ms = Math.round(now - current.start);
          running.delete(node);
        }
        if (!running.has(node) && (state === 'enter' || state === 'leave')) {
          const entry = { kind: state, start: now, ms: null };
          (window.__parityPopoverTransitions[node.id] ??= []).push(entry);
          running.set(node, entry);
        }
      }
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
JS : '';

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
  // The neutral accordion event log the harness reads after a scenario: one
  // entry per open-change the controller dispatched, keyed by the case that
  // contains the accordion. The Vue fixture keeps the same log from the
  // component's openChange emit.
  window.__parityAccordionEvents = {};
  document.addEventListener('vf-accordion:open-change', (event) => {
    const caseId = event.target.closest('[data-parity-case]')?.getAttribute('data-parity-case');
    if (!caseId) return;
    (window.__parityAccordionEvents[caseId] ??= []).push({ open: event.detail.open });
  });
  // The neutral group box log, from the controller's one event. The Vue
  // fixture keeps the same log from the component's collapsedChange emit.
  window.__parityGroupBoxEvents = {};
  document.addEventListener('vf-group-box:collapsed-change', (event) => {
    const caseId = event.target.closest('[data-parity-case]')?.getAttribute('data-parity-case');
    if (!caseId) return;
    (window.__parityGroupBoxEvents[caseId] ??= []).push({ collapsed: event.detail.collapsed });
  });
  // The neutral stepper change log, from the controller's one event. The Vue
  // fixture keeps the same log from the component's change emit.
  window.__parityStepperEvents = {};
  document.addEventListener('vf-stepper:change', (event) => {
    const caseId = event.target.closest('[data-parity-case]')?.getAttribute('data-parity-case');
    if (!caseId) return;
    (window.__parityStepperEvents[caseId] ??= []).push({ value: event.detail.value });
  });
  // The neutral tabs change log, from the controller's one event. The Vue
  // fixture keeps the same log from the component's change emit.
  window.__parityTabsEvents = {};
  document.addEventListener('vf-tabs:change', (event) => {
    const caseId = event.target.closest('[data-parity-case]')?.getAttribute('data-parity-case');
    if (!caseId) return;
    (window.__parityTabsEvents[caseId] ??= []).push({ value: event.detail.value });
  });
{$dropdownLogs}
{$popoverLogs}
  const theme = new URLSearchParams(window.location.search).get('theme') ?? 'light';
  document.documentElement.setAttribute('data-vf-theme', theme);
  // A dropdown page is ready once every overlay that entered at bootstrap has
  // finished, as the Vue fixture waits for its appear transitions. Bounded;
  // every other catalog is ready at once, as before.
  if (document.querySelector('.vf-dropdown, .vf-popover')) {
    const deadline = performance.now() + 2000;
    while (document.querySelector('[class*="vf-floating-transition-"]') && performance.now() < deadline) {
      await new Promise((tick) => setTimeout(tick, 20));
    }
    // One resize before ready, as the Vue fixture dispatches it.
    window.dispatchEvent(new Event('resize'));
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(done))));
    // And one full repaint, so every open menu is rasterised afresh at its
    // settled position - see the dropdown snapshot in extract.mjs.
    document.body.style.opacity = '0.999';
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    document.body.removeAttribute('style');
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  }
  document.documentElement.setAttribute('data-parity-ready', 'true');
</script>
</body>
</html>
HTML;

file_put_contents($outputPath, $html);
