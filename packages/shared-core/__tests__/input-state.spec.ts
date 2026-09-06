// Unit tests for the shared VfInput rules.
//
// These answer "does the shared rule compute the same thing?". They do not
// replace the VfInput characterization suite in packages/core, which answers
// the separate question "does the Vue component still behave like the reference
// implementation?".
import { describe, expect, it } from 'vitest';
import {
  isClearActionAvailable,
  isInputFilled,
  isPasswordRevealAvailable,
  resolveInputAdornmentState,
  resolveInputType,
} from '../src/input/state.js';

describe('isInputFilled', () => {
  it('treats any non-empty string as filled', () => {
    expect(isInputFilled('a')).toBe(true);
    expect(isInputFilled('0')).toBe(true);
    expect(isInputFilled('typed-secret')).toBe(true);
  });

  it('treats the empty string as not filled', () => {
    expect(isInputFilled('')).toBe(false);
  });

  it('coerces null and undefined to empty rather than to their literal names', () => {
    expect(isInputFilled(null)).toBe(false);
    expect(isInputFilled(undefined)).toBe(false);
  });

  it('counts whitespace as filled, as the reference does', () => {
    expect(isInputFilled(' ')).toBe(true);
  });
});

describe('isPasswordRevealAvailable', () => {
  it('offers the action only for an explicit password type', () => {
    expect(isPasswordRevealAvailable({ passwordReveal: true, type: 'password' })).toBe(true);
  });

  it('offers nothing when the prop is off', () => {
    expect(isPasswordRevealAvailable({ passwordReveal: false, type: 'password' })).toBe(false);
  });

  it.each(['text', 'email', 'search', 'number', 'date', undefined])(
    'offers nothing for type %s even with the prop on',
    (type) => {
      expect(isPasswordRevealAvailable({ passwordReveal: true, type })).toBe(false);
    },
  );
});

describe('resolveInputType', () => {
  it('reveals a password as text only while the action is available and toggled on', () => {
    expect(resolveInputType({ type: 'password', passwordRevealAvailable: true, passwordRevealed: true })).toBe('text');
    expect(resolveInputType({ type: 'password', passwordRevealAvailable: true, passwordRevealed: false })).toBe(
      'password',
    );
  });

  it('ignores a revealed flag when the action is not available', () => {
    expect(resolveInputType({ type: 'password', passwordRevealAvailable: false, passwordRevealed: true })).toBe(
      'password',
    );
  });

  it.each(['text', 'email', 'search', 'tel', 'url', 'number', 'date', 'datetime-local', 'time', 'color'])(
    'passes the native type %s through unchanged',
    (type) => {
      expect(resolveInputType({ type, passwordRevealAvailable: false, passwordRevealed: false })).toBe(type);
    },
  );

  it('leaves an unset type unset rather than defaulting it to text', () => {
    expect(resolveInputType({ type: undefined, passwordRevealAvailable: false, passwordRevealed: false })).toBe(
      undefined,
    );
  });
});

describe('isClearActionAvailable', () => {
  it('offers the action for a filled, enabled, writable clearable control', () => {
    expect(isClearActionAvailable({ clearable: true, filled: true, disabled: false, readonly: false })).toBe(true);
  });

  it.each([
    ['not clearable', { clearable: false, filled: true, disabled: false, readonly: false }],
    ['empty', { clearable: true, filled: false, disabled: false, readonly: false }],
    ['disabled', { clearable: true, filled: true, disabled: true, readonly: false }],
    ['read-only', { clearable: true, filled: true, disabled: false, readonly: true }],
  ])('withholds the action when %s', (_label, options) => {
    expect(isClearActionAvailable(options)).toBe(false);
  });
});

describe('resolveInputAdornmentState', () => {
  const bare = {
    hasLeadingAdornment: false,
    hasTrailingAdornment: false,
    hasPasswordRevealControl: false,
    hasClearControl: false,
  };

  it('reports no adornments for a bare control, which is what renders the input alone', () => {
    expect(resolveInputAdornmentState(bare)).toEqual({
      ...bare,
      hasTrailingActionControl: false,
      hasTrailingControl: false,
      hasAdornments: false,
    });
  });

  it('treats a leading adornment alone as enough to need the wrapper', () => {
    const state = resolveInputAdornmentState({ ...bare, hasLeadingAdornment: true });

    expect(state.hasAdornments).toBe(true);
    expect(state.hasTrailingControl).toBe(false);
  });

  it.each([
    ['a trailing adornment', { hasTrailingAdornment: true }, false],
    ['a password reveal action', { hasPasswordRevealControl: true }, true],
    ['a clear action', { hasClearControl: true }, true],
  ])('counts %s as a trailing control', (_label, flags, expectedAction) => {
    const state = resolveInputAdornmentState({ ...bare, ...flags });

    expect(state.hasTrailingControl).toBe(true);
    expect(state.hasTrailingActionControl).toBe(expectedAction);
    expect(state.hasAdornments).toBe(true);
  });

  it('reports both a trailing adornment and a trailing action when they coexist', () => {
    const state = resolveInputAdornmentState({
      ...bare,
      hasTrailingAdornment: true,
      hasPasswordRevealControl: true,
      hasClearControl: true,
    });

    expect(state.hasTrailingActionControl).toBe(true);
    expect(state.hasTrailingControl).toBe(true);
    expect(state.hasAdornments).toBe(true);
  });

  it('passes the input flags through untouched so callers can read one object', () => {
    const flags = {
      hasLeadingAdornment: true,
      hasTrailingAdornment: true,
      hasPasswordRevealControl: false,
      hasClearControl: true,
    };

    expect(resolveInputAdornmentState(flags)).toMatchObject(flags);
  });
});
