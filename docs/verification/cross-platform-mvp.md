# CodeMonster UI cross-platform MVP

## Scope

The MVP supports Vue 3 and Annabel Razor as active rendering targets. React and Angular are
outside the MVP scope and must not be added to the release gate without a concrete consumer and
an approved scope change.

The MVP cohort is deliberately small and representative, and matches the reviewed frozen visual
baseline:

- `Button` — native actions, link mode, disabled and loading states;
- `Card` — semantic surface and header/body/footer composition;
- `Alert` — semantic status content and trusted content regions;
- `Badge` — compact status and categorization content;
- `Avatar` — image, label, and fallback content;
- `Divider` — horizontal and vertical separation semantics;
- `Link` — native navigation and link attributes.

`Field`, `Input`, and `Accordion` already have functional Vue/Razor contracts and tests, but their
pixel baselines belong to the next MVP expansion rather than this release gate.

Other components may remain available in the repository, but they are not required for the MVP
release gate unless they are used by one of the cohort's canonical cases.

## Support definition

A cohort component is MVP-supported only when both adapters provide the same approved contract:

1. shared semantic DOM intent and accessible naming;
2. the documented props, attributes, slots, and states;
3. equivalent default, light-theme, dark-theme, disabled, invalid, loading, or open behavior where
   applicable;
4. server-rendered Razor HTML that remains usable without JavaScript;
5. Vue interaction and Razor progressive enhancement where behavior requires JavaScript;
6. contract, accessibility, adapter, and server-rendering tests;
7. reviewed screenshot comparison against one frozen visual baseline;
8. Vue and Razor usage documentation and a working consumer example.

Visual parity means equivalent product rendering at the declared viewport and theme combinations.
The DOM does not have to be byte-identical when a platform-specific implementation is required,
but differences must not change appearance, semantics, interaction, or accessibility.

## MVP exit gate

The MVP is complete when all seven cohort components pass their canonical Vue and Razor cases in
both themes and at mobile and desktop viewports, and the following checks pass together:

- component contract and manifest validation;
- Vue package tests, typecheck, and production build;
- Razor PHPStan and PHPUnit tests;
- accessibility and keyboard behavior checks;
- cross-platform visual screenshot comparison;
- clean npm and Composer consumer checks;
- documentation and packaged-asset checks.

The full VueForge showcase parity effort remains a follow-up milestone. It is not required to
declare this focused cross-platform MVP complete, provided the cohort baseline and its limitations
are documented.
