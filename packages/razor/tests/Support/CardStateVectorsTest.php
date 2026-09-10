<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\CardState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfCard.
 */
final class CardStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/card/state-vectors.json';
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

        self::assertSame(['resolveCardClasses', 'resolveCardRegions'], $rules);
    }

    public function testAnEmptyStringTitleRendersNoHeaderAtAll(): void
    {
        self::assertFalse(CardState::resolveRegions('', false, false, false)['header']);
        self::assertTrue(CardState::resolveRegions('Workspace', false, false, false)['header']);
    }

    public function testAHeaderSlotSuppressesTheFallbackHeadingEvenWithATitle(): void
    {
        self::assertSame(
            ['header' => true, 'headerTitle' => false, 'body' => false, 'footer' => false],
            CardState::resolveRegions('Workspace', true, false, false, true),
        );
    }

    public function testTheHeaderWrapperAndTheFallbackHeadingAreKeyedOnDifferentQuestions(): void
    {
        // A header slot that renders nothing still opens the wrapper, and the
        // fallback heading comes back inside it.
        self::assertSame(
            ['header' => true, 'headerTitle' => true, 'body' => false, 'footer' => false],
            CardState::resolveRegions(null, true, false, false, false),
        );
    }

    public function testTheWrappersAreKeyedOnSlotPresenceRatherThanContent(): void
    {
        self::assertTrue(CardState::resolveRegions(null, false, true, false)['body']);
        self::assertTrue(CardState::resolveRegions(null, false, false, true)['footer']);
    }

    public function testNoRuleEverProducesAPanelClass(): void
    {
        // VfPanel is deliberately not migrated with VfCard. This is what
        // notices if these rules are ever generalised over a block name.
        foreach ([false, true] as $compact) {
            self::assertStringNotContainsString('vf-panel', implode(' ', CardState::resolveClasses($compact)));
        }
    }

    public function testClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveCardClasses'] as $vector) {
            self::assertSame($vector['expected'], CardState::resolveClasses($vector['compact']));
        }
    }

    public function testRegionsMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveCardRegions'] as $vector) {
            self::assertSame(
                $vector['expected'],
                CardState::resolveRegions(
                    $vector['title'],
                    $vector['hasHeaderSlot'],
                    $vector['hasDefaultSlot'],
                    $vector['hasFooterSlot'],
                    $vector['headerSlotContent'],
                ),
                sprintf('resolveCardRegions(%s)', json_encode($vector)),
            );
        }
    }
}
