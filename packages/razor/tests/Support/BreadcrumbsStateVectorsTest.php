<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\BreadcrumbsState;
use Codemonster\VueForge\Razor\Support\LinkState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfBreadcrumbs.
 */
final class BreadcrumbsStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/breadcrumbs/state-vectors.json';
        $contents = file_get_contents($path);
        self::assertIsString($contents, "Shared vectors are missing at [{$path}].");
        self::$vectors = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    }

    public function testTheVectorFileCoversEveryMirroredRuleAndNothingAboutTheRouterBranch(): void
    {
        $rules = array_values(array_filter(
            array_keys(self::$vectors),
            static fn (string $key): bool => !str_starts_with($key, '$'),
        ));
        sort($rules);

        self::assertSame(['isBreadcrumbLink', 'resolveBreadcrumbCurrentFlags', 'resolveBreadcrumbItemClasses'], $rules);
        // And the mirror has no method named after navigation: no element
        // choice, no href from a route, nothing that takes a `to`. The rel
        // rule is not restated either - it is LinkState's.
        $methods = array_map(
            static fn (\ReflectionMethod $method): string => $method->getName(),
            (new \ReflectionClass(BreadcrumbsState::class))->getMethods(),
        );
        sort($methods);
        self::assertSame(['isLink', 'resolveCurrentFlags', 'resolveItemClasses'], $methods);
        foreach (self::$vectors['isBreadcrumbLink'] as $vector) {
            self::assertArrayNotHasKey('to', $vector);
            self::assertTrue(is_string($vector['destination']) || $vector['destination'] === null);
        }
    }

    public function testTheLastItemIsCurrentOnlyWhenNoItemIsFlagged(): void
    {
        self::assertSame([false, true], BreadcrumbsState::resolveCurrentFlags([null, null]));
        self::assertSame([false, true, false], BreadcrumbsState::resolveCurrentFlags([null, true, null]));
        self::assertSame([true, true, false], BreadcrumbsState::resolveCurrentFlags([true, true, null]));
        self::assertSame([], BreadcrumbsState::resolveCurrentFlags([]));
    }

    public function testAnEmptyStringDestinationIsNoDestinationAndZeroIsOne(): void
    {
        self::assertFalse(BreadcrumbsState::isLink(null, false, ''));
        self::assertTrue(BreadcrumbsState::isLink(null, false, '/docs'));
        self::assertTrue(BreadcrumbsState::isLink(null, false, '0'));
        self::assertFalse(BreadcrumbsState::isLink(null, true, '/docs'));
        self::assertFalse(BreadcrumbsState::isLink(true, false, '/docs'));
    }

    public function testTheRelRuleIsTheLinkRuleUnchanged(): void
    {
        self::assertSame('noopener noreferrer', LinkState::resolveRel(null, '_blank'));
        self::assertSame('nofollow', LinkState::resolveRel('nofollow', '_blank'));
        self::assertSame('noopener noreferrer', LinkState::resolveRel('', '_blank'));
        self::assertNull(LinkState::resolveRel(null, '_self'));
    }

    public function testCurrentFlagsMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveBreadcrumbCurrentFlags'] as $vector) {
            self::assertSame(
                $vector['expected'],
                BreadcrumbsState::resolveCurrentFlags($vector['flags']),
                sprintf('resolveBreadcrumbCurrentFlags(%s)', json_encode($vector)),
            );
        }
    }

    public function testTheLinkTestMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['isBreadcrumbLink'] as $vector) {
            self::assertSame(
                $vector['expected'],
                BreadcrumbsState::isLink($vector['disabled'], $vector['current'], $vector['destination']),
                sprintf('isBreadcrumbLink(%s)', json_encode($vector)),
            );
        }
    }

    public function testItemClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveBreadcrumbItemClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                BreadcrumbsState::resolveItemClasses($vector['disabled']),
                sprintf('resolveBreadcrumbItemClasses(%s)', json_encode($vector)),
            );
        }
    }
}
