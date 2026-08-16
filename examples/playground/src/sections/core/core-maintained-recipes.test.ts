import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const showcaseSource = readFileSync(resolve(__dirname, 'CoreShowcase.vue'), 'utf8');

describe('maintained showcase recipes', () => {
  it('keeps GroupBox on Fieldset and Accordion compositions', () => {
    expect(showcaseSource).toContain('id="shipping-address-group"');
    expect(showcaseSource).toContain('id="invoice-details-group"');
    expect(showcaseSource).toContain('<CmFieldset');
    expect(showcaseSource).toContain('<CmAccordion');
    expect(showcaseSource).not.toMatch(/<legend[\s\S]*?<button/u);
  });

  it('keeps Panel and SkeletonGate content on the maintained Card recipe', () => {
    expect(showcaseSource).toContain('aria-labelledby="supporting-context-title"');
    expect(showcaseSource).toContain('aria-labelledby="subtle-context-title"');
    expect(showcaseSource).toContain('aria-labelledby="loaded-panel-title"');
    expect(showcaseSource).toContain('aria-labelledby="ready-panel-title"');
    expect(showcaseSource).toContain('<VfCard');
  });
});
