# Playground line ownership

Status: Accepted
Date: 2026-09-03

## Decision

`vueforge-playground`, `vueforge-playground-core`, and `vueforge-playground-vite-plugin` stay
VueForge-only. This is not a deferral pending a future branch — the reason a component, a layout, a
theme, and icon geometry all crossed into CodeMonster and Playground does not is different in kind,
not in degree.

Every other retained-then-carried-across piece of this migration turned out to be portable once read
closely enough: icons looked like a rendering engine that would have to be reimplemented twice and
turned out to be static data once precomputed. Playground is not that shape. Its entire purpose is
running code a person just typed, live, in a browser tab. There is no equivalent to precompute,
because the input is not a fixed set of combinations — it is arbitrary text a person is still typing.

## What it actually does

`packages/playground-core/src/typescriptWorker.js` transpiles TypeScript with a real `Worker`:

```js
self.addEventListener('message', (event) => {
  const request = event.data;
  // ... transpiles request.sources with the TypeScript compiler ...
  self.postMessage({ type: 'result', id: request.id, outputs: [] });
});
```

`packages/playground-core/src/runtimes/browserRuntime.ts` runs the result in a sandboxed frame:

```ts
export function runInIframe(iframe: HTMLIFrameElement, html: string): void {
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.srcdoc = html;
}
```

`Worker` and `HTMLIFrameElement` are not framework choices Vue happened to make; they are what a
live, reactive, sandboxed preview of arbitrary just-edited code requires. Nothing server-rendered can
supply either. A PHP request answers one request with one response; it cannot host a running,
interactive session watching for the next keystroke.

Nothing in the CodeMonster line depends on any of the three packages — not `ui-vue`, not
`ui-layouts`, not `ui-runtime`, not `ui-icons`. They are consumed by `examples/vue`'s frozen showcase
alone, as documentation tooling, and by nothing this kit ships.

## Why this is not the icon question again

Icons looked hard to port for the same surface reason — a 2,135-line renderer nobody wanted to
duplicate — and turned out to be portable because an icon's output is a pure function of three known
values (name, family, variant), computable once and shipped as data to both platforms.

Playground's output is a pure function of whatever a person is typing at this instant, plus every
prior keystroke's effect on module state, timers, and DOM. There are not 928 combinations to
enumerate; there are infinitely many programs, and the interesting cases are wrong ones nobody has
written yet. Precomputing an infinite space is not a harder version of precomputing a finite one — it
is not the same operation.

## What would change this decision

A requirement for a _server-executed_ code sandbox — running untrusted code in an isolated process
and streaming structured results back, the way a hosted notebook or CI runner does — would be a
different product built on different primitives (a subprocess sandbox, not a `Worker`; a result
stream, not a `postMessage` bridge to a live DOM). That is not what today's Playground is, porting it
would not produce it, and no such requirement exists today.

## Consequences

- `@codemonster-ru/vueforge-playground`, `-playground-core`, and `-playground-vite-plugin` remain
  `retain` in the migration map, now for a documented and provable reason rather than a placeholder
  one.
- The migration map's outstanding `retain` entries narrow to `vueforge-codeblock`, which is a
  separate decision — syntax highlighting has no comparable browser-only primitive forcing the same
  conclusion, and deserves its own reading rather than riding on this one.
- No further branch is expected to revisit this unless the requirement in the section above appears.
