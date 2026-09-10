<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\CardState;
use Codemonster\VueForge\Razor\Support\PanelState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfPanel.
 */
final class PanelStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/panel/state-vectors.json';
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

        self::assertSame(['resolvePanelClasses', 'resolvePanelRegions'], $rules);
    }

    public function testAnEmptyStringTitleRendersNoHeaderAtAll(): void
    {
        self::assertFalse(PanelState::resolveRegions('', false)['header']);
        self::assertTrue(PanelState::resolveRegions('Workspace', false)['header']);
    }

    public function testAHeaderSlotSuppressesTheFallbackHeadingEvenWithATitle(): void
    {
        self::assertSame(
            ['header' => true, 'headerTitle' => false],
            PanelState::resolveRegions('Workspace', true, true),
        );
    }

    public function testTheHeaderWrapperAndTheFallbackHeadingAreKeyedOnDifferentQuestions(): void
    {
        // A header slot that renders nothing still opens the wrapper, and the
        // fallback heading comes back inside it.
        self::assertSame(
            ['header' => true, 'headerTitle' => true],
            PanelState::resolveRegions(null, true, false),
        );
    }

    public function testItDecidesNothingAboutABodyWrapperOrAFooter(): void
    {
        // The structural difference from VfCard, asserted as a property of the
        // rule. A panel's default slot renders straight into the section with
        // no wrapper and no condition, and a panel has no footer at all, so
        // there is nothing here for an implementation to consume.
        self::assertSame(['header', 'headerTitle'], array_keys(PanelState::resolveRegions('Workspace', false)));
    }

    public function testItIsNotTheCardResolverUnderAnotherName(): void
    {
        // Same inputs, different shapes. If PanelState were ever implemented
        // through CardState, or the two given one implementation over a block
        // name, this fails here rather than eight gates later.
        $panel = PanelState::resolveRegions('Workspace', false);
        $card = CardState::resolveRegions('Workspace', false, true, true);

        self::assertNotSame(array_keys($card), array_keys($panel));
        self::assertArrayNotHasKey('body', $panel);
        self::assertArrayNotHasKey('footer', $panel);
    }

    public function testNoRuleEverProducesACardClass(): void
    {
        foreach ([false, true] as $subtle) {
            self::assertStringNotContainsString('vf-card', implode(' ', PanelState::resolveClasses($subtle)));
        }
    }

    public function testClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolvePanelClasses'] as $vector) {
            self::assertSame($vector['expected'], PanelState::resolveClasses($vector['subtle']));
        }
    }

    public function testRegionsMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolvePanelRegions'] as $vector) {
            self::assertSame(
                $vector['expected'],
                PanelState::resolveRegions(
                    $vector['title'],
                    $vector['hasHeaderSlot'],
                    $vector['headerSlotContent'],
                ),
                sprintf('resolvePanelRegions(%s)', json_encode($vector)),
            );
        }
    }
}
