<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\GroupBoxState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfGroupBox.
 */
final class GroupBoxStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/group-box/state-vectors.json';
        $contents = file_get_contents($path);
        self::assertIsString($contents, "Shared vectors are missing at [{$path}].");
        self::$vectors = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    }

    public function testTheVectorFileCoversEveryMirroredRuleAndNothingThatHoldsState(): void
    {
        $rules = array_values(array_filter(
            array_keys(self::$vectors),
            static fn (string $key): bool => !str_starts_with($key, '$'),
        ));
        sort($rules);

        self::assertSame(
            ['resolveGroupBoxClasses', 'resolveGroupBoxFlags', 'resolveGroupBoxHasTitle', 'resolveGroupBoxOpen'],
            $rules,
        );
        self::assertSame([], array_filter(
            (new \ReflectionClass(GroupBoxState::class))->getMethods(),
            static fn (\ReflectionMethod $method): bool => preg_match('/toggle|next|listen|machine/i', $method->getName()) === 1,
        ), 'GroupBoxState grew a rule that holds or advances state');
    }

    public function testTheTitleZeroIsATitleAndTheEmptyStringIsNot(): void
    {
        // The one place PHP truthiness and the reference disagree.
        self::assertTrue(GroupBoxState::hasTitle('0', false));
        self::assertFalse(GroupBoxState::hasTitle('', false));
        self::assertFalse(GroupBoxState::hasTitle(null, false));
    }

    public function testHasTitleVectors(): void
    {
        foreach (self::$vectors['resolveGroupBoxHasTitle'] as $vector) {
            self::assertSame(
                $vector['expected'],
                GroupBoxState::hasTitle($vector['title'] ?? null, $vector['hasTitleSlot']),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testResolveOpenVectors(): void
    {
        foreach (self::$vectors['resolveGroupBoxOpen'] as $vector) {
            self::assertSame(
                $vector['expected'],
                GroupBoxState::resolveOpen($vector['collapsed'] ?? null, $vector['defaultCollapsed'] ?? null),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testResolveFlagsVectors(): void
    {
        $mirrored = 0;
        foreach (self::$vectors['resolveGroupBoxFlags'] as $vector) {
            if (($vector['$vueOnly'] ?? false) === true) {
                continue;
            }
            $mirrored++;
            self::assertSame(
                $vector['expected'],
                GroupBoxState::resolveFlags($vector['hasTitle'], $vector['collapsible'], $vector['open'], $vector['disabled']),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
        self::assertGreaterThan(0, $mirrored);
    }

    public function testResolveClassesVectors(): void
    {
        foreach (self::$vectors['resolveGroupBoxClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                GroupBoxState::resolveClasses($vector['hasTitle'], $vector['collapsible'], $vector['collapsed']),
            );
        }
    }
}
