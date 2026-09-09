<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\PresentationState;

/**
 * Server-rendered VfTag.
 *
 * Renders the same `vf-tag` markup the Vue adapter renders, so the canonical
 * stylesheet in packages/styles applies unchanged. No browser controller: a tag
 * is a span with text in it, and unlike the chips other libraries ship, this one
 * is not dismissible - there is no remove affordance and no event to wire.
 *
 * This file is very nearly BadgeComponent, and that duplication is the point.
 * The two components take a `tone` typed by two different public unions, and
 * their stylesheets give a tone different meanings: a badge tone paints a
 * background, a tag tone only a border and text colour. Writing them once with
 * a block-name parameter would let a defect in one silently satisfy the
 * other's evidence, which is the exact substitution M15 exists to disprove. The
 * class rule lives in PresentationState, where it is pinned by vectors both
 * platforms run.
 */
final class TagComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the span. */
    private const COMPONENT_PROPS = ['tone', 'class', 'style'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $tone = $this->stringProp($context, 'tone') ?? 'neutral';

        $attributes = $this->forwardedAttributes($context);
        // Canonical classes first, consumer class appended - what Vue does with
        // an inherited class. `neutral` contributes no modifier.
        $attributes['class'] = Html::classes([
            Html::classes(PresentationState::resolveTagClasses($tone)),
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
     * Props that are not component props fall through to the span.
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
                sprintf('The [%s] attribute of vf-tag must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-tag must be a string.', $name));
    }
}
