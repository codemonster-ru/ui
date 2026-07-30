import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceRoot = resolve(process.cwd(), 'src');

function readEntry(name: string) {
  return readFileSync(resolve(sourceRoot, 'styles/entries', `${name}.css`), 'utf8');
}

function readComponent(path: string) {
  return readFileSync(resolve(sourceRoot, 'components', path), 'utf8');
}

function readTheme(path: string) {
  return readFileSync(resolve(sourceRoot, 'theme', path), 'utf8');
}

function extractRule(source: string, selector: string) {
  const start = source.indexOf(`${selector} {`);
  const end = source.indexOf('\n}', start);

  expect(start, `Missing CSS rule: ${selector}`).toBeGreaterThanOrEqual(0);
  expect(end, `Unterminated CSS rule: ${selector}`).toBeGreaterThan(start);

  return source.slice(start, end);
}

describe('component interaction contract', () => {
  it('does not duplicate pinned boundaries when data table column dividers are enabled', () => {
    const css = readEntry('data-table');
    const selector =
      '.vf-table--column-dividers .vf-data-table__cell--pinned-start-edge + :where(th, td),\n.vf-table--column-dividers .vf-data-table__cell--pinned-end-edge';
    const rule = extractRule(css, selector);

    expect(rule).toContain('border-inline-start-color: transparent;');
    expect(css).not.toContain('pinned-end-edge)::after {\n  display: none;');
  });

  it('keeps data table pagination controls visible in narrow containers', () => {
    const css = readEntry('data-table');

    expect(extractRule(css, '.vf-data-table__pagination')).toContain('container-type: inline-size;');
    expect(css).toContain('@container (max-width: 479.98px)');
    expect(css).toContain('flex-basis: 100%;');
    expect(css).toContain(".vf-data-table__pagination-page:not([aria-current='page']),");
  });

  it('keeps secondary actions on distinct base, hover, and active surfaces', () => {
    for (const name of ['button', 'icon-button']) {
      const css = readEntry(name);
      const baseRule = extractRule(css, `.vf-${name}--secondary`);
      const hoverRule = extractRule(css, `.vf-${name}--secondary:hover:not(:disabled)`);
      const activeRule = extractRule(css, `.vf-${name}--secondary:active:not(:disabled)`);

      expect(baseRule).toContain('background: var(--vf-color-background-surface);');
      expect(hoverRule).toContain('background: var(--vf-button-secondary-hover-background);');
      expect(activeRule).toContain('background: var(--vf-button-secondary-active-background);');
    }

    const presetSource = readTheme('default-preset-source.ts');
    expect(presetSource).toContain("buttonSecondaryHoverBackground: 'var(--vf-color-background-surface-hover)'");
    expect(presetSource).toContain("buttonSecondaryActiveBackground: 'var(--vf-color-background-surface-active)'");
  });

  it('keeps underline tab geometry stable and focus rings visible inside clipped scrollers', () => {
    const css = readEntry('tabs');
    const tabRule = extractRule(css, '.vf-tabs__tab');
    const tabFocusRule = extractRule(css, '.vf-tabs__tab:focus-visible');
    const scrollFocusRule = extractRule(css, '.vf-tabs__scroll-button:focus-visible');

    expect(tabRule).toContain('border-radius: var(--vf-radius-control-tight) var(--vf-radius-control-tight) 0 0;');
    expect(tabFocusRule).toContain(
      'box-shadow: inset 0 0 0 var(--vf-focus-ring-width) var(--vf-tabs-focus-ring-color);',
    );
    expect(scrollFocusRule).toContain(
      'box-shadow: inset 0 0 0 var(--vf-focus-ring-width) var(--vf-tabs-focus-ring-color);',
    );
  });

  it('keeps underline tab backgrounds text-first across interaction states', () => {
    const css = readEntry('tabs');
    const presetSource = readTheme('default-preset-source.ts');
    const pressedRule = extractRule(css, ".vf-tabs__tab:active:not(:disabled, [aria-selected='true'])");
    const selectedHoverRule = extractRule(css, ".vf-tabs__tab[aria-selected='true']:hover:not(:disabled)");
    const selectedActiveRule = extractRule(css, ".vf-tabs__tab[aria-selected='true']:active:not(:disabled)");
    const disabledRule = extractRule(css, '.vf-tabs__tab:disabled');

    expect(presetSource).toContain("tabsTabHoverBackground: 'transparent'");
    expect(presetSource).toContain("tabsTabActiveBackground: 'transparent'");
    expect(pressedRule).toContain('background: var(--vf-tabs-tab-hover-background);');
    expect(selectedHoverRule).toContain('background: var(--vf-tabs-tab-active-background);');
    expect(selectedActiveRule).toContain('background: var(--vf-tabs-tab-active-background);');
    expect(disabledRule).toContain('background: var(--vf-tabs-tab-background);');
    expect(css).not.toContain('var(--vf-color-background-surface-selected-hover');
    expect(css).not.toContain('var(--vf-color-background-surface-selected-active');
  });

  it('uses symmetric overlap geometry for both public Tooltip placements', () => {
    const css = readEntry('tooltip');
    const bottomRule = extractRule(css, '.vf-tooltip__arrow--bottom');
    const topRule = extractRule(css, '.vf-tooltip__arrow--top');

    expect(bottomRule).toContain('margin-top: var(--vf-overlay-arrow-overlap-offset);');
    expect(topRule).toContain('margin-top: var(--vf-overlay-arrow-overlap-offset);');
  });

  it('matches floating overlay lifecycle timing to the authored CSS transition', () => {
    for (const path of [
      'dropdown/VfDropdown.vue',
      'popover/VfPopover.vue',
      'select/VfSelect.vue',
      'tooltip/VfTooltip.vue',
    ]) {
      const source = readComponent(path);

      expect(source).toContain('enter: vfMotionDurationsMs.normal,');
      expect(source).toContain('leave: vfMotionDurationsMs.normal,');
    }

    for (const name of ['dropdown', 'popover', 'tooltip']) {
      const css = readEntry(name);

      expect(css).toContain('transform var(--vf-motion-duration-normal) var(--vf-motion-ease-standard)');
      expect(css).toContain('opacity var(--vf-motion-duration-normal) var(--vf-motion-ease-standard)');
    }
  });

  it('provides semantic hover and press feedback for binary selection controls', () => {
    for (const name of ['checkbox', 'radio']) {
      const css = readEntry(name);

      expect(css).toContain(`.vf-${name}:active:not(.vf-${name}--disabled)`);
      expect(css).toContain('var(--vf-color-background-surface-active');
      expect(css).toContain('var(--vf-color-interactive-primary-hover-background');
      expect(css).toContain('var(--vf-color-interactive-primary-active-background');
      expect(css.indexOf(`.vf-${name}--invalid:active`)).toBeGreaterThan(
        css.indexOf(`.vf-${name}:active:not(.vf-${name}--disabled)`),
      );
      expect(css).toContain(
        `.vf-${name}--invalid:active:not(.vf-${name}--disabled) .vf-${name}__input:checked + .vf-${name}__control`,
      );
      expect(css).toContain(
        `.vf-${name}--invalid:active:not(.vf-${name}--disabled) .vf-${name}__input:not(:checked) + .vf-${name}__control`,
      );
    }

    const switchCss = readEntry('switch');
    expect(switchCss).toContain('.vf-switch:active:not(.vf-switch--disabled, .vf-switch--static)');
    expect(switchCss).toContain('var(--vf-color-background-surface-active');
    expect(switchCss).toContain('--vf-color-interactive-primary-active-background');
    expect(switchCss).toContain('.vf-switch--static:active:not(.vf-switch--disabled)');
    expect(switchCss).toContain('.vf-switch--static.vf-switch--invalid:not(.vf-switch--disabled)');
    expect(switchCss.indexOf('.vf-switch--invalid:active')).toBeGreaterThan(
      switchCss.indexOf('.vf-switch:active:not(.vf-switch--disabled, .vf-switch--static)'),
    );
  });

  it('gives surface-backed Select options a stronger semantic press state', () => {
    const selectRule = extractRule(
      readEntry('select'),
      ".vf-select__option:active:not(:disabled, .vf-select__option--selected, [aria-selected='true'])",
    );
    expect(selectRule).toContain('var(--vf-color-background-surface-active');
  });

  it('keeps text-first navigation variants free of filled pointer-state leakage', () => {
    const presetSource = readTheme('default-preset-source.ts');
    const navMenuCss = readEntry('nav-menu');
    const tableOfContentsCss = readEntry('table-of-contents');
    const menuBarCss = readEntry('menu-bar');
    const dropdownCss = readEntry('dropdown');

    for (const token of [
      'navMenuItemHoverBackground',
      'navMenuItemActiveBackground',
      'menuBarTopHoverBackground',
      'menuBarTopActiveBackground',
      'menuBarSubmenuHoverBackground',
      'menuBarSubmenuActiveBackground',
      'tableOfContentsHoverBackground',
      'tableOfContentsActiveBackground',
    ]) {
      expect(presetSource).toContain(`${token}: 'transparent'`);
    }

    expect(navMenuCss).not.toContain(
      '.vf-nav-menu__item:active:not(:disabled, .vf-nav-menu__item--disabled, .vf-nav-menu__item--active)',
    );
    expect(menuBarCss).not.toContain('.vf-menu-bar__item--top:active:not(');
    expect(dropdownCss).not.toContain(
      ".vf-dropdown__item:active:not(.vf-dropdown__item--active, :disabled, [aria-disabled='true'])",
    );

    expect(navMenuCss).toContain(
      ':where(.vf-nav-menu--pills) .vf-nav-menu__item--active:hover:not(:disabled, .vf-nav-menu__item--disabled)',
    );
    expect(tableOfContentsCss).toContain(
      ':where(.vf-table-of-contents--pills) .vf-table-of-contents__link.vf-table-of-contents__link--active:hover',
    );
    expect(menuBarCss).toContain(
      ':where(.vf-menu-bar--pills)\n  .vf-menu-bar__item--top.vf-menu-bar__item--active:hover',
    );
    expect(dropdownCss).toContain(
      ".vf-dropdown__menu--pills .vf-dropdown__item--active:hover:not(:disabled, [aria-disabled='true'])",
    );
  });

  it('uses the semantic focus treatment for programmatically focused Popovers', () => {
    const focusRule = extractRule(readEntry('popover'), '.vf-popover__content:focus-visible');

    expect(focusRule).toContain('outline: none;');
    expect(focusRule).toContain('border-color: var(--vf-color-border-focus);');
    expect(focusRule).toContain('var(--vf-overlay-float-shadow)');
    expect(focusRule).toContain('0 0 0 var(--vf-focus-ring-width) var(--vf-color-focus-ring)');

    expect(readEntry('popover')).toContain('@media (forced-colors: active)');
    expect(readEntry('popover')).toContain('outline: 2px solid Highlight;');
  });
});
