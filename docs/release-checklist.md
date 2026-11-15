# Package release checklist

Run this checklist for CodeMonster UI npm releases from the repository root, on the exact commit
that will receive the package tags. VueForge releases belong to the archived project.

## 1. Choose the release channel

- Stable versions publish to npm tag `latest`.
- Prerelease versions such as `2.0.0-beta.1` publish to npm tag `next`.
- The package version, changelog heading, and Git tag version must match exactly.
- Do not publish an untested stable version under `next`; create a SemVer prerelease version first.

The tag preparation script derives `next` whenever the version contains a prerelease suffix and
`latest` otherwise.

## 2. Prepare the release commit

- Use Node.js 24.15 or newer and npm 11.9, matching CI and the root `packageManager` field.
- Start from the protected default branch with a clean worktree.
- Confirm the packages in scope use the target release versions and all other package versions remain
  unchanged.
- Confirm every package in scope has a non-empty matching section in its `CHANGELOG.md` file.
- Confirm the root `overrides` entry still resolves `js-beautify` to `2.0.3`, replacing the
  vulnerable `1.x` formatter dependency that `@vue/test-utils` declares.
- Review [release-notes.md](./release-notes.md).
- Confirm npm Trusted Publishing is configured for `.github/workflows/release-from-tag.yml`.
- Confirm the workflow has only `contents: write` and `id-token: write` permissions.

## 3. Run the complete verification sequence

Run every requested command even where `verify` repeats an earlier or later gate:

```bash
npm test
npm run audit:release
npm run verify
npm run typecheck
npm run lint:all
npm run build
npm run check:packed-consumers
npm run build:demo
npm run prepublish:all
```

All commands must pass on the release commit. Also confirm:

- CSS/export/consumer contracts pass for Core, Layouts, CodeBlock, and Playground.
- The production dependency graph has no known vulnerabilities, and no high/critical development
  advisory remains accepted.
- `npm ls --all` reports a valid dependency graph after the clean lockfile installation.
- ESM, CommonJS, Node ESM, SSR, and declaration-resolution smokes pass.
- Tree-shaking and deferred-runtime budgets pass.
- The demo manifest keeps Playground Core, TypeScript, and Shiki out of the initial static graph.
- `git diff --check` reports no whitespace errors.
- `git status --short` contains only reviewed release changes before the release commit, and is empty
  after that commit.

## 4. Inspect tarballs

`npm run prepublish:all` builds and runs dry-run packs for every npm package. For a CodeMonster UI
only train, `npm run prepublish:ui` provides the focused build and dry run. Dry runs print proposed
archive contents but do not create `.tgz` files. Review those file lists and inspect each target
explicitly when release metadata changes:

```bash
npm pack --workspace @codemonster-ru/ui-tokens --dry-run --ignore-scripts
npm pack --workspace @codemonster-ru/ui-icons --dry-run --ignore-scripts
npm pack --workspace @codemonster-ru/ui-runtime --dry-run --ignore-scripts
npm pack --workspace @codemonster-ru/ui-css --dry-run --ignore-scripts
npm pack --workspace @codemonster-ru/ui-utilities --dry-run --ignore-scripts
npm pack --workspace @codemonster-ru/ui-vue --dry-run --ignore-scripts
npm pack --workspace @codemonster-ru/ui-layouts --dry-run --ignore-scripts
```

For every proposed archive and generated consumer tarball, verify:

- every declared `exports` target exists, including JavaScript, declarations, and CSS;
- no source-only tests, examples, caches, or unrelated monorepo files are present;
- declaration files do not resolve through workspace-only aliases;
- package metadata, license, repository directory, engine, and peer ranges are correct;
- browser auto-CSS files and CSS-free Node artifacts are both present where declared.

## 5. Repeat clean consumer verification

`npm run check:packed-consumers`, run explicitly in section 3, creates real tarballs in isolated
temporary directories and installs only those archives into fresh npm, pnpm, and Yarn consumers. It
must pass without workspace links or source aliases.

Required scenarios:

