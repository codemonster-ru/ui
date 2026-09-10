<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\SkeletonGateState;

/**
 * Server-rendered VfSkeletonGate.
 *
 * The first VueForge component that renders another VueForge component. It does
 * not reimplement the skeleton: the canonical SkeletonComponent is handed in by
 * VueForgeRazorProvider - the same instance the registry resolves for
 * `<vf-skeleton>` - and this class calls it. That is the whole of the
 * composition mechanism, and it is deliberately not a mechanism: there is no
 * child-component runtime, no registry lookup, no adapter. One constructor
 * parameter, one render() call.
 *
 * The name is the first thing to distrust. "Gate" suggests a component that
 * picks a branch and renders it. It does not: both halves are in the markup at
 * all times, and only their presentation changes.
 *
 *   - the content wrapper always exists and always holds the default slot. When
 *     the gate is not ready it is faded to opacity 0 by the stylesheet, marked
 *     aria-hidden, and made inert - present, laid out, and unreachable;
 *   - the overlay always exists and always holds the skeleton. When the gate is
 *     ready it carries `display: none`, which is what Vue's v-show writes.
 *
 * A port that turned either into a real branch would delete the fade the whole
 * component exists for while every static assertion kept passing.
 *
 * Six further historical decisions are reproduced here rather than corrected:
 *
 *   - `aria-busy` is `"true"` while loading and *absent* when ready. It is
 *     never `"false"`, because the reference writes `!ready || undefined`. A
 *     consumer attribute of the same name replaces it, since consumer
 *     attributes are applied last;
 *   - the fade-duration custom property is written on every render, so a gate
 *     always carries a style attribute even at the default;
 *   - `reserve-height` outranks `min-height` on the *root*, and the child
 *     skeleton receives `min-height` regardless. The two legitimately disagree,
 *     and forwarding the resolved root height instead would make them agree and
 *     look tidier;
 *   - `reserve-height=""` wins that precedence contest and then writes nothing,
 *     silently swallowing a `min-height` the caller also passed;
 *   - the overlay receives the radius and nothing else, while the root receives
 *     the radius, the reserved height and the fade duration;
 *   - the explanatory comment beside the default skeleton is part of the
 *     historical markup and is reproduced.
 *
 * Two things this adapter decides rather than inherits, both narrow and both
 * covered by their own tests:
 *
 *   - an empty style value. The shared rule keeps `['min-height', '']` because
 *     the reference builds a plain object and lets the platform serialiser
 *     decide. Vue's client serialiser drops such a property; Vue's SSR
 *     serialiser writes `min-height:;`. This adapter drops it, because the
 *     client form is what every browser ends up with once Vue hydrates and is
 *     therefore what a page actually renders;
 *   - `preserve-last-height` is accepted and has no effect. It is a post-mount
 *     ResizeObserver measurement in the Vue adapter, and this component renders
 *     on the server with nothing measured - which is exactly the state the
 *     reference is in during SSR and in its own first rendered frame. Rejecting
 *     the prop would be a silent API removal; implementing a browser controller
 *     for it would give the Razor gate client behaviour the reference gate
 *     never had, since in Vue it is the *consumer* that drives every state
 *     change here.
 */
