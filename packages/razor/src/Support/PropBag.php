<?php

declare(strict_types=1);

namespace Codemonster\Ui\Support;

use InvalidArgumentException;

final class PropBag
{
    /** @var array<string, true> */
    private array $consumed = [];

    /** @param array<string, mixed> $props */
    public function __construct(private readonly array $props)
    {
    }

    public function bool(string $name, bool $default = false): bool
    {
        $value = $this->consume($name, $default);

        if (!is_bool($value)) {
            throw new InvalidArgumentException("Component prop [{$name}] must be boolean.");
        }

        return $value;
    }

    public function string(string $name, string $default = ''): string
    {
        $value = $this->consume($name, $default);

        if (!is_string($value)) {
            throw new InvalidArgumentException("Component prop [{$name}] must be a string.");
        }

        return $value;
    }

    public function nullableString(string $name, ?string $default = null): ?string
    {
        $value = $this->consume($name, $default);

        if ($value !== null && !is_string($value)) {
            throw new InvalidArgumentException("Component prop [{$name}] must be a string or null.");
        }

        return $value;
    }

    /** @param non-empty-list<string> $allowed */
    public function oneOf(string $name, array $allowed, string $default): string
    {
        $value = $this->string($name, $default);

        if (!in_array($value, $allowed, true)) {
            throw new InvalidArgumentException(
                "Component prop [{$name}] must be one of [" . implode(', ', $allowed) . '].',
            );
        }

        return $value;
    }

    /** @return array<string, mixed> */
    public function remaining(): array
    {
        return array_diff_key($this->props, $this->consumed);
    }

    private function consume(string $name, mixed $default): mixed
    {
        $this->consumed[$name] = true;

        return array_key_exists($name, $this->props) ? $this->props[$name] : $default;
    }
}
