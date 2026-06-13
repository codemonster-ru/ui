# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue?` | `string` | `''` | Controlled current value. |
| `size?` | `VfControlSize` | `md` | Size token for spacing and dimensions. |
| `invalid?` | `boolean` | `false` | Marks control as invalid for visual/error state styling. |
| `leadingIcon?` | `IconName \| string` | — | Icon rendered before input text. |
| `trailingIcon?` | `IconName \| string` | — | Icon rendered after input text. |
| `clearable?` | `boolean` | `false` | Shows a clear-action control when value is present. |
| `passwordReveal?` | `boolean` | `false` | Shows a password visibility toggle when `type="password"`. |

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
| `—` | `—` | `—` | No dedicated interfaces in this component contract. |

## Types

Exported utility and union types.

| Name | Values |
| --- | --- |
| `IconName` | `Union of generated icon names.` |
| `VfControlSize` | `'sm' \| 'md' \| 'lg'` |
