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

final class CmInput implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $value = $props->string('value');
        $type = $props->oneOf('type', ['text', 'email', 'password', 'search', 'tel', 'url'], 'text');
        $size = $props->oneOf('size', ['sm', 'md', 'lg'], 'md');
        $invalid = $props->bool('invalid');
        $disabled = $props->bool('disabled');
        $readonly = $props->bool('readonly');
        $required = $props->bool('required');
        $clearable = $props->bool('clearable');
        $passwordReveal = $props->bool('passwordReveal');
        $clearLabel = $props->string('clearLabel', 'Clear input');
        $showPasswordLabel = $props->string('showPasswordLabel', 'Show password');
        $hidePasswordLabel = $props->string('hidePasswordLabel', 'Hide password');
        $leading = $context->hasSlot('leading') ? $context->slot('leading') : null;
        $trailing = $context->hasSlot('trailing') ? $context->slot('trailing') : null;
        $hasClear = $clearable && !$disabled && !$readonly;
        $hasPasswordReveal = $passwordReveal && $type === 'password';
        $hasWrapper = $leading !== null || $trailing !== null || $hasClear || $hasPasswordReveal;
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-input', "cm-input--{$size}")
            ->addWhen($invalid, 'cm-input--invalid')
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.input', [
            'value' => $value,
            'type' => $type,
            'classes' => $classes,
            'invalid' => $invalid,
            'disabled' => $disabled,
            'readonly' => $readonly,
            'required' => $required,
            'hasWrapper' => $hasWrapper,
            'hasClear' => $hasClear,
            'hasPasswordReveal' => $hasPasswordReveal,
            'clearLabel' => $clearLabel,
            'showPasswordLabel' => $showPasswordLabel,
            'hidePasswordLabel' => $hidePasswordLabel,
            'leading' => $leading,
            'trailing' => $trailing,
            'attributes' => $attributes->without([
                'class',
                'value',
                'type',
                'disabled',
                'readonly',
                'required',
                'aria-invalid',
                'data-cm-input-control',
            ])->render(),
        ]), "\r\n"));
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) {
            return $value;
        }

        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
