<?php

declare(strict_types=1);

namespace Codemonster\Ui\Support;

final class ClassBuilder
{
    /** @var array<string, true> */
    private array $classes = [];

    public function add(?string ...$values): self
    {
        foreach ($values as $value) {
            foreach (preg_split('/\s+/', trim($value ?? ''), -1, PREG_SPLIT_NO_EMPTY) ?: [] as $class) {
                $this->classes[$class] = true;
            }
        }

        return $this;
    }

    public function addWhen(bool $condition, string $value): self
    {
        if ($condition) {
            $this->add($value);
        }

        return $this;
    }

    public function value(): string
    {
        return implode(' ', array_keys($this->classes));
    }
}
