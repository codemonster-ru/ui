import { mount } from '@vue/test-utils';
import { expect, it } from 'vitest';
import CmDataTable from './CmDataTable.vue';
import type { CmDataTableSort } from './data-table.types';

it('sorts equal primary values by the next column and requests the next ordered sort without taking control', async () => {
  const sortList: CmDataTableSort[] = [
    { key: 'team', direction: 'ascending' },
    { key: 'score', direction: 'descending' },
  ];
  const table = mount(CmDataTable, {
    props: {
      id: 'rankings',
      columns: [
        { key: 'team', header: 'Team', sortable: true },
        { key: 'score', header: 'Score', sortable: true },
      ],
      rows: [
        { id: 'away', cells: { team: 'West', score: 100 } },
        { id: 'unset', cells: { team: 'East', score: null } },
        { id: 'middle', cells: { team: 'East', score: 2 } },
        { id: 'top', cells: { team: 'East', score: 10 } },
      ],
      sortList,
      multiSort: true,
      sortingMode: 'client',
    },
  });

  try {
    const ids = () => table.findAll('[data-cm-data-table-row]').map((row) => row.attributes('data-cm-data-table-row'));
    expect(ids()).toEqual(['top', 'middle', 'unset', 'away']);
    expect(table.findAll('th[aria-sort="ascending"]')).toHaveLength(1);
    expect(table.findAll('th[aria-sort="descending"]')).toHaveLength(0);
    const score = table.get('button[data-cm-data-table-sort="score"]');
    expect(score.attributes('aria-label')).toBe('Clear sorting for Score, sorted descending, priority 2');
    expect(score.attributes('data-cm-sort-direction')).toBe('descending');
    await score.trigger('click');
    expect(table.emitted('update:sortList')).toEqual([[[sortList[0]]]]);
    expect(ids()).toEqual(['top', 'middle', 'unset', 'away']);
    await table.setProps({ sortList: [sortList[0]] });
    expect(ids()).toEqual(['unset', 'middle', 'top', 'away']);
    expect(score.find('.cm-data-table__sort-priority').exists()).toBe(false);
  } finally {
    table.unmount();
  }
});
