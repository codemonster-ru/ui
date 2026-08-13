<?php

declare(strict_types=1);

namespace Codemonster\Ui\Support;

use InvalidArgumentException;

final class SelectOptions
{
    /**
     * @param array<mixed> $values
     * @return list<array{value: string, label: string, disabled: bool}>
     */
    public static function normalize(array $values): array
    {
        if ($values === []) throw new InvalidArgumentException('Component prop [options] must not be empty.');
        $options = [];
        $seen = [];
        foreach ($values as $value) {
            if (!is_array($value)
                || !is_string($value['value'] ?? null)
                || isset($seen[$value['value']])
                || !is_string($value['label'] ?? null)
                || trim($value['label']) === ''
                || (isset($value['disabled']) && !is_bool($value['disabled']))) {
                throw new InvalidArgumentException('Component prop [options] contains an invalid Select option.');
            }
            $seen[$value['value']] = true;
            $options[] = [
                'value' => $value['value'],
                'label' => $value['label'],
                'disabled' => $value['disabled'] ?? false,
            ];
        }
        return $options;
    }
}
