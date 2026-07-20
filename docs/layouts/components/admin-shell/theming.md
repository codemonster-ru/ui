# Theming

`VfAdminShell` uses the regular VueForge color and surface system through dedicated layout tokens.
The default palette uses a deliberate elevation ladder instead of giving every region a similar mid-tone. The topbar is a high-contrast ink layer, the sidebar uses the application canvas, and the workspace uses the regular layout surface seen around content primitives such as `VfContainer`. Main content therefore stays the clearest body region in both modes, while muted component areas and system borders provide its internal structure. The dark theme deepens the topbar while preserving regular foreground contrast.

| Token                                          | Purpose                       |
| ---------------------------------------------- | ----------------------------- |
| `--vf-layout-admin-shell-header-background`    | Global topbar background.     |
| `--vf-layout-admin-shell-header-color`         | Global topbar foreground.     |
| `--vf-layout-admin-shell-header-height`        | Topbar height.                |
| `--vf-layout-admin-shell-body-radius`          | Body layer corner radius.     |
| `--vf-layout-admin-shell-sidebar-width`        | Sidebar width.                |
| `--vf-layout-admin-shell-sidebar-background`   | Sidebar surface.              |
| `--vf-layout-admin-shell-workspace-background` | Workspace surface.            |
| `--vf-layout-admin-shell-sticky-z-index`       | Sticky topbar stacking order. |

Padding can be customized through the corresponding `header`, `sidebar`, and `content` `padding-block` and `padding-inline` tokens.
