<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\Support\GroupBoxState;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\IconRenderer;

/**
 * Server-rendered VfGroupBox.
 *
 * A native fieldset with the title on its border and, when collapsible, a
 * disclosure trigger in the legend. Three layers, reported separately because
 * they are separate:
 *
 *   1. The server output. The same `vf-group-box` markup the Vue adapter
 *      renders in the state the props resolve to: fieldset, legend when there
 *      is a title, the trigger when the group is collapsible, the content when
 *      it is open. The trigger is the canonical ghost VfButton: the same
 *      ButtonComponent instance the registry resolves for `<vf-button>` is
 *      handed in by VueForgeRazorProvider and called with exactly the props
 *      the reference template passes - id, aria-controls, aria-expanded,
 *      disabled, the group box's class and variant=ghost - which is the
 *      composition mechanism M17 and M20 established: one constructor
 *      parameter, one render() call. When closed the content does not exist,
 *      as under the reference's v-if, and the default slot waits in an inert
 *      `<template data-vf-razor-group-box="content">`.
 *   2. Without JavaScript. The initial state is truthful: a static group shows
 *      everything, an open one shows its content, a closed one announces
 *      aria-expanded=false and offers no content. The trigger is a
 *      `type="button"` with no form action and does nothing when pressed -
 *      which is exactly what the reference's server-rendered markup does
 *      before hydration. There is no `<details>` rewrite: the reference never
 *      had one, and it would change the element, the roles and the tree.
 *   3. Enhanced. packages/razor/browser/group-box.ts finds this root by its
 *      `data-vf-razor="group-box"` marker, reads the state from
 *      aria-expanded and toggles on the trigger's click - and only on the
 *      click: the reference has no keydown handler, and Enter and Space reach
 *      it as the browser's native button activation.
 *
 * Reproduced rather than corrected:
 *
 *   - the title test is JavaScript truthiness: "" is no title, "0" is one,
 *     and a title slot counts by its presence;
 *   - collapsible without a title renders the plain static group, and
 *     collapsed and default-collapsed are then ignored;
 *   - both ids are allocated on every render, trigger first, and the content
 *     carries its id in every mode, including the static ones where nothing
 *     references it;
 *   - while closed, aria-controls names the content id although no element
 *     carries it;
 *   - role=region and aria-labelledby only when collapsible;
 *   - `disabled` is consumed: the native attribute on the trigger and nothing
 *     on the fieldset, no aria-disabled, no modifier class;
 *   - the toggle-icon slot replaces the whole aria-hidden icon wrapper. A
 *     template spells it `toggleIcon`, the only form the engine's named-slot
 *     syntax accepts; see toggleIconSlot().
 *
 * Deliberately different, and documented as a platform divergence rather than
 * hidden (contracts/group-box/parity-policy.json, `platformDivergences`):
 * there is no controlled mode. A server-rendered group box has no parent to
 * emit a request to and wait on, so `collapsed` is read as the initial state
 * - it still wins over default-collapsed, as in the reference - and the
 * enhancement toggles on its own, dispatching `vf-group-box:collapsed-change`
 * so a host can observe what a Vue consumer observes through
 * update:collapsed. The scoped slot property `collapsed` has no counterpart
 * either: slots are rendered once, on the server.
 */
final class GroupBoxComponent implements ComponentInterface
{
    /** The literal size the reference passes to the icon component. */
    private const ICON_SIZE = 'var(--vf-icon-size-sm)';

    /** Props consumed by the component; everything else falls through to the fieldset. */
    private const COMPONENT_PROPS = [
        'title',
        'collapsible',
        'collapsed',
        'default-collapsed',
        'defaultCollapsed',
        'disabled',
        'class',
        'style',
    ];

    /**
     * @param ComponentInterface $button the canonical vf-button renderer
     */
    public function __construct(private readonly ComponentInterface $button)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $title = $this->stringProp($context, 'title');
        $hasTitle = GroupBoxState::hasTitle($title, $context->hasSlot('title'));
        $open = GroupBoxState::resolveOpen(
            $this->nullableBooleanProp($context, 'collapsed'),
            $this->nullableBooleanProp($context, 'default-collapsed')
                ?? $this->nullableBooleanProp($context, 'defaultCollapsed'),
        );
        $disabled = $this->booleanProp($context, 'disabled');
        $flags = GroupBoxState::resolveFlags($hasTitle, $this->booleanProp($context, 'collapsible'), $open, $disabled);

        // Both ids, trigger first, whatever renders: the reference calls
        // useId twice in setup, before it knows whether a trigger exists.
        $triggerId = FieldIds::next('vf-group-box-trigger');
        $contentId = FieldIds::next('vf-group-box-content');

