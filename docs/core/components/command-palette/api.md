# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name                      | Type                                     | Default                  | Description                                                                    |
| ------------------------- | ---------------------------------------- | ------------------------ | ------------------------------------------------------------------------------ |
| `open?`                   | `boolean`                                | —                        | Controlled open state.                                                         |
| `defaultOpen?`            | `boolean`                                | `false`                  | Initial uncontrolled open state.                                               |
| `title?`                  | `string`                                 | `Search`                 | Accessible name for the palette dialog.                                        |
| `modelValue?`             | `string`                                 | —                        | Controlled current value.                                                      |
| `defaultValue?`           | `string`                                 | `''`                     | Initial uncontrolled value.                                                    |
| `items?`                  | `unknown[]`                              | `[]`                     | Collection of items rendered by the component.                                 |
| `placeholder?`            | `string`                                 | `Search...`              | Placeholder text when empty.                                                   |
| `loading?`                | `boolean`                                | `false`                  | Replaces results with the loading status.                                      |
| `idleText?`               | `string`                                 | `Start typing to search` | Status shown before a query is entered.                                        |
| `emptyText?`              | `string`                                 | `Nothing found`          | Fallback shown when a query has no results.                                    |
| `highlightMatches?`       | `boolean`                                | `true`                   | Highlights query matches in the built-in item renderer.                        |
| `dividers?`               | `boolean`                                | `true`                   | Shows dividers between palette regions.                                        |
| `closeOnSelect?`          | `boolean`                                | `true`                   | Closes popup after selecting an item.                                          |
| `closeOnOverlayClick?`    | `boolean`                                | `true`                   | Closes the palette when its overlay is clicked.                                |
| `closeOnEscape?`          | `boolean`                                | `true`                   | Closes the palette when `Escape` is pressed.                                   |
| `maxHeight?`              | `string \| number`                       | —                        | Maximum content height; numbers are interpreted as pixels.                     |
| `teleportTo?`             | `string \| HTMLElement \| null \| false` | —                        | Teleport target selector/element; `null`/`false` disables teleport resolution. |
| `disableTeleport?`        | `boolean`                                | `false`                  | Forces in-place rendering without teleport.                                    |
| `showDefaultFooterHints?` | `boolean`                                | `true`                   | Shows built-in keyboard hints when no `footer` slot is provided.               |

## Emits

Emitted component events and their payload shapes.

| Name                | Parameters         | ReturnType | Description                              |
| ------------------- | ------------------ | ---------- | ---------------------------------------- |
| `update:open`       | `[value: boolean]` | `void`     | Emitted with next open state.            |
| `openChange`        | `[value: boolean]` | `void`     | Emitted when open state changes.         |
| `update:modelValue` | `[value: string]`  | `void`     | Emitted with next model value.           |
| `queryChange`       | `[value: string]`  | `void`     | Emitted when query value changes.        |
| `select`            | `[item: unknown]`  | `void`     | Emitted when item is selected.           |
| `submit`            | `[query: string]`  | `void`     | Emitted when submit action is triggered. |
| `close`             | `[]`               | `void`     | Emitted when palette closes.             |
| `open`              | `[]`               | `void`     | Emitted when palette opens.              |

## Slots

Available slots and their slot props.

| Name      | Parameters                                                                                                                                | ReturnType | Description                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------- |
| `actions` | `[scope: { close: () => void; query: string }]`                                                                                           | `void`     | Header actions next to the search input.      |
| `default` | `[scope: { items: unknown[]; query: string; loading: boolean; activeIndex: number; select: (item: unknown) => void; close: () => void }]` | `void`     | Replaces the complete built-in results area.  |
| `item`    | `[scope: { item: unknown; index: number; active: boolean; query: string; select: () => void }]`                                           | `void`     | gets `{ item, index, active, query, select }` |
| `empty`   | `[scope: { query: string }]`                                                                                                              | `void`     | empty state                                   |
| `footer`  | `[scope: { close: () => void; query: string; items: unknown[] }]`                                                                         | `void`     | footer area                                   |

## Events

Native DOM events exposed by the component.

| Name | Type | Description                                 |
| ---- | ---- | ------------------------------------------- |
| `—`  | `—`  | No additional native events are documented. |

## Interfaces

Exported interfaces related to this component.

| Name | Type | Default | Description                                         |
| ---- | ---- | ------- | --------------------------------------------------- |
| `—`  | `—`  | `—`     | No dedicated interfaces in this component contract. |

## Types

Exported utility and union types.

| Name | Values |
| ---- | ------ |
| `—`  | `—`    |
