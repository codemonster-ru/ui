# Real consumer prerelease rehearsal

Status: Rehearsed with local archives, not registry-validated  
Date: 2026-08-13  
Roadmap item: `CMUI-159`

## Consumer

The Vue consumer rehearsal used the real Annabel CMS application at Annabel commit
`1f28ea63efa79f3116344db51b0f8531e45a32f1`. Its worktree remained unchanged. The rehearsal copied
the application without dependencies, generated assets, storage, or runtime data into a temporary
directory.

The source audit found 725 frozen VueForge references:

- 353 approved direct replacements;
- 53 compositions;
- 195 manual migrations;
- 117 references to partially migrated packages;
- 7 retained references.

## Vue admin rehearsal

The approved codemod would update 18 real consumer files. The temporary copy installed the five
exact `1.0.0-rc.1` npm tarballs alongside the explicitly retained or not-yet-composed VueForge
packages. The first run exposed and fixed an import-boundary defect in the codemod. A repeat run
then left zero `replace` findings in application source.

Both production entrypoints passed with Vite 8.0.16:

- Annabel Admin: 143 transformed modules and a verified admin entry bundle;
- Annabel Setup: 106 transformed modules and a verified setup entry bundle.

The remaining 297 source findings are intentionally outside deterministic rename ownership: 53
compositions, 195 manual migrations, 42 partially migrated package references, and 7 retained
references. A successful mixed migration build does not prove runtime or visual equivalence for
those items.

## Razor consumer gap

The Annabel CMS application currently contains no Razor template. The only `.razor.php` file found
outside dependencies, generated output, storage, and runtime data is
`packages/razor/tests/views/welcome.razor.php`, which is a framework unit-test fixture rather than a
real CMS consumer.

Consequently this rehearsal does not complete `CMUI-159`. Completion requires:

1. installing the published npm prereleases from the registry in the real Vue admin consumer;
2. nominating or creating a real Annabel CMS Razor template consumer;
3. installing the published Composer prerelease there without a path repository;
4. running the consumer's build, render, interaction, and application-level verification.
