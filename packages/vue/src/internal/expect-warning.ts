import { expect, vi } from 'vitest';

/**
 * Runs `act` with `console.warn` captured and asserts the diagnostic matched,
 * so a test can prove both the warning and the fallback the component rendered.
 */
export function expectCmWarning<T>(pattern: RegExp | string, act: () => T): T {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const result = act();
    const messages = warn.mock.calls.map((call) => String(call[0]));
    expect(
      messages.some((message) => (typeof pattern === 'string' ? message.includes(pattern) : pattern.test(message))),
    ).toBe(true);
    return result;
  } finally {
    warn.mockRestore();
  }
}
