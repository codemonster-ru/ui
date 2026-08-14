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

final class CmFieldset implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $id = $this->requiredString($props, 'id');
        $label = $this->requiredString($props, 'label');
        $description = $props->nullableString('description');
        $error = $props->nullableString('error');
        $hasDescription = $context->hasSlot('description') || ($description !== null && $description !== '');
        $hasError = $context->hasSlot('error') || ($error !== null && $error !== '');
        $invalid = $props->bool('invalid') || $hasError;
        $descriptionId = "{$id}-description";
        $errorId = "{$id}-error";
        $describedBy = implode(' ', array_filter([
            $hasDescription ? $descriptionId : null,
            $hasError ? $errorId : null,
        ]));
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-fieldset')
            ->addWhen($invalid, 'cm-fieldset--invalid')
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.fieldset', [
            'id' => $id,
            'classes' => $classes,
            'attributes' => $attributes->without(['class', 'id', 'aria-describedby', 'aria-invalid'])->render(),
            'legend' => $context->hasSlot('legend') ? $context->slot('legend') : $label,
            'content' => $context->slot('default'),
            'description' => $context->hasSlot('description') ? $context->slot('description') : $description,
            'error' => $context->hasSlot('error') ? $context->slot('error') : $error,
            'descriptionId' => $descriptionId,
            'errorId' => $errorId,
            'describedBy' => $describedBy,
            'hasDescription' => $hasDescription,
            'hasError' => $hasError,
            'invalid' => $invalid,
        ]), "\r\n"));
    }

    private function requiredString(PropBag $props, string $name): string
    {
        $value = $props->string($name);
        if (trim($value) === '') {
            throw new InvalidArgumentException("Component prop [{$name}] must be a non-empty string.");
        }

        return $value;
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) {
            return $value;
        }

        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
