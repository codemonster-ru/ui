import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  themeTokensToCssVars,
  vfPrimitiveColorTokenNames,
  vfSemanticColorTokenNames,
} from '@codemonster-ru/vueforge-theme';
import { inlineCssFiles, inlineCssImports } from '../../build/css-imports';

const stylesDir = resolve(__dirname);
const entriesDir = resolve(stylesDir, 'entries');
const componentsDir = resolve(stylesDir, 'components');
const foundationPath = resolve(stylesDir, 'foundation.css');
const architectureVariableNames = Object.keys(
  themeTokensToCssVars(
    Object.fromEntries(
      [...vfPrimitiveColorTokenNames, ...vfSemanticColorTokenNames].map((name) => [name, 'contract-value']),
    ),
  ),
);

function stripImports(source: string) {
  return source.replace(/^@import\s+['"].+?['"];\s*$/gm, '').trim();
}

function stripComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').trim();
}

describe('component entry CSS parity', () => {
  it('composes canonical component entries directly', () => {
    const source = readFileSync(resolve(stylesDir, 'components.css'), 'utf8');
    const actualEntries = [...source.matchAll(/^@import\s+['"]\.\/entries\/(.+?\.css)['"];\s*$/gm)]
      .map((match) => match[1])
      .sort();
    const expectedEntries = readdirSync(entriesDir)
      .filter((name) => name.endsWith('.css'))
      .filter((name) => {
        const entrySource = readFileSync(resolve(entriesDir, name), 'utf8');
        return stripComments(stripImports(entrySource)).includes('{');
      })
      .sort();

    expect(stripComments(stripImports(source))).toBe('');
    expect(actualEntries).toEqual(expectedEntries);
  });

  it('composes every canonical component entry into the full stylesheet exactly once', () => {
    const fullCss = inlineCssImports(resolve(stylesDir, 'components.css'));

    for (const fileName of readdirSync(entriesDir).filter((name) => name.endsWith('.css'))) {
      const ownCss = stripComments(stripImports(readFileSync(resolve(entriesDir, fileName), 'utf8')));
      if (!ownCss.includes('{')) {
        continue;
      }

      expect(fullCss.split(ownCss).length - 1, fileName).toBe(1);
    }
  });

  it('deduplicates shared CSS per artifact and resets composition state between artifacts', () => {
    const fullPath = resolve(stylesDir, 'components.css');
    const firstComposition = inlineCssImports(fullPath);
    const secondComposition = inlineCssImports(fullPath);

    expect(secondComposition).toBe(firstComposition);
    expect(firstComposition.match(/:root\.vf-theme-transitioning :where\(\[class\^='vf-'\]/g)).toHaveLength(1);
    expect(firstComposition.match(/\.vf-horizontal-scroller \{/g)).toHaveLength(1);
  });

  it('composes the theme transition guard into every standalone component artifact', () => {
    const guardPath = resolve(componentsDir, 'theme-transition-guard.css');
    const accessibilityPath = resolve(componentsDir, 'accessibility-preferences.css');

    for (const fileName of readdirSync(entriesDir).filter((name) => name.endsWith('.css'))) {
      const artifactCss = inlineCssFiles([guardPath, accessibilityPath, resolve(entriesDir, fileName)]);

      expect(artifactCss, fileName).toContain(':root.vf-theme-transitioning');
      expect(artifactCss.match(/:root\.vf-theme-transitioning :where\(\[class\^='vf-'\]/g), fileName).toHaveLength(1);
      expect(artifactCss, fileName).toContain('@media (prefers-reduced-motion: reduce)');
      expect(artifactCss, fileName).toContain('@media (forced-colors: active)');
    }
  });

  it('keeps selective fallback consumption equivalent through foundation plus a component entry', () => {
    const guardPath = resolve(componentsDir, 'theme-transition-guard.css');
    const accessibilityPath = resolve(componentsDir, 'accessibility-preferences.css');
    const buttonPath = resolve(entriesDir, 'button.css');
    const foundationCss = inlineCssImports(foundationPath);
    const fullCss = inlineCssImports(resolve(stylesDir, 'styles.css'));
    const standaloneButtonCss = inlineCssFiles([guardPath, accessibilityPath, buttonPath]);
    const fallbackButtonCss = inlineCssFiles([foundationPath, guardPath, accessibilityPath, buttonPath]);

    for (const variableName of architectureVariableNames) {
      expect(foundationCss, variableName).toContain(`${variableName}:`);
      expect(fullCss, variableName).toContain(`${variableName}:`);
      expect(fallbackButtonCss, variableName).toContain(`${variableName}:`);
      expect(standaloneButtonCss, variableName).not.toContain(`${variableName}:`);
    }

    expect(fallbackButtonCss).toContain('.vf-button {');
    expect(fallbackButtonCss).not.toContain('.vf-prose');
    expect(fallbackButtonCss).not.toContain('.vf-nav-menu');
  });

  it('keeps Stepper isolated from unrelated navigation and overlay CSS', () => {
    const source = readFileSync(resolve(entriesDir, 'stepper.css'), 'utf8');
    const standaloneCss = inlineCssImports(resolve(entriesDir, 'stepper.css'));

    expect(source).toContain('.vf-stepper');
    expect(source).not.toContain('../components/overlay-primitives.css');
    expect(standaloneCss).not.toContain('.vf-nav-menu');
    expect(standaloneCss).not.toContain('.vf-menu-bar');
    expect(standaloneCss).not.toContain('.vf-tabs');
    expect(standaloneCss).not.toContain('.vf-accordion');
  });

  it('uses the canonical shared horizontal-scroller source', () => {
    const menuBarSource = readFileSync(resolve(entriesDir, 'menu-bar.css'), 'utf8');
    const tabsSource = readFileSync(resolve(entriesDir, 'tabs.css'), 'utf8');

    expect(menuBarSource).toContain("@import '../components/horizontal-scroller.css';");
    expect(tabsSource).toContain("@import '../components/horizontal-scroller.css';");
    expect(stripImports(menuBarSource)).not.toContain('.vf-horizontal-scroller {');
    expect(stripImports(tabsSource)).not.toContain('.vf-horizontal-scroller {');
  });

  it('locks the reconciled form and navigation contracts into full composition', () => {
    const fullCss = inlineCssImports(resolve(stylesDir, 'components.css'));

    expect(fullCss).toContain('var(--vf-field-floating-input-offset-inline-lg)');
    expect(fullCss).toContain('var(--vf-field-floating-select-padding-adjustment-sm)');
    expect(fullCss).toContain('var(--vf-field-floating-select-padding-adjustment-lg)');
    expect(fullCss).not.toContain('min-height: var(--vf-select-filter-min-height-sm)');
    expect(fullCss).toContain('color: var(--vf-select-option-color);');
    expect(fullCss).toContain('letter-spacing: var(--vf-nav-menu-group-label-letter-spacing);');
    expect(fullCss).toContain('line-clamp: 3;');
    expect(fullCss).toContain('line-clamp: 2;');
    expect(fullCss).not.toContain("html[data-vf-theme='dark']");
  });
});
