# CodeBlock ownership

Status: Accepted  
Date: 2026-08-13  
Roadmap item: `CMUI-147`

## Decision

CodeBlock remains a separately versioned VueForge composed product. It is not added to the stable
CodeMonster UI component catalog, `ui-vue`, `ui-runtime`, or the Annabel Razor package. No
`@codemonster-ru/ui-codeblock` distribution or `CmCodeBlock` adapter is introduced for the 1.0
roadmap.

Existing applications and the documentation site may use `@codemonster-ru/vueforge-codeblock`
alongside CodeMonster UI during and after component migration. The package follows the VueForge
maintenance policy and is not deprecated until a replacement has real consumers and passes the
normal migration gates.

## Reviewed responsibilities

The existing package combines several responsibilities that do not form one portable component
contract today:

- Vue rendering, props, plugin configuration, events, slots, SSR prefetch, and hydration handling;
- lazy Shiki engine, theme, and language-grammar loading;
- generated trusted token markup and plain-text escaping fallback;
- inherited VueForge theme observation and runtime CSS-variable injection;
- VueForge icon rendering for copy status;
- browser clipboard state and copy notifications;
- standalone critical, token, and component styles.

The `/highlight` entry is framework-independent JavaScript, but one internal implementation detail
with one product consumer is not sufficient evidence for another public CodeMonster UI package.
It stays local to CodeBlock until a second concrete consumer needs the same executable contract.

## Why it is not a shared adapter component

- Syntax highlighting is content processing, not a thin rendering adapter. Browser, Node SSR, and
  PHP applications have different loading, caching, and deployment constraints.
- Annabel applications must not accept arbitrary highlighted HTML as trusted markup. A Razor
  implementation would need an approved server-side highlighter and explicit sanitization or
  package-owned generation boundary.
- Copy behavior depends on browser clipboard availability and application feedback policy. It can
  be composed independently from a readable native `pre` and `code` fallback.
- Moving the current implementation into `ui-vue` would add Shiki grammar chunks, VueForge theme
  compatibility, and product-specific icons to every adapter consumer.
- Rebranding selectors and tokens without a Razor consumer would be an in-place rename, contrary to
  the migration policy.

## Consumer guidance

Vue consumers that need the complete highlighted and copyable experience should keep the dedicated
VueForge package and import its `/view` and stylesheet entries as documented. CodeMonster UI and
VueForge selectors are namespaced, so this is an approved side-by-side product boundary rather than
a compatibility layer inside the new adapters.

Razor consumers should render escaped source inside native `pre` and `code` elements. Applications
may pre-highlight through their own reviewed pipeline, but must not pass untrusted highlighted HTML
through the CodeMonster UI trusted-slot boundary. A copy button can be composed from Button and
application-owned clipboard behavior when required.

## Reconsideration criteria

CodeBlock may return to the roadmap only when all of the following are known:

1. real Vue and Razor consumers require the same semantic frame and feature set;
2. highlighting ownership for browser, Node SSR, and PHP is explicit;
3. generated markup has a testable trusted-content boundary and plain-text fallback;
4. language loading, bundle budgets, CSP, clipboard failure, accessibility, and no-JavaScript
   behavior have shared contracts;
5. a new distribution is justified without adding heavyweight optional behavior to `ui-vue`.

## Consequences

- CodeMonster UI keeps a small adapter and Composer dependency graph.
- The mature CodeBlock remains usable instead of being replaced by an incomplete cross-platform
  wrapper.
- Documentation migration can adopt CodeMonster UI foundations without rewriting its specialized
  syntax-highlighting product.
- Migration tooling treats CodeBlock as retained manual ownership and does not suggest an automatic
  package or component rename.
