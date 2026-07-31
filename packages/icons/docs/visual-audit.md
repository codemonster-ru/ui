# VueForge Icons Visual Audit

Audit date: 2026-07-30. The baseline was captured before the reference-set redraw. Machine-readable
measurements are in `src/lib/iconAudit.json`; the local showcase exposes the same data with bounds,
bounds centers, baseline, optical offsets, sizes, contexts, families, and before/after modes.

## Scope and method

- 116 component icons, all metadata groups, catalog entries, optical offsets, and showcase entries
  were inspected.
- Every component was rendered at 512 px with Resvg. Visible alpha pixels were reduced to a
  normalized 24-unit canvas for comparable bounds, bounds center, ink coverage, and internal-gap
  metrics.
- Source templates were inspected for primitives, fill/stroke use, stroke attributes, colors,
  forbidden features, and complexity.
- Metrics are triage signals. Compact chevrons and open forms are assessed optically rather than
  forced toward the bounds of closed objects.

### Baseline facts

| Measure                    |                               Baseline |
| -------------------------- | -------------------------------------: |
| Icons                      |                                    116 |
| Fill-only                  |                                     94 |
| Stroke-only                |                                     19 |
| Mixed fill/stroke          |                                      3 |
| Icons with optical offsets |                                     49 |
| Stroke widths              |     16, 40, 44, 52, 56 on a 512 canvas |
| Primitive types            |     path, circle, rect, line, polyline |
| Visual width               |           7.27–24 units; average 18.30 |
| Visual height              |           2.63–24 units; average 17.88 |
| Bounds area                | 45.53–576 square units; average 334.99 |
| Ink coverage               |           7.27%–79.05%; average 32.00% |

The 12.65× bounds-area spread and 10.87× ink-coverage spread are too large to be explained by
semantic shape alone. The showcase's former per-icon `inset` table and 49 optical offsets confirmed
that inconsistent source geometry was being corrected at presentation time.

## A. Systemic problems

### Critical

- The set mixes dense solid silhouettes, hollow masked solids, and broad stroke icons without a
  deliberate transition model. Small controls therefore change weight as users move between
  actions.
- Several masks paint the full canvas and rely on mask cuts. Their measured bounds reach 24×24 and
  their visual mass is much higher than neighboring open icons.
- Geometry is authored directly at 512 units with many unrelated coordinate schemes and ad-hoc
  transforms such as `scale(1.04)` or `scale(1.05)`. Those transforms conceal inconsistent keylines.

### Major

- Directional symbols use several head sizes, shaft lengths, and optical centers. Long arrows are
  displaced by roughly 2.4 normalized units before compensation.
- Common product objects use unrelated radii and openings. File, folder, mail, calendar, lock,
  database, and table geometry do not share a recognizable construction grammar.
- Visual centers are frequently corrected outside SVG geometry. The largest baseline deviations
  include `activity`, `terminal`, `upload`, `folderOpen`, `server`, and the long-arrow family.
- Dense objects contain more interior mass than simple signs can balance at 16 px. This creates
  noisy toolbars and uneven tables.

### Moderate

- Repeated system marks (`check`, `x`, plus/minus, information and warning marks) are redrawn at
  different proportions in containers and overlays.
- Curves range from circular to heavily softened rectangular forms without canonical radii.
- Negative spaces in document folds, mail flaps, locks, and storage cylinders are not related.
- Optical padding varies by icon and was manually duplicated in showcase configuration.

### Acceptable

- All icons use `currentColor`; no unsafe runtime SVG features are required.
- The package API, SSR path, accessibility attribute forwarding, and metadata/catalog coverage are
  structurally sound.
- Brand marks are intentionally excluded from the visual redraw and must continue to follow their
  owners' geometry and guidelines.

## B. Family problems

