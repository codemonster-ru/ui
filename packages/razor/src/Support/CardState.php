<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/card/state.ts.
 *
 * Deliberately not a rule about surfaces in general. VfPanel is the nearest
 * structural neighbour VfCard has - same root tag, same conditional header,
 * same `title` fallback heading - and it is not migrated in M16. A class taking
 * a block name would be written today and reused for VfPanel tomorrow, and the
 * evidence that the two were ever compared independently would be gone.
 *
 * @internal
 */
final class CardState
{
    /**
     * The card root class list, in the order the reference emits it.
     *
     * @return list<string>
     */
    public static function resolveClasses(bool $compact): array
    {
        $classes = ['vf-card'];

        if ($compact) {
            $classes[] = 'vf-card--compact';
        }

        return $classes;
    }

    /**
     * Which of the card's regions render.
     *
     * Four historical rules, none of them visible in the rendered result:
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
     *     it, because a Razor slot arrives as already-rendered markup;
     *   - the body wrapper is keyed on the default slot *existing*, not on what
     *     it renders, so an empty slot still produces an empty div;
     *   - the footer is keyed the same way and has no prop at all.
     *
     * @return array{header: bool, headerTitle: bool, body: bool, footer: bool}
     */
    public static function resolveRegions(
        ?string $title,
        bool $hasHeaderSlot,
        bool $hasDefaultSlot,
        bool $hasFooterSlot,
        ?bool $headerSlotContent = null,
    ): array {
        return [
            'header' => ($title !== null && $title !== '') || $hasHeaderSlot,
            'headerTitle' => !($headerSlotContent ?? $hasHeaderSlot),
            'body' => $hasDefaultSlot,
            'footer' => $hasFooterSlot,
        ];
    }
}
