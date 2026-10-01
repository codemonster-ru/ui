<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\NavMenuState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfNavMenu.
 *
 * Only the server sections: the vector file names them in `$serverRules`, and
 * this test asserts that the mirror has a method for exactly those and for
 * neither browser rule - a `resolveToggledExpandedValues` or a
 * `resolveMeasuredCompact` here would be a server pretending to hold a click
 * or a measurement.
 */
final class NavMenuStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/nav-menu/state-vectors.json';
        $contents = file_get_contents($path);
        self::assertIsString($contents, "Shared vectors are missing at [{$path}].");
        self::$vectors = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    }

    public function testTheVectorFileNamesTheServerSubsetAndTheMirrorHoldsExactlyThat(): void
    {
        $serverRules = self::$vectors['$serverRules'];
        sort($serverRules);
        self::assertSame([
            'resolveNavMenuAncestorValues',
            'resolveNavMenuBranchClasses',
            'resolveNavMenuCollapseClasses',
            'resolveNavMenuCompact',
            'resolveNavMenuGroupClasses',
            'resolveNavMenuHasDescendant',
            'resolveNavMenuIconClasses',
            'resolveNavMenuIsBranch',
            'resolveNavMenuIsLink',
            'resolveNavMenuIsSimple',
            'resolveNavMenuLeafClasses',
            'resolveNavMenuNodeClasses',
            'resolveNavMenuRootClasses',
            'resolveNavMenuShowsExternalIcon',
            'resolveNavMenuSyncedExpandedValues',
        ], $serverRules);

        $methods = array_map(
            static fn (\ReflectionMethod $method): string => $method->getName(),
            (new \ReflectionClass(NavMenuState::class))->getMethods(\ReflectionMethod::IS_PUBLIC),
        );
        sort($methods);
        self::assertSame(
            array_map(static fn (string $rule): string => 'resolve' . substr($rule, strlen('resolveNavMenu')), $serverRules),
            $methods,
        );
    }

    public function testResolveIsBranch(): void
    {
        foreach (self::$vectors['resolveNavMenuIsBranch'] as $vector) {
            self::assertSame($vector['expected'], NavMenuState::resolveIsBranch($vector['item']));
        }
    }

    public function testResolveIsLink(): void
    {
        foreach (self::$vectors['resolveNavMenuIsLink'] as $vector) {
            self::assertSame($vector['expected'], NavMenuState::resolveIsLink($vector['item']));
        }
    }

    public function testResolveShowsExternalIcon(): void
    {
        foreach (self::$vectors['resolveNavMenuShowsExternalIcon'] as $vector) {
            self::assertSame($vector['expected'], NavMenuState::resolveShowsExternalIcon($vector['item']));
        }
    }

    public function testResolveIsSimple(): void
    {
        foreach (self::$vectors['resolveNavMenuIsSimple'] as $vector) {
            self::assertSame($vector['expected'], NavMenuState::resolveIsSimple($vector['items']));
        }
    }

    public function testResolveAncestorValues(): void
    {
        foreach (self::$vectors['resolveNavMenuAncestorValues'] as $vector) {
            self::assertSame(
                $vector['expected'],
                NavMenuState::resolveAncestorValues($vector['items'], $vector['value'] ?? null),
            );
        }
    }

    public function testResolveHasDescendant(): void
    {
        foreach (self::$vectors['resolveNavMenuHasDescendant'] as $vector) {
            self::assertSame(
                $vector['expected'],
                NavMenuState::resolveHasDescendant($vector['item'], $vector['value'] ?? null),
            );
        }
    }

    public function testResolveSyncedExpandedValues(): void
    {
        foreach (self::$vectors['resolveNavMenuSyncedExpandedValues'] as $vector) {
            self::assertSame(
                $vector['expected'],
                NavMenuState::resolveSyncedExpandedValues($vector['items'], $vector['expanded'], $vector['active'] ?? null),
            );
        }
    }

    public function testResolveCompact(): void
    {
        foreach (self::$vectors['resolveNavMenuCompact'] as $vector) {
            self::assertSame(
                $vector['expected'],
                NavMenuState::resolveCompact($vector['variant'], $vector['compact'] ?? null, $vector['measured']),
            );
        }
    }

    public function testResolveRootClasses(): void
    {
        foreach (self::$vectors['resolveNavMenuRootClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                NavMenuState::resolveRootClasses($vector['variant'], $vector['simple'], $vector['compact']),
            );
        }
    }

    public function testResolveNodeClasses(): void
    {
        foreach (self::$vectors['resolveNavMenuNodeClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                NavMenuState::resolveNodeClasses($vector['level'], $vector['expanded'], $vector['active'], $vector['ancestorActive']),
            );
        }
    }

    public function testResolveGroupClasses(): void
    {
        foreach (self::$vectors['resolveNavMenuGroupClasses'] as $vector) {
            self::assertSame($vector['expected'], NavMenuState::resolveGroupClasses($vector['level']));
        }
    }

    public function testResolveBranchClasses(): void
    {
        foreach (self::$vectors['resolveNavMenuBranchClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                NavMenuState::resolveBranchClasses(
                    $vector['level'],
                    $vector['hasLeadingIcon'],
                    $vector['ancestorActive'],
                    $vector['expanded'],
                ),
            );
        }
    }

    public function testResolveLeafClasses(): void
    {
        foreach (self::$vectors['resolveNavMenuLeafClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                NavMenuState::resolveLeafClasses(
                    $vector['level'],
                    $vector['hasLeadingIcon'],
                    $vector['active'],
                    $vector['ancestorActive'],
                    $vector['disabled'],
                ),
            );
        }
    }

    public function testResolveIconClasses(): void
    {
        foreach (self::$vectors['resolveNavMenuIconClasses'] as $vector) {
            self::assertSame($vector['expected'], NavMenuState::resolveIconClasses($vector['expanded']));
        }
    }

    public function testResolveCollapseClasses(): void
    {
        foreach (self::$vectors['resolveNavMenuCollapseClasses'] as $vector) {
            self::assertSame($vector['expected'], NavMenuState::resolveCollapseClasses($vector['level']));
        }
    }
}
