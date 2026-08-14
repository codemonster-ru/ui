<?php

declare(strict_types=1);

namespace Codemonster\Ui\Support;

use InvalidArgumentException;

final class MenuItems
{
    /**
     * @param array<mixed> $values
     * @return list<array{id: string, label: string, href: ?string, target: ?string, rel: ?string, disabled: bool, active: bool, tone: string, tabindex: int}>
     */
    public static function normalize(array $values): array
    {
        if ($values === []) {
            throw new InvalidArgumentException('Component prop [items] must contain at least one Menu item.');
        }

        $items = [];
        $ids = [];
        $assignedTabStop = false;

        foreach ($values as $value) {
            if (!is_array($value)
                || !is_string($value['id'] ?? null)
                || preg_match('/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/D', $value['id']) !== 1
                || isset($ids[$value['id']])
                || !is_string($value['label'] ?? null)
                || trim($value['label']) === ''
                || (isset($value['href']) && (!is_string($value['href']) || trim($value['href']) === ''))
                || (isset($value['target']) && (!is_string($value['target']) || trim($value['target']) === ''))
                || (isset($value['rel']) && (!is_string($value['rel']) || trim($value['rel']) === ''))
                || (isset($value['disabled']) && !is_bool($value['disabled']))
                || (isset($value['active']) && !is_bool($value['active']))
                || (isset($value['tone']) && !in_array($value['tone'], ['default', 'danger'], true))) {
                throw new InvalidArgumentException('Component prop [items] contains an invalid Menu item.');
            }

            $ids[$value['id']] = true;
            $disabled = $value['disabled'] ?? false;
            $tabindex = !$disabled && !$assignedTabStop ? 0 : -1;
            if (!$disabled) {
                $assignedTabStop = true;
            }
            $items[] = [
                'id' => $value['id'],
                'label' => $value['label'],
                'href' => $value['href'] ?? null,
                'target' => $value['target'] ?? null,
                'rel' => $value['rel'] ?? (($value['target'] ?? null) === '_blank' ? 'noopener noreferrer' : null),
                'disabled' => $disabled,
                'active' => $value['active'] ?? false,
                'tone' => $value['tone'] ?? 'default',
                'tabindex' => $tabindex,
            ];
        }

        if (!$assignedTabStop) {
            throw new InvalidArgumentException('Component prop [items] must contain an enabled Menu item.');
        }

        return $items;
    }
}
