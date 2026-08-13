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

final class CmButton implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $variant = $props->oneOf('variant', ['primary', 'secondary', 'danger', 'ghost'], 'primary');
        $size = $props->oneOf('size', ['sm', 'md', 'lg'], 'md');
        $type = $props->oneOf('type', ['button', 'submit', 'reset'], 'button');
        $href = $props->nullableString('href');
        $disabled = $props->bool('disabled');
        $loading = $props->bool('loading');
        $isLink = $href !== null && $href !== '';
        $isDisabled = $disabled || $loading;
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-button', "cm-button--{$variant}", "cm-button--{$size}")
            ->add($this->optionalString($attributes->get('class')))
            ->value();
        $rootAttributes = $attributes->without(['class', 'role', 'aria-disabled', 'aria-busy'])->render();
        return RenderedHtml::fromTrustedString(
            $this->views->render('components.button', [
                'classes' => $classes,
                'type' => $type,
                'href' => $href,
                'isLink' => $isLink,
                'isDisabled' => $isDisabled,
                'loading' => $loading,
                'attributes' => $rootAttributes,
                'label' => $context->slot('default'),
                'leading' => $context->hasSlot('leading') ? $context->slot('leading') : null,
                'trailing' => $context->hasSlot('trailing') ? $context->slot('trailing') : null,
            ]),
        );
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (!is_string($value)) {
            throw new \InvalidArgumentException('Component attribute [class] must be a string.');
        }

        return $value;
    }
}
