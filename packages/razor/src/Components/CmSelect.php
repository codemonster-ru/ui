<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\Support\AttributeBag;
use Codemonster\Ui\Support\ClassBuilder;
use Codemonster\Ui\Support\PropBag;
use Codemonster\Ui\Support\SelectOptions;
use Codemonster\View\EngineInterface;
use InvalidArgumentException;

final class CmSelect implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views) {}

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $id = $props->string('id');

        if (trim($id) === '') {
            throw new InvalidArgumentException('Select id must be a non-empty string.');
        }

        $options = SelectOptions::normalize($props->array('options'));
        $value = $props->string('value');
        $placeholder = $props->nullableString('placeholder');
        $size = $props->oneOf('size', ['sm', 'md', 'lg'], 'md');
        $invalid = $props->bool('invalid');
        $disabled = $props->bool('disabled');
        $required = $props->bool('required');
        $clearable = $props->bool('clearable');
        $clearLabel = $props->string('clearLabel', 'Clear selection');
        $hasClear = $clearable && !$disabled;
        $attributes = new AttributeBag($props->remaining());
        $name = $this->optionalString($attributes->get('name'));
        $classes = (new ClassBuilder())->add('cm-select', "cm-select--{$size}")
            ->addWhen($invalid, 'cm-select--invalid')->add($this->optionalString($attributes->get('class')))->value();

        $label = '';

        foreach ($options as $option) {
            if ($value !== '' && $option['value'] === $value) {
                $label = $option['label'];
            }
        }

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.select', [
            'id' => $id, 'listboxId' => "{$id}-listbox", 'options' => $options, 'value' => $value,
            'label' => $label !== '' ? $label : (string) $placeholder, 'placeholder' => $placeholder,
            'invalid' => $invalid, 'disabled' => $disabled, 'required' => $required, 'classes' => $classes,
            'hasClear' => $hasClear, 'clearLabel' => $clearLabel, 'name' => $name,
            'attributes' => $attributes
                ->without(['class', 'id', 'name', 'value', 'disabled', 'required', 'aria-invalid', 'aria-expanded'])
                ->render(),
        ]), "\r\n"));
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) return $value;
        throw new InvalidArgumentException('Component attribute must be a string.');
    }
}
