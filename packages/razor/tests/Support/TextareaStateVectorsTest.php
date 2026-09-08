<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\InputState;
use Codemonster\VueForge\Razor\Support\TextareaState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract.
 *
 * Reads the same vector file the shared-core TypeScript suite reads, so the two
 * implementations of these rules cannot drift apart.
 */
final class TextareaStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/textarea/state-vectors.json';
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

        self::assertSame(['resolveTextareaClasses'], $rules);
    }

    public function testClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveTextareaClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                TextareaState::resolveClasses($vector['size'], $vector['invalid'], $vector['floating']),
                sprintf('resolveClasses(%s)', json_encode($vector)),
            );
        }
    }

    public function testTheFilledPredicateIsReusedRatherThanRestated(): void
    {
        // VfTextarea applies the rule VfInput applies: length, not content.
        self::assertTrue(InputState::isFilled('   '));
        self::assertFalse(InputState::isFilled(''));
    }
}
