<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\IconRenderer;
use Codemonster\VueForge\Razor\Support\InputState;

/**
 * Server-rendered VfInput.
 *
 * Renders the same `vf-input` / `vf-input-wrap` markup the Vue adapter renders,
 * so the canonical stylesheet in packages/styles applies unchanged. The output
 * is a real native input: it works, submits and stays accessible before any
 * JavaScript runs.
 *
 * Two deliberate differences from the Vue adapter, both recorded rather than
 * hidden:
 *
 * 1. When an action is requested the wrapper is always rendered, even while the
 *    action itself is still inert. The controller then never has to restructure
 *    the DOM, which is also why this adapter does not reproduce the Vue
 *    behaviour where clearing the only adornment replaces the input element and
 *    drops focus. That is a Vue rendering artifact, not a platform contract.
 * 2. Action controls are rendered hidden and disabled until the controller
 *    enables them, and the action-derived modifier classes are withheld until
 *    then. Without JavaScript there is therefore no visible control that does
 *    nothing, and no space reserved for one.
 */
final class InputComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the input element. */
    private const COMPONENT_PROPS = [
        'value',
        'size',
        'invalid',
        'leading-icon',
        'trailing-icon',
        'clearable',
        'password-reveal',
        'clear-label',
        'show-password-label',
        'hide-password-label',
        'class',
        'style',
    ];

    private const ADORNMENT_ICON_SIZE = 'var(--vf-field-icon-size)';
    private const ACTION_ICON_SIZE = 'var(--vf-icon-size-sm)';

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $value = $this->stringProp($context, 'value') ?? '';
        $size = $this->stringProp($context, 'size') ?? 'md';
        $invalid = $this->boolProp($context, 'invalid');
        $clearable = $this->boolProp($context, 'clearable');
        $passwordReveal = $this->boolProp($context, 'password-reveal');
        $leadingIcon = $this->stringProp($context, 'leading-icon');
        $trailingIcon = $this->stringProp($context, 'trailing-icon');

        $forwarded = $this->forwardedAttributes($context);
        $type = isset($forwarded['type']) && is_string($forwarded['type']) ? $forwarded['type'] : null;
        $disabled = ($forwarded['disabled'] ?? false) !== false;
        $readonly = ($forwarded['readonly'] ?? false) !== false;

        $filled = InputState::isFilled($value);
        $passwordRevealAvailable = InputState::isPasswordRevealAvailable($passwordReveal, $type);
        $clearAvailable = InputState::isClearActionAvailable($clearable, $filled, $disabled, $readonly);

        $hasLeadingSlot = $context->hasSlot('leading');
        $hasTrailingSlot = $context->hasSlot('trailing');
        $hasLeadingAdornment = $leadingIcon !== null || $hasLeadingSlot;
        $hasTrailingAdornment = $trailingIcon !== null || $hasTrailingSlot;

        // Initial markup describes what works without JavaScript, so the action
        // flags are false here. The controller recomputes with them enabled.
        $initial = InputState::resolveAdornmentState($hasLeadingAdornment, $hasTrailingAdornment, false, false);
        $needsActions = $passwordRevealAvailable || $clearable;
        $renderWrapper = $initial['hasAdornments'] || $needsActions;

        $inputAttributes = $forwarded;
        $inputAttributes['type'] = InputState::resolveType($type, $passwordRevealAvailable, false);
        $inputAttributes['value'] = $value;
        $inputAttributes['data-vf-filled'] = $filled ? 'true' : null;
        // A consumer-supplied aria-invalid wins over the computed one, matching
        // the historical Vue behaviour where forwarded attrs are bound after it.
        if (!array_key_exists('aria-invalid', $forwarded)) {
            $inputAttributes['aria-invalid'] = $invalid ? 'true' : null;
        }
        $inputAttributes['class'] = $this->inputClasses($size, $invalid, $initial, $renderWrapper ? null : $context);
        $inputAttributes['data-vf-razor-input'] = 'control';

        if (!$renderWrapper) {
            $inputAttributes['style'] = $this->stringProp($context, 'style');
            $inputAttributes['data-vf-razor'] = 'input';

            return RenderedHtml::fromTrustedString('<input' . Html::attributes($inputAttributes) . '>');
        }

        $markup = '<div' . Html::attributes([
            'class' => $this->wrapperClasses($size, $invalid, $initial, $context),
            'style' => $this->stringProp($context, 'style'),
            'data-vf-razor' => 'input',
        ]) . '>';

        if ($initial['hasLeadingAdornment']) {
            $markup .= '<span class="vf-input-wrap__icon vf-input-wrap__icon--leading" aria-hidden="true">'
                . ($hasLeadingSlot
                    ? $context->slot('leading')->value()
                    : IconRenderer::render((string) $leadingIcon, self::ADORNMENT_ICON_SIZE))
                . '</span>';
        }

        $markup .= '<input' . Html::attributes($inputAttributes) . '>';

        if ($initial['hasTrailingAdornment']) {
            $markup .= '<span' . Html::attributes([
                'class' => 'vf-input-wrap__icon vf-input-wrap__icon--trailing',
                'aria-hidden' => 'true',
            ]) . '>'
                . ($hasTrailingSlot
                    ? $context->slot('trailing')->value()
                    : IconRenderer::render((string) $trailingIcon, self::ADORNMENT_ICON_SIZE))
                . '</span>';
        }

        if ($passwordRevealAvailable) {
            $markup .= $this->actionButton(
                'vf-input-wrap__password-toggle',
                'password-reveal',
                $this->stringProp($context, 'show-password-label') ?? 'Show password',
                'eye',
                ['aria-pressed' => 'false'],
            );
        }

        if ($clearable) {
            $markup .= $this->actionButton(
                'vf-input-wrap__clear',
                'clear',
                $this->stringProp($context, 'clear-label') ?? 'Clear input',
                'xmark',
                [],
            );
        }

        return RenderedHtml::fromTrustedString($markup . '</div>');
    }

    /**
     * An action control that is inert until the controller enables it.
     *
     * `hidden` plus `disabled` means a no-JS page shows no control that cannot
     * work, and a keyboard user cannot reach one either.
     *
     * @param array<string, string> $extra
     */
    private function actionButton(string $class, string $action, string $label, string $icon, array $extra): string
    {
        $attributes = array_merge([
            'class' => Html::classes(['vf-icon-button', 'vf-icon-button--ghost', 'vf-icon-button--sm', $class]),
            'type' => 'button',
            'aria-label' => $label,
            'data-vf-razor-input' => $action,
            // `hidden` alone is not enough: the canonical .vf-icon-button rule
            // sets display, and a class selector outranks the user-agent
            // [hidden] rule. The inline declaration is adapter-local plumbing,
            // not a copy of a canonical rule; the controller clears it.
            'hidden' => true,
            'style' => 'display:none',
            'disabled' => true,
        ], $extra);

        return '<button' . Html::attributes($attributes) . '>'
            . IconRenderer::render($icon, self::ACTION_ICON_SIZE, ariaHidden: true)
            . '</button>';
    }

    /** @param array<string, bool> $state */
    private function inputClasses(
        string $size,
        bool $invalid,
        array $state,
        ?ComponentRenderContext $consumerClassContext,
    ): string {
        return Html::classes([
            'vf-input',
            $size !== 'md' ? 'vf-input--' . $size : null,
            $invalid ? 'vf-input--invalid' : null,
            $state['hasLeadingAdornment'] ? 'vf-input--with-leading' : null,
            $state['hasTrailingControl'] ? 'vf-input--with-trailing' : null,
            $consumerClassContext !== null ? $this->stringProp($consumerClassContext, 'class') : null,
        ]);
    }

    /** @param array<string, bool> $state */
    private function wrapperClasses(string $size, bool $invalid, array $state, ComponentRenderContext $context): string
    {
        return Html::classes([
            'vf-input-wrap',
            $size !== 'md' ? 'vf-input-wrap--' . $size : null,
            $invalid ? 'vf-input-wrap--invalid' : null,
            $state['hasLeadingAdornment'] ? 'vf-input-wrap--with-leading' : null,
            $state['hasTrailingControl'] ? 'vf-input-wrap--with-trailing' : null,
            $this->stringProp($context, 'class'),
        ]);
    }

    /**
     * Props that are not component props fall through to the input element,
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
                sprintf('The [%s] attribute of vf-input must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-input must be a string.', $name));
    }

    private function boolProp(ComponentRenderContext $context, string $name): bool
    {
        $value = $context->prop($name, false);

        return $value !== false && $value !== null && $value !== '' && $value !== 'false';
    }
}
