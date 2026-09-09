<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\CheckableState;
use Codemonster\VueForge\Razor\Support\Html;

/**
 * Server-rendered VfCheckbox.
 *
 * Renders the same `vf-checkbox` markup the Vue adapter renders, so the
 * canonical stylesheet in packages/styles applies unchanged. The root is a
 * label, so clicking anywhere in the control reaches the input natively - no
 * `for` attribute and no controller are needed for that.
 *
 * One thing does need the browser, and only one: `indeterminate` is a DOM
 * property with no HTML attribute, so a server-rendered checkbox cannot express
 * it in markup at all. The class and aria-checked are rendered here; the
 * property itself is set by browser/checkable.ts from the marker below. Without
 * JavaScript the control is a working checkbox that simply does not show the
 * mixed state, which is what the platform allows.
 *
 * The consumer's class and style go to the root label and everything else to
 * the input, matching the Vue component's attrs split.
 */
final class CheckboxComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the input. */
    private const COMPONENT_PROPS = [
        'checked',
        'size',
        'invalid',
        'disabled',
        'indeterminate',
        'label',
        'class',
        'style',
    ];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $checked = $this->boolProp($context, 'checked');
        $indeterminate = $this->boolProp($context, 'indeterminate');
        $invalid = $this->boolProp($context, 'invalid');
        $disabled = $this->boolProp($context, 'disabled');
        $size = $this->stringProp($context, 'size') ?? 'md';
        $label = $this->stringProp($context, 'label');

        $inputAttributes = $this->forwardedAttributes($context);
        $inputAttributes['class'] = 'vf-checkbox__input';
        $inputAttributes['type'] = 'checkbox';
        $inputAttributes['checked'] = $checked;
        $inputAttributes['disabled'] = $disabled;

        // The consumer wins over the component's own bindings, matching Vue,
        // where v-bind="inputAttrs" is written after them.
        if (!array_key_exists('aria-invalid', $inputAttributes)) {
            $inputAttributes['aria-invalid'] = $invalid ? 'true' : null;
        }
        if (!array_key_exists('aria-checked', $inputAttributes)) {
            $inputAttributes['aria-checked'] = CheckableState::resolveCheckboxAriaChecked($checked, $indeterminate);
        }

        // Only a checkbox that is actually indeterminate needs enhancing, so a
        // page of ordinary checkboxes carries no ownership markers at all.
        if ($indeterminate) {
            $inputAttributes['data-vf-razor'] = 'checkbox-indeterminate';
        }

        $rootAttributes = [
            'class' => Html::classes([
                Html::classes(CheckableState::resolveCheckboxClasses($size, $checked, $indeterminate, $invalid, $disabled)),
                $this->stringProp($context, 'class') ?? '',
            ]),
            'style' => $this->stringProp($context, 'style'),
        ];

        $mark = $indeterminate
            ? '<span class="vf-checkbox__indeterminate-mark"></span>'
            : '<span class="vf-checkbox__mark"></span>';

        $slot = $context->hasSlot('default') ? $context->slot('default')->value() : '';
        $content = $slot !== '' ? $slot : ($label !== null && $label !== '' ? Html::escape($label) : '');

        return RenderedHtml::fromTrustedString(
            '<label' . Html::attributes($rootAttributes) . '>'
                . '<input' . Html::attributes($inputAttributes) . '>'
                . '<span class="vf-checkbox__control" aria-hidden="true">' . $mark . '</span>'
                . ($content === '' ? '' : '<span class="vf-checkbox__content">' . $content . '</span>')
                . '</label>',
        );
    }

    /**
     * Props that are not component props fall through to the input, which is
     * how id, name, value, required, aria-* and data-* reach it.
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
                sprintf('The [%s] attribute of vf-checkbox must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-checkbox must be a string.', $name));
    }

    private function boolProp(ComponentRenderContext $context, string $name): bool
    {
        $value = $context->prop($name);

        return $value !== null && $value !== false && $value !== 'false';
    }
}
