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
 * The step rules are a port of runtime/src/core/stepper.ts. Keyboard navigation belongs to the
 * runtime controller; this side renders the state a server can know.
 */
final class CmStepper implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $items = $this->normalizeItems($props->array('items'));
        $active = $this->resolveActiveValue($items, $props->nullableString('value'));
        $orientation = $props->oneOf('orientation', ['horizontal', 'vertical'], 'horizontal');
        $contentPosition = $props->oneOf('contentPosition', ['bottom', 'inline'], 'bottom');
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-stepper')
            ->addWhen($orientation !== 'horizontal', "cm-stepper--{$orientation}")
            ->addWhen($contentPosition !== 'bottom', "cm-stepper--content-{$contentPosition}")
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        $styles = ['--cm-stepper-item-count: ' . count($items)];
        $progress = $this->resolveProgress($items, $active);
        if ($progress !== null) {
            $styles[] = '--cm-stepper-progress-factor: ' . $this->formatFactor($progress);
        }

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.stepper', [
            'items' => array_map(
                fn (array $item, int $index): array => $item + [
                    'index' => $index + 1,
                    'state' => $this->resolveStepState($items, $active, $item['value']),
                ],
                $items,
                array_keys($items),
            ),
            'ariaLabel' => $props->string('ariaLabel', 'Progress'),
            'classes' => $classes,
            'style' => implode('; ', $styles),
            'attributes' => $attributes->without(['class', 'style', 'aria-label', 'data-cm-controller'])->render(),
        ]), "\r\n"));
    }

    /**
     * @param list<array{value: string, label: string, description: ?string, disabled: bool}> $items
     */
    private function resolveActiveValue(array $items, ?string $requested): ?string
    {
        $enabled = array_values(array_filter($items, static fn (array $item): bool => !$item['disabled']));

        foreach ($enabled as $item) {
            if ($item['value'] === $requested) {
                return $requested;
            }
        }

        return $enabled[0]['value'] ?? null;
    }

    /**
     * @param list<array{value: string, label: string, description: ?string, disabled: bool}> $items
     */
    private function resolveProgress(array $items, ?string $active): ?float
    {
        if (count($items) < 2) {
            return null;
        }

        foreach ($items as $index => $item) {
            if ($item['value'] === $active) {
                return $index / (count($items) - 1);
            }
        }

        return null;
    }

    /**
     * @param list<array{value: string, label: string, description: ?string, disabled: bool}> $items
     */
    private function resolveStepState(array $items, ?string $active, string $value): string
    {
        $activeIndex = null;
        $index = null;

        foreach ($items as $position => $item) {
            if ($item['value'] === $active) {
                $activeIndex = $position;
            }
            if ($item['value'] === $value) {
                $index = $position;
                if ($item['disabled']) {
                    return 'disabled';
                }
            }
        }

        if ($index === null) {
            return 'disabled';
        }
        if ($index === $activeIndex) {
            return 'current';
        }

        return $activeIndex !== null && $index < $activeIndex ? 'complete' : 'upcoming';
    }

    /** Trims a factor to the shortest form that still round-trips, matching JSON number output. */
    private function formatFactor(float $factor): string
    {
        return rtrim(rtrim(number_format($factor, 12, '.', ''), '0'), '.') ?: '0';
    }

    /**
     * @param array<mixed> $items
     *
     * @return list<array{value: string, label: string, description: ?string, disabled: bool}>
     */
    private function normalizeItems(array $items): array
    {
        $normalized = [];

        foreach ($items as $item) {
            if (!is_array($item) || !isset($item['value'], $item['label'])
                || !is_string($item['value']) || !is_string($item['label']) || $item['value'] === '') {
                throw new InvalidArgumentException('Stepper items require a non-empty value and a label.');
            }

            $description = $item['description'] ?? null;
            $normalized[] = [
                'value' => $item['value'],
                'label' => $item['label'],
                'description' => is_string($description) && $description !== '' ? $description : null,
                'disabled' => ($item['disabled'] ?? false) === true,
            ];
        }

        if ($normalized === []) {
            throw new InvalidArgumentException('Stepper requires items.');
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
