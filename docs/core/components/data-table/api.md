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
| `columnWidths?`           | `VfDataTableColumnWidths`                      | —              | Controlled column widths keyed by column key.                                           |
| `defaultColumnWidths?`    | `VfDataTableColumnWidths`                      | `{}`           | Initial column widths for uncontrolled resizing.                                        |
| `resizableColumns?`       | `boolean`                                      | `false`        | Adds pointer and keyboard resize handles to resizable columns.                          |
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
| `emptyText?`              | `string`                                       | `'No data'`    | Empty state fallback text.                                                              |
| `loadingText?`            | `string`                                       | `'Loading...'` | Accessible label for the default loading mask.                                          |

## Emits

| Name                     | Parameters                                | ReturnType | Description                                     |
| ------------------------ | ----------------------------------------- | ---------- | ----------------------------------------------- |
| `update:page`            | `[page: number]`                          | `void`     | Emitted when pagination changes page.           |
| `update:pageSize`        | `[pageSize: number]`                      | `void`     | Emitted when pagination changes rows per page.  |
| `update:selectedRowKeys` | `[selectedRowKeys: VfDataTableRowKey[]]`  | `void`     | Emitted when row selection changes.             |
| `update:columnWidths`    | `[columnWidths: VfDataTableColumnWidths]` | `void`     | Emitted while column widths change.             |
| `column-resize-end`      | `[columnWidths: VfDataTableColumnWidths]` | `void`     | Emitted after drag, keyboard, or autosize ends. |

## Slots

| Name           | Parameters                         | ReturnType | Description                       |
| -------------- | ---------------------------------- | ---------- | --------------------------------- |
| `caption`      | `—`                                | `void`     | Caption content.                  |
| `header-{key}` | `{ column }`                       | `void`     | Custom column header content.     |
| `cell-{key}`   | `{ row, column, value, rowIndex }` | `void`     | Custom cell content for a column. |
| `empty`        | `—`                                | `void`     | Empty state content.              |
| `loading`      | `—`                                | `void`     | Loading state content.            |
| `footer`       | `—`                                | `void`     | Table footer rows.                |

## Types

| Name                           | Type                                          | Description                       |
| ------------------------------ | --------------------------------------------- | --------------------------------- |
| `VfDataTableDensity`           | `'default' \| 'compact'`                      | Density options.                  |
| `VfDataTableLoadingVariant`    | `'mask' \| 'skeleton'`                        | Loading presentation options.     |
| `VfDataTablePaginationMode`    | `'client' \| 'manual'`                        | Pagination mode options.          |
| `VfDataTableColumnWidths`      | `Record<string, string>`                      | Persistable widths by column key. |
| `VfDataTableCellAlign`         | `'start' \| 'center' \| 'end'`                | Cell alignment options.           |
| `VfDataTableCellVerticalAlign` | `'top' \| 'middle' \| 'bottom' \| 'baseline'` | Vertical cell alignment options.  |
| `VfDataTableRowKey`            | `string \| number`                            | Stable row selection key.         |
| `VfDataTableRow`               | `object`                                      | Row record shape.                 |
| `VfDataTableColumn`            | `interface`                                   | Column definition.                |

### `VfDataTableColumn`

| Name             | Type                                          | Default | Description                                               |
| ---------------- | --------------------------------------------- | ------- | --------------------------------------------------------- |
| `key`            | `string`                                      | —       | Row property key and stable width-state key.              |
| `header?`        | `string`                                      | `key`   | Header label.                                             |
| `width?`         | `string`                                      | —       | Initial CSS width.                                        |
| `minWidth?`      | `string`                                      | —       | Minimum width used by layout and resize constraints.      |
| `maxWidth?`      | `string`                                      | —       | Maximum width used by layout and resize constraints.      |
| `nowrap?`        | `boolean`                                     | `false` | Prevents header and cell content from wrapping.           |
| `resizable?`     | `boolean`                                     | `true`  | Set to `false` to disable boundaries touching the column. |
| `align?`         | `'start' \| 'center' \| 'end'`                | —       | Horizontal cell alignment.                                |
| `verticalAlign?` | `'top' \| 'middle' \| 'bottom' \| 'baseline'` | —       | Vertical cell alignment.                                  |
| `scope?`         | `'col' \| 'row' \| 'colgroup' \| 'rowgroup'`  | `'col'` | Header scope.                                             |
