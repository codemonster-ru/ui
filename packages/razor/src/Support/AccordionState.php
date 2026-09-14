<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/accordion/state.ts.
 *
 * Three rules and, as in the TypeScript, a deliberate absence: no toggle, no
 * next-state, no listener. The state a Razor accordion is in lives in its
 * server-rendered `aria-expanded` attribute and is read from there by the
 * browser controller; this class decides only what the server has to decide.
 *
 * @internal
 */
final class AccordionState
{
    /**
     * The open state the props resolve to before any interaction.
     *
     * `open` wins whenever it is not null; `defaultOpen` seeds the state
     * otherwise. The TypeScript rule takes `undefined` as its only absence;
     * this adapter's convention is that a null attribute was not said, and
     * the component maps that to `null` here before the rule runs.
     */
    public static function resolveOpen(?bool $open, ?bool $defaultOpen): bool
    {
        return $open ?? ($defaultOpen ?? false);
    }

    /**
     * The icon wrapper's class list, in the order the reference emits it.
     *
     * @return list<string>
     */
    public static function resolveIconClasses(bool $open): array
    {
        $classes = ['vf-accordion__icon'];

        if ($open) {
            $classes[] = 'vf-accordion__icon--open';
        }

        return $classes;
    }

    /**
     * The inline transition declaration the browser controller writes while
     * the panel enters or leaves. Restated here so the vector file proves the
     * two adapters agree on it; the server itself never writes it.
     */
    public static function resolveTransition(): string
    {
        return implode(', ', [
            'height var(--vf-motion-duration-normal) var(--vf-motion-ease-standard)',
            'opacity var(--vf-motion-duration-normal) var(--vf-motion-ease-standard)',
        ]);
    }
}
