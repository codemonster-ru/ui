# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `VfTabItem[]` | — | Collection of items rendered by the component. |
| `modelValue?` | `string` | — | Controlled current value. |
| `defaultValue?` | `string` | — | Initial uncontrolled value. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `update:modelValue` | `[value: string]` | `void` | Emitted with next model value. |
| `change` | `[value: string]` | `void` | Emitted when current value changes. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `tab` | `[scope: { item: VfTabItem; isActive: boolean; index: number }]` | `void` | custom tab node (`{ item, isActive, index }`) |
| `panel` | `[scope: { activeValue: string \| undefined }]` | `void` | custom panel node (`{ activeValue }`) |

## Events

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `VfTabItem` | `interface` | `—` | Tab item definition with value/label and optional disabled state. |

## Types

| Name | Values |
| --- | --- |
| `—` | `—` |
