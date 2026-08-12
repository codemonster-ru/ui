<?php

declare(strict_types=1);

namespace Codemonster\Ui\Support;

use InvalidArgumentException;

final class CommandPaletteItems
{
    /**
     * @param array<mixed> $values
     * @return list<array{id: string, label: string, keywords: ?string, disabled: bool}>
     */
    public static function normalize(array $values): array
    {
        if ($values === []) throw new InvalidArgumentException('Component prop [commands] must not be empty.');
        $commands = [];
        $seen = [];
        foreach ($values as $value) {
            if (!is_array($value)
                || !is_string($value['id'] ?? null)
                || preg_match('/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/D', $value['id']) !== 1
                || isset($seen[$value['id']])
                || !is_string($value['label'] ?? null)
                || trim($value['label']) === ''
                || (isset($value['keywords']) && !is_string($value['keywords']))
                || (isset($value['disabled']) && !is_bool($value['disabled']))) {
                throw new InvalidArgumentException('Component prop [commands] contains an invalid CommandPalette command.');
            }
            $seen[$value['id']] = true;
            $commands[] = [
                'id' => $value['id'],
                'label' => $value['label'],
                'keywords' => $value['keywords'] ?? null,
                'disabled' => $value['disabled'] ?? false,
            ];
        }
        return $commands;
    }
}
