<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\Html;

/**
 * Server-rendered VfMenu.
 *
 * One `div.vf-menu[role=menu]` around whatever the host puts in it. No
 * browser controller, no enhancement, no hidden metadata, no marker: a
 * server-rendered container is the whole contract, and there is nothing for a
 * script to take over.
 *
 * It owns no interactive control. What a menu holds is the host's - either
 * `vf-menu-item`, which is its own component and accounts for its own
 * control, or arbitrary content - and this component neither counts it,
 * inspects it nor wires anything to it. It has no `role="menuitem"` query, no
 * click delegation and no keyboard handling, because the reference has none:
 * the arrow keys, Escape, focus-on-open and close-on-select people associate
 * with a menu belong to VfDropdown, which owns its own panel and its own
 * `role="menu"`, and which is not migrated.
 *
 * Two historical decisions are reproduced rather than corrected:
 *
 *   - `role="menu"` is *overridable*. The Vue template binds attrs last, so a
 *     consumer `role` replaces it, and the component does not protect its own
 *     role. That is the exact inverse of vf-menu-item, whose `role="menuitem"`
 *     cannot be overridden because it binds attrs first. Making the two agree
 *     is the tidying that breaks one of them;
 *   - the class attribute is the block class first and the consumer's class
 *     after it, as Vue merges a parent class onto an earlier binding. This is
 *     also the inverse of vf-menu-item, which merges the consumer's first.
 */
final class MenuComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the root. */
    private const COMPONENT_PROPS = ['class'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        // The component's own attributes are written first and the forwarded
        // ones over them, which is what makes a consumer `role` win: PHP keeps
        // an overwritten key in its original position, so `role` also stays
        // where the Vue template renders it.
        $attributes = [
            'class' => Html::classes(['vf-menu', $this->stringProp($context, 'class') ?? '']),
            'role' => 'menu',
        ];

        foreach ($this->forwardedAttributes($context) as $name => $value) {
            $attributes[$name] = $value;
        }

        return RenderedHtml::fromTrustedString(
            '<div' . Html::attributes($attributes) . '>'
                . ($context->hasSlot('default') ? $context->slot('default')->value() : '')
                . '</div>',
        );
    }

    /**
     * Props that are not component props fall through to the root.
     *
     * This is the whole prop surface of vf-menu apart from `class`: the Vue
     * component declares no props at all, so `id`, `style`, `tabindex`,
     * `role`, every `aria-*` and every `data-*` travel this path and the
     * component writes none of them itself.
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
                sprintf('The [%s] attribute of vf-menu must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-menu must be a string.', $name));
    }
}
