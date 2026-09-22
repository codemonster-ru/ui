<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\IconRenderer;
use Codemonster\VueForge\Razor\Support\MenuItemState;

/**
 * Server-rendered VfMenuItem.
 *
 * One control per item - an `a.vf-menu__item[role=menuitem]` when there is a
 * destination, a `button.vf-menu__item[type=button][role=menuitem]` otherwise
 * - with an optional leading glyph and a label span. No browser controller,
 * no enhancement, no marker: both branches are native HTML, and the browser
 * does activation, focus and the disabled state itself.
 *
 * Unlike VfLink and VfBreadcrumbs there is nothing to refuse here. The Vue
 * component has no `to`, no `component`, no RouterLink and no router import,
 * so there is no branch that belongs to the Vue adapter and no navigation
 * contract for this one to decline or invent.
 *
 * What this component cannot reproduce is the `select` emit. That is a Vue
 * framework event with no server analogue, and it is left alone rather than
 * simulated: no `data-select`, no synthetic browser event, no callback
 * protocol, no controller. A host that needs to act on an activation binds a
 * listener to the rendered control or lets the anchor navigate, which is what
 * the reference's own consumers do underneath the emit. The server DOM and
 * the browser's native semantics are the cross-platform contract; the emit is
 * characterised in the Vue suite and stays there.
 *
 * Six historical decisions are reproduced rather than corrected:
 *
 *   - the branch test is truthiness. `href=""` renders the *button*, where
 *     VfLink keeps `href=""` on its anchor. The two are not made to agree;
 *   - `rel` is written exactly as given. There is no `_blank` derivation, so
 *     LinkState::resolveRel is deliberately not called: it would add an
 *     attribute the reference never writes;
 *   - a disabled anchor drops its `href` but keeps `target` and `rel`, takes
 *     `aria-disabled` and `tabindex="-1"`, and never takes the `disabled`
 *     attribute - which a disabled button does take, along with
 *     `aria-disabled` and no tabindex at all;
 *   - there is no `--disabled` modifier class on either branch;
 *   - the component's own bindings win over forwarded attributes, because the
 *     Vue template binds attrs *first*. A consumer `role` cannot override
 *     `role="menuitem"`, and on an enabled anchor a consumer `tabindex` is
 *     dropped, because the Vue component binds `undefined` over it. On the
 *     button branch it survives, because that branch binds no tabindex. This
 *     is the exact inverse of vf-menu, whose consumer `role` does win;
 *   - the class attribute is the consumer's class *first* and the canonical
 *     classes after it, which is also the inverse of vf-menu and vf-link.
 */
final class MenuItemComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the control. */
    private const COMPONENT_PROPS = ['label', 'icon', 'disabled', 'active', 'tone', 'href', 'target', 'rel', 'class'];

    /**
     * The size the Vue component's icon renders at.
     *
     * VfMenuItem passes no `size` to the icon component, so the glyph takes
     * that component's default. Written out here because the Razor renderer
     * has no defaults of its own.
     */
    private const ICON_SIZE = 'var(--vf-icon-current-size, var(--vf-icon-size-md))';

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $label = $this->stringProp($context, 'label') ?? '';
        $href = $this->stringProp($context, 'href');
        $target = $this->stringProp($context, 'target');
        $rel = $this->stringProp($context, 'rel');
        $icon = $this->stringProp($context, 'icon');
        $disabled = $this->boolProp($context, 'disabled');
        $active = $this->boolProp($context, 'active');
        $tone = $this->stringProp($context, 'tone') ?? 'default';

        // The consumer's class comes first, as the Vue component's attrs-first
        // binding makes it.
        $class = Html::classes([
            $this->stringProp($context, 'class') ?? '',
            Html::classes(MenuItemState::resolveClasses($active, $tone)),
        ]);

        $content = ($icon === null || $icon === ''
            ? ''
            // The extra class lands on the inner svg, not on the wrapper span,
            // because that is where the Vue icon component spreads its attrs.
            : IconRenderer::render(MenuItemState::resolveIconName($icon), self::ICON_SIZE, true, 'vf-menu__item-icon'))
            . '<span class="vf-menu__item-label">' . Html::escape($label) . '</span>';

        // Forwarded first, the component's own over them, in the order the Vue
        // template binds them; the extractor sorts attributes, so the order is
        // a courtesy to a reader rather than a contract.
        $attributes = $this->forwardedAttributes($context);

        if (MenuItemState::isLink($href)) {
            $attributes['class'] = $class;
            $attributes['href'] = $disabled ? null : $href;
            $attributes['target'] = $target;
            $attributes['rel'] = $rel;
            $attributes['aria-disabled'] = $disabled ? 'true' : null;
            // Binding undefined over a forwarded tabindex removes it, which is
            // what the Vue component does on an enabled anchor. The null here
            // is that removal, not an omission.
            $attributes['tabindex'] = $disabled ? '-1' : null;
            $attributes['role'] = 'menuitem';

            return RenderedHtml::fromTrustedString('<a' . Html::attributes($attributes) . '>' . $content . '</a>');
        }

        $attributes['class'] = $class;
        $attributes['type'] = 'button';
        $attributes['disabled'] = $disabled;
        $attributes['aria-disabled'] = $disabled ? 'true' : null;
        $attributes['role'] = 'menuitem';

        return RenderedHtml::fromTrustedString('<button' . Html::attributes($attributes) . '>' . $content . '</button>');
    }

    /**
     * Props that are not component props fall through to the control.
     *
     * This is the path a consumer `id`, `style`, `tabindex`, `role`, every
     * `aria-*` and every `data-*` travel. The component overwrites the ones it
     * binds itself, which is what makes `role="menuitem"` unoverridable.
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
                sprintf('The [%s] attribute of vf-menu-item must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-menu-item must be a string.', $name));
    }

    private function boolProp(ComponentRenderContext $context, string $name): bool
    {
        $value = $context->prop($name, false);

        return $value !== false && $value !== null && $value !== '' && $value !== 'false';
    }
}
