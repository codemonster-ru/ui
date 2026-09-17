<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/breadcrumbs/state.ts.
 *
 * Three rules about items, and deliberately nothing about links: what a
 * breadcrumb link is made of is VfLink's rule, and this adapter derives the
 * rel of a breadcrumb link through LinkState::resolveRel exactly as the Vue
 * component calls resolveLinkRel. The Vue component's other branch - a
 * handoff to whatever the application registers as `RouterLink` when an item
 * has `to` - has no mirror here, because it is not a rule about breadcrumbs:
 * it is Vue resolving a component by name and passing a destination through
 * untouched. A `resolveElement`, a `resolveHref` taking a route, or anything
 * named after navigation would be this adapter inventing a contract the
 * reference never had.
 *
 * @internal
 */
final class BreadcrumbsState
{
    /**
     * Which items are current, in order.
     *
     * `$flags` is each item's explicit `current`, present or not. If any is
     * true, exactly those items are current - however many there are. If none
     * is, the last item is current and no other. An empty list has no current
     * item.
     *
     * @param list<bool|null> $flags
     * @return list<bool>
     */
    public static function resolveCurrentFlags(array $flags): array
    {
        $hasExplicitCurrent = in_array(true, $flags, true);
        $last = count($flags) - 1;
        $resolved = [];

        foreach ($flags as $index => $flag) {
            $resolved[] = $flag === true || (!$hasExplicitCurrent && $index === $last);
        }

        return $resolved;
    }

    /**
     * Whether an item renders as a link.
     *
     * Not when it is disabled, not when it is current, and only when it has a
     * destination - tested as the reference tests truthiness: an empty string
     * is no destination. The reference's language reads `'0'` as truthy, so
     * the test is spelled out rather than cast, and the mirror agrees with it.
     */
    public static function isLink(?bool $disabled, bool $current, ?string $destination): bool
    {
        return $disabled !== true && !$current && $destination !== null && $destination !== '';
    }

    /**
     * The class list of an item that is not a link, in the order the reference
     * emits it: the block element, then the disabled modifier.
     *
     * @return list<string>
     */
    public static function resolveItemClasses(?bool $disabled): array
    {
        $classes = ['vf-breadcrumbs__current'];

        if ($disabled === true) {
            $classes[] = 'vf-breadcrumbs__current--disabled';
        }

        return $classes;
    }
}
