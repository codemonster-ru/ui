import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertCm, warnCm } from './warn';

describe('development diagnostics', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefixes a warning so the source is obvious in a host application log', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnCm('Select requires options.');
    expect(warn).toHaveBeenCalledWith('[CodeMonster UI] Select requires options.');
  });

  it('reports whether a value was usable so callers can branch to a fallback', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(assertCm(true, 'unused')).toBe(true);
    expect(warn).not.toHaveBeenCalled();
    expect(assertCm(false, 'Tabs require an enabled item.')).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('stays silent in a production build', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      warnCm('Select requires options.');
      expect(warn).not.toHaveBeenCalled();
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
