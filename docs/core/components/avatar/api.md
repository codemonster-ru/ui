# API

Public component contract: props, events, slots, and related types.

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `image` | `string` | `undefined` | Image URL. Takes precedence over other content. |
| `imageAlt` | `string` | `''` | Alternative text for `image`. |
| `label` | `string` | `undefined` | Text fallback, usually initials. |
| `icon` | `IconName \| string` | `undefined` | Icon name from VueForge Icons. |
| `size` | `VfControlSize` | `'md'` | Size token for dimensions. |
| `shape` | `'square' \| 'circle'` | `'square'` | Avatar shape. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `default` | `—` | `void` | Custom fallback content when `image`, `label`, and `icon` are absent. |

## Events

| Name | Type | Description |
| --- | --- | --- |
| `—` | `—` | No additional native events are documented. |

## Interfaces

| Name | Type | Default | Description |
| --- | --- | --- |
| `—` | `—` | `—` | No dedicated interfaces in this component contract. |

## Types

| Name | Values |
| --- | --- |
| `IconName` | Union of generated icon names. |
| `VfAvatarShape` | `'square' \| 'circle'` |
| `VfControlSize` | `'sm' \| 'md' \| 'lg'` |
