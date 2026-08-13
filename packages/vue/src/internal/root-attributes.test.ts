import { describe, expect, it, vi } from 'vitest';

import { mergeCmClasses, omitCmOwnedAttrs } from './root-attributes';

describe('mergeCmClasses', () => {
  it('normalizes Vue class values in a stable order', () => {
    expect(
      mergeCmClasses('cm-button', ['cm-button--primary', false], {
        active: true,
        hidden: false,
      }),
    ).toBe('cm-button cm-button--primary active');
  });

  it('removes duplicate class names', () => {
    expect(mergeCmClasses('cm-button', 'consumer cm-button')).toBe('cm-button consumer');
  });
});

describe('omitCmOwnedAttrs', () => {
  it('keeps safe consumer attributes and listeners', () => {
    const onClick = vi.fn();
    const style = { color: 'rebeccapurple' };
    const attrs = {
      class: 'consumer',
      disabled: false,
      'aria-busy': 'false',
      id: 'save',
      'data-testid': 'save-button',
      style,
      onClick,
    };

    expect(omitCmOwnedAttrs(attrs, ['disabled', 'aria-busy'])).toEqual({
      id: 'save',
      'data-testid': 'save-button',
      style,
      onClick,
    });
    expect(attrs).toHaveProperty('class', 'consumer');
  });
});
