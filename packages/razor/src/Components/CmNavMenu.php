<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\Support\AttributeBag;
use Codemonster\Ui\Support\ClassBuilder;
use Codemonster\Ui\Support\PropBag;
use Codemonster\View\EngineInterface;
use InvalidArgumentException;

/**
 * The tree rules are a port of runtime/src/core/tree.ts. The collapse wrapper is always rendered,
 * so a page without JavaScript shows the whole tree and CSS owns the open and closed states.
 */
final class CmNavMenu implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $items = $this->normalizeItems($props->array('items'));
        $active = $props->nullableString('value');
        $requested = $props->nullableArray('expandedValues');
        $expanded = $requested === null
            ? $this->expandToActive($items, [], $active)
            : array_values(array_filter($requested, static fn (mixed $value): bool => is_string($value)));

        $variant = $props->oneOf('variant', ['sidebar', 'inline'], 'sidebar');
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-nav-menu', "cm-nav-menu--{$variant}")
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.nav-menu', [
            'nodes' => $this->buildNodes($items, 0, $active, $expanded),
            'ariaLabel' => $props->string('ariaLabel', 'Main navigation'),
            'classes' => $classes,
            'attributes' => $attributes->without(['class', 'aria-label', 'data-cm-controller'])->render(),
        ]), "\r\n"));
    }

    /**
     * @param list<array<string, mixed>> $items
     * @param list<string> $expanded
     *
     * @return list<array<string, mixed>>
     */
    private function buildNodes(array $items, int $level, ?string $active, array $expanded): array
    {
        $nodes = [];

        foreach ($items as $item) {
            /** @var list<array<string, mixed>> $children */
            $children = $item['children'];
            $isGroup = $item['kind'] === 'group';
            $hasChildren = $children !== [];
            $isBranch = $hasChildren && !$isGroup;
            $isExpanded = $isGroup || in_array($item['value'], $expanded, true);
            $isActive = $item['value'] === $active;

            $nodeClasses = (new ClassBuilder())
                ->add('cm-nav-menu__node', "cm-nav-menu__node--level-{$level}")
                ->addWhen($isExpanded && !$isGroup, 'cm-nav-menu__node--expanded')
                ->addWhen($isActive, 'cm-nav-menu__node--active')
                ->value();

            $itemClasses = (new ClassBuilder())
                ->add('cm-nav-menu__item')
                ->addWhen($isBranch, 'cm-nav-menu__item--branch')
                ->addWhen($level === 0, 'cm-nav-menu__item--top')
                ->addWhen($isBranch && $isExpanded, 'cm-nav-menu__item--expanded')
                ->addWhen(!$isBranch && $isActive, 'cm-nav-menu__item--active')
                ->addWhen(!$isBranch && $item['disabled'], 'cm-nav-menu__item--disabled')
                ->value();

            $isLink = $item['href'] !== null;
            $nodes[] = [
                'kind' => $isGroup ? 'group' : ($isBranch ? 'branch' : 'leaf'),
                'tag' => $isLink ? 'a' : 'button',
                'value' => $item['value'],
                'label' => $item['label'],
                'level' => $level,
                'href' => $isLink && !$item['disabled'] ? $item['href'] : null,
                'target' => $isLink ? $item['target'] : null,
                'rel' => $isLink ? $item['rel'] : null,
                'active' => $isActive,
                'expanded' => $isExpanded,
                'disabled' => $item['disabled'],
                'ariaDisabled' => $isLink && $item['disabled'],
                'nativeDisabled' => !$isLink && !$isBranch && $item['disabled'],
                'nodeClasses' => $nodeClasses,
                'itemClasses' => $itemClasses,
                'children' => $hasChildren ? $this->buildNodes($children, $level + 1, $active, $expanded) : [],
            ];
        }

        return $nodes;
    }

    /**
     * @param list<array<string, mixed>> $items
     * @param list<string> $expanded
     *
     * @return list<string>
     */
    private function expandToActive(array $items, array $expanded, ?string $active): array
    {
        $ancestors = $this->collectAncestorValues($items, $active);

        return array_values(array_unique([...$expanded, ...$ancestors]));
    }

    /**
     * The branches that must be open for `$target` to be reachable, nearest ancestor last. The
     * target itself is not included.
     *
     * @param list<array<string, mixed>> $items
     * @param list<string> $parents
     *
     * @return list<string>
     */
    private function collectAncestorValues(array $items, ?string $target, array $parents = []): array
    {
        if ($target === null) {
            return [];
        }

        foreach ($items as $item) {
            if ($item['value'] === $target) {
                return $parents;
            }

            /** @var list<array<string, mixed>> $children */
            $children = $item['children'];
            if ($children === []) {
                continue;
            }

            /** @var string $value */
            $value = $item['value'];
            $found = $this->collectAncestorValues($children, $target, [...$parents, $value]);
            if ($found !== []) {
                return $found;
            }

            foreach ($children as $child) {
                if ($child['value'] === $target) {
                    return [...$parents, $value];
                }
            }
        }

        return [];
    }

    /**
     * @param array<mixed> $items
     *
     * @return list<array<string, mixed>>
     */
    private function normalizeItems(array $items): array
    {
        $normalized = [];

        foreach ($items as $item) {
            if (!is_array($item) || !isset($item['value'], $item['label'])
                || !is_string($item['value']) || !is_string($item['label']) || $item['value'] === '') {
                throw new InvalidArgumentException('NavMenu items require a non-empty value and a label.');
            }

            $children = $item['children'] ?? [];
            $normalized[] = [
                'value' => $item['value'],
                'label' => $item['label'],
                'kind' => ($item['kind'] ?? 'item') === 'group' ? 'group' : 'item',
                'href' => is_string($item['href'] ?? null) ? $item['href'] : null,
                'target' => is_string($item['target'] ?? null) ? $item['target'] : null,
                'rel' => is_string($item['rel'] ?? null) ? $item['rel'] : null,
                'disabled' => ($item['disabled'] ?? false) === true,
                'children' => is_array($children) ? $this->normalizeItems($children) : [],
            ];
        }

        return $normalized;
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) {
            return $value;
        }

        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
