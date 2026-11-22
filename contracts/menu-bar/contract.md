# Menu bar

Use one navigation landmark with a list whose role is `menubar`. Each enabled branch provides a
`menuitem` control and a named submenu with role `menu`. The first enabled top-level item is the
initial tab stop. Other items become the tab stop as focus moves. Disabled items remain visible
and are skipped by keyboard navigation.

The same keyboard rules apply to the [default](./cases/default.html) and [pills](./cases/pills.html)
variants. Open a branch with Down, Up, Enter, or Space. Arrow keys move within the current level or
open and close nested branches as appropriate. Horizontal arrows follow the reading direction.
Escape closes the open path and returns focus to the top-level trigger.

Pills use selected and open surfaces. Mark an initially selected leaf with `aria-current="page"`
and `cm-menu-bar__item--active`. Selection and keyboard state remain independent.

Use `kind="group"` in the Vue item data to label related items at the same keyboard level. In
authored HTML, put the visible `cm-menu-bar__group-label` and a named `ul[role="group"]` with
`cm-menu-bar__group-list` inside one presentation list item. The group itself does not receive
focus or appear in the open path, and arrows cross group boundaries at the same level.

In Vue, `to` uses the provided `linkComponent` or the registered `RouterLink`. An `href` remains a
native anchor. The opt-in historical `VfMenuBar` restores the `Menu bar` name, named leading
icons, and `select` with the original item object after the model/change events. The current
`CmMenuBar` and Vanilla event continue to report the selected value. Top-level items wrap.
At viewport widths up to 640 px, expanded submenus stack in their own rows, including on
server-rendered pages with authored open branches. Wider viewports use the inline cascade.
Once enhanced, Vue and Vanilla flip or shift those panels to keep them reachable at viewport edges.
In a Dialog or Drawer, scrolling the top-level opener fully out of the modal body closes the
entire open path. If focus was in that branch, it moves to the nearest visible enabled top-level
item, or to the modal when none is visible, without scrolling the body.
From that modal focus, Tab moves to a visible control without scrolling the body.
The clipped opener stays out of the Tab order until it comes back into view.

`VfMenuBar` switches enabled branches on mouse hover after the first branch opens. Leaving
the bar closes it after 120 ms, and moving back into the bar or a submenu cancels the timer.
Once mounted, an overflowing bar scrolls in one row. The available edge controls support
keyboard activation and native horizontal touch panning. Top-level panels live outside the
scroll viewport within the navigation landmark. Above 640 px they float, and at compact widths
they expand below the row. Each opener references its panel by ID, and keyboard navigation
follows the logical branch hierarchy.
In both adapters, submenus reveal over 320 ms from a slight downward shift and reduced scale
when motion is enabled. Closing releases focus and interaction immediately while the submenu
finishes its exit on browsers that support discrete transitions and CSS inertness.
