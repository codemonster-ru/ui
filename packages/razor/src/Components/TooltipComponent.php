<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\TooltipState;

/**
 * Server-rendered VfTooltip.
 *
 * The third migrated overlay, and not a variant of the popover: the
 * reference's VfTooltip owns no control, no disabled state and no keyboard
 * handling, and opens on a timer. Three layers:
 *
 *   1. The server output. The reference's `vf-tooltip` root span and its
 *      `vf-tooltip__trigger` span around the default slot - and nothing else.
 *      The reference's server render is always closed: no tooltip, no id, no
 *      `aria-describedby`. The tooltip's body - the `content` slot, or else
 *      the text, escaped - waits in an inert
 *      `<template data-vf-razor-tooltip="content">`, and only when there is
 *      one: an empty or absent text with no slot renders no template, which is
 *      how the browser controller knows an open tooltip has nothing to show
 *      and leaves its reference dangling, as the reference does. "0" and a
 *      whitespace-only text are content (TooltipState::resolveHasContent).
 *   2. Without JavaScript. The state is truthful and closed: the consumer's
 *      control is there, nothing describes it, and nothing opens. There is no
 *      `title` stand-in; hover and focus do nothing without the controller.
 *   3. Enhanced. packages/razor/browser/tooltip.ts finds this root by its
 *      `data-vf-razor="tooltip"` marker and reproduces the reference's four
 *      wrapper listeners, its one open timer, the description relationship,
 *      floater.js positioning, the transition and the teleport. Its
 *      configuration - the id the tooltip will carry, the placement, the delay
 *      and the destination - travels as adapter metadata on the root, which
 *      the parity extractor drops by its prefix.
 *
 * Differences of spelling, not behaviour, the same as vf-popover's. The props
 * are static: a server render has no reactive text, delay or placement to
 * change later. `teleportTo: null` is spelled `teleport-to="false"`, and there
 * is no element to teleport to - only a selector.
 */
final class TooltipComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the root. */
    private const COMPONENT_PROPS = [
        'text',
        'placement',
        'open-delay',
        'openDelay',
        'teleport-to',
        'teleportTo',
        'disable-teleport',
        'disableTeleport',
        'class',
        'style',
    ];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $text = $this->stringProp($context, 'text');
        $placement = $this->stringProp($context, 'placement') ?? 'top';
        $openDelay = $this->delayProp($context);
        $teleport = TooltipState::resolveTeleport(
            $this->teleportProp($context),
            $this->booleanProp($context, 'disable-teleport') || $this->booleanProp($context, 'disableTeleport'),
        );
        $hasContentSlot = $context->hasSlot('content');

        // Generated here, where every other adapter id is, and consumed whether
        // or not the tooltip ever opens - as the reference's useId is at setup.
        $tooltipId = FieldIds::next('vf-tooltip');

        $attributes = $this->forwardedAttributes($context);
        $attributes['class'] = Html::classes(['vf-tooltip', $this->stringProp($context, 'class') ?? '']);
        $attributes['style'] = $this->stringProp($context, 'style');
        // The ownership marker the browser controller mounts on, and the
        // configuration it runs with. Adapter metadata, not product: the
        // parity extractor drops every data-vf-razor attribute by its prefix.
        $attributes['data-vf-razor'] = 'tooltip';
        $attributes['data-vf-razor-tooltip-id'] = $tooltipId;
        $attributes['data-vf-razor-tooltip-placement'] = $placement;
        $attributes['data-vf-razor-tooltip-open-delay'] = $openDelay;
        $attributes['data-vf-razor-tooltip-teleport'] = $teleport['disabled'] ? 'false' : $teleport['target'];

        $markup = '<span' . Html::attributes($attributes) . '>'
            . '<span class="vf-tooltip__trigger">'
            . ($context->hasSlot('default') ? $context->slot('default')->value() : '')
            . '</span>';

        if (TooltipState::resolveHasContent($text, $hasContentSlot)) {
            // The slot wins over the text, as the reference's slot fallback does.
            $body = $hasContentSlot ? $context->slot('content')->value() : Html::escape((string) $text);
            $markup .= '<template data-vf-razor-tooltip="content">' . $body . '</template>';
        }

        return RenderedHtml::fromTrustedString($markup . '</span>');
    }

    /**
     * Props that are not component props fall through to the root, as the
     * reference's inherited attrs do - never onto the trigger or the tooltip.
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
                sprintf('The [%s] attribute of vf-tooltip must be a scalar or null.', $name),
            );
        }

        return $forwarded;
    }

    /** `open-delay`: milliseconds, TooltipState::OPEN_DELAY when not given. */
    private function delayProp(ComponentRenderContext $context): string
    {
        $value = $context->prop('open-delay') ?? $context->prop('openDelay');

        if ($value === null) {
            return (string) TooltipState::OPEN_DELAY;
        }

        if (is_int($value) || is_float($value) || (is_string($value) && is_numeric($value))) {
            return (string) (0 + $value);
        }

        throw new \InvalidArgumentException('The [open-delay] prop of vf-tooltip must be a number of milliseconds.');
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

        throw new \InvalidArgumentException('The [teleport-to] prop of vf-tooltip must be a selector string or false.');
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-tooltip must be a boolean.', $name));
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-tooltip must be a string.', $name));
    }
}
