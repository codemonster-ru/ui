<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of the server rules in packages/shared-core/src/select/state.ts.
 *
 * Ten rules - the ones a server decides when it renders the closed select:
 * what it displays, which classes and attributes the wrapper, the trigger and
 * the hidden input carry, what a field is told, and where the listbox will be
 * teleported. The vector file lists them in `$serverRules`. The others are
 * deliberately absent: the walk, the focus target, the flip pair, the
 * listbox classes of a computed placement and the scroll are decisions the
 * browser makes with a key, a focused element, floater.js's output or a
 * measured option in hand. The Razor browser controller runs them from the
 * TypeScript source.
 *
 * @internal
 */
final class SelectState
{
    /** Whether the model holds a value: its string form is not empty. */
    public static function resolveHasValue(?string $modelValue): bool
    {
        return ($modelValue ?? '') !== '';
    }

    /**
     * The option the model selects: the first whose value equals it, disabled
     * or not.
     *
     * @param list<array{value: string, label: string, disabled?: bool}> $options
     * @return array{value: string, label: string, disabled?: bool}|null
     */
    public static function resolveSelectedOption(array $options, ?string $modelValue): ?array
    {
        foreach ($options as $option) {
            if ($option['value'] === $modelValue) {
                return $option;
            }
        }

        return null;
    }

    /** The trigger's text: the selected label, else nothing under a floating label, else the placeholder. */
    public static function resolveDisplayLabel(?string $selectedLabel, bool $floating, ?string $placeholder): string
    {
        if ($selectedLabel !== null) {
            return $selectedLabel;
        }

        if ($floating) {
            return '';
        }

        return $placeholder ?? '';
    }

    public static function resolveHasClearControl(bool $clearable, bool $hasValue, bool $disabled): bool
    {
        return $clearable && $hasValue && !$disabled;
    }

    /** Whether the hidden form input renders: only for a string `name`. */
    public static function resolveRendersHiddenInput(mixed $name): bool
    {
        return is_string($name);
    }

    /** Whether a consumer attribute is forwarded to the trigger: aria-*, data-*, title and tabindex only. */
    public static function resolveForwardsAttribute(string $name): bool
    {
        return str_starts_with($name, 'aria-')
            || str_starts_with($name, 'data-')
            || $name === 'title'
            || $name === 'tabindex';
    }

    /** What a field wrapping the select is told: filled while it holds a value or is open. */
    public static function resolveFieldFilled(bool $hasValue, bool $open): bool
    {
        return $hasValue || $open;
    }

    /**
     * @param array{size: string, hasLeading: bool, hasTrailing: bool, hasClear: bool, floating: bool} $state
     * @return list<string>
     */
    public static function resolveWrapperClasses(array $state): array
    {
        $classes = ['vf-select-wrap'];

        if ($state['size'] !== 'md') {
            $classes[] = "vf-select-wrap--{$state['size']}";
        }
        if ($state['hasLeading']) {
            $classes[] = 'vf-select-wrap--with-leading';
        }
        if ($state['hasTrailing']) {
            $classes[] = 'vf-select-wrap--with-trailing';
        }
        if ($state['hasClear']) {
            $classes[] = 'vf-select-wrap--with-clear';
        }
        if ($state['floating']) {
            $classes[] = 'vf-select-wrap--floating';
        }

        return $classes;
    }

    /**
     * `--placeholder` needs no selection *and* a non-empty placeholder, and is
     * kept under a floating label whose text is suppressed.
     *
     * @param array{size: string, hasLeading: bool, hasTrailing: bool, hasClear: bool, floating: bool, invalid: bool, open: bool, hasSelection: bool, placeholder?: ?string} $state
     * @return list<string>
     */
    public static function resolveTriggerClasses(array $state): array
    {
        $classes = ['vf-select'];

        if ($state['size'] !== 'md') {
            $classes[] = "vf-select--{$state['size']}";
        }
        if ($state['invalid']) {
            $classes[] = 'vf-select--invalid';
        }
        if ($state['open']) {
            $classes[] = 'vf-select--open';
        }
        if (!$state['hasSelection'] && ($state['placeholder'] ?? '') !== '') {
            $classes[] = 'vf-select--placeholder';
        }
        if ($state['hasLeading']) {
            $classes[] = 'vf-select--with-leading';
        }
        if ($state['hasTrailing']) {
            $classes[] = 'vf-select--with-trailing';
        }
        if ($state['hasClear']) {
            $classes[] = 'vf-select--with-clear';
        }
        if ($state['floating']) {
            $classes[] = 'vf-select--floating';
        }

        return $classes;
    }

    /**
     * Where the listbox is teleported, or that it is not. `false` renders in
     * place, as `disable-teleport` does; a string is a selector; null means
     * body - Vue's explicit `teleportTo: null` is spelled `false` here, by the
     * adapter's convention that a null attribute is "not given".
     *
     * @return array{disabled: bool, target: string}
     */
    public static function resolveTeleport(string|false|null $teleportTo, bool $disableTeleport): array
    {
        return [
            'disabled' => $disableTeleport || $teleportTo === false,
            'target' => is_string($teleportTo) ? $teleportTo : 'body',
        ];
    }
}
