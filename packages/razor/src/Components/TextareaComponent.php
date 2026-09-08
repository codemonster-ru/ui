<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\FieldContext;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\InputState;
use Codemonster\VueForge\Razor\Support\TextareaState;

/**
 * Server-rendered VfTextarea.
 *
 * Renders the same `vf-textarea` markup the Vue adapter renders, so the
 * canonical stylesheet in packages/styles applies unchanged.
 *
 * The value goes in the element's text, which is where HTML puts a textarea's
 * initial value and the only place it survives without JavaScript. Vue's client
 * render writes a `value` *attribute* instead - an attribute HTML does not
 * define for this element - and sets the property alongside it. Both end up
 * showing the user the same string; the representations differ, and
 * contracts/textarea/parity-policy.json records that rather than hiding it.
 *
 * Escaping matters more here than anywhere else in the adapter, because the
 * value is content rather than an attribute: user text containing markup has to
 * stay text.
 */
final class TextareaComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the control. */
    private const COMPONENT_PROPS = ['value', 'size', 'invalid', 'class', 'style'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $value = $this->stringProp($context, 'value') ?? '';
        $size = $this->stringProp($context, 'size') ?? 'md';
        $invalid = $this->boolProp($context, 'invalid');

        // The field this control is rendering inside, if any. Same channel
        // vf-input uses: the id and relationships come down, the filled state
        // and floating support go back up.
        $field = FieldContext::current();
        $field?->consume();
        $field?->reportFloatingSupported(true);

        $filled = InputState::isFilled($value);
        $field?->reportFilled($filled);

        // Vue reads the placement rather than whether the field floated, and so
        // does this: the control carries the modifier either way.
        $floating = $field !== null && $field->labelPlacement === 'floating';
        $invalid = $invalid || ($field?->invalid ?? false);

        $attributes = $this->forwardedAttributes($context);

        if ($field !== null && !array_key_exists('id', $attributes)) {
            $attributes['id'] = $field->controlId;
        }
        if ($field !== null && !array_key_exists('aria-describedby', $attributes) && $field->describedBy !== null) {
            $attributes['aria-describedby'] = $field->describedBy;
        }

        // A consumer class is appended to the canonical classes, never a
        // replacement for them, which is what Vue does with an inherited class.
        $attributes['class'] = Html::classes([
            Html::classes(TextareaState::resolveClasses($size, $invalid, $floating)),
            $this->stringProp($context, 'class') ?? '',
        ]);
        $attributes['style'] = $this->stringProp($context, 'style');
        $attributes['data-vf-filled'] = $filled ? 'true' : null;

        // The reference lets a consumer aria-invalid win, because v-bind="attrs"
        // is applied after its own bindings on this component.
        if (!array_key_exists('aria-invalid', $attributes)) {
            $attributes['aria-invalid'] = $invalid ? 'true' : null;
        }

        $attributes['data-vf-razor'] = 'textarea';

        return RenderedHtml::fromTrustedString(
            '<textarea' . Html::attributes($attributes) . '>' . Html::escape($value) . '</textarea>',
        );
    }

    /**
     * Props that are not component props fall through to the control, which is
     * how rows, placeholder, disabled, readonly, aria-* and data-* reach it.
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
                sprintf('The [%s] attribute of vf-textarea must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-textarea must be a string.', $name));
    }

    private function boolProp(ComponentRenderContext $context, string $name): bool
    {
        $value = $context->prop($name);

        return $value !== null && $value !== false && $value !== 'false';
    }
}
