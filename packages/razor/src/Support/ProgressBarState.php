<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/progress-bar/state.ts.
 *
 * Its own class rather than methods on ProgressSpinnerState. The tone rule
 * reads like the spinner's and the height rule like its size rule, and both
 * resemblances are exactly where a shared "progress" helper would be reached
 * for; VfProgressBar shares a contract with the spinner in neither, and a
 * rule that served both components would change for whichever one changed
 * first. ProgressBarStateVectorsTest runs the same vector file the TypeScript
 * suite runs, so the two implementations cannot drift.
 *
 * The one thing here with no TypeScript counterpart worth the name is
 * formatNumber: `String(n)` is a one-liner in JavaScript and a real rule in
 * PHP, whose default float-to-string uses fourteen significant digits and
 * writes `1.0E-7`. The reference's widths and values are JavaScript's, so
 * this class writes them the way JavaScript does.
 *
 * @internal
 */
final class ProgressBarState
{
    /**
     * A number as JavaScript's Number::toString writes it.
     *
     * The shortest digit string that round-trips, laid out by ECMAScript's
     * rules: positional notation for exponents in [-6, 21), exponent form
     * outside it with an explicit sign and no padding. `100.0` is `100`,
     * `58.333333333333336` keeps all seventeen digits, `1e-7` is `1e-7`.
     */
    public static function formatNumber(int|float $value): string
    {
        if (is_int($value)) {
            return (string) $value;
        }

        if (is_nan($value) || is_infinite($value)) {
            // Unreachable through the resolved value and maximum, which are
            // always finite; written for completeness of the mirror.
            return is_nan($value) ? 'NaN' : ($value > 0 ? 'Infinity' : '-Infinity');
        }

        if ($value === 0.0) {
            return '0';
        }

        $sign = $value < 0 ? '-' : '';
        $magnitude = abs($value);

        // The shortest round-trip representation: the fewest significant
        // digits whose parse gives the same double back.
        $digits = '';
        $exponent = 0;
        for ($precision = 1; $precision <= 17; $precision++) {
            $candidate = sprintf('%.' . ($precision - 1) . 'e', $magnitude);
            if ((float) $candidate === $magnitude) {
                [$mantissa, $power] = explode('e', $candidate);
                $digits = rtrim(str_replace('.', '', $mantissa), '0');
                $exponent = (int) $power;
                break;
            }
        }

        $k = strlen($digits);
        $n = $exponent + 1;

        if ($k <= $n && $n <= 21) {
            return $sign . $digits . str_repeat('0', $n - $k);
        }

        if (0 < $n && $n <= 21) {
            return $sign . substr($digits, 0, $n) . '.' . substr($digits, $n);
        }

        if (-6 < $n && $n <= 0) {
            return $sign . '0.' . str_repeat('0', -$n) . $digits;
        }

        $tail = $k === 1 ? '' : '.' . substr($digits, 1);
        $power = $n - 1;

        return $sign . $digits[0] . $tail . 'e' . ($power < 0 ? '-' : '+') . abs($power);
    }

    /**
     * The maximum the bar actually uses.
     *
     * A finite number greater than zero is kept; anything else - zero, a
     * negative, NAN, INF, null, or a string - falls back to 100. A string is
     * not a maximum to the *rule*, as it is not to the reference: the
     * component parses template text before calling it.
     */
    public static function resolveMax(int|float|string|null $max): int|float
    {
        if (is_int($max)) {
            return $max > 0 ? $max : 100;
        }

        if (is_float($max)) {
            return is_finite($max) && $max > 0 ? $max : 100;
        }

        return 100;
    }

    /**
     * The value the bar actually uses, given the resolved maximum.
     *
     * Non-finite - NAN, INF, null, a string - is 0. Otherwise the value is
     * clamped into [0, max]. No rounding.
     */
    public static function resolveValue(int|float|string|null $value, int|float $max): int|float
    {
        if (is_string($value) || $value === null) {
            return 0;
        }

        if (is_float($value) && !is_finite($value)) {
            return 0;
        }

        return min(max($value, 0), $max);
    }

    /** The fill's inline size: the raw ratio times 100, as a percentage string. */
    public static function resolvePercentage(int|float $value, int|float $max): string
    {
        return self::formatNumber(($value / $max) * 100) . '%';
    }

    /**
     * The visible label: the ratio rounded half-up to a whole percent.
     *
     * PHP's round() agrees with Math.round on every non-negative double,
     * 0.49999999999999994 included; floor($x + 0.5) does not.
     */
    public static function resolveValueLabel(int|float $value, int|float $max): string
    {
        return self::formatNumber((int) round(($value / $max) * 100)) . '%';
    }

    /**
     * The root class list, in the order the reference emits it.
     *
     * @return list<string>
     */
    public static function resolveClasses(string $tone, bool $striped, bool $animated, bool $indeterminate): array
    {
        $classes = ['vf-progress-bar'];

        if ($tone !== 'primary') {
            $classes[] = 'vf-progress-bar--' . $tone;
        }
        if ($striped) {
            $classes[] = 'vf-progress-bar--striped';
        }
        if ($striped && $animated) {
            $classes[] = 'vf-progress-bar--animated';
        }
        if ($indeterminate) {
            $classes[] = 'vf-progress-bar--indeterminate';
        }

        return $classes;
    }

    /**
     * A `height` prop as a CSS length.
     *
     * A number becomes pixels; a string passes through untouched. Zero is a
     * number like any other and becomes `0px`; an integral float must not
     * become `12.0px`.
     */
    public static function resolveHeight(string|int|float|null $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            return $value;
        }

        return self::formatNumber($value) . 'px';
    }

    /**
     * The declarations the component writes into the root style attribute.
     *
     * One custom property, and nothing when the height is absent. An empty
     * string is *kept*, as the shared rule keeps it; what this adapter does
     * with it is ProgressBarComponent's decision, made there and tested there.
     *
     * @return list<array{0: string, 1: string}>
     */
    public static function resolveRootStyle(string|int|float|null $height): array
    {
        $length = self::resolveHeight($height);

        if ($length === null) {
            return [];
        }

        return [['--vf-progress-bar-height', $length]];
    }

    /**
     * The declarations the component writes into the fill's style attribute.
     *
     * @return list<array{0: string, 1: string}>
     */
    public static function resolveValueStyle(bool $indeterminate, string $percentage): array
    {
        if ($indeterminate) {
            return [];
        }

        return [['inline-size', $percentage]];
    }

    /**
     * The value attributes the root writes, or null while indeterminate.
     *
     * @return array{valuemin: string, valuemax: string, valuenow: string}|null
     */
    public static function resolveValueSemantics(bool $indeterminate, int|float $value, int|float $max): ?array
    {
        if ($indeterminate) {
            return null;
        }

        return [
            'valuemin' => '0',
            'valuemax' => self::formatNumber($max),
            'valuenow' => self::formatNumber($value),
        ];
    }
}
