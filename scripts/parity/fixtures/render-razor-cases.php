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
// The M17 component. Resolved through the registry like every other one, which
// is also how the gate reaches its child: the provider hands the registered
// skeleton to the gate, so this single resolve() produces a gate that renders
// the canonical migrated skeleton and there is nothing here that could
// substitute a different one.
$skeletonGateComponent = $registry->resolve('vf-skeleton-gate');

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

$sections = '';

foreach ($catalog['cases'] as $case) {
    $caseId = (string) $case['id'];

    if ($component === 'skeleton-gate') {
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
