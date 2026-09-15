<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of the server half of packages/shared-core/src/tabs/state.ts.
 *
 * Pure rules over items and a value: the fallback, the active value, the
 * active index, the selection projection that both `aria-selected` and the
 * roving `tabindex` are, and the ids with their overrides. And, as in the
 * TypeScript, a deliberate absence - no next tab, no wrap, no focus, no
 * listener - plus a second one this component adds: none of the browser
 * measurements. The navigation ring, the indicator geometry and the scroller
 * state take numbers a server never holds (a rect, a scrollWidth, a key), so
 * the TypeScript rules for them have no method here and the vector file's
 * `$serverRules` names exactly the sections this class runs.
 *
 * The state a Razor tabs is in lives in its server-rendered `aria-selected`
 * and `tabindex` attributes and is read from there by the browser controller;
 * this class decides only what the server has to decide before any script
 * runs. TabsStateVectorsTest runs the same vector file the TypeScript suite
 * runs, so the two implementations cannot drift.
 *
 * Reproduced, not corrected: selected is value equality alone, so a disabled
 * seed stays selected, an unknown value selects nothing and a duplicated
 * value selects twice; ids embed the raw value, spaces and all.
 *
 * @internal
 */
final class TabsState
{
    /**
     * The value of the first enabled item, or null when there is none.
     *
     * @param list<array{value: string, disabled?: bool}> $items
     */
    public static function resolveFallbackValue(array $items): ?string
    {
        foreach ($items as $item) {
            if (!($item['disabled'] ?? false)) {
                return $item['value'];
            }
        }

        return null;
    }

    /**
     * The active value: the controlled prop, else the seed, else the fallback.
     *
     * The TypeScript rule takes `undefined` and `null` as absences and keeps an
     * empty string; PHP has one null, and the component maps an attribute that
     * was not given to it. An empty string given as the value is kept and
     * matches nothing, exactly as in the reference.
     *
     * @param list<array{value: string, disabled?: bool}> $items
     */
    public static function resolveActiveValue(?string $modelValue, ?string $internalValue, array $items): ?string
    {
        return $modelValue ?? $internalValue ?? self::resolveFallbackValue($items);
    }

    /**
     * The index of the first item carrying the active value, or -1.
     *
     * @param list<array{value: string, disabled?: bool}> $items
     */
    public static function resolveActiveIndex(array $items, ?string $activeValue): int
    {
        foreach ($items as $index => $item) {
            if ($activeValue !== null && $item['value'] === $activeValue) {
                return $index;
            }
        }

        return -1;
    }

    /**
     * Whether a tab is selected: its value equals the active value. Disabled
     * is not consulted, and every occurrence of a duplicated value matches.
     *
     * @param array{value: string, disabled?: bool} $item
     */
    public static function isItemSelected(?string $activeValue, array $item): bool
    {
        return $activeValue !== null && $activeValue === $item['value'];
    }

    /**
     * The roving tabindex: 0 on every selected tab, -1 elsewhere.
     *
     * @param array{value: string, disabled?: bool} $item
     */
    public static function resolveTabIndex(?string $activeValue, array $item): int
    {
        return self::isItemSelected($activeValue, $item) ? 0 : -1;
    }

    /**
     * The tab's id: its own `tabId`, else `{baseId}-tab-{value}` with the raw value.
     *
     * @param array{value: string, tabId?: string, panelId?: string} $item
     */
    public static function resolveTabId(string $baseId, array $item): string
    {
        return $item['tabId'] ?? $baseId . '-tab-' . $item['value'];
    }

    /**
     * The panel's id: the item's own `panelId`, else `{baseId}-panel-{value}`.
     *
     * @param array{value: string, tabId?: string, panelId?: string} $item
     */
    public static function resolvePanelId(string $baseId, array $item): string
    {
        return $item['panelId'] ?? $baseId . '-panel-' . $item['value'];
    }

    /**
     * What a tab writes into aria-controls: the panel id whenever a panel slot
     * exists, and for an item with its own `panelId` even when none does;
     * otherwise nothing.
     *
     * @param array{value: string, tabId?: string, panelId?: string} $item
     */
    public static function resolveControlledPanelId(string $baseId, array $item, bool $hasPanelSlot): ?string
    {
        if (!$hasPanelSlot && !isset($item['panelId'])) {
            return null;
        }

        return self::resolvePanelId($baseId, $item);
    }
}
