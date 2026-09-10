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

    /**
     * Merges component-owned style declarations with a consumer style string.
     *
     * Vue merges a bound style object with an inherited style attribute rather
     * than concatenating them, so a consumer declaration for a property the
     * component also wrote *replaces* it and the result carries one declaration,
     * not two. VfSkeleton is the first migrated component with both halves, so
     * this is the first place the difference is observable.
     *
     * Returns null when nothing is left, because Vue writes no style attribute
     * at all rather than an empty one.
     *
     * @param list<array{0: string, 1: string}> $declarations
     */
    public static function mergeStyles(array $declarations, ?string $consumer): ?string
    {
        $merged = [];

        foreach ($declarations as [$property, $value]) {
            $merged[$property] = $value;
        }

        foreach (explode(';', (string) $consumer) as $declaration) {
            $separator = strpos($declaration, ':');

            if ($separator === false) {
                continue;
            }

            $property = trim(substr($declaration, 0, $separator));
            $value = trim(substr($declaration, $separator + 1));

            if ($property !== '' && $value !== '') {
                $merged[$property] = $value;
            }
        }

        if ($merged === []) {
            return null;
        }

        $rendered = '';
        foreach ($merged as $property => $value) {
            $rendered .= $property . ': ' . $value . '; ';
        }

        return rtrim($rendered);
    }

    private static function assertSafeAttributeName(string $name): void
    {
        if (preg_match('/^[A-Za-z_:][A-Za-z0-9_:.-]*$/', $name) !== 1) {
            throw new \InvalidArgumentException("Unsafe HTML attribute name [{$name}].");
        }
    }
}