| Family            | Inconsistency                                                       | Canonical direction                                              |
| ----------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Arrows            | Different shafts, heads, lengths, and centers                       | 2-unit stroke; 5.75-unit head; shared terminal and join          |
| Chevrons          | Compact but not optically paired with arrows                        | 6.25-unit diagonal legs; intentional compact bounds              |
| Navigation/layout | Grid, columns, bars, expand/collapse have unrelated density         | 2-unit outer radius; 1.5-unit cell radius; shared panel keyline  |
| Files             | Fold, page width, and inner cuts differ                             | 12-unit body width; 5-unit fold; 2-unit corner language          |
| Folders           | Closed/open variants use unrelated silhouettes                      | Shared tab height, top seam, body radius, and baseline           |
| Users             | Heads and shoulders change across variants                          | 6–6.5 head diameter; open shoulder arc; standard overlay zone    |
| Communication     | Mail, message, send, bell use unrelated corner mass                 | 2-unit containers; controlled 2-unit stroke; open negative space |
| Editing           | Marks vary in size; trash and pencil are disproportionately dense   | Standard system marks and 18–20-unit tool bounds                 |
| Status            | Container circles and internal signs do not reuse marks             | 18-unit circle plus canonical check/x/info/warning symbols       |
| Alerts            | `warning` and `alertCircle` differ in mark construction             | Shared vertical mark and dot; 18–20-unit containers              |
| Charts            | `chartBar` reads as a list while `activity` is oversized/asymmetric | Shared L-axis; rounded data strokes; no decorative detail        |
| Tables            | `grid` and `columns` use different cell logic                       | One rounded frame, 5-unit header, 6.25-unit columns              |
| Security          | Lock/unlock body and shackle differ; shield uses separate weight    | 14.5-unit lock body, 8.5-unit shackle, standard badge zone       |
| Cloud             | Cloud sits low and is much wider than transfer marks                | 20-unit cloud keyline; transfer marks share canonical arrows     |
| Development       | Terminal is severely off-center; database/server are heavy          | 18-unit object bounds; restrained separators and indicators      |
| Commerce          | Card/wallet/receipt use unrelated radii and detail density          | 2-unit containers, no detail below minimum gap                   |
| Calendar          | Calendar, clock, history use different circular/rectangular weight  | 18-unit frame/circle and standard 2-unit dividers                |
| Media             | Eye and spinner families have unrelated stroke/mass                 | 18–20-unit round keyline and one internal focal element          |
| Layout            | Layers, grid, columns, expand/collapse do not share keylines        | 18-unit panel keyline and canonical 2-unit radius                |

## C. Individual-icon findings

Severity reflects the baseline, not the redesigned reference geometry.

| Icons                                                                                  | Severity   | Problem                                                                       | Action                       |
| -------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------- | ---------------------------- |
| `activity`, `terminal`                                                                 | critical   | Extreme visual-center deviation and unstable silhouette                       | Complete redraw              |
| `upload`, `folderOpen`, `server`                                                       | critical   | Low visual center; bottom-heavy mass                                          | Complete redraw              |
| `alertCircle`, `checkCircle`, `infoCircle`, `questionCircle`, `xCircle`, `rotateRight` | critical   | Full-canvas bounds and excessive ink compared with open controls              | Complete redraw              |
| `arrow*Long`                                                                           | major      | Approximately 2.4-unit directional center displacement                        | Rebuild from canonical arrow |
| `calendar`, `file`, `folder`, `mail`, `house`                                          | major      | Unrelated solid masses, folds, radii, and openings                            | Complete redraw              |
| `user`, `users`, `userPlus`, `userMinus`, `userCheck`                                  | major      | Family heads, shoulders, overlays, and centers conflict                       | Complete family redraw       |
| `database`, `hardDrive`, `server`, `cloud`                                             | major      | Infrastructure family varies sharply in density and vertical position         | Complete redraw              |
| `chartBar`                                                                             | major      | Metaphor resembles horizontal list, not bar chart                             | Complete redraw              |
| `grid`, `columns`                                                                      | major      | Layout metaphors have heavy filled frames and mismatched cells                | Complete redraw              |
| `bell`, `warning`, `lock`, `trash`                                                     | major      | Dense silhouettes lose interior clarity at 16 px                              | Complete redraw              |
| `download`, `upload`                                                                   | major      | Tray, arrow, and indicator details compete; pair is vertically inconsistent   | Complete redraw              |
| `gear`                                                                                 | major      | Mask-based teeth and hole are mechanically dense                              | Complete redraw              |
| `copy`, `clipboard`, `inbox`, `archive`                                                | major      | Stacked/container metaphors have inconsistent overlaps and weight             | Complete redraw              |
| `arrowLeft`, `arrowRight`, `arrowUp`, `arrowDown`                                      | moderate   | Existing stroke construction is sound but head rhythm needs a canonical model | Refinement                   |
| `chevronLeft`, `chevronRight`, `chevronUp`, `chevronDown`                              | moderate   | Compact bounds are valid; leg length and optical placement need pairing       | Refinement                   |
| `check`, `xmark`, `plus`, `minus`                                                      | moderate   | System marks have inconsistent reach and terminal weight                      | Refinement                   |
| `magnifyingGlass`                                                                      | moderate   | Oversized lens and handle connection relative to controls                     | Refinement                   |
| `pencil`, `filter`, `funnelX`, `sliders`, `sort`                                       | moderate   | Editing family has different density and detail scale                         | Redraw                       |
| `clock`, `history`, `refresh`, `circleNotch`                                           | moderate   | Circular motion family uses unrelated ring and arrow construction             | Redraw                       |
| `caret*`, `ellipsis`, `minus`, `info`                                                  | acceptable | Small bounds are semantically appropriate; compare by weight, not area        | Optical review               |
| Brand icons                                                                            | acceptable | External geometry is intentionally independent                                | Preserve                     |

