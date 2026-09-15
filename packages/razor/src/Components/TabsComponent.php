<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\IconRenderer;
use Codemonster\VueForge\Razor\Support\TabsState;

/**
 * Server-rendered VfTabs.
 *
 * The third migrated component that owns interactive controls, and the first
 * whose controls carry an explicit interactive role: one native `button` per
 * item with `role="tab"`, a roving `tabindex`, `aria-selected` and an
 * `aria-controls` reference; two more native buttons the internal horizontal
 * scroller owns; and at most one `tabpanel`. Three layers, reported
 * separately because they are separate:
 *
 *   1. The server output. The same `vf-tabs` markup the Vue adapter renders
 *      *before it mounts* - the reference's own SSR output, which is also
 *      what a Vue client renders on its first paint: the root; the scroller
 *      with both scroll buttons in their hidden, aria-hidden, tabindex -1 and
 *      disabled pre-ready state and the chevron glyphs from the neutral icon
 *      registry; the viewport with its scrollbar-width variable; the
 *      tablist; one tab per item with its id, its aria-controls, its
 *      aria-selected and tabindex projected from the value, and the native
 *      `disabled`; the baseline; the indicator at its seed
 *      (`opacity:0;transform:translateX(0);width:0`); and, with a panel slot
 *      and an active item, the one panel with its id, its aria-labelledby
 *      and tabindex 0. Nothing that only a browser can decide - readiness,
 *      overflow, geometry - is pretended.
 *   2. Without JavaScript. The initial state is truthful and nothing lies:
 *      the selected tab is announced, its panel is shown, a disabled tab is
 *      inoperable, both scroll buttons are hidden and inert, the indicator is
 *      invisible. What is missing is the switch - each tab is a
 *      `type="button"` with no form action, and pressing it does nothing -
 *      and the overflow controls, which need a measurement. This is
 *      documented rather than papered over with links or a form the
 *      reference never had.
 *   3. Enhanced. packages/razor/browser/tabs.ts finds this root by its
 *      `data-vf-razor="tabs"` marker, reads the selection from the DOM it
 *      rendered, and reproduces the reference's click and keyboard handling,
 *      its panel switching, its indicator measurement and its scroller.
 *
 * The panel slot. The reference's is one scoped slot called with the active
 * value; a Razor named slot takes no argument, so value-dependent content is
 * spelled per item: `panel0`, `panel1`, ... for one item each, and `panel`
 * for every item that has no slot of its own. Any of them makes the tabs
 * "have a panel slot", which is what turns aria-controls on. The active
 * item's content is rendered into the one product panel; every item's
 * content - the active one's included, so the controller reads one pristine
 * source - also waits in an inert `<template data-vf-razor-tabs-panel="N">`
 * at the end of the root, unpainted, unexposed and reaching nothing without
 * a script, exactly as the accordion's deferred content does. The tab slot
 * is `tab0`, `tab1`, ...: static per item, since a server cannot re-render
 * it when the selection moves.
 *
 * Reproduced rather than corrected:
 *
 *   - `model-value` beats `default-value` whenever it is given, an empty
 *     string included: an empty string is a controlled value that matches no
 *     tab. A null attribute is "nothing said" by this adapter's convention;
 *   - an unknown value is kept: no tab is selected, every tabindex is -1, no
 *     panel is rendered;
 *   - a `default-value` naming a disabled item is kept: the disabled tab is
 *     selected, tabindex 0, its panel rendered;
 *   - two items sharing a value share their generated ids, are both
 *     selected and both tabbable, and the first occurrence's panel is the one
 *     rendered;
 *   - ids embed the raw value, a space included;
 *   - aria-controls is written on every tab when a panel slot exists - only
 *     the active panel exists, so the others dangle - and on a tab with its
 *     own panelId even without one.
 *
 * There is no controlled mode. A server-rendered tabs has no parent to emit a
 * request to, so `model-value` is read as the initial value and the
 * enhancement selects on its own, dispatching `vf-tabs:change` with the value
 * so a host can observe what a Vue consumer observes through `change`. Nor is
 * there an items watch: the items are rendered once.
 */
