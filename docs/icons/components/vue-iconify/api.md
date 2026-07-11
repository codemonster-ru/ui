# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `icon?` | `IconName \| string` | `moon` | Icon name or custom icon identifier. |
| `size?` | `number \| string` | `var(--vf-icon-current-size, var(--vf-icon-size-md))` | Explicit size, or the contextual icon size with the medium icon token as fallback. |
| `spin?` | `boolean` | `false` | Applies continuous rotation animation. |
| `style?` | `'solid'` | `solid` | Icon visual style variant. |
| `inset?` | `number` | `0` | Scales icon with optical inset compensation. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No custom emits. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `void` | No public slots. |

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
| `IconCatalogEntry` | `{ title; keywords; style; brand? }` |
| `IconShowcaseEntry` | `{ icon; status; note }` |
