import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  themeTokensToCssVars,
  vfPrimitiveColorTokenNames,
  vfSemanticColorTokenNames,
} from '@codemonster-ru/vueforge-theme';
import { inlineCssFiles, inlineCssImports } from '../../build/css-imports';
import { resolveStyleEntrySource } from '../../build/style-entry-sources.mjs';

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
        const entrySource = readFileSync(resolveStyleEntrySource(resolve(entriesDir, name)), 'utf8');
        return stripComments(stripImports(entrySource)).includes('{');
      })
      .sort();

    expect(stripComments(stripImports(source))).toBe('');
    expect(actualEntries).toEqual(expectedEntries);
  });

  it('composes every canonical component entry into the full stylesheet exactly once', () => {
    const fullCss = inlineCssImports(resolve(stylesDir, 'components.css'));

    for (const fileName of readdirSync(entriesDir).filter((name) => name.endsWith('.css'))) {
      const ownCss = stripComments(
        stripImports(readFileSync(resolveStyleEntrySource(resolve(entriesDir, fileName)), 'utf8')),
      );
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
    // The entry forwards to packages/styles since M23; its own text is the
    // canonical source the forward resolves to, as for the M04 entries.
    const source = readFileSync(resolveStyleEntrySource(resolve(entriesDir, 'stepper.css')), 'utf8');
    const standaloneCss = inlineCssImports(resolve(entriesDir, 'stepper.css'));

    expect(source).toContain('.vf-stepper');
    expect(source).not.toContain('../components/overlay-primitives.css');
    expect(standaloneCss).not.toContain('.vf-nav-menu');
    expect(standaloneCss).not.toContain('.vf-menu-bar');
    expect(standaloneCss).not.toContain('.vf-tabs');
    expect(standaloneCss).not.toContain('.vf-accordion');
  });

  it('uses the canonical shared horizontal-scroller source', () => {
    // Both entries are inspected through their canonical source (the tabs
    // entry forwards to packages/styles since M24; menu-bar is still core's
    // own). Each has to import the scroller by a relative path rather than
    // inline its rules, and both imports - one through the core forward, one
    // directly - have to resolve to the single canonical file.
    const canonicalScroller = resolveStyleEntrySource(resolve(componentsDir, 'horizontal-scroller.css'));
    expect(canonicalScroller).toBe(resolve(stylesDir, '../../../styles/src/components/horizontal-scroller.css'));

    for (const name of ['menu-bar.css', 'tabs.css']) {
      const sourcePath = resolveStyleEntrySource(resolve(entriesDir, name));
      const source = readFileSync(sourcePath, 'utf8');
      const scrollerImport = [...source.matchAll(/^@import\s+'(\.[^']*horizontal-scroller\.css)';$/gm)].map(
        (match) => match[1],
      );

      expect(scrollerImport, name).toHaveLength(1);
      expect(resolveStyleEntrySource(resolve(dirname(sourcePath), scrollerImport[0]!)), name).toBe(canonicalScroller);
      expect(stripImports(source), name).not.toContain('.vf-horizontal-scroller {');
    }
  });

  it('uses the canonical shared overlay-primitives source from all eight overlay entries', () => {
    // The M27 move, checked the way M24's is. overlay-primitives.css lives in
    // packages/styles now, because the Razor artifact may only read a neutral
    // package and `.vf-menu__item` needs a token this file is the only
    // definition of. The seven entries that are *not* migrated still import it
    // by their historical path, through the one-line core forward, so their
    // emitted bytes are unchanged and nothing about them moved.
    const canonical = resolveStyleEntrySource(resolve(componentsDir, 'overlay-primitives.css'));
    expect(canonical).toBe(resolve(stylesDir, '../../../styles/src/components/overlay-primitives.css'));

    const entries = [
      'command-palette.css',
      'dialog.css',
      'drawer.css',
      'dropdown.css',
      'menu-bar.css',
      'menu.css',
      'popover.css',
      'tooltip.css',
    ];

    for (const name of entries) {
      const sourcePath = resolveStyleEntrySource(resolve(entriesDir, name));
      const source = readFileSync(sourcePath, 'utf8');
      const overlayImport = [...source.matchAll(/^@import\s+'(\.[^']*overlay-primitives\.css)';$/gm)].map(
        (match) => match[1],
      );

      expect(overlayImport, name).toHaveLength(1);
      expect(resolveStyleEntrySource(resolve(dirname(sourcePath), overlayImport[0]!)), name).toBe(canonical);
      expect(stripImports(source), name).not.toContain('--vf-overlay-border-width:');
    }
  });

  it('keeps --vf-overlay-border-width load-bearing for the menu item and defined in exactly one place', () => {
    // The reason the move had to happen rather than being a tidy-up. The
    // generated theme *reads* this custom property - in
    // --vf-overlay-float-shadow and --vf-overlay-arrow-overlap-offset-default -
    // and never defines it; overlay-primitives.css is the only definition site
    // in the repository. `.vf-menu__item` takes its border width from it, so an
    // entry that lost the import would render the border shorthand invalid at
    // computed-value time and fall back to `medium` instead of 1px. That
    // divergence is measured on real Chrome by the menuItem parity profile;
    // this is the same fact asserted where it is cheap to assert.
    const canonicalMenu = readFileSync(resolveStyleEntrySource(resolve(entriesDir, 'menu.css')), 'utf8');
    const overlay = readFileSync(resolveStyleEntrySource(resolve(componentsDir, 'overlay-primitives.css')), 'utf8');

    expect(canonicalMenu).toContain('border: var(--vf-overlay-border-width) solid transparent;');
    expect(overlay).toContain('--vf-overlay-border-width: var(--vf-text-link-border-width);');
    expect(stripImports(canonicalMenu)).not.toContain('--vf-overlay-border-width:');
    // Not hardcoded to 1px anywhere in the menu closure: the width is the
    // token's, and the token is the link border width's.
    expect(canonicalMenu).not.toContain('border: 1px solid transparent;');

    const definitions = readdirSync(componentsDir)
      .filter((name) => name.endsWith('.css'))
      .filter((name) =>
        readFileSync(resolveStyleEntrySource(resolve(componentsDir, name)), 'utf8').includes(
          '--vf-overlay-border-width:',
        ),
      );

    expect(definitions).toEqual(['overlay-primitives.css']);
  });

  it('forwards the dropdown entry to its canonical source in packages/styles, which reads the shared overlay tokens', () => {
    // The M28 move, checked the way M27's is. The three entries that import
    // the dropdown - select, date-picker and the column chooser - still do so
    // by their historical path, through the one-line core forward.
    const canonical = resolveStyleEntrySource(resolve(entriesDir, 'dropdown.css'));
    expect(canonical).toBe(resolve(stylesDir, '../../../styles/src/components/dropdown.css'));

    const source = readFileSync(canonical, 'utf8');
    const imports = [...source.matchAll(/^@import\s+'([^']+)';$/gm)].map((match) => match[1]);
    expect(imports).toEqual(['./overlay-primitives.css']);
    expect(resolveStyleEntrySource(resolve(dirname(canonical), imports[0]!))).toBe(
      resolveStyleEntrySource(resolve(componentsDir, 'overlay-primitives.css')),
    );
    // The panel is fixed, which is the strategy floater.js is given, and its
    // enter/leave pair is the transition name the component renders.
    expect(source).toContain('.vf-dropdown__menu {\n  position: fixed;');
    expect(source).toContain('.vf-floating-transition-enter-from.vf-dropdown__menu,');
    expect(source).toContain('.vf-floating-transition-leave-to.vf-dropdown__menu {');
    expect(stripImports(source)).not.toContain('--vf-overlay-border-width:');

    // Read through the forward: since M32 the select entry is one too, and its
    // canonical file keeps the sibling import under the same name.
    for (const name of ['select.css', 'date-picker.css', 'data-table-column-chooser.css']) {
      expect(readFileSync(resolveStyleEntrySource(resolve(entriesDir, name)), 'utf8'), name).toContain(
        "@import './dropdown.css';",
      );
    }
  });

  it('forwards the group box entry to its canonical source in packages/styles, which reads the button beside it', () => {
    // The M29 move. The file is the historical stylesheet byte for byte: its
    // one import names button.css as a sibling, and in packages/styles the
    // sibling is the canonical button stylesheet, so the relative path did not
    // have to change.
    const canonical = resolveStyleEntrySource(resolve(entriesDir, 'group-box.css'));
    expect(canonical).toBe(resolve(stylesDir, '../../../styles/src/components/group-box.css'));

    const source = readFileSync(canonical, 'utf8');
    const imports = [...source.matchAll(/^@import\s+'([^']+)';$/gm)].map((match) => match[1]);
    expect(imports).toEqual(['./button.css']);
    expect(resolveStyleEntrySource(resolve(dirname(canonical), imports[0]!))).toBe(
      resolveStyleEntrySource(resolve(entriesDir, 'button.css')),
    );
    // The collapsed modifier rotates the icon, and the transition that animates
    // it is the theme's normal duration - the only motion the component has.
    expect(source).toContain('.vf-group-box--collapsed .vf-group-box__icon {\n  transform: rotate(-90deg);');
    expect(source).toContain('transition: transform var(--vf-motion-duration-normal) var(--vf-motion-ease-standard);');
    expect(stripImports(source)).not.toContain('.vf-button {');
  });

  it('forwards the popover entry to its canonical source in packages/styles, which reads the shared overlay tokens', () => {
    // The M30 move, checked the way the dropdown's is. The popover is its own
    // closure: nothing imports it, and it imports only the overlay tokens.
    const canonical = resolveStyleEntrySource(resolve(entriesDir, 'popover.css'));
    expect(canonical).toBe(resolve(stylesDir, '../../../styles/src/components/popover.css'));

    const source = readFileSync(canonical, 'utf8');
    const imports = [...source.matchAll(/^@import\s+'([^']+)';$/gm)].map((match) => match[1]);
    expect(imports).toEqual(['./overlay-primitives.css']);
    expect(resolveStyleEntrySource(resolve(dirname(canonical), imports[0]!))).toBe(
      resolveStyleEntrySource(resolve(componentsDir, 'overlay-primitives.css')),
    );
    // The panel is fixed, which is the strategy floater.js is given, and its
    // enter/leave pair is the transition name the component renders.
    expect(source).toContain('.vf-popover__content {\n  position: fixed;');
    expect(source).toContain('.vf-floating-transition-enter-from.vf-popover__content,');
    expect(source).toContain('.vf-floating-transition-leave-to.vf-popover__content {');
    expect(source).not.toContain('.vf-dropdown');
    expect(stripImports(source)).not.toContain('--vf-overlay-border-width:');
  });

  it('forwards the tooltip entry to its canonical source in packages/styles, which reads the shared overlay tokens', () => {
    // The M31 move, checked the way the popover's is. The tooltip is its own
    // closure: nothing imports it, and it imports only the overlay tokens.
    const canonical = resolveStyleEntrySource(resolve(entriesDir, 'tooltip.css'));
    expect(canonical).toBe(resolve(stylesDir, '../../../styles/src/components/tooltip.css'));

    const source = readFileSync(canonical, 'utf8');
    const imports = [...source.matchAll(/^@import\s+'([^']+)';$/gm)].map((match) => match[1]);
    expect(imports).toEqual(['./overlay-primitives.css']);
    expect(resolveStyleEntrySource(resolve(dirname(canonical), imports[0]!))).toBe(
      resolveStyleEntrySource(resolve(componentsDir, 'overlay-primitives.css')),
    );
    // The tooltip is fixed, which is the strategy floater.js is given; its
    // enter/leave pair is the transition name the component renders; and both
    // arrow sides carry the overlap offset the historical rule pins.
    expect(source).toContain('.vf-tooltip__content {\n  position: fixed;');
    expect(source).toContain('.vf-floating-transition-enter-from.vf-tooltip__content,');
    expect(source).toContain('.vf-floating-transition-leave-to.vf-tooltip__content {');
    expect(source).toContain('.vf-tooltip__arrow--bottom {\n  margin-top: var(--vf-overlay-arrow-overlap-offset);');
    expect(source).toContain('.vf-tooltip__arrow--top {\n  margin-top: var(--vf-overlay-arrow-overlap-offset);');
    expect(source).not.toContain('.vf-popover');
    expect(source).not.toContain('.vf-dropdown');
    expect(stripImports(source)).not.toContain('--vf-overlay-border-width:');
  });

  it('forwards the select entry to its canonical source in packages/styles, which reads its three neighbours', () => {
    // The M32 move. The select reads the field, the icon button and the
    // dropdown stylesheets - its listbox is a `.vf-dropdown__menu` and its
    // options `.vf-dropdown__item`s - and each import resolves to the
    // canonical sibling the other entries forward to, not to a second copy.
    const canonical = resolveStyleEntrySource(resolve(entriesDir, 'select.css'));
    expect(canonical).toBe(resolve(stylesDir, '../../../styles/src/components/select.css'));

    const source = readFileSync(canonical, 'utf8');
    const imports = [...source.matchAll(/^@import\s+'([^']+)';$/gm)].map((match) => match[1]);
    expect(imports).toEqual(['./field.css', './icon-button.css', './dropdown.css']);
    for (const name of ['field.css', 'icon-button.css', 'dropdown.css']) {
      expect(resolveStyleEntrySource(resolve(dirname(canonical), `./${name}`)), name).toBe(
        resolveStyleEntrySource(resolve(entriesDir, name)),
      );
    }
    // The listbox scrolls inside its own max-height, which is what the
    // component scrolls the target option into view against; the selected
    // state is written by class and by aria-selected alike.
    expect(source).toContain(
      '.vf-select__menu {\n  min-width: var(--vf-menu-min-width);\n  max-height: var(--vf-select-menu-max-height);\n  overflow: auto;',
    );
    expect(source).toContain(".vf-select__option--selected,\n.vf-select__option[aria-selected='true'] {");
    expect(source).not.toContain('.vf-popover');
    expect(source).not.toContain('.vf-tooltip');
  });

  it('keeps the menu and the menu item in one closure with no descendant coupling', () => {
    // VfMenu and VfMenuItem are one milestone because they are one stylesheet,
    // not because either needs the other. No selector here joins them: every
    // item rule stands on `.vf-menu__item` alone, so an item styles correctly
    // with no `.vf-menu` ancestor, which is what makes the runtime coupling
    // between the two components CSS-only and the parity profiles separate.
    const canonicalMenu = readFileSync(resolveStyleEntrySource(resolve(entriesDir, 'menu.css')), 'utf8');

    expect(canonicalMenu).toContain('.vf-menu {');
    expect(canonicalMenu).toContain('.vf-menu__item {');
    expect(canonicalMenu).not.toContain('.vf-menu .vf-menu__item');
    expect(canonicalMenu).not.toContain('.vf-menu > ');
    expect(canonicalMenu).not.toContain('vf-menu__item--disabled');
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
