<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\StepperState;

/**
 * Server-rendered VfStepper.
 *
 * The second migrated component that owns interactive controls, and the first
 * that owns several of the same kind: one native button per item, rendered,
 * wired and selected by this component. Three layers, reported separately
 * because they are separate:
 *
 *   1. The server output. The same `vf-stepper` markup the Vue adapter
 *      renders, in the state the props resolve to: the nav with its
 *      orientation and content-position modifiers, its accessible name and
 *      the two root custom properties; one `li.vf-stepper__item` per item
 *      carrying the item's state modifier; inside each, one
 *      `button.vf-stepper__trigger` of type=button with the item's value as
 *      `data-vf-stepper-value`, the native `disabled` attribute for a
 *      disabled item, `aria-current="step"` and the trigger's own modifier on
 *      the current one; the rail with its marker and connectors, the label,
 *      and the description only when there is one. Every item is in the DOM
 *      whatever the selection; nothing is deferred.
 *   2. Without JavaScript. The initial state is truthful and nothing lies:
 *      the current step is announced, the completed ones carry their
 *      modifier, a disabled trigger is inoperable. What is missing is the
 *      selection change - each trigger is a `type="button"` with no form
 *      action, and pressing it does nothing. This is documented rather than
 *      papered over with links or a form the reference never had.
 *   3. Enhanced. packages/razor/browser/stepper.ts finds this root by its
 *      `data-vf-razor="stepper"` marker, reads the items and the current step
 *      from the DOM it rendered, and reproduces the reference's click and
 *      Arrow/Home/End handling - leaving Enter and Space to the browser, as
 *      the reference does.
 *
 * Reproduced rather than corrected:
 *
 *   - `model-value` beats `default-value` whenever it is given, an empty
 *     string included: an empty string is a controlled value that matches no
 *     step. A null attribute is "nothing said" by this adapter's convention;
 *   - an unknown value is kept: no step is current, every enabled step is
 *     upcoming, and the progress factor is that of index 0;
 *   - a `default-value` naming a disabled item is kept as the active value:
 *     the steps before it are complete, it is disabled, nothing is current;
 *   - a content position from the other orientation's axis resolves to that
 *     orientation's default;
 *   - the progress factor is written the way JavaScript serialises the
 *     division: `0.3333333333333333`, never PHP's fourteen digits.
 *
 * There is no controlled mode. A server-rendered stepper has no parent to emit
 * a request to, so `model-value` is read as the initial value and the
 * enhancement selects on its own, dispatching `vf-stepper:change` with the
 * value so a host can observe what a Vue consumer observes through `change`.
 * Nor is there an items watch: the items are rendered once.
 */