        $attributes = [
            'class' => Html::classes([
                Html::classes(GroupBoxState::resolveClasses($hasTitle, $flags['collapsible'], $flags['collapsed'])),
                $this->stringProp($context, 'class') ?? '',
            ]),
            ...$this->forwardedAttributes($context),
        ];
        $attributes['style'] = $this->stringProp($context, 'style');
        // The ownership marker the browser controller mounts on. Adapter
        // metadata, not product: the parity extractor drops it by its prefix.
        $attributes['data-vf-razor'] = 'group-box';

        $markup = '<fieldset' . Html::attributes($attributes) . '>';

        if ($hasTitle) {
            // The title slot is fallback content for the prop; interpolated
            // text in the Vue template, so escaped here.
            $titleSpan = '<span class="vf-group-box__title">'
                . ($context->hasSlot('title') ? $context->slot('title')->value() : Html::escape($title ?? ''))
                . '</span>';

            $markup .= '<legend class="vf-group-box__legend">';
            $markup .= $flags['collapsible']
                ? $this->trigger($context, $triggerId, $contentId, $flags['collapsed'], $disabled, $titleSpan)
                : $titleSpan;
            $markup .= '</legend>';
        }

        $content = $context->hasSlot('default') ? $context->slot('default')->value() : '';

        if (!$flags['collapsed']) {
            $markup .= '<div' . Html::attributes([
                'id' => $contentId,
                'aria-labelledby' => $flags['collapsible'] ? $triggerId : null,
                'class' => 'vf-group-box__content',
                'role' => $flags['collapsible'] ? 'region' : null,
            ]) . '>' . $content . '</div>';
        } else {
            // No content, as under v-if. It waits inert for the browser
            // controller; see the class docblock.
            $markup .= '<template data-vf-razor-group-box="content">' . $content . '</template>';
        }

        return RenderedHtml::fromTrustedString($markup . '</fieldset>');
    }

    /**
     * The disclosure trigger: the canonical VfButton, called with exactly the
     * props the reference template passes it.
     *
     * The icon wrapper is the toggle-icon slot's fallback, so a consumer icon
     * replaces the whole aria-hidden span, as it does in the reference.
     */
    private function trigger(
        ComponentRenderContext $context,
        string $triggerId,
        string $contentId,
        bool $collapsed,
        bool $disabled,
        string $titleSpan,
    ): string {
        $iconSlot = self::toggleIconSlot($context);
        $icon = $iconSlot !== null
            ? $context->slot($iconSlot)->value()
            : '<span aria-hidden="true" class="vf-group-box__icon">'
                . IconRenderer::render('chevron-down', self::ICON_SIZE)
                . '</span>';

        return $this->button->render(new ComponentRenderContext(
            [
                'id' => $triggerId,
                'aria-controls' => $contentId,
                'aria-expanded' => $collapsed ? 'false' : 'true',
                'disabled' => $disabled,
                'class' => 'vf-group-box__trigger',
                'variant' => 'ghost',
            ],
            ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($icon . $titleSpan)],
        ))->value();
    }

    /**
     * The toggle-icon slot, by either spelling.
     *
     * The Vue slot is `toggle-icon`, and that is the name the PHP API takes.
     * A Razor template cannot declare it: the engine's named-slot syntax
     * accepts `[a-z][A-Za-z0-9]*` only, so `<razor-slot name="toggle-icon">`
     * is refused as malformed. The template spelling is `toggleIcon`, the same
     * way this adapter reads `default-collapsed` and `defaultCollapsed` as one
     * prop. Found by the M29 showcase; the rendered markup is identical.
     */
    private static function toggleIconSlot(ComponentRenderContext $context): ?string
    {
        foreach (['toggle-icon', 'toggleIcon'] as $name) {
            if ($context->hasSlot($name)) {
                return $name;
            }
        }

        return null;
    }

    /**
     * Props that are not component props fall through to the fieldset.
     *
     * This is the path a consumer id, name, form, role, data-* or accessible
     * name travels - onto the root, never the trigger or the content. A
     * consumer `aria-expanded` lands here too and leaves the trigger's own
     * alone. `disabled` never does: it is a component prop.
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
                sprintf('The [%s] attribute of vf-group-box must be a scalar or null.', $name),
            );
        }

        return $forwarded;
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-group-box must be a boolean.', $name));
    }

    private function booleanProp(ComponentRenderContext $context, string $name): bool
    {
        return $this->nullableBooleanProp($context, $name) ?? false;
    }

    /**
     * A string prop, or null when absent. The empty string is kept: it is a
     * title the rule rejects, not an absent one, and the difference is the
     * rule's to make.
     */
    private function stringProp(ComponentRenderContext $context, string $name): ?string
    {
        $value = $context->prop($name);

        if ($value === null || $value === false) {
            return null;
        }

        if (is_string($value) || is_int($value) || is_float($value)) {
            return (string) $value;
        }

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-group-box must be a string.', $name));
    }
}
