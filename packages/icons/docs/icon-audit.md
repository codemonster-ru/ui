# Icon Audit

This file defines the preferred semantic choices for the current pack so the set does not drift into near-duplicates with unclear roles.

## Preferred Families

- Directional travel:
  Use `arrow*` for actual movement, navigation back/forward, and data flow.
  Use `chevron*` for disclosure, nested navigation, and compact step changes.
  Use `caret*` for very small dropdown toggles or dense table controls.

- Expandability:
  Use `chevronsUpDown` for sortable lists and "reorder / compare both directions".
  Use `expand` and `collapse` for panel sizing and layout changes, not for generic navigation.

- State confirmation:
  Use `check` for inline confirmation inside buttons or menus.
  Use `checkCircle` for final success state or completed process state.
  Use `xmark` for close, dismiss, or remove.
  Use `xCircle` for failed state or destructive status.
  Use `alertCircle` for non-terminal warnings where the object still needs attention.

- Loading and refresh:
  Use `refresh` for reload / sync / retry.
  Use `circleNotch` for loading or busy state.
  Use `rotateRight` only when the meaning is explicitly "redo / rotate / repeat".

- Search and filtering:
  Use `magnifyingGlass` as the primary search icon.
  Use `filter` as the primary filter affordance.
  Use `funnelX` only for clearing filters or indicating filtered-out state.
  Use `searchSlash` only when search is unavailable or intentionally disabled.

- People and access:
  Use `user` for a single account or profile.
  Use `users` for plural people and audience scope.
  Use `team` for group/organization semantics rather than generic people.
  Use `userPlus`, `userMinus`, `userCheck` only for explicit member lifecycle actions.

- Security:
  Use `lock` / `unlock` for object access state.
  Use `shield` for general protection or policy.
  Use `shieldCheck` for trusted, verified, compliant, or approved security state.
  Use `key` for credentials, tokens, or secret material.

- Files and storage:
  Use `file` as the neutral document primitive.
  Use `fileText` when document content matters.
  Use `folder` for neutral directory state.
  Use `folderOpen` when the open/active state matters.
  Use `archive` for cold storage or archived material.
  Use `hardDrive`, `database`, `server`, `cloud` only when the infrastructure layer is the actual meaning.

- Business primitives:
  Use `creditCard` for payment method.
  Use `wallet` for balance or stored value.
  Use `receipt` for billing record, invoice-like output, or transaction summary.
  Use `chartBar` for reporting and metrics, not for "activity" status.

## Core Set Policy

- `src/lib/iconCore.json` is the preferred starter set for product UIs.
- `src/lib/iconDualStyleCore.json` is the small, stricter set that should define the library's `solid + regular` language.
- New icons do not need to enter the core set automatically.
- New icons currently ship as `solid` only.
- A core-set addition should satisfy at least one of these:
  - solves a repeated SaaS/admin use case
  - replaces multiple ad hoc icons with one canonical semantic choice
  - is needed in dashboards, forms, tables, billing, auth, messaging, or infrastructure views

## Dual-Style Priority

- The current active track is `solid` first; do not add fresh `regular` variants while the base pack is being rebuilt.
- Do not try to add `regular` variants for the entire pack at once.
- A new `regular` icon should usually land only after its `solid` version feels visually stable.
- `solid + regular` should be developed first for the canonical primitives in `src/lib/iconDualStyleCore.json`.
- The dual-style core is the visual benchmark for the rest of the library.

## Deprioritized Duplicates

- `caret*` are kept for dense UI, but should not replace `chevron*` in regular navigation.
- `team` is valid, but not part of the core set because `users` covers more common product surfaces.
- `shield` stays outside the core set because `shieldCheck` is more specific and practical in SaaS admin flows.
- `sparkles`, `sun`, `moon`, `heart`, `star`, `bookmark` remain useful, but they are not core SaaS primitives.
