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

final class CmTabs implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $id = $props->string('id');
        $items = $this->items($props->array('items'));
        $requested = $props->nullableString('value');
        if (trim($id) === '') throw new InvalidArgumentException('Component prop [id] must be non-empty.');
        $active = null;
        foreach ($items as $item) {
            if ($active === null && !$item['disabled']) {
                $active = $item;
            }
            if (!$item['disabled'] && $item['value'] === $requested) {
                $active = $item;
                break;
            }
        }
        if ($active === null) throw new InvalidArgumentException('Tabs require at least one enabled item.');
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())->add('cm-tabs', $this->optionalString($attributes->get('class')))->value();

        $renderItems = [];
        foreach ($items as $item) {
            $renderItems[] = [...$item, 'active' => $item['value'] === $active['value']];
        }

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.tabs', [
            'id' => $id,
            'items' => $renderItems,
            'activeValue' => $active['value'],
            'classes' => $classes,
            'attributes' => $attributes->without(['class', 'data-cm-controller', 'data-cm-tabs-value'])->render(),
        ]), "\r\n"));
    }

    /**
     * @param array<mixed> $values
     * @return list<array{value: string, label: string, content: string, disabled: bool}>
     */
    private function items(array $values): array
    {
        $items = [];
        $ids = [];
        foreach ($values as $value) {
            if (!is_array($value)
                || !is_string($value['value'] ?? null)
                || preg_match('/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/D', $value['value']) !== 1
                || isset($ids[$value['value']])
                || !is_string($value['label'] ?? null)
                || trim($value['label']) === ''
                || !is_string($value['content'] ?? null)
                || (isset($value['disabled']) && !is_bool($value['disabled']))) {
                throw new InvalidArgumentException('Component prop [items] contains an invalid Tab item.');
            }
            $ids[$value['value']] = true;
            $items[] = [
                'value' => $value['value'],
                'label' => $value['label'],
                'content' => $value['content'],
                'disabled' => $value['disabled'] ?? false,
            ];
        }
        $hasEnabledItem = false;
        foreach ($items as $item) {
            if (!$item['disabled']) {
                $hasEnabledItem = true;
                break;
            }
        }
        if (!$hasEnabledItem) {
            throw new InvalidArgumentException('Tabs require at least one enabled item.');
        }
        return $items;
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) return $value;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