final class SkeletonGateComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the root. */
    private const COMPONENT_PROPS = [
        'ready',
        'min-height',
        'minHeight',
        'reserve-height',
        'reserveHeight',
        'preserve-last-height',
        'preserveLastHeight',
        'normalize-content-spacing',
        'normalizeContentSpacing',
        'radius',
        'fade-duration',
        'fadeDuration',
        'class',
        'style',
    ];

    /**
     * @param ComponentInterface $skeleton the canonical vf-skeleton renderer
     */
    public function __construct(private readonly ComponentInterface $skeleton)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $ready = $this->booleanProp($context, 'ready');
        $minHeight = $this->lengthProp($context, 'min-height', 'minHeight');
        $reserveHeight = $this->lengthProp($context, 'reserve-height', 'reserveHeight');
        $preserveLastHeight = $this->booleanProp($context, 'preserve-last-height', 'preserveLastHeight');
        $normalizeContentSpacing = $this->booleanProp($context, 'normalize-content-spacing', 'normalizeContentSpacing');
        $radius = $this->stringProp($context, 'radius');
        $fadeDuration = $this->fadeDurationProp($context);

        $rootStyle = SkeletonGateState::resolveRootStyle(
            SkeletonGateState::resolveMinHeight(
                $ready,
                $minHeight,
                $reserveHeight,
                $preserveLastHeight,
                // Always null: nothing is measured on the server. See the class
                // docblock on preserve-last-height.
                null,
            ),
            $radius,
            $fadeDuration,
        );

        $rootAttributes = [
            'class' => Html::classes(['vf-skeleton-gate', $this->stringProp($context, 'class') ?? '']),
            'style' => Html::mergeStyles($this->withoutEmptyValues($rootStyle), $this->stringProp($context, 'style')),
            // `!ready || undefined`: true while loading, and gone rather than
            // false once ready.
            'aria-busy' => $ready ? null : 'true',
        ];

        // The consumer's attributes last, which is the equivalent of an
        // inherited attribute beating a bound one in a Vue template. `class` and
        // `style` are excluded because Vue merges both rather than replacing
        // them, and both were already merged above. This is the path a consumer
        // `aria-busy` travels, which is why it is deliberately not filtered out.
        foreach ($this->forwardedAttributes($context) as $name => $value) {
            $rootAttributes[$name] = $value;
        }

        $contentAttributes = [
            'class' => Html::classes(SkeletonGateState::resolveContentClasses($ready, $normalizeContentSpacing)),
            'aria-hidden' => $ready ? null : 'true',
            // Written as a bare boolean attribute, which is what both Vue's SSR
            // serialiser and Chrome produce: `inert` is a real DOM property, so
            // the client adapter sets the property and the browser reflects it
            // as `inert=""`.
            'inert' => $ready ? null : true,
        ];

        $overlayStyle = $this->withoutEmptyValues(SkeletonGateState::resolveOverlayStyle($radius));
        if ($ready) {
            // What v-show writes, appended after the bound declarations exactly
            // as the directive appends it to an element's inline style.
            $overlayStyle[] = ['display', 'none'];
        }

        $overlayAttributes = [
            'class' => 'vf-skeleton-gate__overlay',
            'style' => Html::mergeStyles($overlayStyle, null),
            // The overlay is aria-hidden in both states, not only while loading.
            'aria-hidden' => 'true',
        ];

        return RenderedHtml::fromTrustedString(
            '<div' . Html::attributes($rootAttributes) . '>'
            . '<div' . Html::attributes($contentAttributes) . '>'
            . $context->slot('default')->value()
            . '</div>'
            . '<div' . Html::attributes($overlayAttributes) . '>'
            . $this->overlayContent($context, $minHeight, $radius)
            . '</div>'
            . '</div>',
        );
    }

    /**
     * The overlay's contents: the caller's skeleton slot, or the canonical child.
     *
     * The fallback is the whole point of this class. It is not markup that
     * resembles a skeleton - it is SkeletonComponent::render, called with the
     * two props the reference template forwards and nothing else. If the
     * skeleton's class list, its style rules or its aria-hidden ever change,
     * they change here too, and if this method stopped calling it the
     * child-composition test would say so.
     */
    private function overlayContent(
        ComponentRenderContext $context,
        string|int|float|null $minHeight,
        ?string $radius,
    ): string {
        if ($context->hasSlot('skeleton')) {
            return $context->slot('skeleton')->value();
        }

        // Exactly the two props the reference forwards. `radius` is omitted
        // rather than passed as null when the gate has none, so the child's own
        // default applies - which is where the token on a default gate's
        // skeleton comes from. A gate that hardcoded that token would look
        // identical until the child's default changed.
        $childProps = ['min-height' => $minHeight];
        if ($radius !== null) {
            $childProps['radius'] = $radius;
        }

        return '<!-- Default skeleton primitive used by the gate when no custom skeleton slot is provided. -->'
            . $this->skeleton->render(new ComponentRenderContext($childProps, []))->value();
    }

    /**
     * Drops declarations whose value is the empty string.
     *
     * The shared rule keeps them, because the reference hands a plain object to
     * the platform serialiser and the two Vue serialisers disagree about it.
     * See the class docblock.
     *
     * @param list<array{0: string, 1: string}> $declarations
     * @return list<array{0: string, 1: string}>
     */
    private function withoutEmptyValues(array $declarations): array
    {
        return array_values(array_filter($declarations, static fn (array $pair): bool => $pair[1] !== ''));
    }

    /**
     * Props that are not component props fall through to the root.
     *
     * They reach the root and neither branch, exactly as a Vue fallthrough
     * attribute reaches a single-root component's root element.
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
                sprintf('The [%s] attribute of vf-skeleton-gate must be a scalar or null.', $name),
            );
        }

        return $forwarded;
    }

    /**
     * A length prop, which historically accepts a number as well as a string.
     *
     * A template writes it as text, so a numeric string has to stay a numeric
     * string here: `min-height="40"` must become `40px` the way the Vue prop
     * typed `string | number` does, while `min-height="3rem"` passes through.
     * The empty string is preserved as the empty string, because for
     * `reserve-height` that is a distinct and load-bearing input.
     */
    private function lengthProp(ComponentRenderContext $context, string $name, string $alias): string|int|float|null
    {
        $value = $context->prop($context->hasProp($name) ? $name : $alias);

        if ($value === null || $value === false) {
            return null;
        }

        if (is_int($value) || is_float($value)) {
            return $value;
        }

        if (is_string($value)) {
            return is_numeric($value) ? $value + 0 : $value;
        }

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-skeleton-gate must be a string or a number.', $name));
    }

    /**
     * A boolean prop that defaults to false.
     *
     * A bare attribute, which Razor passes as `true`, means on; the strings
     * Razor cannot distinguish from an absent value mean off.
     */
    private function booleanProp(ComponentRenderContext $context, string $name, ?string $alias = null): bool
    {
        $value = $context->prop($context->hasProp($name) || $alias === null ? $name : $alias);

        if ($value === null) {
            return false;
        }

        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            return !in_array($value, ['false', '0', ''], true);
        }

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-skeleton-gate must be a boolean.', $name));
    }

    /** The fade duration, which defaults to 220 and is written in milliseconds. */
    private function fadeDurationProp(ComponentRenderContext $context): int|float
    {
        $value = $context->prop($context->hasProp('fade-duration') ? 'fade-duration' : 'fadeDuration');

        if ($value === null) {
            return 220;
        }

        if (is_int($value) || is_float($value)) {
            return $value;
        }

        if (is_string($value) && is_numeric($value)) {
            return $value + 0;
        }

        throw new \InvalidArgumentException('The [fade-duration] prop of vf-skeleton-gate must be a number.');
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-skeleton-gate must be a string.', $name));
    }
}
