// The TypeScript half of the cross-language contract for VfCard.
//
// packages/razor/tests/Support/CardStateVectorsTest.php runs the same file
// against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/card/state-vectors.json' with { type: 'json' };
import { resolveCardClasses, resolveCardRegions } from '../src/card/state.js';

const regions = (input: Parameters<typeof resolveCardRegions>[0]) => resolveCardRegions(input);
const empty = { hasHeaderSlot: false, hasDefaultSlot: false, hasFooterSlot: false };

describe('shared card state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['resolveCardClasses', 'resolveCardRegions']);
  });

  it('proves an empty-string title renders no header at all', () => {
    // Not an empty header: no header element. `title` is tested for truthiness,
    // so the empty string and the absent prop are the same input.
    expect(regions({ ...empty, title: '' }).header).toBe(false);
    expect(regions({ ...empty, title: 'Workspace' }).header).toBe(true);
  });

  it('proves a header slot suppresses the fallback heading even when a title was passed', () => {
    // The title is then silently unused. Rendering both would be the obvious
    // "improvement" and would be a product change.
    expect(regions({ ...empty, title: 'Workspace', hasHeaderSlot: true, headerSlotContent: true })).toEqual({
      header: true,
      headerTitle: false,
      body: false,
      footer: false,
    });
  });

  it('proves the header wrapper and the fallback heading are keyed on different questions', () => {
    // The wrapper asks whether a header slot was passed; the heading asks
    // whether it produced content. A slot rendering nothing therefore yields a
    // header element with the fallback h3 back inside it - and with no title,
    // an empty h3. Keying both on one question is the obvious simplification
    // and changes what such a card renders.
    expect(regions({ ...empty, hasHeaderSlot: true, headerSlotContent: false })).toEqual({
      header: true,
      headerTitle: true,
      body: false,
      footer: false,
    });
  });

  it('proves the body and footer wrappers are keyed on slot presence, not on content', () => {
    // A slot that renders nothing still produces its wrapper. Keying on the
    // rendered result instead would silently drop an empty body div, and the
    // gap it leaves in a flex column is visible.
    expect(regions({ ...empty, hasDefaultSlot: true }).body).toBe(true);
    expect(regions({ ...empty, hasFooterSlot: true }).footer).toBe(true);
  });

  it('proves the three regions are independent rather than ordered gates', () => {
    // A footer with no header and no body is valid markup for this component.
    expect(regions({ ...empty, hasFooterSlot: true })).toEqual({
      header: false,
      headerTitle: true,
      body: false,
      footer: true,
    });
  });

  it('never produces a panel class', () => {
    // VfPanel is the nearest neighbour this component has and is deliberately
    // not migrated with it. If these rules were ever generalised over a block
    // name, this is what notices before any parity run.
    for (const compact of [false, true]) {
      expect(resolveCardClasses(compact).join(' ')).not.toContain('vf-panel');
    }
  });

  it.each(vectors.resolveCardClasses)('resolveCardClasses($compact) -> $expected', (vector) => {
    expect(resolveCardClasses(vector.compact)).toEqual(vector.expected);
  });

  it.each(vectors.resolveCardRegions)(
    'resolveCardRegions($title, $hasHeaderSlot, $hasDefaultSlot, $hasFooterSlot) -> $expected',
    (vector) => {
      expect(
        resolveCardRegions({
          title: vector.title,
          hasHeaderSlot: vector.hasHeaderSlot,
          headerSlotContent: vector.headerSlotContent,
          hasDefaultSlot: vector.hasDefaultSlot,
          hasFooterSlot: vector.hasFooterSlot,
        }),
      ).toEqual(vector.expected);
    },
  );
});
