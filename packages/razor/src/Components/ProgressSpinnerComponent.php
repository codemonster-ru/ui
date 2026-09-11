<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\ProgressSpinnerState;

/**
 * Server-rendered VfProgressSpinner.
 *
 * The M20 component, and the one this package had been rendering since M12
 * without owning: VfButton's loading state composed a Support\ProgressSpinner
 * that reproduced exactly the subset the button forwards - one class, a token
 * size, a stroke width of 5 - and nothing of the public contract beyond it.
 * That support class is gone. This is the canonical spinner, registered as
 * `vf-progress-spinner`, and ButtonComponent renders *this instance* rather
 * than a copy of its markup; VueForgeRazorProvider hands it over, and
 * ButtonComponentTest asserts the identity.
 *
 * No slot, no children, no browser controller: the rotation and the dash are
 * two stylesheet animations keyed on the canonical class names, so there is
 * nothing for JavaScript to drive on either platform. Everything this
 * component does is complete server-side.
 *
 * The spinner is deliberately not decorative. The reference gives the root
 * role=progressbar and an accessible name, so a loading state announces
 * itself; only the artwork inside is aria-hidden. It writes no aria-valuenow,
 * aria-valuemin or aria-valuemax, so the progressbar is indeterminate by
 * omission, and a consumer may forward any of them.
 *
 * Five historical decisions are reproduced here rather than corrected:
 *
 *   - `primary` emits no modifier and every other tone does, `neutral`
 *     included. The alert's convention, not the badge's;
 *   - size is a custom property on the root, never a width. A number becomes
 *     pixels, a string passes through, and the absent default writes no
 *     declaration so the theme token applies;
 *   - `stroke-width` is written on both circles, the track included;
 *   - a consumer `role` or `aria-label` replaces the component's own, because
 *     in the reference both are static attributes on a component that does
 *     not set inheritAttrs: false. Blocking that would be a silent API removal;
 *   - the two circles carry no aria-hidden of their own; the svg does.
 *
 * One thing this adapter decides rather than inherits, narrow and covered by
 * its own test: an empty-string size. The shared rule keeps `['--x', '']`
 * because the reference lets the platform serialiser decide. Vue's client
 * serialiser drops it and writes no attribute; Vue's SSR serialiser writes
 * `--vf-progress-spinner-size:;`. This adapter drops it, because the client
 * form is what every browser ends up with once Vue hydrates and is therefore
 * what a page actually renders - the decision SkeletonGateComponent made for
 * the same reason in M17.
 */
final class ProgressSpinnerComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the root. */
    private const COMPONENT_PROPS = ['label', 'size', 'stroke-width', 'strokeWidth', 'tone', 'class', 'style'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $label = $this->stringProp($context, 'label') ?? 'Loading';
        $tone = $this->stringProp($context, 'tone') ?? 'primary';
        $strokeWidth = $this->strokeWidthProp($context);

        // The component's own attributes first, in the order the reference
        // template writes them: class, style, role, aria-label.
        $attributes = [
            'class' => Html::classes([
                Html::classes(ProgressSpinnerState::resolveClasses($tone)),
                $this->stringProp($context, 'class') ?? '',
            ]),
            'style' => Html::mergeStyles(
                $this->withoutEmptyValues(ProgressSpinnerState::resolveStyle($this->sizeProp($context))),
                $this->stringProp($context, 'style'),
            ),
            'role' => 'progressbar',
            'aria-label' => $label,
        ];

        // Then the consumer's, which overwrite them - the equivalent of an
        // inherited attribute beating a static one in a Vue template. `class`
        // and `style` are excluded because Vue merges both rather than
        // replacing them, and both were already merged above. A null value is
        // the consumer saying nothing: a Razor template binds every attribute
        // it names, so `:role="$maybeNull"` arrives as a null role, and that
        // must leave the component's own role in place rather than erase it.
        foreach ($this->forwardedAttributes($context) as $name => $value) {
            if ($value === null) {
                continue;
            }

            $attributes[$name] = $value;
        }

        return RenderedHtml::fromTrustedString(
            '<span' . Html::attributes($attributes) . '>'
                . $this->artwork($strokeWidth)
                . '</span>',
        );
    }

    /**
     * The svg and its two circles, which no prop reshapes.
     *
     * A fixed 50-unit viewBox and a radius of 20 are the geometry the
     * stylesheet's dash lengths were computed against; the only thing a prop
     * reaches is the stroke width, and it reaches both circles.
     */
    private function artwork(string $strokeWidth): string
    {
        $stroke = Html::escape($strokeWidth);

        return '<svg class="vf-progress-spinner__svg" viewBox="0 0 50 50" aria-hidden="true" focusable="false">'
            . '<circle class="vf-progress-spinner__track" cx="25" cy="25" r="20" fill="none" stroke-width="' . $stroke . '"></circle>'
            . '<circle class="vf-progress-spinner__value" cx="25" cy="25" r="20" fill="none" stroke-width="' . $stroke . '"></circle>'
            . '</svg>';
    }

    /**
     * Drops declarations whose value is the empty string.
     *
     * The shared rule keeps them, because the reference hands a plain object to
     * the platform serialiser and the two Vue serialisers disagree about it.
     * The client one wins here: no declaration, no attribute.
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
     * This is the path a consumer role, aria-label, aria-hidden, aria-valuenow
     * or data attribute travels, which is why none of them is filtered out.
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
                sprintf('The [%s] attribute of vf-progress-spinner must be a scalar or null.', $name),
            );
        }

        return $forwarded;
    }

    /**
     * The size prop, which historically accepts a number as well as a string.
     *
     * A template writes it as text, so a numeric string has to stay numeric
     * here: `size="40"` must become `40px` the way the Vue prop typed
     * `string | number` does, while `size="3rem"` and a token reference pass
     * through. The empty string is kept apart from absence: it is the caller
     * explicitly asking for no declaration, and null is the caller not asking.
     */
    private function sizeProp(ComponentRenderContext $context): string|int|float|null
    {
        $value = $context->prop('size');

        if ($value === null || $value === false) {
            return null;
        }

        if (is_int($value) || is_float($value)) {
            return $value;
        }

        if (is_string($value)) {
            return is_numeric($value) ? $value + 0 : $value;
        }

        throw new \InvalidArgumentException('The [size] prop of vf-progress-spinner must be a string or a number.');
    }

    /**
     * The stroke width, written on both circles as the reference writes it.
     *
     * The Vue prop is a number, so `0` is written as `0` and `2.5` as `2.5`;
     * a template's text is accepted when it is numeric and rejected otherwise.
     */
    private function strokeWidthProp(ComponentRenderContext $context): string
    {
        $value = $context->prop($context->hasProp('stroke-width') ? 'stroke-width' : 'strokeWidth');

        if ($value === null || $value === false) {
            return '4';
        }

        if (is_int($value) || is_float($value) || (is_string($value) && is_numeric($value))) {
            return (string) ($value + 0);
        }

        throw new \InvalidArgumentException('The [stroke-width] prop of vf-progress-spinner must be a number.');
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-progress-spinner must be a string.', $name));
    }
}
