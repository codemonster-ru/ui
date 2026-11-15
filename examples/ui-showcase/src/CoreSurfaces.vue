<script setup lang="ts">
import {
  CmBadge,
  CmButton,
  CmCard,
  CmColumnChooser,
  CmDataTable,
  CmDivider,
  CmGroupBox,
  CmPanel,
  CmSkeleton,
  CmTable,
  CmTag,
  type CmDataTableProps,
} from '@codemonster-ru/ui-vue';
import { computed, ref } from 'vue';
import CoreMatrix from './CoreMatrix.vue';
import CoreResizableTable from './CoreResizableTable.vue';

const sortableColumns = [
  { key: 'member', header: 'Member', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'status', header: 'Status', sortable: true },
  { key: 'tasks', header: 'Tasks', align: 'end', sortable: true },
] as const;
const columns = sortableColumns.map(({ key, header, ...props }) => ({
  key,
  header,
  align: 'align' in props ? props.align : undefined,
}));
const rows = [
  ['Alice', 'Design', 'Available', 12],
  ['Bob', 'Platform', 'Busy', 8],
  ['Carol', 'Product', 'Available', 15],
  ['Diego', 'Design', 'Away', 5],
  ['Eve', 'QA', 'Offline', 3],
  ['Frank', 'Support', 'Available', 9],
  ['Grace', 'Platform', 'Busy', 11],
].map(([member, role, status, tasks], index) => ({
  id: `member-${index + 1}`,
  cells: { member, role, status, tasks },
}));
const availability = rows.slice(0, 5).map(({ cells }) => [cells.member, cells.status]);
const projectRows = [
  ['Core', 'Stable', 'Design'],
  ['Forms', 'Review', 'Product'],
  ['Navigation', 'Stable', 'Platform'],
  ['Overlay', 'Testing', 'Design'],
  ['Feedback', 'Planned', 'Product'],
];
const projectStatus = projectRows.map(([name, status]) => [name, status]);
const tableExamples = [
  {
    title: 'Caption and footer',
    props: { caption: 'Team availability' },
    headers: ['Member', 'Status'],
    rows: availability,
  },
  {
    title: 'Striped',
    props: { striped: true },
    headers: ['Name', 'Status'],
    rows: [
      ['Navigation', 'Stable'],
      ['Overlay', 'Review'],
      ['Forms', 'Stable'],
      ['Feedback', 'Testing'],
      ['Surfaces', 'Planned'],
    ],
  },
  { title: 'Compact', props: { density: 'compact' as const }, headers: ['Name', 'Status'], rows: projectStatus },
  {
    title: 'Column dividers',
    props: { columnDividers: true },
    headers: ['Name', 'Status', 'Owner'],
    rows: projectRows,
  },
  {
    title: 'Sticky header',
    props: { stickyHeader: true },
    headers: ['Name', 'Status'],
    rows: [...projectStatus, ['Surfaces', 'Stable'], ['Progress', 'Review']],
  },
];
const rosterColumns = columns.slice(0, 3);
const metricColumns = [columns[0], columns[2], columns[3]];
const rosterRows = rows.map(({ id, cells: { member, role, status } }) => ({ id, cells: { member, role, status } }));
const metricRows = rows.map(({ id, cells: { member, status, tasks } }) => ({ id, cells: { member, status, tasks } }));
const roster = { striped: true, columnDividers: true };
const selectableRows = rosterRows.map((row) => ({ ...row, selectable: row.cells.status !== 'Offline' }));
const paginationRows = Array.from({ length: 42 }, (_, index) => {
  const row = metricRows[index % metricRows.length];
  return { id: `member-${index + 1}`, cells: { ...row.cells, member: `${row.cells.member} ${index + 1}` } };
});
const dataExamples: { id: string; title: string; props?: Partial<CmDataTableProps> }[] = [
  { id: 'default', title: 'Default', props: { ...roster, caption: 'Team roster' } },
  {
    id: 'compact',
    title: 'Compact aligned',
    props: { ...roster, density: 'compact', columns: metricColumns, rows: metricRows },
  },
  { id: 'columns', title: 'Column chooser', props: { ...roster, caption: 'Configurable team roster', columns, rows } },
  { id: 'selection', title: 'Selection', props: { ...roster, selectable: true, rows: selectableRows } },
  { id: 'sticky', title: 'Sticky header', props: { stickyHeader: true } },
  { id: 'loading', title: 'Loading', props: { loading: true } },
  { id: 'error', title: 'Error', props: { errorText: 'Could not load team members.', rows: rosterRows.slice(0, 3) } },
  {
    id: 'sorting',
    title: 'Sorting',
    props: {
      ...roster,
      caption: 'Sortable team workload',
      columns: sortableColumns,
      totalRows: rows.length,
      pageSizeOptions: [3, 5, 10],
    },
  },
  {
    id: 'pagination',
    title: 'Pagination',
    props: { columns: metricColumns, totalRows: paginationRows.length, pageSizeOptions: [3, 5, 10] },
  },
  { id: 'empty', title: 'Empty', props: { rows: [], emptyText: 'No team members found' } },
];
const columnOrder = ref(columns.map(({ key }) => key));
const orderedColumns = computed(() => columnOrder.value.map((key) => columns.find((column) => column.key === key)!));
function moveColumn(index: number, offset: number) {
  const next = [...columnOrder.value];
  const target = index + offset;
  [next[index], next[target]] = [next[target], next[index]];
  columnOrder.value = next;
}
const visible = ref<readonly string[]>(['member', 'status', 'tasks']);
const selection = ref<readonly string[]>([]);
const sort = ref<CmDataTableProps['sort']>(null);
const sortPage = ref(1);
const sortPageSize = ref(3);
const sortedRows = computed(() => {
  const order = sort.value;
  const sample = rows.slice();
  if (!order) return sample;
  const key = columns.find((column) => column.key === order.key)?.key;
  if (!key) return sample;
  return sample.sort(
    (left, right) =>
      String(left.cells[key]).localeCompare(String(right.cells[key]), 'en', { numeric: true }) *
      (order.direction === 'ascending' ? 1 : -1),
  );
});
const dataError = ref(true);
const page = ref(7);
const pageSize = ref(3);
</script>

