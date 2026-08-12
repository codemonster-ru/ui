# CodeMonster UI utility CSS contract

Status: Accepted  
Date: 2026-08-12  
Roadmap item: `CMUI-129`

## Scope

The initial `@codemonster-ru/ui-utilities` release is a generated, framework-independent CSS
package for common application layout and presentation. It complements semantic component CSS; it
does not recreate component variants or behavior.

The approved families are:

- Display: `cm-block`, `cm-inline-block`, `cm-inline`, `cm-flex`, `cm-inline-flex`, `cm-grid`, and
  `cm-hidden`.
- Flex direction and wrapping: `cm-flex-row`, `cm-flex-col`, `cm-flex-wrap`, and `cm-flex-nowrap`.
- Flex alignment: `cm-items-start`, `cm-items-center`, `cm-items-end`, and `cm-items-stretch`.
- Flex justification: `cm-justify-start`, `cm-justify-center`, `cm-justify-end`, and
  `cm-justify-between`.
- Grid columns: `cm-grid-cols-1`, `cm-grid-cols-2`, `cm-grid-cols-3`, `cm-grid-cols-4`,
  `cm-grid-cols-6`, and `cm-grid-cols-12`.
- Spacing: margin and padding forms using the `m`, `mt`, `me`, `mb`, `ms`, `mx`, `my`, `p`, `pt`,
  `pe`, `pb`, `ps`, `px`, and `py` prefixes, plus `cm-gap-{space}`, `cm-row-gap-{space}`, and
  `cm-column-gap-{space}`.
- Width and height: `cm-w-full`, `cm-min-w-0`, `cm-h-full`, the `cm-h-control-{size}` family, and
  the `cm-size-icon-{size}` family.
- Font family: `cm-font-base`, `cm-font-heading`, and `cm-font-mono`.
- Font weight: `cm-font-regular`, `cm-font-medium`, `cm-font-semibold`, and `cm-font-bold`.
- Type size and leading: the `cm-text-{size}` and `cm-leading-{value}` families.
- Text color: `cm-text-primary`, `cm-text-secondary`, `cm-text-muted`, `cm-text-disabled`,
  `cm-text-inverse`, and `cm-text-link`.
- Background color: `cm-bg-canvas`, `cm-bg-surface`, `cm-bg-surface-subtle`, and `cm-bg-inverse`.
- Border color: `cm-border-subtle`, `cm-border-default`, `cm-border-strong`, and `cm-border-divider`.
- Border and radius: `cm-border`, `cm-border-thick`, `cm-border-0`, and the
  `cm-rounded-{value}` family.

`{space}` is the complete spacing suffix set `0`, `1`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`,
and `16`. Directional spacing uses logical block and inline properties: `s` and `e` mean inline
start and inline end, while `x` and `y` set the inline and block pairs. Physical `left` and `right`
utilities are not included.

## Naming and generation

- Every class begins with `cm-`; no unprefixed or `vf-` alias is emitted.
- Names are stable kebab case and describe one CSS declaration, except paired-axis spacing and
  square icon sizing.
- Token-backed families reference public `--cm-*` custom properties. Generated CSS does not copy
  token values.
- Static layout values such as `display: flex`, `width: 100%`, and grid column counts are allowed
  where no design token is meaningful.
- Declarations do not use `!important` and are emitted inside `@layer cm-utilities`.
- Source order follows the tables above, then the declared token order. Generation is deterministic.

## Responsive variants

The first release generates mobile-first `sm`, `md`, and `lg` variants for display, flex direction,
wrapping, alignment, justification, grid columns, and gap utilities. A responsive class prefixes
the base name after `cm-`: `cm-md-flex`, `cm-lg-grid-cols-4`, or `cm-sm-gap-3`.

Responsive variants use the matching `--cm-breakpoint-*` contract value at generation time and emit
literal `min-width` media queries because custom properties are not valid media-query operands.
Spacing axes, sizing, typography, colors, borders, and radii remain unresponsive in the initial
scope to avoid a speculative class explosion.

## Limitations

- Utilities do not target component internals or encode hover, focus, disabled, theme, or ARIA
  states.
- There are no arbitrary values, negative spacing, order, positioning, z-index, overflow, shadow,
  opacity, or animation utilities in the initial release.
- Consumers may combine utilities on application wrappers and component roots, but stable component
  structure and accessibility remain owned by component APIs and contracts.
- Adding a family, suffix, responsive breakpoint, or compatibility alias is a public contract
  change and requires an explicit review.
