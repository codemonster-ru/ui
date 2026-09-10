<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\CardState;
use Codemonster\VueForge\Razor\Support\Html;

/**
 * Server-rendered VfCard.
 *
 * Renders the same `vf-card` markup the Vue adapter renders. No browser
 * controller: the card itself owns no interaction at all. Whatever a consumer
 * puts in a slot may be as interactive as it likes, and that content belongs to
 * the consumer, not to this component - the distinction section 23 of the M16
 * plan is about.
 *
 * Five historical decisions are reproduced here rather than corrected:
 *
 *   - the `<header>` and `<footer>` wrappers carry no class. Only the fallback
 *     heading and the body wrapper are classed. `vf-card__header` would read
 *     better and be trivially stylable, and adding it would change what every
 *     existing stylesheet selects;
 *   - an empty-string `title` is falsy, so it renders no header at all rather
 *     than an empty one;
 *   - the header wrapper and the fallback heading are keyed on *different*
 *     questions. The wrapper asks whether a header slot was passed; the heading
 *     asks whether that slot produced content. Vue gets the second answer from
 *     slot-fallback semantics; here it is decided explicitly, because a Razor
 *     slot arrives as already-rendered markup rather than as a vnode list. A
 *     header slot that renders nothing therefore yields a header element with
 *     the fallback heading back inside it;
 *   - the body and footer wrappers are keyed on a slot being *present*, not on
 *     what it renders, so a slot producing nothing still emits an empty wrapper
 *     - visible as a row and a gap in the flex column;
 *   - consumer attributes are applied after the component's own, so a consumer
 *     class is appended to the canonical ones and a consumer may put any role
 *     on the section.
 *
 * VfPanel is not rendered by this class and must not be. The two components
 * look alike enough that one parameterised renderer would be an easy write, and
 * the moment it existed neither would have independent evidence.
 */
final class CardComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the section. */
    private const COMPONENT_PROPS = ['title', 'compact', 'class', 'style'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $title = $this->stringProp($context, 'title');
        $compact = $this->booleanProp($context, 'compact');

        $header = $context->hasSlot('header') ? $context->slot('header')->value() : '';
        $regions = CardState::resolveRegions(
            $title,
            $context->hasSlot('header'),
            $context->hasSlot('default'),
            $context->hasSlot('footer'),
            // Vue falls back when the slot yields no vnodes. The nearest true
            // statement about rendered markup is that it is blank, so a slot
            // rendering only whitespace counts as no content here exactly as a
            // slot rendering only a v-if comment does in Vue.
            $context->hasSlot('header') ? trim($header) !== '' : null,
        );

        $attributes = $this->forwardedAttributes($context);
        $attributes['class'] = Html::classes([
            Html::classes(CardState::resolveClasses($compact)),
            $this->stringProp($context, 'class') ?? '',
        ]);
        $attributes['style'] = $this->stringProp($context, 'style');

        $markup = '<section' . Html::attributes($attributes) . '>';

        if ($regions['header']) {
            // Unclassed on purpose. See the class docblock.
            $markup .= '<header>'
                . ($regions['headerTitle']
                    ? '<h3 class="vf-card__title">' . Html::escape((string) $title) . '</h3>'
                    : $header)
                . '</header>';
        }

        if ($regions['body']) {
            $markup .= '<div class="vf-card__body">' . $context->slot('default')->value() . '</div>';
        }

        if ($regions['footer']) {
            $markup .= '<footer>' . $context->slot('footer')->value() . '</footer>';
        }

        return RenderedHtml::fromTrustedString($markup . '</section>');
    }

    /**
     * Props that are not component props fall through to the section.
     *
     * This is the path a consumer `role` and accessible name travel; the card
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
                sprintf('The [%s] attribute of vf-card must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-card must be a boolean.', $name));
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-card must be a string.', $name));
    }
}
