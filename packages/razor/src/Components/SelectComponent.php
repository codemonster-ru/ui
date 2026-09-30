<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\FieldContext;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\IconButton;
use Codemonster\VueForge\Razor\Support\IconRenderer;
use Codemonster\VueForge\Razor\Support\SelectState;

/**
 * Server-rendered VfSelect.
 *
 * A custom listbox, not a native <select>, because the reference is one. Three
 * layers, reported separately because they are separate:
 *
 *   1. The server output. The reference's closed select, in the state the
 *      props resolve to: the `vf-select-wrap` wrapper, the hidden input for a
 *      string `name` carrying the model value and `disabled`, the <button>
 *      trigger with its generated (or consumer, or field) id, `aria-controls`
 *      naming the listbox id, `aria-expanded="false"`,
 *      `aria-haspopup="listbox"`, `data-vf-filled` for a non-empty value,
 *      `aria-invalid`, the leading and trailing adornments, the displayed
 *      label, and either the chevron or the clear button. The listbox does
 *      not exist - as under the reference's `v-if` - so `aria-controls`
 *      dangles, exactly as the reference's does. The options wait in an inert
 *      `<template data-vf-razor-select="listbox">`, each carrying its value as
 *      adapter metadata; the chevron and the clear button a clearable select
 *      swaps between wait in two more templates.
 *   2. Without JavaScript. The state is truthful: the select shows its value,
 *      the hidden input submits it, and nothing opens, clears or changes it.
 *      There is no `<details>` listbox or native <select> the reference never
 *      had, and no opened listbox or focus the server cannot mean.
 *   3. Enhanced. packages/razor/browser/select.ts finds this root by its
 *      `data-vf-razor="select"` marker and reproduces the reference's
 *      trigger and listbox keyboards, pointer, the two Escape paths on the
 *      page's shared stack, the `click` outside close, focus, floater.js
 *      positioning, the scroll into view, the transition, the hidden input
 *      and the field report.
 *
 * Reproduced rather than corrected: only aria-*, data-*, title and tabindex
 * reach the trigger, and a forwarded one overrides the component's own;
 * `required`, `autofocus`, `form`, `role` and anything else are dropped; an
 * option with value '' is selected but not filled; a model no option has is
 * filled but unselected; the first duplicate wins the label; `--placeholder`
 * is written under a floating label that suppresses the placeholder text; the
 * clear button replaces the chevron.
 *
 * Inside a vf-field the select does what the reference's consumer does with
 * the slot scope - takes the field's control id and described-by unless it
 * was given its own, and the field's invalid - and reports what the
 * reference reports through provide/inject: floating support, and filled as
 * `value || open`, which on the server is the value alone.
 *
 * Differences of spelling, not behaviour. There is no controlled mode: a
 * server-rendered select has no parent to emit a request to, so `model-value`
 * is read as the initial value and the enhancement applies a selection or a
 * clear itself, dispatching `vf-select:value-change` for every
 * update:modelValue the reference emits. The options are static. A null
 * attribute is "not given" by this adapter's convention, so the reference's
 * `teleportTo: null` is spelled `teleport-to="false"`, and there is no element
 * to teleport to - only a selector.
 */
final class SelectComponent implements ComponentInterface
{
    /** Props consumed by the component; aria-*, data-*, title and tabindex reach the trigger, the rest is dropped. */
    private const COMPONENT_PROPS = [
        'options',
        'model-value',
        'modelValue',
        'size',
        'invalid',
        'leading-icon',
        'leadingIcon',
        'trailing-icon',
        'trailingIcon',
        'clearable',
        'placeholder',
        'disabled',
        'placement',
        'teleport-to',
        'teleportTo',
        'disable-teleport',
        'disableTeleport',
        'id',
        'name',
        'class',
        'style',
    ];

    private const ICON_SIZE = 'var(--vf-field-icon-size)';

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $options = $this->options($context);
        $modelValue = $this->stringProp($context, 'model-value') ?? $this->stringProp($context, 'modelValue') ?? '';
        $size = $this->stringProp($context, 'size') ?? 'md';
        $disabled = $this->booleanProp($context, 'disabled');
        $clearable = $this->booleanProp($context, 'clearable');
        $placeholder = $this->stringProp($context, 'placeholder');
        $placement = $this->stringProp($context, 'placement') ?? 'bottom-start';
        $leadingIcon = $this->stringProp($context, 'leading-icon') ?? $this->stringProp($context, 'leadingIcon');
        $trailingIcon = $this->stringProp($context, 'trailing-icon') ?? $this->stringProp($context, 'trailingIcon');
        $teleport = SelectState::resolveTeleport(
            $this->teleportProp($context),
            $this->booleanProp($context, 'disable-teleport') || $this->booleanProp($context, 'disableTeleport'),
        );

