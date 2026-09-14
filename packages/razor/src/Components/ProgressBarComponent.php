<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\ProgressBarState;

/**
 * Server-rendered VfProgressBar.
 *
 * The M21 component, and the last static progress-related leaf. It shares
 * the role name and the tone union with ProgressSpinnerComponent and nothing
 * else: it renders no spinner, imports nothing from it, and takes its rules
 * from ProgressBarState rather than from any "progress" helper. The two are
 * registered side by side and neither reaches the other.
 *
 * No slot, no children beyond its own fill and label, no browser controller:
 * the indeterminate sweep, the stripe drift and the width transition are
 * stylesheet rules keyed on the canonical class names, so there is nothing
 * for JavaScript to drive on either platform. Everything this component does
 * is complete server-side.
 *
 * The historical decisions reproduced here rather than corrected:
 *
 *   - determinate is the default. A missing value is 0, not indeterminate,
 *     and writes aria-valuemin=0, aria-valuemax=100 and aria-valuenow=0;
 *   - a maximum that is not a finite positive number falls back to 100; a
 *     value that is not finite falls back to 0 and is otherwise clamped.
 *     Nothing is rounded: aria-valuenow="33.3333" and inline-size
 *     58.333333333333336%, serialised as JavaScript serialises them;
 *   - indeterminate drops all three aria-value* attributes and the fill's
 *     inline size, adds one modifier, and ignores value, max and showValue;
 *   - the visible label is the rounded percentage, inside the fill, only
 *     with showValue while determinate; it is never the accessible name and
 *     never written as aria-valuetext;
 *   - `primary` emits no tone modifier and every other tone does; `animated`
 *     emits its modifier only beside `striped`;
 *   - a consumer `role`, `aria-label` or `aria-value*` replaces the
 *     component's own, because in the reference all of them are written
 *     before the inherited attrs. The fill does not read the attribute, so a
 *     consumer aria-valuenow changes what is announced and not what is
 *     painted - the reference's contract, and the harness measures both.
 *
 * Two things this adapter decides rather than inherits, each narrow and
 * covered by its own test:
 *
 *   - a numeric string from a template is a number. The Vue prop is typed
 *     `number`, and the reference treats a string as non-finite because it
 *     never expected one; a Razor template writes every attribute as text, so
 *     `value="40"` has to be 40 here or the component would be unusable from
 *     the template it exists for. The rule itself keeps the reference's
 *     string semantics; the parse happens here, before the rule, and only for
 *     text that is_numeric. Text that is not numeric is rejected rather than
 *     silently rendered as 0;
 *   - an empty-string height is dropped. The shared rule keeps `['--x', '']`
 *     because the reference lets the platform serialiser decide; Vue's client
 *     drops it and Vue's SSR writes `--vf-progress-bar-height:;`. This adapter
 *     drops it, as ProgressSpinnerComponent and SkeletonGateComponent do,
 *     because the client form is what every hydrated page ends up with.
 */
