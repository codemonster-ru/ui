<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\IconRenderer;
use Codemonster\VueForge\Razor\Support\LinkState;
use Codemonster\VueForge\Razor\Support\MenuItemState;
use Codemonster\VueForge\Razor\Support\NavMenuState;

/**
 * Server-rendered VfNavMenu.
 *
 * A recursive navigation tree whose controls are native: one button per
 * branch, one button or one anchor per leaf. Three layers, reported
 * separately because they are separate:
 *
 *   1. The server output. The markup the reference renders before it mounts:
 *      `nav[aria-label]`, the aria-hidden breakpoint probe, the top-level
 *      list, and one `li` per item with its depth, its state classes and
 *      `--vf-nav-menu-level` inline. A group is a div over an always-rendered
 *      nested list; a branch is a button with `aria-expanded` and a chevron,
 *      and its children are rendered in a collapse wrapper only while it is
 *      expanded; a leaf is an anchor with href, target and rel when it has an
 *      `href`, otherwise a button. The initial value - `model-value`, else
 *      `default-value` - marks its leaf `aria-current="page"`, marks every
 *      ancestor, and expands every ancestor, group values included. A sidebar
 *      is compact only when `compact` says so: the measurement the reference
 *      compacts by happens after mount, never on the server.
 *   2. Without JavaScript. The initial tree is truthful: the active ancestry
 *      is open, every link navigates, a disabled link keeps its href and is
 *      out of the tab order. What is missing is everything a click on a
 *      button does - a branch neither opens nor closes and a button leaf
 *      selects nothing - and the responsive compactness, which needs a
 *      measurement. Nothing pretends otherwise.
 *   3. Enhanced. packages/razor/browser/nav-menu.ts mounts on the
 *      `data-vf-razor="nav-menu"` marker and reproduces the reference's
 *      toggle, its single mode, its selection and its events, its collapse
 *      transition - Vue's own, hook for hook, finishing on transitionend - and
 *      its ResizeObserver.
 *
 * Every branch keeps its children's pristine markup in an inert
 * `<template data-vf-razor-nav-menu="collapse">` - the whole collapse wrapper,
 * with every branch inside it rendered closed and carrying its own template -
 * so the controller renders a subtree that was never on the page, or renders
 * one afresh after it left, exactly as `v-if` renders the reference's. Every
 * `li` carries the index path of its item, and the root carries the item
 * tree's structure - values, kinds, leading icons, disabled flags, children -
 * as adapter metadata, so the controller derives each state from the same
 * shared rules this class does. The parity extractor drops both by their
 * prefix, and the templates by their marker.
 *
 * The router branch does not exist here. In Vue an item's `to` is handed to
 * whatever the application registers as `RouterLink`; that is not
 * VfNavMenu's behaviour, and a server that renders a page once has no router
 * to hand it to. An item `to` is refused by name - never accepted and
 * ignored, never turned into an href: a host that wants a routed href
 * computes it and passes `href`.
 *
 * There is no controlled mode. A server-rendered menu has no parent to emit a
 * request to, so `model-value` is read as the initial value exactly as
 * `default-value` is, and the enhancement moves the value itself and
 * dispatches `vf-nav-menu:change`. That is the `razor-has-no-controlled-mode`
 * classification of the parity policy, not an approval. Nor is there an
 * items watch or a variant watch: both are rendered once.
 */
