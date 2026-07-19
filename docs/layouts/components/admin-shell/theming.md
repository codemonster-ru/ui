# Theming

`VfAdminShell` uses the regular VueForge color and surface system through dedicated layout tokens.
By default, the shell keeps its contrast topbar while sharing the same surface hierarchy as `VfAdminLayout`: the sidebar uses the standard sidebar surface and the workspace uses the application background. Surface-based components therefore remain visually elevated without receiving layout-specific palette overrides. The semantic surfaces adapt to both color modes, while the dark theme only deepens the contrast topbar.

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