        // The field this select renders inside, if any. See the class docblock.
        $field = FieldContext::current();
        $field?->consume();
        $field?->reportFloatingSupported(true);
        $floating = $field !== null && $field->labelPlacement === 'floating';
        $invalid = $this->booleanProp($context, 'invalid') || ($field?->invalid ?? false);

        $hasValue = SelectState::resolveHasValue($modelValue);
        $field?->reportFilled(SelectState::resolveFieldFilled($hasValue, false));
        $selected = SelectState::resolveSelectedOption($options, $modelValue);
        $hasClear = SelectState::resolveHasClearControl($clearable, $hasValue, $disabled);
        $hasLeading = $leadingIcon !== null && $leadingIcon !== '' || $context->hasSlot('leading');
        $hasTrailing = $trailingIcon !== null && $trailingIcon !== '' || $context->hasSlot('trailing');
        $classState = [
            'size' => $size,
            'hasLeading' => $hasLeading,
            'hasTrailing' => $hasTrailing,
            'hasClear' => $hasClear,
            'floating' => $floating,
        ];

        // The trigger id first, as the reference's two useId calls run.
        $generatedTriggerId = FieldIds::next('vf-select-trigger');
        $listboxId = FieldIds::next('vf-select-listbox');
        $consumerId = $context->prop('id');
        $triggerId = is_string($consumerId) ? $consumerId : ($field?->controlId ?? $generatedTriggerId);

        $wrapper = [
            'class' => Html::classes([
                ...SelectState::resolveWrapperClasses($classState),
                $this->stringProp($context, 'class') ?? '',
            ]),
            'style' => $this->stringProp($context, 'style'),
            // The ownership marker the browser controller mounts on, and the
            // configuration it runs with. Adapter metadata, not product: the
            // parity extractor drops every data-vf-razor attribute by its
            // prefix.
            'data-vf-razor' => 'select',
            'data-vf-razor-select-value' => $modelValue,
            'data-vf-razor-select-placement' => $placement,
            'data-vf-razor-select-teleport' => $teleport['disabled'] ? 'false' : $teleport['target'],
            'data-vf-razor-select-placeholder' => $placeholder,
            'data-vf-razor-select-floating' => $floating ? 'true' : 'false',
            'data-vf-razor-select-clearable' => $clearable ? 'true' : 'false',
        ];

        $markup = '<div' . Html::attributes($wrapper) . '>';

        $name = $context->prop('name');
        if (SelectState::resolveRendersHiddenInput($name)) {
            $markup .= '<input' . Html::attributes([
                'type' => 'hidden',
                'name' => $name,
                'value' => $modelValue,
                'disabled' => $disabled,
            ]) . '>';
        }

        $trigger = [
            'id' => $triggerId,
            'type' => 'button',
            'class' => Html::classes(SelectState::resolveTriggerClasses($classState + [
                'invalid' => $invalid,
                'open' => false,
                'hasSelection' => $selected !== null,
                'placeholder' => $placeholder,
            ])),
            'data-vf-filled' => $hasValue ? 'true' : null,
            'aria-controls' => $listboxId,
            'aria-expanded' => 'false',
            'aria-haspopup' => 'listbox',
            'aria-invalid' => $invalid ? 'true' : null,
            'disabled' => $disabled,
        ];

        if ($field !== null && $field->describedBy !== null) {
            $trigger['aria-describedby'] = $field->describedBy;
        }

        // Bound after the component's own, as the reference's v-bind is: a
        // forwarded aria-expanded or data-vf-filled overrides the computed one.
        foreach ($this->forwardedAttributes($context) as $attribute => $value) {
            $trigger[$attribute] = $value;
        }
        $trigger['data-vf-razor-select'] = 'trigger';
        // The trigger is the field's control: the field controller follows
        // what the select reports, never the hidden input. See
        // packages/razor/browser/field.ts.
        if ($field !== null) {
            $trigger['data-vf-razor-field-control'] = '';
        }

        $markup .= '<button' . Html::attributes($trigger) . '>';

        if ($hasLeading) {
            $markup .= '<span class="vf-select__icon vf-select__icon--leading" aria-hidden="true">'
                . ($context->hasSlot('leading')
                    ? $context->slot('leading')->value()
                    : IconRenderer::render((string) $leadingIcon, self::ICON_SIZE))
                . '</span>';
        }

        $markup .= '<span class="vf-select__value">'
            . Html::escape(SelectState::resolveDisplayLabel($selected['label'] ?? null, $floating, $placeholder))
            . '</span>';

