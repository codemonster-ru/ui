import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..', '..');
const baseCssPath = resolve(root, 'src/styles/components/base.css');

describe('prose css contract', () => {
  it('keeps prose typography selectors out of .vf-prose-exclude descendants', () => {
    const baseCss = readFileSync(baseCssPath, 'utf8');

    expect(baseCss).toContain(
      '.vf-prose pre:not(.vf-prose-exclude, .vf-prose-exclude *, .vf-playground, .vf-playground *, .vf-codeblock, .vf-codeblock *)',
    );
    expect(baseCss).toContain(
      '.vf-prose a:not(.vf-prose-exclude, .vf-prose-exclude *, .vf-playground, .vf-playground *, .vf-codeblock, .vf-codeblock *)',
    );
    expect(baseCss).toContain(
      '.vf-prose :not(pre, .vf-prose-exclude, .vf-prose-exclude *, .vf-playground, .vf-playground *, .vf-codeblock, .vf-codeblock *) > code:not(.vf-prose-exclude, .vf-prose-exclude *, .vf-playground, .vf-playground *, .vf-codeblock, .vf-codeblock *)',
    );
  });

  it('keeps prose block spacing for direct children including .vf-prose-exclude', () => {
    const baseCss = readFileSync(baseCssPath, 'utf8');

    expect(baseCss).toContain(
      '> :is(h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, pre, hr, .vf-prose-exclude, .vf-playground, .vf-codeblock)',
    );
    expect(baseCss).toContain('.vf-prose > * + :is(h1, h2, h3, h4, h5, h6)');
    expect(baseCss).toContain(
      '> :is(h1, h2, h3, h4, h5, h6)\n  + :is(p, ul, ol, blockquote, pre, hr, .vf-prose-exclude, .vf-playground, .vf-codeblock)',
    );
  });
});
