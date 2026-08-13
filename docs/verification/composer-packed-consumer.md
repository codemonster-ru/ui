# Composer packed-consumer verification

Verification date: 2026-08-13.

`CMUI-156` was run in the `annabel-php` image against the local Annabel repository:

```bash
npm run sync:ui-razor-assets
npm run check:composer-packed-consumer
```

The gate passed PHPStan, 133 PHPUnit tests with 305 assertions, and Composer dependency audit before
creating `codemonster-ru/ui@0.1.0` as a ZIP archive. The archive contained its Composer manifest,
source, Razor views, integrity manifest, packaged CSS, README, and license; tests, development
configuration, lockfiles, vendor dependencies, and workspace paths were absent.

The production PHP image intentionally has no `ext-zip`. The gate therefore inspects and extracts
the exact ZIP with the system `unzip` tool, then installs that extracted payload into a clean
Composer consumer through a non-symlinked path repository. The consumer verified Composer
autoloading, all 33 registered `cm` components, Button rendering, the asset integrity graph, and
publication of the complete token and component stylesheets.

Annabel `codemonster-ru/razor` and `codemonster-ru/view` were installed from their local package
workspaces because the UI archive targets the unreleased compatible Annabel development snapshot.
The CodeMonster UI package itself was consumed only from the generated archive payload.
