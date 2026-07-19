import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const stylesRoot = resolve(process.cwd(), 'src/styles');
const entriesRoot = resolve(stylesRoot, 'entries');

function readEntry(name: string) {
  return readFileSync(resolve(entriesRoot, `${name}.css`), 'utf8');
}

describe('component palette contract', () => {
  it('keeps raw color literals out of component styles', () => {
    const files = [
      ...readdirSync(resolve(stylesRoot, 'components')).map((name) => resolve(stylesRoot, 'components', name)),
      ...readdirSync(entriesRoot).map((name) => resolve(entriesRoot, name)),
    ].filter((file) => file.endsWith('.css'));

    for (const file of files) {
      const css = readFileSync(file, 'utf8');

      expect(css, file).not.toMatch(/#[\da-f]{3,8}\b|\brgba?\(|\bhsla?\(|\bblack\b/i);
    }
  });

  it.each(['alert', 'command-palette', 'data-table', 'fieldset'])('%s uses its component palette tokens', (name) => {
    expect(readEntry(name)).not.toMatch(/var\(--vf-color-/);
  });
});
