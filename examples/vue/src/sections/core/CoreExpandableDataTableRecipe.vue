<script setup lang="ts">
import { CmIconButton, CmTable } from '@codemonster-ru/ui-vue';
import '@codemonster-ru/ui-css/icon-button.css';
import '@codemonster-ru/ui-css/table.css';

export type CoreExpandableDataTableRowId = string | number;

const props = withDefaults(
  defineProps<{
    expandedIds?: readonly CoreExpandableDataTableRowId[];
  }>(),
  {
    expandedIds: () => [],
  },
);

const emit = defineEmits<{
  'update:expandedIds': [ids: CoreExpandableDataTableRowId[]];
}>();

const rows = [
  {
    id: 1,
    member: 'Alice',
    role: 'Design',
    status: 'Available',
    email: 'alice@example.com',
    lastActivity: '10 minutes ago',
    note: 'Reviewing the new dashboard flow.',
  },
  {
    id: 2,
    member: 'Bob',
    role: 'Platform',
    status: 'Busy',
    email: 'bob@example.com',
    lastActivity: '25 minutes ago',
    note: 'Preparing the next infrastructure release.',
  },
  {
    id: 3,
    member: 'Carol',
    role: 'Product',
    status: 'Available',
    email: 'carol@example.com',
    lastActivity: '1 hour ago',
    note: 'Collecting feedback for the roadmap.',
  },
  {
    id: 4,
    member: 'Diego',
    role: 'Design',
    status: 'Away',
    email: 'diego@example.com',
    lastActivity: 'Yesterday',
    note: 'Out for a customer research session.',
  },
  {
    id: 5,
    member: 'Eve',
    role: 'QA',
    status: 'Offline',
    email: 'eve@example.com',
    lastActivity: '2 days ago',
    note: 'Documenting regression scenarios.',
  },
] as const;

function detailsId(id: CoreExpandableDataTableRowId): string {
  return `core-expandable-table-details-${encodeURIComponent(String(id))}`;
}

function isExpanded(id: CoreExpandableDataTableRowId): boolean {
  return props.expandedIds.includes(id);
}

function toggle(id: CoreExpandableDataTableRowId): void {
  const nextIds = isExpanded(id)
    ? props.expandedIds.filter((expandedId) => expandedId !== id)
    : [...new Set([...props.expandedIds, id])];
  emit('update:expandedIds', nextIds);
}
</script>

<template>
  <CmTable class="demo-application-expandable-table">
    <template #header>
      <tr>
        <th class="demo-application-expandable-table__expansion-cell" scope="col">
          <span class="demo-application-expandable-table__sr-only">Details</span>
        </th>
        <th scope="col">Member</th>
        <th scope="col">Role</th>
        <th scope="col">Status</th>
      </tr>
    </template>

    <template v-for="(row, index) in rows" :key="row.id">
      <tr
        class="demo-application-expandable-table__data-row"
        :class="index % 2 === 1 && 'demo-application-expandable-table__row--striped'"
        :data-core-expandable-row="row.id"
      >
        <td class="demo-application-expandable-table__expansion-cell">
          <CmIconButton
            class="demo-application-expandable-table__trigger"
            :label="`${isExpanded(row.id) ? 'Collapse' : 'Expand'} row ${index + 1}`"
            size="sm"
            variant="ghost"
            :aria-expanded="isExpanded(row.id)"
            :aria-controls="detailsId(row.id)"
            @click="toggle(row.id)"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5.75 8.75 12 15 18.25 8.75"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </CmIconButton>
        </td>
        <td>{{ row.member }}</td>
        <td>{{ row.role }}</td>
        <td>{{ row.status }}</td>
      </tr>
      <tr
        v-if="isExpanded(row.id)"
        :id="detailsId(row.id)"
        class="demo-application-expandable-table__details-row"
        :class="index % 2 === 1 && 'demo-application-expandable-table__row--striped'"
      >
        <td colspan="4">
          <dl class="demo-application-expandable-table__details">
            <div>
              <dt>Email</dt>
              <dd>{{ row.email }}</dd>
            </div>
            <div>
              <dt>Last activity</dt>
              <dd>{{ row.lastActivity }}</dd>
            </div>
            <div>
              <dt>Note</dt>
              <dd>{{ row.note }}</dd>
            </div>
          </dl>
        </td>
      </tr>
    </template>
  </CmTable>
</template>

<style scoped>
.demo-application-expandable-table__expansion-cell {
  width: 1%;
  white-space: nowrap;
}

.demo-application-expandable-table__trigger :deep(svg) {
  transition: transform var(--cm-motion-duration-fast) var(--cm-motion-ease-standard);
}

.demo-application-expandable-table__trigger[aria-expanded='false'] :deep(svg) {
  transform: rotate(-90deg);
}

.demo-application-expandable-table__trigger[aria-expanded='false']:dir(rtl) :deep(svg) {
  transform: rotate(90deg);
}

.demo-application-expandable-table__row--striped > td {
  background: color-mix(in srgb, var(--cm-color-background-surface) 65%, var(--cm-color-background-surface-hover) 35%);
}

.demo-application-expandable-table__details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--cm-space-4);
  margin: 0;
}

.demo-application-expandable-table__details div {
  display: grid;
  gap: calc(var(--cm-space-4) * 0.5);
}

.demo-application-expandable-table__details dt {
  color: var(--cm-color-text-muted);
  font-size: var(--cm-font-size-sm);
}

.demo-application-expandable-table__details dd {
  margin: 0;
  color: var(--cm-color-text-primary);
}

.demo-application-expandable-table__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

@media (width <= 960px) {
  .demo-application-expandable-table__details {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .demo-application-expandable-table__trigger :deep(svg) {
    transition: none;
  }
}
</style>
