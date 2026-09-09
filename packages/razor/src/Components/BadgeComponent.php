<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\PresentationState;

/**
 * Server-rendered VfBadge.
 *
 * Renders the same `vf-badge` markup the Vue adapter renders, so the canonical
 * stylesheet in packages/styles applies unchanged. It ships no browser
 * controller, and that is not an omission: a badge is a span with text in it.
 * There is nothing to enhance, nothing to synchronise and no state to own, so
 * everything this component does is complete server-side.
 *
 * Deliberately not implemented in terms of TagComponent, and not sharing a
 * renderer with it. The two produce almost the same markup from almost the same
 * props, and a helper taking the block name would make one substitutable for
 * the other in the source - which is the specific failure the M15 batch is
 * built to detect. The class rule lives in PresentationState, where it is
 * pinned by vectors both platforms run.
 *
 * The badge writes no ARIA. It has no role and no accessible name, so a badge
 * that needs to announce itself is given `role` and `aria-label` by its caller,
 * which reach the span through the ordinary attribute fall-through.
 */
final class BadgeComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the span. */
    private const COMPONENT_PROPS = ['tone', 'class', 'style'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $tone = $this->stringProp($context, 'tone') ?? 'neutral';

        $attributes = $this->forwardedAttributes($context);
        // Vue merges a parent-supplied class onto the component root after its
        // own rather than replacing it, so the canonical classes come first
        // here too. `neutral` contributes no modifier at all, which is the
        // historical convention this component follows.
        $attributes['class'] = Html::classes([
            Html::classes(PresentationState::resolveBadgeClasses($tone)),
            $this->stringProp($context, 'class') ?? '',
        ]);
        $attributes['style'] = $this->stringProp($context, 'style');

        return RenderedHtml::fromTrustedString(
            '<span' . Html::attributes($attributes) . '>'
                . ($context->hasSlot('default') ? $context->slot('default')->value() : '')
                . '</span>',
        );
    }

    /**
     * Props that are not component props fall through to the span, which is how
     * data-*, aria-* and a consumer role reach the root.
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
                sprintf('The [%s] attribute of vf-badge must be a scalar or null.', $name),
            );
        }

        return $forwarded;
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-badge must be a string.', $name));
    }
}
