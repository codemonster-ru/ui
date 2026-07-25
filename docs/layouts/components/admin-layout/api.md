# API

## Props

| Name                        | Type      | Default            | Description                                                |
| --------------------------- | --------- | ------------------ | ---------------------------------------------------------- |
| `as?`                       | `string`  | `div`              | Underlying HTML tag name.                                  |
| `fillViewport?`             | `boolean` | `true`             | Expands the layout to viewport height.                     |
| `sidebarCollapsed?`         | `boolean` | —                  | Controlled desktop sidebar collapsed state.                |
| `defaultSidebarCollapsed?`  | `boolean` | `false`            | Initial uncontrolled desktop sidebar collapsed state.      |
| `mobileSidebarOpen?`        | `boolean` | —                  | Controlled mobile drawer state.                            |
| `defaultMobileSidebarOpen?` | `boolean` | `false`            | Initial uncontrolled mobile drawer state.                  |
| `mobileSidebarOpenLabel?`   | `string`  | `Open navigation`  | Accessible label for the built-in mobile toggle.           |
| `mobileSidebarCloseLabel?`  | `string`  | `Close navigation` | Accessible label while the built-in mobile drawer is open. |

## Emits

| Name                       | Parameters         | ReturnType | Description                                         |
| -------------------------- | ------------------ | ---------- | --------------------------------------------------- |
| `update:sidebarCollapsed`  | `[value: boolean]` | `void`     | Emitted with the requested sidebar collapsed state. |
| `update:mobileSidebarOpen` | `[value: boolean]` | `void`     | Emitted with the requested mobile drawer state.     |

## Slots

| Name            | Parameters           | Description                                                                                             |
| --------------- | -------------------- | ------------------------------------------------------------------------------------------------------- |
| `brand`         | `AdminLayoutScope`   | Product mark at the top of the desktop aside. A divider appears below it when `aside` is also provided. |
| `mobile-brand`  | `—`                  | Product mark centered in the mobile header.                                                             |
| `mobile-toggle` | `MobileSidebarScope` | Optional replacement for the built-in bars button at the start of the mobile header.                    |
| `aside`         | `AdminLayoutScope`   | Left navigation: fixed desktop column and an off-canvas drawer when the layout container is below `lg`. |
| `header`        | `AdminLayoutScope`   | Desktop header content and the trailing area of the mobile header.                                      |
| `default`       | `AdminLayoutScope`   | Main content below the header.                                                                          |
| `footer`        | `—`                  | Footer at the bottom of the main column.                                                                |

`MobileSidebarScope` contains `isMobileSidebarOpen`, `mobileToggleAttrs` (for binding accessible
attributes to a custom toggle), `closeMobileSidebar`, `openMobileSidebar`, and
`toggleMobileSidebar`. `AdminLayoutScope` combines the state and methods with
`isSidebarCollapsed`, `isSidebarCompact`, `collapseSidebar`, `expandSidebar`, and
`toggleSidebarCollapsed`. `isSidebarCompact` becomes `false` while a collapsed desktop sidebar is
temporarily expanded by pointer or keyboard interaction.

## Exposed methods

| Name                       | Description                          |
| -------------------------- | ------------------------------------ |
| `collapseSidebar()`        | Collapses the sidebar.               |
| `expandSidebar()`          | Expands the sidebar.                 |
| `toggleSidebarCollapsed()` | Toggles the sidebar collapsed state. |
| `closeMobileSidebar()`     | Closes the mobile drawer.            |
| `openMobileSidebar()`      | Opens the mobile drawer.             |
| `toggleMobileSidebar()`    | Toggles the mobile drawer.           |
