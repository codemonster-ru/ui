<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * PHP mirror of packages/shared-core/src/table/state.ts.
 *
 * VfDataTable writes the same class vocabulary and is not migrated; nothing
 * here is shared with it.
 *
 * @internal
 */
final class TableState
{
    /**
     * The table's class list, in the fixed order the reference emits it.
     *
     * @return list<string>
     */
    public static function resolveClasses(bool $columnDividers, bool $compact, bool $striped, bool $stickyHeader): array
    {
        $classes = ['vf-table'];

        if ($columnDividers) {
            $classes[] = 'vf-table--column-dividers';
        }
        if ($compact) {
            $classes[] = 'vf-table--compact';
        }
        if ($striped) {
            $classes[] = 'vf-table--striped';
        }
        if ($stickyHeader) {
            $classes[] = 'vf-table--sticky-header';
        }

        return $classes;
    }

    /**
     * Which children the table renders.
     *
     * The caption by JavaScript truthiness of the prop - "" is none, "0" is
     * one - or by its slot; each row group by the presence of its slot.
     *
     * @return array{caption: bool, head: bool, body: bool, foot: bool}
     */
    public static function resolveSections(
        ?string $caption,
        bool $hasCaptionSlot,
        bool $hasHeaderSlot,
        bool $hasDefaultSlot,
        bool $hasFooterSlot,
    ): array {
        return [
            'caption' => ($caption !== null && $caption !== '') || $hasCaptionSlot,
            'head' => $hasHeaderSlot,
            'body' => $hasDefaultSlot,
            'foot' => $hasFooterSlot,
        ];
    }
}
