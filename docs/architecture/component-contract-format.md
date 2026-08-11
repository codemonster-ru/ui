# CodeMonster UI component contract format

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-005`

## Decision

Every public component has one repository-owned contract composed of human-readable semantics,
machine-readable API metadata, rendering cases, canonical HTML, and applicable behavior scenarios.
Adapters implement this contract; the contract is not generated from an adapter.

The contract format is intentionally a small test and documentation format, not a component DSL or
cross-platform source generator.

## Contract layout

The infrastructure phase creates the following layout:

```text
contracts/
  button/
    contract.md
    manifest.json
    cases/
      default.case.json
      default.html
      loading.case.json
      loading.html
    behavior/
      keyboard.scenario.json
```

Only files required by the component are present. A static component may have no `behavior`
directory. Complex fixtures may use additional named files, but the contract root stays shallow and
predictable.

## Normative specification

`contract.md` explains semantics that cannot be expressed safely as metadata:

- purpose and appropriate usage;
- semantic root-element rules;
- prop interactions and invalid combinations;
- slot meaning and content restrictions;
- state transitions;
- accessibility name and relationship requirements;
- keyboard, focus, and pointer behavior;
- SSR and progressive-enhancement behavior;
- platform-specific deviations explicitly allowed by the contract.

The specification references manifest members and fixture identifiers instead of duplicating their
complete values.

## Machine-readable manifest

`manifest.json` contains the stable public surface that parity tooling can validate:

```json
{
  "schemaVersion": 1,
  "name": "Button",
  "slug": "button",
  "razorTag": "cm-button",
  "props": {
    "variant": {
      "type": "enum",
      "values": ["primary", "secondary", "danger", "ghost"],
      "default": "primary"
    },
    "disabled": {
      "type": "boolean",
      "default": false
    }
  },
  "slots": {
    "default": {
      "required": true
    }
  },
  "events": {},
  "states": ["default", "disabled"]
}
```

The initial manifest vocabulary supports:

- canonical component name, slug, and Razor tag;
- props with primitive, enum, nullable, collection, and structured-value shapes;
- required and optional slots;
- semantic events without platform-specific handler syntax;
- named externally observable states;
- references to related components and shared value contracts.

The manifest does not contain CSS declarations, framework source, executable expressions, or
templates. A repository-owned JSON Schema validates every manifest before adapters consume it.

## Rendering cases

Each `*.case.json` file describes platform-neutral component input:

```json
{
  "id": "button-loading",
  "props": {
    "loading": true
  },
  "slots": {
    "default": "Save"
  }
}
```

The matching `*.html` file contains canonical rendered HTML. Adapter harnesses translate the case
input into native mounting or server-rendering syntax, then compare significant DOM according to
`CMUI-006`.

Case values must remain serializable. Platform callbacks, refs, dependency injection, and other
native-only values belong in adapter tests, not shared rendering cases.

## Behavior scenarios

Interactive components add declarative scenarios describing observable actions and outcomes:

```json
{
  "id": "accordion-toggle-keyboard",
  "case": "accordion-default",
  "steps": [
    { "action": "focus", "target": "trigger" },
    { "action": "press", "key": "Enter" },
    { "expect": "attribute", "target": "trigger", "name": "aria-expanded", "value": "true" },
    { "expect": "visible", "target": "panel" }
  ]
}
```

The scenario vocabulary stays limited to user-observable DOM, keyboard, focus, pointer, event, and
accessibility outcomes. Platform harnesses execute the same scenario without sharing framework
lifecycle code.

## Authority and conflict resolution

- The manifest is authoritative for public names, allowed values, defaults, slots, events, and
  externally observable state names.
- Canonical HTML is authoritative for significant rendered structure and accessibility attributes.
- Behavior scenarios are authoritative for observable interaction outcomes.
- `contract.md` is authoritative for semantics, constraints, and explicitly allowed deviations.
- Adapter-specific tests may strengthen platform guarantees but cannot weaken the shared contract.

If two contract artifacts conflict, the contract is invalid and no adapter change may choose one
silently. The artifacts must be reconciled in a dedicated contract commit.

## Versioning

`schemaVersion` versions the file format, not the component. Component API changes follow package
semantic versioning. A schema migration must update validation and all affected manifests in a
reviewable mechanical change.

Contract changes use these compatibility rules:

- adding an optional case or clarifying prose is non-breaking;
- adding an optional prop may be non-breaking;
- changing canonical semantics, defaults, rendered accessibility, or behavior may be breaking;
- removing or renaming props, slots, events, states, or required DOM is breaking;
- an adapter cannot claim support until it passes every applicable stable contract case.

## Deliberate exclusions

- No adapter source generation in the initial architecture.
- No universal render function or virtual DOM.
- No executable JavaScript or PHP in manifests and case inputs.
- No snapshots captured from Vue and promoted automatically to canonical HTML.
- No requirement for byte-identical framework output.

## Consequences

- Documentation, parity tooling, and adapters share stable component identifiers.
- PHP and JavaScript test harnesses can consume the same serializable cases.
- Human review remains responsible for semantics that a schema cannot express safely.
- The format can evolve independently from any supported rendering platform.
