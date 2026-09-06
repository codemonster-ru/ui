// The colour palette moved into this package in M03. These tests assert the
// moved data is self-contained here: it resolves without the Vue adapter, and
// the declared counts still describe the data they are derived from.
//
// The full graph behaviour, the default preset assembly and the CSS output are
// still covered by the core specs that consume this module; nothing is
// duplicated here.
import { describe, expect, it } from 'vitest';
import {
  MAX_CANONICAL_ALIAS_DEPTH,
  PRIMITIVE_COLOR_TOKEN_COUNT,
  SEMANTIC_COLOR_TOKEN_COUNT,
  knownExternalThemeCssVariables,
  primitiveColorTokens,
  semanticDarkColorTokens,
  semanticLightColorTokens,
  validateColorTokenGraph,
} from '../src/color-token-schema.js';
import { vfPrimitiveColorTokenNames, vfSemanticColorTokenNames } from '../src/color-token-contract.js';

describe('color token schema ownership', () => {
  it('declares exactly the primitive names of the colour contract', () => {
    expect(Object.keys(primitiveColorTokens)).toHaveLength(PRIMITIVE_COLOR_TOKEN_COUNT);
    expect(Object.keys(primitiveColorTokens).sort()).toEqual([...vfPrimitiveColorTokenNames].sort());
  });

  it('declares exactly the semantic names of the colour contract in both modes', () => {
    expect(Object.keys(semanticLightColorTokens)).toHaveLength(SEMANTIC_COLOR_TOKEN_COUNT);
    expect(Object.keys(semanticLightColorTokens).sort()).toEqual([...vfSemanticColorTokenNames].sort());
    expect(Object.keys(semanticDarkColorTokens).sort()).toEqual([...vfSemanticColorTokenNames].sort());
  });

  it('validates its own light and dark graphs without a Vue adapter present', () => {
    const options = { knownExternalVariables: knownExternalThemeCssVariables, maxDepth: MAX_CANONICAL_ALIAS_DEPTH };
    const light = { ...primitiveColorTokens, ...semanticLightColorTokens };

    expect(() => validateColorTokenGraph(light, options)).not.toThrow();
    expect(() => validateColorTokenGraph({ ...light, ...semanticDarkColorTokens }, options)).not.toThrow();
  });
});
