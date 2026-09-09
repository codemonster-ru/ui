<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of the shared rules for the three M15 presentation components.
 *
 * The canonical implementation is packages/shared-core/src/presentation/state.ts.
 * Both run the vectors in packages/shared-core/src/presentation/state-vectors.json,
 * so the two implementations cannot drift.
 *
 * Three components' rules in one class with nothing shared between them.
 * resolveBadgeClasses() and resolveTagClasses() read identically and are still
 * written out twice: the two components are typed by separate public unions and
 * their stylesheets give a tone different meanings - a badge tone paints a
 * background, a tag tone only a border and text colour. A helper taking the
 * block name would make one component substitutable for the other in the
 * source, which is the specific thing this batch exists to disprove.
 *
 * @internal
 */
final class PresentationState
{
    /**
     * The badge root class list, in the order the reference emits it.
     *
     * `neutral` emits no modifier: the default tone is expressed by absence,
     * the opposite of the checkable controls' always-present size modifier.
     *
     * @return list<string>
     */
    public static function resolveBadgeClasses(string $tone): array
    {
        $classes = ['vf-badge'];

        if ($tone !== 'neutral') {
            $classes[] = 'vf-badge--' . $tone;
        }

        return $classes;
    }

    /**
     * The tag root class list, in the order the reference emits it.
     *
     * @return list<string>
     */
    public static function resolveTagClasses(string $tone): array
    {
        $classes = ['vf-tag'];

        if ($tone !== 'neutral') {
            $classes[] = 'vf-tag--' . $tone;
        }

        return $classes;
    }

    /**
     * The divider root class list.
     *
     * The orientation modifier is always emitted, including at the default.
     *
     * @return list<string>
     */
    public static function resolveDividerClasses(string $orientation): array
    {
        return ['vf-divider', 'vf-divider--' . $orientation];
    }

    /**
     * The `role` a divider writes, or null when it writes none.
     *
     * Only a vertical divider is given `role="separator"`. A horizontal one
     * carries `aria-orientation` on a roleless div, which is inert - and is the
     * historical behaviour, so it is reproduced rather than corrected.
     */
    public static function resolveDividerRole(string $orientation): ?string
    {
        return $orientation === 'vertical' ? 'separator' : null;
    }
}
