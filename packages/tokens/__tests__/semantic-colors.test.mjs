import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cmPrimitiveColorTokenNames,
  cmSemanticColorTokenNames,
  cmSemanticDarkColorTokens,
  cmSemanticLightColorTokens,
} from '../dist/index.js';

function cssNameToTokenName(name) {
  return name.replace(/^--cm-/, '').replace(/-([a-z0-9])/g, (_, character) => character.toUpperCase());
}

test('defines complete immutable semantic color modes', () => {
  assert.equal(cmSemanticColorTokenNames.length, 85);
  assert.equal(new Set(cmSemanticColorTokenNames).size, 85);
  assert.deepEqual(Object.keys(cmSemanticLightColorTokens), [...cmSemanticColorTokenNames]);
  assert.deepEqual(Object.keys(cmSemanticDarkColorTokens), [...cmSemanticColorTokenNames]);
  assert.equal(Object.isFrozen(cmSemanticColorTokenNames), true);
  assert.equal(Object.isFrozen(cmSemanticLightColorTokens), true);
  assert.equal(Object.isFrozen(cmSemanticDarkColorTokens), true);
});

test('references only owned primitive color tokens', () => {
  const primitiveNames = new Set(cmPrimitiveColorTokenNames);

  for (const [mode, tokens] of [
    ['light', cmSemanticLightColorTokens],
    ['dark', cmSemanticDarkColorTokens],
  ]) {
    for (const [name, value] of Object.entries(tokens)) {
      const references = [...value.matchAll(/var\((--cm-[a-z0-9-]+)\)/g)].map((match) => match[1]);
      assert.ok(references.length > 0, `${mode}.${name} must reference an owned primitive.`);
      for (const reference of references) {
        assert.ok(primitiveNames.has(cssNameToTokenName(reference)), `${mode}.${name} has unknown ${reference}.`);
      }
    }
  }
});

test('keeps light and dark values mode-specific without changing the role contract', () => {
  const differingNames = cmSemanticColorTokenNames.filter(
    (name) => cmSemanticLightColorTokens[name] !== cmSemanticDarkColorTokens[name],
  );

  assert.ok(differingNames.length > 70);
  assert.equal(cmSemanticLightColorTokens.colorInteractivePrimaryForeground, 'var(--cm-palette-neutral-0)');
  assert.equal(cmSemanticDarkColorTokens.colorInteractivePrimaryForeground, 'var(--cm-palette-neutral-0)');
});
