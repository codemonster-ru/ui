# API

## Props

| Name                       | Type      | Default | Description                                   |
| -------------------------- | --------- | ------- | --------------------------------------------- |
| `as?`                      | `string`  | `div`   | Underlying HTML tag name.                     |
| `fillViewport?`            | `boolean` | `true`  | Expands the layout to viewport height.        |
| `sidebarCollapsed?`        | `boolean` | —       | Controlled sidebar collapsed state.           |
| `defaultSidebarCollapsed?` | `boolean` | `false` | Initial uncontrolled sidebar collapsed state. |

## Emits

| Name                      | Parameters         | ReturnType | Description                                         |
| ------------------------- | ------------------ | ---------- | --------------------------------------------------- |
| `update:sidebarCollapsed` | `[value: boolean]` | `void`     | Emitted with the requested sidebar collapsed state. |

## Slots

| Name      | Parameters     | Description                                                                                                                          |
| --------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `brand`   | `SidebarScope` | Product mark at the top of the left aside, aligned with the header height. A divider appears below it when `aside` is also provided. |
| `aside`   | `SidebarScope` | Left navigation column, fixed to viewport height. The aside is rendered when either `brand` or `aside` is provided.                  |
| `header`  | `SidebarScope` | Header fixed to the top of the right column.                                                                                         |
| `default` | `SidebarScope` | Main content below the header.                                                                                                       |
| `footer`  | `—`            | Footer at the bottom of the right column.                                                                                            |

`SidebarScope` contains `isSidebarCollapsed`, `collapseSidebar`, `expandSidebar`, and
`toggleSidebarCollapsed`.

## Exposed methods

| Name                       | Description                          |
| -------------------------- | ------------------------------------ |
| `collapseSidebar()`        | Collapses the sidebar.               |
| `expandSidebar()`          | Expands the sidebar.                 |
| `toggleSidebarCollapsed()` | Toggles the sidebar collapsed state. |
