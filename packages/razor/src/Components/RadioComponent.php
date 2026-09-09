<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\CheckableState;
use Codemonster\VueForge\Razor\Support\Html;

/**
 * Server-rendered VfRadio.
 *
 * Renders the same `vf-radio` markup the Vue adapter renders. Deliberately not
 * built on the checkbox component: a radio owns no boolean. It carries a value
 * and is checked when the model equals it, which is why `model-value` and
 * `value` are separate props here and the comparison goes through the shared
 * strict rule rather than a local `==`.
 *
 * Grouping is entirely native. Radios sharing a `name` are mutually exclusive
 * because the browser makes them so, so this component ships no controller and
 * no group registry - the thing a "RadioGroup runtime" would have re-implemented
 * is already in the platform.
 */
final class RadioComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the input. */
    private const COMPONENT_PROPS = ['model-value', 'value', 'size', 'invalid', 'disabled', 'label', 'class', 'style'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $value = $context->prop('value');

        if ($value === null) {
            throw new \InvalidArgumentException('The [value] prop of vf-radio is required.');
        }

        $checked = CheckableState::isRadioChecked($context->prop('model-value'), $value);
        $invalid = $this->boolProp($context, 'invalid');
        $disabled = $this->boolProp($context, 'disabled');
        $size = $this->stringProp($context, 'size') ?? 'md';
        $label = $this->stringProp($context, 'label');

        $inputAttributes = $this->forwardedAttributes($context);
        $inputAttributes['class'] = 'vf-radio__input';
        $inputAttributes['type'] = 'radio';
        $inputAttributes['checked'] = $checked;
        $inputAttributes['disabled'] = $disabled;
        $inputAttributes['value'] = is_bool($value) ? ($value ? 'true' : 'false') : (string) $value;

        if (!array_key_exists('aria-invalid', $inputAttributes)) {
            $inputAttributes['aria-invalid'] = $invalid ? 'true' : null;
        }

        $rootAttributes = [
            'class' => Html::classes([
                Html::classes(CheckableState::resolveRadioClasses($size, $checked, $invalid, $disabled)),
                $this->stringProp($context, 'class') ?? '',
            ]),
            'style' => $this->stringProp($context, 'style'),
        ];

        $slot = $context->hasSlot('default') ? $context->slot('default')->value() : '';
        $content = $slot !== '' ? $slot : ($label !== null && $label !== '' ? Html::escape($label) : '');

        return RenderedHtml::fromTrustedString(
            '<label' . Html::attributes($rootAttributes) . '>'
                . '<input' . Html::attributes($inputAttributes) . '>'
                . '<span class="vf-radio__control" aria-hidden="true"><span class="vf-radio__dot"></span></span>'
                . ($content === '' ? '' : '<span class="vf-radio__content">' . $content . '</span>')
                . '</label>',
        );
    }

    /** @return array<string, string|bool|int|float|null> */
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
                sprintf('The [%s] attribute of vf-radio must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-radio must be a string.', $name));
    }

    private function boolProp(ComponentRenderContext $context, string $name): bool
    {
        $value = $context->prop($name);

        return $value !== null && $value !== false && $value !== 'false';
    }
}