final class ProgressBarComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the root. */
    private const COMPONENT_PROPS = [
        'value',
        'max',
        'indeterminate',
        'label',
        'height',
        'show-value',
        'showValue',
        'tone',
        'striped',
        'animated',
        'class',
        'style',
    ];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $indeterminate = $this->booleanProp($context, 'indeterminate');
        $showValue = $this->booleanProp($context, $context->hasProp('show-value') ? 'show-value' : 'showValue');
        $striped = $this->booleanProp($context, 'striped');
        $animated = $this->booleanProp($context, 'animated');
        $label = $this->stringProp($context, 'label') ?? 'Progress';
        $tone = $this->stringProp($context, 'tone') ?? 'primary';

        $max = ProgressBarState::resolveMax($this->numberProp($context, 'max'));
        $value = ProgressBarState::resolveValue($this->numberProp($context, 'value'), $max);
        $percentage = ProgressBarState::resolvePercentage($value, $max);
        $semantics = ProgressBarState::resolveValueSemantics($indeterminate, $value, $max);

        // The component's own attributes first, in the order the reference
        // template writes them: class, style, role, aria-label, then the
        // three value attributes while determinate.
        $attributes = [
            'class' => Html::classes([
                Html::classes(ProgressBarState::resolveClasses($tone, $striped, $animated, $indeterminate)),
                $this->stringProp($context, 'class') ?? '',
            ]),
            'style' => Html::mergeStyles(
                $this->withoutEmptyValues(ProgressBarState::resolveRootStyle($this->heightProp($context))),
                $this->stringProp($context, 'style'),
            ),
            'role' => 'progressbar',
            'aria-label' => $label,
            'aria-valuemin' => $semantics['valuemin'] ?? null,
            'aria-valuemax' => $semantics['valuemax'] ?? null,
            'aria-valuenow' => $semantics['valuenow'] ?? null,
        ];

        // Then the consumer's, which overwrite them - the equivalent of an
        // inherited attribute beating a static one in a Vue template. `class`
        // and `style` are excluded because Vue merges both rather than
        // replacing them, and both were already merged above. A null value is
        // the consumer saying nothing: a Razor template binds every attribute
        // it names, so `:role="$maybeNull"` arrives as a null role, and that
        // must leave the component's own role in place rather than erase it.
        foreach ($this->forwardedAttributes($context) as $name => $forwarded) {
            if ($forwarded === null) {
                continue;
            }

            $attributes[$name] = $forwarded;
        }

        $fillStyle = Html::mergeStyles(ProgressBarState::resolveValueStyle($indeterminate, $percentage), null);
        $labelMarkup = $showValue && !$indeterminate
            ? '<span class="vf-progress-bar__label">'
                . Html::escape(ProgressBarState::resolveValueLabel($value, $max))
                . '</span>'
            : '';

        return RenderedHtml::fromTrustedString(
            '<div' . Html::attributes($attributes) . '>'
                . '<span' . Html::attributes(['class' => 'vf-progress-bar__value', 'style' => $fillStyle]) . '>'
                . $labelMarkup
                . '</span>'
                . '</div>',
        );
    }

    /**
     * Drops declarations whose value is the empty string.
     *
     * @param list<array{0: string, 1: string}> $declarations
     * @return list<array{0: string, 1: string}>
     */
    private function withoutEmptyValues(array $declarations): array
    {
        return array_values(array_filter($declarations, static fn (array $declaration): bool => $declaration[1] !== ''));
    }

    /**
     * Props that are not component props fall through to the root.
     *
     * This is the path a consumer role, aria-label, aria-labelledby,
     * aria-value*, aria-hidden or data attribute travels, which is why none
     * of them is filtered out.
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
                sprintf('The [%s] attribute of vf-progress-bar must be a scalar or null.', $name),
            );
        }

        return $forwarded;
    }

    /**
     * `value` or `max` as the rule expects it.
     *
     * An int or a float passes through, NAN and INF included - the rule is
     * what decides they are non-finite. Null is the absent prop. A numeric
     * string is parsed, because a template writes every attribute as text;
     * `false` is the absent bare attribute. Anything else is rejected rather
     * than silently rendered as 0.
     */
    private function numberProp(ComponentRenderContext $context, string $name): int|float|null
    {
        $value = $context->prop($name);

        if ($value === null || $value === false) {
            return null;
        }

        if (is_int($value) || is_float($value)) {
            return $value;
        }

        if (is_string($value) && is_numeric($value)) {
            return $value + 0;
        }

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-progress-bar must be a number.', $name));
    }

    /**
     * The height prop, which historically accepts a number as well as a string.
     *
     * A numeric string stays numeric so `height="12"` becomes `12px`; any
     * other string passes through. The empty string is kept apart from
     * absence and dropped by withoutEmptyValues.
     */
    private function heightProp(ComponentRenderContext $context): string|int|float|null
    {
        $value = $context->prop('height');

        if ($value === null || $value === false) {
            return null;
        }

        if (is_int($value) || is_float($value)) {
            return $value;
        }

        if (is_string($value)) {
            return is_numeric($value) ? $value + 0 : $value;
        }

        throw new \InvalidArgumentException('The [height] prop of vf-progress-bar must be a string or a number.');
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-progress-bar must be a boolean.', $name));
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-progress-bar must be a string.', $name));
    }
}