final class TabsComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the root. */
    private const COMPONENT_PROPS = ['items', 'model-value', 'modelValue', 'default-value', 'defaultValue', 'class', 'style'];

    /** The literal size the reference passes to the scroller's icon component. */
    private const ICON_SIZE = 'var(--vf-horizontal-scroller-control-icon-size)';

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $items = $this->items($context);

        // The controlled value and the seed, each "nothing said" when null.
        // The seed is defaultValue ?? fallback, exactly what a mounted
        // component holds in its internal ref; the rule takes both.
        $modelValue = $this->stringProp($context, 'model-value') ?? $this->stringProp($context, 'modelValue');
        $defaultValue = $this->stringProp($context, 'default-value') ?? $this->stringProp($context, 'defaultValue');
        $internalValue = $defaultValue ?? TabsState::resolveFallbackValue($items);
        $activeValue = TabsState::resolveActiveValue($modelValue, $internalValue, $items);
        $activeIndex = TabsState::resolveActiveIndex($items, $activeValue);

        $hasPanelSlot = $context->hasSlot('panel');
        foreach (array_keys($items) as $index) {
            $hasPanelSlot = $hasPanelSlot || $context->hasSlot('panel' . $index);
        }

        $baseId = FieldIds::next('vf-tabs');

        $attributes = [
            'class' => Html::classes(['vf-tabs', $this->stringProp($context, 'class') ?? '']),
            'style' => $this->stringProp($context, 'style'),
        ];
        $attributes += $this->forwardedAttributes($context);
        // The ownership marker the browser controller mounts on. Adapter
        // metadata, not product: the parity extractor drops it by its prefix.
        $attributes['data-vf-razor'] = 'tabs';

        $markup = '<div' . Html::attributes($attributes) . '>';

        // The internal scroller, in its pre-ready state: both controls hidden
        // and inert until the browser measures, exactly as the reference
        // renders them before its first frame.
        $markup .= '<div class="vf-horizontal-scroller vf-tabs__list">';
        $markup .= $this->scrollControl('left');
        $markup .= '<div class="vf-horizontal-scroller__viewport vf-tabs__list-scroller" style="--vf-horizontal-scroller-scrollbar-width:none;">';
        $markup .= '<div role="tablist" aria-orientation="horizontal">';

        foreach ($items as $index => $item) {
            $selected = TabsState::isItemSelected($activeValue, $item);
            // The tab, in the reference's attribute order. Native button,
            // type=button, native disabled - never aria-disabled; the
            // explicit tab role; aria-selected written on every tab, never
            // absent; the roving tabindex projected from the value.
            $markup .= '<button' . Html::attributes([
                'id' => TabsState::resolveTabId($baseId, $item),
                'aria-controls' => TabsState::resolveControlledPanelId($baseId, $item, $hasPanelSlot),
                'aria-selected' => $selected ? 'true' : 'false',
                'disabled' => $item['disabled'] ?? false,
                'tabindex' => (string) TabsState::resolveTabIndex($activeValue, $item),
                'class' => 'vf-tabs__tab',
                'role' => 'tab',
                'type' => 'button',
            ]) . '>';
            $markup .= $context->hasSlot('tab' . $index)
                ? $context->slot('tab' . $index)->value()
                : Html::escape($item['label']);
            $markup .= '</button>';
        }

        $markup .= '</div></div>';
        $markup .= $this->scrollControl('right');
        $markup .= '<span aria-hidden="true" class="vf-tabs__baseline"></span>';
        // The indicator's seed: the reference's initial ref value, with the
        // literal translateX(0), before any measurement.
        $markup .= '<span aria-hidden="true" class="vf-tabs__indicator" style="opacity:0;transform:translateX(0);width:0;"></span>';
        $markup .= '</div>';

        if ($hasPanelSlot) {
            if ($activeIndex >= 0) {
                $activeItem = $items[$activeIndex];
                $markup .= '<div' . Html::attributes([
                    'id' => TabsState::resolvePanelId($baseId, $activeItem),
                    'aria-labelledby' => TabsState::resolveTabId($baseId, $activeItem),
                    'class' => 'vf-tabs__panel',
                    'role' => 'tabpanel',
                    'tabindex' => '0',
                ]) . '>' . $this->panelContent($context, $activeIndex) . '</div>';
            }

            // Every item's panel content waits inert for the browser
            // controller; see the class docblock.
            foreach (array_keys($items) as $index) {
                $markup .= '<template data-vf-razor-tabs-panel="' . $index . '">'
                    . $this->panelContent($context, $index)
                    . '</template>';
            }
        }

        return RenderedHtml::fromTrustedString($markup . '</div>');
    }

    /** One scroll control in its pre-ready state, with the neutral chevron glyph. */
    private function scrollControl(string $side): string
    {
        return '<button' . Html::attributes([
            'class' => 'vf-horizontal-scroller__control vf-horizontal-scroller__control--' . $side
                . ' vf-tabs__scroll-button vf-tabs__scroll-button--' . $side
                . ' vf-horizontal-scroller__control--hidden vf-tabs__scroll-button--hidden',
            'type' => 'button',
            'aria-label' => 'Scroll tabs ' . $side,
            'aria-hidden' => 'true',
            'tabindex' => '-1',
            'disabled' => true,
        ]) . '>' . IconRenderer::render('chevron-' . $side, self::ICON_SIZE, true) . '</button>';
    }

    /** The panel content for one item: its own slot, else the shared one. */
    private function panelContent(ComponentRenderContext $context, int $index): string
    {
        return $context->hasSlot('panel' . $index)
            ? $context->slot('panel' . $index)->value()
            : $context->slot('panel')->value();
    }

    /**
     * The items, validated into the shape the shared rules read.
     *
     * A list of arrays with a string `value` and `label`, an optional boolean
     * `disabled` and optional string `tabId` and `panelId`. Anything else is
     * refused: the reference types the prop, and a server that guessed at a
     * malformed item would render a tab the Vue adapter would not.
     *
     * @return list<array{value: string, label: string, disabled?: bool, tabId?: string, panelId?: string}>
     */
    private function items(ComponentRenderContext $context): array
    {
        $items = $context->prop('items');

        if (!is_array($items) || !array_is_list($items)) {
            throw new \InvalidArgumentException('The [items] prop of vf-tabs must be a list of items.');
        }

        $resolved = [];
        foreach ($items as $index => $item) {
            if (!is_array($item) || !is_string($item['value'] ?? null) || !is_string($item['label'] ?? null)) {
                throw new \InvalidArgumentException(
                    sprintf('Item %d of vf-tabs must have a string [value] and a string [label].', $index),
                );
            }
            $entry = ['value' => $item['value'], 'label' => $item['label']];
            if (array_key_exists('disabled', $item) && $item['disabled'] !== null) {
                if (!is_bool($item['disabled'])) {
                    throw new \InvalidArgumentException(sprintf('Item %d of vf-tabs has a non-boolean [disabled].', $index));
                }
                $entry['disabled'] = $item['disabled'];
            }
            foreach (['tabId', 'panelId'] as $key) {
                if (array_key_exists($key, $item) && $item[$key] !== null) {
                    if (!is_string($item[$key])) {
                        throw new \InvalidArgumentException(sprintf('Item %d of vf-tabs has a non-string [%s].', $index, $key));
                    }
                    $entry[$key] = $item[$key];
                }
            }
            foreach (array_keys($item) as $key) {
                if (!in_array($key, ['value', 'label', 'disabled', 'tabId', 'panelId'], true)) {
                    throw new \InvalidArgumentException(sprintf('Item %d of vf-tabs carries an unknown key [%s].', $index, $key));
                }
            }
            $resolved[] = $entry;
        }

        return $resolved;
    }

    /**
     * Props that are not component props fall through to the root.
     *
     * This is the path a consumer id, dir, data-* or aria-label travels -
     * onto the root, never the tablist, a tab or the panel.
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
                sprintf('The [%s] attribute of vf-tabs must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-tabs must be a string.', $name));
    }
}
