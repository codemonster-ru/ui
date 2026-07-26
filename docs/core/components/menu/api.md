# API

## VfMenu

`VfMenu` has no component props or custom events. Its default slot renders the menu items inside a
container with `role="menu"`.

## VfMenuItem props

| Name        | Type                    | Default   | Description                                      |
| ----------- | ----------------------- | --------- | ------------------------------------------------ |
| `label`     | `string`                | —         | Visible item label.                              |
| `icon?`     | `IconName \| string`    | —         | Optional leading icon.                           |
| `disabled?` | `boolean`               | `false`   | Disables the item and removes it from tab order. |
| `active?`   | `boolean`               | `false`   | Applies the active item state.                   |
| `tone?`     | `'default' \| 'danger'` | `default` | Item visual tone.                                |
| `href?`     | `string`                | —         | Renders a link instead of a button.              |
| `target?`   | `string`                | —         | Link target when `href` is provided.             |
| `rel?`      | `string`                | —         | Link relationship when `href` is provided.       |

## VfMenuItem events

| Name     | Parameters | Description                                |
| -------- | ---------- | ------------------------------------------ |
| `select` | `—`        | Emitted when an enabled item is activated. |
