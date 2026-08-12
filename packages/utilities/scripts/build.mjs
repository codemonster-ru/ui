import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  borderUtilities,
  colorUtilities,
  displayUtilities,
  flexUtilities,
  gridUtilities,
  responsiveBreakpoints,
  responsiveUtilities,
  sizingUtilities,
  spacingUtilities,
  typographyUtilities,
} from '../src/contract.mjs';

const packageDirectory = resolve(import.meta.dirname, '..');
const distDirectory = resolve(packageDirectory, 'dist');

function serializeRule(name, declarations, indentation = '  ') {
  const body = Object.entries(declarations)
    .map(([property, value]) => `${indentation}  ${property}: ${value};`)
    .join('\n');
  return `${indentation}.cm-${name} {\n${body}\n${indentation}}`;
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
  ...borderUtilities,
};
const rules = Object.entries(utilities).map(([name, declarations]) => serializeRule(name, declarations));
const responsiveRules = Object.entries(responsiveBreakpoints).map(([breakpoint, minWidth]) => {
  const breakpointRules = Object.entries(responsiveUtilities).map(([name, declarations]) =>
    serializeRule(`${breakpoint}-${name}`, declarations, '    '),
  );
  return `  @media (min-width: ${minWidth}px) {\n${breakpointRules.join('\n\n')}\n  }`;
});
const css = `${layerDeclaration.slice(0, -1)} {\n${[...rules, ...responsiveRules].join('\n\n')}\n}\n`;

rmSync(distDirectory, { force: true, recursive: true });
mkdirSync(distDirectory, { recursive: true });
writeFileSync(resolve(distDirectory, 'utilities.css'), css);
