<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of the shared rules for the three checkable controls.
 *
 * The canonical implementation is packages/shared-core/src/checkable/state.ts.
 * Both run the vectors in packages/shared-core/src/checkable/state-vectors.json,
 * so the two implementations cannot drift.
 *
 * Three rule sets in one class, with nothing shared between them: the
 * components' contracts only look alike. See the TypeScript file for why no
 * common helper was extracted.
 *
 * @internal
 */
final class CheckableState
{
    /**
     * The checkbox root class list, in the order the reference emits it.
     *
     * The size modifier is emitted even at `md`, unlike VfInput and VfButton.
     *
     * @return list<string>
     */
    public static function resolveCheckboxClasses(
        string $size,
        bool $checked,
        bool $indeterminate,
        bool $invalid,
        bool $disabled,
    ): array {
        $classes = ['vf-checkbox', 'vf-checkbox--' . $size];

        if ($checked) {
            $classes[] = 'vf-checkbox--checked';
        }
        if ($indeterminate) {
            $classes[] = 'vf-checkbox--indeterminate';
        }
        if ($invalid) {
            $classes[] = 'vf-checkbox--invalid';
        }
        if ($disabled) {
            $classes[] = 'vf-checkbox--disabled';
        }

        return $classes;
    }

    /** The value a checkbox reports through aria-checked; indeterminate wins. */
    public static function resolveCheckboxAriaChecked(bool $checked, bool $indeterminate): string
    {
        if ($indeterminate) {
            return 'mixed';
        }

        return $checked ? 'true' : 'false';
    }

    /**
     * The radio root class list. It has no indeterminate state to report.
     *
     * @return list<string>
     */
    public static function resolveRadioClasses(string $size, bool $checked, bool $invalid, bool $disabled): array
    {
        $classes = ['vf-radio', 'vf-radio--' . $size];

        if ($checked) {
            $classes[] = 'vf-radio--checked';
        }
        if ($invalid) {
            $classes[] = 'vf-radio--invalid';
        }
        if ($disabled) {
            $classes[] = 'vf-radio--disabled';
        }

        return $classes;
    }

    /**
     * Whether a radio is the selected member of its group.
     *
     * Strict, so a numeric model does not select a string-valued radio. PHP's
     * `===` compares type and value the way JavaScript's does for these
     * scalars, which is what the shared vectors check.
     */
    public static function isRadioChecked(mixed $modelValue, mixed $value): bool
    {
        return $modelValue === $value;
    }

    /**
     * The switch root class list.
     *
     * Two modifiers the other two controls have no equivalent for, and the
     * contrast one is emitted only when it is not `auto`.
     *
     * @return list<string>
     */
    public static function resolveSwitchClasses(
        string $size,
        bool $isStatic,
        string $thumbContrast,
        bool $checked,
        bool $invalid,
        bool $disabled,
    ): array {
        $classes = ['vf-switch', 'vf-switch--' . $size];

        if ($isStatic) {
            $classes[] = 'vf-switch--static';
        }
        if ($thumbContrast !== 'auto') {
            $classes[] = 'vf-switch--thumb-contrast-' . $thumbContrast;
        }
        if ($checked) {
            $classes[] = 'vf-switch--checked';
        }
        if ($invalid) {
            $classes[] = 'vf-switch--invalid';
        }
        if ($disabled) {
            $classes[] = 'vf-switch--disabled';
        }

        return $classes;
    }
}
