# API

Public component contract: props, events, slots, and related types.

## Props

| Name                | Type      | Default | Description                                                                |
| ------------------- | --------- | ------- | -------------------------------------------------------------------------- |
| `title?`            | `string`  | —       | Text rendered in the legend on the container border.                       |
| `collapsible?`      | `boolean` | `false` | Allows the content to be expanded and collapsed.                           |
| `collapsed?`        | `boolean` | —       | Controlled collapsed state.                                                |
| `defaultCollapsed?` | `boolean` | `false` | Initial collapsed state when uncontrolled.                                 |
| `disabled?`         | `boolean` | `false` | Disables the collapse trigger without disabling controls inside the group. |

## Emits

| Name               | Parameters         | ReturnType | Description                                       |
| ------------------ | ------------------ | ---------- | ------------------------------------------------- |
| `update:collapsed` | `[value: boolean]` | `void`     | Emitted with the requested collapsed state.       |
| `collapsedChange`  | `[value: boolean]` | `void`     | Emitted when the trigger requests a state change. |

## Slots

| Name          | Parameters                        | ReturnType | Description                                |
| ------------- | --------------------------------- | ---------- | ------------------------------------------ |
| `default`     | `[scope: { collapsed: boolean }]` | `void`     | Group content and current collapsed state. |
| `title`       | `[scope: { collapsed: boolean }]` | `void`     | Custom legend content.                     |
| `toggle-icon` | `[scope: { collapsed: boolean }]` | `void`     | Custom disclosure indicator.               |

## Events

Native DOM events and attributes are forwarded to the root `fieldset`.

## Interfaces

No dedicated public interfaces are exported.

## Types

No dedicated public utility types are exported.
