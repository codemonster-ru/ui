<?php

declare(strict_types=1);

namespace Codemonster\Ui\Support;

use InvalidArgumentException;
use Stringable;

final readonly class AttributeBag implements Stringable
{
    /** @param array<string, mixed> $attributes */
    public function __construct(private array $attributes)
    {
        foreach (array_keys($attributes) as $name) {
            if (preg_match('/^[a-z][a-z0-9_.:-]*$/D', $name) !== 1 || preg_match('/^on[a-z]/', $name) === 1) {
                throw new InvalidArgumentException("Unsafe HTML attribute name [{$name}].");
            }
        }
    }

    public function get(string $name, mixed $default = null): mixed
    {
        return array_key_exists($name, $this->attributes) ? $this->attributes[$name] : $default;
    }

    /** @param list<string> $names */
    public function without(array $names): self
    {
        return new self(array_diff_key($this->attributes, array_fill_keys($names, true)));
    }

    public function render(): string
    {
        $html = '';

        foreach ($this->attributes as $name => $value) {
            if ($value === null || $value === false) {
                continue;
            }

            if ($value === true) {
                $html .= ' ' . $name;
                continue;
            }

            if (!is_string($value) && !is_int($value) && !is_float($value) && !$value instanceof Stringable) {
                throw new InvalidArgumentException(
                    "HTML attribute [{$name}] cannot render value of type [" . get_debug_type($value) . '].',
                );
            }

            $html .= ' ' . $name . '="' . htmlspecialchars(
                (string) $value,
                ENT_QUOTES | ENT_SUBSTITUTE,
                'UTF-8',
            ) . '"';
        }

        return $html;
    }

    public function __toString(): string
    {
        return $this->render();
    }
}