final class StepperComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the nav. */
    private const COMPONENT_PROPS = [
        'items',
        'model-value',
        'modelValue',
        'default-value',
        'defaultValue',
        'orientation',
        'content-position',
        'contentPosition',
        'aria-label',
        'ariaLabel',
        'class',
        'style',
    ];

    private const ORIENTATIONS = ['horizontal', 'vertical'];
    private const CONTENT_POSITIONS = ['above', 'below', 'start', 'end'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $items = $this->items($context);
        $orientation = $this->stringProp($context, 'orientation') ?? 'horizontal';
        if (!in_array($orientation, self::ORIENTATIONS, true)) {
            throw new \InvalidArgumentException('The [orientation] prop of vf-stepper must be horizontal or vertical.');
        }
        $contentPosition = $this->stringProp($context, 'content-position') ?? $this->stringProp($context, 'contentPosition');
        if ($contentPosition !== null && !in_array($contentPosition, self::CONTENT_POSITIONS, true)) {
            throw new \InvalidArgumentException('The [content-position] prop of vf-stepper must be above, below, start or end.');
        }

        // The controlled value and the seed, each "nothing said" when null.
        // The seed is defaultValue ?? fallback, exactly what a mounted
        // component holds in its internal ref; the rule takes both.
        $modelValue = $this->stringProp($context, 'model-value') ?? $this->stringProp($context, 'modelValue');
        $defaultValue = $this->stringProp($context, 'default-value') ?? $this->stringProp($context, 'defaultValue');
        $internalValue = $defaultValue ?? StepperState::resolveFallbackValue($items);
        $activeValue = StepperState::resolveActiveValue($modelValue, $internalValue, $items);

        $attributes = [
            'class' => Html::classes([
                ...StepperState::resolveClasses($orientation, $contentPosition),
                $this->stringProp($context, 'class') ?? '',
            ]),
            'style' => Html::mergeStyles(
                StepperState::resolveRootStyle($items, $activeValue),
                $this->stringProp($context, 'style'),
            ),
            'aria-label' => $this->stringProp($context, 'aria-label') ?? $this->stringProp($context, 'ariaLabel') ?? 'Progress',
            // The ownership marker the browser controller mounts on. Adapter
            // metadata, not product: the parity extractor drops it by its prefix.
            'data-vf-razor' => 'stepper',
        ];
        $attributes += $this->forwardedAttributes($context);

        $markup = '<nav' . Html::attributes($attributes) . '><ol class="vf-stepper__list">';

        foreach ($items as $index => $item) {
            $state = StepperState::resolveStepState($items, $activeValue, $item);
            $current = $state === 'current';

            $markup .= '<li class="vf-stepper__item vf-stepper__item--' . $state . '">';
            // The trigger, in the reference's attribute order. Native button,
            // type=button, native disabled - never aria-disabled, never a role;
            // aria-current only on the current one, never "false" elsewhere.
            $markup .= '<button' . Html::attributes([
                'type' => 'button',
                'class' => Html::classes(['vf-stepper__trigger', $current ? 'vf-stepper__trigger--current' : '']),
                'data-vf-stepper-value' => $item['value'],
                'disabled' => $item['disabled'] ?? false,
                'aria-current' => $current ? 'step' : null,
            ]) . '>';
            $markup .= '<span class="vf-stepper__rail" aria-hidden="true">'
                . '<span class="vf-stepper__connector vf-stepper__connector--before"></span>'
                . '<span class="vf-stepper__marker">' . ($index + 1) . '</span>'
                . '<span class="vf-stepper__connector vf-stepper__connector--after"></span>'
                . '</span>';
            $markup .= '<span class="vf-stepper__content">'
                . '<span class="vf-stepper__label">' . Html::escape($item['label']) . '</span>';
            // The description span exists only for a non-empty description,
            // which is the reference's v-if on a string.
            if (($item['description'] ?? '') !== '') {
                $markup .= '<span class="vf-stepper__description">' . Html::escape($item['description']) . '</span>';
            }
            $markup .= '</span></button></li>';
        }

        return RenderedHtml::fromTrustedString($markup . '</ol></nav>');
    }

    /**
     * The items, validated into the shape the shared rules read.
     *
     * A list of arrays with a string `value` and `label`, an optional string
     * `description` and an optional boolean `disabled`. Anything else is
     * refused: the reference types the prop, and a server that guessed at a
     * malformed item would render a step the Vue adapter would not.
     *
     * @return list<array{value: string, label: string, description?: string, disabled?: bool}>
     */
    private function items(ComponentRenderContext $context): array
    {
        $items = $context->prop('items');

        if (!is_array($items) || !array_is_list($items)) {
            throw new \InvalidArgumentException('The [items] prop of vf-stepper must be a list of items.');
        }

        $resolved = [];
        foreach ($items as $index => $item) {
            if (!is_array($item) || !is_string($item['value'] ?? null) || !is_string($item['label'] ?? null)) {
                throw new \InvalidArgumentException(
                    sprintf('Item %d of vf-stepper must have a string [value] and a string [label].', $index),
                );
            }
            $entry = ['value' => $item['value'], 'label' => $item['label']];
            if (array_key_exists('description', $item) && $item['description'] !== null) {
                if (!is_string($item['description'])) {
                    throw new \InvalidArgumentException(sprintf('Item %d of vf-stepper has a non-string [description].', $index));
                }
                $entry['description'] = $item['description'];
            }
            if (array_key_exists('disabled', $item) && $item['disabled'] !== null) {
                if (!is_bool($item['disabled'])) {
                    throw new \InvalidArgumentException(sprintf('Item %d of vf-stepper has a non-boolean [disabled].', $index));
                }
                $entry['disabled'] = $item['disabled'];
            }
            foreach (array_keys($item) as $key) {
                if (!in_array($key, ['value', 'label', 'description', 'disabled'], true)) {
                    throw new \InvalidArgumentException(sprintf('Item %d of vf-stepper carries an unknown key [%s].', $index, $key));
                }
            }
            $resolved[] = $entry;
        }

        return $resolved;
    }

    /**
     * Props that are not component props fall through to the nav.
     *
     * This is the path a consumer id, role, data-* or aria-current travels -
     * onto the root, never a list item or a trigger.
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
                sprintf('The [%s] attribute of vf-stepper must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-stepper must be a string.', $name));
    }
}
