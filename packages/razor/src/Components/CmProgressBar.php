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

final readonly class CmProgressBar implements ComponentInterface
{
    public function __construct(private EngineInterface $views) {}

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $label = $props->string('label');
        if (trim($label) === '') throw new InvalidArgumentException('ProgressBar label must be a non-empty string.');
        $value = $this->number($props->stringOrNumber('value', 0), 'value');
        $max = $this->number($props->stringOrNumber('max', 100), 'max');
        $normalizedMax = is_finite($max) && $max > 0 ? $max : 100.0;
        $normalizedValue = !is_finite($value) ? 0.0 : min(max($value, 0.0), $normalizedMax);
        $percentage = ($normalizedValue / $normalizedMax) * 100;
        $indeterminate = $props->bool('indeterminate');
        $showValue = $props->bool('show-value');
        $tone = $props->oneOf(
            'tone',
            ['neutral', 'primary', 'success', 'info', 'warning', 'help', 'danger', 'contrast'],
            'primary',
        );
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-progress-bar')
            ->addWhen($indeterminate, 'cm-progress-bar--indeterminate')
            ->addWhen($tone !== 'primary', "cm-progress-bar--{$tone}")
            ->add($this->className($attributes))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.progress-bar', [
            'label' => $label,
            'max' => $this->formatNumber($normalizedMax),
            'value' => $this->formatNumber($normalizedValue),
            'percentage' => $this->formatNumber($percentage),
            'valueLabel' => (string) round($percentage) . '%',
            'indeterminate' => $indeterminate,
            'showValue' => $showValue,
            'classes' => $classes,
            'attributes' => $attributes->without([
                'class', 'role', 'aria-label', 'aria-valuemin', 'aria-valuemax', 'aria-valuenow',
            ])->render(),
        ]), "\r\n"));
    }

    private function number(string|int|float|null $value, string $prop): float
    {
        if (is_int($value) || is_float($value)) return (float) $value;
        if (is_string($value) && is_numeric($value)) return (float) $value;
        throw new InvalidArgumentException("Component prop [{$prop}] must be a number.");
    }

    private function formatNumber(float $value): string
    {
        if (is_finite($value) && floor($value) === $value) return (string) (int) $value;
        return rtrim(rtrim(sprintf('%.12F', $value), '0'), '.');
    }

    private function className(AttributeBag $attributes): ?string
    {
        $class = $attributes->get('class');
        if ($class === null || is_string($class)) return $class;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
