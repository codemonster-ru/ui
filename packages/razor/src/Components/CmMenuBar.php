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
 * Keyboard behaviour belongs to the runtime controller, which reads runtime/src/core/menu-bar.ts.
 * This side renders the open path a server can know, with submenus present but hidden so the whole
 * menu is in the markup.
 */
final class CmMenuBar implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $items = $this->normalizeItems($props->array('items'));
        $requested = $props->nullableArray('openPath');
        $openPath = $requested === null
            ? []
            : array_values(array_filter($requested, static fn (mixed $value): bool => is_string($value)));

        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-menu-bar')
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.menu-bar', [
            'nodes' => $this->buildNodes($items, 0, $openPath),
            'ariaLabel' => $props->string('ariaLabel', 'Main menu'),
            'classes' => $classes,
            'attributes' => $attributes->without(['class', 'aria-label', 'data-cm-controller'])->render(),
        ]), "\r\n"));
    }

    /**
     * @param list<array<string, mixed>> $items
     * @param list<string> $openPath
     *
     * @return list<array<string, mixed>>
     */
    private function buildNodes(array $items, int $depth, array $openPath): array
    {
        $nodes = [];

        foreach ($items as $item) {
            /** @var list<array<string, mixed>> $children */
            $children = $item['children'];
            $isBranch = $children !== [];
            $isOpen = in_array($item['value'], $openPath, true);
            $isLink = $item['href'] !== null;

            $nodeClasses = (new ClassBuilder())
                ->add('cm-menu-bar__node', "cm-menu-bar__node--depth-{$depth}")
                ->addWhen($isBranch, 'cm-menu-bar__node--branch')
                ->addWhen($isOpen, 'cm-menu-bar__node--open')
                ->value();

            $itemClasses = (new ClassBuilder())
                ->add('cm-menu-bar__item')
                ->addWhen($isBranch, 'cm-menu-bar__item--branch')
                ->addWhen($depth === 0, 'cm-menu-bar__item--top')
                ->addWhen($isBranch && $isOpen, 'cm-menu-bar__item--open')
                ->value();

            $nodes[] = [
                'branch' => $isBranch,
                'tag' => $isLink ? 'a' : 'button',
                'value' => $item['value'],
                'label' => $item['label'],
                'depth' => $depth,
                'href' => $isLink && !$item['disabled'] ? $item['href'] : null,
                'target' => $isLink ? $item['target'] : null,
                'rel' => $isLink ? $item['rel'] : null,
                'open' => $isOpen,
                'disabled' => $item['disabled'],
                'ariaDisabled' => $isLink && $item['disabled'],
                'nativeDisabled' => !$isLink && !$isBranch && $item['disabled'],
                'nodeClasses' => $nodeClasses,
                'itemClasses' => $itemClasses,
                'children' => $isBranch ? $this->buildNodes($children, $depth + 1, $openPath) : [],
            ];
        }

        return $nodes;
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
                throw new InvalidArgumentException('MenuBar items require a non-empty value and a label.');
            }

            $children = $item['children'] ?? [];
            $normalized[] = [
                'value' => $item['value'],
                'label' => $item['label'],
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