- npm, pnpm, and Yarn installation with Vue 3.5;
- Vite browser build and TypeScript `NodeNext`/bundler resolution;
- Node ESM and CommonJS SSR without `document` shims;
- full CSS and component-subpath auto CSS;
- all explicit shared CSS exports and representative browser auto-CSS entries;
- one-component packed tree shaking with required CSS retained and unrelated CSS removed.

The separate `npm run check:consumer-tree-shaking` gate covers one-component, multi-component, and
full-namespace imports for Core and Layouts against the built workspace packages.

Repeat these consumers from the registry after publication to catch registry-only dependency or
tarball failures.

## 6. Publish in topological order

The release workflow publishes one package from one scoped tag. Create and push tags sequentially,
wait for each workflow and registry smoke to pass, then continue. Never use `git push --tags` for
this release.

CodeMonster UI packages use independent SemVer. Publish only packages included in the reviewed
cohort, in the [documented dependency order](./architecture/package-topology-and-releases.md#release-order).
Historical aggregate `ui/vX.Y.Z` tags do not trigger the publication workflow.

The workflow treats the packed archive as immutable: after verification builds the package, it packs
the target once with lifecycle scripts disabled, dry-runs publication of that exact `.tgz`, and then
publishes the same file. No workspace or package-directory publish may replace the final tarball
publish, and no rebuild may occur between packing, inspection, and publication.

For each package:

1. Create the annotated or lightweight tag on the reviewed release commit.
2. Push only that tag.
3. Watch `Release Package From Tag` to completion.
4. Confirm the expected npm dist-tag and GitHub Release.
5. Run the registry checks below before creating the next tag.

Example using a reviewed tokens release version:

```bash
git tag '@codemonster-ru/ui-tokens@2.0.0'
git push origin '@codemonster-ru/ui-tokens@2.0.0'
```

For a beta, update the package and changelog to a matching prerelease version first, then use a tag
such as `@codemonster-ru/ui-tokens@2.0.0-beta.1`. The workflow publishes it under `next`.

## 7. Registry, provenance, and integrity smoke

After each workflow completes:

```bash
npm view @codemonster-ru/ui-tokens@2.0.0 version dist.integrity dist.shasum --json
npm dist-tag ls @codemonster-ru/ui-tokens
```

Repeat with the package and version just published. Confirm:

- the expected version resolves from `latest` or `next`;
- integrity and shasum fields are present;
- npm displays provenance from the expected repository/workflow;
- the GitHub Release uses the matching changelog section;
- a fresh registry install passes TypeScript, browser build, SSR, and CSS import smoke tests;
- `npm audit signatures` passes in the clean npm consumer.

After every package in the cohort is available, run `npm run check:ui-registry-consumer`.
It installs the versions in the release checkout into a fresh consumer from the registry.

## 8. Rollback plan

Do not use unpublish as the primary rollback. Published consumers and lockfiles may already reference
the version.

For a stable regression:

1. Stop creating subsequent package tags.
2. Move `latest` back to the last verified version with `npm dist-tag add`.
3. Deprecate the faulty version with a precise message and replacement version.
4. Prepare and verify a forward patch release.
5. Publish the patch through the same sequential workflow.

Substitute the affected package, known-good version, and defective version in these examples:

```bash
npm dist-tag add @codemonster-ru/ui-icons@2.0.0 latest
npm deprecate @codemonster-ru/ui-icons@2.0.1 "Use the latest verified release."
```

For a prerelease regression, move `next` to the last verified prerelease:

```bash
npm dist-tag add @codemonster-ru/ui-vue@2.0.0-beta.1 next
```

If no prerelease should remain discoverable, remove `next` instead:

```bash
npm dist-tag rm @codemonster-ru/ui-vue next
```

Record the incident, affected versions, dist-tag changes, consumer impact, and forward-fix plan in
the release notes or issue tracker.

## 9. Complete the release

- Confirm all release tags point to the same reviewed release commit.
- Confirm internal dependency ranges resolve to published versions from the registry.
- Confirm `latest` or `next` is correct for every package.
- Confirm registry consumers pass with npm, pnpm, and Yarn.
- Record final workflow URLs, integrity values, and smoke results in the release issue.
- Announce the release after the complete registry consumer passes.
