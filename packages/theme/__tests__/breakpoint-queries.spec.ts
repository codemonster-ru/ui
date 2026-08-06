import { describe, expect, it } from 'vitest';
import {
  expandVfBreakpointQueries,
  resolveVfBreakpointQuery,
  vfBreakpointQueryAliases,
} from '../src/breakpoint-queries';

describe('breakpoint queries', () => {
  it('derives aliases from the canonical breakpoint registry', () => {
    expect(vfBreakpointQueryAliases['--vf-bp-md-up']).toBe('(min-width: 768px)');
    expect(vfBreakpointQueryAliases['--vf-bp-lg-down']).toBe('(max-width: 1023.98px)');
    expect(resolveVfBreakpointQuery('--vf-bp-sm-down')).toBe('(max-width: 639.98px)');
  });

  it('expands media and named or unnamed container query aliases', () => {
    const { transformed, unknownAliases } = expandVfBreakpointQueries(`
@media (--vf-bp-md-up) {}
@container vf-page-header (--vf-bp-sm-down) {}
@container (--vf-bp-xs-down) {}
`);

    expect(transformed).toContain('@media (min-width: 768px)');
    expect(transformed).toContain('@container vf-page-header (max-width: 639.98px)');
    expect(transformed).toContain('@container (max-width: 479.98px)');
    expect(unknownAliases.size).toBe(0);
  });

  it('reports unknown aliases without changing their source', () => {
    const source = '@container vf-panel (--vf-bp-unknown-down) {}';
    const { transformed, unknownAliases } = expandVfBreakpointQueries(source);

    expect(transformed).toBe(source);
    expect([...unknownAliases]).toEqual(['--vf-bp-unknown-down']);
  });
});
