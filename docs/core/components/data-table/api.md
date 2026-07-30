# API

Public component contract: props, events, slots, and related types.

## Props

| Name                      | Type                                           | Default        | Description                                                                             |
| ------------------------- | ---------------------------------------------- | -------------- | --------------------------------------------------------------------------------------- |
| `columns`                 | `VfDataTableColumn[]`                          | —              | Column definitions.                                                                     |
| `rows?`                   | `VfDataTableRow[]`                             | `[]`           | Data records rendered into table rows.                                                  |
| `rowKey?`                 | `string \| ((row, index) => string \| number)` | —              | Stable row key. String keys support dot paths.                                          |
| `selectable?`             | `boolean`                                      | `false`        | Renders row checkboxes and a select-all checkbox.                                       |
| `selectedRowKeys?`        | `VfDataTableRowKey[]`                          | —              | Controlled selected row keys.                                                           |
| `defaultSelectedRowKeys?` | `VfDataTableRowKey[]`                          | `[]`           | Initial selected row keys for uncontrolled selection.                                   |
| `caption?`                | `string`                                       | —              | Optional semantic table caption.                                                        |
| `density?`                | `'default' \| 'compact'`                       | `'default'`    | Row density.                                                                            |
| `striped?`                | `boolean`                                      | `false`        | Applies alternating row background styling.                                             |
| `columnDividers?`         | `boolean`                                      | `false`        | Adds vertical separators between columns.                                               |
| `stickyHeader?`           | `boolean`                                      | `false`        | Makes header sticky inside a scroll container.                                          |
| `visibleColumnKeys?`      | `string[]`                                     | all keys       | Column keys to render, controlled by the consumer.                                      |
| `columnOrder?`            | `VfDataTableColumnOrder`                       | —              | Controlled order keyed by `VfDataTableColumn.key`.                                      |
| `defaultColumnOrder?`     | `VfDataTableColumnOrder`                       | `[]`           | Initial order for uncontrolled column reordering.                                       |
| `reorderableColumns?`     | `boolean`                                      | `false`        | Makes column headers pointer- and keyboard-reorderable.                                 |
| `columnWidths?`           | `VfDataTableColumnWidths`                      | —              | Controlled column widths keyed by column key.                                           |
| `defaultColumnWidths?`    | `VfDataTableColumnWidths`                      | `{}`           | Initial column widths for uncontrolled resizing.                                        |
| `resizableColumns?`       | `boolean`                                      | `false`        | Adds pointer and keyboard resize handles to resizable columns.                          |
| `error?`                  | `boolean`                                      | `false`        | Replaces body rows with the error state when loading is inactive.                       |
| `loading?`                | `boolean`                                      | `false`        | Renders the loading state.                                                              |
| `loadingVariant?`         | `'mask' \| 'skeleton'`                         | `'mask'`       | Loading presentation.                                                                   |
| `loadingRows?`            | `number`                                       | `3`            | Number of skeleton rows when `loadingVariant` is `skeleton`.                            |
| `pagination?`             | `boolean`                                      | `false`        | Enables pagination controls.                                                            |
| `paginationMode?`         | `'client' \| 'manual'`                         | `'client'`     | Pagination mode. Client mode slices local rows; manual mode expects already-paged rows. |
| `page?`                   | `number`                                       | —              | Controlled current page.                                                                |
| `defaultPage?`            | `number`                                       | `1`            | Initial page for uncontrolled pagination.                                               |
| `pageSize?`               | `number`                                       | —              | Controlled rows per page.                                                               |
| `defaultPageSize?`        | `number`                                       | `10`           | Initial rows per page for uncontrolled pagination.                                      |
| `pageSizeOptions?`        | `number[]`                                     | `[10, 25, 50]` | Page size options.                                                                      |
| `totalRows?`              | `number`                                       | —              | Total row count, mainly for manual pagination.                                          |
| `sort?`                   | `VfDataTableSort[]`                            | —              | Controlled column sort state, in priority order.                                        |
| `defaultSort?`            | `VfDataTableSort[]`                            | `[]`           | Initial sort state for uncontrolled sorting.                                            |
| `sortingMode?`            | `'client' \| 'manual'`                         | `'client'`     | Client mode sorts local rows; manual mode only emits sort changes.                      |
| `multiSort?`              | `boolean`                                      | `false`        | Keeps existing criteria when another sortable column is clicked.                        |
| `labels?`                 | `Partial<VfDataTableLabels>`                   | `{}`           | Overrides built-in visible and accessible labels.                                       |
| `emptyText?`              | `string`                                       | `'No data'`    | Legacy empty-state override. Takes precedence over `labels.empty`.                      |
| `loadingText?`            | `string`                                       | `'Loading...'` | Legacy loading-label override. Takes precedence over `labels.loading`.                  |

## Emits

| Name                     | Parameters                                | ReturnType | Description                                     |
| ------------------------ | ----------------------------------------- | ---------- | ----------------------------------------------- |
| `update:page`            | `[page: number]`                          | `void`     | Emitted when pagination changes page.           |
| `update:pageSize`        | `[pageSize: number]`                      | `void`     | Emitted when pagination changes rows per page.  |
| `update:selectedRowKeys` | `[selectedRowKeys: VfDataTableRowKey[]]`  | `void`     | Emitted when row selection changes.             |
| `update:columnOrder`     | `[columnOrder: VfDataTableColumnOrder]`   | `void`     | Emitted when the column order changes.          |
| `column-reorder-end`     | `[columnOrder: VfDataTableColumnOrder]`   | `void`     | Emitted after pointer or keyboard reorder ends. |
| `update:columnWidths`    | `[columnWidths: VfDataTableColumnWidths]` | `void`     | Emitted while column widths change.             |
| `column-resize-end`      | `[columnWidths: VfDataTableColumnWidths]` | `void`     | Emitted after drag, keyboard, or autosize ends. |
| `update:sort`            | `[sort: VfDataTableSort[]]`               | `void`     | Emitted when column sorting changes.            |

