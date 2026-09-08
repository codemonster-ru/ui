<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\ButtonState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract.
 *
 * Reads the same vector file the shared-core TypeScript suite reads, so the two
 * implementations of these rules cannot drift apart. The file is a monorepo
 * test fixture, not a runtime dependency: nothing in src/ reads it.
 */
final class ButtonStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/button/state-vectors.json';
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

        self::assertSame(['isButtonDisabled', 'resolveButtonBusy', 'resolveButtonClasses'], $rules);
    }

    public function testClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveButtonClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                ButtonState::resolveClasses(
                    $vector['variant'],
                    $vector['size'],
                    $vector['block'],
                    $vector['loading'],
                ),
                sprintf('resolveClasses(%s)', json_encode($vector)),
            );
        }
    }

    public function testDisabledMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['isButtonDisabled'] as $vector) {
            self::assertSame(
                $vector['expected'],
                ButtonState::isDisabled($vector['loading'], $vector['disabled']),
            );
        }
    }

    public function testBusyMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveButtonBusy'] as $vector) {
            self::assertSame($vector['expected'], ButtonState::resolveBusy($vector['loading']));
        }
    }
}
