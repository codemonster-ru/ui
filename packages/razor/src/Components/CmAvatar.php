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

final class CmAvatar implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $image = $props->nullableString('image');
        $imageAlt = $props->string('image-alt');
        $label = $props->nullableString('label');
        $size = $props->oneOf('size', ['sm', 'md', 'lg'], 'md');
        $shape = $props->oneOf('shape', ['square', 'circle'], 'square');
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-avatar')
            ->addWhen($size !== 'md', "cm-avatar--{$size}")
            ->addWhen($shape === 'circle', 'cm-avatar--circle')
            ->add($this->className($attributes))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.avatar', [
            'classes' => $classes,
            'attributes' => $attributes->without(['class'])->render(),
            'image' => $image,
            'imageAlt' => $imageAlt,
            'label' => $label,
            'fallback' => $context->hasSlot('default') ? $context->slot('default') : null,
        ]), "\r\n"));
    }

    private function className(AttributeBag $attributes): ?string
    {
        $class = $attributes->get('class');
        if ($class === null || is_string($class)) return $class;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
