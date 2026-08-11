# CodeMonster UI platform support

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-003`

## Decision

CodeMonster UI supports CSS-only HTML, Vue, React, Angular, and Annabel Razor as first-class
rendering targets. Platform adapters declare explicit peer dependencies and do not make their
framework a dependency of the shared foundation.

## Initial version floors

| Surface | Initial floor | Policy |
| --- | --- | --- |
| Node.js tooling and SSR tests | `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` | Match the strictest pilot adapter toolchain |
| Vue adapter | Vue `^3.5.0` | Vue is a peer dependency |
| React adapter | React and React DOM `^19.2.0` | React packages are peer dependencies |
| Angular adapter | Angular `^22.0.0` | Angular framework packages must use one compatible release line |
| Shared, Vue, and React declarations | TypeScript `>=5.9` | TypeScript is development and consumer tooling, not a runtime dependency |
| Angular declarations | TypeScript `>=6.0 <6.1` | Follow the Angular 22 compiler compatibility range |
| Annabel Razor adapter | `codemonster-ru/razor ^2.0` | Version 2 must provide the approved component API |
| PHP runtime | PHP `>=8.2` | Match Annabel Razor while PHP 8.2 remains security-supported |
| CSS-only HTML | No framework runtime | Consume published CSS and optional DOM runtime directly |

The browser matrix and CSS feature policy are intentionally deferred to `CMUI-012`.

## Node.js policy

Node.js is required for repository development, package builds, JavaScript tests, SSR tests, and
npm consumer verification. CSS files and browser bundles do not require Node.js after they are
built. The Composer adapter does not require Node.js in production when it consumes packaged build
artifacts.

The supported Node.js ranges follow the Angular 22 toolchain, which is stricter than the other pilot
adapters. CI must test Node.js 24 as the primary LTS line. Additional ranges may be smoke-tested when
the CI cost is justified.

## Framework policy

- Frameworks are peer dependencies only in their matching adapter.
- The tokens, CSS, utilities, icons data, and DOM runtime packages must not import a UI framework.
- Vue applications do not install React or Angular through CodeMonster UI dependencies.
- React applications do not install Vue or Angular through CodeMonster UI dependencies.
- Angular applications do not install Vue or React through CodeMonster UI dependencies.
- Peer ranges are widened only after contract, SSR, and packed-consumer verification.
- A new framework major is supported through an explicit compatibility change, not an untested
  open-ended peer range.

## PHP and Annabel policy

The current Annabel Razor package supports PHP `>=8.2`. CodeMonster UI initially keeps that floor so
existing Annabel applications can adopt the adapter. CI tests only PHP releases still receiving
upstream security fixes.

PHP 8.2 reaches end of life on 2026-12-31. If CodeMonster UI 1.0 ships after that date, the PHP floor
must be reviewed and raised to a security-supported release before `CMUI-162` can complete.

The Annabel adapter targets `codemonster-ru/razor ^2.0` because the component registry, props, slots,
and trusted-rendered-HTML contract are new public capabilities. The UI adapter must not publish a
stable release against an unreleased development branch of Annabel.

## Version review gates

Recheck this matrix:

1. before scaffolding each platform adapter;
2. before the first prerelease;
3. before CodeMonster UI 1.0;
4. when a supported runtime reaches upstream end of life.

A review may raise a floor through a superseding decision. It must not silently widen a peer range
without compatibility verification.

## Verification snapshot

Registry and upstream metadata checked on 2026-08-11 reported:

- Vue `3.5.41`;
- React and React DOM `19.2.8`;
- Angular `22.1.1`, with Node.js `^22.22.3 || ^24.15.0 || >=26.0.0`;
- Angular compiler support for TypeScript `>=6.0 <6.1`;
- Annabel Razor `1.1.0`, requiring PHP `>=8.2`;
- Node.js 22 maintenance through 2027-04-30 and Node.js 24 maintenance through 2028-04-30.

These versions document the decision context. The approved ranges above, rather than the snapshot
patch versions, are the package policy.

## Consequences

- Adapter work starts from currently supported framework lines instead of legacy majors.
- Angular build tooling may use a different TypeScript installation from shared package tooling.
- The future Annabel Razor 2 release is a prerequisite for the stable PHP adapter.
- Version floors remain reviewable release decisions rather than permanent compatibility promises.
