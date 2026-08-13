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
const tokenCss = `@import './breakpoints.css';

:root,
[data-cm-theme='light'] {
${lightDeclarations}
}

[data-cm-theme='dark'] {
${darkDeclarations}
}
`;

writeFileSync(resolve(import.meta.dirname, '../dist/breakpoints.css'), breakpointCss);
writeFileSync(resolve(import.meta.dirname, '../dist/tokens.css'), tokenCss);
