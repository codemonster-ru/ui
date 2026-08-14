<?php

declare(strict_types=1);

namespace Codemonster\Ui\Support;

use InvalidArgumentException;

final class DataTableData
{
    /**
     * @param array<mixed> $values
     * @return list<array{key: string, header: string, sortable: bool, align: string}>
     */
    public static function columns(array $values): array
    {
        if ($values === []) throw new InvalidArgumentException('Component prop [columns] must not be empty.');
        $columns = [];
        $seen = [];
        foreach ($values as $value) {
            $key = is_array($value) ? ($value['key'] ?? null) : null;
            $header = is_array($value) ? ($value['header'] ?? null) : null;
            if (!is_array($value)
                || !is_string($key)
                || preg_match('/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/D', $key) !== 1
                || isset($seen[$key])
                || !is_string($header)
                || trim($header) === ''
                || (isset($value['sortable']) && !is_bool($value['sortable']))
                || (isset($value['align']) && !in_array($value['align'], ['start', 'center', 'end'], true))) {
                throw new InvalidArgumentException('Component prop [columns] contains an invalid DataTable column.');
            }
            $seen[$key] = true;
            $columns[] = [
                'key' => $key,
                'header' => $header,
                'sortable' => $value['sortable'] ?? false,
                'align' => $value['align'] ?? 'start',
            ];
        }
        return $columns;
    }

    /**
     * @param array<mixed> $values
     * @param list<array{key: string, header: string, sortable: bool, align: string}> $columns
     * @return list<array{id: string, cells: array<string, string|int|float|null>, selectable: bool}>
     */
    public static function rows(array $values, array $columns): array
    {
        $columnKeys = array_fill_keys(array_column($columns, 'key'), true);
        $rows = [];
        $seen = [];
        foreach ($values as $value) {
            $id = is_array($value) ? ($value['id'] ?? null) : null;
            $rawCells = is_array($value) ? ($value['cells'] ?? null) : null;
            if (!is_array($value) || !is_string($id)
                || preg_match('/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/D', $id) !== 1
                || isset($seen[$id]) || !is_array($rawCells)
                || (array_key_exists('selectable', $value) && !is_bool($value['selectable']))) {
                throw new InvalidArgumentException('Component prop [rows] contains an invalid DataTable row.');
            }
            $cells = [];
            foreach ($rawCells as $key => $cell) {
                if (!is_string($key) || !isset($columnKeys[$key])
                    || ($cell !== null && !is_string($cell) && !is_int($cell)
                        && (!is_float($cell) || !is_finite($cell)))) {
                    throw new InvalidArgumentException('Component prop [rows] contains an invalid DataTable cell.');
                }
                $cells[$key] = $cell;
            }
            $seen[$id] = true;
            $rows[] = ['id' => $id, 'cells' => $cells, 'selectable' => $value['selectable'] ?? true];
        }
        return $rows;
    }

    /**
     * @param array<mixed> $values
     * @param list<array{id: string, cells: array<string, string|int|float|null>, selectable: bool}> $rows
     * @return list<string>
     */
    public static function selectedIds(array $values, array $rows): array
    {
        $rowIds = array_fill_keys(array_column($rows, 'id'), true);
        $selected = [];
        foreach ($values as $value) {
            if (!is_string($value) || !isset($rowIds[$value]) || in_array($value, $selected, true)) {
                throw new InvalidArgumentException('Component prop [selected-row-ids] contains an invalid row id.');
            }
            $selected[] = $value;
        }
        return $selected;
    }

    /**
     * @param array<mixed>|null $value
     * @param list<array{key: string, header: string, sortable: bool, align: string}> $columns
     * @return array{key: string, direction: 'ascending'|'descending'}|null
     */
    public static function sort(?array $value, array $columns): ?array
    {
        if ($value === null) return null;
        $sortable = [];
        foreach ($columns as $column) if ($column['sortable']) $sortable[$column['key']] = true;
        if (!is_string($value['key'] ?? null) || !isset($sortable[$value['key']])
            || !in_array($value['direction'] ?? null, ['ascending', 'descending'], true)) {
            throw new InvalidArgumentException('Component prop [sort] must identify a sortable DataTable column.');
        }
        /** @var 'ascending'|'descending' $direction */
        $direction = $value['direction'];
        return ['key' => $value['key'], 'direction' => $direction];
    }

    /**
     * @param array<mixed> $values
     * @return list<int>
     */
    public static function pageSizes(array $values, int $pageSize): array
    {
        $options = [];
        foreach ($values as $value) {
            if (!is_int($value) || $value < 1 || in_array($value, $options, true)) {
                throw new InvalidArgumentException('Component prop [page-size-options] must contain unique positive integers.');
            }
            $options[] = $value;
        }
        if ($options !== [] && !in_array($pageSize, $options, true)) {
            throw new InvalidArgumentException('Component prop [page-size-options] must contain [page-size].');
        }
        return $options;
    }

}
