/**
 * Page layouts for CodeMonster UI.
 *
 * A layout composes components into a page shell: regions, their geometry, and the state that
 * decides whether a region is shown. That is a different job from a component, which is why it is a
 * different package — see docs/architecture/layout-line-ownership.md.
 *
 * Layout state follows the same rule as component state: the decisions live in
 * `@codemonster-ru/ui-runtime/core` and each adapter translates rather than decides, so the Annabel
 * Razor adapter renders the same canonical DOM from PHP.
 */

export {};
