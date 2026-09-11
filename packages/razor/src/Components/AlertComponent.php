<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\AlertState;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\IconRenderer;

/**
 * Server-rendered VfAlert.
 *
 * Renders the same `vf-alert` markup the Vue adapter renders. No browser
 * controller, and this is the finding of M19 rather than a shortcut: the
 * reference alert has no dismiss control. No `dismissible` prop, no close
 * button, no emitted event, no internal visibility state. An alert is a
 * server-complete surface, and whatever is interactive inside it belongs to
 * the consumer who put it in a slot. A close button here - the one every
 * other design system's alert has - would be a product change, and the parity
 * gate's static-ownership measurement is what refuses it.
 *
 * What the alert does own is a semantic role. `role="alert"` is written on the
 * section for every tone; it is the first migrated component that writes a
 * role of its own unconditionally. It is written *before* the consumer's
 * attributes in the Vue template, so a consumer role replaces it, and the same
 * precedence holds here. Nothing else about accessibility is written: no
 * aria-live, no aria-atomic, no accessible name. The live-region behaviour an
 * alert has is the one the role implies.
 *
 * Tone is paint plus glyph choice. It selects a modifier class and the
 * fallback icon and changes nothing else; both halves are decided by
 * AlertState, the PHP mirror of the shared rule the Vue component consumes.
 * The glyph goes through IconRenderer, the neutral registry generated from
 * packages/icons. There is no alert-specific icon map and no SVG copied into
 * this file.
 *
 * Three historical decisions are reproduced rather than corrected:
 *
 *   - the icon container is `aria-hidden` whatever it holds, including a
 *     consumer's icon slot, and `hideIcon` removes the container with the
 *     consumer's slot inside it;
 *   - an empty-string `title` is falsy and renders no title paragraph, but an
 *     empty-string title with a title slot that renders nothing renders an
 *     *empty* paragraph, because the slot opened it and the fallback is the
 *     prop;
 *   - the body wrapper is unconditional. An alert with no content still holds
 *     an empty `div.vf-alert__body`.
 */
final class AlertComponent implements ComponentInterface
{
    /**
     * The literal size the reference passes to the icon component. Not the
     * icon's own default: the alert asks for the large size explicitly.
     */
    private const ICON_SIZE = 'var(--vf-icon-size-lg)';

    /** Props consumed by the component; everything else falls through to the section. */
    private const COMPONENT_PROPS = ['tone', 'title', 'icon', 'hide-icon', 'hideIcon', 'class', 'style'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $tone = $this->stringProp($context, 'tone') ?? 'primary';
        $title = $this->stringProp($context, 'title');
        $icon = $this->stringProp($context, 'icon');
        $hideIcon = $this->booleanProp($context, 'hide-icon') || $this->booleanProp($context, 'hideIcon');

        $iconSlot = $context->hasSlot('icon') ? $context->slot('icon')->value() : '';
        $titleSlot = $context->hasSlot('title') ? $context->slot('title')->value() : '';
        $regions = AlertState::resolveRegions(
            $hideIcon,
            $context->hasSlot('icon'),
            // Vue falls back when the slot yields no vnodes. The nearest true
            // statement about rendered markup is that it is blank.
            $context->hasSlot('icon') ? trim($iconSlot) !== '' : null,
            $title,
            $context->hasSlot('title'),
            $context->hasSlot('title') ? trim($titleSlot) !== '' : null,
        );

        $attributes = $this->forwardedAttributes($context);
        // Canonical classes first, consumer class appended - what Vue does with
        // an inherited class.
        $attributes['class'] = Html::classes([
            Html::classes(AlertState::resolveClasses($tone)),
            $this->stringProp($context, 'class') ?? '',
        ]);
        $attributes['style'] = $this->stringProp($context, 'style');
        // The component's own role, unless the consumer wrote one. Written for
        // every tone: tone is paint, not semantics.
        if (($attributes['role'] ?? null) === null) {
            $attributes['role'] = 'alert';
        }

        $markup = '<section' . Html::attributes($attributes) . '>';

        if ($regions['icon']) {
            // Decorative whatever it holds. aria-hidden sits on the container
            // and not on the glyph, exactly as the reference writes it.
            $markup .= '<div class="vf-alert__icon" aria-hidden="true">'
                . ($regions['iconGlyph']
                    ? IconRenderer::render(AlertState::resolveIcon($tone, $icon), self::ICON_SIZE)
                    : $iconSlot)
                . '</div>';
        }

        $markup .= '<div class="vf-alert__content">';

        if ($regions['title']) {
            // Interpolated text in the Vue template, so escaped here.
            $markup .= '<p class="vf-alert__title">'
                . ($regions['titleText'] ? Html::escape((string) $title) : $titleSlot)
                . '</p>';
        }

        // Unconditional, and empty when there is nothing to put in it.
        $markup .= '<div class="vf-alert__body">'
            . ($context->hasSlot('default') ? $context->slot('default')->value() : '')
            . '</div>';

        return RenderedHtml::fromTrustedString($markup . '</div></section>');
    }

    /**
     * Props that are not component props fall through to the section.
     *
     * This is the path a consumer `role`, `aria-live` or accessible name
     * travels. The alert writes a role of its own only when nothing arrives
     * this way.
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
                sprintf('The [%s] attribute of vf-alert must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-alert must be a boolean.', $name));
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-alert must be a string.', $name));
    }
}
