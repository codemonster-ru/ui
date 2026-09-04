# CodeBlock ownership

Status: Accepted  
Date: 2026-08-13  
Revisited: 2026-09-03  
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

## What changed since, and what did not

By 2026-09-03 icon geometry had crossed into CodeMonster UI as precomputed data, and Playground had
been re-checked against the same question and confirmed to have no server equivalent. That made
reconsideration criterion 2 above -- "highlighting ownership for browser, Node SSR, and PHP is
explicit" -- worth answering as far as it currently can be, rather than leaving it as an open
checkbox nobody had looked at since 2026-08-13.

**Browser and Node SSR are already answered**, and were not obvious in August: `VfCodeBlock` calls
`onServerPrefetch`, and the code comment at its mount hook says so directly -- "SSR can already
contain Shiki output." Shiki's `engine/javascript` avoids the WASM Oniguruma engine entirely, so
highlighting already runs outside a browser today, during Vue SSR in Node. That rules out one
possible reason to keep deferring: this was never blocked on Shiki needing a browser.

**PHP is not answered, and the two ways to answer it carry genuinely different costs** -- which is
why this stays a reconsideration criterion rather than a decision made here:

- _Progressive enhancement_: Razor renders escaped, working `pre`/`code` -- exactly what "Consumer
  guidance" above already prescribes -- and a controller loads Shiki's browser bundle
  (`shiki/bundle/web`, a real published export) to color it client-side. This is the same shape as
  every other adapter in this line: no PHP runtime dependency, a flash of unhighlighted text is the
  cost, and it cannot be removed the way the theme flash was, because `code` is arbitrary per-request
  content rather than a small enumerable set a build step could precompute.
- _A PHP-side highlighter matching Shiki's output_: checked rather than assumed, and the answer is
  that none exists as a native PHP engine. The one established PHP integration, `spatie/shiki-php`,
  is not an independent engine -- it shells out to a real Node process per render. Adopting that
  model would make CodeBlock the only place in the entire Razor adapter with a hard Node.js runtime
  dependency at request time, unlike every other component and layout, all of which are pure PHP.
  Writing a from-scratch PHP tokenizer for the same TextMate grammars Shiki consumes would reintroduce
  exactly the "two engines obliged to agree" risk the icon-line decision avoided by precomputing --
  except here the input is unbounded, so there is nothing to precompute once and ship.

Progressive enhancement is the one consistent with everything else this migration has built and
already what "Consumer guidance" recommends for Razor; it is written here as the likely direction,
not as an adopted decision -- criterion 2 stays open until a real Razor consumer forces the choice,
and criteria 1, 3, 4, and 5 remain entirely unaddressed.

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
