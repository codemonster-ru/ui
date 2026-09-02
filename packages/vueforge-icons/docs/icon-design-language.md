# VueForge Icon Design Language

## Character

VueForge Icons are calm, precise outline symbols for B2B SaaS and administrative interfaces. They
should feel designed rather than decorated: confident proportions, modest detail, stable negative
space, and clear metaphors at 16–24 px. Avoid cartoon softness, sharp technical aggression,
illustrative detail, and ornamental asymmetry.

The geometry is original to VueForge. Common metaphors may be studied, but paths must not be copied
from another icon library.

## Canvas and keylines

- Canvas: `0 0 24 24`.
- Primary safe area: `2.5..21.5`; ordinary strokes should remain inside it including caps.
- Default object box: 18×18, centered at (12, 12).
- Circular forms: 18-unit diameter. A round contour may optically overshoot by up to 0.25.
- Square forms: 18×18 with a 2-unit outer radius.
- Wide forms: up to 20.5 units wide and normally 14–17 units high.
- Tall forms: up to 20 units high and normally 13–17 units wide.
- Compact signs such as chevrons are intentionally smaller; matching apparent weight is more
  important than matching area.
- Optical overshoot is allowed for circles, diagonals, and pointed forms up to 0.25 unit. Anything
  larger needs a documented reason.
- SVG source geometry must be corrected before adding `iconOpticalOffsets`. Runtime offsets are a
  last-mile exception, not a layout system.

## Stroke system

- Primary stroke: `2`.
- Use one shared stroke throughout an icon; do not introduce local weight variants.
- `stroke="currentColor"`, `fill="none"`, `stroke-linecap="round"`,
  `stroke-linejoin="round"`.
- Do not mix weights inside an icon unless an optical test at 16 px proves that the hierarchy is
  necessary.
- Coordinates normally use whole, half, or quarter units. Eighth/hundredth units are permitted for
  deliberate optical curves, never as incidental generator output.
- Intersections should look continuous. Avoid doubled segments, near-tangent joins, and tiny
  wedges of negative space.
- A visible segment should normally be at least 2 units long.
- Functional negative gaps should be at least 1.25 units at source size. Prefer 1.5–2 units inside
  dense objects.

## Radius, diameter, and spacing scale

- Outer surface radius: 2.
- Small cell/badge radius: 1.5.
- Internal soft corner: 1.
- User head: 6–6.5 diameter.
- Status container: 18 diameter.
- Notification dot: 3 diameter; 3.5 when placed outside a dense parent.
- Standard inset between outer contour and inner detail: 3.
- Standard repeated-detail gap: 2.5–3.
- Baseline for object icons: approximately y=20; pointed or circular silhouettes may overshoot
  optically.

## Canonical primitives

### Direction and system marks

- Arrow: a straight shaft with a 5.75-unit head. The two head legs meet the shaft at one node.
  Long variants retain the same head and only extend the shaft.
- Chevron: two 6.25-unit diagonal legs. Compact bounds are intentional; the point receives a small
  optical shift toward the open side.
- Plus/minus: 14.5-unit reach centered at (12,12); identical cap treatment.
- X: two 12.5-unit diagonals centered at (12,12).
- Check: short rising entry and longer confirming exit; the elbow sits slightly left and below
  center so the mark feels stable.
- Dots: use round caps for micro-dots in stroked icons. Ellipsis dots use equal diameter and spacing.

### Containers and objects

- Circle: center (12,12), radius 9 for status containers.
- Rounded rectangle: 18×17–18, radius 2.
- Document: 12-unit body width, 18.5-unit height, 5-unit folded corner.
- Folder: 18.5-unit top seam, shallow tab, 2-unit body radius; open/closed variants must share the
  same tab and baseline.
- User: 6–6.5-unit head and one open shoulder arc. Do not close the torso into a heavy pill.
- Badge overlay: reserve the lower-right 7×7 zone; use the canonical plus, minus, check, x, or dot
  scaled as a unit, with at least 1.5 units separation from the parent.
- Calendar: 18×16.5 frame, 4.75-unit header, two binders; grid detail uses dots or a maximum of two
  internal rows.
- Table: 18.5×17 frame, 5-unit header, canonical 6.25-unit columns.

### Status and infrastructure

- Warning: balanced triangular contour plus canonical vertical mark/dot.
- Information: 18-unit circle plus a 6-unit stem and round dot.
- Lock: 14.5-unit body, 8.5-unit shackle; the keyhole is a single short vertical mark.
- Cloud: one continuous outer contour, no tiny bumps; transfer overlays use canonical arrows.
- Database: one top ellipse, two repeated vertical stages, equal separators.
- Chart: L-axis with rounded data bars; avoid list-like horizontal rows unless the metaphor is
  explicitly a list.

## Arrow, diagonal, and overlay rules

- Standard diagonals favor 45° where the metaphor permits. Optical diagonals may deviate to improve
  width or gesture.
- Arrowheads, chevrons, checks, and x marks must use the shared primitives rather than local
  approximations.
- A badge does not deform its parent. Reduce or open the parent silhouette before shrinking the
  badge.
- Notification dots sit at the upper-right optical corner and may overshoot the parent by 0.25.
- Badge symbols must remain readable at a rendered 16 px; remove parent detail before adding badge
  detail.

## Optical mass

- Compare apparent presence at 16, 20, and 24 px, not only bounds area.
- Closed contours naturally look heavier: give them larger counters and fewer internal lines.
- Open symbols naturally look lighter: allow slightly longer reach, but do not thicken them by
  default.
- Circular forms receive slight overshoot; diagonals may extend farther than orthogonal segments.
- Asymmetric metaphors are balanced by moving geometry, not by adding decorative mass.
- Prefer no more than three interior lines. A fourth requires a small-size legibility check.
- Preserve one dominant negative-space shape. Several tiny holes make an icon look generated and
  noisy.
- Simple signs may be compact but should not look timid beside objects. Their stroke and reach,
  rather than a filled background, provide presence.

## Quality score

Review every icon from 1–5 for:

1. semantic clarity;
2. silhouette clarity;
3. optical balance;
4. family consistency;
5. small-size legibility;
6. negative-space quality;
7. geometric confidence;
8. visual distinctiveness;
9. implementation cleanliness.

For reference-set acceptance, also record proportions and overall refinement. An average below 4
is not complete. Automated metrics can flag outliers, but cannot approve visual quality.

## Authoring and review

1. Start from a canonical primitive and semantic family.
2. Draw on the 24-unit keyline system without copying third-party SVG.
3. Inspect black-on-white and white-on-dark at 16, 20, 24, and 32 px.
4. Compare with every family neighbor and with a simple mark, a closed object, and a dense object.
5. Test in a toolbar, table row, navigation item, and status message.
6. Run `npm run audit:icons`, then review warnings visually.
7. Add an optical offset only if moving source geometry would make the shape mathematically or
   semantically incorrect.
