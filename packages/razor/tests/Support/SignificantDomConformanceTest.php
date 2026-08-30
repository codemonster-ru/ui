<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Support;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use RuntimeException;

/**
 * Runs the shared conformance cases through this side of the comparison.
 *
 * scripts/contracts/significant-dom-conformance.test.mjs runs the same file through the JavaScript
 * comparator. The two decide whether Razor and Vue respectively match the same canonical markup, so
 * a case passing on one side and failing on the other means the adapters are being judged against
 * different standards — which is what had quietly happened before this suite existed.
 */
final class SignificantDomConformanceTest extends TestCase
{
    #[DataProvider('caseProvider')]
    public function testAgreesWithTheJavaScriptComparator(
        string $name,
        string $a,
        string $b,
        bool $equal,
        bool $normalizeGeneratedIds,
    ): void {
        self::assertSame(
            $equal,
            SignificantDom::normalize($a, $normalizeGeneratedIds) === SignificantDom::normalize($b, $normalizeGeneratedIds),
            $name,
        );
    }

    /** @return iterable<string, array{string, string, string, bool, bool}> */
    public static function caseProvider(): iterable
    {
        $path = dirname(__DIR__, 4) . '/contracts/significant-dom-conformance.json';
        $contents = file_get_contents($path);

        if ($contents === false) {
            throw new RuntimeException("Unable to read shared conformance cases at {$path}.");
        }

        /** @var array{cases: list<array{name: string, a: string, b: string, equal: bool, normalizeGeneratedIds?: bool}>} $decoded */
        $decoded = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);

        foreach ($decoded['cases'] as $case) {
            yield $case['name'] => [
                $case['name'],
                $case['a'],
                $case['b'],
                $case['equal'],
                $case['normalizeGeneratedIds'] ?? false,
            ];
        }
    }
}
