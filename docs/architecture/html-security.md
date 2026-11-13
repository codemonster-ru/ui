# CodeMonster UI HTML security

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-011`

## Decision

Vue escapes ordinary values by default. Vanilla templates must escape ordinary values for their
output context. Only insert trusted or sanitized markup into composed regions.

The design follows contextual output-encoding principles from the
[OWASP Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

## Value categories

Renderers distinguish these values:

| Category | Treatment |
| --- | --- |
| Text | Escape for HTML text context |
| Attribute value | Escape for the specific HTML attribute context |
| URL | Validate protocol and encode for attribute context |
| Enum or token | Validate against the component contract before rendering |
| Structured data | Serialize with a context-safe serializer |
| Trusted rendered markup | Insert only through the dedicated trusted-markup boundary |

Escaping is contextual. An HTML-text encoder is not automatically safe for a URL, JavaScript,
style, or arbitrary attribute-name context.

## Vanilla templates

The application is responsible for contextual escaping and validation when rendering canonical HTML.
Keep user text in escaped text and attribute values. Compose HTML regions from authored markup or
content sanitized for the intended context.

## Framework adapters

Framework-native escaping remains enabled:

- Vue text interpolation is preferred over `v-html`;
- React children are preferred over `dangerouslySetInnerHTML`;
- Angular interpolation and property binding are preferred over direct HTML insertion;
- DOM runtime controllers update text and attributes without assigning consumer content to
  `innerHTML`.

An explicit rich-HTML component may use a platform's reviewed raw-HTML boundary only when its
contract requires sanitized HTML. That capability stays out of general Card, Alert, Button, slot,
and attribute APIs.

## Slots

Slots are renderer-owned content boundaries:

- a slot renderer returns trusted rendered markup;
- components cannot reinterpret slot output as a prop or attribute;
- fallback content follows the same escaping rules;
- slot-provided text is escaped by the originating renderer;
- named slots cannot select arbitrary template files or callables from untrusted input;
- scoped slot values are data and do not become trusted markup automatically.

The contract defines where each slot appears, preventing adapters from placing trusted content in a
different parsing context.

## Attribute forwarding

- Reject invalid attribute names and control characters.
- Do not forward string attributes beginning with `on` into server-rendered HTML.
- Keep framework event listeners in framework APIs rather than serialized attributes.
- Validate finite component props before using them in class or attribute names.
- Validate URL-bearing props against the protocols allowed by the component contract.
- Do not accept arbitrary style text from an untrusted structured prop.
- Escape consumer `data-*`, `aria-*`, title, name, value, and other forwarded values normally.
- Prevent forwarded attributes from replacing component-owned state and relationship attributes.

The initial safe URL protocols are component-specific and normally limited to relative URLs,
`http`, `https`, `mailto`, and `tel` where semantically applicable. Allowing `data` or another active
scheme requires a specific security review.

## Structured data and scripts

Data embedded for client enhancement uses a JSON serializer that safely handles HTML parser
boundaries. Do not concatenate JSON into executable inline JavaScript. Prefer inert JSON data,
external modules, and CSP-compatible initialization.

Component APIs do not accept JavaScript source strings, inline handler bodies, CSS source, or
arbitrary tag names from untrusted data.

## Trusted internal markup

The following may produce trusted markup after validation:

- registered CodeMonster UI component renderers;
- the reviewed internal icon catalog;
- an explicit application sanitizer integration for a rich-HTML boundary.

Database origin, administrator input, CMS ownership, or previous rendering alone does not make a
string trusted.

## Testing requirements

Security cases cover text, attributes, URLs, slots, nested components, attribute bags, and
structured client data with payloads containing:

- HTML tags and closing tags;
- quotes and unquoted-attribute separators;
- inline event attributes;
- script and style boundaries;
- dangerous and obfuscated URL schemes;
- malformed Unicode and control characters;
- nested component and slot boundaries.

Tests assert safe parsed DOM and behavior, not only escaped string fragments. Security regressions
block adapter parity and release.

## Consequences

- Framework raw-HTML escape hatches remain exceptional and component-specific.
- Cross-platform fixtures can include hostile values and expect equivalent safe DOM.
- Trusted markup is explicit in types and review instead of inferred from strings.
