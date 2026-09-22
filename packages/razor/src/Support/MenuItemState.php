<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/menu/state.ts.
 *
 * Three rules, and the absences matter as much as the rules. There is no
 * `resolveRel` here and this adapter does not call LinkState::resolveRel
 * either: VfMenuItem writes `rel` exactly as it was given and derives nothing
 * for `target="_blank"`. VfLink derives `noopener noreferrer` and
 * VfBreadcrumbs reuses VfLink's rule; borrowing it here would write an
 * attribute the reference never writes, on a component whose whole link
 * surface is three pass-through props.
 *
 * There is no `select` rule either. That is a Vue emit with no server
 * analogue, and the disabled guard around it is framework event handling
 * rather than a decision two platforms can share.
 *
 * VfMenu has no state class at all, because it makes no decision.
 *
 * @internal
 */
final class MenuItemState
{
    /** The glyph an unresolvable icon name falls back to. See resolveIconName. */
    public const FALLBACK_ICON = 'moon';

    /**
     * The item's class list, in the order the reference emits it: the block,
     * the active modifier, the danger modifier.
     *
     * `default` emits no tone modifier rather than a `--default` class, and
     * there is no disabled modifier on either branch - the disabled look is
     * selected in CSS by `:is(:disabled, [aria-disabled='true'])`, one rule
     * covering a disabled button and a disabled anchor at once.
     *
     * The consumer's own class is not this rule's business, and it goes
     * *before* these: the Vue component binds attrs first, so the consumer's
     * class is the earlier source. VfMenu and VfLink are the other way round.
     *
     * @return list<string>
     */
    public static function resolveClasses(bool $active, ?string $tone): array
    {
        $classes = ['vf-menu__item'];

        if ($active) {
            $classes[] = 'vf-menu__item--active';
        }

        if ($tone === 'danger') {
            $classes[] = 'vf-menu__item--danger';
        }

        return $classes;
    }

    /**
     * Whether an item renders as an anchor rather than a button.
     *
     * The reference tests `v-if="props.href"` - truthiness, not definedness -
     * so `href=""` is no destination and renders the button branch. VfLink
     * keeps `href=""` on its anchor; this component does not, and the two are
     * not made to agree. The reference's language reads `'0'` as truthy, so
     * the test is spelled out rather than cast, and the mirror agrees with it.
     *
     * `disabled` is deliberately not a parameter: a disabled item with a
     * destination is still an anchor. Only its href is dropped.
     */
    public static function isLink(?string $href): bool
    {
        return $href !== null && $href !== '';
    }

    /**
     * The glyph an icon name resolves to, including the fallback for a name
     * no glyph has.
     *
     * `icon` is typed `IconName | string` on the public component, so an
     * arbitrary string is part of the contract, and the Vue icon component
     * answers one with the `moon` glyph rather than throwing or rendering
     * nothing. IconRenderer throws instead, which is the right behaviour for a
     * component that names its own glyph and the wrong one for a component
     * whose glyph is a consumer's string - so the resolution happens here,
     * before the renderer, and only for this component. IconRenderer's own
     * behaviour is unchanged, because nothing else needs it changed.
     *
     * The normalisation is the Vue icon component's: a name containing a dash
     * is lowercased and camelised before the lookup, so `chevron-right`,
     * `chevronRight` and `Chevron-Right` are one glyph. The registry is keyed
     * in kebab case, which is also what the icons package's `icons` map
     * produces, so the camelised name is converted back before the lookup.
     */
    public static function resolveIconName(?string $icon): string
    {
        if ($icon === null || $icon === '') {
            return self::FALLBACK_ICON;
        }

        $name = self::toKebabCase(self::toCamelCase($icon));

        return IconRenderer::has($name) ? $name : self::FALLBACK_ICON;
    }

    private static function toCamelCase(string $name): string
    {
        if (!str_contains($name, '-')) {
            return $name;
        }

        return (string) preg_replace_callback(
            '/-([a-z0-9])/',
            static fn (array $matches): string => strtoupper($matches[1]),
            strtolower($name),
        );
    }

    private static function toKebabCase(string $name): string
    {
        return (string) preg_replace_callback(
            '/[A-Z]/',
            static fn (array $matches): string => '-' . strtolower($matches[0]),
            $name,
        );
    }
}
