import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { themeTokensToCssVars, vfSemanticColorTokenNames } from '@codemonster-ru/vueforge-theme';
import { describe, expect, it } from 'vitest';
import { legacyLightColorTokens } from '../theme/color-token-schema';

const stylesRoot = resolve(process.cwd(), 'src/styles');
const entriesRoot = resolve(stylesRoot, 'entries');
const packagesRoot = resolve(process.cwd(), '..');
const defaultPresetSourcePath = resolve(process.cwd(), 'src/theme/default-preset-source.ts');

function readEntry(name: string) {
  return readFileSync(resolve(entriesRoot, `${name}.css`), 'utf8');
}

function collectCssFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);

    if (entry.isDirectory()) return collectCssFiles(path);
    return entry.isFile() && entry.name.endsWith('.css') ? [path] : [];
  });
}

const packageSourceRoots = readdirSync(packagesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => resolve(packagesRoot, entry.name, 'src'))
  .filter(existsSync);
const colorStyleFiles = packageSourceRoots.flatMap(collectCssFiles);
const rawColorLiteralAllowlist = new Map<string, readonly string[]>([
  [
    resolve(packagesRoot, 'codeblock/src/tokens.css'),
    [
      'oklch(95.8% 0.007 260)',
      'oklch(76% 0.11 247)',
      'oklch(25.6% 0.014 260)',
      'oklch(29% 0.018 260)',
      'oklch(45% 0.115 247)',
      'oklch(90% 0.012 260)',
    ],
  ],
]);
const legacyFallbackRecipeAllowlist = new Map<string, readonly string[]>([
  [
    resolve(packagesRoot, 'playground/src/tokens.css'),
    [
      `var(
    --vf-color-background-surface-selected,
    color-mix(in srgb, var(--vf-color-primary) 20%, var(--vf-color-surface))
  )`,
      'var(--vf-color-background-canvas, var(--vf-color-bg, var(--vf-color-surface)))',
    ],
  ],
]);
const semanticColorVariables = Object.keys(
  themeTokensToCssVars(Object.fromEntries(vfSemanticColorTokenNames.map((name) => [name, 'contract-value']))),
);
const semanticColorVariableSet = new Set(semanticColorVariables);
const legacyPaletteVariables = Object.keys(themeTokensToCssVars(legacyLightColorTokens)).filter(
  (name) => !semanticColorVariableSet.has(name),
);
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const semanticFirstLegacyFallback = new RegExp(
  `var\\((?:${semanticColorVariables.map(escapeRegExp).join('|')}),\\s*var\\((?:${legacyPaletteVariables
    .map(escapeRegExp)
    .join('|')})\\)\\)`,
  'g',
);
const standaloneLegacyPaletteReference = new RegExp(
  `var\\((?:${legacyPaletteVariables.map(escapeRegExp).join('|')})\\)`,
);
const cssNamedColors = [
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',
];
const rawColorLiteral = new RegExp(
  `#[\\da-f]{3,8}\\b|\\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|device-cmyk)\\(|(?<![-\\w])(?:${cssNamedColors.join(
    '|',
  )})(?![-\\w])`,
  'i',
);

