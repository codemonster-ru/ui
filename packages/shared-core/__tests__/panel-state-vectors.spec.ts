// The TypeScript half of the cross-language contract for VfPanel.
//
// packages/razor/tests/Support/PanelStateVectorsTest.php runs the same file
// against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/panel/state-vectors.json' with { type: 'json' };
import { resolvePanelClasses, resolvePanelRegions } from '../src/panel/state.js';
import { resolveCardRegions } from '../src/card/state.js';

const regions = (input: Parameters<typeof resolvePanelRegions>[0]) => resolvePanelRegions(input);
const empty = { hasHeaderSlot: false };

describe('shared panel state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['resolvePanelClasses', 'resolvePanelRegions']);
  });

  it('proves an empty-string title renders no header at all', () => {
    // Not an empty header: no header element. `title` is tested for truthiness,
    // so the empty string and the absent prop are the same input.
    expect(regions({ ...empty, title: '' }).header).toBe(false);
    expect(regions({ ...empty, title: 'Workspace' }).header).toBe(true);
  });

  it('proves a header slot suppresses the fallback heading even when a title was passed', () => {
    expect(regions({ ...empty, title: 'Workspace', hasHeaderSlot: true, headerSlotContent: true })).toEqual({
      header: true,
      headerTitle: false,
    });
  });

  it('proves the header wrapper and the fallback heading are keyed on different questions', () => {
    // The wrapper asks whether a header slot was passed; the heading asks
    // whether it produced content. A slot rendering nothing therefore yields a
    // header element with the fallback h3 back inside it - and with no title,
    // an empty h3.
    expect(regions({ ...empty, hasHeaderSlot: true, headerSlotContent: false })).toEqual({
      header: true,
      headerTitle: true,
    });
  });

  it('decides nothing about a body wrapper, because there is none to decide', () => {
    // The structural difference from VfCard, asserted as a property of the rule
    // rather than left to the template. A panel's default slot renders straight
    // into the section with no wrapper and no condition, so a `body` key here
    // would be a decision no element consumes - and an implementation would be
    // free to grow the element that consumed it.
    for (const vector of vectors.resolvePanelRegions) {
      expect(Object.keys(vector.expected).sort()).toEqual(['header', 'headerTitle']);
    }
    expect(Object.keys(regions({ ...empty, title: 'Workspace' })).sort()).toEqual(['header', 'headerTitle']);
  });

  it('decides nothing about a footer either', () => {
    expect(regions({ ...empty, hasHeaderSlot: true })).not.toHaveProperty('footer');
  });

  it('never produces a card class', () => {
    // The M18 substitution, caught before any parity run. If these rules were
    // ever generalised over a block name, this is what notices.
    for (const subtle of [false, true]) {
      expect(resolvePanelClasses(subtle).join(' ')).not.toContain('vf-card');
    }
  });

  it('is not VfCard\'s resolver under another name', () => {
    // Same inputs, different answers - and different shapes. If someone ever
    // pointed resolvePanelRegions at resolveCardRegions, or gave the two one
    // shared implementation over a block name, this fails here rather than
    // eight gates later.
    const input = { title: 'Workspace', hasHeaderSlot: false };
    const panel = resolvePanelRegions(input);
    const card = resolveCardRegions({ ...input, hasDefaultSlot: true, hasFooterSlot: true });

    expect(Object.keys(panel).sort()).not.toEqual(Object.keys(card).sort());
    expect(panel).not.toHaveProperty('body');
    expect(panel).not.toHaveProperty('footer');
  });

  it.each(vectors.resolvePanelClasses)('resolvePanelClasses($subtle) -> $expected', (vector) => {
    expect(resolvePanelClasses(vector.subtle)).toEqual(vector.expected);
  });

  it.each(vectors.resolvePanelRegions)(
    'resolvePanelRegions($title, $hasHeaderSlot, $headerSlotContent) -> $expected',
    (vector) => {
      expect(
        resolvePanelRegions({
          title: vector.title,
          hasHeaderSlot: vector.hasHeaderSlot,
          headerSlotContent: vector.headerSlotContent,
        }),
      ).toEqual(vector.expected);
    },
  );
});
