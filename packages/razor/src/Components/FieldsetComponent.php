<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\Support\FieldsetState;
use Codemonster\VueForge\Razor\Support\Html;

/**
 * Server-rendered VfFieldset.
 *
 * Renders the same `vf-fieldset` markup the Vue adapter renders: a native
 * fieldset, an optional legend, the control wrapper, then the optional
 * description and error paragraphs the fieldset's own aria-describedby names.
 * No browser controller: the fieldset owns no interaction, and whatever a
 * consumer puts in it is the consumer's.
 *
 * Historical decisions reproduced rather than corrected:
 *
 *   - every attribute that is not one of the four props falls through to the
 *     fieldset, after the component's own. A consumer class is appended to the
 *     canonical ones, and a consumer `aria-describedby` *replaces* the one the
 *     fieldset computed, as Vue's attribute fallthrough does;
 *   - `disabled`, `form` and `name` are not props. They stay native fieldset
 *     attributes, so the browser disables every nested control. VfGroupBox,
 *     the other migrated fieldset, consumes `disabled`; this one must not;
 *   - the legend holds the label text alone - no span, no id - and the
 *     fieldset carries no aria-labelledby. The description and the error come
 *     after the control wrapper;
 *   - presence is JavaScript truthiness for a prop ("" is none, "0" is one)
 *     and presence for a slot. A slot is fallback content for its prop, so a
 *     slot that renders only whitespace shows the prop text instead - the
 *     nearest true statement about rendered markup to Vue's "the slot yielded
 *     no vnodes";
 *   - invalid is `invalid || hasError`, and only a class: no aria-invalid, and
 *     the error paragraph has no role and no live region;
 *   - both ids are allocated on every render, description first, whether or
 *     not their paragraph renders - the reference calls useId twice in setup.
 *
 * One honest absence. The Vue default slot is scoped with `describedBy` and
 * `invalid` so a consumer can bind them to the controls inside. A Razor slot
 * is a pre-rendered closure with no scope, and this component does not
 * pretend otherwise: there is no counterpart, and nothing here writes those
 * values onto consumer markup. The fieldset's own aria-describedby - the part
 * the component itself renders - is complete.
 */
final class FieldsetComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the fieldset. */
    private const COMPONENT_PROPS = ['label', 'description', 'error', 'invalid', 'class', 'style'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $label = $this->stringProp($context, 'label');
        $description = $this->stringProp($context, 'description');
        $error = $this->stringProp($context, 'error');

        $presence = FieldsetState::resolvePresence(
            $label,
            $description,
            $error,
            $context->hasSlot('label'),
            $context->hasSlot('description'),
            $context->hasSlot('error'),
        );
        $invalid = FieldsetState::isInvalid($this->booleanProp($context, 'invalid'), $presence['error']);

        // Both, description first, whatever renders.
        $descriptionId = FieldIds::next('vf-fieldset-description');
        $errorId = FieldIds::next('vf-fieldset-error');

        $attributes = [
            'class' => Html::classes([
                Html::classes(FieldsetState::resolveClasses($invalid)),
                $this->stringProp($context, 'class') ?? '',
            ]),
            'aria-describedby' => FieldsetState::describedBy(
                $descriptionId,
                $errorId,
                $presence['description'],
                $presence['error'],
            ),
            // After the component's own, so a consumer aria-describedby wins.
            ...$this->forwardedAttributes($context),
        ];
        $attributes['style'] = $this->stringProp($context, 'style');

        $markup = '<fieldset' . Html::attributes($attributes) . '>';

        if ($presence['label']) {
            $markup .= '<legend class="vf-fieldset__legend">' . $this->part($context, 'label', $label) . '</legend>';
        }

        $markup .= '<div class="vf-fieldset__control">'
            . ($context->hasSlot('default') ? $context->slot('default')->value() : '')
            . '</div>';

        if ($presence['description']) {
            $markup .= '<p' . Html::attributes(['id' => $descriptionId, 'class' => 'vf-fieldset__description']) . '>'
                . $this->part($context, 'description', $description)
                . '</p>';
        }

        if ($presence['error']) {
            $markup .= '<p' . Html::attributes(['id' => $errorId, 'class' => 'vf-fieldset__error']) . '>'
                . $this->part($context, 'error', $error)
                . '</p>';
        }

        return RenderedHtml::fromTrustedString($markup . '</fieldset>');
    }

    /** A slot's markup, or the escaped prop text it falls back to when it renders nothing. */
    private function part(ComponentRenderContext $context, string $slot, ?string $fallback): string
    {
        $markup = $context->hasSlot($slot) ? $context->slot($slot)->value() : '';

        return trim($markup) !== '' ? $markup : Html::escape($fallback ?? '');
    }

    /**
     * Props that are not component props fall through to the fieldset.
     *
     * The path a consumer id, name, form, disabled, role, data-* or
     * aria-describedby travels - onto the fieldset, never the legend, the
     * control wrapper or the paragraphs.
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
                sprintf('The [%s] attribute of vf-fieldset must be a scalar or null.', $name),
            );
        }

        return $forwarded;
    }

    private function booleanProp(ComponentRenderContext $context, string $name): bool
    {
        $value = $context->prop($name);

        if ($value === null) {
            return false;
        }

        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            return !in_array($value, ['false', '0', ''], true);
        }

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-fieldset must be a boolean.', $name));
    }

    /**
     * A string prop, or null when absent. The empty string is kept: it is a
     * label the rule rejects, not an absent one, and the difference is the
     * rule's to make.
     */
    private function stringProp(ComponentRenderContext $context, string $name): ?string
    {
        $value = $context->prop($name);

        if ($value === null || $value === false) {
            return null;
        }

        if (is_string($value) || is_int($value) || is_float($value)) {
            return (string) $value;
        }

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-fieldset must be a string.', $name));
    }
}
