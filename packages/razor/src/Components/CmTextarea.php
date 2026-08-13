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

final class CmTextarea implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $value = $props->string('value');
        $size = $props->oneOf('size', ['sm', 'md', 'lg'], 'md');
        $invalid = $props->bool('invalid');
        $disabled = $props->bool('disabled');
        $readonly = $props->bool('readonly');
        $required = $props->bool('required');
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-textarea', "cm-textarea--{$size}")
            ->addWhen($invalid, 'cm-textarea--invalid')
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.textarea', [
            'classes' => $classes,
            'attributes' => $attributes->without([
                'class', 'value', 'disabled', 'readonly', 'required', 'aria-invalid',
            ])->render(),
            'value' => $value,
            'invalid' => $invalid,
            'disabled' => $disabled,
            'readonly' => $readonly,
            'required' => $required,
        ]), "\r\n"));
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) return $value;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
