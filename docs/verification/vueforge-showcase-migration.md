# VueForge showcase migration

Reference: `fd793696f50d3be0fcd3788f0f8f751c63869963`.

Core, Colors, Layouts, and Icons have separate URLs in both showcases. The two
implementations share the case inventory and property matrices. The open Core
matrices render the same canonical HTML in both showcases. The optional
**Contract examples** mount Vue components in the Vue showcase and use canonical
HTML with the browser runtime in Vanilla.

## Historic features outside the current API

| Reference examples                                                                                     | Current equivalent or missing capability                                                                                                  |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| CodeBlock and executable Playground                                                                    | Neither package is part of CodeMonster UI.                                                                                                |
| ConfirmDialog, ErrorLayout, AuthLayout, FormLayout, GroupBox, PageHeader, Panel, and SkeletonGate      | These are application compositions. The current recipes cover them using composition primitives where applicable.                         |
| DatePicker time, multiple dates, ranges, and month or year selection                                   | The current picker accepts a single calendar date and supports limits, clearing, and native form submission.                              |
| Floating Field labels and the in, on, and over variants                                                | The current Field contract exposes label, description, error, and control relationships.                                                  |
| DataTable pinned columns, drag reordering, resizing, expandable detail rows, and custom cell renderers | The current examples cover sorting, pagination, selection, visible columns, density, stripes, dividers, and sticky headers.               |
| Success, info, warn, help, and contrast Button and IconButton variants                                 | The current controls have primary, secondary, danger, and ghost variants. Semantic status colors are demonstrated on feedback components. |
| ProgressBar custom height and animated stripes                                                         | The current bar has determinate and indeterminate modes, tones, and optional numeric text.                                                |
| Drawer top and bottom placement                                                                        | The current Drawer supports logical start and end, including full size.                                                                   |
| VueForge icon registry and theme provider APIs                                                         | The current examples use shared icon geometry and the token theme contract.                                                               |

The historical pills variant for Dropdown, NavMenu, and MenuBar
has no matching variant in the current APIs.

This inventory describes API differences. It does not certify that every
historical composition or interaction with an equivalent API has been ported.

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
showcase styles for options outside the current layout API. Shell previews follow the historical viewport cutoff. Setup retains a 320 px
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
