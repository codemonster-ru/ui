# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `href?` | `string` | — | Native link URL target. |
| `to?` | `string \| Record<string, unknown>` | — | Router location target when using router-aware mode. |
| `target?` | `string` | — | Native link target attribute (for example `_blank`). |
| `rel?` | `string` | — | Native link `rel` attribute value. |
| `underline?` | `VfLinkUnderline` | `none` | Underline display behavior for link text. |
| `tone?` | `VfLinkTone` | `default` | Visual tone variant. |
| `component?` | `string \| Component` | Vue component rendered in component mode. | Custom root/link component used for rendering. |

## Emits

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No public slots. |

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
| `VfLinkTone` | `'default' \| 'muted'` |
| `VfLinkUnderline` | `'none' \| 'hover' \| 'always'` |
