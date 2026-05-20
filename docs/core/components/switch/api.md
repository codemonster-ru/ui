# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue?` | `boolean` | `false` | Controlled current value. |
| `size?` | `VfControlSize` | `md` | Size token for spacing and dimensions. |
| `static?` | `boolean` | `false` | Disables animated thumb translation while keeping state styles. |
| `thumbContrast?` | `VfSwitchThumbContrast` | `auto` | Thumb contrast strategy against current surface tone. |
| `invalid?` | `boolean` | `false` | Marks control as invalid for visual/error state styling. |
| `disabled?` | `boolean` | `false` | Disables user interaction. |
| `label?` | `string` | — | Accessible label text. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:modelValue` | `[value: boolean]` | `void` | Emitted with next model value. |
| `change` | `[value: boolean]` | `void` | Emitted when current value changes. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `default` | `—` | `void` | label content |
| `thumb` | `[scope: { checked: boolean }]` | `void` | gets `{ checked }` |

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
