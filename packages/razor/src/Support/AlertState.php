<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/alert/state.ts.
 *
 * Not PresentationState with a block-name parameter, and not built on it. The
 * badge and the tag are typed against the same eight tone literals and their
 * class rules read like the one below, which is exactly why this is its own
 * class: they suppress the modifier at `neutral`, an alert suppresses it at
 * `primary`, and an alert's tone also picks a glyph. A shared rule would have
 * to be parameterised on the suppressed tone as well as the block name, and at
 * that point it is two rules wearing one name.
 *
 * There is no resolveRole here. Every alert writes `role="alert"` and tone
 * never changes it; a "danger is assertive, info is polite" mapping would be
 * an accessibility improvement and a product change. There is no dismiss rule
 * either, because the reference has no dismiss control.
 *
 * @internal
 */
final class AlertState
{
    /**
     * The alert root class list, in the order the reference emits it.
     *
     * `primary` - the default - emits no modifier. Every other tone does,
     * including `neutral`, which no stylesheet styles.
     *
     * @return list<string>
     */
    public static function resolveClasses(string $tone): array
    {
        $classes = ['vf-alert'];

        if ($tone !== 'primary') {
            $classes[] = 'vf-alert--' . $tone;
        }

        return $classes;
    }

    /**
     * The registry name of the glyph the icon slot falls back to.
     *
     * An explicit icon wins whatever it is, including the empty string: the
     * reference tests it with `??`, not for truthiness. Otherwise the tone
     * chooses, and four tones - neutral, primary, info and contrast - share
     * one glyph, because `neutral` is not named in the reference's chain and
     * falls to the chain's default.
     */
    public static function resolveIcon(string $tone, ?string $icon): string
    {
        if ($icon !== null) {
            return $icon;
        }

        return match ($tone) {
            'success' => 'check-circle',
            'warn' => 'alert-circle',
            'help' => 'question-circle',
            'danger' => 'x-circle',
            default => 'info-circle',
        };
    }

    /**
     * Which optional parts an alert renders.
     *
     * Two containers keyed on different questions, and two slot fallbacks:
     *
     *   - the icon container is keyed on `hideIcon` alone, and `hideIcon`
     *     discards a consumer's icon slot along with the glyph;
     *   - the title paragraph is keyed on `title || $slots.title`, with an
     *     empty-string title falsy - so no paragraph for `title=""` alone, and
     *     an empty paragraph for `title=""` with a title slot that renders
     *     nothing;
     *   - both fallbacks disappear when their slot renders something and come
     *     back when it renders nothing. Vue answers that through slot
     *     mechanics; this adapter decides it, because a Razor slot arrives as
     *     already-rendered markup.
     *
     * The body wrapper has no key because it has no decision: it always renders.
     *
     * @return array{icon: bool, iconGlyph: bool, title: bool, titleText: bool}
     */
    public static function resolveRegions(
        bool $hideIcon,
        bool $hasIconSlot,
        ?bool $iconSlotContent,
        ?string $title,
        bool $hasTitleSlot,
        ?bool $titleSlotContent,
    ): array {
        return [
            'icon' => !$hideIcon,
            'iconGlyph' => !($iconSlotContent ?? $hasIconSlot),
            'title' => ($title !== null && $title !== '') || $hasTitleSlot,
            'titleText' => !($titleSlotContent ?? $hasTitleSlot),
        ];
    }
}