The remaining icons are visible in the audit page and machine-readable JSON. A warning means
“inspect this case,” not “the icon is objectively bad.” In particular, bounds-area checks exempt
compact directional glyphs.

## Reference-set outcome

The 30-icon reference set reduces shipping optical offsets from 49 to 33. Its geometry uses one
24×24 canvas, one 2-unit stroke, round terminals/joins, and five visible primitive types. The
remaining mixed statistics are expected until a later, separately approved catalog migration.

On 2026-07-31, the project owner completed the reference review and accepted the current geometry
of all 30 candidates, including the final targeted revisions to `gear`, `bell`, `grid`, `pencil`,
and `users`. This approves the bounded reference set only. It does not expand the set or authorize a
catalog-wide migration.

## Automated review coverage

`npm run audit:icons` now records bounds and visual-center outliers, bounds and ink area, internal-gap
candidates, primitive complexity, fill/stroke construction, stroke attributes, hardcoded colors,
forbidden SVG features, exact and perceptually near geometry, related-family divergence, optical
offsets, and metadata/catalog/showcase/reference-set consistency. `npm run validate-icons` verifies
that the committed audit is current. `audit:centering` reports effective centers after offsets and
deliberately exits non-zero while review candidates remain.

After the approved directional Batch 2, the current audit flags 46 of 116 icons and records 27
remaining runtime optical offsets. Within the 30-icon reference set, `gear` triggers the
general bounds-area warning after the owner-selected 2-unit stroke increased its already broad
toothed contour. This remains a visual-review signal rather than an automatic failure. Centering
review is intentionally stricter and still calls out asymmetric reference metaphors such as cloud,
message, and transfer trays for human judgment.

## Review workspace

The local showcase now opens on `Reference review`, which contains only the 30 redesign candidates.
It renders old, new, and overlay samples at 16, 20, 24, and 32 px, with 20 px emphasized, followed
by visual bounds, geometric and rendered centers, optical offset, family, and treatment.

Additional owner-review modes are:

- `Stroke 1.75 / 1.8 / 2`: temporary CSS presentation overrides at 16, 20, and 24 px on neutral,
  low-contrast, light, and dark surfaces. The preview itself does not mutate canonical SVG data.
- `SaaS contexts`: light/dark and normal/compact production-density examples. In the integrated
  playground showcase, these contexts use the shipped `VfAppShell`, layout primitives,
  `VfNavMenu`, `VfInput`, `VfTabs`, `VfCard`, `VfAlert`, `VfDropdown`, `VfDataTable`, buttons, and
  icon buttons rather than a parallel hand-built component layer.
- `Families`: the requested related glyphs without icon-name labels.
- `Optical mass`: all candidates at 20 px with equal spacing and outline/silhouette-stress views.
- `Blind comparison`: deterministic A/B ordering, local voting, and a local summary.
- `Full audit`: the measured 116-icon catalog.

Blind votes use the `vueforge-icons-reference-review-votes-v1` localStorage key. They are not
exported by the package and do not enter metadata. The page's reset button removes the key.

