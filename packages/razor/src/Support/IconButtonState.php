<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of the shared VfIconButton presentation rules.
 *
 * The canonical implementation is
 * packages/shared-core/src/icon-button/state.ts. Both run the vectors in
 * packages/shared-core/src/icon-button/state-vectors.json, so this file cannot
 * drift from it without a test failing.
 *
 * Only the rules the server-rendered markup needs are mirrored. Anything the
 * browser decides at runtime stays in the controller.
 *
 * @internal
 */
final class IconButtonState
{
    /**
     * The canonical class list, in the order the reference emits it.
     *
     * `md` deliberately emits no size modifier, and a value outside the
     * documented union still reaches the class name: the reference interpolates
     * the prop without validating it.
     *
     * @return list<string>
     */
    public static function resolveClasses(string $variant, string $size): array
    {
        $classes = ['vf-icon-button', 'vf-icon-button--' . $variant];

        if ($size !== 'md') {
            $classes[] = 'vf-icon-button--' . $size;
        }

        return $classes;
    }

    /**
     * The CSS length handed to the icon for a given control size.
     *
     * Only `sm` and `lg` are special-cased; every other value, documented or
     * not, takes the medium token.
     */
    public static function resolveIconSize(string $size): string
    {
        if ($size === 'sm') {
            return 'var(--vf-icon-size-sm)';
        }

        if ($size === 'lg') {
            return 'var(--vf-icon-size-lg)';
        }

        return 'var(--vf-icon-size-md)';
    }
}
