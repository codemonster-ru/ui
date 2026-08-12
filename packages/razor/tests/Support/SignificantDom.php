<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Support;

use DOMDocument;
use DOMElement;
use DOMNode;
use RuntimeException;

final class SignificantDom
{
    private const BOOLEAN_ATTRIBUTES = ['disabled', 'hidden', 'required', 'readonly', 'multiple', 'checked'];

    /** @return list<array<string, mixed>> */
    public static function normalize(string $html): array
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

        return self::normalizeChildren($root);
    }

    /** @return list<array<string, mixed>> */
    private static function normalizeChildren(DOMNode $parent): array
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
                    $children[] = ['text' => $value];
                }
                continue;
            }

            if (!$node instanceof DOMElement) {
                continue;
            }

            $attributes = [];

            foreach ($node->attributes as $attribute) {
                $value = in_array($attribute->name, self::BOOLEAN_ATTRIBUTES, true) ? true : $attribute->value;

                if ($attribute->name === 'class') {
                    $classes = preg_split('/\s+/', trim($attribute->value), -1, PREG_SPLIT_NO_EMPTY) ?: [];
                    sort($classes);
                    $value = implode(' ', array_unique($classes));
                }

                $attributes[$attribute->name] = $value;
            }

            ksort($attributes);
            $children[] = [
                'tag' => $node->tagName,
                'attributes' => $attributes,
                'children' => self::normalizeChildren($node),
            ];
        }

        return $children;
    }
}
