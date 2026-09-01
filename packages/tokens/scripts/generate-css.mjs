import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  cmBreakpointTokenNames,
  cmBreakpointTokens,
  cmDarkThemePreset,
  cmLightThemePreset,
  serializeCmThemeTokensToCssVars,
} from '../dist/index.js';

function serializeDeclarations(tokens, include) {
  const includedTokens = Object.fromEntries(Object.entries(tokens).filter(([name, value]) => include(name, value)));

  return Object.entries(serializeCmThemeTokensToCssVars(includedTokens))
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');
}

const lightTokens = cmLightThemePreset.tokens;
const darkTokens = cmDarkThemePreset.tokens;
const breakpointTokenNames = new Set(cmBreakpointTokenNames);
const breakpointDeclarations = serializeDeclarations(cmBreakpointTokens, () => true);
const lightDeclarations = serializeDeclarations(lightTokens, (name) => !breakpointTokenNames.has(name));
const darkDeclarations = serializeDeclarations(darkTokens, (name, value) => lightTokens[name] !== value);
const breakpointCss = `:root {
${breakpointDeclarations}
}
`;
// The dark declarations are emitted twice on purpose. The media query is what makes `system` resolve
// with no JavaScript at all, and the attribute rule is what lets an explicit choice override the
// operating system. Matching `:not([data-cm-theme='light'])` rather than `:not([data-cm-theme])`
// means a root stamped `system` resolves through the media query too, so the server can render the
// unresolved preference verbatim instead of having to guess which way it resolves.
const tokenCss = `@import './breakpoints.css';

:root,
[data-cm-theme='light'] {
${lightDeclarations}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-cm-theme='light']) {
${darkDeclarations.replace(/^/gmu, '  ')}
  }
}

[data-cm-theme='dark'] {
${darkDeclarations}
}
`;

writeFileSync(resolve(import.meta.dirname, '../dist/breakpoints.css'), breakpointCss);
writeFileSync(resolve(import.meta.dirname, '../dist/tokens.css'), tokenCss);
