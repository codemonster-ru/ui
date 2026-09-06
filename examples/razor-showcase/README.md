# Razor Input showcase

The PHP half of the cross-platform Input showcase. It is a real application:
the adapter is installed through Composer, registered with the real Razor
engine, and rendered from real Razor templates. Nothing here reimplements
`VfInput`, copies fixture markup, or reads anything from the Vue application or
the frozen reference checkout.

## Running it

```sh
npm run razor:showcase   # stages the Composer artifact, installs it, serves it
```

Or step by step:

```sh
npm run razor:package                                   # stage the distributable artifact
composer install --working-dir=examples/razor-showcase  # install that artifact
php -S 127.0.0.1:8080 -t examples/razor-showcase/public
```

Set `VUEFORGE_VUE_SHOWCASE_ORIGIN` to the origin serving the Vue showcase so the
per-case "Open in Vue" links resolve; without it they fall back to the path from
the shared index.

## What it renders

| Source | Owner |
| --- | --- |
| Case list | `contracts/input/cases.json`, the same file the parity gate uses |
| Component catalog | `examples/shared/showcase-index.json` |
| `vf-input` markup | The real `codemonster-ru/vueforge-razor` provider |
| Stylesheet and controller | `VueForgeRazorProvider::assetPath()` inside the installed package, staged by `npm run razor:package` |

`views/partials/input-case.razor.php` names every prop explicitly. The engine
has no prop spread, and the migration plan asks for an explicit map for the
first component rather than a generic factory. The tag is repeated once per slot
combination because named slots are collected when the template compiles, so a
slot wrapped in `@if` would still be declared; `npm run showcase:routes` requires
the four prop lists to stay identical.

## What this is not

**Not a migrated `VfField`.** `views/partials/field-shell.razor.php` is the
label/description/error composition the field cases need in order to be shown at
all. The catalog on the page reports `VfField` as not implemented in Razor, and
migrating it is its own milestone.

**Not the distribution proof.** Since M09 this application installs the same
staged Composer artifact the packaged-consumer gate installs, copied rather than
symlinked, so it no longer demonstrates a gitignored `dist` that would never
ship. The artifact itself is proved by `npm run check:razor-packaged-consumer`,
which installs it outside the repository through a Composer artifact repository
with no Node on the PATH. This showcase is a convenience for looking at the
component, not the proof.
