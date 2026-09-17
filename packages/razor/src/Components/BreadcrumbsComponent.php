<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\BreadcrumbsState;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\IconRenderer;
use Codemonster\VueForge\Razor\Support\LinkState;

/**
 * Server-rendered VfBreadcrumbs.
 *
 * `nav.vf-breadcrumbs[aria-label]` holding `ol.vf-breadcrumbs__list` holding
 * one `li.vf-breadcrumbs__item` per item, each with either an anchor carrying
 * `href`, `target` and `rel` or a span, and an aria-hidden separator after
 * every item but the last. No browser controller, no enhancement, no hidden
 * metadata: a server-rendered list of native anchors is the whole contract,
 * and the browser does the rest natively.
 *
 * What this component deliberately does not have is the Vue component's
 * other branch. In Vue, an item's `to` selects a handoff to whatever the
 * application registers as `RouterLink`, and the root `component` prop
 * replaces that target; the resolved component then computes an href,
 * matches a route and intercepts the click. None of that is VfBreadcrumbs'
 * own behaviour and none of it exists on a server that renders a page once.
 * So an item `to` and the root `component` are refused by name rather than
 * accepted-and-ignored or turned into an href: a template that wrote either
 * was written for the Vue adapter, and a silent translation would be this
 * adapter inventing a navigation contract the reference never had. A host
 * that wants a routed href computes it and passes `href`.
 *
 * Four historical decisions are reproduced rather than corrected:
 *
 *   - the current item is a span, always: its href is dropped. `current` on
 *     any item makes the explicit flags the rule, with none the last item is
 *     current, and two flags make two current spans with two aria-current
 *     attributes - the reference never enforces one;
 *   - the link test is truthiness: `href: ''` is no destination and the item
 *     is a span, without aria-current unless it is current. This is where the
 *     component differs from VfLink, which keeps `href=""` on its anchor;
 *   - a disabled item is a span with a modifier and no aria-disabled;
 *   - the separator is an owned aria-hidden span after every item but the
 *     last, and a `separator` slot replaces its content only. The Vue slot is
 *     scoped with the item and its index; a Razor slot takes no argument, so
 *     the same content repeats after every item that has a separator.
 */
