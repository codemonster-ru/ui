# Features

## Import

```ts
import { VfFormLayout } from '@codemonster-ru/vueforge-core/form-layout';
```

Use `mode="responsive"` to stack fields in narrow containers and place labels beside controls once
the layout container reaches `48rem`.

```vue
<VfFormLayout mode="responsive" label-width="12rem">
  <VfField label="Name">
    <template #default="{ controlId }">
      <VfInput :id="controlId" />
    </template>
  </VfField>
</VfFormLayout>
```

Only direct `VfField` children participate in the horizontal grid.
