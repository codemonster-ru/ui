<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\Support\AttributeBag;
use Codemonster\Ui\Support\ClassBuilder;
use Codemonster\Ui\Support\DataTableData;
use Codemonster\Ui\Support\PropBag;
use Codemonster\View\EngineInterface;
use InvalidArgumentException;

final readonly class CmDataTable implements ComponentInterface
{
    public function __construct(private EngineInterface $views) {}

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $id = $props->string('id');
        if (preg_match('/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/D', $id) !== 1) {
            throw new InvalidArgumentException('Component prop [id] must use lowercase kebab-case.');
        }
        $columns = DataTableData::columns($props->array('columns'));
        $rows = DataTableData::rows($props->array('rows'), $columns);
        $visibleColumns = DataTableData::visibleColumns($props->nullableArray('visible-column-keys'), $columns);
        $caption = $props->string('caption');
        $density = $props->oneOf('density', ['default', 'compact'], 'default');
        $striped = $props->bool('striped');
        $columnDividers = $props->bool('column-dividers');
        $stickyHeader = $props->bool('sticky-header');
        $selectable = $props->bool('selectable');
        $selected = DataTableData::selectedIds($props->array('selected-row-ids'), $rows);
        $sort = DataTableData::sort($props->nullableArray('sort'), $columns);
        $page = $props->positiveInt('page', 1);
        $pageCount = $props->positiveInt('page-count', 1);
        $pageSize = $props->positiveInt('page-size', 10);
        $pageSizeOptions = DataTableData::pageSizes($props->array('page-size-options'), $pageSize);
        $totalRows = $props->nullableNonNegativeInt('total-rows');
        if ($totalRows !== null) $pageCount = max(1, (int) ceil($totalRows / $pageSize));
        if ($page > $pageCount) throw new InvalidArgumentException('Component prop [page] must not exceed [page-count].');
        $loading = $props->bool('loading');
        $error = $props->bool('error');
        $emptyText = $props->string('empty-text', 'No data');
        $loadingText = $props->string('loading-text', 'Loading...');
        $errorText = $props->string('error-text', 'Failed to load data');
        $paginationLabel = $props->string('pagination-label', 'Table pagination');
        $rowsPerPageLabel = $props->string('rows-per-page-label', 'Rows per page');
        $pageSummaryTemplate = $props->string('page-summary-template', 'Page {page} of {pageCount}');
        $paginationSummaryTemplate = $props->string('pagination-summary-template', '{firstRow}-{lastRow} of {totalRows}');
        $emptyPaginationSummaryText = $props->string('empty-pagination-summary-text', '0 rows');
        $previousPageText = $props->string('previous-page-text', 'Previous');
        $nextPageText = $props->string('next-page-text', 'Next');
        $previousPageLabel = $props->string('previous-page-label', 'Previous page');
        $nextPageLabel = $props->string('next-page-label', 'Next page');
        $selectAllLabel = $props->string('select-all-label', 'Select all rows');
        foreach ([$emptyText, $loadingText, $errorText, $paginationLabel, $rowsPerPageLabel, $emptyPaginationSummaryText, $previousPageText, $nextPageText, $previousPageLabel, $nextPageLabel, $selectAllLabel] as $label) {
            if (trim($label) === '') throw new InvalidArgumentException('DataTable labels must be non-empty strings.');
        }
        $this->requirePlaceholders($pageSummaryTemplate, ['{page}', '{pageCount}'], 'page-summary-template');
        $this->requirePlaceholders($paginationSummaryTemplate, ['{firstRow}', '{lastRow}', '{totalRows}'], 'pagination-summary-template');
        $pageSummary = strtr($pageSummaryTemplate, ['{page}' => (string) $page, '{pageCount}' => (string) $pageCount]);
        $paginationSummary = $totalRows === null ? null : ($totalRows === 0 ? $emptyPaginationSummaryText : strtr(
            $paginationSummaryTemplate,
            ['{firstRow}' => (string) (($page - 1) * $pageSize + 1), '{lastRow}' => (string) min($page * $pageSize, $totalRows), '{totalRows}' => (string) $totalRows],
        ));
        $renderRows = array_map(static fn (array $row): array => [
            ...$row, 'selected' => in_array($row['id'], $selected, true),
        ], $rows);
        $selectableRows = array_filter($renderRows, static fn (array $row): bool => $row['selectable']);
        $selectedSelectableRows = array_filter($selectableRows, static fn (array $row): bool => $row['selected']);
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())->add('cm-data-table')
            ->addWhen($density === 'compact', 'cm-data-table--compact')->addWhen($striped, 'cm-data-table--striped')
            ->addWhen($columnDividers, 'cm-data-table--column-dividers')->addWhen($stickyHeader, 'cm-data-table--sticky-header')
            ->add($this->className($attributes))->value();
        $stateText = $loading ? $loadingText : ($error ? $errorText : ($rows === [] ? $emptyText : null));

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.data-table', [
            'id' => $id, 'columns' => $visibleColumns, 'rows' => $renderRows, 'caption' => $caption,
            'selectable' => $selectable, 'selected' => $selected, 'sort' => $sort, 'page' => $page,
            'pageCount' => $pageCount, 'paginationLabel' => $paginationLabel,
            'pageSize' => $pageSize, 'pageSizeOptions' => $pageSizeOptions, 'rowsPerPageLabel' => $rowsPerPageLabel,
            'totalRows' => $totalRows, 'pageSummaryTemplate' => $pageSummaryTemplate, 'pageSummary' => $pageSummary,
            'paginationSummaryTemplate' => $paginationSummaryTemplate, 'paginationSummary' => $paginationSummary,
            'emptyPaginationSummaryText' => $emptyPaginationSummaryText,
            'previousPageText' => $previousPageText, 'nextPageText' => $nextPageText,
            'previousPageLabel' => $previousPageLabel, 'nextPageLabel' => $nextPageLabel,
            'selectAllLabel' => $selectAllLabel, 'classes' => $classes, 'stateText' => $stateText,
            'selectableRowCount' => count($selectableRows),
            'selectedSelectableRowCount' => count($selectedSelectableRows),
            'columnCount' => count($visibleColumns) + ($selectable ? 1 : 0),
            'attributes' => $attributes->without(['class', 'id', 'data-cm-controller', 'data-cm-data-table-sort-key',
                'data-cm-data-table-sort-direction', 'data-cm-data-table-page', 'data-cm-data-table-page-count',
                'data-cm-data-table-page-size', 'data-cm-data-table-total-rows', 'data-cm-data-table-selected-count'])->render(),
        ]), "\r\n"));
    }

    /** @param non-empty-list<string> $placeholders */
    private function requirePlaceholders(string $template, array $placeholders, string $prop): void
    {
        foreach ($placeholders as $placeholder) {
            if (!str_contains($template, $placeholder)) {
                throw new InvalidArgumentException("Component prop [{$prop}] must contain " . implode(', ', $placeholders) . '.');
            }
        }
    }

    private function className(AttributeBag $attributes): ?string
    {
        $class = $attributes->get('class');
        if ($class === null || is_string($class)) return $class;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
