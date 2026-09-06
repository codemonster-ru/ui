<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * Attribute and text escaping for composed markup.
 *
 * The Razor engine escapes interpolated template values, but a component that
 * assembles an element from a props map has to escape the values it writes
 * itself before handing the result back as RenderedHtml. Every attribute value
 * goes through here; nothing is concatenated raw.
 *
 * @internal
 */
final class Html
{
    /** Escapes a value for use in a double-quoted attribute or as text. */
    public static function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /**
     * Renders an attribute map.
     *
     * `null` and `false` drop the attribute entirely, `true` renders it as a
     * bare boolean attribute, and everything else is escaped as a string. That
     * matches how HTML boolean attributes actually behave, rather than copying
     * the Vue adapter's attrs quirks.
     *
     * @param array<string, string|bool|int|float|null> $attributes
     */
    public static function attributes(array $attributes): string
    {
        $rendered = [];

        foreach ($attributes as $name => $value) {
            if ($value === null || $value === false) {
                continue;
            }

            self::assertSafeAttributeName($name);

            if ($value === true) {
                $rendered[] = $name;
                continue;
            }

            $rendered[] = $name . '="' . self::escape((string) $value) . '"';
        }

        return $rendered === [] ? '' : ' ' . implode(' ', $rendered);
    }

    /**
     * Joins class names, dropping empty entries.
     *
     * @param array<int, string|false|null> $classes
     */
    public static function classes(array $classes): string
    {
        return implode(' ', array_filter($classes, static fn ($class): bool => is_string($class) && $class !== ''));
    }

    private static function assertSafeAttributeName(string $name): void
    {
        if (preg_match('/^[A-Za-z_:][A-Za-z0-9_:.-]*$/', $name) !== 1) {
            throw new \InvalidArgumentException("Unsafe HTML attribute name [{$name}].");
        }
    }
}
