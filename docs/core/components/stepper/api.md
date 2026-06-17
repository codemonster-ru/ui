# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `VfStepperItem[]` | — | Collection of steps rendered by the component. |
| `modelValue?` | `string` | — | Controlled current value. |
| `defaultValue?` | `string` | — | Initial uncontrolled value. |
| `orientation?` | `VfStepperOrientation` | `'horizontal'` | Stepper axis. |
| `contentPosition?` | `VfStepperContentPosition` | orientation-aware | Position of step content relative to marker. For `horizontal`, `above` is supported and other values resolve to `below`. For `vertical`, `start` is supported and other values resolve to `end`. |
| `ariaLabel?` | `string` | `'Progress'` | Accessible label for the navigation landmark. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:modelValue` | `[value: string]` | `void` | Emitted with next active step value. |
| `change` | `[value: string]` | `void` | Emitted when active step changes. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `—` | No public slots are documented. |

## Events

Native DOM events exposed by the component.

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

Exported interfaces related to this component.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `VfStepperItem` | `interface` | `—` | Step item definition with `value`, `label`, optional `description`, and optional `disabled` state. |

## Types

Exported utility and union types.

| Name | Values |
| --- | --- |
| `VfStepperOrientation` | `'horizontal' \| 'vertical'` |
| `VfStepperContentPosition` | `'above' \| 'below' \| 'start' \| 'end'` |
