# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name             | Type            | Default | Description                                                                                                        |
| ---------------- | --------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `modelValue?`    | `boolean`       | `false` | Controlled current value.                                                                                          |
| `size?`          | `VfControlSize` | `md`    | Size token for spacing and dimensions.                                                                             |
| `invalid?`       | `boolean`       | `false` | Marks the control as invalid for visual state and `aria-invalid`; error text should be rendered through `VfField`. |
| `disabled?`      | `boolean`       | `false` | Disables user interaction.                                                                                         |
| `indeterminate?` | `boolean`       | `false` | Displays the mixed-selection state and exposes `aria-checked="mixed"`; useful for select-all controls.             |
| `label?`         | `string`        | —       | Visible inline label content for the checkbox.                                                                     |

## Emits

Emitted component events and their payload shapes.

| Name                | Parameters         | ReturnType | Description                         |
| ------------------- | ------------------ | ---------- | ----------------------------------- |
| `update:modelValue` | `[value: boolean]` | `void`     | Emitted with next model value.      |
| `change`            | `[value: boolean]` | `void`     | Emitted when current value changes. |

## Slots

Available slots and their slot props.

| Name      | Parameters | ReturnType | Description   |
| --------- | ---------- | ---------- | ------------- |
| `default` | `—`        | `void`     | label content |

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

| Name            | Values                 |
| --------------- | ---------------------- |
| `VfControlSize` | `'sm' \| 'md' \| 'lg'` |
