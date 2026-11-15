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
