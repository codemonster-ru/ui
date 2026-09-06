<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of the platform-independent VfInput rules in
 * @codemonster-ru/vueforge-shared-core.
 *
 * PHP cannot import a TypeScript module, and this adapter deliberately has no
 * Node bridge, so the handful of rules the server needs for its initial markup
 * are restated here. They are intentionally tiny and deterministic, and
 * InputStateVectorsTest runs both sides against the same shared vector file so
 * the two implementations cannot drift.
 *
 * Only initial-state semantics live here. Everything interactive belongs to the
 * browser controller, which uses the shared TypeScript rules directly.
 *
 * @internal
 */
final class InputState
{
    /**
     * Filled state of a text control.
     *
     * Historical rule: any non-empty string is filled, whitespace included.
     */
    public static function isFilled(?string $value): bool
    {
        return ($value ?? '') !== '';
    }

    /**
     * Whether the password reveal action exists at all.
     *
     * Historical rule: offered only for an explicit type="password".
     */
    public static function isPasswordRevealAvailable(bool $passwordReveal, ?string $type): bool
    {
        return $passwordReveal && $type === 'password';
    }

    /**
     * The type the control renders with.
     *
     * Only a revealed password becomes text; every other native type passes
     * through untouched.
     */
    public static function resolveType(?string $type, bool $passwordRevealAvailable, bool $passwordRevealed): ?string
    {
        return $passwordRevealAvailable && $passwordRevealed ? 'text' : $type;
    }

    /** Whether the clear action should be offered. */
    public static function isClearActionAvailable(
        bool $clearable,
        bool $filled,
        bool $disabled,
        bool $readonly,
    ): bool {
        return $clearable && $filled && !$disabled && !$readonly;
    }

    /**
     * Derives the adornment layout from what is present.
     *
     * @return array{
     *     hasLeadingAdornment: bool,
     *     hasTrailingAdornment: bool,
     *     hasPasswordRevealControl: bool,
     *     hasClearControl: bool,
     *     hasTrailingActionControl: bool,
     *     hasTrailingControl: bool,
     *     hasAdornments: bool,
     * }
     */
    public static function resolveAdornmentState(
        bool $hasLeadingAdornment,
        bool $hasTrailingAdornment,
        bool $hasPasswordRevealControl,
        bool $hasClearControl,
    ): array {
        $hasTrailingActionControl = $hasPasswordRevealControl || $hasClearControl;
        $hasTrailingControl = $hasTrailingAdornment || $hasTrailingActionControl;

        return [
            'hasLeadingAdornment' => $hasLeadingAdornment,
            'hasTrailingAdornment' => $hasTrailingAdornment,
            'hasPasswordRevealControl' => $hasPasswordRevealControl,
            'hasClearControl' => $hasClearControl,
            'hasTrailingActionControl' => $hasTrailingActionControl,
            'hasTrailingControl' => $hasTrailingControl,
            'hasAdornments' => $hasLeadingAdornment || $hasTrailingControl,
        ];
    }
}
