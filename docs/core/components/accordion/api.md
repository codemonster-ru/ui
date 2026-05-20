# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `open?` | `boolean` | — | Controlled open state. |
| `defaultOpen?` | `boolean` | `false` | Initial uncontrolled open state. |
| `title?` | `string` | — | Text title shown in the component header area. |
| `disabled?` | `boolean` | `false` | Disables user interaction. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:open` | `[value: boolean]` | `void` | Emitted with next open state. |
| `openChange` | `[value: boolean]` | `void` | Emitted when open state changes. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `trigger` | `[scope: { open: boolean }]` | `void` | gets `{ open }` |
| `default` | `[scope: { open: boolean }]` | `void` | gets `{ open }` |

## Events

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `—` | `—` | `—` | No dedicated interfaces in this component contract. |

## Types

| Name | Values |
| --- | --- |
| `—` | `—` |
