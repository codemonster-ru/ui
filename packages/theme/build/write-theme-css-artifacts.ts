#!/usr/bin/env node
// Writes the generated token CSS from its neutral owner.
//
// Before M09 these artifacts only existed as a side effect of building the Vue
// package, which is what made the Razor adapter depend on packages/core. They
// are product tokens that every adapter needs, so the theme package generates
// them and both adapters read the result.
//
// Run through vite-node because the generator is TypeScript:
//   npm run theme:tokens
import { buildThemeCssArtifacts, themeCssArtifactPaths } from './theme-css-artifacts';

buildThemeCssArtifacts();

process.stdout.write(
  `Wrote the generated theme CSS from its neutral owner:\n` +
    Object.entries(themeCssArtifactPaths)
      .map(([name, path]) => `  ${name}: ${path}\n`)
      .join(''),
);
