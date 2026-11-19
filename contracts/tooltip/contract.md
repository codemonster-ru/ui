# Tooltip contract

Status: Active

Component: `Tooltip`

Tooltip supplies brief non-interactive content for a native button or an authored trigger. In
Vue, `label` supplies the fallback button text and accessible name. The `trigger` slot
replaces that button's visible contents. Supply a single focusable element in the default slot to
use your own trigger. For component triggers, the root element must accept HTML attributes.
`content`, `text`, or the trusted `content` slot supplies the tooltip body. A Vue tooltip can
generate its ID. Vanilla markup must supply a unique ID and reference it on the trigger with
`aria-describedby`. Give an authored trigger the `cm-tooltip__trigger` class and the
`data-cm-tooltip-custom-trigger` attribute to retain its styling.

`placement` supports `top`, `bottom`, `start`, and `end`. Hover or focus shows the tooltip
after `delay` (`none`, `short`, or `long`). A finite nonnegative `openDelay` takes
precedence. Use `data-cm-tooltip-open-delay` for the equivalent Vanilla setting. The tooltip
stays visible while the pointer is over the trigger, the panel, or the space between them. It
closes when the pointer leaves and the trigger does not have focus. Escape dismisses it while
focused or hovered without moving focus. The panel remains in the DOM and `hidden` tracks
whether it is visible.
`defaultVisible` sets only the initial render state.

Once enhanced, an inline tooltip moves in the viewport and flips to the opposite side when
needed. The panel remains inside its authored container and can still be clipped by an ancestor
with `overflow: hidden`, scrolling overflow, or paint containment. To escape such an ancestor,
choose a portal target outside the clipping container. Before enhancement the Tooltip follows
its CSS placement.

The visible tooltip can be positioned in another container. Use `teleportTo` with a selector or
element in Vue, or `data-cm-tooltip-teleport-to` with a selector in Vanilla. A `body` target
inside an open dialog keeps the tooltip in that dialog. Vue `disableTeleport`, `null`, or
`false` keeps it inline. The historical `VfTooltip` Vue export defaults to an 80 ms delay, top
placement, and a body target, and accepts the default trigger and named content slots.
