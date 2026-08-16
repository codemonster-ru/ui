import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(resolve(__dirname, 'App.vue'), 'utf8');
const colorsSource = readFileSync(resolve(__dirname, 'sections/colors/ColorSystemShowcase.vue'), 'utf8');
const coreSource = readFileSync(resolve(__dirname, 'sections/core/CoreShowcase.vue'), 'utf8');
const codeblockSource = readFileSync(resolve(__dirname, 'sections/codeblock/CodeBlockShowcase.vue'), 'utf8');
const layoutsSource = readFileSync(resolve(__dirname, 'sections/layouts/LayoutsShowcase.vue'), 'utf8');
const playgroundSource = readFileSync(resolve(__dirname, 'PlaygroundShowcase.vue'), 'utf8');

function orderedMatches(source: string, pattern: RegExp): string[] {
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

describe('showcase information architecture', () => {
  it('keeps the frozen top-level route order', () => {
    expect(orderedMatches(appSource, /value: '([^']+)'/gu)).toEqual([
      'core',
      'colors',
      'layouts',
      'icons',
      'codeblock',
      'playground',
    ]);
  });

  it('keeps the Core and Layouts section anchors discoverable in order', () => {
    expect(orderedMatches(coreSource, /<h2 id="([^"]+)"/gu)).toEqual([
      'demo-theme',
      'demo-typography',
      'demo-actions',
      'demo-overlay',
      'demo-surfaces',
      'demo-feedback',
      'demo-forms',
      'demo-navigation',
      'demo-dialog',
    ]);
    expect(orderedMatches(layoutsSource, /<h2 id="([^"]+)"/gu)).toEqual([
      'demo-container',
      'demo-stack',
      'demo-inline',
      'demo-section',
      'demo-grid',
      'demo-foundation',
      'demo-error-layout',
      'demo-auth-layout',
      'demo-setup-layout',
      'demo-app-shell',
      'demo-admin-layout',
      'demo-admin-shell',
      'demo-document-layout',
    ]);
  });

  it('keeps the remaining route content matrix discoverable', () => {
    expect(orderedMatches(colorsSource, /<h2 id="([^"]+)"/gu)).toEqual([
      'primitive-scales',
      'theme-pairings',
      'contrast-matrix',
    ]);
    expect(codeblockSource).toContain('<h2>VfCodeBlock</h2>');
    expect(playgroundSource).toContain('<h1 class="demo-heading">Interactive code and component previews</h1>');
    expect(playgroundSource).toContain('<h2>VfPlayground · single-file HTML</h2>');
    expect(playgroundSource).toContain('<h2>VfPlayground · multi-file runtime</h2>');
    expect(playgroundSource).toContain('<h2>VfPlayground · Vue component mode</h2>');
    expect(playgroundSource).toContain('<h2>Vite plugin · Vue runtime module</h2>');
    expect(playgroundSource).toContain('<h2>Vite plugin · custom resolver</h2>');
  });
});
