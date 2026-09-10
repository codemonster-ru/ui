<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\PanelState;

/**
 * Server-rendered VfPanel.
 *
 * Renders the same `vf-panel` markup the Vue adapter renders. No browser
 * controller: the panel owns no interaction at all. Whatever a consumer puts in
 * a slot may be as interactive as it likes, and that content belongs to the
 * consumer, not to this component.
 *
 * This class does not extend, wrap, call or delegate to CardComponent, and that
 * is the whole point of M18. The two components look alike enough that one
 * parameterised renderer taking a block name would be an easy write; the moment
 * it existed, neither would have independent evidence, and the three real
 * structural differences below would be one `if` away from disappearing:
 *
 *   - the default slot has no wrapper and no condition. It renders straight
 *     into the section. There is no `div.vf-panel__body` and there never was;
 *     a card's body wrapper is the first thing a shared renderer would grow
 *     here, and it looks identical until something selects on it;
 *   - there is no footer. A `footer` slot passed to a panel is simply not
 *     rendered, which is a different behaviour from rendering an empty one;
 *   - `subtle` is not `compact`. A card's modifier changes padding and column
 *     gap; a panel's changes the background and removes the shadow. They are
 *     different products, not different spellings of one.
 *
 * Three historical decisions are reproduced rather than corrected:
 *
 *   - the `<header>` wrapper carries no class. Only the fallback heading is
 *     classed. `vf-panel__header` would read better and be trivially stylable,
 *     and adding it would change what every existing stylesheet selects;
 *   - an empty-string `title` is falsy, so it renders no header at all rather
 *     than an empty one;
 *   - the header wrapper and the fallback heading are keyed on *different*
 *     questions. The wrapper asks whether a header slot was passed; the heading
 *     asks whether that slot produced content. Vue gets the second answer from
 *     slot-fallback semantics; here it is decided explicitly, because a Razor
 *     slot arrives as already-rendered markup rather than as a vnode list. A
 *     header slot that renders nothing therefore yields a header element with
 *     the fallback heading back inside it.
 *
 * Consumer attributes are applied after the component's own, so a consumer class
 * is appended to the canonical ones and a consumer may put any role on the
 * section.
 */
final class PanelComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the section. */
    private const COMPONENT_PROPS = ['title', 'subtle', 'class', 'style'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $title = $this->stringProp($context, 'title');
        $subtle = $this->booleanProp($context, 'subtle');

        $header = $context->hasSlot('header') ? $context->slot('header')->value() : '';
        $regions = PanelState::resolveRegions(
            $title,
            $context->hasSlot('header'),
            // Vue falls back when the slot yields no vnodes. The nearest true
            // statement about rendered markup is that it is blank, so a slot
            // rendering only whitespace counts as no content here exactly as a
            // slot rendering only a v-if comment does in Vue.
            $context->hasSlot('header') ? trim($header) !== '' : null,
        );

        $attributes = $this->forwardedAttributes($context);
        $attributes['class'] = Html::classes([
            Html::classes(PanelState::resolveClasses($subtle)),
            $this->stringProp($context, 'class') ?? '',
        ]);
        $attributes['style'] = $this->stringProp($context, 'style');

        $markup = '<section' . Html::attributes($attributes) . '>';

        if ($regions['header']) {
            // Unclassed on purpose. See the class docblock.
            $markup .= '<header>'
                . ($regions['headerTitle']
                    ? '<h3 class="vf-panel__title">' . Html::escape((string) $title) . '</h3>'
                    : $header)
                . '</header>';
        }

        // Straight into the section, with no wrapper and no condition. A card
        // would put a classed div here and would emit it even for a slot that
        // renders nothing; a panel does neither.
        if ($context->hasSlot('default')) {
            $markup .= $context->slot('default')->value();
        }

        return RenderedHtml::fromTrustedString($markup . '</section>');
    }

    /**
     * Props that are not component props fall through to the section.
     *
     * This is the path a consumer `role` and accessible name travel; the panel
     * writes neither of its own.
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
                sprintf('The [%s] attribute of vf-panel must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-panel must be a boolean.', $name));
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-panel must be a string.', $name));
    }
}
