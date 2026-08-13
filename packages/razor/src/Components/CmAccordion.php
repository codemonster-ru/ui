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

final class CmAccordion implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $id = $props->string('id');
        $items = $this->items($props->array('items'));
        $openItems = $props->nullableArray('open-items');
        $defaultOpenItems = $props->array('default-open-items');
        $multiple = $props->bool('multiple');

        if (trim($id) === '') {
            throw new InvalidArgumentException('Component prop [id] must be a non-empty string.');
        }

        $open = $this->openItems($openItems ?? $defaultOpenItems, $items, $multiple);
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-accordion')
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.accordion', [
            'id' => $id,
            'items' => array_map(
                static function (array $item) use ($open): array {
                    $isOpen = in_array($item['id'], $open, true);

                    return [...$item, 'open' => $isOpen, 'expanded' => $isOpen ? 'true' : 'false'];
                },
                $items,
            ),
            'multiple' => $multiple,
            'classes' => $classes,
            'attributes' => $attributes->without([
                'class',
                'data-cm-controller',
                'data-cm-accordion-multiple',
            ])->render(),
        ]), "\r\n"));
    }

    /**
     * @param array<mixed> $values
     * @return list<array{id: string, title: string, content: string, disabled: bool}>
     */
    private function items(array $values): array
    {
        $items = [];
        $ids = [];

        foreach ($values as $value) {
            if (!is_array($value)
                || !is_string($value['id'] ?? null)
                || preg_match('/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/D', $value['id']) !== 1
                || !is_string($value['title'] ?? null)
                || trim($value['title']) === ''
                || !is_string($value['content'] ?? null)
                || (isset($value['disabled']) && !is_bool($value['disabled']))) {
                throw new InvalidArgumentException('Component prop [items] contains an invalid Accordion item.');
            }

            if (isset($ids[$value['id']])) {
                throw new InvalidArgumentException("Component prop [items] contains duplicate id [{$value['id']}].");
            }

            $ids[$value['id']] = true;
            $items[] = [
                'id' => $value['id'],
                'title' => $value['title'],
                'content' => $value['content'],
                'disabled' => $value['disabled'] ?? false,
            ];
        }

        return $items;
    }

    /**
     * @param array<mixed> $requested
     * @param list<array{id: string, title: string, content: string, disabled: bool}> $items
     * @return list<string>
     */
    private function openItems(array $requested, array $items, bool $multiple): array
    {
        foreach ($requested as $id) {
            if (!is_string($id)) {
                throw new InvalidArgumentException('Accordion open item ids must be strings.');
            }
        }

        $open = [];
        foreach ($items as $item) {
            if (!$item['disabled'] && in_array($item['id'], $requested, true)) {
                $open[] = $item['id'];
            }
        }

        return $multiple ? $open : array_slice($open, 0, 1);
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) {
            return $value;
        }

        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
