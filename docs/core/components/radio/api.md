# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue?` | `string \| number \| boolean` | — | Controlled current value. |
| `value` | `string \| number \| boolean` | — | Radio option value emitted on selection. |
| `size?` | `VfControlSize` | `md` | Size token for spacing and dimensions. |
| `invalid?` | `boolean` | `false` | Marks the control as invalid for visual state and `aria-invalid`; group-level error text should be rendered through `VfFieldset`. |
| `disabled?` | `boolean` | `false` | Disables user interaction. |
| `label?` | `string` | — | Visible inline label content for the radio option. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:modelValue` | `[value: string \| number \| boolean]` | `void` | Emitted with next model value. |
| `change` | `[value: string \| number \| boolean]` | `void` | Emitted when current value changes. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `default` | `—` | `void` | label content |

## Events

Native DOM events exposed by the component.

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

Exported interfaces related to this component.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `—` | `—` | `—` | No dedicated interfaces in this component contract. |

## Types

Exported utility and union types.

| Name | Values |
| --- | --- |
| `VfControlSize` | `'sm' \| 'md' \| 'lg'` |
