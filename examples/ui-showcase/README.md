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

Both showcases open on the visual matrix and use the same navigation.

- **Visual matrix** (`/` and `/core/`). Scan variants by category and open **Contract examples** for
  additional cases.
- **Layouts** (`/layouts/`), **Colors** (`/colors/`), and **Icons** (`/icons/`) are direct header
  links. The links scroll horizontally when they need more room.

Open a component by its direct route, such as `/components/button/`, for live previews, additional
states, and links to the developer guides in the [repository documentation](../../docs/index.md).
The header switches between light and dark. Use **Theme** in Visual matrix to return to the system
preference.

Both production builds emit directory indexes for known routes. Serve `examples/ui-showcase/dist`
at the origin root or `examples/vanilla/dist` at the origin root or a subdirectory. Serve the
`index.html` for each known directory and keep automatic directory listings disabled.

Component previews load the package tokens, Inter fonts, and component styles. The examples use
the theme selected in the header. In Layouts, the width controls resize the preview document so
the package's own responsive rules run at the selected width.
