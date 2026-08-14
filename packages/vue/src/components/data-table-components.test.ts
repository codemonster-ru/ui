import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import CmDataTable from './data-table/CmDataTable.vue';
import CmTable from './table/CmTable.vue';

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'status', header: 'Status' },
];
const rows = [
  { id: 'apollo', cells: { name: 'Apollo', status: 'Active' } },
  { id: 'zephyr', cells: { name: 'Zephyr', status: 'Paused' } },
];

describe('Vue data table components', () => {
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

  it('renders the requested visible column order', () => {
    const wrapper = mount(CmDataTable, {
      props: { id: 'projects', columns, rows, visibleColumnKeys: ['status'] },
    });
    expect(wrapper.findAll('thead th').map((header) => header.text())).toEqual(['Status']);
    expect(wrapper.findAll('tbody td').map((cell) => cell.text())).toEqual(['Active', 'Paused']);
  });

  it('reports selection in rendered order and page requests', async () => {
    const wrapper = mount(CmDataTable, {
      props: { id: 'projects', columns, rows, selectable: true, page: 2, pageCount: 3 },
    });
    await wrapper.findAll<HTMLInputElement>('[data-cm-data-table-select-row]')[1]!.setValue(true);
    await wrapper.get('[data-cm-data-table-page-action="next"]').trigger('click');
    expect(wrapper.emitted('selectionChange')).toEqual([[['zephyr']]]);
    expect(wrapper.emitted('pageChange')).toEqual([[3]]);
  });

  it('preserves disabled selections when selecting eligible rows', async () => {
    const constrainedRows = [{ ...rows[0]!, selectable: false }, rows[1]!];
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
    expect(inputs[0]!.attributes('disabled')).toBeDefined();
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
    expect(wrapper.findAll('[data-cm-data-table-select-row]')[0]!.attributes('aria-label')).toBe(
      'Выбрать строку Apollo',
    );
    await sort.trigger('click');
    expect(sort.attributes('aria-label')).toBe('Сортировать Name по убыванию');
    await sort.trigger('click');
    expect(sort.attributes('aria-label')).toBe('Сбросить сортировку Name');
  });

  it('rejects duplicate columns and unsafe cell values', () => {
    expect(() => mount(CmDataTable, { props: { id: 'projects', columns: [columns[0], columns[0]], rows } })).toThrow(
      /Invalid DataTable column/u,
    );
    expect(() =>
      mount(CmDataTable, {
        props: { id: 'projects', columns, rows: [{ id: 'bad', cells: { name: Number.NaN } }] },
      }),
    ).toThrow(/Invalid DataTable cell/u);
    expect(() =>
      mount(CmDataTable, { props: { id: 'projects', columns, rows, pageSize: 10, pageSizeOptions: [25, 50] } }),
    ).toThrow(/pageSizeOptions must contain pageSize/u);
    expect(() =>
      mount(CmDataTable, {
        props: { id: 'projects', columns, rows: [{ ...rows[0]!, selectable: 'no' as unknown as boolean }] },
      }),
    ).toThrow(/Invalid DataTable row/u);
    expect(() =>
      mount(CmDataTable, { props: { id: 'projects', columns, rows, visibleColumnKeys: ['missing'] } }),
    ).toThrow(/Invalid DataTable visible column/u);
    expect(() =>
      mount(CmDataTable, { props: { id: 'projects', columns, rows, selectRowLabelTemplate: 'Выбрать строку' } }),
    ).toThrow(/selectRowLabelTemplate must contain \{row\}/u);
  });
});
