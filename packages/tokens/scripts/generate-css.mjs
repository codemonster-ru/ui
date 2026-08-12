import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { cmDarkThemePreset, cmLightThemePreset } from '../dist/index.js';

function tokenNameToCssProperty(name) {
  return `--cm-${name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase()}`;
}

function serializeDeclarations(tokens, include) {
  return Object.entries(tokens)
    .filter(([name, value]) => include(name, value))
    .map(([name, value]) => `  ${tokenNameToCssProperty(name)}: ${value};`)
    .join('\n');
}

const lightTokens = cmLightThemePreset.tokens;
const darkTokens = cmDarkThemePreset.tokens;
const lightDeclarations = serializeDeclarations(lightTokens, () => true);
const darkDeclarations = serializeDeclarations(darkTokens, (name, value) => lightTokens[name] !== value);
const css = `:root,
[data-cm-theme='light'] {
${lightDeclarations}
}

[data-cm-theme='dark'] {
${darkDeclarations}
}
`;

writeFileSync(resolve(import.meta.dirname, '../dist/tokens.css'), css);
