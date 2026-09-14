<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\AccordionState;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\IconRenderer;

/**
 * Server-rendered VfAccordion.
 *
 * The first migrated component that owns an interactive control: the trigger
 * is a native button this component renders, wires and toggles. Three layers,
 * reported separately because they are separate:
 *
 *   1. The server output. The same `vf-accordion` markup the Vue adapter
 *      renders, in the initial state the props resolve to: the trigger with
 *      its ids, `aria-expanded` and native `disabled`; the panel - region,
 *      inner wrapper, default slot - when open. When closed the panel does not
 *      exist, exactly as under the reference's `v-if`, and the default slot's
 *      markup waits in an inert `<template data-vf-razor-accordion="content">`
 *      so the browser can render it without a round trip. The template is
 *      unpainted, unexposed and reaches nothing without a script.
 *   2. Without JavaScript. The initial state is truthful and nothing lies:
 *      a closed accordion shows its trigger, announces `aria-expanded=false`
 *      and offers no panel; an open one shows its panel. What is missing is
 *      the toggle - the trigger is a `type="button"` with no form action, and
 *      pressing it does nothing. A closed panel's content is unreachable, as
 *      it is in the reference without a script. This is documented rather
 *      than papered over with a `<details>` rewrite the reference never had.
 *   3. Enhanced. packages/razor/browser/accordion.ts finds this root by its
 *      `data-vf-razor="accordion"` marker, reads the state from
 *      `aria-expanded`, and reproduces the reference's click and keydown
 *      handling and its enter/leave hooks.
 *
 * Reproduced rather than corrected:
 *
 *   - `open` beats `default-open` whenever it is given; a null attribute is
 *     "nothing said" by this adapter's convention and defers to the seed;
 *   - an absent or empty title still renders an empty `<span>` before the
 *     icon, unless a trigger slot replaces it;
 *   - `disabled` writes the native attribute only - no aria-disabled, no
 *     modifier class - and does not close an open accordion;
 *   - while closed, `aria-controls` names the content id although no element
 *     carries it.
 *
 * There is no controlled mode. A server-rendered accordion has no parent to
 * emit a request to, so `open` is read as the initial state and the
 * enhancement toggles on its own, dispatching `vf-accordion:open-change` so a
 * host can observe what a Vue consumer observes through update:open.
 */
final class AccordionComponent implements ComponentInterface
{
    /** The literal size the reference passes to the icon component. */
    private const ICON_SIZE = 'var(--vf-icon-size-sm)';

    /** Props consumed by the component; everything else falls through to the section. */
    private const COMPONENT_PROPS = ['open', 'default-open', 'defaultOpen', 'title', 'disabled', 'class', 'style'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $open = AccordionState::resolveOpen(
            $this->nullableBooleanProp($context, 'open'),
            $this->nullableBooleanProp($context, 'default-open') ?? $this->nullableBooleanProp($context, 'defaultOpen'),
        );
        $title = $this->stringProp($context, 'title');
        $disabled = $this->booleanProp($context, 'disabled');

        $triggerId = FieldIds::next('vf-accordion-trigger');
        $contentId = FieldIds::next('vf-accordion-content');

        $attributes = $this->forwardedAttributes($context);
        $attributes['class'] = Html::classes(['vf-accordion', $this->stringProp($context, 'class') ?? '']);
        $attributes['style'] = $this->stringProp($context, 'style');
        // The ownership marker the browser controller mounts on. Adapter
        // metadata, not product: the parity extractor drops it by its prefix.
        $attributes['data-vf-razor'] = 'accordion';

        $markup = '<section' . Html::attributes($attributes) . '>';

        // The trigger, in the reference's attribute order. Native button,
        // type=button, native disabled - never aria-disabled, never a role.
        $markup .= '<button' . Html::attributes([
            'id' => $triggerId,
            'aria-controls' => $contentId,
            'aria-expanded' => $open ? 'true' : 'false',
            'disabled' => $disabled,
            'class' => 'vf-accordion__trigger',
            'type' => 'button',
        ]) . '>';
        // The trigger slot is fallback content: it replaces the title span
        // whatever the title says. Interpolated text in the Vue template, so
        // escaped here; an empty span for an absent or empty title.
        $markup .= $context->hasSlot('trigger')
            ? $context->slot('trigger')->value()
            : '<span>' . Html::escape($title ?? '') . '</span>';
        $markup .= '<span aria-hidden="true" class="' . Html::classes(AccordionState::resolveIconClasses($open)) . '">'
            . IconRenderer::render('chevron-down', self::ICON_SIZE)
            . '</span>';
        $markup .= '</button>';

        $content = $context->hasSlot('default') ? $context->slot('default')->value() : '';

        if ($open) {
            // The region and its inner wrapper are unconditional while open,
            // empty slot included. No inline style: the reference animates
            // only on a change, never on the initial render.
            $markup .= '<div' . Html::attributes([
                'id' => $contentId,
                'aria-labelledby' => $triggerId,
                'class' => 'vf-accordion__content',
                'role' => 'region',
            ]) . '>'
                . '<div class="vf-accordion__content-inner">' . $content . '</div>'
                . '</div>';
        } else {
            // No panel, as under v-if. The content waits inert for the
            // browser controller; see the class docblock.
            $markup .= '<template data-vf-razor-accordion="content">' . $content . '</template>';
        }

        return RenderedHtml::fromTrustedString($markup . '</section>');
    }

    /**
     * Props that are not component props fall through to the section.
     *
     * This is the path a consumer id, role, style, data-* or accessible name
     * travels - onto the root, never the trigger or the panel. A consumer
     * `aria-expanded` lands here too and leaves the trigger's own alone.
     *
     * @return array<string, string|bool|int|float|null>
     */
    private function forwardedAttributes(ComponentRenderContext $context): array
    {
        $forwarded = [];

        foreach ($context->props() as $name => $value) {
            if (in_array($name, self::COMPONENT_PROPS, true)) {
                continue;
            }

            if ($value === null || is_bool($value) || is_string($value) || is_int($value) || is_float($value)) {
                $forwarded[$name] = $value;
                continue;
            }

            throw new \InvalidArgumentException(
                sprintf('The [%s] attribute of vf-accordion must be a scalar or null.', $name),
            );
        }

        return $forwarded;
    }

    /** A boolean prop, or null when the attribute was not given or was null. */
    private function nullableBooleanProp(ComponentRenderContext $context, string $name): ?bool
    {
        $value = $context->prop($name);

        if ($value === null) {
            return null;
        }

        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            return !in_array($value, ['false', '0', ''], true);
        }

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-accordion must be a boolean.', $name));
    }

    private function booleanProp(ComponentRenderContext $context, string $name): bool
    {
        return $this->nullableBooleanProp($context, $name) ?? false;
    }

    private function stringProp(ComponentRenderContext $context, string $name): ?string
    {
        $value = $context->prop($name);

        if ($value === null || $value === false) {
            return null;
        }

        if (is_string($value) || is_int($value) || is_float($value)) {
            return (string) $value;
        }

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-accordion must be a string.', $name));
    }
}
