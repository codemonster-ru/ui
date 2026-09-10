<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\SkeletonState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfSkeleton.
 *
 * Reads the same vector file the shared-core TypeScript suite reads, so the two
 * implementations cannot drift apart.
 */
final class SkeletonStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/skeleton/state-vectors.json';
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

        self::assertSame(['resolveSkeletonClasses', 'resolveSkeletonLength', 'resolveSkeletonStyle'], $rules);
    }

    public function testTheAnimationModifierIsPresentAtTheDefault(): void
    {
        // The opposite polarity to the M15 toned spans. A port that copied that
        // convention would ship a skeleton that never shimmers, and nothing
        // about the static box would look wrong.
        self::assertSame(['vf-skeleton', 'vf-skeleton--animated'], SkeletonState::resolveClasses(true));
        self::assertSame(['vf-skeleton'], SkeletonState::resolveClasses(false));
    }

    public function testAnEmptyValueDropsTheDeclarationRatherThanMeaningZero(): void
    {
        self::assertSame([], SkeletonState::resolveStyle('', ''));
    }

    public function testClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveSkeletonClasses'] as $vector) {
            self::assertSame($vector['expected'], SkeletonState::resolveClasses($vector['animated']));
        }
    }

    public function testLengthsMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveSkeletonLength'] as $vector) {
            self::assertSame(
                $vector['expected'],
                SkeletonState::resolveLength($vector['value']),
                sprintf('resolveSkeletonLength(%s)', json_encode($vector['value'])),
            );
        }
    }

    public function testStylesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveSkeletonStyle'] as $vector) {
            self::assertSame(
                array_map(static fn (array $pair): array => [$pair[0], $pair[1]], $vector['expected']),
                SkeletonState::resolveStyle($vector['minHeight'], $vector['radius']),
                sprintf('resolveSkeletonStyle(%s, %s)', json_encode($vector['minHeight']), json_encode($vector['radius'])),
            );
        }
    }
}
