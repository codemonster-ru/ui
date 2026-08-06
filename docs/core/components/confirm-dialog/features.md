# Features

## Import

```ts
import { VfConfirmDialog } from '@codemonster-ru/vueforge-core/confirm-dialog';
```

```vue
<VfConfirmDialog
  v-model:open="confirmingDelete"
  title="Delete user?"
  description="This action cannot be undone."
  confirm-label="Delete"
  :loading="deleting"
  :close-on-confirm="false"
  @confirm="deleteUser"
/>
```

While loading, confirmation, cancellation, close controls, Escape, and overlay dismissal are
disabled. Set `closeOnConfirm` to `false` for asynchronous actions and close the controlled dialog
after the action succeeds. Header and footer dividers are shown by default to match `VfDialog`;
set `dividers` to `false` for a more compact surface. Initial focus defaults to the safer cancel
action; use `initialFocus="confirm"` for low-risk confirmations or `initialFocus="dialog"` to focus
the dialog surface.
