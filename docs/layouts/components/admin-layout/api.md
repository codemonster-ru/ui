# API

## Props

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `as?` | `string` | `div` | Underlying HTML tag name. |
| `fillViewport?` | `boolean` | `true` | Expands the layout to viewport height. |

## Slots

| Name | Parameters | Description |
| --- | --- | --- |
| `brand` | `—` | Product mark at the top of the left aside, aligned with the header height. A divider appears below it when `aside` is also provided. |
| `aside` | `—` | Left navigation column, fixed to viewport height. The aside is rendered when either `brand` or `aside` is provided. |
| `header` | `—` | Header fixed to the top of the right column. |
| `default` | `—` | Main content below the header. |
| `footer` | `—` | Footer at the bottom of the right column. |
