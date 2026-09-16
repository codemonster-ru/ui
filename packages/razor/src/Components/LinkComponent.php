<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\Html;
use Codemonster\VueForge\Razor\Support\LinkState;

/**
 * Server-rendered VfLink.
 *
 * Renders the native branch of the Vue component: one `a.vf-link` carrying
 * `href`, `target` and `rel`, the underline and tone modifiers, and whatever
 * attributes a consumer forwards. No browser controller, no enhancement, no
 * hidden metadata: a server-rendered anchor is the whole contract, and the
 * browser does the rest natively.
 *
 * What this component deliberately does not have is the Vue component's other
 * branch. In Vue, a `to` prop selects a handoff to whatever the application
 * registers as `RouterLink`, and `component` replaces that target; the
 * resolved component then computes an href, matches a route, writes its
 * active classes and intercepts the click. None of that is VfLink's own
 * behaviour and none of it exists on a server that renders a page once. So
 * `to` and `component` are refused rather than accepted-and-ignored or turned
 * into an href: a template that wrote either was written for the Vue
 * adapter, and a silent translation would be this adapter inventing a
 * navigation contract the reference never had. A host that wants a routed
 * href computes it and passes `href`.
 *
 * Three historical decisions are reproduced rather than corrected:
 *
 *   - an anchor with no `href` is still an `<a>`, with no href, no role and no
 *     tabindex. It is inert and exposes nothing, exactly as the reference's
 *     no-destination anchor does. It is not given a placeholder;
 *   - `rel` is derived only for `target="_blank"` and only when no `rel` was
 *     given, and an explicit `rel` is written as given rather than merged;
 *   - the class attribute is the canonical classes first and the consumer's
 *     class after them, as Vue merges a parent class.
 */
final class LinkComponent implements ComponentInterface
{
    /** Props consumed by the component; everything else falls through to the anchor. */
    private const COMPONENT_PROPS = ['href', 'target', 'rel', 'underline', 'tone', 'class', 'style'];

    /** The Vue adapter's router-branch props, refused here by name. See the class docblock. */
    private const VUE_ONLY_PROPS = ['to', 'component'];

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        foreach (self::VUE_ONLY_PROPS as $name) {
            if ($context->prop($name) !== null) {
                throw new \InvalidArgumentException(sprintf(
                    'vf-link does not accept [%s]: the router branch belongs to the Vue adapter. Pass [href].',
                    $name,
                ));
            }
        }

        $href = $this->stringProp($context, 'href');
        $target = $this->stringProp($context, 'target');
        $underline = $this->stringProp($context, 'underline') ?? 'none';
        $tone = $this->stringProp($context, 'tone') ?? 'default';

        $attributes = $this->forwardedAttributes($context);
        // The link props are written after the forwarded attributes, in the
        // order the Vue template spreads them; the extractor sorts attributes,
        // so the order is a courtesy to a reader rather than a contract.
        $attributes['href'] = $href;
        $attributes['target'] = $target;
        $attributes['rel'] = LinkState::resolveRel($this->stringProp($context, 'rel'), $target);
        $attributes['class'] = Html::classes([
            Html::classes(LinkState::resolveClasses($underline, $tone)),
            $this->stringProp($context, 'class') ?? '',
        ]);
        $attributes['style'] = $this->stringProp($context, 'style');

        return RenderedHtml::fromTrustedString(
            '<a' . Html::attributes($attributes) . '>'
                . ($context->hasSlot('default') ? $context->slot('default')->value() : '')
                . '</a>',
        );
    }

    /**
     * Props that are not component props fall through to the anchor.
     *
     * This is the path `download`, `hreflang`, `referrerpolicy`, `title`, a
     * consumer `id`, `tabindex`, `role`, every `aria-*` and every `data-*`
     * travel; the component writes none of them itself.
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
                sprintf('The [%s] attribute of vf-link must be a scalar or null.', $name),
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

        throw new \InvalidArgumentException(sprintf('The [%s] prop of vf-link must be a string.', $name));
    }
}
