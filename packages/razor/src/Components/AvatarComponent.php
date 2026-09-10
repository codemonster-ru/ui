<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\AvatarState;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\IconRenderer;

/**
 * Server-rendered VfAvatar.
 *
 * Renders the same `vf-avatar` markup the Vue adapter renders. No browser
 * controller: an avatar shows one of four things and never changes which.
 *
 * The four branches are written out one after another rather than collapsed
 * into a "content" abstraction. They produce different elements with different
 * accessibility semantics - an image with an alt, a text span, a decorative
 * glyph, arbitrary consumer markup - and the only thing they have in common is
 * that exactly one of them happens. A helper that returned "the content" would
 * make a reordering a one-line change in a place no test looks at, and the
 * ordering is the contract this component exists to preserve.
 *
 * Which branch wins is decided by AvatarState::resolveBranch, the PHP mirror of
 * the shared rule the Vue component consumes, so neither adapter re-derives the
 * priority on its own.
 *
 * The icon branch goes through IconRenderer, the neutral registry generated
 * from packages/icons. There is no avatar-specific icon map, no second
 * registry and no SVG copied into this file: an avatar renders the same glyph
 * data every other Razor component renders.
 */
final class AvatarComponent implements ComponentInterface
{
    /**
     * The literal size default the Vue icon component uses when no size prop is
     * given. VfAvatar passes no size, so both adapters write these custom
     * properties into the glyph's width and height.
     */
    private const ICON_SIZE = 'var(--vf-icon-current-size, var(--vf-icon-size-md))';

    /** Props consumed by the component; everything else falls through to the span. */
    private const COMPONENT_PROPS = [
        'image',
        'image-alt',
        'imageAlt',
        'label',
        'icon',
        'size',
        'shape',
        'class',
        'style',
    ];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $image = $this->stringProp($context, 'image');
        $label = $this->stringProp($context, 'label');
        $icon = $this->stringProp($context, 'icon');
        $size = $this->stringProp($context, 'size') ?? 'md';
        $shape = $this->stringProp($context, 'shape') ?? 'square';

        $attributes = $this->forwardedAttributes($context);
        // Canonical classes first, consumer class appended - what Vue does with
        // an inherited class.
        $attributes['class'] = Html::classes([
            Html::classes(AvatarState::resolveClasses($size, $shape)),
            $this->stringProp($context, 'class') ?? '',
        ]);
        $attributes['style'] = $this->stringProp($context, 'style');

        return RenderedHtml::fromTrustedString(
            '<span' . Html::attributes($attributes) . '>'
                . $this->renderBranch($context, $image, $label, $icon)
                . '</span>',
        );
    }

    /**
     * The one branch that wins, rendered on its own terms.
     *
     * @param string|null $image the source of the image branch
     * @param string|null $label the text of the label branch
     * @param string|null $icon  the registry name of the icon branch
     */
    private function renderBranch(
        ComponentRenderContext $context,
        ?string $image,
        ?string $label,
        ?string $icon,
    ): string {
        return match (AvatarState::resolveBranch($image, $label, $icon)) {
            // `alt` is always written, and its default is the empty string, so
            // an image avatar is decorative rather than unlabelled. A missing
            // alt and an empty one are different things to a screen reader, and
            // the reference chose the empty one.
            'image' => '<img' . Html::attributes([
                'class' => 'vf-avatar__image',
                'src' => $image,
                'alt' => $this->stringProp($context, 'image-alt')
                    ?? $this->stringProp($context, 'imageAlt')
                    ?? '',
            ]) . '>',
            // Interpolated text in the Vue template, so escaped here.
            'label' => '<span class="vf-avatar__label">' . Html::escape((string) $label) . '</span>',
            // The class lands on the glyph, not on a wrapper of the avatar's
            // own: VueIconify spreads its attrs onto the inner svg. aria-hidden
            // travels the same path, which is why an icon-only avatar exposes
            // no accessible name.
            'icon' => IconRenderer::render((string) $icon, self::ICON_SIZE, true, 'vf-avatar__icon'),
            // Arbitrary consumer markup, wrapped in nothing at all - unlike the
            // label branch, which wraps its text in a classed span.
            'slot' => $context->hasSlot('default') ? $context->slot('default')->value() : '',
        };
    }

    /**
     * Props that are not component props fall through to the span.
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
                sprintf('The [%s] attribute of vf-avatar must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-avatar must be a string.', $name));
    }
}
