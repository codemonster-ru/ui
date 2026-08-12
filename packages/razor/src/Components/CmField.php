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

final class CmField implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $controlId = $props->string('control-id');
        if (trim($controlId) === '') {
            throw new InvalidArgumentException('Component prop [control-id] must be a non-empty string.');
        }

        $label = $props->nullableString('label');
        $description = $props->nullableString('description');
        $error = $props->nullableString('error');
        $required = $props->bool('required');
        $hasDescription = $context->hasSlot('description') || ($description !== null && $description !== '');
        $hasError = $context->hasSlot('error') || ($error !== null && $error !== '');
        $invalid = $props->bool('invalid') || $hasError;
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-field')
            ->addWhen($invalid, 'cm-field--invalid')
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString($this->views->render('components.field', [
            'controlId' => $controlId,
            'descriptionId' => "{$controlId}-description",
            'errorId' => "{$controlId}-error",
            'classes' => $classes,
            'attributes' => $attributes->without(['class'])->render(),
            'required' => $required,
            'label' => $context->hasSlot('label') ? $context->slot('label') : $label,
            'control' => $context->slot('default'),
            'description' => $context->hasSlot('description') ? $context->slot('description') : $description,
            'error' => $context->hasSlot('error') ? $context->slot('error') : $error,
            'hasDescription' => $hasDescription,
            'hasError' => $hasError,
        ]));
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) {
            return $value;
        }

        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
