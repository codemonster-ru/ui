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

    /**
     * @param array<mixed> $default
     * @return array<mixed>
     */
    public function array(string $name, array $default = []): array
    {
        $value = $this->consume($name, $default);

        if (!is_array($value)) {
            throw new InvalidArgumentException("Component prop [{$name}] must be an array.");
        }

        return $value;
    }

    /**
     * @param array<mixed>|null $default
     * @return array<mixed>|null
     */
    public function nullableArray(string $name, ?array $default = null): ?array
    {
        $value = $this->consume($name, $default);

        if ($value !== null && !is_array($value)) {
            throw new InvalidArgumentException("Component prop [{$name}] must be an array or null.");
        }

        return $value;
    }

    public function stringOrNumber(string $name, string|int|float|null $default = null): string|int|float|null
    {
        $value = $this->consume($name, $default);

        if ($value !== null && !is_string($value) && !is_int($value) && !is_float($value)) {
            throw new InvalidArgumentException("Component prop [{$name}] must be a string, number, or null.");
        }

        return $value;
    }

    public function positiveInt(string $name, int $default): int
    {
        $value = $this->consume($name, $default);

        if (!is_int($value) || $value < 1) {
            throw new InvalidArgumentException("Component prop [{$name}] must be a positive integer.");
        }

        return $value;
    }

    public function nullableNonNegativeInt(string $name, ?int $default = null): ?int
    {
        $value = $this->consume($name, $default);

        if ($value !== null && (!is_int($value) || $value < 0)) {
            throw new InvalidArgumentException("Component prop [{$name}] must be a non-negative integer or null.");
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
        $key = $this->resolve($name);
        $this->consumed[$key] = true;

        return array_key_exists($key, $this->props) ? $this->props[$key] : $default;
    }

    /**
     * A Razor template spells a prop the way HTML spells an attribute, so `clear-label` has to
     * reach a component asking for `clearLabel`. Matching only the camel case name left every such
     * prop on its default and then rendered the supplied one back out as a stray attribute.
     */
    private function resolve(string $name): string
    {
        if (array_key_exists($name, $this->props)) {
            return $name;
        }

        $kebab = strtolower((string) preg_replace('/(?<!^)[A-Z]/', '-$0', $name));

        return array_key_exists($kebab, $this->props) ? $kebab : $name;
    }
}
