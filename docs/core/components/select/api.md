# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue?` | `string` | `''` | Controlled current value. |
| `options` | `VfSelectOption[]` | — | Required options list. |
| `size?` | `VfControlSize` | `md` | Size token for spacing and dimensions. |
| `invalid?` | `boolean` | `false` | Marks the control as invalid for visual state and `aria-invalid`; error text should be rendered through `VfField`. |
| `clearable?` | `boolean` | `false` | Shows a clear-action control when value is present. |
| `placeholder?` | `string` | — | Placeholder text when empty. |
| `disabled?` | `boolean` | `false` | Disables user interaction. |
| `placement?` | `VfDropdownPlacement` | `bottom-start` | Controls floating panel placement relative to trigger. |
| `teleportTo?` | `string \| HTMLElement \| null \| false` | — | Teleport target selector/element; `null`/`false` disables teleport resolution. |
| `disableTeleport?` | `boolean` | `false` | Forces in-place rendering without teleport. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:modelValue` | `[value: string]` | `void` | Emitted with next model value. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `leading` | `—` | `void` | custom leading adornment |
| `trailing` | `—` | `void` | custom trailing adornment |

## Events

Native DOM events exposed by the component.

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

Exported interfaces related to this component.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `VfSelectOption` | `interface` | `—` | Selectable option item with value/label and optional disabled state. |

## Types

Exported utility and union types.

| Name | Values |
| --- | --- |
| `VfControlSize` | `'sm' \| 'md' \| 'lg'` |
| `VfDropdownPlacement` | `'bottom-start' \| 'bottom-end'` |
