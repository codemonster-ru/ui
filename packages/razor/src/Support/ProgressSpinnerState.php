<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/progress-spinner/state.ts.
 *
 * Its own class rather than methods on PresentationState, AlertState or
 * SkeletonState. The tone rule reads like the alert's and the size rule like
 * the skeleton's, and both resemblances are exactly where a shared helper would
 * be reached for; VfProgressSpinner shares a contract with neither, and a rule
 * that served two components would change for whichever one changed first.
 *
 * ProgressSpinnerStateVectorsTest runs the same vector file the TypeScript
 * suite runs, so the two implementations cannot drift.
 *
 * @internal
 */
final class ProgressSpinnerState
{
    /**
     * The spinner root class list, in the order the reference emits it.
     *
     * `primary` - the default - emits no modifier. Every other value does,
     * `neutral` included and a value outside the tone union included, because
     * the reference interpolates the prop without checking it.
     *
     * @return list<string>
     */
    public static function resolveClasses(string $tone): array
    {
        $classes = ['vf-progress-spinner'];

        if ($tone !== 'primary') {
            $classes[] = 'vf-progress-spinner--' . $tone;
        }

        return $classes;
    }

    /**
     * A `size` prop as a CSS length.
     *
     * A number becomes pixels; a string passes through untouched, which is how
     * a token reference - the value VfButton forwards - reaches the custom
     * property verbatim. Zero is a number like any other and becomes `0px`.
     */
    public static function resolveSize(string|int|float|null $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            return $value;
        }

        // 12.5 must render as "12.5px" and 40 as "40px"; an integral float must
        // not become "40.0px".
        return (is_float($value) && $value === floor($value) ? (string) (int) $value : (string) $value) . 'px';
    }

    /**
     * The declarations the component itself writes into the root style attribute.
     *
     * One custom property, and nothing when the size is absent. An empty
     * string is *kept*, as the shared rule keeps it: the reference hands a
     * plain object to Vue's serialisers and lets them decide, and the rule
     * must not decide for them. What this adapter does with an empty value is
     * ProgressSpinnerComponent's decision, made there and tested there.
     *
     * @return list<array{0: string, 1: string}>
     */
    public static function resolveStyle(string|int|float|null $size): array
    {
        $length = self::resolveSize($size);

        if ($length === null) {
            return [];
        }

        return [['--vf-progress-spinner-size', $length]];
    }
}
