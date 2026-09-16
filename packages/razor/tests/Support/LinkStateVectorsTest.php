<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\LinkState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfLink.
 */
final class LinkStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/link/state-vectors.json';
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

        self::assertSame(['resolveLinkClasses', 'resolveLinkRel'], $rules);
        // And the mirror has no method named after navigation: no element
        // choice, no href from a route, nothing that takes a `to`.
        $methods = array_map(
            static fn (\ReflectionMethod $method): string => $method->getName(),
            (new \ReflectionClass(LinkState::class))->getMethods(),
        );
        sort($methods);
        self::assertSame(['resolveClasses', 'resolveRel'], $methods);
    }

    public function testRelIsDerivedOnlyForBlankAndOnlyWhenNoRelIsGiven(): void
    {
        self::assertSame('noopener noreferrer', LinkState::resolveRel(null, '_blank'));
        self::assertNull(LinkState::resolveRel(null, '_self'));
        self::assertNull(LinkState::resolveRel(null, null));
    }

    public function testAnExplicitRelWinsWithoutMerging(): void
    {
        self::assertSame('nofollow', LinkState::resolveRel('nofollow', '_blank'));
    }

    public function testAnEmptyStringRelIsNotGiven(): void
    {
        self::assertSame('noopener noreferrer', LinkState::resolveRel('', '_blank'));
        self::assertNull(LinkState::resolveRel('', null));
    }

    public function testTheDefaultsEmitNoModifierAndUnderlineComesBeforeTone(): void
    {
        self::assertSame(['vf-link'], LinkState::resolveClasses('none', 'default'));
        self::assertSame(
            ['vf-link', 'vf-link--underline-always', 'vf-link--muted'],
            LinkState::resolveClasses('always', 'muted'),
        );
    }

    public function testClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveLinkClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                LinkState::resolveClasses($vector['underline'], $vector['tone']),
                sprintf('resolveLinkClasses(%s)', json_encode($vector)),
            );
        }
    }

    public function testRelMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveLinkRel'] as $vector) {
            self::assertSame(
                $vector['expected'],
                LinkState::resolveRel($vector['rel'], $vector['target']),
                sprintf('resolveLinkRel(%s)', json_encode($vector)),
            );
        }
    }
}
