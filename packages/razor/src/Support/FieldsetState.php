<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/fieldset/state.ts.
 *
 * Four rules, none of them shared with FieldState or GroupBoxState: the field
 * computes the same describedBy string and the group box is the other
 * fieldset, and either one standing in for this class would let its evidence
 * pass for the fieldset's.
 *
 * @internal
 */
final class FieldsetState
{
    /**
     * Which parts a fieldset renders.
     *
     * JavaScript truthiness of a string, restated explicitly: "" is none and
     * "0" is present. PHP's own truthiness would drop "0", which is exactly
     * the port the shared vectors exist to catch. A slot counts by presence.
     *
     * @return array{label: bool, description: bool, error: bool}
     */
    public static function resolvePresence(
        ?string $label,
        ?string $description,
        ?string $error,
        bool $hasLabelSlot,
        bool $hasDescriptionSlot,
        bool $hasErrorSlot,
    ): array {
        return [
            'label' => self::present($label) || $hasLabelSlot,
            'description' => self::present($description) || $hasDescriptionSlot,
            'error' => self::present($error) || $hasErrorSlot,
        ];
    }

    /** Either signal is enough; it is a class and nothing else - no aria-invalid. */
    public static function isInvalid(bool $invalid, bool $hasError): bool
    {
        return $invalid || $hasError;
    }

    /**
     * The fieldset's own aria-describedby: description first, then error.
     * Null when there is neither, so the attribute is omitted.
     */
    public static function describedBy(string $descriptionId, string $errorId, bool $hasDescription, bool $hasError): ?string
    {
        $ids = [];

        if ($hasDescription) {
            $ids[] = $descriptionId;
        }
        if ($hasError) {
            $ids[] = $errorId;
        }

        return $ids === [] ? null : implode(' ', $ids);
    }

    /**
     * The root's class list, in the order the reference emits it.
     *
     * @return list<string>
     */
    public static function resolveClasses(bool $invalid): array
    {
        return $invalid ? ['vf-fieldset', 'vf-fieldset--invalid'] : ['vf-fieldset'];
    }

    private static function present(?string $value): bool
    {
        return $value !== null && $value !== '';
    }
}
