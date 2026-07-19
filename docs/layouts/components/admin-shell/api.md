# API

## Props

| Name            | Type      | Default | Description                                        |
| --------------- | --------- | ------- | -------------------------------------------------- |
| `as?`           | `string`  | `div`   | Underlying HTML tag name.                          |
| `fillViewport?` | `boolean` | `true`  | Expands the shell to at least the viewport height. |

## Slots

| Name             | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `brand`          | Product identity at the start of the global topbar.                         |
| `header`         | Breadcrumbs, current workspace, or other central topbar content.            |
| `header-actions` | Search, locale, account, and other global actions at the end of the topbar. |
| `sidebar`        | Administrative navigation below the topbar.                                 |
| `default`        | Main workspace content.                                                     |
| `footer`         | Footer inside the workspace.                                                |
