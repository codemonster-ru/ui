// The TypeScript half of the cross-language contract.
//
// packages/razor/tests/Support/CheckableStateVectorsTest.php runs the same file
// against the PHP mirror. If either implementation drifts, one of the two
// suites fails on the vector that moved.
import { describe, expect, it } from 'vitest';
import vectors from '../src/checkable/state-vectors.json' with { type: 'json' };
import {
  isRadioChecked,
  resolveCheckboxAriaChecked,
  resolveCheckboxClasses,
  resolveRadioClasses,
  resolveSwitchClasses,
} from '../src/checkable/state.js';

describe('shared checkable state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual([
      'isRadioChecked',
      'resolveCheckboxAriaChecked',
      'resolveCheckboxClasses',
      'resolveRadioClasses',
      'resolveSwitchClasses',
    ]);
  });

  it('proves all three emit a size modifier at the default size', () => {
    // The one line of behaviour the three components genuinely share, and the
    // reason none of them looks like VfInput or VfButton.
    expect(
      resolveCheckboxClasses({ size: 'md', checked: false, indeterminate: false, invalid: false, disabled: false }),
    ).toContain('vf-checkbox--md');
    expect(resolveRadioClasses({ size: 'md', checked: false, invalid: false, disabled: false })).toContain(
      'vf-radio--md',
    );
    expect(
      resolveSwitchClasses({
        size: 'md',
        isStatic: false,
        thumbContrast: 'auto',
        checked: false,
        invalid: false,
        disabled: false,
      }),
    ).toContain('vf-switch--md');
  });

  it('proves the radio comparison is strict', () => {
    expect(isRadioChecked(1, '1')).toBe(false);
    expect(isRadioChecked('1', 1)).toBe(false);
    expect(isRadioChecked(1, 1)).toBe(true);
  });

  it.each(vectors.resolveCheckboxClasses)(
    'resolveCheckboxClasses($size, checked=$checked, indeterminate=$indeterminate) -> $expected',
    (vector) => {
      expect(resolveCheckboxClasses(vector)).toEqual(vector.expected);
    },
  );

  it.each(vectors.resolveCheckboxAriaChecked)(
    'resolveCheckboxAriaChecked(checked=$checked, indeterminate=$indeterminate) -> $expected',
    (vector) => {
      expect(resolveCheckboxAriaChecked(vector)).toBe(vector.expected);
    },
  );

  it.each(vectors.resolveRadioClasses)('resolveRadioClasses($size, checked=$checked) -> $expected', (vector) => {
    expect(resolveRadioClasses(vector)).toEqual(vector.expected);
  });

  it.each(vectors.isRadioChecked)('isRadioChecked($modelValue, $value) -> $expected', (vector) => {
    expect(isRadioChecked(vector.modelValue, vector.value)).toBe(vector.expected);
  });

  it.each(vectors.resolveSwitchClasses)(
    'resolveSwitchClasses($size, static=$isStatic, contrast=$thumbContrast) -> $expected',
    (vector) => {
      expect(resolveSwitchClasses(vector)).toEqual(vector.expected);
    },
  );
});
