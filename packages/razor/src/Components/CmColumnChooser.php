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
 * The column rules are a port of runtime/src/core/data-table.ts. PHP cannot import the shared core,
 * so the canonical DOM comparison is what holds the two in step — see the component model notes.
 */
final class CmColumnChooser implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $id = $props->string('id');

        if (trim($id) === '') {
            throw new InvalidArgumentException('ColumnChooser id must be a non-empty string.');
        }

        $columns = $this->normalizeColumns($props->array('columns'));
        $columnKeys = array_map(static fn (array $column): string => $column['key'], $columns);
        $required = array_values(array_intersect($this->stringList($props->array('requiredColumnKeys')), $columnKeys));
        $requestedKeys = $props->nullableArray('visibleColumnKeys');
        $requested = $requestedKeys === null ? null : $this->stringList($requestedKeys);
        $visible = $this->resolveVisibleColumns($columnKeys, $requested, $required);
        $optional = array_values(array_diff($columnKeys, $required));
        $shown = count(array_intersect($optional, $visible));

        $disabled = $props->bool('disabled');
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-popover', 'cm-column-chooser')
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.column-chooser', [
            'id' => $id,
            'panelId' => "{$id}-panel",
            'columns' => $columns,
            'visible' => $visible,
            'required' => $required,
            'allChecked' => $optional === [] || $shown === count($optional),
            'allDisabled' => $disabled || $optional === [],
            'disabled' => $disabled,
            'triggerLabel' => $props->string('triggerLabel', 'Configure columns'),
            'allLabel' => $props->string('allLabel', 'All columns'),
            'trigger' => $context->hasSlot('trigger') ? $context->slot('trigger') : null,
            'classes' => $classes,
            'attributes' => $attributes->without(['class', 'data-cm-controller'])->render(),
        ]), "\r\n"));
    }

    /**
     * @param list<string> $columnKeys
     * @param list<string>|null $requested
     * @param list<string> $required
     *
     * @return list<string>
     */
    private function resolveVisibleColumns(array $columnKeys, ?array $requested, array $required): array
    {
        $wanted = $requested ?? $columnKeys;

        return array_values(array_filter(
            $columnKeys,
            static fn (string $key): bool => in_array($key, $wanted, true) || in_array($key, $required, true),
        ));
    }

    /**
     * Narrows a prop that arrives as `array<mixed>` to the list of strings the rules expect.
     *
     * @param array<mixed> $values
     *
     * @return list<string>
     */
    private function stringList(array $values): array
    {
        return array_values(array_filter($values, static fn (mixed $value): bool => is_string($value)));
    }

    /**
     * @param array<mixed> $columns
     *
     * @return list<array{key: string, header: string}>
     */
    private function normalizeColumns(array $columns): array
    {
        $normalized = [];

        foreach ($columns as $column) {
            if (!is_array($column) || !isset($column['key']) || !is_string($column['key']) || $column['key'] === '') {
                throw new InvalidArgumentException('ColumnChooser columns require a non-empty string key.');
            }

            $header = $column['header'] ?? null;
            $normalized[] = [
                'key' => $column['key'],
                'header' => is_string($header) && $header !== '' ? $header : $column['key'],
            ];
        }

        if ($normalized === []) {
            throw new InvalidArgumentException('ColumnChooser requires columns.');
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
