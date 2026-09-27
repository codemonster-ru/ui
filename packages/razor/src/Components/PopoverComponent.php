<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\PopoverState;

/**
 * Server-rendered VfPopover.
 *
 * The second migrated overlay, built the way the first was, and not a variant
 * of it: the reference's VfPopover and VfDropdown share a shape and no code.
 * Three layers:
 *
 *   1. The server output. The reference's `vf-popover` root and its trigger
 *      wrapper: the generated trigger id, `aria-controls` naming the content
 *      id, `aria-expanded`, `aria-haspopup="dialog"` and `tabindex="0"` -
 *      there is no disabled state. While closed the content does not exist,
 *      as under the reference's `v-if`, so `aria-controls` dangles as the
 *      reference's does, and the default slot's markup waits in an inert
 *      `<template data-vf-razor-popover="content">`. An initially open
 *      popover renders its `section[role=dialog][tabindex=-1]` in place, after
 *      the trigger, with the reference's unpositioned inline style: that is
 *      what the reference's own server render produces, and a component cannot
 *      write into <body> from where it is rendered.
 *   2. Without JavaScript. The state is truthful: a closed popover shows its
 *      trigger, announces `aria-expanded=false` and offers no content; an open
 *      one shows its content at the viewport's top left, where the reference's
 *      server render leaves it too. Nothing opens, closes, focuses or
 *      positions it.
 *   3. Enhanced. packages/razor/browser/popover.ts finds this root by its
 *      `data-vf-razor="popover"` marker and reproduces the reference's toggle,
 *      focus movement, outside click, Escape on the stack it shares with
 *      vf-dropdown, floater.js positioning, transition and the unmount of
 *      anything inside the content when it closes. Its configuration - the
 *      placement, the two dismissal switches and the teleport destination -
 *      travels as adapter metadata on the root, which the parity extractor
 *      drops by its prefix.
 *
 * Differences of spelling, not behaviour, the same as vf-dropdown's. There is
 * no controlled mode: `open` is read as the initial state (it still wins over
 * `default-open`) and the enhancement toggles on its own, dispatching
 * `vf-popover:open-change` where the reference emits update:open and
 * openChange. The slots are static: the reference's scoped slot props (`open`
 * and `toggle` for the trigger, `open` and `close` for the content) have no
 * server value to bind. `teleportTo: null` is spelled `teleport-to="false"`,
 * and there is no element to teleport to - only a selector.
 */
final class PopoverComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the root. */
    private const COMPONENT_PROPS = [
        'open',
        'default-open',
        'defaultOpen',
        'placement',
        'teleport-to',
        'teleportTo',
        'disable-teleport',
        'disableTeleport',
        'close-on-outside-click',
        'closeOnOutsideClick',
        'close-on-escape',
        'closeOnEscape',
        'class',
        'style',
    ];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $open = $this->nullableBooleanProp($context, 'open')
            ?? $this->nullableBooleanProp($context, 'default-open')
            ?? $this->nullableBooleanProp($context, 'defaultOpen')
            ?? false;
        $placement = $this->stringProp($context, 'placement') ?? 'bottom-start';
        $closeOnOutsideClick = $this->nullableBooleanProp($context, 'close-on-outside-click')
            ?? $this->nullableBooleanProp($context, 'closeOnOutsideClick')
            ?? true;
        $closeOnEscape = $this->nullableBooleanProp($context, 'close-on-escape')
            ?? $this->nullableBooleanProp($context, 'closeOnEscape')
            ?? true;
        $teleport = PopoverState::resolveTeleport(
            $this->teleportProp($context),
            $this->booleanProp($context, 'disable-teleport') || $this->booleanProp($context, 'disableTeleport'),
        );

        // The content id first, as the reference's two useId calls run.
        $contentId = FieldIds::next('vf-popover-content');
        $triggerId = FieldIds::next('vf-popover-trigger');
        $trigger = PopoverState::resolveTriggerState($open);

        $attributes = $this->forwardedAttributes($context);
        $attributes['class'] = Html::classes(['vf-popover', $this->stringProp($context, 'class') ?? '']);
        $attributes['style'] = $this->stringProp($context, 'style');
        // The ownership marker the browser controller mounts on, and the
        // configuration it runs with. Adapter metadata, not product: the
        // parity extractor drops every data-vf-razor attribute by its prefix.
        $attributes['data-vf-razor'] = 'popover';
        $attributes['data-vf-razor-popover-placement'] = $placement;
        $attributes['data-vf-razor-popover-close-on-outside-click'] = $closeOnOutsideClick ? 'true' : 'false';
        $attributes['data-vf-razor-popover-close-on-escape'] = $closeOnEscape ? 'true' : 'false';
        $attributes['data-vf-razor-popover-teleport'] = $teleport['disabled'] ? 'false' : $teleport['target'];

        $markup = '<div' . Html::attributes($attributes) . '>';

        // The trigger wrapper, in the reference's attribute order. No role:
        // the reference gives it none.
        $markup .= '<div' . Html::attributes([
            'id' => $triggerId,
            'class' => 'vf-popover__trigger',
            'aria-controls' => $contentId,
            'aria-expanded' => $trigger['ariaExpanded'],
            'aria-haspopup' => 'dialog',
            'tabindex' => '0',
        ]) . '>';
        $markup .= $context->hasSlot('trigger') ? $context->slot('trigger')->value() : '';
        $markup .= '</div>';

        $content = $context->hasSlot('default') ? $context->slot('default')->value() : '';

        if ($open) {
            // Unpositioned, as the reference's server render is: the inline
            // style is the zero position floater.js has not replaced yet.
            $markup .= '<section' . Html::attributes([
                'id' => $contentId,
                'class' => Html::classes(PopoverState::resolveContentClasses($placement)),
                'style' => 'left:0px;top:0px;',
                'aria-labelledby' => $triggerId,
                'role' => 'dialog',
                'tabindex' => '-1',
            ]) . '>'
                . '<span' . Html::attributes([
                    'class' => Html::classes(PopoverState::resolveArrowClasses($placement)),
                    'style' => 'left:0px;top:0px;',
                    'aria-hidden' => 'true',
                ]) . '></span>'
                . $content
                . '</section>';
        } else {
            // No content, as under v-if. It waits inert for the browser
            // controller; see the class docblock.
            $markup .= '<template data-vf-razor-popover="content">' . $content . '</template>';
        }

        return RenderedHtml::fromTrustedString($markup . '</div>');
    }

    /**
     * Props that are not component props fall through to the root, as the
     * reference's inherited attrs do - never onto the trigger or the content.
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
                sprintf('The [%s] attribute of vf-popover must be a scalar or null.', $name),
            );
        }

        return $forwarded;
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

        throw new \InvalidArgumentException('The [teleport-to] prop of vf-popover must be a selector string or false.');
    }

    /** A boolean prop, or null when the attribute was not given or was null. */
    private function nullableBooleanProp(ComponentRenderContext $context, string $name): ?bool
    {
        $value = $context->prop($name);

        if ($value === null) {
            return null;
        }

        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            return !in_array($value, ['false', '0', ''], true);
        }

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-popover must be a boolean.', $name));
    }

    private function booleanProp(ComponentRenderContext $context, string $name): bool
    {
        return $this->nullableBooleanProp($context, $name) ?? false;
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-popover must be a string.', $name));
    }
}
