# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `open?` | `boolean` | — | Controlled open state. |
| `defaultOpen?` | `boolean` | `false` | Initial uncontrolled open state. |
| `modelValue?` | `string` | — | Controlled current value. |
| `defaultValue?` | `string` | `''` | Initial uncontrolled value. |
| `items?` | `unknown[]` | `[]` | Collection of items rendered by the component. |
| `placeholder?` | `string` | `Search...` | Placeholder text when empty. |
| `closeOnSelect?` | `boolean` | `true` | Closes popup after selecting an item. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:open` | `[value: boolean]` | `void` | Emitted with next open state. |
| `openChange` | `[value: boolean]` | `void` | Emitted when open state changes. |
| `update:modelValue` | `[value: string]` | `void` | Emitted with next model value. |
| `queryChange` | `[value: string]` | `void` | Emitted when query value changes. |
| `select` | `[item: unknown]` | `void` | Emitted when item is selected. |
| `submit` | `[query: string]` | `void` | Emitted when submit action is triggered. |
| `close` | `[]` | `void` | Emitted when palette closes. |
| `open` | `[]` | `void` | Emitted when palette opens. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `item` | `[scope: { item: unknown; index: number; active: boolean; query: string; select: () => void }]` | `void` | gets `{ item, index, active, query, select }` |
| `empty` | `[scope: { query: string }]` | `void` | empty state |
| `footer` | `[scope: { close: () => void; query: string; items: unknown[] }]` | `void` | footer area |

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
