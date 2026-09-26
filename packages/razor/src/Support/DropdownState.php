<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of the server rules in packages/shared-core/src/dropdown/state.ts.
 *
 * Five rules - the ones a server decides when it renders the trigger and,
 * for an initially open dropdown, the menu. The vector file lists them in
 * `$serverRules`. The others are deliberately absent: the menu walk, the
 * arrow offset, the flip pair and the opening keys are decisions the browser
 * makes with a key, a focused element or floater.js's output in hand, and a
 * server holds none of those. The Razor browser controller runs them from
 * the TypeScript source.
 *
 * @internal
 */
final class DropdownState
{
    /** Whether the menu is open: never while disabled, whatever the disclosure says. */
    public static function resolveOpen(bool $disabled, bool $open): bool
    {
        return !$disabled && $open;
    }

    /**
     * The trigger wrapper's state attributes. `aria-disabled` is "true" or
     * absent (null), never "false"; `aria-expanded` is always written.
     *
     * @return array{ariaDisabled: ?string, ariaExpanded: string, tabindex: string}
     */
    public static function resolveTriggerState(bool $disabled, bool $open): array
    {
        return [
            'ariaDisabled' => $disabled ? 'true' : null,
            'ariaExpanded' => self::resolveOpen($disabled, $open) ? 'true' : 'false',
            'tabindex' => $disabled ? '-1' : '0',
        ];
    }

    /**
     * The menu's class list. The variant is written through unvalidated; the
     * placement is the requested one on the server, which is what the
     * reference renders until floater.js computes another.
     *
     * @return list<string>
     */
    public static function resolveMenuClasses(string $variant, string $placement): array
    {
        $classes = ['vf-dropdown__menu', "vf-dropdown__menu--{$variant}"];

        if (str_starts_with($placement, 'top')) {
            $classes[] = 'vf-dropdown__menu--top';
        }

        return $classes;
    }

    /** @return list<string> */
    public static function resolveArrowClasses(string $placement): array
    {
        return [
            'vf-dropdown__arrow',
            str_starts_with($placement, 'top') ? 'vf-dropdown__arrow--top' : 'vf-dropdown__arrow--bottom',
        ];
    }

    /**
     * Where the menu is teleported, or that it is not. `false` renders in
     * place, as `disable-teleport` does; a string is a selector; null means
     * body. That last one is where this adapter and Vue differ in spelling,
     * not in behaviour: a null attribute is "not given" by this adapter's
     * convention, so Vue's explicit `teleportTo: null` - which renders in
     * place - is spelled `false` here. A server has no element to pass.
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
