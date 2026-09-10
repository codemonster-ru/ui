<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/skeleton/state.ts.
 *
 * Its own class rather than more methods on PresentationState. That class holds
 * the M15 toned spans and the divider; VfSkeleton shares no rule with any of
 * them, and a class that collects whatever the current milestone shipped stops
 * telling a reader anything about what belongs in it.
 *
 * SkeletonStateVectorsTest runs the same vector file the TypeScript suite runs,
 * so the two implementations cannot drift.
 *
 * @internal
 */
final class SkeletonState
{
    /**
     * The skeleton root class list, in the order the reference emits it.
     *
     * `animated` defaults to true in the Vue component, so the modifier is
     * present unless a caller switches it off - the opposite polarity to the
     * M15 toned spans, where the default emits nothing.
     *
     * @return list<string>
     */
    public static function resolveClasses(bool $animated): array
    {
        $classes = ['vf-skeleton'];

        if ($animated) {
            $classes[] = 'vf-skeleton--animated';
        }

        return $classes;
    }

    /**
     * A `min-height` prop as a CSS length.
     *
     * A number becomes pixels; a string passes through untouched. Zero is a
     * number like any other and becomes `0px`.
     */
    public static function resolveLength(string|int|float|null $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            return $value;
        }

        // 12.5 must render as "12.5px" and 40 as "40px", which is what PHP's
        // default float-to-string conversion already does; casting through
        // sprintf('%s') keeps 40.0 from becoming "40.0px" if a caller sends a
        // float that happens to be integral.
        return (is_float($value) && $value === floor($value) ? (string) (int) $value : (string) $value) . 'px';
    }

    /**
     * The declarations the component itself writes into the root style attribute.
     *
     * The historical quirk is the empty string: Vue omits a style property
     * whose value is `''`, so `radius=""` is not "no rounding" but "no
     * border-radius declaration", and a skeleton with an empty radius and no
     * min-height carries no style attribute at all.
     *
     * @return list<array{0: string, 1: string}>
     */
    public static function resolveStyle(string|int|float|null $minHeight, ?string $radius): array
    {
        $declarations = [];
        $length = self::resolveLength($minHeight);

        if ($length !== null && $length !== '') {
            $declarations[] = ['min-height', $length];
        }
        if ($radius !== null && $radius !== '') {
            $declarations[] = ['border-radius', $radius];
        }

        return $declarations;
    }
}
