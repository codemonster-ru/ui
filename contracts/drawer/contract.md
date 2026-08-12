# Drawer contract

Status: Active

Component: `Drawer`

Razor tag: `cm-drawer`

Drawer is a modal side sheet built on the Dialog contract. It renders a native `<dialog>` with
`cm-drawer`, a stable `id`, escaped `title`, optional `description`, default body, optional `footer`,
and an accessible close button. `side` is `start` or `end` and is expressed through a finite CSS
modifier. It is logical-direction aware; applications do not choose physical left or right props.

`open` is controlled in Vue through `v-model:open` and is the initial server state in Razor. The
shared Drawer controller provides the same initial focus, Tab containment, Escape dismissal, close
request, and focus restoration rules as Dialog. Backdrop activation does not close it. Drawer owns
no trigger and does not preserve state across navigation.
