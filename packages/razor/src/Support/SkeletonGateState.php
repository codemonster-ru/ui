<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/skeleton-gate/state.ts.
 *
 * Its own class rather than more methods on SkeletonState. The gate renders the
 * skeleton, and folding their rules together is the single change that would
 * make the two components' evidence indistinguishable: a defect in the gate's
 * reserve precedence would then be a defect in "the skeleton rules", and the
 * skeleton's own suite would be reporting on a component it does not render.
 *
 * SkeletonGateStateVectorsTest runs the same vector file the TypeScript suite
 * runs, so the two implementations cannot drift.
 *
 * @internal
 */
final class SkeletonGateState
{
    /**
     * A length prop as a CSS length.
     *
     * A number becomes pixels; a string passes through untouched. Null is
     * absence; the empty string is not, and that distinction is the whole of the
     * reserve quirk below.
     */
    public static function resolveLength(string|int|float|null $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return is_string($value) ? $value : $value . 'px';
    }

    /**
     * The root's reserved height, from the three sources that can supply it.
     *
     * Measured height, then reserveHeight, then minHeight. Two historical
     * details:
     *
     *   - the measured height applies only while the gate is not ready, so the
     *     moment content appears the root hands its height back;
     *   - the reserve check is "not null" applied *after* the conversion, so
     *     `reserve-height="0"` reserves `0px` and `reserve-height=""` wins the
     *     contest and then evaporates in the serialiser, silently swallowing a
     *     min-height the caller also passed.
     *
     * $measuredContentHeight is a post-mount browser measurement. This adapter
     * renders on the server and has none, so it is always null here - which is
     * exactly the state the reference is in during SSR and in its own first
     * rendered frame. The parameter exists so the rule stays the same rule in
     * both languages rather than a server-shaped subset of it.
     */
    public static function resolveMinHeight(
        bool $ready,
        string|int|float|null $minHeight,
        string|int|float|null $reserveHeight,
        bool $preserveLastHeight,
        ?int $measuredContentHeight,
    ): ?string {
        if ($preserveLastHeight && $measuredContentHeight !== null && !$ready) {
            return $measuredContentHeight . 'px';
        }

        $reserve = self::resolveLength($reserveHeight);
        if ($reserve !== null) {
            return $reserve;
        }

        return self::resolveLength($minHeight);
    }

    /**
     * The declarations the gate writes into its own root style attribute.
     *
     * The fade duration is written on every render, so a gate always carries a
     * style attribute even at the default.
     *
     * An empty value is kept here rather than dropped, because the reference
     * builds a plain object and hands it to the platform's serialiser. What
     * each platform then does with it differs, and SkeletonGateComponent is
     * where this adapter's choice is made and explained.
     *
     * @return list<array{0: string, 1: string}>
     */
    public static function resolveRootStyle(?string $minHeight, ?string $radius, int|float $fadeDuration): array
    {
        $declarations = [];

        if ($minHeight !== null) {
            $declarations[] = ['min-height', $minHeight];
        }
        if ($radius !== null) {
            $declarations[] = ['border-radius', $radius];
        }
        $declarations[] = ['--vf-skeleton-gate-fade-duration', $fadeDuration . 'ms'];

        return $declarations;
    }

    /**
     * The declarations the gate writes onto the overlay.
     *
     * The radius and nothing else: the overlay never receives the reserved
     * height, the min-height or the fade duration, even though the root receives
     * all three.
     *
     * @return list<array{0: string, 1: string}>
     */
    public static function resolveOverlayStyle(?string $radius): array
    {
        if ($radius === null) {
            return [];
        }

        return [['border-radius', $radius]];
    }

    /**
     * The content wrapper's class list, in the order the reference emits it.
     *
     * A modifier on a permanent element, not a branch: the wrapper is rendered
     * in both states and the ready modifier is what the stylesheet fades on.
     *
     * @return list<string>
     */
    public static function resolveContentClasses(bool $ready, bool $normalizeContentSpacing): array
    {
        $classes = ['vf-skeleton-gate__content'];

        if ($ready) {
            $classes[] = 'vf-skeleton-gate__content--ready';
        }
        if ($normalizeContentSpacing) {
            $classes[] = 'vf-skeleton-gate__content--normalize-spacing';
        }

        return $classes;
    }
}
