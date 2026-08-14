# CodeMonster UI 1.1 registry validation

Status: Complete  
Date: 2026-08-15  
Roadmap items: `CMUI-191`, `CMUI-G011`

## Outcome

The matured Vue and Razor cohort was published from CodeMonster UI commit
[`0a780db7ff8869c371ec9326ad96916e6179d743`](https://github.com/codemonster-ru/ui/commit/0a780db7ff8869c371ec9326ad96916e6179d743).
Fresh registry-only consumers installed the exact public releases without `file:`, `link:`,
`workspace:`, or Composer path repositories. The same releases then passed the real Annabel CMS
consumer at commit
[`f037701378fc92ec311f29f30f7130711f3471a7`](https://github.com/codemonster-ru/annabel/commit/f037701378fc92ec311f29f30f7130711f3471a7).

Independent package versioning is preserved: runtime, CSS, Vue, and Razor advanced to `1.1.0`,
while the compatible token and utility changes advanced to `1.0.1`.

## npm publication

All five GitHub releases and their tag-triggered publication workflows resolve to the same source
commit. npm serves each exact tarball under the `latest` distribution tag with the following
registry metadata:

| Package | Integrity | SHA-1 shasum | Publication evidence |
| --- | --- | --- | --- |
| `@codemonster-ru/ui-tokens@1.0.1` | `sha512-AtIBee/TGeaKYF7TuR9Ww2bADgdXP3m6VLh3dm0bWG2pJ1jujxovMI2Y0Rhg4CtQdzoniT39sDisXLBRo8jM4g==` | `67bc7542f3eb9c8863843f5a59d5934e76aa01e8` | [tarball](https://registry.npmjs.org/@codemonster-ru/ui-tokens/-/ui-tokens-1.0.1.tgz), [release](https://github.com/codemonster-ru/ui/releases/tag/%40codemonster-ru/ui-tokens%401.0.1), [workflow](https://github.com/codemonster-ru/ui/actions/runs/31833937922) |
| `@codemonster-ru/ui-runtime@1.1.0` | `sha512-yOZ6AVYc2TOPzVIUCx1bOmSEfoiTjzSLGrnwtX1+clZ6UatRa8LAwuJORZxNInlkSu1sB1UsQs+qKjkkKOD0LA==` | `c023ab252a1baf9ab9acb3612a560cbf30ff40e8` | [tarball](https://registry.npmjs.org/@codemonster-ru/ui-runtime/-/ui-runtime-1.1.0.tgz), [release](https://github.com/codemonster-ru/ui/releases/tag/%40codemonster-ru/ui-runtime%401.1.0), [workflow](https://github.com/codemonster-ru/ui/actions/runs/31834920660) |
| `@codemonster-ru/ui-css@1.1.0` | `sha512-LW7or1ZKBGAqKU6yWJx82ESw0BtF3LKa+iph8sI2dmx79qgKIlmZnTCA/UwyrEmGuxsy6oMB6+sgNfsQwwwBIw==` | `f5f8db79b9350bc1baffa08b4fab39555405799e` | [tarball](https://registry.npmjs.org/@codemonster-ru/ui-css/-/ui-css-1.1.0.tgz), [release](https://github.com/codemonster-ru/ui/releases/tag/%40codemonster-ru/ui-css%401.1.0), [workflow](https://github.com/codemonster-ru/ui/actions/runs/31835963316) |
| `@codemonster-ru/ui-utilities@1.0.1` | `sha512-+5Xxsd61OwbmqR/ySlorMtQu2aiW6ogp1YTcDgyubrG/n/dAl99VCHQk7EcF1vzAGi7EB8fTcWjYRa2KqO0KNQ==` | `54292c70bd18f39b08027690ca868306710ab12d` | [tarball](https://registry.npmjs.org/@codemonster-ru/ui-utilities/-/ui-utilities-1.0.1.tgz), [release](https://github.com/codemonster-ru/ui/releases/tag/%40codemonster-ru/ui-utilities%401.0.1), [workflow](https://github.com/codemonster-ru/ui/actions/runs/31837096254) |
| `@codemonster-ru/ui-vue@1.1.0` | `sha512-Lh+YSrRf4UmTib/3RB91z7aaho/eaPP8PEyLOLPdzSY1haCV7sJILEJB7eGASVuZkU9bnGFDkCpKvNP7EhTNnA==` | `29a70691a04745dceecde883f48f93be60b146d3` | [tarball](https://registry.npmjs.org/@codemonster-ru/ui-vue/-/ui-vue-1.1.0.tgz), [release](https://github.com/codemonster-ru/ui/releases/tag/%40codemonster-ru/ui-vue%401.1.0), [workflow](https://github.com/codemonster-ru/ui/actions/runs/31837946952) |

The source [CI run](https://github.com/codemonster-ru/ui/actions/runs/31832739446) passed before
publication. `npm run check:ui-registry-consumer` then installed 41 packages from
`https://registry.npmjs.org/` and verified:

- exact versions, registry tarball URLs, and SHA-512 lockfile integrity for all five releases;
- no local dependency protocols in the lockfile or installed package manifests;
- TypeScript bundler resolution, a Vite production build with 44 transformed modules, and Node
  Vue SSR;
- side-effect-free runtime and token imports plus the complete token, component, and utility CSS
  graph;
- registry signatures for all 41 installed packages and provenance attestations for 27 packages.

## Composer and Razor publication

The CodeMonster UI tag `ui-razor/v1.1.0` also points to the release source commit. Its successful
[split workflow](https://github.com/codemonster-ru/ui/actions/runs/31839017322) created
[`codemonster-ru/ui-razor@v1.1.0`](https://github.com/codemonster-ru/ui-razor/releases/tag/v1.1.0)
at split commit
[`cc5cecd0c12bc1278deea477a5b3f1ec050ceb2b`](https://github.com/codemonster-ru/ui-razor/commit/cc5cecd0c12bc1278deea477a5b3f1ec050ceb2b).
Packagist exposes the same hash as both source and dist reference, with the exact archive URL
`https://api.github.com/repos/codemonster-ru/ui-razor/zipball/cc5cecd0c12bc1278deea477a5b3f1ec050ceb2b`.
The matching monorepo release is
[`ui-razor/v1.1.0`](https://github.com/codemonster-ru/ui/releases/tag/ui-razor/v1.1.0).

The package requires the component API introduced by `codemonster-ru/razor:^2.1`. Razor `v2.1.0`
was therefore released from Annabel commit
[`5768d2d02735927b99a0995f0c5ebb39ba2b1624`](https://github.com/codemonster-ru/annabel/commit/5768d2d02735927b99a0995f0c5ebb39ba2b1624)
after the complete [Annabel test matrix](https://github.com/codemonster-ru/annabel/actions/runs/31840129790)
passed. Its [split release](https://github.com/codemonster-ru/razor/releases/tag/v2.1.0) and Packagist
source/dist references resolve to
[`f3c71eb6184e904fd88dbc840b908b355eb31df1`](https://github.com/codemonster-ru/razor/commit/f3c71eb6184e904fd88dbc840b908b355eb31df1),
with archive URL
`https://api.github.com/repos/codemonster-ru/razor/zipball/f3c71eb6184e904fd88dbc840b908b355eb31df1`.
The matching monorepo release is
[`razor/v2.1.0`](https://github.com/codemonster-ru/annabel/releases/tag/razor/v2.1.0).

`npm run check:composer-registry-consumer` used a clean Composer cache and Packagist as the only
package source. It installed exactly three archives: `codemonster-ru/ui-razor@v1.1.0`,
`codemonster-ru/razor@v2.1.0`, and `codemonster-ru/view@v2.3.1`. The gate confirmed the exact UI
source/dist hash and URL, absence of local repositories and workspace paths, all 37 public `cm`
components, component rendering, packaged CSS publication, and zero Composer security advisories.

## Real Annabel consumer

Annabel commit
[`f037701378fc92ec311f29f30f7130711f3471a7`](https://github.com/codemonster-ru/annabel/commit/f037701378fc92ec311f29f30f7130711f3471a7)
upgrades the CMS to exact npm versions `ui-tokens@1.0.1`, `ui-css@1.1.0`, and `ui-vue@1.1.0`, plus
the Composer constraint `codemonster-ru/ui-razor:^1.1.0`. The package lock resolves the npm
dependencies to public registry tarballs and retains no local UI archives.

The complete [Annabel CI run](https://github.com/codemonster-ru/annabel/actions/runs/31840919106)
passed on PHP 8.2, 8.3, and 8.4. Each CMS job installed 41 npm packages from the registry and
reported zero npm vulnerabilities, published 47 CodeMonster UI assets, transformed 69 modules in
the production Admin build, passed 68 PHPUnit tests with 182 assertions, completed PHPStan without
errors, and reported no Composer security advisories. The same run also passed every Annabel
package, ecosystem, MySQL, Redis, and manifest/architecture job.

These registry and representative-consumer results close `CMUI-191` and `CMUI-G011` without
scheduling React or Angular packages.
