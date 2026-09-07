<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * Assembles the `vf-icon-button` markup.
 *
 * Lives in Support/ rather than inside the component because two callers need
 * it: the `vf-icon-button` tag, and the action controls VfInput renders inside
 * its wrapper. Before M10 those actions were bespoke markup that happened to
 * carry the same class names, which is precisely how two implementations of
 * one control drift.
 *
 * The class list and the icon size come from IconButtonState, the PHP mirror of
 * the shared rule the Vue component consumes, so neither platform derives them
 * on its own.
 *
 * @internal
 */
final class IconButton
{
    /**
     * Renders a button carrying one glyph.
     *
     * `$attributes` are merged over the canonical ones, which is how the caller
     * supplies aria-label, data attributes or an inert state. `class` in that
     * map is appended to the canonical classes rather than replacing them,
     * matching how Vue merges an inherited class onto a bound one.
     *
     * @param array<string, string|bool|int|float|null> $attributes
     */
    public static function render(
        string $icon,
        string $variant = 'ghost',
        string $size = 'md',
        string $type = 'button',
        array $attributes = [],
    ): string {
        $extraClass = $attributes['class'] ?? null;
        unset($attributes['class']);

        $classes = IconButtonState::resolveClasses($variant, $size);

        if (is_string($extraClass) && $extraClass !== '') {
            $classes[] = $extraClass;
        }

        $merged = array_merge([
            'class' => Html::classes($classes),
            'type' => $type,
        ], $attributes);

        return '<button' . Html::attributes($merged) . '>'
            . IconRenderer::render($icon, IconButtonState::resolveIconSize($size), ariaHidden: true)
            . '</button>';
    }
}
