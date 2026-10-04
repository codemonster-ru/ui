// The canonical stylesheets the Razor artifact is built from, in cascade order.
//
// Its own module because two things need the list and neither may guess it:
// build-assets.mjs concatenates these files, and scripts/ci/check-razor-package.mjs
// asserts that the artifact's provenance records exactly them. Importing the
// builder would have run a build as a side effect of asking a question.
//
// Every entry is a neutral owner - packages/theme or packages/styles - which is
// what scripts/ci/check-asset-boundary.mjs enforces.
export const styleSources = [
  'packages/theme/.generated/theme/tokens.css',
  'packages/theme/.generated/theme/theme.css',
  'packages/styles/src/foundation/base.css',
  // The icon layout the Vue icons package used to carry in a <style scoped>
  // block. Both adapters read it from here now, which is what let the Razor
  // renderer stop injecting those declarations as an inline style attribute.
  'packages/styles/src/components/icon.css',
  'packages/styles/src/components/input.css',
  // VfProgressSpinner, the M20 component and a standalone closure of 12 rules
  // plus two keyframes. Until M20 it reached this artifact only as the import
  // at the top of button.css, which is how the button's loading state got its
  // spinner styled; that import is still there, because it is the historical
  // stylesheet's, and the builder inlines each file once. Listed here on its
  // own account, before the button, so the artifact's provenance names the
  // spinner as an owner rather than as something the button happened to pull
  // in - and so an artifact built without the button would still have it.
  'packages/styles/src/components/progress-spinner.css',
  // VfButton. Its first line imports progress-spinner.css, which the entry
  // above has already inlined, so the import resolves to nothing here and the
  // spinner rules appear exactly once, in the same position they always had.
  'packages/styles/src/components/button.css',
  // VfTextarea, whose only declared dependency is field.css - already neutral
  // and already reached through input.css, so this adds one file, not a closure.
  'packages/styles/src/components/textarea.css',
  // The three checkable controls. Each is a standalone closure - none of them
  // imports another stylesheet - so this adds three files, not three closures.
  'packages/styles/src/components/checkbox.css',
  'packages/styles/src/components/radio.css',
  'packages/styles/src/components/switch.css',
  // The three M15 presentation components, also standalone closures. Badge and
  // Tag are listed as two files rather than folded together: their tone
  // modifiers do different things - a badge tone paints a background, a tag
  // tone only a border and text colour - and merging them is the one change
  // that would make the two components visually interchangeable.
  'packages/styles/src/components/badge.css',
  'packages/styles/src/components/tag.css',
  'packages/styles/src/components/divider.css',
  // The three M16 components, also standalone closures.
  'packages/styles/src/components/skeleton.css',
  'packages/styles/src/components/avatar.css',
  'packages/styles/src/components/card.css',
  // VfSkeletonGate, the first migrated component that renders another. Its
  // stylesheet is a standalone closure like the rest - it imports nothing, and
  // in particular it does not import skeleton.css. The gate styles the fade,
  // the overlay box and the content wrapper; the skeleton styles itself, and
  // reaches this artifact one line above on its own account rather than as the
  // gate's dependency. Listed after skeleton.css so the cascade order matches
  // the order packages/core/src/styles/components.css imports them in.
  'packages/styles/src/components/skeleton-gate.css',
  // VfPanel, the M18 component and a standalone closure of three rules. It is a
  // separate file from card.css and must stay one: the two stylesheets share a
  // shape - a flex column, a padding, a bordered radius, a title rule - and
  // nothing else. Their modifiers do different things (compact changes padding
  // and gap, subtle changes background and shadow) and panel.css has no
  // `__body` rule at all, because a panel has no body wrapper. Folding them
  // into one "surface" stylesheet is the single change that would make the two
  // components visually interchangeable.
  'packages/styles/src/components/panel.css',
  // VfAlert, the M19 component and a standalone closure of 17 rules: the root,
  // six tone modifiers, the icon container with its six tone colours, the
  // content wrapper, the title and the body. Listed last, which keeps it after
  // badge.css and tag.css as packages/core/src/styles/components.css has it;
  // no alert selector overlaps another file's, so nothing else about the
  // position matters. Its tone modifiers share names with badge.css and tag.css and nothing else:
  // an alert tone repaints a bordered surface and recolours a glyph, and no
  // rule in this file exists in either of theirs. There is no dismiss-control
  // selector, because the reference has no dismiss control.
  'packages/styles/src/components/alert.css',
  // VfProgressBar, the M21 component and a standalone closure of 17 rules
  // plus three keyframes: the track, the fill, the striped fill, seven tone
  // modifiers, the label, the indeterminate fill and its two pseudo-elements,
  // the animated stripes and a reduced-motion override. It was Vue-owned
  // until M21 and reached no Razor artifact at all. Listed after alert.css,
  // which keeps the order packages/core/src/styles/components.css has for the
  // two files that matter here: progress-bar.css before progress-spinner.css.
  // It is a separate file from progress-spinner.css and must stay one: the
  // two share the tone names and nothing else - a bar tone recolours a fill
  // and a label, a spinner tone recolours an arc - and no selector in this
  // file exists in that one. Folding them into one "progress" stylesheet is
  // the single change that would make the two components look interchangeable.
  'packages/styles/src/components/progress-bar.css',
  // VfAccordion, the M22 component and a standalone closure of 10 rules: the
  // root, the trigger with its expanded, focus and hover states, the icon
  // with its rotation, and the region with its inner wrapper. It was
  // Vue-owned until M22 and reached no Razor artifact at all. Listed last;
  // no accordion selector overlaps another file's, so nothing else about the
  // position matters. What is *not* here is anything the JavaScript
  // transition writes: height, opacity, overflow and the transition itself
  // are inline declarations the controller owns, exactly as the reference's
  // hooks own them, and the stylesheet carries only the resting states.
  'packages/styles/src/components/accordion.css',
  // VfStepper, the M23 component and a standalone closure of 48 rules: the
  // root, the list with its vertical rail pseudo-elements (the progress
  // scale is the `--vf-stepper-progress-factor` custom property the server
  // writes inline), the item, the trigger in both orientations, the rail,
  // the connectors, the marker, the content, the label and description, the
  // four item states, the first/last connector fades, the disabled item,
  // focus-visible and the content-position variants. It was Vue-owned until
  // M23 and reached no Razor artifact at all. Listed last; no stepper
  // selector overlaps another file's. It is a separate file from
  // progress-bar.css and from accordion.css and must stay one: the rail is
  // not a progress bar's track, and the trigger is not an accordion's -
  // no rule in this file exists in either of theirs.
  'packages/styles/src/components/stepper.css',
  // The internal horizontal scroller VfTabs renders, the M24 closure's first
  // half: the scroller root with its custom properties, the viewport, the two
  // controls with their hidden and not-yet-ready states, and the two fades.
  // Not a migrated component: it is the internal implementation VfTabs owns,
  // and it is listed on its own account, before the tabs, because tabs.css
  // imports it first and the builder inlines each file once - so the
  // provenance names the scroller as an owner rather than as something the
  // tabs happened to pull in. In packages/core it also serves the unmigrated
  // VfMenuBar through the core forward; that entry is not in this artifact.
  'packages/styles/src/components/horizontal-scroller.css',
  // VfTabs, the M24 component. Its first line imports horizontal-scroller.css,
  // which the entry above has already inlined, so the import resolves to
  // nothing here and the scroller rules appear exactly once, in the same
  // position they always had. What follows is the tabs closure: the root, the
  // list, the viewport, the tablist, the scroll buttons with their hidden
  // modifier, the baseline, the tab with its selected, hover, active, disabled
  // and focus states, the indicator with its ready and no-transition
  // modifiers, and the panel. It was Vue-owned until M24 and reached no Razor
  // artifact at all. Listed last; no tabs selector overlaps another file's.
  'packages/styles/src/components/tabs.css',
  // VfLink, the M25 component and a standalone closure of eight rules: the
  // anchor with its border, colour, type and transition, the hover and active
  // colours, the hover-underline modifier, the focus ring, the muted tone, the
  // always-underline modifier, and the two focus overrides that drop the
  // underline while the ring is shown. It imports nothing and nothing imports
  // it. There is no rule for a router's active or exact-active class, because
  // the reference styles none: the stylesheet knows one element, `a.vf-link`,
  // whichever branch rendered it. Listed last; no link selector overlaps
  // another file's.
  'packages/styles/src/components/link.css',
  // VfBreadcrumbs, the M26 component and a standalone closure of eight rules:
  // the nav, the list, the item, the type shared by the link and the current
  // span, the link with its colour, hover and focus ring, the current span,
  // its disabled modifier, and the separator box sized by the small icon
  // token. It imports nothing and nothing imports it; the separator glyph is
  // laid out by icon.css, which both adapters already load. There is no rule
  // for a router's active class and no dependency on link.css: the anchor
  // here is `a.vf-breadcrumbs__link`, never `a.vf-link`. Listed last; no
  // breadcrumbs selector overlaps another file's.
  'packages/styles/src/components/breadcrumbs.css',
  // The overlay token aliases, the M27 closure's first half: seven custom
  // properties on `:root`, no selector and no behaviour. Not a component and
  // not migrated on its own - seven core entries still import it through the
  // core forward, exactly as VfMenuBar still reaches horizontal-scroller.css -
  // and it is listed on its own account, before the menu, because menu.css
  // imports it first and the builder inlines each file once, so the provenance
  // names it as an owner rather than as something the menu happened to pull in.
  //
  // It is load-bearing rather than decorative: `--vf-overlay-border-width` is
  // defined here and nowhere else, the generated theme *reads* it without
  // defining it, and `.vf-menu__item` takes its border width from it. Without
  // this file the border shorthand is invalid at computed-value time and the
  // width falls back to `medium`, which is the divergence the measured styles
  // would report. It is not evidence for an overlay runtime: there is no rule
  // here to run.
  'packages/styles/src/components/overlay-primitives.css',
  // VfMenu and VfMenuItem, the M27 pair and one closure of ten rules: the menu
  // column, the item, its icon and label, the disabled, focus-visible and hover
  // states, the active modifier with its hover override, and the danger tone
  // with its own hover and focus. One rule is the menu's and nine are the
  // item's; they share a block name and no descendant selector, which is why
  // `.vf-menu__item` styles correctly with no `.vf-menu` ancestor. Its first
  // line imports overlay-primitives.css, which the entry above has already
  // inlined, so the import resolves to nothing here and those tokens appear
  // exactly once, in the same position they always had.
  'packages/styles/src/components/menu.css',
  // VfDropdown, M28: the trigger wrapper and its focus ring, the fixed floating
  // panel with its two variants, the `--top` placement and the
  // vf-floating-transition enter-from/leave-to pair, the rotated arrow, and the
  // `.vf-dropdown__item` family a consumer may put in the panel. Its first line
  // imports overlay-primitives.css, already inlined above, so the tokens it
  // needs - the border width, the enter shift and scale, both arrow offsets -
  // appear once. No selector here overlaps another file's.
  'packages/styles/src/components/dropdown.css',
  // VfGroupBox, M29: the fieldset surface, the legend on its border, the title
  // with its ellipsis, the collapsible legend and trigger offsets, the icon and
  // its collapsed rotation, and the content padding. Its first line imports
  // button.css - the trigger is a ghost VfButton - which the builder has
  // already inlined above, so the button rules appear once and stay before
  // these, as they do in packages/core/src/styles/components.css. No selector
  // here overlaps another file's.
  'packages/styles/src/components/group-box.css',
  // VfPopover, M30: the trigger wrapper and its focus ring, the fixed floating
  // panel with its focus ring and forced-colors fallback, the
  // vf-floating-transition enter-from/leave-to pair, and the rotated arrow with
  // its two placement offsets. A standalone closure beside dropdown.css, not a
  // variant of it: the two share tokens and no selector. Its first line imports
  // overlay-primitives.css, already inlined above, so those tokens appear once.
  // Listed last; no selector here overlaps another file's.
  'packages/styles/src/components/popover.css',
  // VfTooltip, M31: the inline-flex wrapper and trigger, the fixed floating
  // tooltip with its enter-from/leave-to pair, and the rotated arrow whose two
  // sides share one overlap offset. A standalone closure beside popover.css,
  // not a variant of it: the two share tokens and no selector. Its first line
  // imports overlay-primitives.css, already inlined above, so those tokens
  // appear once. Listed last; no selector here overlaps another file's.
  'packages/styles/src/components/tooltip.css',
  // VfSelect, M32: the wrapper, the button trigger with its adornments, sizes,
  // floating-label paddings and states, the clear button, the scrolling
  // listbox and the option states. Its first lines import field.css,
  // icon-button.css and dropdown.css - the listbox is a `.vf-dropdown__menu`
  // and every option a `.vf-dropdown__item` - all three already inlined
  // above, so they appear once and before these overrides, as in
  // packages/core/src/styles/components.css. Listed last.
  'packages/styles/src/components/select.css',
  // VfNavMenu, M33: the nav, the breakpoint probe the compact sidebar is
  // measured against, the lists, groups, branch buttons, leaves, collapse
  // wrappers and the four variant/compact layers. It imports nothing; its
  // leading and trailing glyphs are `.vf-icon`s, laid out by icon.css above.
  // No selector here overlaps another file's. Listed last.
  'packages/styles/src/components/nav-menu.css',
  // VfFieldset, M34: the grid fieldset with its border and padding reset,
  // the legend, the control wrapper and the description and error captions.
  // A standalone closure that imports nothing, and a separate file from
  // group-box.css - the other migrated fieldset - with which it shares no
  // selector. Listed last.
  'packages/styles/src/components/fieldset.css',
  // VfTable, M34: the bordered wrapper, the scroll container, the table and
  // its cells, the caption, the head and foot paints, the row separators and
  // the four modifiers - sticky-header is position: sticky on the head cells,
  // the whole of that feature. A standalone closure that imports nothing.
  // VfDataTable imports the same file in core and is not in this artifact.
  // Listed last.
  'packages/styles/src/components/table.css',
];
