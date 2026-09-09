<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\CheckableState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for the checkable controls.
 *
 * Reads the same vector file the shared-core TypeScript suite reads, so the two
 * implementations cannot drift apart.
 */
final class CheckableStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/checkable/state-vectors.json';
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
            'isRadioChecked',
            'resolveCheckboxAriaChecked',
            'resolveCheckboxClasses',
            'resolveRadioClasses',
            'resolveSwitchClasses',
        ], $rules);
    }

    public function testCheckboxClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveCheckboxClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                CheckableState::resolveCheckboxClasses(
                    $vector['size'],
                    $vector['checked'],
                    $vector['indeterminate'],
                    $vector['invalid'],
                    $vector['disabled'],
                ),
                sprintf('resolveCheckboxClasses(%s)', json_encode($vector)),
            );
        }
    }

    public function testCheckboxAriaCheckedMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveCheckboxAriaChecked'] as $vector) {
            self::assertSame(
                $vector['expected'],
                CheckableState::resolveCheckboxAriaChecked($vector['checked'], $vector['indeterminate']),
            );
        }
    }

    public function testRadioClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveRadioClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                CheckableState::resolveRadioClasses(
                    $vector['size'],
                    $vector['checked'],
                    $vector['invalid'],
                    $vector['disabled'],
                ),
            );
        }
    }

    public function testRadioCheckedMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['isRadioChecked'] as $vector) {
            self::assertSame(
                $vector['expected'],
                CheckableState::isRadioChecked($vector['modelValue'], $vector['value']),
                sprintf('isRadioChecked(%s)', json_encode($vector)),
            );
        }
    }

    public function testSwitchClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveSwitchClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                CheckableState::resolveSwitchClasses(
                    $vector['size'],
                    $vector['isStatic'],
                    $vector['thumbContrast'],
                    $vector['checked'],
                    $vector['invalid'],
                    $vector['disabled'],
                ),
                sprintf('resolveSwitchClasses(%s)', json_encode($vector)),
            );
        }
    }
}
