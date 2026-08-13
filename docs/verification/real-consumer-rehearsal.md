# Real consumer prerelease rehearsal

Status: Locally validated; registry repeat deferred
Date: 2026-08-13  
Roadmap item: `CMUI-159`

## Consumer

The final local rehearsal used the real Annabel CMS application at Annabel commit
`1b6d1fbf88e7a82a72c27d6eb47153c2b1cfbe1b`. The application consumes exact local npm archives for
CodeMonster UI tokens, CSS, and Vue, and the local Composer package `codemonster-ru/ui` at
`1.0.0-rc.1`. No package was published and no registry credentials were used.

The completed source audit reports zero replace, compose, or manual findings. The remaining 12
findings are the explicitly retained `@codemonster-ru/vueforge-icons` package, for which the
migration policy defines no CodeMonster UI replacement.

## Vue admin rehearsal

The approved codemod was followed by a complete application migration. Direct portable components
use `@codemonster-ru/ui-vue`; application-owned shells, navigation, menus, tables, form layout,
date-time/number/password behavior, and tab-panel composition remain local where the stable shared
contract intentionally does not own application policy.

Both production entrypoints pass with Vite 8.0.16:

- Annabel Admin: 69 transformed modules and a verified 225.19 kB / 65.76 kB gzip entry bundle;
- Annabel Setup: 39 transformed modules and a verified 214.60 kB / 62.45 kB gzip entry bundle.

The npm production dependency audit reports zero vulnerabilities. Local Node 24.14.0 remains one
patch below the package engine gate of 24.15.0, so the final release verification must run on a
supported Node line.

## Razor consumer gap

Annabel now has a real CMS Razor consumer at
`app/Modules/Pages/views/show.razor.php`. The application registers the CodeMonster UI component
provider, publishes its assets through the CMS boundary, and renders the public page with `cm-*`
markup.

Application verification passed locally:

- PHPUnit: 68 tests, 182 assertions;
- PHPStan: no errors with a 512 MiB analysis limit;
- HTTP smoke: `/`, `/admin/login`, `/admin/forgot-password`, and `/setup` return 200;
- public Razor output contains CodeMonster UI markup.

This completes the local scope of `CMUI-159` and the contract-feedback work in `CMUI-160`.
`CMUI-159a` remains open: after publication resumes, repeat npm and Composer installation from the
registries without file archives or path repositories, then rerun the same build, render,
interaction, and application checks.
