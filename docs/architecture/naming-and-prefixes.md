# CodeMonster UI naming and prefixes

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-002`

## Decision

CodeMonster UI uses one short technical prefix, `cm`, across CSS, rendered HTML, and platform
component names. Distribution package names use the existing `codemonster-ru` organization and
vendor identifiers.

## Distribution names

The approved npm package family is:

```text
@codemonster-ru/ui-tokens
@codemonster-ru/ui-css
@codemonster-ru/ui-utilities
@codemonster-ru/ui-icons
@codemonster-ru/ui-runtime
@codemonster-ru/ui-vue
@codemonster-ru/ui-react
@codemonster-ru/ui-angular
```

The approved Composer package is:

```text
codemonster-ru/ui
```

The PHP namespace root is `Codemonster\Ui`. The package provides the Annabel Razor adapter and
packages the same built CSS and runtime artifacts used by npm consumers; it does not own a separate
style implementation.

No generic npm package named `@codemonster-ru/ui` is approved initially. An umbrella package would
blur the boundary between the framework-independent foundation and platform adapters. It may be
proposed later only with a concrete consumer need.

## Code and markup prefixes

| Surface | Convention | Example |
| --- | --- | --- |
| Vue and React components | `Cm` PascalCase prefix | `CmButton` |
| Angular selectors | `cm-` kebab-case prefix | `<cm-button>` |
| Annabel Razor tags | `cm-` kebab-case prefix | `<cm-button>` |
| CSS blocks | `cm-` prefix | `.cm-button` |
| CSS elements | BEM `__` separator | `.cm-button__content` |
| CSS modifiers | BEM `--` separator | `.cm-button--primary` |
| Utility classes | `cm-` prefix | `.cm-flex`, `.cm-gap-3` |
| Custom properties | `--cm-` prefix | `--cm-color-primary` |
| Runtime hooks | `data-cm-` prefix | `data-cm-accordion` |
| Theme attribute | `data-cm-theme` | `data-cm-theme="dark"` |

Native HTML attributes and ARIA remain unprefixed. Component states prefer native attributes and
ARIA first, then the shared `data-*` state contract defined by `CMUI-008`. Event naming is deferred
to the events contract in `CMUI-007`.

## Naming rules

- Public component names use full semantic words rather than platform abbreviations.
- The platform is expressed by the distribution package, not the component name.
- Shared CSS selectors never include `vue`, `react`, `angular`, or `razor`.
- New CodeMonster UI APIs do not expose `Vf`, `.vf-`, `--vf-`, or `data-vf-*` aliases.
- Existing VueForge packages retain their current names until the migration policy is approved.
- Internal filenames may follow platform conventions but must map to the same public component name.

## Registry verification

On 2026-08-11, the npm registry returned `404 Not Found` for every approved npm package name above,
and Packagist returned `404` for `codemonster-ru/ui`. This confirms that no public package currently
occupies those names. It does not reserve them; ownership and publication credentials must still be
verified before the first release.

## Rationale

- `cm` is short enough for authored HTML and utility-heavy templates.
- One prefix makes Vue output, Razor output, CSS, and runtime hooks visibly related.
- Platform-specific package suffixes keep peer dependencies and release ownership explicit.
- Reusing the existing npm scope and Composer vendor avoids a second organization identity.

## Consequences

- New framework-independent packages and contracts use only the approved names.
- Ported selectors and custom properties are renamed to `cm` instead of retaining aliases.
- Documentation can show equivalent platform examples without translating visual class names.
- Changes to these names require a superseding architecture decision and roadmap update.
