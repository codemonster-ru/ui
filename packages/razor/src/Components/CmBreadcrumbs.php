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

final class CmBreadcrumbs implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $items = $this->items($props->array('items'));
        $ariaLabel = $props->string('aria-label', 'Breadcrumb');
        if (trim($ariaLabel) === '') throw new InvalidArgumentException('Component prop [aria-label] must be non-empty.');

        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())->add('cm-breadcrumbs', $this->optionalString($attributes->get('class')))->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.breadcrumbs', [
            'items' => $items,
            'ariaLabel' => $ariaLabel,
            'separator' => $context->hasSlot('separator') ? $context->slot('separator') : '/',
            'classes' => $classes,
            'attributes' => $attributes->without(['class', 'aria-label'])->render(),
        ]), "\r\n"));
    }

    /**
     * @param array<mixed> $values
     * @return list<array{label: string, href: ?string, disabled: bool, current: bool}>
     */
    private function items(array $values): array
    {
        if ($values === []) throw new InvalidArgumentException('Component prop [items] must not be empty.');
        $currentCount = 0;
        $items = [];
        foreach ($values as $value) {
            if (!is_array($value)
                || !is_string($value['label'] ?? null)
                || trim($value['label']) === ''
                || (isset($value['href']) && (!is_string($value['href']) || trim($value['href']) === ''))
                || (isset($value['disabled']) && !is_bool($value['disabled']))
                || (isset($value['current']) && !is_bool($value['current']))) {
                throw new InvalidArgumentException('Component prop [items] contains an invalid Breadcrumb item.');
            }
            $current = $value['current'] ?? false;
            $currentCount += $current ? 1 : 0;
            $items[] = [
                'label' => $value['label'],
                'href' => $value['href'] ?? null,
                'disabled' => $value['disabled'] ?? false,
                'current' => $current,
            ];
        }
        if ($currentCount > 1) throw new InvalidArgumentException('Breadcrumbs allow at most one current item.');
        if ($currentCount === 0) {
            $lastIndex = count($items) - 1;
            $items[$lastIndex] = [...$items[$lastIndex], 'current' => true];
        }
        return $items;
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) return $value;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
