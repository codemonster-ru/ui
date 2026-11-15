# Vue document event composables

`useClickOutside` and `useEscapeKey` are available from `@codemonster-ru/ui-vue/historical`.
Call them in a component's setup. They listen on the document that owns the mounted component
and release their listeners on unmount. Server rendering can run setup without a document.

Use `useClickOutside(target, handler, options)` for an application-owned disclosure. Pass an
element ref or a list of refs. For a teleported panel, include both the trigger and panel refs
so interaction inside either stays inside the disclosure. The default event is `pointerdown`.
Pass `{ event: 'click' }` to use click instead. The handler receives the original event.
The `enabled` option accepts a boolean, ref, or getter.

Use `useEscapeKey(handler, options)` to handle Escape. The most recently enabled handler wins
within its document and event type. The default event is `keydown`, and `keyup` has its own
activation order. The hook ignores events already prevented by the application. The handler owns
dismissal, any call to `preventDefault()`, and any focus changes. For a native modal, use its
native `cancel` event or the matching Dialog or Drawer dismissal props.
