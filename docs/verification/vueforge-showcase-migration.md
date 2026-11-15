# VueForge showcase migration

The showcase reference is `fd793696f50d3be0fcd3788f0f8f751c63869963`. The component
restoration traces compare the public contracts with `d9879116`.

Core, Colors, Layouts, and Icons have separate URLs in both showcases. The two
implementations share a case inventory and property matrices. The optional
**Contract examples** mount Vue components in the Vue showcase and use canonical
HTML with the browser runtime in Vanilla.

## Historical component mapping

| Reference examples                                                                                | Current showcase and package support                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CodeBlock and executable Playground                                                               | The Vue showcase uses the maintained VueForge packages. Vanilla has a standalone code example and an iframe playground recipe for authored HTML, CSS, and JavaScript.                                                                                                  |
| ConfirmDialog, AuthLayout, ErrorLayout, FormLayout, GroupBox, PageHeader, Panel, and SkeletonGate | Vue exports these from `ui-vue` and `ui-layouts`. Vanilla uses shared HTML and CSS, with runtime enhancement where appropriate. The confirmation recipe uses the Dialog controller and application-owned async state.                                                  |
| DatePicker time, multiple dates, ranges, and month or year selection                              | Vue and Vanilla support these modes, accessible calendar navigation and ISO form submission. `VfDatePicker` restores the historical locale, Monday start and body portal defaults.                                                                                     |
| Floating Field labels                                                                             | Shared Field styles support `in`, `on`, and `over`. The DatePicker examples follow focus, open and filled state, including when the calendar is portaled.                                                                                                              |
| DataTable                                                                                         | Both adapters support native rows, sizing, pinning and detail disclosure. `VfDataTable` adds historical key models, ordered sorting, numbered paging, and pointer or keyboard column reordering. Vanilla applications own the authored column order and query results. |
| Button, IconButton, and ProgressBar variants                                                      | Both showcases present the semantic Button and IconButton variants plus custom ProgressBar height and animated stripes.                                                                                                                                                |
| Drawer placement                                                                                  | Both adapters support top and bottom drawers alongside the logical start and end placements.                                                                                                                                                                           |
| Icon registry and theme provider                                                                  | `VueIconify` and the VueForge theme options plugin are available through the opt-in historical entry. Shared icon geometry, token CSS, and theme selection also work independently of Vue.                                                                             |

NavMenu, MenuBar, and Dropdown expose their historical pills appearance in both showcases.
The Vue Dropdown can bind an existing native button through `triggerAsChild` or `VfDropdown`.
It supports an optional portal and viewport collision positioning. Vanilla keeps authored Dropdown
markup inline and enhances its positioning and disclosure through the runtime.

The detailed [Vue core](historical-vue-core.md), [Vue ecosystem](historical-vue-ecosystem.md),
and [Vanilla](historical-vanilla.md) traces record compatibility gaps and verification evidence.

## Restored references

- Layouts includes AppShell and DocumentLayout configurations, the sticky
  AppShell header, and collapsed and mobile-open AdminLayout states.
- Core includes inline and single-expand navigation, vertical and inline
  Stepper, table loading and error, Skeleton dimensions and animation, and
  typography with the historical spacing and heading-scale matrices.
- Colors displays the current primitive scales and side-by-side light and dark
  semantic swatches, live control states, and sRGB contrast ratios calculated
  from the current palette.
- Icons displays all current system and brand glyphs with their available
  family and weight samples, keyboard-operable family tabs, historical keyword
  filtering, and a clipboard action. The operations dashboard demonstrates
  light and dark themes in regular and compact densities.

## Adaptations to the current API

The operations dashboard uses a standard Table for icon and action cells.
Search, status filtering and pagination work on the demo data. Commands such
as download and delete report the selected action in the preview.
The Colors comparison uses supported control variants and current token
pairings. Its contrast ratios are rounded from browser-rendered sRGB colors.

## Layout and composition previews

Layouts shows the primitive samples, responsive token values, sign-in and error
recipes, and five shell compositions in both adapters. The shell previews
offer widths from 320 px through 1536 px. The warehouse shows seven rows with
working pagination. The setup preview preserves entered values between steps.

Core includes recipes for panels, collapsible invoice details, loading and
ready states, responsive settings, a page header, and deletion confirmation.
Sign-in and deletion operate on demonstration state. The historical Annabel
and VueForge logos are used in the layout previews. The region switches use
showcase styles. Shell previews follow the historical viewport cutoff. Setup retains a 320 px
preview and shows step progress at narrow widths. AdminShell uses the expanded
Commerce tree and numbered warehouse pagination.

## Core page structure

The two showcases share the section order and introductory examples. Surface
recipes appear in Surface Components, loading recipes in Feedback, workspace
settings in Forms, the team header in Navigation and Disclosure, and deletion
confirmation in Modals and Commands. The full case inventory remains under
**Contract examples**.

## Colors, Layouts, and Icons details

Primitive colors are grouped by palette family. Setup uses the historical
step icons, a narrower Port field on wide previews, and a compact progress
bar on mobile. The icon tables follow the historical catalog order and
scroll inside the page at narrow widths. Color ratios use current tokens.
