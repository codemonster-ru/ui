# Theming

`VfAdminLayout` uses the regular layout area tokens for its surfaces, borders, spacing, header height,
and expanded sidebar width.

| Token                                                  | Purpose                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| `--vf-layout-admin-layout-sidebar-collapsed-width`     | Collapsed sidebar width. Defaults to `4.75rem`.                     |
| `--vf-layout-admin-layout-sidebar-transition-duration` | Sidebar, header, and main-column transition duration.               |
| `--vf-layout-admin-layout-sidebar-transition-easing`   | Sidebar, header, and main-column transition easing.                 |
| `--vf-layout-admin-layout-sidebar-expanded-z-index`    | Stacking order while the collapsed sidebar is temporarily expanded. |
| `--vf-layout-shell-sidebar-width`                      | Sidebar width in its regular and temporarily expanded states.       |
| `--vf-layout-header-height`                            | Header and brand-row height.                                        |

The mobile drawer reuses the expanded sidebar width and the sidebar transition duration and easing.
Its responsive switch uses the layout's named container at the `lg` breakpoint, so embedded
previews and application shells respond to their available width rather than the browser viewport.
