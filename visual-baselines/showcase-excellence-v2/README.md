# Showcase excellence v2

These are viewport captures for the private developer site. They record intentional layout
changes, separate from the [v1 showcase baseline](../showcase-excellence-v1/README.md) and
[approved component snapshots](../vueforge-cross-platform/manifest.json).

The paired showcase screens were captured from local production builds on macOS with Chrome
`157.0.8103.79` and Playwright `1.61.1`, at device scale factor 1 with reduced motion.
Before-build revision: `ebbb0b9d`. The before documentation images are the Markdown source
renderer from the supplied visual review, captured with Chrome for Testing `151.0.7922.138`.
There was no existing integrated guide route to pair with those two images. The calendar pair
uses an isolated Core build and a viewport centered on the open calendar.

| View              | Before                                                                                                             | After                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop overview  | [Vue](before/vue--core--1440--light.png) · [Vanilla](before/vanilla--core--1440--light.png)                        | [Vue](after/vue--core--1440--light.png) · [Vanilla](after/vanilla--core--1440--light.png)                                                                   |
| Narrow overview   | [Vue](before/vue--core--360--dark.png) · [Vanilla](before/vanilla--core--360--dark.png)                            | [Vue](after/vue--core--360--dark.png) · [Vanilla](after/vanilla--core--360--dark.png)                                                                       |
| Component catalog | [Vue](before/vue--components--1440--light.png) · [Vanilla](before/vanilla--components--1440--light.png)            | [Vue](after/vue--components--1440--light.png) · [Vanilla](after/vanilla--components--1440--light.png)                                                       |
| Button reference  | [Vue](before/vue--button--390--dark.png) · [Vanilla](before/vanilla--button--390--dark.png)                        | [Vue](after/vue--button--390--dark.png) · [Vanilla](after/vanilla--button--390--dark.png)                                                                   |
| Documentation     | [Markdown light](before/markdown--docs--1440--light.png) · [Markdown dark](before/markdown--docs--1440--dark.png)  | [Desktop light](after/vue--docs--1440--light.png) · [Desktop dark](after/vanilla--docs--1440--dark.png) · [Narrow dark](after/vanilla--docs--360--dark.png) |
| Release Workspace | [Desktop Vue](before/vue--workspace--1440--light.png) · [Narrow Vanilla](before/vanilla--workspace--360--dark.png) | [Desktop Vue](after/vue--workspace--1440--light.png) · [Narrow Vanilla](after/vanilla--workspace--360--dark.png)                                            |
| Inline calendar   | [Vue](before/vue--calendar--360--light.png) · [Vanilla](before/vanilla--calendar--360--light.png)                  | [Vue](after/vue--calendar--360--light.png) · [Vanilla](after/vanilla--calendar--360--light.png)                                                             |
| Menu and search   | No site drawer or unified search                                                                                   | [Narrow menu](after/vue--menu--360--dark.png) · [Narrow search](after/vanilla--search--360--dark.png) · [Desktop search](after/vue--search--1440--dark.png) |

The overview now puts installation first and retains direct access to the demos. The mobile header
occupies one row. Component cards add a description and keep their category. Detail pages put the
live preview before copyable code and replace dense API rows with a readable list. The workspace
gives deployment status a distinct place and keeps filters and their results together.

Reproduce the after set by serving both production outputs and running the
[browser matrix](../../scripts/visual/check-showcase-ux.mjs). Install Playwright in a temporary
directory, set `SHOWCASE_PLAYWRIGHT` to its package path and `SHOWCASE_CHROME` to a Chrome
executable. Set `SHOWCASE_CAPTURE_DIR` to a fresh directory to save screenshots. The matrix
defaults to local ports 4173 and 4174; `SHOWCASE_VUE_URL` and `SHOWCASE_VANILLA_URL` override them.

See the [verification register](../../docs/verification/SHOWCASE-UX-REFINEMENT.md) for acceptance
and coverage limits.
