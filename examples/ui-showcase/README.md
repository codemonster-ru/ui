# CodeMonster UI showcase

A live demonstration of every component in `@codemonster-ru/ui-vue` and every layout in
`@codemonster-ru/ui-layouts`, rendered by the Vue adapter.

From the repository root, run `npm ci` once, then use one of these commands:

- `npm run preview` builds the packages and Vue showcase, then opens it at
  [127.0.0.1:4173](http://127.0.0.1:4173).
- `npm run dev` starts the Vue showcase with hot reload at
  [127.0.0.1:5177](http://127.0.0.1:5177).
- `npm run preview:vanilla` opens the full Vanilla HTML showcase at
  [127.0.0.1:4174](http://127.0.0.1:4174).

In VS Code, the `preview` entry under `examples/ui-showcase/package.json` also builds and opens
the full Vue showcase. From that directory, run `npm run preview` to do the same in a terminal.

Both showcases have six shared sections:

- **Core** (`/core/`): browse the visual matrices by category. Open **Contract examples** to see
  additional cases and supported variants.
- **Reference** (`/components/`): search the catalog, or open a detail page directly, such as
  `/components/button/`. Preview the component, copy usage examples, and follow its developer guide.
- **Examples** (`/examples/`): try a release workspace with a dashboard, filtered deployment table,
  release form, settings, and a sample sign-in. The demo uses local state and sends no requests.
- **Layouts** (`/layouts/`): try primitives, page compositions, and shell previews at different widths.
- **Colors** (`/colors/`): inspect color roles, contrast pairs, and token names.
- **Icons** (`/icons/`): search the icon catalog and copy entries.

The header switches between light and dark. Use **Theme** on Core to return to the system preference.
The [developer guides](../../docs/index.md) describe installation, integration, and the shared design system.

To preview production output on another static server, serve `examples/ui-showcase/dist` with a
fallback to `index.html` for showcase routes. The Vanilla build emits directory indexes under
`examples/vanilla/dist`; it needs no application router.

The Vue showcase also serves `/codeblock/` and `/playground/`. CodeBlock shows syntax highlighting,
line numbers, copying, long files, and skeleton replay. Playground shows single-file HTML,
multi-file JavaScript and CSS, a trusted Vue component, and two Vite virtual module previews.
The published VueForge packages power these two examples and are dependencies of the private
showcase workspace only.
