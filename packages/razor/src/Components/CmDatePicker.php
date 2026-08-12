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

final class CmDatePicker implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views) {}

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $value = $props->string('value');
        $min = $props->nullableString('min');
        $max = $props->nullableString('max');
        foreach ([$value, $min ?? '', $max ?? ''] as $date) {
            if (!$this->validDate($date)) throw new InvalidArgumentException("DatePicker value must be a valid YYYY-MM-DD date: {$date}.");
        }
        $size = $props->oneOf('size', ['sm', 'md', 'lg'], 'md');
        $invalid = $props->bool('invalid');
        $disabled = $props->bool('disabled');
        $readonly = $props->bool('readonly');
        $required = $props->bool('required');
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())->add('cm-date-picker', "cm-date-picker--{$size}")
            ->addWhen($invalid, 'cm-date-picker--invalid')->add($this->optionalString($attributes->get('class')))->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.date-picker', [
            'value' => $value, 'min' => $min, 'max' => $max, 'invalid' => $invalid, 'disabled' => $disabled,
            'readonly' => $readonly, 'required' => $required, 'classes' => $classes,
            'attributes' => $attributes->without(['class', 'type', 'value', 'min', 'max', 'disabled', 'readonly', 'required', 'aria-invalid'])->render(),
        ]), "\r\n"));
    }

    private function validDate(string $value): bool
    {
        if ($value === '') return true;
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/D', $value, $parts) !== 1) return false;
        return checkdate((int) $parts[2], (int) $parts[3], (int) $parts[1]);
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) return $value;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
