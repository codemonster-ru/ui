<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\TableState;

/**
 * Server-rendered VfTable.
 *
 * Renders the same markup the Vue adapter renders: div.vf-table-wrap, which
 * carries every consumer attribute, div.vf-table-scroll, which owns the
 * horizontal overflow, and the native table inside it with its own class list
 * and nothing else. No browser controller and no generated id: the sticky
 * header is a class and a stylesheet rule.
 *
 * Historical decisions reproduced rather than corrected:
 *
 *   - the attributes land on the wrapper, never on the table. A consumer
 *     `aria-label` therefore names a div, not the table, and that is what the
 *     reference renders;
 *   - the scroll container has no tabindex, role or label;
 *   - the caption opens for a truthy caption prop ("" is none, "0" is one) or a
 *     caption slot, and the slot is fallback content for the prop: a slot that
 *     renders only whitespace shows the prop text;
 *   - thead, tbody and tfoot are each keyed on the presence of their slot, not
 *     on what it renders, so an empty slot is an empty section;
 *   - the four modifiers are table classes in a fixed order.
 *
 * One engine limit, recorded rather than worked around (see section У.8 of the
 * plan): a template invocation with any content declares the default slot,
 * even when the content is only named slots, so a template cannot say "a
 * header and no body" the way a Vue consumer can. Through the PHP API, where a
 * slot's presence is explicit, the component is exact.
 *
 * VfDataTable writes the same class vocabulary and is not rendered by this
 * class.
 */
final class TableComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the wrapper. */
    private const COMPONENT_PROPS = [
        'caption',
        'column-dividers',
        'columnDividers',
        'compact',
        'striped',
        'sticky-header',
        'stickyHeader',
        'class',
        'style',
    ];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $caption = $this->stringProp($context, 'caption');
        $sections = TableState::resolveSections(
            $caption,
            $context->hasSlot('caption'),
            $context->hasSlot('header'),
            $context->hasSlot('default'),
            $context->hasSlot('footer'),
        );
        $classes = TableState::resolveClasses(
            $this->booleanProp($context, 'column-dividers', 'columnDividers'),
            $this->booleanProp($context, 'compact'),
            $this->booleanProp($context, 'striped'),
            $this->booleanProp($context, 'sticky-header', 'stickyHeader'),
        );

        $attributes = [
            'class' => Html::classes(['vf-table-wrap', $this->stringProp($context, 'class') ?? '']),
            ...$this->forwardedAttributes($context),
        ];
        $attributes['style'] = $this->stringProp($context, 'style');

        $markup = '<div' . Html::attributes($attributes) . '><div class="vf-table-scroll">'
            . '<table class="' . Html::escape(Html::classes($classes)) . '">';

        if ($sections['caption']) {
            $slot = $context->hasSlot('caption') ? $context->slot('caption')->value() : '';
            $markup .= '<caption class="vf-table__caption">'
                . (trim($slot) !== '' ? $slot : Html::escape($caption ?? ''))
                . '</caption>';
        }

        if ($sections['head']) {
            $markup .= '<thead class="vf-table__head">' . $context->slot('header')->value() . '</thead>';
        }

        if ($sections['body']) {
            $markup .= '<tbody class="vf-table__body">' . $context->slot('default')->value() . '</tbody>';
        }

        if ($sections['foot']) {
            $markup .= '<tfoot class="vf-table__foot">' . $context->slot('footer')->value() . '</tfoot>';
        }

        return RenderedHtml::fromTrustedString($markup . '</table></div></div>');
    }

    /**
     * Props that are not component props fall through to the wrapper.
     *
     * The path a consumer id, role, tabindex, data-* or accessible name
     * travels - onto div.vf-table-wrap, never the scroll container or the
     * table.
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
                sprintf('The [%s] attribute of vf-table must be a scalar or null.', $name),
            );
        }

        return $forwarded;
    }

    /** A boolean prop by its template spelling, or by the camelCase alias the PHP API also accepts. */
    private function booleanProp(ComponentRenderContext $context, string $name, ?string $alias = null): bool
    {
        $value = $context->prop($name) ?? ($alias !== null ? $context->prop($alias) : null);

        if ($value === null) {
            return false;
        }

        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            return !in_array($value, ['false', '0', ''], true);
        }

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-table must be a boolean.', $name));
    }

    /** A string prop, or null when absent. The empty string is kept for the rule to reject. */
    private function stringProp(ComponentRenderContext $context, string $name): ?string
    {
        $value = $context->prop($name);

        if ($value === null || $value === false) {
            return null;
        }

        if (is_string($value) || is_int($value) || is_float($value)) {
            return (string) $value;
        }

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-table must be a string.', $name));
    }
}
