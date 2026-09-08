<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\FieldContext;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\Support\FieldState;
use Codemonster\VueForge\Razor\Support\Html;

/**
 * Server-rendered VfField.
 *
 * Renders the same `vf-field` markup the Vue adapter renders, so the canonical
 * stylesheet in packages/styles applies unchanged, and it renders it complete:
 * the label, its association with the control, the description, the error and
 * the required marker all exist before any JavaScript runs.
 *
 * The control is rendered first, into a string, and the wrapper composed around
 * it afterwards. That ordering is what lets a field know whether its control is
 * filled and whether it can float - the two signals Vue receives through
 * provide/inject - without asking the caller to repeat them.
 *
 * One deliberate difference from Vue, recorded rather than hidden. Vue hands
 * the control id and aria-describedby to the default slot and lets the consumer
 * bind them, because a Vue slot has a scope. A Razor slot does not, so vf-input
 * picks them up from the field context instead. An explicit `id` or
 * `aria-describedby` written on the control still wins, which keeps the
 * consumer's final say that the Vue API has. The rendered DOM is the same.
 *
 * Floating and filled are emitted here as static classes because the server
 * knows both. Vue cannot emit them server-side at all - its control opts in
 * while the field is already rendering, so SSR always serialises a plain field
 * and the client corrects it. Parity compares browser-observable DOM, which is
 * the corrected state, so emitting them is what matches.
 */
final class FieldComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the root. */
    private const COMPONENT_PROPS = [
        'label',
        'description',
        'error',
        'invalid',
        'required',
        'label-placement',
        'floating-variant',
        'control-id',
        'class',
        'style',
    ];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $label = $this->stringProp($context, 'label');
        $description = $this->stringProp($context, 'description');
        $error = $this->stringProp($context, 'error');
        $labelPlacement = $this->stringProp($context, 'label-placement') ?? 'top';
        $floatingVariant = $this->stringProp($context, 'floating-variant') ?? 'in';
        $required = $this->boolProp($context, 'required');

        // A slot wins over the prop, matching Vue where the prop is only the
        // slot's fallback content.
        $labelSlot = $context->hasSlot('label') ? $context->slot('label')->value() : null;
        $descriptionSlot = $context->hasSlot('description') ? $context->slot('description')->value() : null;
        $errorSlot = $context->hasSlot('error') ? $context->slot('error')->value() : null;

        $hasLabel = $labelSlot !== null || ($label !== null && $label !== '');
        $hasDescription = $descriptionSlot !== null || ($description !== null && $description !== '');
        $hasError = $errorSlot !== null || ($error !== null && $error !== '');

        $invalid = FieldState::isInvalid($this->boolProp($context, 'invalid'), $hasError);

        $controlId = $this->stringProp($context, 'control-id') ?? FieldIds::next('vf-field-control');
        $descriptionId = FieldIds::next('vf-field-description');
        $errorId = FieldIds::next('vf-field-error');
        $describedBy = FieldState::resolveDescribedBy($descriptionId, $errorId, $hasDescription, $hasError);

        // The control renders first: its own state decides two of the classes
        // below, and it cannot be asked for them afterwards.
        $fieldContext = new FieldContext($controlId, $describedBy, $invalid, $required, $labelPlacement);
        $control = $fieldContext->renderControl(
            static fn (): string => $context->hasSlot('default') ? $context->slot('default')->value() : '',
        );

        $floating = FieldState::isFloatingLabel($labelPlacement, $hasLabel, $fieldContext->supportsFloating());
        $rootClasses = FieldState::resolveClasses($invalid, $floating, $floatingVariant);
        $controlClasses = FieldState::resolveControlClasses($floating, $fieldContext->isFilled());

        $labelMarkup = $hasLabel
            ? $this->renderLabel($controlId, $labelSlot ?? Html::escape((string) $label), $floating, $required)
            : '';

        $rootAttributes = $this->forwardedAttributes($context);
        $rootAttributes['class'] = Html::classes([
            Html::classes($rootClasses),
            $this->stringProp($context, 'class') ?? '',
        ]);
        $rootAttributes['style'] = $this->stringProp($context, 'style');
        // The marker the browser enhancement mounts on. Only a field that can
        // actually change - one whose control reports a filled state - is worth
        // enhancing; anything else is complete as rendered.
        $rootAttributes['data-vf-razor'] = $fieldContext->isConsumed() ? 'field' : null;

        $markup = '<div' . Html::attributes($rootAttributes) . '>'
            . ($floating ? '' : $labelMarkup)
            . '<div class="' . Html::escape(Html::classes($controlClasses)) . '">'
            . $control
            . ($floating ? $labelMarkup : '')
            . '</div>';

        if ($hasDescription) {
            $markup .= '<p id="' . Html::escape($descriptionId) . '" class="vf-field__description">'
                . ($descriptionSlot ?? Html::escape((string) $description)) . '</p>';
        }

        if ($hasError) {
            $markup .= '<p id="' . Html::escape($errorId) . '" class="vf-field__error">'
                . ($errorSlot ?? Html::escape((string) $error)) . '</p>';
        }

        return RenderedHtml::fromTrustedString($markup . '</div>');
    }

    /**
     * The label, with the required marker Vue renders inside it.
     *
     * The marker is aria-hidden and lives inside the label, so a field that
     * asked to be required but has no label carries no marker at all. That is
     * the reference behaviour, and it is why this is not rendered separately.
     */
    private function renderLabel(string $controlId, string $content, bool $floating, bool $required): string
    {
        $classes = ['vf-field__label'];

        if ($floating) {
            $classes[] = 'vf-field__label--floating';
        }

        return '<label for="' . Html::escape($controlId) . '" class="' . Html::escape(Html::classes($classes)) . '">'
            . $content
            . ($required ? '<span class="vf-field__required-mark" aria-hidden="true">*</span>' : '')
            . '</label>';
    }

    /**
     * Props that are not component props fall through to the root element.
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
                sprintf('The [%s] attribute of vf-field must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-field must be a string.', $name));
    }

    private function boolProp(ComponentRenderContext $context, string $name): bool
    {
        $value = $context->prop($name);

        return $value !== null && $value !== false && $value !== 'false';
    }
}