### Stroke preview interpretation

The preview intentionally does not select a winner:

- `1.75` produces the quietest texture in dense rows, but its diagonals and small circular details
  lose presence sooner on low-contrast displays.
- `1.8` sits visually between the alternatives and makes the smallest change from the candidate
  geometry being reviewed.
- `2` is most resilient at 16 px and low contrast, but makes dense objects such as gear, calendar,
  database, users, and table layouts noticeably darker.

The owner should decide whether uniformity across dense objects, calmness in toolbars, or maximum
small-size robustness is the priority. The preview is evidence for that decision, not a token
selection algorithm.

After reviewing the three previews, the owner selected `2` as the canonical stroke for the
30-icon reference set. This records a stroke decision only; it does not approve the complete visual
language.

### Recorded owner-review decisions

As of 2026-07-31:

- blind comparison was completed for the 30-icon reference set, including renewed votes after the
  targeted `grid`, `pencil`, and `users` revisions;
- the corrected `gear`, redesigned `bell`, equal-cell `grid`, balanced `pencil`, and final
  three-person outline `users` candidates were accepted;
- the complete 30-icon `Reference review` set was accepted by the project owner;
- canonical 20 px `Outline` optical mass with a 2-unit stroke was accepted;
- the unlabelled `Families` comparison was accepted;
- `Silhouette stress` remains a diagnostic preview and is not an approval target;
- the component-based SaaS contexts were accepted in light/dark themes and normal/compact density
  after their replacement with the shipped Core and Layouts components.

These decisions approve only the named review stages and candidates. They do not approve the whole
visual language, expand the reference set, or authorize a catalog-wide migration.

### Subsequent migration decisions

On 2026-07-31, the project owner accepted directional Batch 2: `arrowLeft`, `arrowUp`,
`chevronLeft`, `chevronUp`, `caretLeft`, `caretRight`, `caretUp`, and `caretDown`. This completes the
standard arrow, chevron, and compact-caret rotations without changing the frozen 30-icon reference
set.

On 2026-07-31, the project owner accepted related-family Batch 3: `minus`, `userPlus`, `userMinus`,
`userCheck`, `unlock`, `fileText`, and `folderOpen`. The three user actions retain the approved
`user` geometry with a separate action symbol; `unlock` has a shortened open shackle; and
`folderOpen` uses a square rear folder with a right-tilted front flap.

On 2026-07-31, the project owner accepted system-feedback Batch 4: `info`, `question`,
`questionCircle`, `alertCircle`, `checkCircle`, `xCircle`, and `ban`. The circular variants share a
canonical container and optically balanced internal symbols; the standalone symbols use larger
production-scale forms.

On 2026-07-31, the project owner accepted visibility Batch 5: `eye` and `eyeSlash`. Both icons share
the same eye contour and circular pupil, while the hidden state adds one canonical rounded
diagonal. The catalog now contains 54 approved outline icons and 62 untouched solid icons.

## Review of the `style` metadata change

### Did real solid icons exist before the redesign?

Yes. At baseline, 94 of 116 components were fill-only and three mixed fill with stroke. Dense
silhouettes, masked counters, and filled object bodies were real rendering differences, not only a
catalog label. Nineteen components were already stroke-only even though every catalog entry said
`solid`, so the old field was not a fully accurate description of geometry.

### Why was the union expanded?

The reference set moved to stroke-based outline geometry. Expanding `style` made catalog metadata
for those 30 entries describe their new construction and allowed future creation/validation scripts
to emit `outline`.

### Is `style` used at runtime?

No. `VueIconify` selects a component from its name, forwards size/accessibility attributes, and
applies optical offsets. It never reads `iconCatalog.style`. The field is exported metadata and is
checked by authoring/generation scripts only.

### Does it change the public TypeScript contract?

Yes. `IconCatalogEntry.style` changed from the literal type `'solid'` to
`'solid' | 'outline'`. This is an additive union for producers, but it can break exhaustive consumer
code that assumed the only possible value was `solid`. Changing catalog values from `solid` to
`outline` is also an observable data change even without a TypeScript error.

### Was it necessary to render the redesign?

No. Components, Vue rendering, SSR, accessibility, optical offsets, and the review page work
without changing this field. The change is useful only if the package promises that `style`
accurately classifies shipped geometry or exposes style filtering to consumers.

