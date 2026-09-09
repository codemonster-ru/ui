<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\CheckableState;
use Codemonster\VueForge\Razor\Support\Html;

/**
 * Server-rendered VfSwitch.
 *
 * The same native checkbox VfCheckbox renders, with `role="switch"` and - just
 * as deliberately - *without* `aria-checked`. The reference sets aria-checked on
 * the checkbox and not on the switch, and both are reproduced rather than
 * reconciled: imposing WAI-ARIA switch conventions here would change product
 * behaviour that nobody asked to change.
 *
 * Two presentation props the other two controls have no equivalent for: `static`
 * and `thumb-contrast`. The thumb slot is rendered inside the control, matching
 * Vue, though a Razor slot has no scope to receive the checked state through -
 * a caller that needs it already knows the value it passed in.
 *
 * No controller: a native checkbox handles pointer, Space, focus and disabled.
 */
final class SwitchComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the input. */
    private const COMPONENT_PROPS = [
        'checked',
        'size',
        'static',
        'thumb-contrast',
        'invalid',
        'disabled',
        'label',
        'class',
        'style',
    ];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $checked = $this->boolProp($context, 'checked');
        $isStatic = $this->boolProp($context, 'static');
        $thumbContrast = $this->stringProp($context, 'thumb-contrast') ?? 'auto';
        $invalid = $this->boolProp($context, 'invalid');
        $disabled = $this->boolProp($context, 'disabled');
        $size = $this->stringProp($context, 'size') ?? 'md';
        $label = $this->stringProp($context, 'label');

        $inputAttributes = $this->forwardedAttributes($context);
        $inputAttributes['class'] = 'vf-switch__input';
        $inputAttributes['type'] = 'checkbox';
        $inputAttributes['role'] = 'switch';
        $inputAttributes['checked'] = $checked;
        $inputAttributes['disabled'] = $disabled;

        if (!array_key_exists('aria-invalid', $inputAttributes)) {
            $inputAttributes['aria-invalid'] = $invalid ? 'true' : null;
        }

        $rootAttributes = [
            'class' => Html::classes([
                Html::classes(CheckableState::resolveSwitchClasses(
                    $size,
                    $isStatic,
                    $thumbContrast,
                    $checked,
                    $invalid,
                    $disabled,
                )),
                $this->stringProp($context, 'class') ?? '',
            ]),
            'style' => $this->stringProp($context, 'style'),
        ];

        $thumb = $context->hasSlot('thumb') ? $context->slot('thumb')->value() : '';
        $slot = $context->hasSlot('default') ? $context->slot('default')->value() : '';
        // Vue walks the slot's VNodes and treats whitespace-only content as
        // nothing. The nearest honest equivalent on rendered markup is to trim.
        $content = trim($slot) !== '' ? $slot : ($label !== null && $label !== '' ? Html::escape($label) : '');

        return RenderedHtml::fromTrustedString(
            '<label' . Html::attributes($rootAttributes) . '>'
                . '<input' . Html::attributes($inputAttributes) . '>'
                . '<span class="vf-switch__control" aria-hidden="true">'
                . '<span class="vf-switch__thumb">' . $thumb . '</span>'
                . '</span>'
                . ($content === '' ? '' : '<span class="vf-switch__content">' . $content . '</span>')
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
                sprintf('The [%s] attribute of vf-switch must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-switch must be a string.', $name));
    }

    private function boolProp(ComponentRenderContext $context, string $name): bool
    {
        $value = $context->prop($name);

        return $value !== null && $value !== false && $value !== 'false';
    }
}
