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
];
