# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue?` | `string \| number \| boolean` | — | Controlled current value. |
| `value` | `string \| number \| boolean` | — | Radio option value emitted on selection. |
| `size?` | `VfControlSize` | `md` | Size token for spacing and dimensions. |
| `invalid?` | `boolean` | `false` | Marks control as invalid for visual/error state styling. |
| `disabled?` | `boolean` | `false` | Disables user interaction. |
| `label?` | `string` | — | Accessible label text. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:modelValue` | `[value: string \| number \| boolean]` | `void` | Emitted with next model value. |
| `change` | `[value: string \| number \| boolean]` | `void` | Emitted when current value changes. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `default` | `—` | `void` | label content |

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
| `VfControlSize` | `'sm' \| 'md' \| 'lg'` |
