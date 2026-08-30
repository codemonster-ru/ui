/**
 * Development-time diagnostics.
 *
 * Invalid props are reported instead of thrown: a component library must not
 * take a host application down over a malformed label. Every caller pairs a
 * warning with a deterministic fallback so the rendered DOM stays predictable.
 *
 * The guard reads `process.env.NODE_ENV` so the consumer's bundler decides,
 * rather than baking this package's own build mode into the output. Where
 * `process` is absent the warning stays on, because silence is the worse
 * failure for a diagnostic.
 */
function isDevelopment(): boolean {
  if (typeof process === 'undefined') {
    return true;
  }

  return process.env?.NODE_ENV !== 'production';
}

export function warnCm(message: string): void {
  if (!isDevelopment()) {
    return;
  }

  console.warn(`[CodeMonster UI] ${message}`);
}

/**
 * Warns when `condition` fails and reports whether the value was usable, so a
 * caller can read it as a guard: `if (!assertCm(ok, '…')) return fallback;`
 */
export function assertCm(condition: boolean, message: string): boolean {
  if (!condition) {
    warnCm(message);
  }

  return condition;
}
