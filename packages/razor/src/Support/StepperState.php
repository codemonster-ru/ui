<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/stepper/state.ts.
 *
 * Pure rules over items and a value, and - as in the TypeScript - a deliberate
 * absence: no next step, no previous step, no wrap, no focus, no listener. The
 * state a Razor stepper is in lives in its server-rendered `aria-current`
 * attribute and is read from there by the browser controller; this class
 * decides only what the server has to decide before any script runs.
 * StepperStateVectorsTest runs the same vector file the TypeScript suite runs,
 * so the two implementations cannot drift.
 *
 * The one rule with no TypeScript counterpart worth the name is
 * formatProgressFactor: `String(n)` is a one-liner in JavaScript and a real
 * rule in PHP, whose default float-to-string uses fourteen significant
 * digits and would write `0.33333333333333` where the reference writes
 * `0.3333333333333333`. The factor is a ratio in [0, 1] whose denominator is
 * the number of steps minus one, so the mirror is the smallest one the
 * historical vectors need - positional notation, shortest round-trip digits -
 * and not a general JavaScript number formatter. ProgressBarState has one of
 * those for its own values and this class does not reach into it: a bar's
 * percentage and a stepper's factor are two contracts that happen to agree on
 * the digits today.
 *
 * @internal
 */
final class StepperState
{
    /**
     * The content position the two props resolve to: a vertical stepper knows
     * `start` and everything else is `end`; a horizontal one knows `above` and
     * everything else is `below`.
     */
    public static function resolveContentPosition(string $orientation, ?string $contentPosition): string
    {
        if ($orientation === 'vertical') {
            return $contentPosition === 'start' ? 'start' : 'end';
        }

        return $contentPosition === 'above' ? 'above' : 'below';
    }

    /**
     * The root's three canonical classes, in the order the reference emits them.
     *
     * @return list<string>
     */
    public static function resolveClasses(string $orientation, ?string $contentPosition): array
    {
        return [
            'vf-stepper',
            'vf-stepper--' . $orientation,
            'vf-stepper--content-' . self::resolveContentPosition($orientation, $contentPosition),
        ];
    }

    /**
     * The value of the first enabled item, or null when there is none.
     *
     * @param list<array{value: string, disabled?: bool}> $items
     */
    public static function resolveFallbackValue(array $items): ?string
    {
        foreach ($items as $item) {
            if (!($item['disabled'] ?? false)) {
                return $item['value'];
            }
        }

        return null;
    }

    /**
     * The active value: the controlled prop, else the seed, else the fallback.
     *
     * The TypeScript rule takes `undefined` and `null` as absences and keeps an
     * empty string; PHP has one null, and the component maps an attribute that
     * was not given to it. An empty string given as the value is kept and
     * matches nothing, exactly as in the reference.
     *
     * @param list<array{value: string, disabled?: bool}> $items
     */
    public static function resolveActiveValue(?string $modelValue, ?string $internalValue, array $items): ?string
    {
        return $modelValue ?? $internalValue ?? self::resolveFallbackValue($items);
    }

    /**
     * The index of the first item carrying the active value, or -1.
     *
     * @param list<array{value: string, disabled?: bool}> $items
     */
    public static function resolveActiveIndex(array $items, ?string $activeValue): int
    {
        foreach ($items as $index => $item) {
            if ($activeValue !== null && $item['value'] === $activeValue) {
                return $index;
            }
        }

        return -1;
    }

    /**
     * A step's state in the reference's precedence: disabled, current,
     * complete, upcoming. Duplicate values resolve to the first occurrence on
     * both sides, so two items sharing a value share a state.
     *
     * @param list<array{value: string, disabled?: bool}> $items
     * @param array{value: string, disabled?: bool} $item
     */
    public static function resolveStepState(array $items, ?string $activeValue, array $item): string
    {
        if ($item['disabled'] ?? false) {
            return 'disabled';
        }

        $activeIndex = self::resolveActiveIndex($items, $activeValue);
        $currentIndex = self::resolveActiveIndex($items, $item['value']);

        if ($currentIndex === $activeIndex) {
            return 'current';
        }

        if ($activeIndex >= 0 && $currentIndex < $activeIndex) {
            return 'complete';
        }

        return 'upcoming';
    }

    /**
     * A factor in [0, 1] as JavaScript's Number::toString writes it.
     *
     * The shortest digit string whose parse gives the same double back, in
     * positional notation: `0`, `1`, `0.5`, `0.3333333333333333`. A factor is
     * never small enough for JavaScript's exponent form (that starts below
     * 1e-6, which would need a million steps), so the mirror stops at the
     * positional case and refuses anything outside [0, 1] rather than guess.
     */
    public static function formatProgressFactor(int|float $factor): string
    {
        if (is_int($factor) || $factor === floor($factor)) {
            $whole = (int) $factor;
            if ($whole < 0 || $whole > 1) {
                throw new \InvalidArgumentException('A stepper progress factor lies in [0, 1].');
            }

            return (string) $whole;
        }

        if (!($factor > 0.0 && $factor < 1.0)) {
            throw new \InvalidArgumentException('A stepper progress factor lies in [0, 1].');
        }

        // The fewest significant digits that round-trip. sprintf's %e gives
        // the digits and the decimal exponent; the exponent is at most -1 for
        // a fraction below one and, for any real step count, above -7, which
        // is the whole positional range JavaScript keeps.
        for ($precision = 1; $precision <= 17; $precision++) {
            $candidate = sprintf('%.' . ($precision - 1) . 'e', $factor);
            if ((float) $candidate === $factor) {
                [$mantissa, $power] = explode('e', $candidate);
                $digits = rtrim(str_replace('.', '', $mantissa), '0');
                $leadingZeros = -((int) $power) - 1;

                return '0.' . str_repeat('0', $leadingZeros) . $digits;
            }
        }

        throw new \LogicException('A double always round-trips within seventeen significant digits.');
    }

    /**
     * The root's custom properties, in the order the reference writes them:
     * the item count always, the progress factor for two or more items as
     * index / (count - 1) with an unknown value normalised to index 0.
     *
     * @param list<array{value: string, disabled?: bool}> $items
     * @return list<array{0: string, 1: string}>
     */
    public static function resolveRootStyle(array $items, ?string $activeValue): array
    {
        $count = count($items);
        $declarations = [['--vf-stepper-item-count', (string) $count]];

        if ($count <= 1) {
            return $declarations;
        }

        $activeIndex = self::resolveActiveIndex($items, $activeValue);
        $normalizedActiveIndex = $activeIndex < 0 ? 0 : $activeIndex;
        $declarations[] = ['--vf-stepper-progress-factor', self::formatProgressFactor($normalizedActiveIndex / ($count - 1))];

        return $declarations;
    }
}
