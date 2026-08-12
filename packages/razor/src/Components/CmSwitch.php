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

final class CmSwitch implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $checked = $props->bool('checked');
        $value = $props->string('value', 'on');
        $label = $props->string('label');
        $size = $props->oneOf('size', ['sm', 'md', 'lg'], 'md');
        $invalid = $props->bool('invalid');
        $disabled = $props->bool('disabled');
        $required = $props->bool('required');
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-switch', "cm-switch--{$size}")
            ->addWhen($invalid, 'cm-switch--invalid')
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.switch', [
            'classes' => $classes,
            'rootAttributes' => (new AttributeBag(['style' => $attributes->get('style')]))->render(),
            'stateAttributes' => (new AttributeBag([
                'checked' => $checked,
                'disabled' => $disabled,
                'required' => $required,
                'aria-checked' => $checked ? 'true' : 'false',
                'aria-invalid' => $invalid ? 'true' : null,
            ]))->render(),
            'attributes' => $attributes->without([
                'class', 'style', 'type', 'role', 'value', 'checked', 'disabled', 'required',
                'aria-checked', 'aria-invalid',
            ])->render(),
            'checked' => $checked,
            'value' => $value,
            'content' => $context->hasSlot('default') ? $context->slot('default') : $label,
        ]), "\r\n"));
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) return $value;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
