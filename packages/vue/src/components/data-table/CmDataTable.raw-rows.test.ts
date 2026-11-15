import { mount } from '@vue/test-utils';
import { h, nextTick, reactive } from 'vue';
import { expect, it, vi } from 'vitest';

import CmDataTable from './CmDataTable.vue';
import type { CmDataTableCellValue, CmDataTableProps, CmDataTableRow } from './data-table.types';

interface HostRow {
  account: { key: number | string };
  profile: { displayName: string };
  enabled: boolean;
}

const columns = [{ key: 'profile.displayName', header: 'Name', sortable: true }];
const rowId = (row: Element) => row.getAttribute('data-cm-data-table-row');

it('keeps reactive host row references in slots and selection predicates after client sorting', async () => {
  const rows = reactive<HostRow[]>([
    { account: { key: 21 }, profile: { displayName: 'Zephyr' }, enabled: true },
    { account: { key: 'apollo record' }, profile: { displayName: 'Apollo' }, enabled: false },
  ]);
  const inspected = new Set<HostRow>();
  const scoped = new Map<string, HostRow>();
  const expanded = new Map<string, HostRow>();
  const props: CmDataTableProps<HostRow> = {
    id: 'raw-accounts',
    columns,
    rows,
    rowKey: 'account.key',
    selectable: true,
    sortingMode: 'client',
    rowSelectable(row) {
      inspected.add(row);
      return row.enabled;
    },
  };
  const wrapper = mount(CmDataTable<HostRow>, {
    props: { ...props },
    slots: {
      'cell-profile.displayName': ({ row, value }: { row: HostRow; value: CmDataTableCellValue }) => {
        scoped.set(String(row.account.key), row);
        return h('strong', value ?? '');
      },
      'expanded-row': ({ row, rowKey }: { row: HostRow; rowKey: string }) => {
        expanded.set(rowKey, row);
        return h('span', row.profile.displayName);
      },
    },
  });
  expect(scoped.get('21')).toBe(rows[0]);
  expect(inspected.has(rows[1])).toBe(true);

  await wrapper.get('[data-cm-data-table-sort]').trigger('click');
  const ids = () => wrapper.findAll('[data-cm-data-table-row]').map(({ element }) => rowId(element));
  expect(ids()).toEqual(['apollo record', '21']);
  const locked = wrapper.get<HTMLInputElement>('[data-cm-data-table-row="apollo record"] input');
  expect(locked.element.disabled).toBe(true);
  await wrapper.get<HTMLInputElement>('[data-cm-data-table-row="21"] input').setValue(true);
  expect(wrapper.emitted('update:selectedRowIds')).toEqual([[['21']]]);

  const expand = wrapper.get('[data-cm-data-table-row="apollo record"] [aria-expanded]');
  await expand.trigger('click');
  expect(expanded.get('apollo record')).toBe(rows[1]);
  const panelId = wrapper.get('.cm-data-table__expanded-row').attributes('id');
  expect(expand.attributes('aria-controls')).toBe(panelId);
  expect(panelId).not.toMatch(/\s/u);

  rows[0].profile.displayName = 'Aardvark';
  await nextTick();
  expect(ids()).toEqual(['21', 'apollo record']);
  expect(wrapper.get<HTMLInputElement>('[data-cm-data-table-row="21"] input').element.checked).toBe(true);
  wrapper.unmount();
});

it('passes source indexes to custom row keys before sorting and paging', async () => {
  const rows: HostRow[] = [
    { account: { key: 'z' }, profile: { displayName: 'Zephyr' }, enabled: true },
    { account: { key: 'a' }, profile: { displayName: 'Apollo' }, enabled: true },
  ];
  const rowKey = vi.fn((row: HostRow, index: number) => `${row.account.key}-${index}`);
  const props: CmDataTableProps<HostRow> = {
    id: 'paged-accounts',
    rows,
    rowKey,
    columns,
    sort: { key: 'profile.displayName', direction: 'ascending' },
    sortingMode: 'client',
    pagination: true,
    paginationMode: 'client',
    pageSize: 1,
  };
  const wrapper = mount(CmDataTable<HostRow>, { props: { ...props } });
  expect(rowKey).toHaveBeenCalledWith(rows[0], 0);
  expect(rowKey).toHaveBeenCalledWith(rows[1], 1);
  expect(wrapper.get('[data-cm-data-table-row]').attributes('data-cm-data-table-row')).toBe('a-1');
  await wrapper.get('[data-cm-data-table-page-action="next"]').trigger('click');
  expect(wrapper.get('[data-cm-data-table-row]').attributes('data-cm-data-table-row')).toBe('z-0');
  wrapper.unmount();
});

it('rejects duplicate and malformed explicit keys', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const wrapper = mount(CmDataTable, {
      props: {
        id: 'invalid-raw-accounts',
        columns,
        rowKey: 'key',
        rows: [
          { key: 7, profile: { displayName: 'One' } },
          { key: '7', profile: { displayName: 'Duplicate' } },
          { key: { broken: true }, profile: { displayName: 'Malformed' } },
        ],
      },
    });
    expect(wrapper.findAll('[data-cm-data-table-row]')).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Invalid DataTable row key at source index 1'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Invalid DataTable row key at source index 2'));
    wrapper.unmount();
  } finally {
    warn.mockRestore();
  }
});

it('keeps camel-case header and cell slots for authored columns', () => {
  const wrapper = mount(CmDataTable<CmDataTableRow>, {
    props: {
      id: 'legacy-slot-names',
      columns: [{ key: 'project-actions', header: 'Actions' }],
      rows: [{ id: 'apollo', cells: { 'project-actions': 'Edit' } }],
    },
    slots: {
      headerProjectActions: 'Project actions',
      cellProjectActions: ({ row }: { row: CmDataTableRow }) => h('strong', row.id),
    },
  });
  expect(wrapper.get('thead th').text()).toBe('Project actions');
  expect(wrapper.get('tbody strong').text()).toBe('apollo');
  wrapper.unmount();
});