## Slots

| Name           | Parameters                         | ReturnType | Description                       |
| -------------- | ---------------------------------- | ---------- | --------------------------------- |
| `caption`      | `—`                                | `void`     | Caption content.                  |
| `header-{key}` | `{ column }`                       | `void`     | Custom column header content.     |
| `cell-{key}`   | `{ row, column, value, rowIndex }` | `void`     | Custom cell content for a column. |
| `empty`        | `—`                                | `void`     | Empty state content.              |
| `error`        | `—`                                | `void`     | Error state content and retry UI. |
| `loading`      | `—`                                | `void`     | Loading state content.            |
| `footer`       | `—`                                | `void`     | Table footer rows.                |

## Types

| Name                           | Type                                          | Description                       |
| ------------------------------ | --------------------------------------------- | --------------------------------- |
| `VfDataTableDensity`           | `'default' \| 'compact'`                      | Density options.                  |
| `VfDataTableLoadingVariant`    | `'mask' \| 'skeleton'`                        | Loading presentation options.     |
| `VfDataTablePaginationMode`    | `'client' \| 'manual'`                        | Pagination mode options.          |
| `VfDataTableSortingMode`       | `'client' \| 'manual'`                        | Sorting execution mode.           |
| `VfDataTableSortDirection`     | `'asc' \| 'desc'`                             | Sort direction.                   |
| `VfDataTableSort`              | `{ key: string; direction: 'asc' \| 'desc' }` | One column sort criterion.        |
| `VfDataTableColumnOrder`       | `string[]`                                    | Persistable order by column key.  |
| `VfDataTableColumnWidths`      | `Record<string, string>`                      | Persistable widths by column key. |
| `VfDataTableLabels`            | `interface`                                   | Built-in label configuration.     |
| `VfDataTableCellAlign`         | `'start' \| 'center' \| 'end'`                | Cell alignment options.           |
| `VfDataTableCellVerticalAlign` | `'top' \| 'middle' \| 'bottom' \| 'baseline'` | Vertical cell alignment options.  |
| `VfDataTableRowKey`            | `string \| number`                            | Stable row selection key.         |
| `VfDataTableRow`               | `object`                                      | Row record shape.                 |
| `VfDataTableColumn`            | `interface`                                   | Column definition.                |

### `VfDataTableLabels`

The `labels` prop accepts a partial object. Omitted fields keep their English defaults.

| Name                        | Type                                        | Default                                    |
| --------------------------- | ------------------------------------------- | ------------------------------------------ |
| `empty`                     | `string`                                    | `'No data'`                                |
| `error`                     | `string`                                    | `'Failed to load data'`                    |
| `loading`                   | `string`                                    | `'Loading...'`                             |
| `pagination`                | `string`                                    | `'Table pagination'`                       |
| `paginationSummary`         | `(firstRow, lastRow, totalRows) => string`  | `'1-10 of 42'` or `'0 rows'`               |
| `rows`                      | `string`                                    | `'Rows'`                                   |
| `rowsPerPage`               | `string`                                    | `'Rows per page'`                          |
| `pageSummary`               | `(page, pageCount) => string`               | `'Page 1 of 5'`                            |
| `previousPage`              | `string`                                    | `'Previous page'`                          |
| `nextPage`                  | `string`                                    | `'Next page'`                              |
| `selectAllRows`             | `string`                                    | `'Select all rows'`                        |
| `selectRow`                 | `(rowIndex) => string`                      | `'Select row 1'`                           |
| `sortAscending`             | `(column) => string`                        | `'Sort Name ascending'`                    |
| `sortDescending`            | `(column) => string`                        | `'Sort Name descending'`                   |
| `clearSort`                 | `(column) => string`                        | `'Clear sorting for Name'`                 |
| `reorderColumn`             | `(column, position, columnCount) => string` | `'Name, column 1 of 4'`                    |
| `reorderColumnInstructions` | `string`                                    | Pointer and keyboard reorder instructions. |
| `columnMoved`               | `(column, position, columnCount) => string` | `'Name column moved to position 2 of 4'`   |
| `resizeColumn`              | `(column) => string`                        | `'Resize Name column'`                     |

### `VfDataTableColumn`

| Name             | Type                                          | Default | Description                                               |
| ---------------- | --------------------------------------------- | ------- | --------------------------------------------------------- |
| `key`            | `string`                                      | —       | Row property key and stable width-state key.              |
| `header?`        | `string`                                      | `key`   | Header label.                                             |
| `sortable?`      | `boolean`                                     | `false` | Enables sorting by the column.                            |
| `width?`         | `string`                                      | —       | Initial CSS width.                                        |
| `minWidth?`      | `string`                                      | —       | Minimum width used by layout and resize constraints.      |
| `maxWidth?`      | `string`                                      | —       | Maximum width used by layout and resize constraints.      |
| `nowrap?`        | `boolean`                                     | `false` | Prevents header and cell content from wrapping.           |
| `resizable?`     | `boolean`                                     | `true`  | Set to `false` to disable boundaries touching the column. |
| `reorderable?`   | `boolean`                                     | `true`  | Set to `false` to disable reordering for the column.      |
| `align?`         | `'start' \| 'center' \| 'end'`                | —       | Horizontal cell alignment.                                |
| `verticalAlign?` | `'top' \| 'middle' \| 'bottom' \| 'baseline'` | —       | Vertical cell alignment.                                  |
| `scope?`         | `'col' \| 'row' \| 'colgroup' \| 'rowgroup'`  | `'col'` | Header scope.                                             |
