import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const showcaseSource = readFileSync(new URL('./CoreShowcase.vue', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('./core-showcase.css', import.meta.url), 'utf8');
const rawUtilityClass = /class="[^"]*\bvf-(?:heading(?:\b|-)|text-|prose\b|list-|blockquote\b|sr-only\b)/u;

describe('Core typography recipe', () => {
  it('uses application-owned classes with native content semantics', () => {
    expect(showcaseSource).not.toMatch(rawUtilityClass);
    expect(
      showcaseSource.match(/<h[1-6] class="demo-typography-heading demo-typography-heading--h[1-6]">/gu),
    ).toHaveLength(6);
    expect(showcaseSource.match(/<article class="demo-prose">/gu)).toHaveLength(3);
    expect(showcaseSource).toContain('<ul class="demo-content-list demo-content-list--disc">');
    expect(showcaseSource).toContain('<ol class="demo-content-list demo-content-list--decimal">');
    expect(showcaseSource).toContain('<blockquote class="demo-content-blockquote">');
    expect(showcaseSource).toContain('<span class="demo-visually-hidden">Utility text for screen readers.</span>');
  });

  it('uses canonical links for the four utility link examples', () => {
    expect(showcaseSource.match(/<CmLink href="#demo-typography"/gu)).toHaveLength(4);
    expect(showcaseSource).toContain('<CmLink href="#demo-typography" tone="muted">');
    expect(showcaseSource).toContain('<CmLink href="#demo-typography" underline="hover">');
    expect(showcaseSource).toContain('<CmLink href="#demo-typography" underline="always">');
  });

  it('does not retain VueForge typography utility selectors', () => {
    expect(stylesSource).not.toMatch(/\.vf-(?:heading(?:\b|-)|text-|prose\b|list-|blockquote\b|sr-only\b)/u);
    expect(stylesSource).toContain('.demo-prose');
    expect(stylesSource).toContain('.demo-visually-hidden');
  });
});
