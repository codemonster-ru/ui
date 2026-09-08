<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of the shared VfField presentation rules.
 *
 * The canonical implementation is packages/shared-core/src/field/state.ts. Both
 * run the vectors in packages/shared-core/src/field/state-vectors.json, so this
 * file cannot drift from it without a test failing.
 *
 * Only the rules the server-rendered markup needs are mirrored. What the
 * browser decides at runtime - whether the control has become filled since the
 * page loaded - stays in the controller.
 *
 * @internal
 */
final class FieldState
{
    /**
     * Whether the label actually floats, which is not the same as asking for it.
     *
     * The control has to opt in. A field wrapping something that does not
     * support floating renders a plain top label however it was configured.
     */
    public static function isFloatingLabel(
        string $labelPlacement,
        bool $hasLabel,
        bool $controlSupportsFloating,
    ): bool {
        return $labelPlacement === 'floating' && $hasLabel && $controlSupportsFloating;
    }

    /** Either signal is enough; error text alone makes a field invalid. */
    public static function isInvalid(bool $invalid, bool $hasError): bool
    {
        return $invalid || $hasError;
    }

    /**
     * The root class list, in the order the reference emits it.
     *
     * The variant modifier is emitted only alongside the floating modifier, and
     * an undocumented variant value still reaches the class name.
     *
     * @return list<string>
     */
    public static function resolveClasses(bool $invalid, bool $floating, string $floatingVariant): array
    {
        $classes = ['vf-field'];

        if ($invalid) {
            $classes[] = 'vf-field--invalid';
        }

        if ($floating) {
            $classes[] = 'vf-field--floating';
            $classes[] = 'vf-field--floating-' . $floatingVariant;
        }

        return $classes;
    }

    /**
     * The class list of the element wrapping the control.
     *
     * `filled` is tracked whether or not the label floats.
     *
     * @return list<string>
     */
    public static function resolveControlClasses(bool $floating, bool $filled): array
    {
        $classes = ['vf-field__control'];

        if ($floating) {
            $classes[] = 'vf-field__control--floating';
        }

        if ($filled) {
            $classes[] = 'vf-field__control--filled';
        }

        return $classes;
    }

    /**
     * The `aria-describedby` value the field offers to its control.
     *
     * Description first, then error, space separated; null rather than an empty
     * string when there is neither, so the attribute is omitted.
     */
    public static function resolveDescribedBy(
        string $descriptionId,
        string $errorId,
        bool $hasDescription,
        bool $hasError,
    ): ?string {
        $ids = [];

        if ($hasDescription) {
            $ids[] = $descriptionId;
        }

        if ($hasError) {
            $ids[] = $errorId;
        }

        return $ids === [] ? null : implode(' ', $ids);
    }
}
