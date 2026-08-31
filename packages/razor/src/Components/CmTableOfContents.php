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
 * The heading-level and href rules are a port of runtime/src/core/table-of-contents.ts. The markup
 * works without JavaScript through native anchor navigation; smooth scrolling and the header offset
 * are the runtime's job and are carried as data attributes rather than rendered behaviour.
 */
final class CmTableOfContents implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $items = $this->normalizeItems($props->array('items'));
        $activeId = $props->nullableString('activeId');
        $variant = $props->oneOf('variant', ['default', 'pills'], 'default');
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-table-of-contents')
            ->addWhen($variant !== 'default', "cm-table-of-contents--{$variant}")
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.table-of-contents', [
            'items' => $items,
            'activeId' => $activeId,
            'ariaLabel' => $props->string('ariaLabel', 'Table of contents'),
            'classes' => $classes,
            'attributes' => $attributes->without(['class', 'aria-label'])->render(),
        ]), "\r\n"));
    }

    /**
     * @param array<mixed> $items
     *
     * @return list<array{id: string, label: string, level: int, href: string}>
     */
    private function normalizeItems(array $items): array
    {
        $normalized = [];

        foreach ($items as $item) {
            if (!is_array($item) || !isset($item['id'], $item['label'])
                || !is_string($item['id']) || !is_string($item['label']) || $item['id'] === '') {
                throw new InvalidArgumentException('TableOfContents items require a non-empty id and a label.');
            }

            $href = $item['href'] ?? null;
            $normalized[] = [
                'id' => $item['id'],
                'label' => $item['label'],
                'level' => $this->resolveHeadingLevel($item['level'] ?? null),
                'href' => is_string($href) && $href !== '' ? $href : '#' . $item['id'],
            ];
        }

        if ($normalized === []) {
            throw new InvalidArgumentException('TableOfContents requires items.');
        }

        return $normalized;
    }

    private function resolveHeadingLevel(mixed $level): int
    {
        if (!is_int($level) && !is_float($level)) {
            return 1;
        }

        $value = (int) $level;

        return $value < 1 ? 1 : min($value, 6);
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) {
            return $value;
        }

        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
