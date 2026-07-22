# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `VfTabItem[]` | — | Collection of items rendered by the component. |
| `modelValue?` | `string` | — | Controlled current value. |
| `defaultValue?` | `string` | — | Initial uncontrolled value. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:modelValue` | `[value: string]` | `void` | Emitted with next model value. |
| `change` | `[value: string]` | `void` | Emitted when current value changes. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `tab` | `[scope: { item: VfTabItem; isActive: boolean; index: number }]` | `void` | custom tab node (`{ item, isActive, index }`) |
| `panel` | `[scope: { activeValue: string }]` | `void` | Custom panel node (`{ activeValue }`). |

## Events

Native DOM events exposed by the component.

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

Exported interfaces related to this component.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `VfTabItem` | `{ value: string; label: string; disabled?: boolean; tabId?: string; panelId?: string }` | `—` | Tab definition. Stable IDs connect tabs to externally rendered panels; without an internal or external panel, `aria-controls` is omitted. |

## Types

Exported utility and union types.

| Name | Values |
| --- | --- |
| `—` | `—` |
