# Confirm dialog recipe

`VfConfirmDialog` does not need another portable component. Compose `CmDialog` and `CmButton`, and
keep the confirmation request, destructive-action policy, error handling, and close decision in
the application. The shared components own modal focus containment, focus restoration, disabled
button semantics, and the loading presentation.

## Vue

This complete example focuses Cancel on open, locks every dismissal path while the request is in
flight, closes only after success, and leaves the dialog open with an application error after
failure:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CmButton, CmDialog } from '@codemonster-ru/ui-vue';

const open = ref(false);
const busy = ref(false);
const error = ref<string | null>(null);

async function deleteProject(): Promise<void> {
  await Promise.resolve();
}

function cancel(): void {
  if (busy.value) return;
  open.value = false;
  error.value = null;
}

async function confirm(): Promise<void> {
  if (busy.value) return;

  busy.value = true;
  error.value = null;
  try {
    await deleteProject();
    open.value = false;
  } catch {
    error.value = 'The project could not be deleted. Try again.';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <CmButton variant="danger" @click="open = true">Delete project</CmButton>

  <CmDialog
    id="delete-project"
    v-model:open="open"
    title="Delete project?"
    description="This action cannot be undone."
    size="sm"
    dividers
    :dismissible="!busy"
  >
    <p v-if="error" role="alert">{{ error }}</p>

    <template #footer>
      <CmButton variant="secondary" :disabled="busy" autofocus @click="cancel">Cancel</CmButton>
      <CmButton variant="danger" :loading="busy" @click="confirm">Delete</CmButton>
    </template>
  </CmDialog>
</template>
```

`autofocus` is intentionally on the safe action. `CmDialog` prefers an authored autofocus target
when it opens and restores focus to the invoking control when it closes. `dismissible=false` locks
Escape and the component close button; disabling Cancel closes the remaining user-dismissal path.
The application must still deduplicate the request and decide whether success closes the dialog.

Do not reproduce `closeOnConfirm`: awaiting the operation and assigning `open=false` after success
makes the policy explicit. Teleport placement and backdrop dismissal are not part of the portable
Dialog contract.

## Annabel Razor

For a normal server submission, render the same policy from application state. The POST handler
owns authorization, idempotency, the destructive operation, and redirect-or-error behavior:

```razor
<cm-button variant="danger" id="open-delete-project">Delete project</cm-button>

<cm-dialog
    id="delete-project"
    title="Delete project?"
    description="This action cannot be undone."
    size="sm"
    :open="$confirmOpen"
    :dismissible="!$deleting"
    :dividers="true"
>
    @if ($deleteError)
        <p role="alert">{{ $deleteError }}</p>
    @endif

    <razor-slot name="footer">
        <cm-button
            variant="secondary"
            :disabled="$deleting"
            autofocus
            data-cm-dialog-close
        >Cancel</cm-button>
        <form method="post" action="/projects/{{ $project->id }}/delete">
            <cm-button type="submit" variant="danger" :loading="$deleting">Delete</cm-button>
        </form>
    </razor-slot>
</cm-dialog>
```

Register `createCmDialogController` as described in [Overlay components](../components/overlays.md).
The application-owned trigger sends `cm:dialog-open-request`. The built-in
`data-cm-dialog-close` hook provides Cancel and respects the same dismissal lock. If submission is
upgraded to `fetch`, the application must set its busy state before the request, prevent duplicate
submissions, keep `data-cm-dialog-dismissible` and action disabled states synchronized, and send
`cm:dialog-close-request` only after success. Those workflow transitions deliberately do not live
in the shared runtime.
