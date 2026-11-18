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

- Use Node.js 24.15 or newer and npm 11.17.0, matching the release workflow and the root
  `packageManager` field.
- Start from the protected default branch with a clean worktree.
- Confirm the packages in scope use the target release versions and all other package versions remain
  unchanged.
- Confirm every package in scope has a non-empty matching section in its `CHANGELOG.md` file.
- Review the [2.0 draft changelog](./codemonster-ui-2.0-release-notes.md).
- Confirm npm Trusted Publishing is configured for `.github/workflows/release-from-tag.yml`.
- Confirm only the publish job has `contents: write` and `id-token: write` permissions.

## 3. Verify the release commit

The tag workflow installs from the lockfile and runs `npm run verify` on the exact release
commit. This command checks the dependency graph and advisories, builds all seven packages,
runs source, integration, SSR and accessibility tests, and checks types, lint, documentation,
exports, package contents, size and tree shaking. It also installs real tarballs into isolated
npm, pnpm and Yarn consumers for browser builds, ESM and CommonJS SSR, TypeScript resolution
and CSS imports. Use `npm ci` followed by `npm run verify` to reproduce the package checks locally.

## 4. Check browser behavior and accessibility

The tag workflow runs the full behavior and stored visual checks with pinned Chrome on macOS
in parallel with package verification. Publication requires both jobs to pass on the tagged commit.

Before tagging, check representative cases in Firefox, WebKit, native Safari and mobile browsers
where applicable. Check keyboard navigation, focus and announcements with native VoiceOver and
NVDA. Record results and unresolved risks for the exact commit in the release issue. Include
narrow or enlarged-text DatePicker layout, edge placement of overlays, and showcase landmark,
scroll-region and contrast findings where still applicable. See the
[accessibility requirements](./architecture/accessibility-requirements.md) and the
[RC.2 manual scenarios](./verification/codemonster-ui-2.0-rc.2.md#manual-assistive-technology-acceptance).

## 5. Check the release package set

Confirm the intended package versions and their published dependency ranges. For an internal
2.0 handoff, use the [draft changelog](./codemonster-ui-2.0-release-notes.md) and retain the
candidate tarballs with SHA-256 digests and the source commit SHA.

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
publish, and no rebuild may occur between packing, inspection, and publication. The publish job
compares the verified SHA from both checks with the tag and validates SHA-256 on the downloaded
archive before using it.

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
- Confirm the npm registry smoke passes and the packed consumers passed with npm, pnpm, and Yarn.
- Record final workflow URLs, integrity values, and smoke results in the release issue.
- Announce the release after the complete registry consumer passes.
