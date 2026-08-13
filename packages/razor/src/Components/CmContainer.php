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

final readonly class CmContainer implements ComponentInterface
{
    public function __construct(private EngineInterface $views) {}

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $element = $props->oneOf('element', ['div', 'main', 'section'], 'div');
        $size = $props->nullableString('size');
        if ($size !== null && !in_array($size, ['md', 'lg', 'xl', '2xl'], true)) {
            throw new InvalidArgumentException('Component prop [size] must be one of [md, lg, xl, 2xl] or null.');
        }
        $fluid = $props->bool('fluid');
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())->add('cm-container')
            ->addWhen($fluid, 'cm-container--fluid')->add(!$fluid && $size !== null ? "cm-container--{$size}" : null)
            ->add($this->className($attributes))->value();
        return $this->renderPrimitive($element, $classes, $attributes, $context);
    }

    private function renderPrimitive(
        string $element,
        string $classes,
        AttributeBag $attributes,
        ComponentRenderContext $context,
    ): RenderedHtml {
        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.layout-primitive', [
            'element' => $element, 'classes' => $classes, 'attributes' => $attributes->without(['class'])->render(),
            'content' => $context->slot('default'),
        ]), "\r\n"));
    }

    private function className(AttributeBag $attributes): ?string
    {
        $class = $attributes->get('class');
        if ($class === null || is_string($class)) return $class;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
