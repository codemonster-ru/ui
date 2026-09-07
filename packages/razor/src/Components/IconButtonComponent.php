<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\IconButton;

/**
 * Server-rendered VfIconButton.
 *
 * Renders the same `vf-icon-button` markup the Vue adapter renders, so the
 * canonical stylesheet applies unchanged. Unlike VfInput there is nothing to
 * enhance afterwards: a button carrying an icon is complete server-side, needs
 * no controller, and works with JavaScript disabled.
 *
 * The component is render-only, matching the historical Vue component: no
 * slots, no emitted events of its own, and a native click.
 */
final class IconButtonComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the button. */
    private const COMPONENT_PROPS = ['icon', 'variant', 'size', 'type', 'class'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $icon = $this->stringProp($context, 'icon');

        if ($icon === null || $icon === '') {
            throw new \InvalidArgumentException('The [icon] prop of vf-icon-button is required.');
        }

        $attributes = $this->forwardedAttributes($context);

        // A consumer class is appended to the canonical classes, never a
        // replacement for them, which is what Vue does with an inherited class.
        $attributes['class'] = $this->stringProp($context, 'class');

        return RenderedHtml::fromTrustedString(IconButton::render(
            $icon,
            $this->stringProp($context, 'variant') ?? 'ghost',
            $this->stringProp($context, 'size') ?? 'md',
            $this->stringProp($context, 'type') ?? 'button',
            $attributes,
        ));
    }

    /**
     * Props that are not component props fall through to the button element,
     * which is how native attributes, aria-* and data-* reach the control.
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
                sprintf('The [%s] attribute of vf-icon-button must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-icon-button must be a string.', $name));
    }
}
