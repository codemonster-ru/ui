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
  // The three M16 components, also standalone closures. Card is listed and
  // Panel is not: VfPanel is the nearest structural neighbour VfCard has and is
  // deliberately not migrated, so its stylesheet has no business in an artifact
  // that ships only migrated components. Adding it "for later" would put rules
  // for an unmigrated component into the cascade with nothing comparing them.
  'packages/styles/src/components/skeleton.css',
  'packages/styles/src/components/avatar.css',
  'packages/styles/src/components/card.css',
];
