# API

## Props

| Name               | Type                                     | Default            | Description                                       |
| ------------------ | ---------------------------------------- | ------------------ | ------------------------------------------------- |
| `open?`            | `boolean`                                | `false`            | Controlled open state.                            |
| `title?`           | `string`                                 | `'Confirm action'` | Dialog title.                                     |
| `description?`     | `string`                                 | —                  | Consequence text rendered in the body.            |
| `confirmLabel?`    | `string`                                 | `'Confirm'`        | Confirm button text.                              |
| `cancelLabel?`     | `string`                                 | `'Cancel'`         | Cancel button text.                               |
| `confirmVariant?`  | `VfButtonVariant`                        | `'danger'`         | Confirm button appearance.                        |
| `size?`            | `VfDialogSize`                           | `'sm'`             | Dialog width.                                     |
| `dividers?`        | `boolean`                                | `true`             | Shows separators around dialog content.           |
| `teleportTo?`      | `string \| HTMLElement \| null \| false` | —                  | Teleport target; `null`/`false` renders in place. |
| `disableTeleport?` | `boolean`                                | `false`            | Forces in-place rendering.                        |
| `initialFocus?`    | `VfConfirmDialogInitialFocus`            | `'cancel'`         | Initial focus target.                             |
| `loading?`         | `boolean`                                | `false`            | Locks dismissal and shows button loading.         |
| `disabled?`        | `boolean`                                | `false`            | Disables confirmation.                            |
| `closeOnConfirm?`  | `boolean`                                | `true`             | Requests closure after confirmation.              |

## Emits

| Name          | Parameters         | ReturnType | Description                              |
| ------------- | ------------------ | ---------- | ---------------------------------------- |
| `update:open` | `[value: boolean]` | `void`     | Requests a controlled open-state change. |
| `confirm`     | `[]`               | `void`     | Reports confirmation.                    |
| `cancel`      | `[]`               | `void`     | Reports dismissal without confirmation.  |

## Slots

| Name      | Parameters                       | ReturnType | Description                     |
| --------- | -------------------------------- | ---------- | ------------------------------- |
| `default` | `[]`                             | `void`     | Additional dialog body content. |
| `footer`  | `[{ confirm, cancel, loading }]` | `void`     | Replaces the default actions.   |

## Types

`VfConfirmDialogInitialFocus` is `'cancel' | 'confirm' | 'dialog'` and is exported from the package root.
