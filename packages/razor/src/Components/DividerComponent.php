<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\PresentationState;

/**
 * Server-rendered VfDivider.
 *
 * Renders the same `vf-divider` markup the Vue adapter renders. No slot, no
 * browser controller, no state: a separator is a box with a border.
 *
 * Three historical decisions are reproduced here rather than corrected, and all
 * three would look like defects to a reviewer who had not read the reference:
 *
 *   - the root is a `div`, not an `hr`;
 *   - `aria-orientation` is written on both orientations, but `role="separator"`
 *     only on the vertical one, so a horizontal divider carries an ARIA
 *     attribute on an element with no role, where it is inert;
 *   - consumer attributes are applied *after* the component's own, so a caller
 *     can add a role where there was none, replace the separator role, or set
 *     an `aria-orientation` that contradicts the orientation prop.
 *
 * Each of those is a public behaviour someone may already depend on. Fixing any
 * of them would be a silent product change, so the parity policy names them as
 * historical quirks and the gate fails if they move.
 */
final class DividerComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the div. */
    private const COMPONENT_PROPS = ['orientation', 'class', 'style'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $orientation = $this->stringProp($context, 'orientation') ?? 'horizontal';

        // The component's own attributes first, in the order the reference
        // template writes them.
        $attributes = [
            'class' => Html::classes([
                Html::classes(PresentationState::resolveDividerClasses($orientation)),
                $this->stringProp($context, 'class') ?? '',
            ]),
            'aria-orientation' => $orientation,
            'role' => PresentationState::resolveDividerRole($orientation),
            'style' => $this->stringProp($context, 'style'),
        ];

        // Then the consumer's, which overwrite them - the equivalent of
        // `v-bind="attrs"` sitting last in the template. `class` is excluded
        // because Vue merges class rather than replacing it, and it was already
        // merged above.
        foreach ($this->forwardedAttributes($context) as $name => $value) {
            $attributes[$name] = $value;
        }

        return RenderedHtml::fromTrustedString('<div' . Html::attributes($attributes) . '></div>');
    }

    /**
     * Props that are not component props fall through to the div.
     *
     * This is the path a consumer `role` or `aria-orientation` travels, which
     * is why it deliberately does not filter either of them out.
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
                sprintf('The [%s] attribute of vf-divider must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-divider must be a string.', $name));
    }
}
