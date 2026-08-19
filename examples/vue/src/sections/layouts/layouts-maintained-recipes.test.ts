import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const showcaseSource = readFileSync(resolve(__dirname, 'LayoutsShowcase.vue'), 'utf8');

describe('maintained layout recipes', () => {
  it('keeps auth and error previews on semantic Container and Section compositions', () => {
    expect(showcaseSource).toContain('aria-labelledby="demo-error-title"');
    expect(showcaseSource).toContain('aria-labelledby="demo-auth-title"');
    expect(showcaseSource).toContain('<VfSection');
    expect(showcaseSource).toContain('<VfContainer size="md"');
    expect(showcaseSource).not.toMatch(/<div class="demo-(error|auth)-recipe__panel"/u);
  });

  it('keeps setup and application shells outside the shared recipe contract', () => {
    expect(showcaseSource).toContain('demo-setup-recipe');
    expect(showcaseSource).toContain('demo-app-shell-recipe');
    expect(showcaseSource).not.toContain('CmAuthLayout');
    expect(showcaseSource).not.toContain('CmErrorLayout');
  });
});
