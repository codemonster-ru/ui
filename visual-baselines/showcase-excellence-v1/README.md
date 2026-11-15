# Showcase excellence v1

These captures record the intentional design of the private showcase after the navigation,
reference, and application examples update. They are a manual review baseline. The
[approved component snapshots](../vueforge-cross-platform/manifest.json) and their CI comparison
remain separate.

Chrome `157.0.8103.79` captured both production builds on macOS at device pixel ratio 1, with
English (`en-US`) locale and reduced motion. The capture waits for the page, theme and fonts.
File names identify the adapter, route, viewport width, and theme. Heights are 800 CSS pixels on
mobile and 960 on desktop.

| Route                      | Review focus                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| `/core/`                   | Product introduction, link hierarchy, visible current page, section links, and mobile navigation. |
| `/components/`             | Search label and group readability.                                                               |
| `/components/button/`      | Preview, example and API hierarchy, code containment, and copying affordance.                     |
| `/components/date-picker/` | Open calendar stays visible inside each adapter's preview.                                        |
| `/examples/`               | Readable metrics and data on desktop, visible tabs and reflow on mobile.                          |

See the [design and verification report](../../docs/verification/DESIGN-EXCELLENCE.md) for the
before revision, the wider browser matrix, and known accessibility limitations.
