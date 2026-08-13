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

final class CmSkeleton implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $minHeight = $this->cssLength($props->stringOrNumber('min-height'));
        $radius = $props->oneOf('radius', ['control', 'surface', 'round'], 'surface');
        $animated = $props->bool('animated', true);
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-skeleton', "cm-skeleton--radius-{$radius}")
            ->addWhen($animated, 'cm-skeleton--animated')
            ->add($this->className($attributes))
            ->value();
        $consumerStyle = $attributes->get('style');
        if ($consumerStyle !== null && !is_string($consumerStyle)) {
            throw new InvalidArgumentException('Component attribute [style] must be a string.');
        }
        $style = implode('; ', array_filter([
            $consumerStyle === null ? null : rtrim($consumerStyle, '; '),
            $minHeight === null ? null : "min-height: {$minHeight}",
        ], static fn (?string $value): bool => $value !== null && $value !== ''));

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.skeleton', [
            'classes' => $classes,
            'style' => $style === '' ? null : $style,
            'attributes' => $attributes->without(['class', 'style', 'aria-hidden'])->render(),
        ]), "\r\n"));
    }

    private function cssLength(string|int|float|null $value): ?string
    {
        if ($value === null) return null;
        if (is_int($value) || is_float($value)) {
            if (!is_finite((float) $value) || $value < 0) throw new InvalidArgumentException('Skeleton min-height must be non-negative.');
            return "{$value}px";
        }
        if (preg_match('/^(?:0|(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em|%|vh|vw|dvh|dvw|ch|ex))$/D', $value) !== 1) {
            throw new InvalidArgumentException('Skeleton min-height must be a non-negative CSS length.');
        }
        return $value;
    }

    private function className(AttributeBag $attributes): ?string
    {
        $class = $attributes->get('class');
        if ($class === null || is_string($class)) return $class;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
