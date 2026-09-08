<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\ButtonState;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\ProgressSpinner;

/**
 * Server-rendered VfButton.
 *
 * Renders the same `vf-button` markup the Vue adapter renders, so the canonical
 * stylesheet in packages/styles applies unchanged. It ships no browser
 * controller at all, and that is a decision rather than an omission: a native
 * button already handles the pointer, Enter, Space, focus and the disabled
 * state, so enhancing it would mean re-implementing behaviour the platform
 * gives away. Everything this component does is complete server-side.
 *
 * Loading is not a visual state here either. The native `disabled` attribute is
 * applied while loading, which is what makes a loading button genuinely inert
 * to both the pointer and the keyboard, and it wins over an explicit
 * `disabled="false"` exactly as the reference does.
 *
 * The label is the default slot, matching Vue. Icons are written into that slot
 * by the caller - the historical component has no icon props - so this
 * component needs no icon handling of its own and no glyph data.
 */
final class ButtonComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the button. */
    private const COMPONENT_PROPS = ['variant', 'size', 'block', 'loading', 'type', 'class', 'style'];

    /** The token the reference sizes the loading spinner with. */
    private const SPINNER_SIZE = 'var(--vf-icon-current-size)';

    private const SPINNER_STROKE_WIDTH = 5;

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $variant = $this->stringProp($context, 'variant') ?? 'primary';
        $size = $this->stringProp($context, 'size') ?? 'md';
        $block = $this->boolProp($context, 'block');
        $loading = $this->boolProp($context, 'loading');
        $type = $this->stringProp($context, 'type') ?? 'button';

        $forwarded = $this->forwardedAttributes($context);
        // Vue reads `attrs.disabled === true || attrs.disabled === ''`. Here the
        // equivalent is a prop that is present and not false; the shared rule
        // then decides what loading does with it.
        $disabled = ($forwarded['disabled'] ?? false) !== false;
        unset($forwarded['disabled']);

        $attributes = $forwarded;
        // A consumer class is appended to the canonical classes, never a
        // replacement for them, which is what Vue does with an inherited class.
        $attributes['class'] = Html::classes([
            Html::classes(ButtonState::resolveClasses($variant, $size, $block, $loading)),
            $this->stringProp($context, 'class') ?? '',
        ]);
        $attributes['style'] = $this->stringProp($context, 'style');
        $attributes['type'] = $type;
        $attributes['disabled'] = ButtonState::isDisabled($loading, $disabled);
        $attributes['aria-busy'] = ButtonState::resolveBusy($loading);

        $content = $loading
            ? ProgressSpinner::render(self::SPINNER_SIZE, self::SPINNER_STROKE_WIDTH, 'Loading', ['vf-button__spinner'])
            : '';

        return RenderedHtml::fromTrustedString(
            '<button' . Html::attributes($attributes) . '>'
                . $content
                . ($context->hasSlot('default') ? $context->slot('default')->value() : '')
                . '</button>',
        );
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
                sprintf('The [%s] attribute of vf-button must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-button must be a string.', $name));
    }

    private function boolProp(ComponentRenderContext $context, string $name): bool
    {
        $value = $context->prop($name);

        return $value !== null && $value !== false && $value !== 'false';
    }
}