final class BreadcrumbsComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the nav. */
    private const COMPONENT_PROPS = ['items', 'aria-label', 'ariaLabel', 'class', 'style'];

    /** The Vue adapter's router-branch root prop, refused here by name. See the class docblock. */
    private const VUE_ONLY_PROPS = ['component'];

    /** The Vue adapter's router-branch item key, refused here by name. */
    private const VUE_ONLY_ITEM_KEYS = ['to'];

    private const ITEM_KEYS = ['label', 'href', 'target', 'rel', 'disabled', 'current'];

    private const ICON_SIZE = 'var(--vf-icon-size-sm)';

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        foreach (self::VUE_ONLY_PROPS as $name) {
            if ($context->prop($name) !== null) {
                throw new \InvalidArgumentException(sprintf(
                    'vf-breadcrumbs does not accept [%s]: the router branch belongs to the Vue adapter. Pass [href] on each item.',
                    $name,
                ));
            }
        }

        $items = $this->items($context);
        $currentFlags = BreadcrumbsState::resolveCurrentFlags(array_map(
            static fn (array $item): ?bool => $item['current'] ?? null,
            $items,
        ));
        $last = count($items) - 1;
        $separator = $context->hasSlot('separator')
            ? $context->slot('separator')->value()
            : IconRenderer::render('chevron-right', self::ICON_SIZE);

        $list = '';
        foreach ($items as $index => $item) {
            $current = $currentFlags[$index];
            $disabled = $item['disabled'] ?? null;

            if (BreadcrumbsState::isLink($disabled, $current, $item['href'] ?? null)) {
                // href, then target, then rel, then the class, in the order
                // the Vue template binds them; the extractor sorts attributes,
                // so the order is a courtesy to a reader rather than a contract.
                $node = '<a' . Html::attributes([
                    'href' => $item['href'],
                    'target' => $item['target'] ?? null,
                    'rel' => LinkState::resolveRel($item['rel'] ?? null, $item['target'] ?? null),
                    'class' => 'vf-breadcrumbs__link',
                ]) . '>' . Html::escape($item['label']) . '</a>';
            } else {
                $node = '<span' . Html::attributes([
                    'class' => Html::classes(BreadcrumbsState::resolveItemClasses($disabled)),
                    'aria-current' => $current ? 'page' : null,
                ]) . '>' . Html::escape($item['label']) . '</span>';
            }

            if ($index < $last) {
                $node .= '<span class="vf-breadcrumbs__separator" aria-hidden="true">' . $separator . '</span>';
            }

            $list .= '<li class="vf-breadcrumbs__item">' . $node . '</li>';
        }

        $attributes = $this->forwardedAttributes($context);
        $attributes['class'] = Html::classes(['vf-breadcrumbs', $this->stringProp($context, 'class') ?? '']);
        // The prop is written even when empty: the reference writes an empty
        // aria-label attribute for ariaLabel="" rather than restoring the default.
        $attributes['aria-label'] = $this->ariaLabel($context);
        $attributes['style'] = $this->stringProp($context, 'style');

        return RenderedHtml::fromTrustedString(
            '<nav' . Html::attributes($attributes) . '><ol class="vf-breadcrumbs__list">' . $list . '</ol></nav>',
        );
    }

    /**
     * The accessible name of the nav: the `aria-label` prop under either
     * spelling, defaulting to the reference's 'Breadcrumb'.
     */
    private function ariaLabel(ComponentRenderContext $context): string
    {
        foreach (['aria-label', 'ariaLabel'] as $name) {
            $value = $context->prop($name);
            if ($value === null) {
                continue;
            }
            if (!is_string($value)) {
                throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-breadcrumbs must be a string.', $name));
            }

            return $value;
        }

        return 'Breadcrumb';
    }

    /**
     * The items, validated into the shape the shared rules read.
     *
     * A list of arrays with a string `label`, optional string `href`, `target`
     * and `rel`, and optional boolean `disabled` and `current`. An item `to`
     * is refused by name - see the class docblock - and anything else is
     * refused too: the reference types the item, and a server that guessed at
     * a malformed one would render a trail the Vue adapter would not.
     *
     * @return list<array{label: string, href?: string, target?: string, rel?: string, disabled?: bool, current?: bool}>
     */
    private function items(ComponentRenderContext $context): array
    {
        $items = $context->prop('items');

        if (!is_array($items) || !array_is_list($items)) {
            throw new \InvalidArgumentException('The [items] prop of vf-breadcrumbs must be a list of items.');
        }

        $resolved = [];
        foreach ($items as $index => $item) {
            if (!is_array($item) || !is_string($item['label'] ?? null)) {
                throw new \InvalidArgumentException(
                    sprintf('Item %d of vf-breadcrumbs must have a string [label].', $index),
                );
            }
            foreach (self::VUE_ONLY_ITEM_KEYS as $key) {
                if (array_key_exists($key, $item)) {
                    throw new \InvalidArgumentException(sprintf(
                        'Item %d of vf-breadcrumbs does not accept [%s]: the router branch belongs to the Vue adapter. Pass [href].',
                        $index,
                        $key,
                    ));
                }
            }
            $entry = ['label' => $item['label']];
            foreach (['href', 'target', 'rel'] as $key) {
                if (array_key_exists($key, $item) && $item[$key] !== null) {
                    if (!is_string($item[$key])) {
                        throw new \InvalidArgumentException(sprintf('Item %d of vf-breadcrumbs has a non-string [%s].', $index, $key));
                    }
                    $entry[$key] = $item[$key];
                }
            }
            foreach (['disabled', 'current'] as $key) {
                if (array_key_exists($key, $item) && $item[$key] !== null) {
                    if (!is_bool($item[$key])) {
                        throw new \InvalidArgumentException(sprintf('Item %d of vf-breadcrumbs has a non-boolean [%s].', $index, $key));
                    }
                    $entry[$key] = $item[$key];
                }
            }
            foreach (array_keys($item) as $key) {
                if (!in_array($key, self::ITEM_KEYS, true)) {
                    throw new \InvalidArgumentException(sprintf('Item %d of vf-breadcrumbs carries an unknown key [%s].', $index, $key));
                }
            }
            $resolved[] = $entry;
        }

        return $resolved;
    }

    /**
     * Props that are not component props fall through to the nav.
     *
     * This is the path a consumer id, title, tabindex, role, every other
     * aria-* and every data-* travel - onto the nav, never the list, an item,
     * a link or a span.
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
                sprintf('The [%s] attribute of vf-breadcrumbs must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-breadcrumbs must be a string.', $name));
    }
}
