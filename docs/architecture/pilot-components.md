# CodeMonster UI pilot components

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-015`

## Decision

The first CodeMonster UI vertical slices are Button, Card, Input, and Accordion. Together they prove
the shared contracts, CSS, Vue rendering, Annabel Razor rendering, native forms, DOM runtime, SSR,
accessibility, and parity infrastructure before React, Angular, utilities, or broad component
migration begins.

Field is included as supporting Input infrastructure, not a fifth independent pilot.

## Pilot sequence

Implement the pilots in this order:

1. Button;
2. Card;
3. Field and Input;
4. Accordion and the shared DOM runtime.

Each pilot completes its roadmap gate before the next architectural capability depends on it.

## Button

Button proves the smallest useful cross-platform component contract.

It covers:

- semantic root selection for button and documented link cases;
- finite variant and size props;
- disabled, loading, and busy state;
- default content and leading or trailing icon regions;
- native attribute and event forwarding;
- shared CSS and token consumption;
- Vue and Razor SSR parity;
- accessible naming and progress indication.

Button must not introduce a general polymorphic `as` API. Supported root modes are explicit in its
contract so invalid native attributes cannot move between arbitrary elements.

## Card

Card proves cross-platform content composition.

It covers:

- semantic container selection;
- header, default content, and footer regions;
- fallback title rendering;
- nested component and slot rendering in Annabel Razor;
- consumer attributes and styling hooks;
- empty-region omission;
- significant content ordering across adapters.

Card remains a presentation and content-structure component. It does not absorb application data
loading, navigation, or selection behavior.

## Field and Input

Input proves native form participation and controlled values. Field provides the label,
description, error, and relationship boundary required to test it correctly.

They cover:

- native name, value, type, required, disabled, readonly, and autocomplete behavior;
- Vue model binding;
- Razor server values and native form submission;
- labels, descriptions, errors, invalid state, and explicit deterministic control relationships;
- leading and trailing adornments where the contract approves them;
- SSR and hydration preservation of user-entered values;
- application validation integration without owning a validation framework.

Advanced masking, asynchronous validation, autocomplete popups, and rich composite inputs remain
outside the pilot.

## Accordion

Accordion proves interactive behavior across native framework state and progressive enhancement.

It covers:

- deterministic open and closed server state;
- trigger and panel relationships;
- keyboard activation and focus behavior;
- controlled and default-open modes;
- shared `data-cm-state` transitions;
- DOM runtime discovery, initialization, repeated initialization, and disposal;
- Vue-native state without attaching the DOM controller;
- Razor progressive enhancement;
- reduced-motion behavior and optional transition states.

The pilot implements the minimum approved single-item contract first. Multiple selection and complex
collection management require a contract extension rather than speculative pilot scope.

## Platform rollout

The pilots are implemented first in shared contracts, tokens, CSS, Vue, and Annabel Razor. React and
Angular begin only after the Vue/Razor Accordion gate passes.

This order validates the two real initial consumers:

- the Vue CMS administration application;
- the public CMS template rendered by Annabel Razor.

React and Angular then prove that the contract was not accidentally tailored to either initial
consumer.

## Required evidence

Every pilot provides:

- an approved manifest and normative specification;
- canonical input cases and HTML;
- shared CSS with no framework imports;
- Vue unit, SSR, and significant DOM tests;
- PHP/Razor rendering, escaping, and significant DOM tests;
- shared accessibility cases;
- representative visual fixtures;
- packed npm and Composer consumer coverage when its packages exist;
- equivalent documented examples for Vue and Razor.

Interactive pilots additionally provide shared behavior scenarios and DOM runtime tests.

## Scope control

Before milestone M4 completes:

- do not migrate additional component cohorts;
- do not scaffold React or Angular adapters;
- do not build the utility CSS package;
- do not create a universal component generator;
- do not redesign CodeBlock, Playground, or application shells;
- do not rename the repository or published VueForge packages.

Fixing a shared foundation issue discovered by a pilot remains in scope. Adding unrelated components
does not.

## Success criteria

The pilot architecture is validated when:

1. Button and Card pass Vue/Razor semantic and visual parity;
2. Input preserves native Razor submission and Vue model binding;
3. Accordion works through Vue state and Razor progressive enhancement;
4. all four use the same tokens, CSS, canonical contracts, and accessibility expectations;
5. CSS-only and SSR consumers have no hidden Vue dependency;
6. the real Vue admin and a representative Razor template can consume pilot prerelease artifacts.

Failure to meet a criterion triggers a contract or boundary review before component expansion.

## Consequences

- Early work validates architecture instead of maximizing component count.
- Vue and Razor remain the first practical consumers without becoming the universal implementation.
- React and Angular start from proven contracts and fixtures.
- Each pilot has a narrow reason to exist and a measurable exit gate.
