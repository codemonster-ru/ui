<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\SkeletonState;

/**
 * Server-rendered VfSkeleton.
 *
 * Renders the same `vf-skeleton` markup the Vue adapter renders. No slot, no
 * children, no browser controller: the shimmer is a CSS animation on a
 * pseudo-element, so there is nothing for JavaScript to drive on either
 * platform.
 *
 * Four historical decisions are reproduced here rather than corrected:
 *
 *   - `aria-hidden="true"` is written on every skeleton, and a consumer
 *     attribute of the same name replaces it. In Vue that follows from
 *     aria-hidden being a static attribute on a component that does not set
 *     inheritAttrs: false; here it follows from consumer attributes being
 *     applied last. Blocking the override would be a silent API removal;
 *   - the animation modifier is present at the default and absent when the
 *     caller switches it off - the opposite polarity to the M15 toned spans;
 *   - `radius` defaults to a token string, so `border-radius` is written on
 *     every skeleton. An empty radius is not "no rounding": the declaration is
 *     dropped, and a skeleton with an empty radius and no min-height carries no
 *     style attribute at all;
 *   - a numeric `min-height` becomes pixels, and zero is a length rather than an
 *     absence.
 *
 * The component exposes no role, no aria-busy and no live region. A loading
 * placeholder that announced itself would be an accessibility improvement and a
 * product change.
 */
final class SkeletonComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the div. */
    private const COMPONENT_PROPS = ['min-height', 'minHeight', 'radius', 'animated', 'class', 'style'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $minHeight = $this->lengthProp($context);
        $radius = $context->hasProp('radius') ? $this->stringProp($context, 'radius') : 'var(--vf-radius-surface)';
        $animated = $this->booleanProp($context, 'animated');

        // The component's own attributes first, in the order the reference
        // template writes them: class, style, aria-hidden.
        $attributes = [
            'class' => Html::classes([
                Html::classes(SkeletonState::resolveClasses($animated)),
                $this->stringProp($context, 'class') ?? '',
            ]),
            'style' => Html::mergeStyles(
                SkeletonState::resolveStyle($minHeight, $radius),
                $this->stringProp($context, 'style'),
            ),
            'aria-hidden' => 'true',
        ];

        // Then the consumer's, which overwrite them - the equivalent of an
        // inherited attribute beating a static one in a Vue template. `class`
        // and `style` are excluded because Vue merges both rather than
        // replacing them, and both were already merged above.
        foreach ($this->forwardedAttributes($context) as $name => $value) {
            $attributes[$name] = $value;
        }

        return RenderedHtml::fromTrustedString('<div' . Html::attributes($attributes) . '></div>');
    }

    /**
     * Props that are not component props fall through to the div.
     *
     * This is the path a consumer `aria-hidden` travels, which is why it is
     * deliberately not filtered out.
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
                sprintf('The [%s] attribute of vf-skeleton must be a scalar or null.', $name),
            );
        }

        return $forwarded;
    }

    /**
     * The min-height prop, which historically accepts a number as well as a string.
     *
     * A template writes it as text, so a numeric string has to stay a numeric
     * string here: `min-height="40"` must become `40px` the way the Vue prop
     * typed `string | number` does, while `min-height="3rem"` passes through.
     */
    private function lengthProp(ComponentRenderContext $context): string|int|float|null
    {
        $value = $context->prop($context->hasProp('min-height') ? 'min-height' : 'minHeight');

        if ($value === null || $value === false) {
            return null;
        }

        if (is_int($value) || is_float($value)) {
            return $value;
        }

        if (is_string($value)) {
            return is_numeric($value) ? $value + 0 : $value;
        }

        throw new \InvalidArgumentException('The [min-height] prop of vf-skeleton must be a string or a number.');
    }

    /**
     * A boolean prop that defaults to true.
     *
     * `animated` is the only prop in the migrated set whose default is true, so
     * absence means on and `animated="false"` has to mean off - a bare
     * `animated` attribute, which Razor passes as `true`, means on as well.
     */
    private function booleanProp(ComponentRenderContext $context, string $name): bool
    {
        $value = $context->prop($name);

        if ($value === null) {
            return true;
        }

        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            return !in_array($value, ['false', '0', ''], true);
        }

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-skeleton must be a boolean.', $name));
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-skeleton must be a string.', $name));
    }
}
