<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/panel/state.ts.
 *
 * Not CardState with a block-name parameter, and not a subclass of it. VfCard is
 * the nearest structural neighbour VfPanel has - same root tag, same conditional
 * unclassed header, same `title` fallback heading - which is exactly why the two
 * are kept apart here. The returned shape has two keys where CardState returns
 * four, because a panel has no body wrapper and no footer: a class that could
 * return either shape would be a class that could render either component.
 *
 * @internal
 */
final class PanelState
{
    /**
     * The panel root class list, in the order the reference emits it.
     *
     * @return list<string>
     */
    public static function resolveClasses(bool $subtle): array
    {
        $classes = ['vf-panel'];

        if ($subtle) {
            $classes[] = 'vf-panel--subtle';
        }

        return $classes;
    }

    /**
     * Which header parts a panel renders.
     *
     * Three historical rules, none of them visible in the rendered result:
     *
     *   - the header appears when there is a title *or* a header slot, and an
     *     empty-string title is falsy, so `title=""` renders no header;
     *   - the fallback `h3` is slot fallback content, so a header slot that
     *     renders something removes it even when a title was also passed, and
     *     the title then goes unused;
     *   - the header wrapper and the fallback heading are keyed on different
     *     questions. The wrapper asks whether a header slot was passed; the
     *     heading asks whether it produced content. Vue gets the second answer
     *     from its slot-fallback semantics for free; this adapter has to decide
     *     it, because a Razor slot arrives as already-rendered markup.
     *
     * There is deliberately no `body` and no `footer` key. The default slot
     * renders straight into the section with no wrapper and no condition, so
     * there is nothing to decide; a panel has no footer element at all.
     *
     * @return array{header: bool, headerTitle: bool}
     */
    public static function resolveRegions(
        ?string $title,
        bool $hasHeaderSlot,
        ?bool $headerSlotContent = null,
    ): array {
        return [
            'header' => ($title !== null && $title !== '') || $hasHeaderSlot,
            'headerTitle' => !($headerSlotContent ?? $hasHeaderSlot),
        ];
    }
}
