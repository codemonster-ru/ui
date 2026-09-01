import {
  cmThemeAttribute,
  cmThemeCookieMaxAge,
  cmThemeCookieName,
  isCmThemeMode,
  resolveCmTheme,
  serializeCmThemeCookie,
  type CmResolvedTheme,
  type CmThemeMode,
} from './core/theme.js';
import { dispatchCmEvent } from './events.js';
import type { CmController, CmControllerFactory } from './runtime.js';

export interface ThemeChangeDetail {
  mode: CmThemeMode;
  resolved: CmResolvedTheme;
}

/**
 * Applies a theme preference chosen in the browser.
 *
 * The server has already rendered the preference it knew about, so this does not decide the initial
 * theme — it reacts to the person changing it. The attribute is written verbatim, `system` included,
 * because the stylesheet resolves that case itself through a media query.
 */
export class CmThemeSwitchController implements CmController {
  readonly #root: Element;
  #query: MediaQueryList | null = null;

  constructor(root: Element) {
    this.#root = root;
  }

  connect(): void {
    this.#root.addEventListener('change', this.#handleChange);
    this.#watchSystem();
  }

  disconnect(): void {
    this.#root.removeEventListener('change', this.#handleChange);
    this.#query?.removeEventListener('change', this.#handleSystemChange);
    this.#query = null;
  }

  get #documentElement(): HTMLElement | null {
    return this.#root.ownerDocument.documentElement;
  }

  /**
   * Constructors are read off the owning document's view rather than the global scope. A page is one
   * realm, but a harness driving two documents at once is not, and `instanceof` against the wrong
   * realm quietly reports false instead of failing.
   */
  get #dataset(): DOMStringMap | null {
    const view = this.#root.ownerDocument.defaultView;
    return view && this.#root instanceof view.HTMLElement ? this.#root.dataset : null;
  }

  get #cookieName(): string {
    return this.#dataset?.cmThemeCookie ?? cmThemeCookieName;
  }

  get #mode(): CmThemeMode {
    const checked = this.#root.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    return isCmThemeMode(checked?.value) ? checked.value : 'system';
  }

  get #systemTheme(): CmResolvedTheme {
    return this.#query?.matches ? 'dark' : 'light';
  }

  /**
   * The media query is only consulted to report the resolved theme in the event. The stylesheet
   * tracks the system preference on its own, so nothing here has to rewrite the attribute when the
   * operating system changes.
   */
  #watchSystem(): void {
    const view = this.#root.ownerDocument.defaultView;
    if (typeof view?.matchMedia !== 'function') return;

    try {
      this.#query = view.matchMedia('(prefers-color-scheme: dark)');
      this.#query.addEventListener('change', this.#handleSystemChange);
    } catch {
      this.#query = null;
    }
  }

  readonly #handleSystemChange = (): void => {
    if (this.#mode !== 'system') return;
    this.#announce(this.#mode);
  };

  readonly #handleChange = (event: Event): void => {
    const view = this.#root.ownerDocument.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.HTMLInputElement) || target.type !== 'radio') return;
    if (!isCmThemeMode(target.value)) return;

    this.#apply(target.value);
  };

  #apply(mode: CmThemeMode): void {
    this.#documentElement?.setAttribute(cmThemeAttribute, mode);
    this.#writeCookie(mode);
    this.#announce(mode);
  }

  /**
   * `Secure` is omitted on a plain-HTTP origin because a browser drops the cookie outright, which
   * would silently lose the preference in local development.
   */
  #writeCookie(mode: CmThemeMode): void {
    const ownerDocument = this.#root.ownerDocument;
    const maxAge = Number(this.#dataset?.cmThemeMaxAge ?? cmThemeCookieMaxAge);

    try {
      ownerDocument.cookie = serializeCmThemeCookie(mode, {
        maxAge: Number.isFinite(maxAge) ? maxAge : cmThemeCookieMaxAge,
        name: this.#cookieName,
        secure: ownerDocument.location?.protocol === 'https:',
      });
    } catch {
      // Cookies can be unavailable in privacy-restricted contexts; the attribute still applies for
      // this page view.
    }
  }

  #announce(mode: CmThemeMode): void {
    dispatchCmEvent<ThemeChangeDetail>(this.#root, 'theme-change', {
      mode,
      resolved: resolveCmTheme(mode, this.#systemTheme),
    });
  }
}

export const createCmThemeSwitchController: CmControllerFactory = (element) => new CmThemeSwitchController(element);
