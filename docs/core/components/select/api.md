# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue?` | `string` | `''` | Controlled current value. |
| `options` | `VfSelectOption[]` | — | Required options list. |
| `size?` | `VfControlSize` | `md` | Size token for spacing and dimensions. |
| `invalid?` | `boolean` | `false` | Marks control as invalid for visual/error state styling. |
| `clearable?` | `boolean` | `false` | Shows a clear-action control when value is present. |
| `placeholder?` | `string` | — | Placeholder text when empty. |
| `disabled?` | `boolean` | `false` | Disables user interaction. |
| `placement?` | `VfDropdownPlacement` | `bottom-start` | Controls floating panel placement relative to trigger. |
| `teleportTo?` | `string \| HTMLElement \| null \| false` | — | Teleport target selector/element; `null`/`false` disables teleport resolution. |
| `disableTeleport?` | `boolean` | `false` | Forces in-place rendering without teleport. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:modelValue` | `[value: string]` | `void` | Emitted with next model value. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `leading` | `—` | `void` | custom leading adornment |
| `trailing` | `—` | `void` | custom trailing adornment |

## Events

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `VfSelectOption` | `interface` | `—` | Selectable option item with value/label and optional disabled state. |

## Types

| Name | Values |
| --- | --- |
| `VfControlSize` | `'sm' \| 'md' \| 'lg'` |
| `VfDropdownPlacement` | `'bottom-start' \| 'bottom-end'` |
