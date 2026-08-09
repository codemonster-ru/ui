# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name                | Type                 | Default                                               | Description                                                                        |
| ------------------- | -------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `icon?`             | `IconName \| string` | `moon`                                                | Icon name or custom icon identifier.                                               |
| `family?`           | `IconFamily`         | `classic`                                             | Selects the Classic or Duotone rendering family.                                   |
| `variant?`          | `IconVariant`        | `regular` for system icons; `solid` for brands        | Selects `solid`, `regular`, `light`, or `thin` when supported by the icon.         |
| `secondaryColor?`   | `string`             | Theme variable or `currentColor`                      | Overrides the secondary paint used by Duotone icons.                               |
| `secondaryOpacity?` | `number \| string`   | Theme variable or `0.4`                               | Sets Duotone secondary-paint opacity from `0` through `1`.                         |
| `size?`             | `number \| string`   | `var(--vf-icon-current-size, var(--vf-icon-size-md))` | Explicit size, or the contextual icon size with the medium icon token as fallback. |
| `spin?`             | `boolean`            | `false`                                               | Applies continuous rotation animation.                                             |
| `inset?`            | `number`             | `0`                                                   | Scales icon with optical inset compensation.                                       |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description      |
| ---- | ---------- | ---------- | ---------------- |
| `—`  | `—`        | `void`     | No custom emits. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description      |
| ---- | ---------- | ---------- | ---------------- |
| `—`  | `—`        | `void`     | No public slots. |

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

| Name                | Values                                                      |
| ------------------- | ----------------------------------------------------------- |
| `IconName`          | `Union of generated icon names.`                            |
| `IconFamily`        | `classic \| duotone`                                        |
| `IconVariant`       | `solid \| regular \| light \| thin`                         |
| `IconCatalogEntry`  | `{ title; keywords; variants; style (deprecated); brand? }` |
| `IconShowcaseEntry` | `{ icon; status; note }`                                    |
