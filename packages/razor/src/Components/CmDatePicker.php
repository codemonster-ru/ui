<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\Support\AttributeBag;
use Codemonster\Ui\Support\ClassBuilder;
use Codemonster\Ui\Support\DatePickerCalendar;
use Codemonster\Ui\Support\PropBag;
use Codemonster\View\EngineInterface;
use InvalidArgumentException;

final class CmDatePicker implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views) {}

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $id = $props->string('id');

        if (trim($id) === '') {
            throw new InvalidArgumentException('DatePicker id must be a non-empty string.');
        }

        $value = $props->string('value');
        $min = $props->nullableString('min');
        $max = $props->nullableString('max');
        foreach ([$value, $min ?? '', $max ?? ''] as $date) {
            if (!$this->validDate($date)) throw new InvalidArgumentException("DatePicker value must be a valid YYYY-MM-DD date: {$date}.");
        }
        $placeholder = $props->nullableString('placeholder');
        $size = $props->oneOf('size', ['sm', 'md', 'lg'], 'md');
        $invalid = $props->bool('invalid');
        $disabled = $props->bool('disabled');
        $readonly = $props->bool('readonly');
        $required = $props->bool('required');
        $clearable = $props->bool('clearable');
        $clearLabel = $props->string('clearLabel', 'Clear date');
        $previousMonthLabel = $props->string('previousMonthLabel', 'Previous month');
        $nextMonthLabel = $props->string('nextMonthLabel', 'Next month');
        $hasClear = $clearable && !$disabled && !$readonly;
        $attributes = new AttributeBag($props->remaining());
        $name = $this->optionalString($attributes->get('name'));
        $classes = (new ClassBuilder())->add('cm-date-picker', "cm-date-picker--{$size}")
            ->addWhen($invalid, 'cm-date-picker--invalid')
            ->addWhen($value === '', 'cm-date-picker--placeholder')
            ->add($this->optionalString($attributes->get('class')))->value();

        $visibleMonth = $value !== '' ? $value : date('Y-m-d');

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.date-picker', [
            'id' => $id, 'calendarId' => "{$id}-calendar", 'value' => $value, 'min' => $min, 'max' => $max,
            'display' => $value === '' ? (string) $placeholder : DatePickerCalendar::formatDisplay($value),
            'placeholder' => $placeholder, 'invalid' => $invalid, 'disabled' => $disabled,
            'readonly' => $readonly, 'required' => $required, 'classes' => $classes,
            'hasClear' => $hasClear, 'clearLabel' => $clearLabel, 'name' => $name,
            'previousMonthLabel' => $previousMonthLabel, 'nextMonthLabel' => $nextMonthLabel,
            'monthLabel' => DatePickerCalendar::monthLabel($visibleMonth),
            'weekdays' => DatePickerCalendar::weekdayLabels(),
            'weeks' => DatePickerCalendar::buildMonth($visibleMonth, $value, $min, $max),
            'attributes' => $attributes
                ->without(['class', 'id', 'name', 'value', 'disabled', 'required', 'aria-invalid', 'aria-expanded'])
                ->render(),
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
