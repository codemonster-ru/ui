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
  // VfButton, which pulls in the progress spinner it renders while loading.
  // The spinner is not a migrated component of its own: it is the loading
  // affordance the button composes, so its rules travel with the button.
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
];
