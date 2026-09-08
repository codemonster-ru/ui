<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of the shared VfButton presentation rules.
 *
 * The canonical implementation is packages/shared-core/src/button/state.ts.
 * Both run the vectors in packages/shared-core/src/button/state-vectors.json,
 * so this file cannot drift from it without a test failing.
 *
 * @internal
 */
final class ButtonState
{
    /**
     * The canonical class list, in the order the reference emits it.
     *
     * `md` deliberately emits no size modifier, and a value outside the
     * documented union still reaches the class name.
     *
     * @return list<string>
     */
    public static function resolveClasses(string $variant, string $size, bool $block, bool $loading): array
    {
        $classes = ['vf-button', 'vf-button--' . $variant];

        if ($size !== 'md') {
            $classes[] = 'vf-button--' . $size;
        }

        if ($block) {
            $classes[] = 'vf-button--block';
        }

        if ($loading) {
            $classes[] = 'vf-button--loading';
        }

        return $classes;
    }

    /**
     * Whether the rendered button carries the native `disabled` attribute.
     *
     * Loading is not a visual state: the native attribute is applied while
     * loading, and it wins over an explicit enabled state.
     */
    public static function isDisabled(bool $loading, bool $disabled): bool
    {
        return $loading || $disabled;
    }

    /** The `aria-busy` value, or null when the attribute is omitted entirely. */
    public static function resolveBusy(bool $loading): ?string
    {
        return $loading ? 'true' : null;
    }
}
