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
    expect(presetSource).toContain(
      "buttonSecondaryHoverBackground: 'var(--vf-color-background-surface-hover)'",
    );
    expect(presetSource).toContain(
      "buttonSecondaryActiveBackground: 'var(--vf-color-background-surface-active)'",
    );
  });

  it('keeps underline tab geometry stable and focus rings visible inside clipped scrollers', () => {
    const css = readEntry('tabs');
    const tabRule = extractRule(css, '.vf-tabs__tab');
    const tabFocusRule = extractRule(css, '.vf-tabs__tab:focus-visible');
    const scrollFocusRule = extractRule(css, '.vf-tabs__scroll-button:focus-visible');

    expect(tabRule).toContain('border-radius: var(--vf-radius-control-tight);');
    expect(tabFocusRule).toContain(
      'box-shadow: inset 0 0 0 var(--vf-focus-ring-width) var(--vf-tabs-focus-ring-color);',
    );
    expect(scrollFocusRule).toContain(
      'box-shadow: inset 0 0 0 var(--vf-focus-ring-width) var(--vf-tabs-focus-ring-color);',
    );
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

  it('gives unselected navigation and menu items a stronger semantic press state', () => {
    const singleLineSelectors = {
      dropdown:
        ".vf-dropdown__item:active:not(.vf-dropdown__item--active, :disabled, [aria-disabled='true'])",
      'nav-menu':
        '.vf-nav-menu__item:active:not(:disabled, .vf-nav-menu__item--disabled, .vf-nav-menu__item--active)',
      tabs: ".vf-tabs__tab:active:not(:disabled, [aria-selected='true'])",
    };

    for (const [name, selector] of Object.entries(singleLineSelectors)) {
      expect(extractRule(readEntry(name), selector)).toContain('var(--vf-color-background-surface-active');
    }

    const topMenuRule = extractRule(
      readEntry('menu-bar'),
      `.vf-menu-bar__item--top:active:not(
    :disabled,
    .vf-menu-bar__item--disabled,
    .vf-menu-bar__item--active,
    .vf-menu-bar__item--open
  )`,
    );
    expect(topMenuRule).toContain('var(--vf-color-background-surface-active');

    const selectRule = extractRule(
      readEntry('select'),
      ".vf-select__option:active:not(:disabled, .vf-select__option--selected, [aria-selected='true'])",
    );
    expect(selectRule).toContain('var(--vf-color-background-surface-active');
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
