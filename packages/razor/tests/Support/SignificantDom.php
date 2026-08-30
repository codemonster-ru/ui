<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Support;

use DOMDocument;
use DOMElement;
use DOMNode;
use RuntimeException;

/**
 * The PHP half of the canonical DOM comparison.
 *
 * The JavaScript comparator in scripts/contracts/significant-dom.mjs is the other half, and the two
 * decide whether an adapter matches the same canonical markup. They kept separate copies of their
 * rules and had already drifted — this side knew six boolean attributes to the other's twenty-five,
 * and normalised neither inline styles nor generated identifiers — so Razor was being held to a
 * different standard than Vue against the same fixtures.
 *
 * The rule sets now come from contracts/significant-dom.json, which both sides read, and
 * SignificantDomConformanceTest runs shared cases through both to prove they still agree.
 */
final class SignificantDom
{
    /** @var array{booleanAttributes: list<string>, idReferenceAttributes: list<string>, frameworkAttributes: array{exact: list<string>, patterns: list<string>}}|null */
    private static ?array $rules = null;

    /**
     * Identifier aliasing is off by default because the JavaScript comparator defaults it off too,
     * and no parity test turns it on. The flag exists so the two sides stay comparable if one ever
     * does.
     *
     * @return list<array<string, mixed>>
     */
    public static function normalize(string $html, bool $normalizeGeneratedIds = false): array
    {
        $document = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $document->loadHTML(
            '<div data-parity-root>' . $html . '</div>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD,
        );
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
        $root = $document->documentElement;

        if (!$root instanceof DOMElement) {
            throw new RuntimeException('Unable to parse significant DOM fixture.');
        }

        return self::normalizeChildren($root, $normalizeGeneratedIds ? self::generatedIdAliases($root) : []);
    }

    /** @return array{booleanAttributes: list<string>, idReferenceAttributes: list<string>, frameworkAttributes: array{exact: list<string>, patterns: list<string>}} */
    private static function rules(): array
    {
        if (self::$rules === null) {
            $path = dirname(__DIR__, 4) . '/contracts/significant-dom.json';
            $contents = file_get_contents($path);

            if ($contents === false) {
                throw new RuntimeException("Unable to read shared comparison rules at {$path}.");
            }

            /** @var array{booleanAttributes: list<string>, idReferenceAttributes: list<string>, frameworkAttributes: array{exact: list<string>, patterns: list<string>}} $decoded */
            $decoded = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
            self::$rules = $decoded;
        }

        return self::$rules;
    }

    /**
     * Maps every identifier to a positional alias, so markup that generates identifiers compares
     * equal as long as the references between elements line up the same way.
     *
     * @return array<string, string>
     */
    private static function generatedIdAliases(DOMNode $root): array
    {
        $aliases = [];
        $queue = [$root];

        while ($queue !== []) {
            $node = array_shift($queue);

            if ($node instanceof DOMElement && $node->hasAttribute('id')) {
                $id = $node->getAttribute('id');
                if ($id !== '') {
                    if (isset($aliases[$id])) {
                        throw new RuntimeException("Cannot normalize duplicate generated id {$id}.");
                    }
                    $aliases[$id] = '$generated-id-' . (count($aliases) + 1);
                }
            }

            $children = [];
            foreach ($node->childNodes as $child) {
                $children[] = $child;
            }
            array_splice($queue, 0, 0, $children);
        }

        return $aliases;
    }

    private static function isFrameworkAttribute(string $name): bool
    {
        $framework = self::rules()['frameworkAttributes'];

        if (in_array($name, $framework['exact'], true)) {
            return true;
        }

        foreach ($framework['patterns'] as $pattern) {
            if (preg_match('/' . $pattern . '/', $name) === 1) {
                return true;
            }
        }

        return false;
    }

    /**
     * Sorts declarations and collapses their spacing, so the same styling compares equal however an
     * adapter chose to write it out.
     */
    private static function normalizeStyle(string $value): string
    {
        $declarations = [];

        foreach (self::splitAtTopLevel($value, ';') as $source) {
            $declaration = trim($source);
            if ($declaration === '') {
                continue;
            }

            $parts = self::splitAtTopLevel($declaration, ':');
            if (count($parts) < 2) {
                return trim($value);
            }

            $property = trim((string) array_shift($parts));
            $normalized = str_starts_with($property, '--') ? $property : strtolower($property);
            $declarations[] = [$normalized, trim(implode(':', $parts))];
        }

        usort($declarations, static fn (array $left, array $right): int => strcmp($left[0], $right[0]));

        return implode('; ', array_map(
            static fn (array $declaration): string => "{$declaration[0]}: {$declaration[1]}",
            $declarations,
        ));
    }

