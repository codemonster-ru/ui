<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/link/state.ts.
 *
 * Two rules, and deliberately nothing else. The Vue component has a second
 * branch - a handoff to whatever a Vue application registers as `RouterLink` -
 * and that branch has no mirror here, because it is not a rule about links: it
 * is Vue resolving a component by name and passing a destination through
 * untouched. A `resolveElement`, a `resolveHref` taking a route object, or
 * anything named after navigation would be this adapter inventing a contract
 * the reference never had.
 *
 * @internal
 */
final class LinkState
{
    /**
     * The link root class list, in the order the reference emits it: the
     * block, the underline modifier, the tone modifier. `none` and `default`
     * emit no modifier at all.
     *
     * @return list<string>
     */
    public static function resolveClasses(string $underline, string $tone): array
    {
        $classes = ['vf-link'];

        if ($underline === 'hover') {
            $classes[] = 'vf-link--underline-hover';
        }
        if ($underline === 'always') {
            $classes[] = 'vf-link--underline-always';
        }
        if ($tone === 'muted') {
            $classes[] = 'vf-link--muted';
        }

        return $classes;
    }

    /**
     * The `rel` a link writes.
     *
     * An explicit `rel` wins as given and is not merged with the default. With
     * no explicit `rel`, `target="_blank"` derives `noopener noreferrer`; every
     * other target, and no target, derives nothing. The explicit value is
     * tested for truthiness as the reference tests it, so an empty string is
     * "not given" and the derivation still applies.
     *
     * Returns null when no attribute is written, because the reference writes
     * no `rel` attribute at all rather than an empty one.
     */
    public static function resolveRel(?string $rel, ?string $target): ?string
    {
        if ($rel !== null && $rel !== '') {
            return $rel;
        }

        return $target === '_blank' ? 'noopener noreferrer' : null;
    }
}