### Recommendation

The widened union required a separate metadata/API decision rather than implicit approval with the
visual review. The available choices were:

1. revert the union and the 30 values while the outline direction is unapproved; or
2. retain it deliberately, define `style` as geometry classification, document mixed-catalog
   behavior, and version the public contract appropriately.

After approving the reference set, the project owner chose to retain `solid | outline`. The mixed
values now deliberately describe the incremental catalog: accepted migrated icons are `outline`,
while icons that have not been migrated retain `solid`. Runtime rendering remains
independent of the field. Release notes must identify the widened TypeScript union and changed
catalog values as a public metadata-contract change.

## Limits of automated icon validation

### Threshold provenance

Before the redesign, the only numeric visual threshold was the centering script's default of 8
rendered pixels on a 512 px raster. Existing generation checks validated names, metadata/catalog
coverage, duplicate metadata names, core-set references, the single `solid` style value, and removed
variant metadata; they did not measure visual quality.

The following warning thresholds were introduced during the reference-set work:

| Signal                      | Current threshold                  |
| --------------------------- | ---------------------------------- |
| Width and height            | outside 12.5–22.5 normalized units |
| Bounds area                 | outside 170–455 square units       |
| Ink coverage                | below 4% or above 55%              |
| Visual-center distance      | above 0.7 normalized unit          |
| Internal gap                | below 0.8 normalized unit          |
| Primitive count             | above 10                           |
| Perceptual-hash distance    | 1–12 bits                          |
| Related-family bounds ratio | above 1.35                         |

Compact carets and chevrons are exempt from width, height, and bounds-area warnings. Stroke checks
also require an explicit width and round caps/joins.

The width, height, area, center, family-ratio ranges, and compact-directional exception were tuned
with the new reference geometry visible. Ink, gap, primitive-count, and perceptual-hash limits were
general heuristics added in the same implementation, not statistically derived from an independent
approved set. Structural checks for hardcoded colors, forbidden features, missing stroke
attributes, and metadata mismatch do not depend on reference-set aesthetics.

### Circular validation risk

These values were not established by an independent, previously approved corpus. They were chosen
while the baseline and new reference set were both visible, and the compact-directional exception
was added in response to expected reference geometry. Therefore “none of the reference icons has a
general warning” is partly circular and must not be used as evidence that the reference set is
artistically successful.

The internal-gap check currently has an additional implementation limitation: pixel runs shorter
than 20 pixels in the 512 px audit raster are discarded before normalization (roughly 0.94 unit),
while the warning threshold is below 0.8 unit. In practice that makes the current small-gap warning
unreachable. It should be replaced with a topology-aware measurement and validated against known
bad fixtures before it is trusted.

The displayed bounds center is the midpoint of rendered visual bounds, not a model of human optical
perception or an alpha-weighted center of mass. It verifies placement inside the 24-unit canvas, but
directional arrows, speech tails, roofs, trays, and other asymmetric metaphors can still require
human optical judgment. The center warning must not generate an automatic offset or reject an icon.

### What a formally compliant bad icon can evade

A poorly drawn icon can stay inside the permitted bounds, use a 2-unit round stroke, contain fewer
than ten primitives, remain mathematically centered, and still have:

- awkward Bézier tension or lumpy curves;
- weak or ambiguous metaphor;
- ugly joins, tangencies, or counters;
- inconsistent terminal rhythm within a family;
- poor rasterization at a particular device pixel ratio;
- accidental resemblance to another library;
- culturally misleading or product-inappropriate semantics;
- excessive visual personality or insufficient distinctiveness;
- balanced total ink but badly distributed optical mass.

Perceptual hashes can identify coarse raster similarity but cannot prove copied geometry,
originality, family quality, or semantic appropriateness. Bounds and ink metrics also cannot
reliably compare an open check mark with a closed database or warning container.

### Properties that require human approval

Automated validation cannot approve elegance, confidence of proportion, premium product tone,
negative-space beauty, metaphor quality, curve character, the right degree of distinctiveness, or
the way a family feels during repeated real use. It can reject structural errors and prioritize
review candidates. Final approval must come from side-by-side, blind, small-size, family, mass, and
production-context review by the project owner.
