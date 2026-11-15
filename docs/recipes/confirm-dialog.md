# Confirm dialog recipe

Use a confirmation when a user needs to review the consequences before going ahead. Give
the dialog a title that names the action and place initial focus on Cancel. Keep the request,
error handling, and decision to close in the application.

## Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CmButton, CmConfirmDialog } from '@codemonster-ru/ui-vue';

const open = ref(false);
const busy = ref(false);
const error = ref('');

async function archiveDraft(): Promise<void> {
  await Promise.resolve();
}

async function confirm(): Promise<void> {
  if (busy.value) return;

  busy.value = true;
  error.value = '';
  try {
    await archiveDraft();
    open.value = false;
  } catch {
    error.value = 'The draft could not be archived. Try again.';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <CmButton variant="danger" @click="open = true">Archive draft</CmButton>
  <CmConfirmDialog
    v-model:open="open"
    title="Archive this draft?"
    description="The draft will move to your archive."
    confirm-label="Archive"
    :loading="busy"
    :close-on-confirm="false"
    @confirm="confirm"
    @cancel="error = ''"
  >
    <p v-if="error" role="alert">{{ error }}</p>
  </CmConfirmDialog>
</template>
```

`loading` locks user dismissal while the request is pending. With `close-on-confirm="false"`
bound to a Boolean, the application can keep the dialog open and report a failure. Focus returns
to the opener on dismiss.

## Vanilla HTML

Run `npm run build:vanilla` and serve `examples/vanilla/dist`. Open
`confirm-dialog-example.html` to try the simulated archive flow.
[Example HTML](../../examples/vanilla/confirm-dialog-example.html) · [Application module](../../examples/vanilla/confirm-dialog-example.mjs)

Use the native [Dialog markup](../../contracts/dialog/contract.md) and put `autofocus` on
Cancel. Initialize the Dialog controller. The example dispatches
`cm:dialog-open-request` and `cm:dialog-close-request`, and listens for
`cm:dialog-open-change`. The shared controller handles modal focus, Escape, and restoration
to the invoking button. The application owns backdrop clicks and sets
`data-cm-dialog-dismissible="false"` with disabled action buttons while its request is pending.
On failure it keeps the dialog open, announces the error, and enables retry.
