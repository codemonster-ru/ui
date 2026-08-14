<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\Support\AttributeBag;
use Codemonster\Ui\Support\ClassBuilder;
use Codemonster\Ui\Support\MenuItems;
use Codemonster\Ui\Support\PropBag;
use Codemonster\View\EngineInterface;
use InvalidArgumentException;

final class CmMenu implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $items = MenuItems::normalize($props->array('items'));
        $ariaLabel = $props->string('aria-label', 'Actions');
        $attributes = new AttributeBag($props->remaining());
        $labelledBy = $attributes->get('aria-labelledby');
        if ($labelledBy !== null && !is_string($labelledBy)) {
            throw new InvalidArgumentException('Component attribute [aria-labelledby] must be a string.');
        }
        if ($labelledBy === null && trim($ariaLabel) === '') {
            throw new InvalidArgumentException('Component prop [aria-label] must be non-empty.');
        }
        $classes = (new ClassBuilder())->add('cm-menu', $this->optionalString($attributes->get('class')))->value();

        $renderItems = array_map(function (array $item) use ($context): array {
            $slot = $this->itemSlotName($item['id']);
            return [...$item, 'content' => $context->hasSlot($slot) ? $context->slot($slot) : $item['label']];
        }, $items);

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.menu', [
            'items' => $renderItems,
            'ariaLabel' => $labelledBy === null ? $ariaLabel : null,
            'classes' => $classes,
            'attributes' => $attributes->without(['class', 'role', 'aria-label', 'data-cm-controller'])->render(),
        ]), "\r\n"));
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) return $value;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }

    private function itemSlotName(string $id): string
    {
        return 'item' . implode('', array_map(
            static fn (string $part): string => ucfirst($part),
            explode('-', $id),
        ));
    }
}
