import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  colorUtilities,
  displayUtilities,
  flexUtilities,
  gridUtilities,
  sizingUtilities,
  spacingUtilities,
  typographyUtilities,
} from '../src/contract.mjs';

const packageDirectory = resolve(import.meta.dirname, '..');
const distDirectory = resolve(packageDirectory, 'dist');

function serializeRule(name, declarations) {
  const body = Object.entries(declarations)
    .map(([property, value]) => `    ${property}: ${value};`)
    .join('\n');
  return `  .cm-${name} {\n${body}\n  }`;
}

const layerDeclaration = readFileSync(resolve(packageDirectory, 'src/layer.css'), 'utf8').trim();
const utilities = {
  ...displayUtilities,
  ...flexUtilities,
  ...gridUtilities,
  ...spacingUtilities,
  ...sizingUtilities,
  ...typographyUtilities,
  ...colorUtilities,
};
const rules = Object.entries(utilities).map(([name, declarations]) => serializeRule(name, declarations));
const css = `${layerDeclaration.slice(0, -1)} {\n${rules.join('\n\n')}\n}\n`;

rmSync(distDirectory, { force: true, recursive: true });
mkdirSync(distDirectory, { recursive: true });
writeFileSync(resolve(distDirectory, 'utilities.css'), css);
