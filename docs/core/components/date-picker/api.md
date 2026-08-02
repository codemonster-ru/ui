# API

Public component contract: props, events, model formats, and related types.

## Props

| Name               | Type                                     | Default          | Description                                                                              |
| ------------------ | ---------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `modelValue?`      | `string \| string[]`                     | `''`             | Controlled value. Array values are used by `multiple` and `range`.                       |
| `min?`             | `string`                                 | —                | Inclusive lower boundary in the active model format.                                     |
| `max?`             | `string`                                 | —                | Inclusive upper boundary in the active model format.                                     |
| `multiple?`        | `boolean`                                | `false`          | Allows toggling multiple values without closing the picker.                              |
| `range?`           | `boolean`                                | `false`          | Selects a sorted start/end pair. Range mode takes precedence over `multiple`.            |
| `monthPicker?`     | `boolean`                                | `false`          | Selects months and uses `YYYY-MM` values.                                                |
| `yearPicker?`      | `boolean`                                | `false`          | Selects years and uses `YYYY` values. Year mode takes precedence over month mode.        |
| `showTime?`        | `boolean`                                | `false`          | Adds hour/minute controls and emits `YYYY-MM-DDTHH:mm`; ignored in month and year modes. |
| `minuteStep?`      | `number`                                 | `1`              | Minute interval, normalized to an integer from 1 through 60.                             |
| `locale?`          | `string \| string[]`                     | runtime locale   | Locale preference passed to `Intl.DateTimeFormat`.                                       |
| `displayFormat?`   | `string`                                 | localized        | Display pattern using `yyyy`, `yy`, `MM`, `M`, `dd`, `d`, `HH`, `H`, `mm`, and `m`.      |
| `firstDayOfWeek?`  | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6`        | `1`              | First weekday, where `0` is Sunday and `1` is Monday.                                    |
| `size?`            | `'sm' \| 'md' \| 'lg'`                   | `'md'`           | Trigger size.                                                                            |
| `invalid?`         | `boolean`                                | `false`          | Applies invalid styling and `aria-invalid`.                                              |
| `disabled?`        | `boolean`                                | `false`          | Disables the trigger and generated hidden form controls.                                 |
| `readonly?`        | `boolean`                                | `false`          | Prevents opening, clearing, and value changes while preserving the value.                |
| `clearable?`       | `boolean`                                | `false`          | Shows a clear action when a value is present.                                            |
| `placeholder?`     | `string`                                 | —                | Text shown while the value is empty outside a floating-label field.                      |
| `placement?`       | `'bottom-start' \| 'bottom-end'`         | `'bottom-start'` | Preferred floating placement; the calendar may flip above the trigger.                   |
| `teleportTo?`      | `string \| HTMLElement \| null \| false` | `document.body`  | Calendar teleport target. Use `null` or `false` to render beside the trigger.            |
| `disableTeleport?` | `boolean`                                | `false`          | Disables teleporting regardless of `teleportTo`.                                         |
| `labels?`          | `Partial<VfDatePickerLabels>`            | `{}`             | Overrides visible and accessible calendar labels.                                        |

Standard `id`, `name`, `class`, `style`, `title`, `tabindex`, `aria-*`, and `data-*` attributes
are supported. A string `name` creates hidden form inputs containing the unchanged model values.

## Emits

| Name                | Parameters                    | ReturnType | Description                                    |
| ------------------- | ----------------------------- | ---------- | ---------------------------------------------- |
| `update:modelValue` | `[value: string \| string[]]` | `void`     | Emitted whenever the controlled value changes. |

## Slots

`VfDatePicker` has no public slots.

## Model formats

| Mode                       | Value format           | Empty value |
| -------------------------- | ---------------------- | ----------- |
| Default day picker         | `YYYY-MM-DD`           | `''`        |
| Day picker with `showTime` | `YYYY-MM-DDTHH:mm`     | `''`        |
| `monthPicker`              | `YYYY-MM`              | `''`        |
| `yearPicker`               | `YYYY`                 | `''`        |
| `multiple` or `range`      | Array of active format | `[]`        |

Display localization and `displayFormat` never change these model or form-submission values.

## Types

### `VfDatePickerLabels`

The `labels` prop accepts a partial object. Omitted values retain the built-in English labels.

| Name              | Type     | Default             |
| ----------------- | -------- | ------------------- |
| `calendar`        | `string` | `'Choose date'`     |
| `clear`           | `string` | `'Clear date'`      |
| `previousMonth`   | `string` | `'Previous month'`  |
| `nextMonth`       | `string` | `'Next month'`      |
| `previousYear?`   | `string` | `'Previous year'`   |
| `nextYear?`       | `string` | `'Next year'`       |
| `previousDecade?` | `string` | `'Previous decade'` |
| `nextDecade?`     | `string` | `'Next decade'`     |
| `time`            | `string` | `'Time'`            |
| `hour`            | `string` | `'Hour'`            |
| `minute`          | `string` | `'Minute'`          |
