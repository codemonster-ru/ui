# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue?` | `string` | `''` | Controlled current value. |
| `size?` | `VfControlSize` | `md` | Size token for spacing and dimensions. |
| `invalid?` | `boolean` | `false` | Marks control as invalid for visual/error state styling. |
| `leadingIcon?` | `IconName \| string` | — | Icon rendered before input text. |
| `trailingIcon?` | `IconName \| string` | — | Icon rendered after input text. |
| `clearable?` | `boolean` | `false` | Shows a clear-action control when value is present. |

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
| `—` | `—` | `—` | No dedicated interfaces in this component contract. |

## Types

| Name | Values |
| --- | --- |
| `IconName` | `Union of generated icon names.` |
| `VfControlSize` | `'sm' \| 'md' \| 'lg'` |
