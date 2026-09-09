<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\PresentationState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for the M15 components.
 *
 * Reads the same vector file the shared-core TypeScript suite reads, so the two
 * implementations cannot drift apart.
 */
final class PresentationStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/presentation/state-vectors.json';
        $contents = file_get_contents($path);
        self::assertIsString($contents, "Shared vectors are missing at [{$path}].");
        self::$vectors = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    }

    public function testTheVectorFileCoversEveryMirroredRule(): void
    {
        $rules = array_values(array_filter(
            array_keys(self::$vectors),
            static fn (string $key): bool => !str_starts_with($key, '$'),
        ));
        sort($rules);

        self::assertSame([
            'resolveBadgeClasses',
            'resolveDividerClasses',
            'resolveDividerRole',
            'resolveTagClasses',
        ], $rules);
    }

    public function testBadgeClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveBadgeClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                PresentationState::resolveBadgeClasses($vector['tone']),
                sprintf('resolveBadgeClasses(%s)', json_encode($vector)),
            );
        }
    }

    public function testTagClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveTagClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                PresentationState::resolveTagClasses($vector['tone']),
                sprintf('resolveTagClasses(%s)', json_encode($vector)),
            );
        }
    }

    public function testDividerClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveDividerClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                PresentationState::resolveDividerClasses($vector['orientation']),
                sprintf('resolveDividerClasses(%s)', json_encode($vector)),
            );
        }
    }

    public function testDividerRoleMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveDividerRole'] as $vector) {
            self::assertSame(
                $vector['expected'],
                PresentationState::resolveDividerRole($vector['orientation']),
                sprintf('resolveDividerRole(%s)', json_encode($vector)),
            );
        }
    }

    /**
     * Neither toned span may be implemented in terms of the other.
     *
     * The class lists read alike, so the guard is explicit: a badge never
     * produces a tag class and a tag never produces a badge class, at any tone.
     */
    public function testNeitherTonedSpanCanProduceTheOtherBlock(): void
    {
        foreach (['neutral', 'primary', 'danger', 'contrast'] as $tone) {
            self::assertStringNotContainsString('vf-tag', implode(' ', PresentationState::resolveBadgeClasses($tone)));
            self::assertStringNotContainsString('vf-badge', implode(' ', PresentationState::resolveTagClasses($tone)));
        }
    }
}
