# Icon line ownership

Status: Proposed  
Date: 2026-09-02

## Decision

Icons move into the CodeMonster line as **precomputed SVG data plus a thin renderer per platform**,
not as a ported rendering engine. `@codemonster-ru/ui-icons` publishes one module per icon holding
its rendered bodies; the Vue and Annabel Razor adapters look one up and emit it.

The generator that produces that data runs against the existing VueForge implementation, so the
geometry has one source and no one redraws anything.

## Why not port the renderer

`packages/vueforge-icons/src/lib/internal/outlineIcon.ts` is 2,135 lines. It is not a loop over path data: it
carries per-icon special cases — a mask for `funnelX`, duotone exceptions for `bars` and `ellipsis`,
solid-body overrides for `key`, `layers`, `magnifyingGlass` and `users`, secondary-paint placement
rules, optical offsets, and stroke widths per variant.

Reimplementing that in PHP would mean maintaining two engines that must agree on 879 outputs. They
would drift, and the drift would be invisible: an icon that renders slightly differently on one
platform still renders.

## Why precomputation works here

An icon is static. Its rendered form depends on the icon, the family, and the variant — never on
runtime state — so every output can be computed once.

That was measured rather than assumed. Rendering the existing component headlessly in Node, with no
browser and no bundler, produces:

|                        |                                     |
| ---------------------- | ----------------------------------- |
| Icons                  | 116                                 |
| Combinations attempted | 928 (116 × 2 families × 4 variants) |
| Rendered               | 879                                 |
| Whole set, raw         | 417,583 bytes                       |
| Whole set, gzipped     | 26,624 bytes                        |
| Per icon, gzipped      | 213 B min, 545 B median, 841 B max  |

The 49 that did not render are the seven brand icons outside `classic/solid`. That is correct rather
than a gap: a logo has one canonical form, and there is no thin-stroke GitHub mark. The brands are
`classic/solid` only, and the data records exactly that.

## Shape of the package

One module per icon rather than one file for everything. A consumer using five icons should ship
roughly 3 KB gzipped, not 26 KB, and per-icon modules is what lets a bundler do that. The Razor
adapter reads the same per-icon files, so neither platform loads the whole set to draw one arrow.

`CmIcon` is that renderer on the Vue side and `Codemonster\Ui\Components\CmIcon` on the Razor side.
Each reads a rendering and emits it; sizing, spin and colour are CSS on the emitted element. Only
the geometry is data, and neither adapter draws.

## Parity

The icons join the canonical DOM contract on the same terms as components: a fixture per icon, both
adapters compared against it, and `check:ui-controller-coverage` demanding both sides. A generated
data file makes that comparison nearly free — the two adapters are emitting the same string — which
is the point of moving the difficulty into generation rather than into rendering.

## Consequences

- `@codemonster-ru/ui-icons` joins the package catalog with its own budget and release order.
- `@codemonster-ru/vueforge-icons` is retained and untouched, as the rest of the VueForge line is.
  This adds a CodeMonster icon set; it does not deprecate the VueForge one.
- The generator is a build input, not a runtime dependency, and it pins the VueForge commit it read
  so a regenerated set is reproducible.
- Adding an icon means adding geometry to the source set and regenerating, which is the same shape
  the VueForge package already has.

## What would change this decision

An icon that cannot be precomputed — one whose rendering genuinely depends on runtime state rather
than on props known at build time. None of the 116 is such a case today.
