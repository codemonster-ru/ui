# API

## Props

| Name                  | Type                  | Default               | Description                           |
| --------------------- | --------------------- | --------------------- | ------------------------------------- |
| `columns`             | `VfDataTableColumn[]` | —                     | Available columns and their labels.   |
| `modelValue?`         | `string[]`            | all column keys       | Controlled visible keys.              |
| `requiredColumnKeys?` | `string[]`            | `[]`                  | Keys that cannot be hidden.           |
| `disabled?`           | `boolean`             | `false`               | Disables the chooser.                 |
| `triggerLabel?`       | `string`              | `'Configure columns'` | Trigger accessible label and tooltip. |
| `allLabel?`           | `string`              | `'All columns'`       | Label for the aggregate checkbox.     |

## Emits

| Name                | Parameters          | ReturnType | Description                                      |
| ------------------- | ------------------- | ---------- | ------------------------------------------------ |
| `update:modelValue` | `[value: string[]]` | `void`     | Emits visible keys in the original column order. |

## Slots

| Name      | Parameters                                             | ReturnType | Description                       |
| --------- | ------------------------------------------------------ | ---------- | --------------------------------- |
| `trigger` | `[{ visibleColumnKeys: string[]; disabled: boolean }]` | `void`     | Replaces the default gear button. |
