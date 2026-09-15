<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\TabsState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfTabs.
 *
 * Only the server sections: the vector file names them in `$serverRules`, and
 * this test asserts that the mirror has a method for exactly those and for
 * none of the browser rules - a `resolveNavigationTarget` or an
 * `resolveIndicatorStyle` appearing here would be a server pretending to
 * hold a key or a rect.
 */
final class TabsStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/tabs/state-vectors.json';
        $contents = file_get_contents($path);
        self::assertIsString($contents, "Shared vectors are missing at [{$path}].");
        self::$vectors = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    }

    public function testTheVectorFileNamesTheServerSubsetAndTheMirrorHoldsExactlyThat(): void
    {
        $rules = array_values(array_filter(
            array_keys(self::$vectors),
            static fn (string $key): bool => !str_starts_with($key, '$'),
        ));
        sort($rules);

        self::assertSame([
            'isTabsItemSelected',
            'resolveTabsActiveIndex',
            'resolveTabsActiveValue',
            'resolveTabsControlledPanelId',
            'resolveTabsFallbackValue',
            'resolveTabsIndicatorStyle',
            'resolveTabsNavigationTarget',
            'resolveTabsPanelId',
            'resolveTabsScrollerState',
            'resolveTabsScrollerStep',
            'resolveTabsTabId',
            'resolveTabsTabIndex',
        ], $rules);

        $serverRules = self::$vectors['$serverRules'];
        sort($serverRules);
        self::assertSame([
            'isTabsItemSelected',
            'resolveTabsActiveIndex',
            'resolveTabsActiveValue',
            'resolveTabsControlledPanelId',
            'resolveTabsFallbackValue',
            'resolveTabsPanelId',
            'resolveTabsTabId',
            'resolveTabsTabIndex',
        ], $serverRules);

        $methods = array_map(
            static fn (\ReflectionMethod $method): string => $method->getName(),
            (new \ReflectionClass(TabsState::class))->getMethods(\ReflectionMethod::IS_PUBLIC),
        );
        sort($methods);
        self::assertSame([
            'isItemSelected',
            'resolveActiveIndex',
            'resolveActiveValue',
            'resolveControlledPanelId',
            'resolveFallbackValue',
            'resolvePanelId',
            'resolveTabId',
            'resolveTabIndex',
        ], $methods, 'TabsState mirrors exactly the server rules: nothing that holds state, knows a key or measures a rect');
    }

    public function testResolveFallbackValueVectors(): void
    {
        foreach (self::$vectors['resolveTabsFallbackValue'] as $vector) {
            self::assertSame(
                $vector['expected'],
                TabsState::resolveFallbackValue($vector['items']),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testResolveActiveValueVectors(): void
    {
        foreach (self::$vectors['resolveTabsActiveValue'] as $vector) {
            self::assertSame(
                $vector['expected'],
                TabsState::resolveActiveValue($vector['modelValue'] ?? null, $vector['internalValue'] ?? null, $vector['items']),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testResolveActiveIndexVectors(): void
    {
        foreach (self::$vectors['resolveTabsActiveIndex'] as $vector) {
            self::assertSame(
                $vector['expected'],
                TabsState::resolveActiveIndex($vector['items'], $vector['activeValue'] ?? null),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testIsItemSelectedVectors(): void
    {
        foreach (self::$vectors['isTabsItemSelected'] as $vector) {
            self::assertSame(
                $vector['expected'],
                TabsState::isItemSelected($vector['activeValue'] ?? null, $vector['item']),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testResolveTabIndexVectors(): void
    {
        foreach (self::$vectors['resolveTabsTabIndex'] as $vector) {
            self::assertSame(
                $vector['expected'],
                TabsState::resolveTabIndex($vector['activeValue'] ?? null, $vector['item']),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testResolveTabIdVectors(): void
    {
        foreach (self::$vectors['resolveTabsTabId'] as $vector) {
            self::assertSame(
                $vector['expected'],
                TabsState::resolveTabId($vector['baseId'], $vector['item']),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testResolvePanelIdVectors(): void
    {
        foreach (self::$vectors['resolveTabsPanelId'] as $vector) {
            self::assertSame(
                $vector['expected'],
                TabsState::resolvePanelId($vector['baseId'], $vector['item']),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testResolveControlledPanelIdVectors(): void
    {
        foreach (self::$vectors['resolveTabsControlledPanelId'] as $vector) {
            self::assertSame(
                $vector['expected'],
                TabsState::resolveControlledPanelId($vector['baseId'], $vector['item'], $vector['hasPanelSlot']),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }
}
