<?php

declare(strict_types=1);

namespace Codemonster\Ui\Support;

use DateTimeImmutable;

/**
 * The display and month names are pinned to one locale so a server-rendered control and the client
 * that later takes it over agree, and so a capture does not depend on the machine's language.
 */
final class DatePickerCalendar
{
    public static function formatDisplay(string $value): string
    {
        return self::date($value)->format('m/d/y');
    }

    public static function monthLabel(string $value): string
    {
        return self::date($value)->format('F Y');
    }

    /** @return list<string> */
    public static function weekdayLabels(): array
    {
        $labels = [];

        for ($index = 0; $index < 7; $index++) {
            $labels[] = (new DateTimeImmutable('2024-01-07'))->modify("+{$index} day")->format('D');
        }

        return $labels;
    }

    /** @return list<list<array{disabled: bool, label: string, outside: bool, selected: bool, today: bool, value: string}>> */
    public static function buildMonth(string $month, string $selected, ?string $min, ?string $max): array
    {
        $anchor = self::date($month);
        $today = (new DateTimeImmutable('today'))->format('Y-m-d');
        $first = $anchor->modify('first day of this month');
        $start = $first->modify('-' . (int) $first->format('w') . ' day');

        $weeks = [];

        for ($week = 0; $week < 6; $week++) {
            $days = [];

            for ($day = 0; $day < 7; $day++) {
                $date = $start->modify('+' . ($week * 7 + $day) . ' day');
                $value = $date->format('Y-m-d');
                $days[] = [
                    'disabled' => ($min !== null && $value < $min) || ($max !== null && $value > $max),
                    'label' => (string) (int) $date->format('j'),
                    'outside' => $date->format('m') !== $anchor->format('m'),
                    'selected' => $value === $selected,
                    'today' => $value === $today,
                    'value' => $value,
                ];
            }

            $weeks[] = $days;
        }

        return $weeks;
    }

    private static function date(string $value): DateTimeImmutable
    {
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);

        if ($date === false) {
            throw new \InvalidArgumentException("DatePicker value must be a valid YYYY-MM-DD date: {$value}.");
        }

        return $date;
    }
}
