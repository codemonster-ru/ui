/**
 * Theme resolution rules, with no DOM and no framework.
 *
 * The preference is three-state and the rendered theme is two-state; everything here is the
 * translation between them, so both adapters and the server agree on what a preference means.
 */

export type CmThemeMode = 'dark' | 'light' | 'system';
export type CmResolvedTheme = 'dark' | 'light';

export const cmThemeAttribute = 'data-cm-theme';
export const cmThemeCookieName = 'cm-theme';

/** How long a stored preference outlives the session, in seconds. */
export const cmThemeCookieMaxAge = 60 * 60 * 24 * 365;

export function isCmThemeMode(value: unknown): value is CmThemeMode {
  return value === 'dark' || value === 'light' || value === 'system';
}

/**
 * Resolves a preference against the operating system's.
 *
 * `system` is the only mode that consults the second argument, which is why the stylesheet can
 * resolve it without help: the attribute is written verbatim and the media query does the rest.
 */
export function resolveCmTheme(mode: CmThemeMode, systemTheme: CmResolvedTheme): CmResolvedTheme {
  return mode === 'system' ? systemTheme : mode;
}

/**
 * Reads a preference out of a cookie header.
 *
 * Server adapters get a raw header rather than a parsed map, so this accepts the header and returns
 * null for anything it does not recognise — an absent cookie and a corrupted one lead to the same
 * place, which is the default.
 */
export function readCmThemeCookie(header: string | null | undefined, name = cmThemeCookieName): CmThemeMode | null {
  if (!header) return null;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;

    const value = decodeURIComponent(part.slice(separator + 1).trim());
    return isCmThemeMode(value) ? value : null;
  }

  return null;
}

/**
 * Builds the `Set-Cookie` value for a preference.
 *
 * `SameSite=Lax` rather than `Strict` so the theme survives arriving from an external link, and
 * `Path=/` so one preference covers the whole application. Deliberately not `HttpOnly`: the
 * controller has to write this from the browser.
 */
export function serializeCmThemeCookie(
  mode: CmThemeMode,
  {
    name = cmThemeCookieName,
    maxAge = cmThemeCookieMaxAge,
    secure = true,
  }: {
    readonly maxAge?: number;
    readonly name?: string;
    readonly secure?: boolean;
  } = {},
): string {
  const parts = [`${name}=${mode}`, 'Path=/', `Max-Age=${maxAge}`, 'SameSite=Lax'];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

/** The mode a toggle moves to, given what is currently rendered. */
export function nextCmThemeMode(resolved: CmResolvedTheme): CmThemeMode {
  return resolved === 'dark' ? 'light' : 'dark';
}