final class NavMenuComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the nav. */
    private const COMPONENT_PROPS = [
        'items',
        'model-value',
        'modelValue',
        'default-value',
        'defaultValue',
        'aria-label',
        'ariaLabel',
        'expand-mode',
        'expandMode',
        'variant',
        'compact',
        'class',
        'style',
    ];

    /** The Vue adapter's router-branch item key, refused here by name. */
    private const VUE_ONLY_ITEM_KEYS = ['to'];

    private const ITEM_KEYS = ['value', 'label', 'kind', 'leadingIcon', 'href', 'target', 'rel', 'disabled', 'children'];

    private const VARIANTS = ['default', 'pills', 'sidebar'];

    private const EXPAND_MODES = ['multiple', 'single'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $items = $this->items($context->prop('items'), 'items');
        $modelValue = $this->stringProp($context, 'model-value') ?? $this->stringProp($context, 'modelValue');
        $defaultValue = $this->stringProp($context, 'default-value') ?? $this->stringProp($context, 'defaultValue');
        // modelValue ?? internal, where the internal value is the default.
        $activeValue = $modelValue ?? $defaultValue;
        $variant = $this->enumProp($context, ['variant'], self::VARIANTS, 'default');
        $expandMode = $this->enumProp($context, ['expand-mode', 'expandMode'], self::EXPAND_MODES, 'multiple');
        $compact = $this->compactProp($context);

        $state = [
            'active' => $activeValue,
            'expanded' => NavMenuState::resolveSyncedExpandedValues($items, [], $activeValue),
        ];

        $attributes = $this->forwardedAttributes($context);
        $attributes['class'] = Html::classes([
            ...NavMenuState::resolveRootClasses(
                $variant,
                NavMenuState::resolveIsSimple($items),
                NavMenuState::resolveCompact($variant, $compact, false),
            ),
            $this->stringProp($context, 'class') ?? '',
        ]);
        // The prop is written even when empty, as the reference writes it.
        $attributes['aria-label'] = $this->ariaLabel($context);
        $attributes['style'] = $this->stringProp($context, 'style');
        // Adapter metadata, dropped by the parity extractor by its prefix.
        $attributes['data-vf-razor'] = 'nav-menu';
        $attributes['data-vf-razor-nav-menu-value'] = $activeValue;
        $attributes['data-vf-razor-nav-menu-expand-mode'] = $expandMode;
        $attributes['data-vf-razor-nav-menu-variant'] = $variant;
        $attributes['data-vf-razor-nav-menu-compact'] = $compact === null ? null : ($compact ? 'true' : 'false');
        $attributes['data-vf-razor-nav-menu-tree'] = json_encode(
            $this->structure($items),
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
        );

        $list = '';
        foreach ($items as $index => $item) {
            $list .= $this->node($item, 0, [$index], $state, true);
        }

        return RenderedHtml::fromTrustedString(
            '<nav' . Html::attributes($attributes) . '>'
            . '<span class="vf-nav-menu__compact-breakpoint-probe" aria-hidden="true"></span>'
            . '<ul class="vf-nav-menu__list">' . $list . '</ul></nav>',
        );
    }

    /**
     * One `li`.
     *
     * `$live` is false inside a template: there every branch renders closed,
     * whatever the state says, because the controller decides what is open
     * when it renders the template.
     *
     * @param array<string, mixed> $item
     * @param list<int> $path
     * @param array{active: ?string, expanded: list<string>} $state
     */
    private function node(array $item, int $level, array $path, array $state, bool $live): string
    {
        $value = $item['value'];
        $active = $state['active'] === $value;
        $ancestorActive = !$active && NavMenuState::resolveHasDescendant($item, $state['active']);
        $expanded = in_array($value, $state['expanded'], true);
        $isGroup = ($item['kind'] ?? null) === 'group';
        $hasChildren = !empty($item['children']);
        $hasLeadingIcon = ($item['leadingIcon'] ?? '') !== '';
        $disabled = ($item['disabled'] ?? false) === true;
        $levelStyle = '--vf-nav-menu-level: ' . $level;

        $markup = '<li' . Html::attributes([
            'class' => Html::classes(NavMenuState::resolveNodeClasses($level, $expanded, $active, $ancestorActive)),
            'data-vf-razor-nav-menu-path' => implode('.', $path),
        ]) . '>';

        if ($isGroup) {
            $markup .= '<div' . Html::attributes([
                'class' => Html::classes(NavMenuState::resolveGroupClasses($level)),
                'style' => $levelStyle,
            ]) . '><span class="vf-nav-menu__item-content"><span class="vf-nav-menu__group-label">'
                . Html::escape($item['label']) . '</span></span></div>';

            if ($hasChildren) {
                $markup .= '<ul class="vf-nav-menu__list vf-nav-menu__list--nested">'
                    . $this->children($item, $level, $path, $state, $live) . '</ul>';
            }

            return $markup . '</li>';
        }

        if ($hasChildren) {
            // The branch, in the reference's attribute order: class, style,
            // aria-expanded, the native disabled - never aria-disabled - and
            // type. `$live` decides the collapse, not the announced state: a
            // template's branch announces what the state says, and the
            // controller repaints it when it renders the template.
            $markup .= '<button' . Html::attributes([
                'class' => Html::classes(
                    NavMenuState::resolveBranchClasses($level, $hasLeadingIcon, $ancestorActive, $expanded),
                ),
                'style' => $levelStyle,
                'aria-expanded' => $expanded ? 'true' : 'false',
                'disabled' => $disabled,
                'type' => 'button',
            ]) . '>' . $this->content($item) . '<span' . Html::attributes([
                'class' => Html::classes(NavMenuState::resolveIconClasses($expanded)),
                'aria-hidden' => 'true',
            ]) . '>' . IconRenderer::render('chevron-down', 'var(--vf-icon-size-sm)') . '</span></button>';

            if ($live && $expanded) {
                $markup .= $this->collapse($item, $level, $path, $state, true);
            }
            $markup .= '<template data-vf-razor-nav-menu="collapse">'
                . $this->collapse($item, $level, $path, $state, false) . '</template>';

            return $markup . '</li>';
        }

        $leafClasses = Html::classes(
            NavMenuState::resolveLeafClasses($level, $hasLeadingIcon, $active, $ancestorActive, $disabled),
        );

        if (NavMenuState::resolveIsLink($item)) {
            $external = NavMenuState::resolveShowsExternalIcon($item)
                ? '<span class="vf-nav-menu__icon vf-nav-menu__icon--external" aria-hidden="true">'
                    . IconRenderer::render('external-link', 'var(--vf-icon-size-sm)') . '</span>'
                : '';
            $markup .= '<a' . Html::attributes([
                'href' => $item['href'],
                'target' => $item['target'] ?? null,
                'rel' => LinkState::resolveRel($item['rel'] ?? null, $item['target'] ?? null),
                'class' => $leafClasses,
                'style' => $levelStyle,
                'aria-current' => $active ? 'page' : null,
                'aria-disabled' => $disabled ? 'true' : null,
                'tabindex' => $disabled ? '-1' : null,
            ]) . '>' . $this->content($item) . $external . '</a>';

            return $markup . '</li>';
        }

        $markup .= '<button' . Html::attributes([
            'class' => $leafClasses,
            'style' => $levelStyle,
            'aria-current' => $active ? 'page' : null,
            'disabled' => $disabled,
            'type' => 'button',
        ]) . '>' . $this->content($item) . '</button>';

        return $markup . '</li>';
    }

    /**
     * @param array<string, mixed> $item
     * @param list<int> $path
     * @param array{active: ?string, expanded: list<string>} $state
     */
    private function collapse(array $item, int $level, array $path, array $state, bool $live): string
    {
        return '<div class="' . Html::classes(NavMenuState::resolveCollapseClasses($level)) . '">'
            . '<ul class="vf-nav-menu__list vf-nav-menu__list--nested">'
            . $this->children($item, $level, $path, $state, $live) . '</ul></div>';
    }

    /**
     * @param array<string, mixed> $item
     * @param list<int> $path
     * @param array{active: ?string, expanded: list<string>} $state
     */
    private function children(array $item, int $level, array $path, array $state, bool $live): string
    {
        $markup = '';
        foreach ($item['children'] as $index => $child) {
            $markup .= $this->node($child, $level + 1, [...$path, $index], $state, $live);
        }

        return $markup;
    }

    /**
     * The item content: an optional leading glyph, then the label.
     *
     * The glyph is whatever the Vue icon component resolves the consumer's
     * name to - the same normalisation and the same fallback VfMenuItem's
     * icon already reproduces - at the medium icon size.
     *
     * @param array<string, mixed> $item
     */
    private function content(array $item): string
    {
        $icon = ($item['leadingIcon'] ?? '') !== ''
            ? '<span class="vf-nav-menu__leading-icon" aria-hidden="true">'
                . IconRenderer::render(MenuItemState::resolveIconName($item['leadingIcon']), 'var(--vf-icon-size-md)')
                . '</span>'
            : '';

        return '<span class="vf-nav-menu__item-content">' . $icon
            . '<span class="vf-nav-menu__label">' . Html::escape($item['label']) . '</span></span>';
    }

    /**
     * The tree's structure for the controller: what the shared rules read and
     * nothing they do not - no label, no destination.
     *
     * @param list<array<string, mixed>> $items
     * @return list<array<string, mixed>>
     */
    private function structure(array $items): array
    {
        return array_map(function (array $item): array {
            $entry = ['value' => $item['value']];
            foreach (['kind', 'leadingIcon', 'disabled'] as $key) {
                if (array_key_exists($key, $item)) {
                    $entry[$key] = $item[$key];
                }
            }
            if (array_key_exists('children', $item)) {
                $entry['children'] = $this->structure($item['children']);
            }

            return $entry;
        }, $items);
    }

    /**
     * The items, validated into the shape the shared rules read.
     *
     * A list of arrays with a string `value` and `label`; optional `kind`
     * (`item` or `group`), string `leadingIcon`, `href`, `target` and `rel`,
     * boolean `disabled` and a `children` list of the same. An item `to` is
     * refused by name - see the class docblock - and anything else is refused
     * too: the reference types the item.
     *
     * @return list<array<string, mixed>>
     */
    private function items(mixed $items, string $where): array
    {
        if (!is_array($items) || !array_is_list($items)) {
            throw new \InvalidArgumentException(sprintf('The [%s] of vf-nav-menu must be a list of items.', $where));
        }

        $resolved = [];
        foreach ($items as $index => $item) {
            $at = sprintf('%s.%d', $where, $index);
            if (!is_array($item) || !is_string($item['value'] ?? null) || !is_string($item['label'] ?? null)) {
                throw new \InvalidArgumentException(sprintf('Item [%s] of vf-nav-menu must have a string [value] and [label].', $at));
            }
            foreach (self::VUE_ONLY_ITEM_KEYS as $key) {
                if (array_key_exists($key, $item)) {
                    throw new \InvalidArgumentException(sprintf(
                        'Item [%s] of vf-nav-menu does not accept [%s]: the router branch belongs to the Vue adapter. Pass [href].',
                        $at,
                        $key,
                    ));
                }
            }
            foreach (array_keys($item) as $key) {
                if (!in_array($key, self::ITEM_KEYS, true)) {
                    throw new \InvalidArgumentException(sprintf('Item [%s] of vf-nav-menu carries an unknown key [%s].', $at, $key));
                }
            }

            $entry = ['value' => $item['value'], 'label' => $item['label']];
            if (($item['kind'] ?? null) !== null) {
                if (!in_array($item['kind'], ['item', 'group'], true)) {
                    throw new \InvalidArgumentException(sprintf('Item [%s] of vf-nav-menu has a [kind] that is neither item nor group.', $at));
                }
                $entry['kind'] = $item['kind'];
            }
            foreach (['leadingIcon', 'href', 'target', 'rel'] as $key) {
                if (($item[$key] ?? null) !== null) {
                    if (!is_string($item[$key])) {
                        throw new \InvalidArgumentException(sprintf('Item [%s] of vf-nav-menu has a non-string [%s].', $at, $key));
                    }
                    $entry[$key] = $item[$key];
                }
            }
            if (($item['disabled'] ?? null) !== null) {
                if (!is_bool($item['disabled'])) {
                    throw new \InvalidArgumentException(sprintf('Item [%s] of vf-nav-menu has a non-boolean [disabled].', $at));
                }
                $entry['disabled'] = $item['disabled'];
            }
            if (($item['children'] ?? null) !== null) {
                $entry['children'] = $this->items($item['children'], $at . '.children');
            }

            $resolved[] = $entry;
        }

        return $resolved;
    }

    private function ariaLabel(ComponentRenderContext $context): string
    {
        foreach (['aria-label', 'ariaLabel'] as $name) {
            $value = $context->prop($name);
            if ($value === null) {
                continue;
            }
            if (!is_string($value)) {
                throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-nav-menu must be a string.', $name));
            }

            return $value;
        }

        return 'Navigation';
    }

    /**
     * @param list<string> $names
     * @param list<string> $allowed
     */
    private function enumProp(ComponentRenderContext $context, array $names, array $allowed, string $default): string
    {
        foreach ($names as $name) {
            $value = $context->prop($name);
            if ($value === null) {
                continue;
            }
            if (!is_string($value) || !in_array($value, $allowed, true)) {
                throw new \InvalidArgumentException(sprintf(
                    'The [%s] prop of vf-nav-menu must be one of [%s].',
                    $name,
                    implode(', ', $allowed),
                ));
            }

            return $value;
        }

        return $default;
    }

    /** The explicit compact, or null when nothing was said. */
    private function compactProp(ComponentRenderContext $context): ?bool
    {
        $value = $context->prop('compact');
        if ($value === null || is_bool($value)) {
            return $value;
        }

        throw new \InvalidArgumentException('The [compact] prop of vf-nav-menu must be a boolean.');
    }

    /**
     * Props that are not component props fall through to the nav: a consumer
     * id, title, role, every other aria-* and every data-*.
     *
     * @return array<string, string|bool|int|float|null>
     */
    private function forwardedAttributes(ComponentRenderContext $context): array
    {
        $forwarded = [];

        foreach ($context->props() as $name => $value) {
            if (in_array($name, self::COMPONENT_PROPS, true)) {
                continue;
            }

            if ($value === null || is_bool($value) || is_string($value) || is_int($value) || is_float($value)) {
                $forwarded[$name] = $value;
                continue;
            }

            throw new \InvalidArgumentException(
                sprintf('The [%s] attribute of vf-nav-menu must be a scalar or null.', $name),
            );
        }

        return $forwarded;
    }

    private function stringProp(ComponentRenderContext $context, string $name): ?string
    {
        $value = $context->prop($name);

        if ($value === null || $value === false) {
            return null;
        }

        if (is_string($value) || is_int($value) || is_float($value)) {
            return (string) $value;
        }

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-nav-menu must be a string.', $name));
    }
}
