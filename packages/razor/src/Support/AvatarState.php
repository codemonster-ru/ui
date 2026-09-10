<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/avatar/state.ts.
 *
 * resolveBranch is the reason this file exists. VfAvatar has four mutually
 * exclusive content channels and the reference picks between them with a
 * v-if/v-else-if chain, so the order is public contract rather than an
 * implementation detail either adapter may re-derive.
 *
 * @internal
 */
final class AvatarState
{
    /**
     * The avatar root class list, in the order the reference emits it.
     *
     * Two modifiers, suppressed by two different rules: the size compares
     * against `md`, the shape against `circle`. Folding them into one
     * "suppress the default" loop would be wrong, because `square` is not the
     * value the shape modifier is named after.
     *
     * @return list<string>
     */
    public static function resolveClasses(string $size, string $shape): array
    {
        $classes = ['vf-avatar'];

        if ($size !== 'md') {
            $classes[] = 'vf-avatar--' . $size;
        }
        if ($shape === 'circle') {
            $classes[] = 'vf-avatar--circle';
        }

        return $classes;
    }

    /**
     * Which content channel wins: image, label, icon, or the default slot.
     *
     * Each test is plain truthiness, because that is what `v-if="props.image"`
     * compiles to. An empty string therefore does not select its branch: an
     * empty image falls through to the label exactly as an absent one does.
     *
     * The slot is the branch with no condition - whatever is left over - so an
     * avatar with no props and no slot content is a valid empty avatar.
     *
     * @return 'image'|'label'|'icon'|'slot'
     */
    public static function resolveBranch(?string $image, ?string $label, ?string $icon): string
    {
        if ($image !== null && $image !== '') {
            return 'image';
        }
        if ($label !== null && $label !== '') {
            return 'label';
        }
        if ($icon !== null && $icon !== '') {
            return 'icon';
        }

        return 'slot';
    }
}
