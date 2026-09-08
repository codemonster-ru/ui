<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of the shared VfTextarea presentation rules.
 *
 * The canonical implementation is packages/shared-core/src/textarea/state.ts.
 * Both run the vectors in packages/shared-core/src/textarea/state-vectors.json,
 * so this file cannot drift from it without a test failing.
 *
 * There is only the class list here. The filled predicate lives in InputState,
 * because VfTextarea applies the same rule VfInput does and a second copy would
 * be a second place for it to drift.
 *
 * @internal
 */
final class TextareaState
{
    /**
     * The canonical class list, in the order the reference emits it.
     *
     * `md` deliberately emits no size modifier, and a value outside the
     * documented union still reaches the class name.
     *
     * @return list<string>
     */
    public static function resolveClasses(string $size, bool $invalid, bool $floating): array
    {
        $classes = ['vf-textarea'];

        if ($size !== 'md') {
            $classes[] = 'vf-textarea--' . $size;
        }

        if ($invalid) {
            $classes[] = 'vf-textarea--invalid';
        }

        if ($floating) {
            $classes[] = 'vf-textarea--floating';
        }

        return $classes;
    }
}
