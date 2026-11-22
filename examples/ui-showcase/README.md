# CodeMonster UI showcase

The Vue and Vanilla showcases are local development tools for inspecting components, states, and
layouts on both adapters.

From the repository root, run `npm ci` once. For development, `npm run dev` opens Vue at
[127.0.0.1:5177](http://127.0.0.1:5177) and updates the browser when showcase files or UI sources
change. `npm run dev:vanilla` opens Vanilla at [127.0.0.1:5178](http://127.0.0.1:5178) and
regenerates the development site on changes to its inputs.

To inspect the production builds, run `npm run build:showcase` followed by `npm run preview` for
Vue, or `npm run build:vanilla` followed by `npm run preview:vanilla` for Vanilla. These preview
servers serve existing output on ports 4173 and 4174. To override a port, pass it after `--`,
for example `npm run preview -- --port 4200`.

The Vue workspace also exposes `dev`, `build`, and `preview` in the VS Code NPM Scripts panel.
Its `build` assumes the npm packages are already built; the root `build:showcase` handles both steps.

Both showcases open on **Core** and use the same navigation.

- **Core** (`/` and `/core/`) groups related component variants together. Scroll down for interactive examples of
  sizes, colors, and states.
- **Layouts** (`/layouts/`), **Colors** (`/colors/`), and **Icons** (`/icons/`) are direct header
  links. The links scroll horizontally when they need more room.

Each page keeps its examples visible as you scroll. See the [developer guides](../../docs/index.md)
for API details and integration instructions.
The header switches between light and dark. Use **Theme** in Core to return to the system
preference. Choose a preview width on **Layouts** to inspect narrow, tablet, and desktop compositions.

Both production builds emit directory indexes for known routes. Serve `examples/ui-showcase/dist`
at the origin root or `examples/vanilla/dist` at the origin root or a subdirectory. Serve the
`index.html` for each known directory and keep automatic directory listings disabled.

Each component has one section. `examples/shared/showcase-cases.mts` combines paired contract cases
with additional combinations and removes repeated configurations. Both showcases consume that
ordered matrix. Vue mounts the published components. The Vanilla build renders their HTML at
build time and connects the published JavaScript controllers in the browser.

Add an example when it shows a distinct appearance, state, animation, or interaction. Keep API-only
coverage in component tests and contracts. Use library components
inside composed examples and keep styling on the showcase shell. Dialogs, drawers, and palettes
open from their own buttons so their native backdrop, keyboard behavior, and focus can be inspected.
The existing resizable workspace previews still provide a separate viewport for package media queries.

Vue also shows Confirm Dialog in **Modals and Commands** and Theme Provider in **Theme**. A running
Theme Provider example applies to the whole document. **Restore showcase theme** returns to the
previous showcase mode and restores the saved preference.