    /**
     * Splits on a delimiter that is not inside parentheses or quotes, so a `calc(1px * 2)` or a
     * quoted `content` survives intact.
     *
     * @return list<string>
     */
    private static function splitAtTopLevel(string $value, string $delimiter): array
    {
        $parts = [];
        $current = '';
        $depth = 0;
        $escaped = false;
        $quote = null;

        foreach (str_split($value) as $character) {
            if ($escaped) {
                $current .= $character;
                $escaped = false;
                continue;
            }
            if ($character === '\\') {
                $current .= $character;
                $escaped = true;
                continue;
            }
            if ($quote !== null) {
                $current .= $character;
                if ($character === $quote) {
                    $quote = null;
                }
                continue;
            }
            if ($character === '"' || $character === "'") {
                $current .= $character;
                $quote = $character;
                continue;
            }
            if ($character === '(') {
                $depth++;
            } elseif ($character === ')' && $depth > 0) {
                $depth--;
            }
            if ($character === $delimiter && $depth === 0) {
                $parts[] = $current;
                $current = '';
                continue;
            }
            $current .= $character;
        }

        $parts[] = $current;

        return $parts;
    }

    /**
     * @param array<string, string> $aliases
     */
    private static function normalizeAttributeValue(string $name, string $value, array $aliases): bool|string
    {
        $rules = self::rules();

        if (in_array($name, $rules['booleanAttributes'], true)) {
            return true;
        }

        if ($name === 'class') {
            $classes = preg_split('/\s+/', trim($value), -1, PREG_SPLIT_NO_EMPTY) ?: [];
            $classes = array_values(array_unique($classes));
            sort($classes);

            return implode(' ', $classes);
        }

        if ($name === 'style') {
            return self::normalizeStyle($value);
        }

        if ($aliases === []) {
            return $value;
        }

        if ($name === 'id') {
            return $aliases[$value] ?? $value;
        }

        if (in_array($name, $rules['idReferenceAttributes'], true)) {
            $tokens = preg_split('/\s+/', trim($value), -1, PREG_SPLIT_NO_EMPTY) ?: [];

            return implode(' ', array_map(static fn (string $token): string => $aliases[$token] ?? $token, $tokens));
        }

        if ($name === 'href' && str_starts_with($value, '#')) {
            $target = substr($value, 1);

            return '#' . ($aliases[$target] ?? $target);
        }

        return $value;
    }

    /**
     * @param array<string, string> $aliases
     *
     * @return list<array<string, mixed>>
     */
    private static function normalizeChildren(DOMNode $parent, array $aliases): array
    {
        $children = [];

        foreach ($parent->childNodes as $node) {
            if ($node->nodeType === XML_COMMENT_NODE
                || ($node->nodeType === XML_TEXT_NODE && trim((string) $node->nodeValue) === '')) {
                continue;
            }

            if ($node->nodeType === XML_TEXT_NODE) {
                $value = (string) $node->nodeValue;
                if ($parent instanceof DOMElement && $parent->tagName === 'textarea' && $node === $parent->firstChild) {
                    $value = (string) preg_replace('/^\r?\n/', '', $value, 1);
                }
                if ($value !== '') {
                    $children[] = ['text' => str_replace("\r\n", "\n", $value)];
                }
                continue;
            }

            if (!$node instanceof DOMElement) {
                continue;
            }

            $attributes = [];

            foreach ($node->attributes as $attribute) {
                if (self::isFrameworkAttribute($attribute->name)) {
                    continue;
                }

                $attributes[$attribute->name] = self::normalizeAttributeValue(
                    $attribute->name,
                    $attribute->value,
                    $aliases,
                );
            }

            ksort($attributes);
            $children[] = [
                'tag' => $node->tagName,
                'attributes' => $attributes,
                'children' => self::normalizeChildren($node, $aliases),
            ];
        }

        return $children;
    }
}
