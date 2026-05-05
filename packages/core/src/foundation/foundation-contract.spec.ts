import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..', '..');

describe('foundation contract', () => {
  it('declares foundation and style subpath exports', () => {
    const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
    };

    expect(packageJson.exports['./foundation']).toBeTruthy();
    expect(packageJson.exports['./theme']).toBeTruthy();
    expect(packageJson.exports['./tokens.css']).toBe('./dist/tokens.css');
    expect(packageJson.exports['./foundation.css']).toBe('./dist/foundation.css');
  });

  it('keeps breakpoint tokens in tokens.css', () => {
    const tokensCss = readFileSync(resolve(root, '.generated/theme/tokens.css'), 'utf8');
    const generatedBreakpointsCss = readFileSync(resolve(root, '.generated/theme/generated-breakpoints.css'), 'utf8');

    expect(tokensCss).toMatch(/@import\s+["']\.\/generated-breakpoints\.css["'];/);
    expect(generatedBreakpointsCss).toContain('--vf-breakpoint-xs: 480px;');
    expect(generatedBreakpointsCss).toContain('--vf-breakpoint-md: 768px;');
    expect(generatedBreakpointsCss).toContain('--vf-breakpoint-2xl: 1536px;');
  });

  it('keeps foundation.css as a narrow entry point', () => {
    const foundationCss = readFileSync(resolve(root, 'src/styles/foundation.css'), 'utf8');

    expect(foundationCss).toMatch(/@import\s+["']\.\.\/\.\.\/\.generated\/theme\/tokens\.css["'];/);
    expect(foundationCss).toMatch(/@import\s+["']\.\.\/\.\.\/\.generated\/theme\/theme\.css["'];/);
    expect(foundationCss).not.toContain('components/');
  });
});
