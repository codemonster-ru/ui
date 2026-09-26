<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\DropdownState;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\Support\Html;

/**
 * Server-rendered VfDropdown.
 *
 * The first migrated overlay. Three layers, reported separately because they
 * are separate:
 *
 *   1. The server output. The reference's `vf-dropdown` root and its trigger
 *      wrapper, in the state the props resolve to: the generated trigger id,
 *      `aria-controls` naming the menu id, `aria-expanded`, `aria-haspopup`,
 *      `tabindex` and, when disabled, `aria-disabled`. While closed the menu
 *      does not exist - as under the reference's `v-if` - so `aria-controls`
 *      dangles, exactly as the reference's does, and the default slot's markup
 *      waits in an inert `<template data-vf-razor-dropdown="menu">`. An
 *      initially open dropdown renders its menu in place, after the trigger,
 *      with the reference's unpositioned inline style: that is what the
 *      reference's own server render produces, and a component cannot write
 *      into <body> from where it is rendered.
 *   2. Without JavaScript. The state is truthful: a closed dropdown shows its
 *      trigger, announces `aria-expanded=false` and offers no menu; an open one
 *      shows its menu at the viewport's top left, where the reference's server
 *      render leaves it too. Nothing opens or closes it and nothing positions
 *      it. This is documented, not papered over with a `<details>` rewrite the
 *      reference never had.
 *   3. Enhanced. packages/razor/browser/dropdown.ts finds this root by its
 *      `data-vf-razor="dropdown"` marker, teleports the menu, positions it with
 *      the bundled floater.js exactly as the reference calls it, and
 *      reproduces the reference's pointer, keyboard, Escape-stack, outside
 *      click, focus and transition behaviour. The configuration it needs - the
 *      placement, the variant, closeOnSelect and the teleport destination -
 *      travels as adapter metadata on the root, which the parity extractor
 *      drops by its prefix.
 *
 * Reproduced rather than corrected: the variant and the placement are written
 * through unvalidated, as the reference writes them; `aria-disabled` is "true"
 * or absent; a disabled dropdown renders closed whatever `open` or
 * `default-open` say; the menu id comes first from the generator, as the
 * reference's useId calls do.
 *
 * Differences of spelling, not behaviour. There is no controlled mode: a
 * server-rendered dropdown has no parent to emit a request to, so `open` is
 * read as the initial state and the enhancement toggles on its own,
 * dispatching `vf-dropdown:open-change` for every open and close the
 * reference emits. The slots are static: the reference's scoped slot props
 * (`open`, `toggle`, `disabled`, `close`) have no server value to bind. A null
 * attribute is "not given" by this adapter's convention, so the reference's
 * `teleportTo: null` is spelled `teleport-to="false"` here, and there is no
 * element to teleport to - only a selector.
 */
final class DropdownComponent implements ComponentInterface
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
        'close-on-select',
        'closeOnSelect',
        'variant',
        'disabled',
        'class',
        'style',
    ];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $disabled = $this->booleanProp($context, 'disabled');
        $requested = $this->nullableBooleanProp($context, 'open')
            ?? $this->nullableBooleanProp($context, 'default-open')
            ?? $this->nullableBooleanProp($context, 'defaultOpen')
            ?? false;
        $open = DropdownState::resolveOpen($disabled, $requested);
        $placement = $this->stringProp($context, 'placement') ?? 'bottom-start';
        $variant = $this->stringProp($context, 'variant') ?? 'default';
        $closeOnSelect = $this->nullableBooleanProp($context, 'close-on-select')
            ?? $this->nullableBooleanProp($context, 'closeOnSelect')
            ?? true;
        $teleport = DropdownState::resolveTeleport(
            $this->teleportProp($context),
            $this->booleanProp($context, 'disable-teleport') || $this->booleanProp($context, 'disableTeleport'),
        );

        // The menu id first, as the reference's two useId calls run.
        $menuId = FieldIds::next('vf-dropdown-menu');
        $triggerId = FieldIds::next('vf-dropdown-trigger');
        $trigger = DropdownState::resolveTriggerState($disabled, $open);

        $attributes = $this->forwardedAttributes($context);
        $attributes['class'] = Html::classes(['vf-dropdown', $this->stringProp($context, 'class') ?? '']);
        $attributes['style'] = $this->stringProp($context, 'style');
        // The ownership marker the browser controller mounts on, and the
        // configuration it runs with. Adapter metadata, not product: the
        // parity extractor drops every data-vf-razor attribute by its prefix.
        $attributes['data-vf-razor'] = 'dropdown';
        $attributes['data-vf-razor-dropdown-placement'] = $placement;
        $attributes['data-vf-razor-dropdown-variant'] = $variant;
        $attributes['data-vf-razor-dropdown-close-on-select'] = $closeOnSelect ? 'true' : 'false';
        $attributes['data-vf-razor-dropdown-teleport'] = $teleport['disabled'] ? 'false' : $teleport['target'];

        $markup = '<div' . Html::attributes($attributes) . '>';

        // The trigger wrapper, in the reference's attribute order. No role:
        // the reference gives it none, and Chrome exposes it as a generic,
        // focusable element with a menu popup.
        $markup .= '<div' . Html::attributes([
            'id' => $triggerId,
            'class' => 'vf-dropdown__trigger',
            'aria-controls' => $menuId,
            'aria-disabled' => $trigger['ariaDisabled'],
            'aria-expanded' => $trigger['ariaExpanded'],
            'aria-haspopup' => 'menu',
            'tabindex' => $trigger['tabindex'],
        ]) . '>';
        $markup .= $context->hasSlot('trigger') ? $context->slot('trigger')->value() : '';
        $markup .= '</div>';

        $content = $context->hasSlot('default') ? $context->slot('default')->value() : '';

        if ($open) {
            // Unpositioned, as the reference's server render is: the inline
            // style is the zero position floater.js has not replaced yet.
            $markup .= '<div' . Html::attributes([
                'id' => $menuId,
                'class' => Html::classes(DropdownState::resolveMenuClasses($variant, $placement)),
                'style' => 'left:0px;top:0px;',
                'aria-labelledby' => $triggerId,
                'role' => 'menu',
            ]) . '>'
                . '<span' . Html::attributes([
                    'class' => Html::classes(DropdownState::resolveArrowClasses($placement)),
                    'style' => 'left:0px;top:0px;',
                    'aria-hidden' => 'true',
                ]) . '></span>'
                . $content
                . '</div>';
        } else {
            // No menu, as under v-if. The content waits inert for the browser
            // controller; see the class docblock.
            $markup .= '<template data-vf-razor-dropdown="menu">' . $content . '</template>';
        }

        return RenderedHtml::fromTrustedString($markup . '</div>');
    }

    /**
     * Props that are not component props fall through to the root.
     *
     * This is the path a consumer id, role, data-* or accessible name travels -
     * onto the root, never the trigger or the menu, as the reference's
     * inherited attrs do.
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
                sprintf('The [%s] attribute of vf-dropdown must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException('The [teleport-to] prop of vf-dropdown must be a selector string or false.');
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-dropdown must be a boolean.', $name));
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-dropdown must be a string.', $name));
    }
}
