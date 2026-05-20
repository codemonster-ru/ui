# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `VfNavMenuItem[]` | — | Required prop. |
| `modelValue?` | `string` | — | Controlled current value. |
| `defaultValue?` | `string` | — | Initial uncontrolled value. |
| `ariaLabel?` | `string` | `Navigation` | Accessible label for screen readers. |
| `expandMode?` | `'multiple' \| 'single'` | `multiple` | Defines whether multiple groups can be expanded simultaneously. |
| `variant?` | `'default' \| 'pills'` | `default` | Visual variant for component appearance. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:modelValue` | `[value: string]` | `void` | Emitted with next model value. |
| `change` | `[value: string]` | `void` | Emitted when current value changes. |
| `select` | `[item: VfNavMenuItem]` | `void` | Emitted when item is selected. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No public slots. Rendering is driven by the `items` tree. |

## Events

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `VfNavMenuItem` | `interface` | `—` | Navigation menu node definition with optional nested children. |

## Types

| Name | Values |
| --- | --- |
| `—` | `—` |