<template>
  <CoreMatrix title="Surfaces visual QA matrix" :columns="2">
    <div class="core-matrix-cell">
      <h4>Card · default</h4>
      <CmCard title="Release Summary">
        Default card spacing with body and footer.
        <template #footer>
          <div class="core-theme-controls">
            <CmBadge tone="success">Stable</CmBadge><CmBadge tone="primary">Core</CmBadge>
          </div>
        </template>
      </CmCard>
    </div>
    <div class="core-matrix-cell">
      <h4>Card · compact</h4>
      <CmCard title="Compact Release" compact>
        Compact card spacing for dense surfaces.
        <template #footer><CmTag tone="info">Dense</CmTag></template>
      </CmCard>
    </div>
    <div class="core-matrix-cell">
      <h4>Panel · default</h4>
      <CmPanel title="Supporting Context">Panel content with regular treatment.</CmPanel>
    </div>
    <div class="core-matrix-cell">
      <h4>Panel · subtle</h4>
      <CmPanel title="Subtle Context" subtle>Subtle panel treatment for quiet grouping.</CmPanel>
    </div>
    <div class="core-matrix-cell">
      <h4>Group · default</h4>
      <CmGroupBox title="Shipping address">1234 Elm Street, San Francisco, CA 94102</CmGroupBox>
    </div>
    <div class="core-matrix-cell">
      <h4>Group · collapsible</h4>
      <CmGroupBox title="Invoice details" collapsible>Invoice #1024 · Design service · $120.00</CmGroupBox>
    </div>
    <div v-for="{ title, props, headers, rows: tableRows } in tableExamples" :key="title" class="core-matrix-cell">
      <h4>Table · {{ title }}</h4>
      <CmTable v-bind="props" :class="{ 'core-scroll-table': props.stickyHeader }">
        <template #header
          ><tr>
            <th v-for="label in headers" :key="label" scope="col">{{ label }}</th>
          </tr></template
        >
        <tr v-for="row in tableRows" :key="row[0]">
          <td v-for="(cell, index) in row" :key="index">{{ cell }}</td>
        </tr>
        <template v-if="props.caption" #footer
          ><tr>
            <td :colspan="headers.length">Total: 5 members</td>
          </tr></template
        >
      </CmTable>
    </div>
    <template v-for="{ id, title, props } in dataExamples" :key="id">
      <CoreResizableTable v-if="id === 'selection'" :columns="columns" :rows="rows" />
      <div v-if="id === 'selection'" class="core-matrix-cell core-matrix-wide">
        <h4>Data table · column order</h4>
        <div class="core-theme-controls">
          <CmButton
            size="sm"
            variant="secondary"
            :disabled="columnOrder.every((key, index) => key === columns[index].key)"
            @click="columnOrder = columns.map(({ key }) => key)"
            >Reset order</CmButton
          >
        </div>
        <p>Use the arrow buttons to move a column. Reset restores the declared order.</p>
        <div class="core-theme-controls">
          <div v-for="(column, index) in orderedColumns" :key="column.key" class="core-column-controls">
            <span>{{ column.header }}</span>
            <CmButton
              size="sm"
              variant="secondary"
              :disabled="index === 0"
              :aria-label="'Move ' + column.header + ' left'"
              @click="moveColumn(index, -1)"
              >‹</CmButton
            >
            <CmButton
              size="sm"
              variant="secondary"
              :disabled="index === orderedColumns.length - 1"
              :aria-label="'Move ' + column.header + ' right'"
              @click="moveColumn(index, 1)"
              >›</CmButton
            >
          </div>
        </div>
        <CmDataTable
          id="core-data-column-order"
          caption="Reorderable team roster"
          :columns="orderedColumns"
          :rows="rows"
          striped
          column-dividers
        />
      </div>
      <div v-if="id === 'sticky'" class="core-matrix-cell">
        <h4>Table · slots and footer</h4>
        <CmTable>
          <template #header>
            <tr>
              <th scope="col">Member</th>
              <th scope="col">Status</th>
              <th scope="col">Tasks open</th>
            </tr>
          </template>
          <tr v-for="row in metricRows.slice(0, 5)" :key="row.id">
            <td>{{ row.cells.member }}</td>
            <td>
              <CmBadge
                :tone="
                  row.cells.status === 'Available' ? 'success' : row.cells.status === 'Busy' ? 'warning' : 'neutral'
                "
                >{{ row.cells.status }}</CmBadge
              >
            </td>
            <td>{{ row.cells.tasks }}</td>
          </tr>
          <template #footer
            ><tr>
              <td colspan="3">Total: 43 open tasks</td>
            </tr></template
          >
        </CmTable>
      </div>
      <div v-if="id === 'sticky'" class="core-matrix-cell">
        <h4>Table · expandable rows</h4>
        <CmTable striped>
          <template #header
            ><tr>
              <th scope="col">Member</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
            </tr></template
          >
          <tr v-for="row in rosterRows.slice(0, 5)" :key="row.id">
            <th scope="row">
              <details :open="row.id === 'member-2'">
                <summary>{{ row.cells.member }}</summary>
                <a :href="'mailto:' + String(row.cells.member).toLowerCase() + '@example.com'"
                  >{{ String(row.cells.member).toLowerCase() }}@example.com</a
                >
                <p v-if="row.id === 'member-2'">Preparing the next infrastructure release.</p>
              </details>
            </th>
            <td>{{ row.cells.role }}</td>
            <td>{{ row.cells.status }}</td>
          </tr>
        </CmTable>
      </div>
      <div v-if="id === 'loading'" class="core-matrix-cell">
        <h4>Table · pinned columns</h4>
        <p>Scroll horizontally to keep Member and Actions visible.</p>
        <CmTable class="core-pinned-table" striped column-dividers>
          <template #header>
            <tr>
              <th v-for="column in columns" :key="column.key" scope="col">{{ column.header }}</th>
              <th scope="col">Actions</th>
            </tr>
          </template>
          <tr v-for="row in rows.slice(0, 5)" :key="row.id">
            <td v-for="column in columns" :key="column.key">{{ row.cells[column.key] }}</td>
            <td><CmButton size="sm" variant="ghost" href="#forms">Edit</CmButton></td>
          </tr>
        </CmTable>
      </div>
      <div v-if="id === 'error'" class="core-matrix-cell">
        <h4>Table · skeleton</h4>
        <CmTable :aria-busy="true" aria-label="Team workload loading">
          <template #header
            ><tr>
              <th v-for="column in metricColumns" :key="column.key" scope="col">{{ column.header }}</th>
            </tr></template
          >
          <tr v-for="n in 4" :key="n" aria-hidden="true">
            <td v-for="column in metricColumns" :key="column.key"><CmSkeleton min-height="0.75rem" /></td>
          </tr>
        </CmTable>
      </div>
      <div class="core-matrix-cell" :class="{ 'core-matrix-wide': id === 'sorting' }">
        <h4>Data table · {{ title }}</h4>
        <div v-if="id === 'columns'" class="core-theme-controls">
          <CmColumnChooser
            id="core-column-chooser"
            v-model:visible-column-keys="visible"
            :columns="columns"
            :required-column-keys="['member']"
          />
          <span>Member is always visible</span>
        </div>
        <p v-if="id === 'sorting'">Select a column header to change the sort order.</p>
        <CmDataTable
          :id="'core-data-' + id"
          v-bind="{ columns: rosterColumns, ...props }"
          :rows="
            id === 'pagination'
              ? paginationRows.slice((page - 1) * pageSize, page * pageSize)
              : id === 'sorting'
                ? sortedRows.slice((sortPage - 1) * sortPageSize, sortPage * sortPageSize)
                : (props?.rows ?? rosterRows)
          "
          :page="id === 'pagination' ? page : id === 'sorting' ? sortPage : undefined"
          :page-size="id === 'pagination' ? pageSize : id === 'sorting' ? sortPageSize : undefined"
          :page-count="
            id === 'pagination'
              ? Math.ceil(paginationRows.length / pageSize)
              : id === 'sorting'
                ? Math.ceil(rows.length / sortPageSize)
                : undefined
          "
          :visible-column-keys="id === 'columns' ? visible : undefined"
          :selected-row-ids="id === 'selection' ? selection : undefined"
          :sort="id === 'sorting' ? sort : undefined"
          :error="id === 'error' && dataError"
          :class="{ 'core-scroll-table': props?.stickyHeader }"
          @update:selected-row-ids="selection = $event"
          @update:sort="
            sort = $event;
            sortPage = 1;
          "
          @update:page="id === 'sorting' ? (sortPage = $event) : (page = $event)"
          @update:page-size="
            if (id === 'sorting') {
              sortPageSize = $event;
              sortPage = 1;
            } else {
              pageSize = $event;
              page = 1;
            }
          "
        />
        <div v-if="id === 'selection'" class="core-theme-controls">
          <span aria-live="polite">{{ selection.length }} rows selected</span>
          <span>Offline rows are unavailable</span>
          <CmButton size="sm" variant="secondary" :disabled="!selection.length" @click="selection = []"
            >Clear selection</CmButton
          >
        </div>
        <CmButton v-if="id === 'error'" size="sm" variant="secondary" @click="dataError = !dataError">
          {{ dataError ? 'Try again' : 'Show error state' }}
        </CmButton>
        <p v-if="id === 'sorting'" aria-live="polite">
          Sort: <code>{{ sort ? sort.key + ' ' + sort.direction : 'none' }}</code>
        </p>
      </div>
    </template>
    <div class="core-matrix-cell">
      <h4>Divider · rhythm</h4>
      <p>Above</p>
      <CmDivider />
      <div class="core-theme-controls">Left <CmDivider orientation="vertical" /> Right</div>
    </div>
  </CoreMatrix>
</template>
