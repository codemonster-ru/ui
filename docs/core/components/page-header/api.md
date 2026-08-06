# API

## Props

| Name            | Type                 | Default | Description                          |
| --------------- | -------------------- | ------- | ------------------------------------ |
| `title?`        | `string`             | —       | Page title.                          |
| `description?`  | `string`             | —       | Supporting page description.         |
| `breadcrumbs?`  | `VfBreadcrumbItem[]` | `[]`    | Breadcrumb items above the title.    |
| `headingLevel?` | `1 \| 2 \| ... \| 6` | `1`     | Semantic level of the title element. |

## Slots

| Name          | Description                                |
| ------------- | ------------------------------------------ |
| `title`       | Custom title content.                      |
| `description` | Custom supporting content.                 |
| `breadcrumbs` | Replaces the built-in `VfBreadcrumbs`.     |
| `actions`     | Page-level actions aligned with the title. |

## Types

`VfPageHeaderHeadingLevel` is exported from the package root.
