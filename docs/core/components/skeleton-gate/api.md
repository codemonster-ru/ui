# API

Public component contract: props, events, slots, and related types.

## Props

Component props and their default values.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `ready?` | `boolean` | `false` | Toggles from placeholder overlay to content. |
| `minHeight?` | `string \| number` | `undefined` | Minimum container height (number treated as px). |
| `reserveHeight?` | `string \| number` | `undefined` | Fixed estimated height for placeholder state (number treated as px). |
| `preserveLastHeight?` | `boolean` | `false` | Reuses the last measured content height when switching back to skeleton state. |
| `normalizeContentSpacing?` | `boolean` | `false` | Removes top/bottom outer spacing on direct children while content is inside gate (helps avoid skeleton/content height jumps). |
| `radius?` | `string` | `var(--vf-radius-overlay)` | Shared border radius for content and overlay. |
| `fadeDuration?` | `number` | `220` | Fade transition duration in milliseconds. |

## Emits

Emitted component events and their payload shapes.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `—` | `—` | `—` | No custom emits are documented. |

## Slots

Available slots and their slot props.

| Name | Parameters | ReturnType | Description |
| --- | --- | --- | --- |
| `default` | `—` | `void` | Content rendered when ready state is true. |
| `skeleton` | `—` | `void` | Optional placeholder overlay content. |
