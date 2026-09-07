<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\IconButtonState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract.
 *
 * Reads the same vector file the shared-core TypeScript suite reads, so the two
 * implementations of these rules cannot drift apart. The file is a monorepo
 * test fixture, not a runtime dependency: nothing in src/ reads it.
 */
final class IconButtonStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/icon-button/state-vectors.json';
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

        self::assertSame(['resolveIconButtonClasses', 'resolveIconButtonIconSize'], $rules);
    }

    public function testClassVectors(): void
    {
        foreach (self::$vectors['resolveIconButtonClasses'] as $index => $vector) {
            self::assertSame(
                $vector['expected'],
                IconButtonState::resolveClasses($vector['variant'], $vector['size']),
                "resolveIconButtonClasses vector #{$index}",
            );
        }
    }

    public function testIconSizeVectors(): void
    {
        foreach (self::$vectors['resolveIconButtonIconSize'] as $index => $vector) {
            self::assertSame(
                $vector['expected'],
                IconButtonState::resolveIconSize($vector['size']),
                "resolveIconButtonIconSize vector #{$index}",
            );
        }
    }
}
