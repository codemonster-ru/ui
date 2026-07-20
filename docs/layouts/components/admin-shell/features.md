# Features

`VfAdminShell` uses a global topbar above a two-column administrative workspace.

- The `brand`, `header`, and `header-actions` slots share the full-width topbar.
- The sidebar begins below the topbar and keeps its navigation visible while the page scrolls.
- The sidebar provides the body background while the workspace sits above it as an inset rounded surface with a system border.
- A system border along the rounded top edge separates the body layer from the global topbar.
- The contrast topbar and elevated workspace direct attention toward main content, while the sidebar recedes onto the application canvas in both themes.
- The footer remains inside the workspace and is pushed to its bottom when content is short.
- At the `lg` breakpoint and below, the sidebar is hidden and the workspace keeps balanced inline insets.
- At the `sm` breakpoint and below, the center header content is hidden to preserve room for brand and actions.

The component deliberately does not provide a mobile drawer. Applications can connect their own navigation overlay to a topbar control without coupling the layout to a specific interaction component.
