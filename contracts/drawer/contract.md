# Drawer contract

Status: Active

Component: `Drawer`

Drawer renders a native `<dialog>` and accepts a title, header slot or explicitly linked accessible
name. An optional description and trusted header, description, actions, body and footer slots use
the same labelling rules as Dialog. A close action is present unless `closable` is false.

`side` accepts logical `start` and `end`, physical `left` and `right`, and `top` or `bottom`. The
physical edges stay fixed in right-to-left text. `size` accepts `sm`, `md`, `lg`, or `full`.
`offsetTop` and `bodyPadding` accept CSS lengths or pixel numbers. Vanilla can set the same
geometry through `--cm-drawer-offset-top` and `--cm-drawer-body-padding`.

`open` binds Vue `v-model:open`; when omitted, `defaultOpen` sets initial state. Vanilla writes the
initial `open` attribute. The controller owns Tab containment, initial focus and focus restoration.
Set `focusDrawer` or put `tabindex="-1" data-autofocus` on the authored surface to initially focus
the surface itself.

Escape closes by default. Backdrop dismissal is opt-in for `CmDrawer`. Both rules remain
independent of `closable`, which only controls the button. `dismissible=false` blocks all three
user dismissal paths. Vanilla can use `data-cm-drawer-close-on-escape="false"`,
`data-cm-drawer-close-on-overlay-click="true"`, and `data-cm-drawer-closable="false"`.

`VfDrawer` from `@codemonster-ru/ui-vue/historical` generates an ID, restores the physical
`placement` API, and defaults to `right` with backdrop dismissal. It uses the browser's native
modal top layer. Custom Teleport and scroll-lock targets remain outside this entry.
