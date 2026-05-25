# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `VfNavMenuItem[]` | — | Required prop. |
| `modelValue?` | `string` | — | Controlled current value. |
| `defaultValue?` | `string` | — | Initial uncontrolled value. |
| `ariaLabel?` | `string` | `Navigation` | Accessible label for screen readers. |
| `expandMode?` | `'multiple' \| 'single'` | `multiple` | Defines whether multiple groups can be expanded simultaneously. |
| `variant?` | `'default' \| 'pills'` | `default` | Visual variant for component appearance. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:modelValue` | `[value: string]` | `void` | Emitted with next model value. |
| `change` | `[value: string]` | `void` | Emitted when current value changes. |
| `select` | `[item: VfNavMenuItem]` | `void` | Emitted when item is selected. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No public slots. Rendering is driven by the `items` tree. |

## Events

Native DOM events exposed by the component.

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

Exported interfaces related to this component.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `VfNavMenuItem` | `interface` | `—` | Navigation menu node definition with optional nested children. |

## Types

Exported utility and union types.

| Name | Values |
| --- | --- |
| `—` | `—` |
