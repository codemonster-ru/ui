<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of the server rules in packages/shared-core/src/nav-menu/state.ts.
 *
 * Fifteen rules - the ones a server decides when it renders the tree once:
 * what is a branch and what is a link, whether the menu is simple, the
 * ancestry of the initial value and the expanded values it opens, which item
 * is an ancestor of the active one, whether the menu is compact, and every
 * class list. The vector file lists them in `$serverRules`. Two are
 * deliberately absent: a toggle is a click and a measurement is the
 * browser's, so `resolveToggledExpandedValues` and `resolveMeasuredCompact`
 * would be a server pretending to hold either. The Razor browser controller
 * runs them from the TypeScript source.
 *
 * An item here is the validated array the component builds: `value`, and
 * optionally `kind`, `leadingIcon`, `href`, `to` (never present once the
 * component has refused it, but part of the rule), `target` and `children`.
 * An absent key is the reference's `undefined`.
 *
 * @internal
 */
final class NavMenuState
{
    /** @param array<string, mixed> $item */
    public static function resolveIsBranch(array $item): bool
    {
        return ($item['kind'] ?? null) !== 'group' && !empty($item['children']);
    }

    /**
     * A link is selected by definedness: an empty href is a link.
     *
     * @param array<string, mixed> $item
     */
    public static function resolveIsLink(array $item): bool
    {
        return array_key_exists('href', $item) || array_key_exists('to', $item);
    }

    /** @param array<string, mixed> $item */
    public static function resolveShowsExternalIcon(array $item): bool
    {
        return self::resolveIsLink($item) && ($item['target'] ?? null) === '_blank';
    }

    /**
     * No group and no truthy leading icon anywhere in the tree.
     *
     * @param list<array<string, mixed>> $items
     */
    public static function resolveIsSimple(array $items): bool
    {
        return !self::hasFeature($items, static fn (array $item): bool => ($item['kind'] ?? null) === 'group')
            && !self::hasFeature($items, static fn (array $item): bool => ($item['leadingIcon'] ?? '') !== '');
    }

    /**
     * The values on the path to the first item with `$value`, outermost first,
     * group values included. Empty for an empty or unknown value and for a
     * top-level one.
     *
     * @param list<array<string, mixed>> $items
     * @param list<string> $parents
     * @return list<string>
     */
    public static function resolveAncestorValues(array $items, ?string $value, array $parents = []): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        foreach ($items as $item) {
            if ($item['value'] === $value) {
                return $parents;
            }

            if (!empty($item['children'])) {
                $result = self::resolveAncestorValues($item['children'], $value, [...$parents, $item['value']]);
                if ($result !== []) {
                    return $result;
                }
            }
        }

        return [];
    }

    /** @param array<string, mixed> $item */
    public static function resolveHasDescendant(array $item, ?string $value): bool
    {
        if ($value === null || $value === '' || empty($item['children'])) {
            return false;
        }

        foreach ($item['children'] as $child) {
            if ($child['value'] === $value || self::resolveHasDescendant($child, $value)) {
                return true;
            }
        }

        return false;
    }

    /**
     * The current expanded values, then the ancestry of `$active`, without
     * repeats.
     *
     * @param list<array<string, mixed>> $items
     * @param list<string> $expanded
     * @return list<string>
     */
    public static function resolveSyncedExpandedValues(array $items, array $expanded, ?string $active): array
    {
        $result = [];
        foreach ([...$expanded, ...self::resolveAncestorValues($items, $active)] as $value) {
            if (!in_array($value, $result, true)) {
                $result[] = $value;
            }
        }

        return $result;
    }

    /** The sidebar only, an explicit value over the measurement. */
    public static function resolveCompact(string $variant, ?bool $compact, bool $measured): bool
    {
        return $variant === 'sidebar' && ($compact ?? $measured);
    }

    /** @return list<string> */
    public static function resolveRootClasses(string $variant, bool $simple, bool $compact): array
    {
        $classes = ['vf-nav-menu', 'vf-nav-menu--' . $variant];
        if ($simple) {
            $classes[] = 'vf-nav-menu--simple';
        }
        if ($compact) {
            $classes[] = 'vf-nav-menu--sidebar-compact';
        }

        return $classes;
    }

    /** @return list<string> */
    public static function resolveNodeClasses(int $level, bool $expanded, bool $active, bool $ancestorActive): array
    {
        $classes = ['vf-nav-menu__node', 'vf-nav-menu__node--level-' . $level];
        if ($expanded) {
            $classes[] = 'vf-nav-menu__node--expanded';
        }
        if ($active) {
            $classes[] = 'vf-nav-menu__node--active';
        }
        if ($ancestorActive) {
            $classes[] = 'vf-nav-menu__node--ancestor-active';
        }

        return $classes;
    }

    /** @return list<string> */
    public static function resolveGroupClasses(int $level): array
    {
        return ['vf-nav-menu__group', 'vf-nav-menu__group--level-' . $level];
    }

    /** @return list<string> */
    public static function resolveBranchClasses(int $level, bool $hasLeadingIcon, bool $ancestorActive, bool $expanded): array
    {
        $classes = ['vf-nav-menu__item', 'vf-nav-menu__item--branch'];
        if ($level === 0) {
            $classes[] = 'vf-nav-menu__item--top';
        }
        if (!$hasLeadingIcon) {
            $classes[] = 'vf-nav-menu__item--icon-offset';
        }
        if ($ancestorActive) {
            $classes[] = 'vf-nav-menu__item--ancestor-active';
        }
        if ($expanded) {
            $classes[] = 'vf-nav-menu__item--expanded';
        }

        return $classes;
    }

    /** @return list<string> */
    public static function resolveLeafClasses(
        int $level,
        bool $hasLeadingIcon,
        bool $active,
        bool $ancestorActive,
        bool $disabled,
    ): array {
        $classes = ['vf-nav-menu__item'];
        if ($level === 0) {
            $classes[] = 'vf-nav-menu__item--top';
        }
        if (!$hasLeadingIcon) {
            $classes[] = 'vf-nav-menu__item--icon-offset';
        }
        if ($active) {
            $classes[] = 'vf-nav-menu__item--active';
        }
        if ($ancestorActive) {
            $classes[] = 'vf-nav-menu__item--ancestor-active';
        }
        if ($disabled) {
            $classes[] = 'vf-nav-menu__item--disabled';
        }

        return $classes;
    }

    /** @return list<string> */
    public static function resolveIconClasses(bool $expanded): array
    {
        return $expanded ? ['vf-nav-menu__icon', 'vf-nav-menu__icon--open'] : ['vf-nav-menu__icon'];
    }

    /** @return list<string> */
    public static function resolveCollapseClasses(int $level): array
    {
        return ['vf-nav-menu__collapse', 'vf-nav-menu__collapse--level-' . $level];
    }

    /**
     * @param list<array<string, mixed>> $items
     * @param callable(array<string, mixed>): bool $predicate
     */
    private static function hasFeature(array $items, callable $predicate): bool
    {
        foreach ($items as $item) {
            if ($predicate($item) || (!empty($item['children']) && self::hasFeature($item['children'], $predicate))) {
                return true;
            }
        }

        return false;
    }
}
