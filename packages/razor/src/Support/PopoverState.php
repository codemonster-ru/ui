<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of the server rules in packages/shared-core/src/popover/state.ts.
 *
 * Four rules - the ones a server decides when it renders the trigger and, for
 * an initially open popover, the panel. The vector file lists them in
 * `$serverRules`. The others are deliberately absent: the trigger key, the
 * flip pair, the arrow offset and the two dismissal predicates are decisions
 * the browser makes with a key, a click or floater.js's output in hand. The
 * Razor browser controller runs them from the TypeScript source.
 *
 * Not DropdownState under another name: the reference writes each component
 * its own copy, and so does this mirror.
 *
 * @internal
 */
final class PopoverState
{
    /**
     * The trigger's one state attribute, always written.
     *
     * @return array{ariaExpanded: string}
     */
    public static function resolveTriggerState(bool $open): array
    {
        return ['ariaExpanded' => $open ? 'true' : 'false'];
    }

    /**
     * The panel's class list. The placement is the requested one on the
     * server, which is what the reference renders until floater.js computes
     * another. There is no `--bottom` panel modifier.
     *
     * @return list<string>
     */
    public static function resolveContentClasses(string $placement): array
    {
        return str_starts_with($placement, 'top')
            ? ['vf-popover__content', 'vf-popover__content--top']
            : ['vf-popover__content'];
    }

    /** @return list<string> */
    public static function resolveArrowClasses(string $placement): array
    {
        return [
            'vf-popover__arrow',
            str_starts_with($placement, 'top') ? 'vf-popover__arrow--top' : 'vf-popover__arrow--bottom',
        ];
    }

    /**
     * Where the panel is teleported, or that it is not. `false` renders in
     * place, as `disable-teleport` does; a string is a selector; null means
     * body - Vue's explicit `teleportTo: null` is spelled `false` here, as for
     * the dropdown. A server has no element to pass.
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
