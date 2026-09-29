<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of the server rules in packages/shared-core/src/tooltip/state.ts.
 *
 * Two rules - the ones a server decides when it renders a closed tooltip,
 * which is the only tooltip a server ever renders. The vector file lists them
 * in `$serverRules`. The others are deliberately absent: the classes, the
 * arrow offset and the description relationship exist only once the tooltip
 * opens, which happens in the browser. The Razor browser controller runs them
 * from the TypeScript source.
 *
 * Not PopoverState under another name: the reference writes each component
 * its own copy, and so does this mirror.
 *
 * @internal
 */
final class TooltipState
{
    /** The default `openDelay` in milliseconds, TOOLTIP_OPEN_DELAY in the vectors. */
    public const OPEN_DELAY = 80;

    /**
     * Where the tooltip is teleported, or that it is not. `false` renders in
     * place, as `disable-teleport` does; a string is a selector; null means
     * body - Vue's explicit `teleportTo: null` is spelled `false` here, as for
     * the popover. A server has no element to pass.
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

    /**
     * Whether an open tooltip renders its element: JavaScript truthiness of the
     * text, or a content slot. PHP's own truthiness would drop "0", which the
     * reference renders; an empty string is the only falsy text.
     */
    public static function resolveHasContent(?string $text, bool $hasContentSlot): bool
    {
        return ($text !== null && $text !== '') || $hasContentSlot;
    }
}
