import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(resolve(__dirname, 'App.vue'), 'utf8');
const coreSource = readFileSync(resolve(__dirname, 'sections/core/CoreShowcase.vue'), 'utf8');
const layoutsSource = readFileSync(resolve(__dirname, 'sections/layouts/LayoutsShowcase.vue'), 'utf8');

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
});
