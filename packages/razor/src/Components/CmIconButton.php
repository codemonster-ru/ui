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

final class CmIconButton implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views) {}

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $label = $props->string('label');
        if (trim($label) === '') {
            throw new InvalidArgumentException('Component prop [label] must be a non-empty string.');
        }

        $variant = $props->oneOf('variant', ['primary', 'secondary', 'danger', 'ghost'], 'ghost');
        $size = $props->oneOf('size', ['sm', 'md', 'lg'], 'md');
        $type = $props->oneOf('type', ['button', 'submit', 'reset'], 'button');
        $disabled = $props->bool('disabled');
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-icon-button', "cm-icon-button--{$variant}", "cm-icon-button--{$size}")
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString($this->views->render('components.icon-button', [
            'label' => $label,
            'variant' => $variant,
            'size' => $size,
            'type' => $type,
            'disabled' => $disabled,
            'classes' => $classes,
            'attributes' => $attributes->without(['class', 'type', 'disabled', 'aria-label'])->render(),
            'icon' => $context->slot('default'),
        ]));
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) return $value;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
