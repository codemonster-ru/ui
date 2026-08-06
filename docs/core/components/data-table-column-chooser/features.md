# Features

## Import

```ts
import { VfDataTableColumnChooser } from '@codemonster-ru/vueforge-core/data-table-column-chooser';
```

```vue
<VfDataTableColumnChooser v-model="visibleColumnKeys" :columns="columns" :required-column-keys="['actions']" />
<VfDataTable :columns="columns" :visible-column-keys="visibleColumnKeys" :rows="rows" />
```

The component preserves column order and never removes required keys. Persistence remains owned by
the consumer.