        if ($hasTrailing) {
            $markup .= '<span class="vf-select__icon vf-select__icon--trailing" aria-hidden="true">'
                . ($context->hasSlot('trailing')
                    ? $context->slot('trailing')->value()
                    : IconRenderer::render((string) $trailingIcon, self::ICON_SIZE))
                . '</span>';
        }

        $chevron = '<span class="vf-select__icon vf-select__icon--chevron" aria-hidden="true">'
            . IconRenderer::render('chevron-down', self::ICON_SIZE)
            . '</span>';
        $clear = IconButton::render('xmark', 'ghost', 'sm', attributes: [
            'class' => 'vf-select-wrap__clear',
            'aria-label' => 'Clear select',
        ]);

        $markup .= ($hasClear ? '' : $chevron) . '</button>' . ($hasClear ? $clear : '');

        // The options, inert until an open creates the listbox from them. The
        // selected state is written for the value the server knows; the
        // controller rewrites it for the value it holds when it opens.
        $markup .= '<template data-vf-razor-select="listbox">';
        foreach ($options as $option) {
            $isSelected = $option['value'] === $modelValue;
            $markup .= '<button' . Html::attributes([
                'type' => 'button',
                'class' => Html::classes([
                    'vf-dropdown__item',
                    'vf-select__option',
                    $isSelected ? 'vf-select__option--selected' : null,
                ]),
                'role' => 'option',
                'aria-selected' => $isSelected ? 'true' : 'false',
                'disabled' => $option['disabled'] ?? false,
                'tabindex' => '-1',
                'data-vf-razor-select-value' => $option['value'],
            ]) . '>' . Html::escape($option['label']) . '</button>';
        }
        $markup .= '</template>';

        // What a clearable select swaps when its value empties or fills. Only
        // an enabled clearable select can swap; the others never need these.
        if ($clearable && !$disabled) {
            $markup .= '<template data-vf-razor-select="chevron">' . $chevron . '</template>'
                . '<template data-vf-razor-select="clear">' . $clear . '</template>';
        }

        return RenderedHtml::fromTrustedString($markup . '</div>');
    }

    /**
     * The options, validated into the shape the shared rules read.
     *
     * @return list<array{value: string, label: string, disabled?: bool}>
     */
    private function options(ComponentRenderContext $context): array
    {
        $options = $context->prop('options') ?? [];

        if (!is_array($options) || !array_is_list($options)) {
            throw new \InvalidArgumentException('The [options] prop of vf-select must be a list of options.');
        }

        $normalized = [];

        foreach ($options as $index => $option) {
            if (
                !is_array($option)
                || !is_string($option['value'] ?? null)
                || !is_string($option['label'] ?? null)
                || (array_key_exists('disabled', $option) && !is_bool($option['disabled']))
            ) {
                throw new \InvalidArgumentException(sprintf(
                    'Option [%d] of vf-select must have a string value, a string label and an optional boolean disabled.',
                    $index,
                ));
            }

            $entry = ['value' => $option['value'], 'label' => $option['label']];
            if (($option['disabled'] ?? false) === true) {
                $entry['disabled'] = true;
            }
            $normalized[] = $entry;
        }

        return $normalized;
    }

    /**
     * The consumer attributes that reach the trigger: aria-*, data-*, title and
     * tabindex, as the reference filters its attrs. Everything else that is
     * not a component prop - required, autofocus, form, role - reaches no
     * element, as in the reference.
     *
     * @return array<string, string|bool|int|float|null>
     */
    private function forwardedAttributes(ComponentRenderContext $context): array
    {
        $forwarded = [];

        foreach ($context->props() as $name => $value) {
            if (in_array($name, self::COMPONENT_PROPS, true) || !SelectState::resolveForwardsAttribute($name)) {
                continue;
            }

            if (str_starts_with($name, 'data-vf-razor')) {
                throw new \InvalidArgumentException(
                    sprintf('The [%s] attribute is reserved for the vf-select adapter.', $name),
                );
            }

            if ($value === null || is_bool($value) || is_string($value) || is_int($value) || is_float($value)) {
                $forwarded[$name] = $value;
                continue;
            }

            throw new \InvalidArgumentException(
                sprintf('The [%s] attribute of vf-select must be a scalar or null.', $name),
            );
        }

        return $forwarded;
    }

    /** `teleport-to`: a selector string, `false` for in place, or null for body. */
    private function teleportProp(ComponentRenderContext $context): string|false|null
    {
        $value = $context->prop('teleport-to') ?? $context->prop('teleportTo');

        if ($value === null || is_string($value) && $value !== 'false') {
            return $value;
        }

        if ($value === false || $value === 'false') {
            return false;
        }

        throw new \InvalidArgumentException('The [teleport-to] prop of vf-select must be a selector string or false.');
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-select must be a boolean.', $name));
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-select must be a string.', $name));
    }
}
