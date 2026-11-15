import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { describe, expect, it } from 'vitest';

import CmDataTable from './data-table/CmDataTable.vue';
import type { CmDataTableCellValue, CmDataTableColumn, CmDataTableRow } from './data-table/data-table.types';
import CmTable from './table/CmTable.vue';
import { expectCmWarning } from '../internal/expect-warning';

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'status', header: 'Status' },
];
const rows = [
  { id: 'apollo', cells: { name: 'Apollo', status: 'Active' } },
  { id: 'zephyr', cells: { name: 'Zephyr', status: 'Paused' } },
];

describe('Vue data table components', () => {
  it('groups pins around the visible order and recomputes offsets when a pinned column is hidden', async () => {
    const wrapper = mount(CmDataTable, {
      props: {
        id: 'project-pins',
        columns: [
          { key: 'actions', header: 'Actions', pinned: 'end' },
          { key: 'status', header: 'Status' },
          { key: 'name', header: 'Name', pinned: 'start' },
          { key: 'team', header: 'Team', pinned: 'start' },
          { key: 'priority', header: 'Priority', pinned: 'end' },
        ],
        rows: [{ id: 'apollo', cells: { name: 'Apollo', team: 'Core', status: 'Open', priority: 'High' } }],
        columnOrder: ['priority', 'team', 'status', 'name', 'actions'],
      },
    });
    expect(wrapper.findAll('thead th').map((cell) => cell.text())).toEqual([
      'Team',
      'Name',
      'Status',
      'Priority',
      'Actions',
    ]);

    const width = (key: string, value: number) => {
      wrapper.get(`thead th[data-cm-data-table-column="${key}"]`).element.getBoundingClientRect = () =>
        ({ width: value }) as DOMRect;
    };
    width('team', 72);
    width('actions', 80);
    window.dispatchEvent(new Event('resize'));
    await nextTick();
    const offset = (key: string) =>
      wrapper
        .get<HTMLElement>(`tbody td[data-cm-data-table-column="${key}"]`)
        .element.style.getPropertyValue('--cm-data-table-pin-offset');
    expect(offset('name')).toBe('72px');
    expect(offset('priority')).toBe('80px');

    await wrapper.setProps({ visibleColumnKeys: ['name', 'status', 'priority'] });
    expect(offset('name')).toBe('0px');
    expect(offset('priority')).toBe('0px');
    wrapper.unmount();
  });

  it('resizes the adjacent pair through its labelled keyboard separator and reports final widths', async () => {
    const wrapper = mount(CmDataTable, {
      props: {
        id: 'projects',
        columns: [
          { ...columns[0], minWidth: '90px' },
          { ...columns[1], minWidth: '72px' },
          { key: 'total', header: 'Total', resizable: false },
        ],
        rows,
        resizableColumns: true,
        defaultColumnWidths: { name: '120px', status: '80px', total: '150px' },
      },
    });
    const headers = wrapper.findAll<HTMLTableCellElement>('th[data-cm-data-table-column]');
    for (const [index, width] of [120, 80, 150].entries()) {
      headers[index].element.getBoundingClientRect = () => ({ width }) as DOMRect;
    }
    const handles = wrapper.findAll('[role="separator"]');
    expect(handles).toHaveLength(1);
    expect(handles[0].attributes('aria-label')).toBe('Resize Name column');
    expect(handles[0].attributes('aria-orientation')).toBe('vertical');
    expect(headers[0].get('button').attributes('data-cm-data-table-sort')).toBe('name');

    await handles[0].trigger('keydown', { key: 'ArrowRight' });
    const expected = { name: '128px', status: '72px', total: '150px' };
    expect(wrapper.emitted('update:columnWidths')).toEqual([[expected]]);
    expect(wrapper.emitted('column-resize-end')).toEqual([[expected]]);
    expect(headers[0].element.style.inlineSize).toBe('128px');
    expect(headers[1].element.style.inlineSize).toBe('72px');
    expect(handles[0].attributes('aria-valuenow')).toBe('128');
    expect(handles[0].attributes('aria-valuemax')).toBe('128');
    wrapper.unmount();
  });

  it('leaves controlled widths and their accessible value in place when the consumer declines resizing', async () => {
    const wrapper = mount(CmDataTable, {
      props: {
        id: 'controlled-resize',
        columns,
        rows,
        resizableColumns: true,
        columnWidths: { name: '120px', status: '80px' },
      },
    });
    const headers = wrapper.findAll<HTMLTableCellElement>('th[data-cm-data-table-column]');
    for (const header of headers) {
      header.element.getBoundingClientRect = () =>
        ({ width: Number.parseFloat(header.element.style.inlineSize) }) as DOMRect;
    }
    const handle = wrapper.get('[role="separator"]');
    await handle.trigger('keydown', { key: 'ArrowRight' });
    expect(wrapper.emitted('update:columnWidths')).toEqual([[{ name: '128px', status: '72px' }]]);
    expect(headers[0].element.style.inlineSize).toBe('120px');
    expect(handle.attributes('aria-valuenow')).toBe('120');
    wrapper.unmount();
  });

  it('renders authored Table groups and consumer root attributes', () => {
    const wrapper = mount(CmTable, {
      attrs: { class: 'consumer', 'aria-label': 'Invoices' },
      props: { density: 'compact', striped: true },
      slots: { default: '<tr><td>INV-42</td></tr>', header: '<tr><th>Number</th></tr>' },
    });
    expect(wrapper.classes()).toEqual(['cm-table-wrap', 'consumer']);
    expect(wrapper.get('table').classes()).toEqual(['cm-table', 'cm-table--compact', 'cm-table--striped']);
    expect(wrapper.attributes('aria-label')).toBe('Invoices');
  });

  it('cycles DataTable sort without reordering application-owned rows', async () => {
    const wrapper = mount(CmDataTable, { props: { id: 'projects', columns, rows } });
    await wrapper.get('[data-cm-data-table-sort]').trigger('click');
    expect(wrapper.emitted('update:sort')).toEqual([[{ key: 'name', direction: 'ascending' }]]);
    expect(wrapper.findAll('[data-cm-data-table-row]').map((row) => row.attributes('data-cm-data-table-row'))).toEqual([
      'apollo',
      'zephyr',
    ]);
  });

  it('sorts a complete client-side data set before paging and keeps empty values last', async () => {
    const items = [
      { id: 'empty', cells: { name: null } },
      { id: 'tenth', cells: { name: 'Project 10' } },
      { id: 'second', cells: { name: 'Project 2' } },
      { id: 'first', cells: { name: 'Project 1' } },
    ];
    const wrapper = mount(CmDataTable, {
      props: {
        id: 'projects',
        columns,
        rows: items,
        sortingMode: 'client',
        paginationMode: 'client',
        pageSize: 2,
      },
    });
    const ids = () =>
      wrapper.findAll('[data-cm-data-table-row]').map((row) => row.attributes('data-cm-data-table-row'));
    expect(ids()).toEqual(['empty', 'tenth']);
    await wrapper.get('[data-cm-data-table-sort]').trigger('click');
    expect(ids()).toEqual(['first', 'second']);
    await wrapper.get('[data-cm-data-table-sort]').trigger('click');
    expect(ids()).toEqual(['tenth', 'second']);
    await wrapper.get('[data-cm-data-table-page-action="next"]').trigger('click');
    expect(ids()).toEqual(['first', 'empty']);
    expect(wrapper.get('.cm-data-table__pagination-summary').text()).toBe('3-4 of 4');

    await wrapper.setProps({ rows: items.slice(0, 2) });
    expect(ids()).toEqual(['tenth', 'empty']);
    expect(wrapper.get('[data-cm-data-table-page-action="previous"]').attributes('disabled')).toBeDefined();
  });

  it('preserves selection across pages and applies the row predicate to visible rows', async () => {
    const wrapper = mount(CmDataTable<CmDataTableRow>, {
      props: {
        id: 'projects',
        columns,
        rows,
        paginationMode: 'client',
        pageSize: 1,
        selectable: true,
        selectedRowIds: ['zephyr'],
        rowSelectable: (row) => row.id !== 'zephyr',
      },
    });
    const selectAll = wrapper.get<HTMLInputElement>('[data-cm-data-table-select-all]');
    await selectAll.setValue(true);
    expect(wrapper.emitted('update:selectedRowIds')).toEqual([[['apollo', 'zephyr']]]);
    await selectAll.setValue(false);
    expect(wrapper.emitted('update:selectedRowIds')).toEqual([[['apollo', 'zephyr']], [['zephyr']]]);
    await wrapper.get('[data-cm-data-table-page-action="next"]').trigger('click');
    const selection = wrapper.get<HTMLInputElement>('[data-cm-data-table-select-row]').element;
    expect(selection.checked).toBe(true);
    expect(selection.disabled).toBe(true);
  });

  it('keeps manual pages in the order delivered by the application', async () => {
    const wrapper = mount(CmDataTable, {
      props: {
        id: 'projects',
        columns,
        rows: [...rows].reverse(),
        sortingMode: 'client',
        pagination: true,
        paginationMode: 'manual',
        page: 2,
        totalRows: 18,
      },
    });
    await wrapper.get('[data-cm-data-table-sort]').trigger('click');
    expect(wrapper.findAll('[data-cm-data-table-row]').map((row) => row.attributes('data-cm-data-table-row'))).toEqual([
      'zephyr',
      'apollo',
    ]);
    expect(wrapper.emitted('sortChange')).toEqual([[{ key: 'name', direction: 'ascending' }]]);
    await wrapper.setProps({ pagination: false });
    expect(wrapper.find('.cm-data-table__pagination').exists()).toBe(false);
  });

  it('renders the requested visible column order', () => {
    const wrapper = mount(CmDataTable, {
      props: { id: 'projects', columns, rows, visibleColumnKeys: ['status'] },
    });
    expect(wrapper.findAll('thead th').map((header) => header.text())).toEqual(['Status']);
    expect(wrapper.findAll('tbody td').map((cell) => cell.text())).toEqual(['Active', 'Paused']);
  });

  it('applies column order and widths without dropping unspecified visible columns', async () => {
    const wrapper = mount(CmDataTable, {
      props: {
        id: 'projects',
        columns: [
          { ...columns[0], width: '8rem', maxWidth: '20rem' },
          { ...columns[1], minWidth: '5rem', verticalAlign: 'middle', nowrap: true },
        ],
        rows,
        columnWidths: { name: '12rem' },
        columnOrder: ['removed', 'status', 'status'],
      },
    });
    const headings = wrapper.findAll<HTMLTableCellElement>('thead th');
    expect(headings.map((heading) => heading.text())).toEqual(['Status', 'Name']);
    expect(headings[1].element.style.inlineSize).toBe('12rem');
    expect(headings[1].element.style.maxInlineSize).toBe('20rem');
    const status = wrapper.get<HTMLTableCellElement>('tbody td');
    expect(status.element.style.minInlineSize).toBe('5rem');
    expect(status.element.style.verticalAlign).toBe('middle');
    expect(status.element.style.whiteSpace).toBe('nowrap');
    await wrapper.setProps({ columnWidths: {} });
    expect(headings[1].element.style.inlineSize).toBe('8rem');
  });

  it('expands a controlled detail row only after the caller accepts the update', async () => {
    const wrapper = mount(CmDataTable<CmDataTableRow>, {
      props: { id: 'projects', columns, rows, expandedRowKeys: [], selectable: true },
      slots: {
        'expanded-row': ({ row, rowKey, rowIndex }: { row: CmDataTableRow; rowKey: string; rowIndex: number }) =>
          h('p', `${rowIndex + 1}. ${rowKey}: ${String(row.cells.status)}`),
      },
    });
    const trigger = wrapper.get('button[aria-expanded]');
    expect(trigger.attributes()).toMatchObject({ 'aria-expanded': 'false', 'aria-label': 'Expand Apollo' });
    await trigger.trigger('click');
    expect(wrapper.emitted('update:expandedRowKeys')).toEqual([[['apollo']]]);
    expect(wrapper.find('.cm-data-table__expanded-row').exists()).toBe(false);
    await wrapper.setProps({ expandedRowKeys: ['apollo'] });
    const detail = wrapper.get('#projects-expanded-apollo');
    expect(detail.text()).toBe('1. apollo: Active');
    expect(detail.get('td').attributes('colspan')).toBe('4');
    expect(trigger.attributes()).toMatchObject({
      'aria-expanded': 'true',
      'aria-label': 'Collapse Apollo',
      'aria-controls': 'projects-expanded-apollo',
    });
    await trigger.trigger('click');
    expect(wrapper.emitted('update:expandedRowKeys')).toEqual([[['apollo']], [[]]]);
    expect(wrapper.find('#projects-expanded-apollo').exists()).toBe(true);
  });

  it('uses default expansion and replaces data with inaccessible placeholder rows while loading', async () => {
    const wrapper = mount(CmDataTable, {
      props: {
        id: 'projects',
        columns,
        rows,
        defaultExpandedRowKeys: ['apollo'],
        loading: true,
        loadingVariant: 'skeleton',
        loadingRows: 2,
      },
      slots: { 'expanded-row': 'Additional project details' },
    });
    expect(wrapper.get('tbody').attributes('aria-busy')).toBe('true');
    expect(wrapper.findAll('tbody tr[aria-hidden="true"]')).toHaveLength(2);
    expect(wrapper.findAll('tbody .cm-skeleton')).toHaveLength(4);
    expect(wrapper.get('[role="status"]').text()).toBe('Loading...');
    expect(wrapper.findAll('[data-cm-data-table-row]')).toHaveLength(0);
    await wrapper.setProps({ loading: false });
    expect(wrapper.get('tbody').attributes('aria-busy')).toBeUndefined();
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
    expect(wrapper.get('#projects-expanded-apollo').text()).toBe('Additional project details');
    await wrapper.get('button[aria-expanded="true"]').trigger('click');
    expect(wrapper.find('#projects-expanded-apollo').exists()).toBe(false);
  });

  it('retains the loaded rows and covers them with a loading mask', async () => {
    const wrapper = mount(CmDataTable, {
      props: { id: 'projects', columns, rows, loading: true, loadingVariant: 'mask', error: true },
      slots: { loading: '<span>Updating projects</span>' },
    });
    expect(wrapper.get('table').element.hasAttribute('inert')).toBe(true);
    const firstRow = wrapper.get('[data-cm-data-table-row="apollo"]').element;
    expect(wrapper.get('.cm-data-table__loading-mask[role="status"]').text()).toBe('Updating projects');
    await wrapper.setProps({ loading: false, error: false });
    expect(wrapper.get('table').element.hasAttribute('inert')).toBe(false);
    expect(wrapper.get('[data-cm-data-table-row="apollo"]').element).toBe(firstRow);
    expect(wrapper.find('.cm-data-table__loading-mask').exists()).toBe(false);
  });

  it('composes scoped cell and heading slots inside a native table', async () => {
    const wrapper = mount(CmDataTable<CmDataTableRow>, {
      props: { id: 'projects', columns, rows },
      slots: {
        caption: 'Project catalogue',
        'header-name': ({ column }: { column: CmDataTableColumn }) => h('strong', column.header),
        'cell-name': ({
          row,
          value,
          rowIndex,
        }: {
          row: CmDataTableRow;
          value: CmDataTableCellValue;
          rowIndex: number;
        }) => h('a', { href: `/projects/${row.id}` }, `${rowIndex + 1}. ${String(value)}`),
        footer: '<tr><td colspan="2">End of results</td></tr>',
      },
    });
    expect(wrapper.get('table > caption').text()).toBe('Project catalogue');
    expect(wrapper.get('th button strong').text()).toBe('Name');
    expect(wrapper.get('th button').attributes('aria-label')).toBe('Sort Name ascending');
    expect(wrapper.get('tbody td a').attributes('href')).toBe('/projects/apollo');
    expect(wrapper.get('tbody td a').text()).toBe('1. Apollo');
    expect(wrapper.get('tfoot > tr > td').text()).toBe('End of results');
    await wrapper.get('th button').trigger('click');
    expect(wrapper.emitted('update:sort')).toEqual([[{ key: 'name', direction: 'ascending' }]]);
  });

  it('honors the loading, error and empty slot precedence even with blank fallback text', async () => {
    const wrapper = mount(CmDataTable, {
      props: { id: 'projects', columns, loading: true, error: true, loadingText: '' },
      slots: {
        loading: '<span>Waiting for projects</span>',
        error: '<span>Projects unavailable</span>',
        empty: '<span>Nothing found</span>',
      },
    });
    expect(wrapper.get('td[role="status"]').text()).toBe('Waiting for projects');
    await wrapper.setProps({ loading: false });
    expect(wrapper.get('td[role="status"]').text()).toBe('Projects unavailable');
    await wrapper.setProps({ error: false });
    expect(wrapper.get('td[role="status"]').text()).toBe('Nothing found');
    await wrapper.setProps({ rows });
    expect(wrapper.find('td[role="status"]').exists()).toBe(false);
  });

  it('reports selection in rendered order and page requests', async () => {
    const wrapper = mount(CmDataTable, {
      props: { id: 'projects', columns, rows, selectable: true, page: 2, pageCount: 3 },
    });
    await wrapper.findAll<HTMLInputElement>('[data-cm-data-table-select-row]')[1].setValue(true);
    await wrapper.get('[data-cm-data-table-page-action="next"]').trigger('click');
    expect(wrapper.emitted('selectionChange')).toEqual([[['zephyr']]]);
    expect(wrapper.emitted('pageChange')).toEqual([[3]]);
  });

  it('preserves disabled selections when selecting eligible rows', async () => {
    const constrainedRows = [{ ...rows[0], selectable: false }, rows[1]];
    const wrapper = mount(CmDataTable, {
      props: {
        id: 'projects',
        columns,
        rows: constrainedRows,
        selectable: true,
        selectedRowIds: ['apollo'],
      },
    });
    const inputs = wrapper.findAll<HTMLInputElement>('[data-cm-data-table-select-row]');
    expect(inputs[0].attributes('disabled')).toBeDefined();
    await wrapper.get<HTMLInputElement>('[data-cm-data-table-select-all]').setValue(true);
    expect(wrapper.emitted('selectionChange')).toEqual([[['apollo', 'zephyr']]]);
  });

  it('reports a page-size request and resets the requested page', async () => {
    const wrapper = mount(CmDataTable, {
      props: {
        id: 'projects',
        columns,
        rows,
        page: 2,
        pageSize: 10,
        pageSizeOptions: [10, 25, 50],
        totalRows: 25,
      },
    });
    await wrapper.get<HTMLSelectElement>('[data-cm-data-table-page-size-control]').setValue('25');
    expect(wrapper.emitted('pageSizeChange')).toEqual([[25]]);
    expect(wrapper.emitted('pageChange')).toEqual([[1]]);
    expect(wrapper.attributes('data-cm-data-table-page-size')).toBe('25');
    expect(wrapper.attributes('data-cm-data-table-page-count')).toBe('1');
    expect(wrapper.get('.cm-data-table__pagination-summary').text()).toBe('1-25 of 25');
    expect(wrapper.get('.cm-data-table__page-summary').text()).toBe('Page 1 of 1');
  });

  it('renders localized pagination summaries and visible button text', () => {
    const wrapper = mount(CmDataTable, {
      props: {
        id: 'projects',
        columns,
        rows,
        page: 2,
        pageSize: 10,
        totalRows: 25,
        pageSummaryTemplate: 'Страница {page} из {pageCount}',
        paginationSummaryTemplate: '{firstRow}–{lastRow} из {totalRows}',
        previousPageText: 'Назад',
        nextPageText: 'Вперёд',
      },
    });
    expect(wrapper.get('.cm-data-table__pagination-summary').text()).toBe('11–20 из 25');
    expect(wrapper.get('.cm-data-table__page-summary').text()).toBe('Страница 2 из 3');
    expect(wrapper.get('[data-cm-data-table-page-action="previous"]').text()).toBe('Назад');
    expect(wrapper.get('[data-cm-data-table-page-action="next"]').text()).toBe('Вперёд');
  });

  it('preserves localized sort and row-selection labels through interaction', async () => {
    const wrapper = mount(CmDataTable, {
      props: {
        id: 'projects',
        columns,
        rows,
        selectable: true,
        selectAllLabel: 'Выбрать все строки',
        selectRowLabelTemplate: 'Выбрать строку {row}',
        sortAscendingLabelTemplate: 'Сортировать {column} по возрастанию',
        sortDescendingLabelTemplate: 'Сортировать {column} по убыванию',
        clearSortLabelTemplate: 'Сбросить сортировку {column}',
      },
    });
    const sort = wrapper.get('[data-cm-data-table-sort]');
    expect(sort.attributes('aria-label')).toBe('Сортировать Name по возрастанию');
    expect(wrapper.findAll('[data-cm-data-table-select-row]')[0].attributes('aria-label')).toBe(
      'Выбрать строку Apollo',
    );
    await sort.trigger('click');
    expect(sort.attributes('aria-label')).toBe('Сортировать Name по убыванию');
    await sort.trigger('click');
    expect(sort.attributes('aria-label')).toBe('Сбросить сортировку Name');
  });

  it('warns about invalid table input and renders what is left', () => {
    const duplicateColumn = expectCmWarning(/Invalid DataTable column/u, () =>
      mount(CmDataTable, { props: { id: 'projects', columns: [columns[0], columns[0]], rows } }),
    );
    expect(duplicateColumn.findAll('thead th')).toHaveLength(1);

    const unsafeCell = expectCmWarning(/Invalid DataTable cell/u, () =>
      mount(CmDataTable, {
        props: { id: 'projects', columns, rows: [{ id: 'bad', cells: { name: Number.NaN } }] },
      }),
    );
    expect(unsafeCell.findAll('tbody tr[data-cm-data-table-row]')).toHaveLength(0);

    const missingPageSize = expectCmWarning(/pageSizeOptions must contain pageSize/u, () =>
      mount(CmDataTable, { props: { id: 'projects', columns, rows, pageSize: 10, pageSizeOptions: [25, 50] } }),
    );
    expect(missingPageSize.findAll('option').map((option) => option.text())).toContain('10');

    const unsafeRow = expectCmWarning(/Invalid DataTable row/u, () =>
      mount(CmDataTable, {
        props: { id: 'projects', columns, rows: [{ ...rows[0], selectable: 'no' as unknown as boolean }] },
      }),
    );
    expect(unsafeRow.findAll('tbody tr[data-cm-data-table-row]')).toHaveLength(0);

    const missingColumn = expectCmWarning(/Invalid DataTable visible column/u, () =>
      mount(CmDataTable, { props: { id: 'projects', columns, rows, visibleColumnKeys: ['missing'] } }),
    );
    expect(missingColumn.findAll('thead th')).toHaveLength(0);

    const missingPlaceholder = expectCmWarning(/selectRowLabelTemplate must contain \{row\}/u, () =>
      mount(CmDataTable, { props: { id: 'projects', columns, rows, selectRowLabelTemplate: 'Выбрать строку' } }),
    );
    expect(missingPlaceholder.find('table').exists()).toBe(true);
  });
});
