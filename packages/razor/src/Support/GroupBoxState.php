<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/group-box/state.ts.
 *
 * Four rules and, as in the TypeScript, a deliberate absence: no toggle, no
 * next state. The state a Razor group box is in lives in its server-rendered
 * `aria-expanded` attribute and is read from there by the browser controller;
 * this class decides only what the server has to decide.
 *
 * @internal
 */
final class GroupBoxState
{
    /**
     * Whether the group has a title.
     *
     * JavaScript truthiness of a string, restated explicitly: "" is no title
     * and "0" is one. PHP's own truthiness would drop "0", which is exactly
     * the port the shared vectors exist to catch, so the test here is the
     * empty string and nothing else.
     */
    public static function hasTitle(?string $title, bool $hasTitleSlot): bool
    {
        return ($title !== null && $title !== '') || $hasTitleSlot;
    }

    /**
     * The open state the props resolve to before any interaction.
     *
     * A non-null `collapsed` wins; `defaultCollapsed` seeds the state
     * otherwise. Null is this adapter's "nothing said", mapped by the
     * component before the rule runs.
     */
    public static function resolveOpen(?bool $collapsed, ?bool $defaultCollapsed): bool
    {
        return $collapsed !== null ? !$collapsed : !($defaultCollapsed ?? false);
    }

    /**
     * The disclosure flags.
     *
     * @return array{collapsible: bool, collapsed: bool, toggleable: bool}
     */
    public static function resolveFlags(bool $hasTitle, bool $collapsible, bool $open, bool $disabled): array
    {
        $isCollapsible = $collapsible && $hasTitle;

        return [
            'collapsible' => $isCollapsible,
            'collapsed' => $isCollapsible && !$open,
            'toggleable' => $isCollapsible && !$disabled,
        ];
    }

    /**
     * The root's class list, in the order the reference emits it.
     *
     * @return list<string>
     */
    public static function resolveClasses(bool $hasTitle, bool $collapsible, bool $collapsed): array
    {
        $classes = ['vf-group-box'];

        if ($hasTitle) {
            $classes[] = 'vf-group-box--titled';
        }
        if ($collapsible) {
            $classes[] = 'vf-group-box--collapsible';
        }
        if ($collapsed) {
            $classes[] = 'vf-group-box--collapsed';
        }

        return $classes;
    }
}
