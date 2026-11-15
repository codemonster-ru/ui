import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import { expect, it } from 'vitest';
import VfDataTable from './VfDataTable.vue';

it('keeps numeric and string keys distinct and respects the controlled selection and expanded row state', async () => {
  const table = mount(VfDataTable, {
    attachTo: document.body,
    props: {
      columns: [{ key: 'name' }],
      rows: [
        { id: 7, name: 'Numeric key' },
        { id: '7', name: 'String key' },
      ],
      rowKey: 'id',
      selectable: true,
      selectedRowKeys: ['7'],
      expandedRowKeys: [7],
    },
    slots: {
      'expanded-row': ({ rowKey }: { rowKey: string | number }) => h('p', `Details for ${typeof rowKey}`),
    },
  });

  try {
    const [numeric, string] = table.findAll<HTMLInputElement>('[data-cm-data-table-select-row]');
    expect(numeric.attributes('aria-label')).toBe('Select row 1');
    expect(numeric.element.checked).toBe(false);
    expect(string.element.checked).toBe(true);
    numeric.element.click();
    await nextTick();
    expect(table.emitted('update:selectedRowKeys')).toEqual([[[7, '7']]]);
    expect(numeric.element.checked).toBe(false);
    await table.setProps({ selectedRowKeys: [7] });
    expect(numeric.element.checked).toBe(true);
    expect(string.element.checked).toBe(false);
    expect(table.get('.cm-data-table__expanded-row').text()).toBe('Details for number');
    await table.get('[data-cm-data-table-expand][aria-expanded="true"]').trigger('click');
    expect(table.emitted('update:expandedRowKeys')).toEqual([[[]]]);
    expect(table.find('.cm-data-table__expanded-row').exists()).toBe(true);
  } finally {
    table.unmount();
  }
});

it('restores sort models, client sorting, omitted headers, and one-based paging defaults', async () => {
  const table = mount(VfDataTable, {
    props: {
      columns: [
        { key: 'region', sortable: true },
        { key: 'score', sortable: true },
      ],
      rows: [
        { region: 'West', score: 3 },
        { region: 'East', score: 2 },
        { region: 'East', score: 10 },
      ],
      multiSort: true,
      defaultSort: [
        { key: 'region', direction: 'asc' },
        { key: 'score', direction: 'desc' },
      ],
      pagination: true,
      defaultPageSize: 2,
      pageSizeOptions: [2, 10],
    },
  });

  try {
    const rows = () => table.findAll('[data-cm-data-table-row]').map((row) => row.text());
    expect(rows()).toEqual(['East10', 'East2']);
    expect(table.findAll('.cm-data-table__pagination-page').map((button) => button.text())).toEqual(['1', '2']);
    expect(table.get('[aria-current="page"]').attributes('aria-label')).toBe('Page 1 of 2');
    expect(table.get('button[data-cm-data-table-sort="region"]').text()).toBe('region1');
    await table.get('button[data-cm-data-table-page-action="next"]').trigger('click');
    expect(rows()).toEqual(['West3']);
    expect(table.emitted('update:page')).toEqual([[2]]);
    await table.get('button[data-cm-data-table-sort="score"]').trigger('click');
    expect(rows()).toEqual(['East2', 'East10']);
    expect(table.emitted('update:sort')).toEqual([[[{ key: 'region', direction: 'asc' }]]]);
    expect(table.emitted('update:page')).toEqual([[2], [1]]);
  } finally {
    table.unmount();
  }
});

it('shows the exact numbered ranges and preserves a focused page across changes', async () => {
  const table = mount(VfDataTable, {
    attachTo: document.body,
    props: {
      columns: [{ key: 'name' }],
      rows: Array.from({ length: 200 }, (_, index) => ({ name: `Row ${index + 1}` })),
      pagination: true,
      defaultPage: 10,
      labels: {
        paginationSummary: (first, last, total) => `Rows ${first} to ${last} / ${total}`,
        pageSummary: (page, count) => `Page ${page} / ${count}`,
        goToPage: (page) => `Jump to ${page}`,
      },
    },
  });

  try {
    const range = () =>
      table.findAll('.cm-data-table__pagination-page, .cm-data-table__pagination-ellipsis').map((item) => item.text());
    const current = () => table.get('[aria-current="page"]');
    expect(range()).toEqual(['1', '…', '9', '10', '11', '…', '20']);
    expect(current().attributes('aria-label')).toBe('Page 10 / 20');
    expect(table.get('.cm-data-table__pagination-summary').text()).toBe('Rows 91 to 100 / 200');
    await current().trigger('click');
    expect(table.emitted('update:page')).toBeUndefined();

    const nextPage = table.get<HTMLButtonElement>('button[aria-label="Jump to 11"]');
    nextPage.element.focus();
    await nextPage.trigger('click');
    expect(current().element).toBe(nextPage.element);
    expect(document.activeElement).toBe(nextPage.element);
    expect(table.get('[data-cm-data-table-row]').text()).toBe('Row 101');

    await table.get('button[aria-label="Jump to 20"]').trigger('click');
    expect(range()).toEqual(['1', '…', '16', '17', '18', '19', '20']);
    expect(table.get('button[aria-label="Next page"]').attributes('disabled')).toBeDefined();
    await table.get('button[aria-label="Jump to 1"]').trigger('click');
    expect(range()).toEqual(['1', '2', '3', '4', '5', '…', '20']);
    expect(table.emitted('update:page')).toEqual([[11], [20], [1]]);

    await table.get('button[aria-label="Jump to 2"]').trigger('click');
    const previous = table.get<HTMLButtonElement>('button[aria-label="Previous page"]');
    previous.element.focus();
    await previous.trigger('click');
    await nextTick();
    expect(previous.element.disabled).toBe(true);
    expect(document.activeElement).toBe(current().element);
  } finally {
    table.unmount();
  }
});

it('clamps controlled manual pages and leaves page and page size authoritative with the host', async () => {
  const rows = [{ name: 'First server record' }, { name: 'Second server record' }];
  const table = mount(VfDataTable, {
    props: {
      columns: [{ key: 'name' }],
      rows,
      pagination: true,
      paginationMode: 'manual',
      page: 81.5,
      pageSize: 10,
      pageSizeOptions: [10, 25],
      totalRows: 200,
    },
  });

  try {
    const current = () => table.get('[aria-current="page"]').text();
    const summary = () => table.get('.cm-data-table__pagination-summary').text();
    expect(current()).toBe('20');
    expect(summary()).toBe('191-192 of 200');
    await table.get('button[aria-label="Go to page 19"]').trigger('click');
    expect(table.emitted('update:page')).toEqual([[19]]);
    expect(current()).toBe('20');
    await table.setProps({ totalRows: 14 });
    expect(current()).toBe('2');
    expect(summary()).toBe('11-12 of 14');
    await table.setProps({ totalRows: 200 });
    expect(current()).toBe('20');

    const size = table.get<HTMLSelectElement>('select');
    await size.setValue('25');
    expect(table.emitted('update:pageSize')).toEqual([[25]]);
    expect(table.emitted('update:page')).toEqual([[19], [1]]);
    expect(size.element.value).toBe('10');
    await table.setProps({ pageSize: 25, page: 1, rows: [] });
    expect(size.element.value).toBe('25');
    expect(current()).toBe('1');
    expect(summary()).toBe('0-0 of 200');
  } finally {
    table.unmount();
  }
});
