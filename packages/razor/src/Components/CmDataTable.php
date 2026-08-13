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
        if ($page > $pageCount) throw new InvalidArgumentException('Component prop [page] must not exceed [page-count].');
        $loading = $props->bool('loading');
        $error = $props->bool('error');
        $emptyText = $props->string('empty-text', 'No data');
        $loadingText = $props->string('loading-text', 'Loading...');
        $errorText = $props->string('error-text', 'Failed to load data');
        $paginationLabel = $props->string('pagination-label', 'Table pagination');
        $previousPageLabel = $props->string('previous-page-label', 'Previous page');
        $nextPageLabel = $props->string('next-page-label', 'Next page');
        $selectAllLabel = $props->string('select-all-label', 'Select all rows');
        foreach ([$emptyText, $loadingText, $errorText, $paginationLabel, $previousPageLabel, $nextPageLabel, $selectAllLabel] as $label) {
            if (trim($label) === '') throw new InvalidArgumentException('DataTable labels must be non-empty strings.');
        }
        $renderRows = array_map(static fn (array $row): array => [
            ...$row, 'selected' => in_array($row['id'], $selected, true),
        ], $rows);
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())->add('cm-data-table')
            ->addWhen($density === 'compact', 'cm-data-table--compact')->addWhen($striped, 'cm-data-table--striped')
            ->addWhen($columnDividers, 'cm-data-table--column-dividers')->addWhen($stickyHeader, 'cm-data-table--sticky-header')
            ->add($this->className($attributes))->value();
        $stateText = $loading ? $loadingText : ($error ? $errorText : ($rows === [] ? $emptyText : null));

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.data-table', [
            'id' => $id, 'columns' => $columns, 'rows' => $renderRows, 'caption' => $caption,
            'selectable' => $selectable, 'selected' => $selected, 'sort' => $sort, 'page' => $page,
            'pageCount' => $pageCount, 'paginationLabel' => $paginationLabel,
            'previousPageLabel' => $previousPageLabel, 'nextPageLabel' => $nextPageLabel,
            'selectAllLabel' => $selectAllLabel, 'classes' => $classes, 'stateText' => $stateText,
            'columnCount' => count($columns) + ($selectable ? 1 : 0),
            'attributes' => $attributes->without(['class', 'id', 'data-cm-controller', 'data-cm-data-table-sort-key',
                'data-cm-data-table-sort-direction', 'data-cm-data-table-page', 'data-cm-data-table-page-count',
                'data-cm-data-table-selected-count'])->render(),
        ]), "\r\n"));
    }

    private function className(AttributeBag $attributes): ?string
    {
        $class = $attributes->get('class');
        if ($class === null || is_string($class)) return $class;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
