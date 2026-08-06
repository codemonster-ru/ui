# API

## Props

| Name          | Type                                        | Default              | Description                     |
| ------------- | ------------------------------------------- | -------------------- | ------------------------------- |
| `mode?`       | `'stacked' \| 'horizontal' \| 'responsive'` | `'stacked'`          | Field arrangement.              |
| `labelWidth?` | `string`                                    | `minmax(10rem, 25%)` | CSS grid track used for labels. |

## Slots

| Name      | Parameters | ReturnType | Description              |
| --------- | ---------- | ---------- | ------------------------ |
| `default` | `[]`       | `void`     | Form fields and content. |

Native attributes are forwarded to the root element.

## Types

`VfFormLayoutMode` is exported from the package root.