describe('component palette contract', () => {
  it('keeps raw palette literals out of package component styles except the exact standalone CodeBlock fallbacks', () => {
    for (const file of colorStyleFiles) {
      const css = readFileSync(file, 'utf8');
      let cssWithoutAllowlist = css;

      for (const allowedLiteral of rawColorLiteralAllowlist.get(file) ?? []) {
        expect(css, file).toContain(allowedLiteral);
        cssWithoutAllowlist = cssWithoutAllowlist.replace(allowedLiteral, '');
      }

      expect(cssWithoutAllowlist, file).not.toMatch(rawColorLiteral);
    }
  });

  it('keeps primitives out of components and permits legacy palette roots only as semantic-first fallbacks', () => {
    for (const file of colorStyleFiles) {
      const css = readFileSync(file, 'utf8');
      let cssWithoutCompatibilityFallbacks = css.replace(semanticFirstLegacyFallback, '');

      for (const allowedRecipe of legacyFallbackRecipeAllowlist.get(file) ?? []) {
        expect(css, file).toContain(allowedRecipe);
        cssWithoutCompatibilityFallbacks = cssWithoutCompatibilityFallbacks.replace(allowedRecipe, '');
      }

      expect(css, file).not.toContain('var(--vf-palette-');
      expect(cssWithoutCompatibilityFallbacks, file).not.toMatch(standaloneLegacyPaletteReference);
    }
  });

  it('limits direct primitive use in component mappings to the documented composited overlay shadow', () => {
    const source = readFileSync(defaultPresetSourcePath, 'utf8');
    const primitiveReferences = [...source.matchAll(/var\((--vf-palette-[a-z0-9-]+)\)/g)].map((match) => match[1]);

    expect(primitiveReferences).toEqual(['--vf-palette-neutral-1000', '--vf-palette-neutral-1000']);
    expect(source).toContain(
      "overlayFloatShadow:\n      '0 var(--vf-menu-gap) calc(var(--vf-overlay-padding) * 0.625) color-mix(in srgb, var(--vf-palette-neutral-1000) 16%, transparent), 0 var(--vf-overlay-border-width) calc(var(--vf-menu-gap) / 2) color-mix(in srgb, var(--vf-palette-neutral-1000) 10%, transparent)',",
    );
  });

  it.each(['alert', 'data-table', 'fieldset'])('%s uses its component palette tokens', (name) => {
    expect(readEntry(name)).not.toMatch(/var\(--vf-color-/);
  });

  it('uses the semantic backdrop with the runtime-compatible Command Palette fallback', () => {
    expect(readEntry('command-palette')).toContain('var(--vf-color-background-backdrop, var(--vf-overlay-backdrop))');
  });

  it('uses semantic solid states while retaining no-op compatibility filter hooks', () => {
    for (const name of ['button', 'icon-button']) {
      const css = readEntry(name);

      expect(css).not.toContain('brightness(');
      expect(css).toContain('filter: var(--vf-button-solid-hover-filter);');
      expect(css).toContain('filter: var(--vf-button-solid-active-filter);');
      expect(css).not.toMatch(/:disabled\s*\{[^}]*opacity:/s);
      expect(css).toContain('var(--vf-color-interactive-primary-hover-background, var(--vf-color-primary))');
      expect(css).toContain('var(--vf-color-status-danger-active-background, var(--vf-color-danger))');
      expect(css).toContain('var(--vf-color-background-inverse-active, var(--vf-color-contrast))');
      expect(css).toContain('var(--vf-color-background-surface-disabled, var(--vf-color-surface-muted))');
    }
  });

  it('keeps invalid selection controls visibly invalid while preserving the focus ring', () => {
    for (const name of ['checkbox', 'radio']) {
      const css = readEntry(name);
      const focusRuleIndex = css.indexOf(`.vf-${name}__input:focus-visible + .vf-${name}__control`);
      const invalidRuleIndex = css.indexOf(`.vf-${name}--invalid:not(.vf-${name}--disabled)`);

      expect(focusRuleIndex).toBeGreaterThan(-1);
      expect(invalidRuleIndex).toBeGreaterThan(focusRuleIndex);
      expect(css).toContain(`.vf-${name}--invalid:not(.vf-${name}--disabled) .vf-${name}__input:checked`);
      expect(css).toContain('box-shadow: 0 0 0 var(--vf-focus-ring-width) var(--vf-color-focus-ring);');
    }
  });

  it('keeps Select invalid/open and selected interaction states deterministic', () => {
    const css = readEntry('select');

    expect(css).toContain('.vf-select--open:not(.vf-select--invalid)');
    expect(css).toContain('.vf-select--invalid:focus-visible');
    expect(css).toContain(
      'var(--vf-color-background-surface-selected-hover, var(--vf-select-option-active-background))',
    );
    expect(css).toContain(
      'var(--vf-color-background-surface-selected-active, var(--vf-select-option-active-background))',
    );
    expect(css).toContain('.vf-select__option--selected:hover:not(:disabled)');
    expect(css).toContain(".vf-select__option[aria-selected='true']:active:not(:disabled)");
  });

  it('keeps invalid text-field boundaries above focus without removing the focus ring', () => {
    for (const name of ['input', 'select', 'textarea']) {
      const css = readEntry(name);
      const focusRuleIndex = css.indexOf(`.vf-${name}:focus-visible`);
      const invalidFocusRuleIndex = css.indexOf(`.vf-${name}--invalid:focus-visible`);

      expect(focusRuleIndex).toBeGreaterThan(-1);
      expect(invalidFocusRuleIndex).toBeGreaterThan(focusRuleIndex);
      expect(css.slice(invalidFocusRuleIndex)).toContain(`border-color: var(--vf-${name}-invalid-border-color);`);
      expect(css).toContain('box-shadow: 0 0 0 var(--vf-focus-ring-width) var(--vf-color-focus-ring);');
    }
  });

  it('prevents disabled dropdown and navigation items from consuming interactive state materials', () => {
    const dropdown = readEntry('dropdown');
    const menuBar = readEntry('menu-bar');
    const navMenu = readEntry('nav-menu');

    expect(dropdown).toContain(
      ".vf-dropdown__item:hover:not(.vf-dropdown__item--active, :disabled, [aria-disabled='true'])",
    );
    expect(dropdown).toContain(".vf-dropdown__item:is(:disabled, [aria-disabled='true'])");
    expect(dropdown).toContain('color: var(--vf-color-text-disabled, var(--vf-dropdown-item-color));');
    expect(dropdown).toContain('border-color: var(--vf-color-border-disabled, transparent);');
    expect(dropdown).toContain('background: var(--vf-color-background-surface-disabled, transparent);');
    expect(dropdown).toContain('cursor: not-allowed;');
    expect(dropdown).toContain(".vf-dropdown__item--active:hover:not(:disabled, [aria-disabled='true'])");
    expect(menuBar).toContain('.vf-menu-bar__item:is(:disabled, .vf-menu-bar__item--disabled)');
    expect(menuBar).toContain('.vf-menu-bar__item--disabled,\n    .vf-menu-bar__item--active');
    expect(navMenu).toContain('.vf-nav-menu__item:is(:disabled, .vf-nav-menu__item--disabled)');
    expect(navMenu).toContain(
      '.vf-nav-menu__item:hover:not(:disabled, .vf-nav-menu__item--disabled, .vf-nav-menu__item--active)',
    );
  });

  it('preserves the VueForge 1.x pills fallback for active sidebar top-level states', () => {
    const css = readEntry('nav-menu');
    const topHoverRule = css.slice(
      css.indexOf('.vf-nav-menu__item--top.vf-nav-menu__item--active:hover'),
      css.indexOf('.vf-nav-menu__item--active:not(.vf-nav-menu__item--top):hover'),
    );
    const topActiveRule = css.slice(
      css.indexOf('.vf-nav-menu__item--top.vf-nav-menu__item--active:active'),
      css.indexOf('.vf-nav-menu__item--active:not(.vf-nav-menu__item--top):active'),
    );

    expect(topHoverRule).toContain('var(--vf-nav-menu-pills-item-active-background)');
    expect(topActiveRule).toContain('var(--vf-nav-menu-pills-item-active-background)');
  });

  it.each([
    ['dropdown', ['--vf-dropdown-item-default-active-background', '--vf-dropdown-item-pills-active-background']],
    ['menu-bar', ['--vf-menu-bar-current-top-active-background', '--vf-menu-bar-current-submenu-active-background']],
    ['nav-menu', ['--vf-nav-menu-current-item-active-background']],
    ['table-of-contents', ['--vf-table-of-contents-current-active-background']],
    ['tabs', ['--vf-tabs-tab-active-background']],
  ])('%s gives selected items deterministic hover and active surfaces', (name, compatibilityFallbacks) => {
    const css = readEntry(name as string);

    expect(css).toContain('--vf-color-background-surface-selected-hover');
    expect(css).toContain('--vf-color-background-surface-selected-active');
    for (const fallback of compatibilityFallbacks as string[]) {
      expect(css).toContain(`var(${fallback})`);
    }

    if (name === 'nav-menu') {
      expect(css.lastIndexOf('--vf-color-background-surface-selected-hover')).toBeGreaterThan(
        css.indexOf('.vf-nav-menu--sidebar .vf-nav-menu__item--active'),
      );
      expect(css.lastIndexOf('--vf-color-background-surface-selected-active')).toBeGreaterThan(
        css.indexOf('.vf-nav-menu--sidebar .vf-nav-menu__item--active'),
      );
    }
  });

  it('uses dedicated disabled colors without reducing the entire component opacity', () => {
    for (const name of ['breadcrumbs', 'dropdown', 'menu-bar', 'nav-menu', 'stepper', 'tabs']) {
      const css = readEntry(name);

      expect(css).not.toMatch(/disabled[^,{]*[^{]*[{][^}]*opacity\s*:/s);
    }

    expect(readEntry('menu-bar')).toContain('var(--vf-color-text-disabled, var(--vf-color-muted))');
    expect(readEntry('nav-menu')).toContain('var(--vf-color-background-surface-disabled, transparent)');
    expect(readEntry('stepper')).toContain('var(--vf-color-border-disabled, var(--vf-stepper-rail-color))');
    expect(readEntry('tabs')).toContain('var(--vf-color-background-surface-disabled, var(--vf-tabs-tab-background))');
  });

  it('makes disabled text fields override invalid and open boundaries', () => {
    for (const name of ['input', 'select', 'textarea']) {
      const css = readEntry(name);

      expect(css).toContain(`var(--vf-color-border-disabled, var(--vf-${name}-border-color))`);
    }

    expect(readEntry('select')).toContain('box-shadow: none;');
  });

  it('keeps readonly text and placeholders readable on the subtle surface', () => {
    for (const name of ['input', 'textarea']) {
      const css = readEntry(name);

      expect(css).toContain(`.vf-${name}:read-only:not(:disabled, .vf-${name}--invalid)::placeholder`);
      expect(css).toContain('color: var(--vf-color-text-secondary, var(--vf-color-muted));');
    }
  });

  it('uses the interactive boundary for secondary action controls with a VueForge 1.x fallback', () => {
    for (const name of ['button', 'icon-button']) {
      expect(readEntry(name)).toContain(
        'border-color: var(--vf-color-border-interactive, var(--vf-color-border-default, var(--vf-color-border)));',
      );
    }
  });

  it('uses a text role for the neutral ProgressBar label with its VueForge 1.x fallback', () => {
    expect(readEntry('progress-bar')).toContain(
      '--vf-progress-bar-label-color: var(--vf-color-text-inverse, var(--vf-color-bg));',
    );
  });

  it('keeps Switch state precedence theme-scoped through tokens', () => {
    const css = readEntry('switch');

    expect(css).not.toContain("html:where([data-theme='dark'], [data-vf-theme='dark'])");
    expect(css).not.toContain('var(--vf-color-primary-contrast)');
    expect(css).not.toContain('.vf-switch--invalid:not(.vf-switch--static):hover');
    expect(css).toContain('background: var(--vf-switch-track-hover-background);');
    expect(css).toContain(
      '.vf-switch--invalid .vf-switch__input:focus-visible + .vf-switch__control {\n  border-color: var(--vf-switch-track-invalid-border-color);',
    );
  });
});
