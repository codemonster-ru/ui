<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\TabsComponent;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfTabs.
 *
 * The assertions mirror
 * packages/core/src/components/tabs/VfTabs.characterization.spec.ts for the
 * half a server renders: the pre-mount structure, one native button[role=tab]
 * per item, the two hidden scroll buttons with the neutral chevrons, the
 * value resolution with its fallback and its quirks, aria-selected and the
 * roving tabindex, native disabled, the ids with their overrides and the
 * aria-controls / aria-labelledby graph, the one panel, the inert per-item
 * templates, the tab and panel slots, and the consumer attributes. What a
 * server cannot render - the selection change, the keyboard, the focus, the
 * events, the indicator measurement, the overflow - is the browser gate's
 * (scripts/ci/check-razor-browser.mjs) and the parity harness's, and the two
 * things this suite pins about it are that the no-JS output is truthful and
 * that nothing here pretends to measure.
 */
final class TabsComponentTest extends TestCase
{
    private const ITEMS = [
        ['value' => 'overview', 'label' => 'Overview'],
        ['value' => 'settings', 'label' => 'Settings'],
        ['value' => 'billing', 'label' => 'Billing'],
    ];

    private const HIDDEN_LEFT = '<button class="vf-horizontal-scroller__control vf-horizontal-scroller__control--left vf-tabs__scroll-button vf-tabs__scroll-button--left vf-horizontal-scroller__control--hidden vf-tabs__scroll-button--hidden" type="button" aria-label="Scroll tabs left" aria-hidden="true" tabindex="-1" disabled>';
    private const HIDDEN_RIGHT = '<button class="vf-horizontal-scroller__control vf-horizontal-scroller__control--right vf-tabs__scroll-button vf-tabs__scroll-button--right vf-horizontal-scroller__control--hidden vf-tabs__scroll-button--hidden" type="button" aria-label="Scroll tabs right" aria-hidden="true" tabindex="-1" disabled>';
    private const INDICATOR = '<span aria-hidden="true" class="vf-tabs__baseline"></span><span aria-hidden="true" class="vf-tabs__indicator" style="opacity:0;transform:translateX(0);width:0;"></span>';

    protected function setUp(): void
    {
        FieldIds::reset();
    }

    /**
     * @param array<string, mixed> $props
     * @param array<string, string> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-tabs');
        self::assertNotNull($component, 'The vf-tabs component must be registered by the provider.');
        self::assertInstanceOf(TabsComponent::class, $component);

        $closures = [];
        foreach ($slots as $name => $markup) {
            $closures[$name] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
        }

        return $component->render(new ComponentRenderContext($props + ['items' => self::ITEMS], $closures))->value();
    }

    /**
     * @param list<string> $disabled
     * @return list<array{value: string, label: string, disabled?: bool}>
     */
    private static function items(array $disabled = []): array
    {
        return array_map(
            static fn (array $item): array => in_array($item['value'], $disabled, true) ? $item + ['disabled' => true] : $item,
            self::ITEMS,
        );
    }

    /** @return list<string> */
    private static function tabs(string $markup): array
    {
        preg_match_all('/<button[^>]*class="vf-tabs__tab"[^>]*>/', $markup, $matches);

        return $matches[0];
    }

    /** @return list<string|null> */
    private static function attribute(string $markup, string $name): array
    {
        return array_map(
            static function (string $tag) use ($name): ?string {
                return preg_match('/ ' . preg_quote($name, '/') . '="([^"]*)"/', $tag, $match) === 1 ? $match[1] : null;
            },
            self::tabs($markup),
        );
    }

    // ------------------------------------------------------------ structure

    public function testItRendersTheReferencesPreMountMarkupWithAPanelSlot(): void
    {
        $markup = $this->render([], ['panel' => '<p>Panel</p>']);

        self::assertStringStartsWith('<div class="vf-tabs" data-vf-razor="tabs"><div class="vf-horizontal-scroller vf-tabs__list">' . self::HIDDEN_LEFT, $markup);
        self::assertStringContainsString(
            '<div class="vf-horizontal-scroller__viewport vf-tabs__list-scroller" style="--vf-horizontal-scroller-scrollbar-width:none;"><div role="tablist" aria-orientation="horizontal">'
            . '<button id="vf-tabs-r-0-tab-overview" aria-controls="vf-tabs-r-0-panel-overview" aria-selected="true" tabindex="0" class="vf-tabs__tab" role="tab" type="button" data-vf-razor-tabs-value="overview">Overview</button>'
            . '<button id="vf-tabs-r-0-tab-settings" aria-controls="vf-tabs-r-0-panel-settings" aria-selected="false" tabindex="-1" class="vf-tabs__tab" role="tab" type="button" data-vf-razor-tabs-value="settings">Settings</button>'
            . '<button id="vf-tabs-r-0-tab-billing" aria-controls="vf-tabs-r-0-panel-billing" aria-selected="false" tabindex="-1" class="vf-tabs__tab" role="tab" type="button" data-vf-razor-tabs-value="billing">Billing</button>'
            . '</div></div>' . self::HIDDEN_RIGHT,
            $markup,
        );
        self::assertStringContainsString(self::INDICATOR . '</div>', $markup);
        self::assertStringContainsString(
            '<div id="vf-tabs-r-0-panel-overview" aria-labelledby="vf-tabs-r-0-tab-overview" class="vf-tabs__panel" role="tabpanel" tabindex="0"><p>Panel</p></div>',
            $markup,
        );
        self::assertStringEndsWith(
            '<template data-vf-razor-tabs-panel="0"><p>Panel</p></template>'
            . '<template data-vf-razor-tabs-panel="1"><p>Panel</p></template>'
            . '<template data-vf-razor-tabs-panel="2"><p>Panel</p></template></div>',
            $markup,
        );
    }

    public function testItRendersNoAriaControlsNoPanelAndNoTemplateWithoutAPanelSlot(): void
    {
        $markup = $this->render();

        self::assertStringNotContainsString('aria-controls', $markup);
        self::assertStringNotContainsString('tabpanel', $markup);
        self::assertStringNotContainsString('<template', $markup);
        self::assertStringEndsWith(self::INDICATOR . '</div></div>', $markup);
        self::assertSame(['vf-tabs-r-0-tab-overview', 'vf-tabs-r-0-tab-settings', 'vf-tabs-r-0-tab-billing'], self::attribute($markup, 'id'));
    }

    public function testItOwnsExactlyFiveNativeButtonsAndOneTablist(): void
    {
        $markup = $this->render();

        self::assertSame(3, substr_count($markup, 'data-vf-razor-tabs-value='), 'the value marker is adapter metadata on every tab');
        self::assertSame(5, substr_count($markup, '<button'));
        self::assertSame(3, substr_count($markup, 'role="tab"'));
        self::assertSame(1, substr_count($markup, 'role="tablist"'));
        self::assertSame(5, substr_count($markup, 'type="button"'));
        self::assertStringNotContainsString('aria-disabled', $markup);
    }

    public function testTheScrollButtonsCarryTheNeutralChevronsAtTheReferencesSize(): void
    {
        $markup = $this->render();

        self::assertSame(2, substr_count($markup, 'width="var(--vf-horizontal-scroller-control-icon-size)" height="var(--vf-horizontal-scroller-control-icon-size)" aria-hidden="true"'));
        self::assertStringContainsString('<polyline points="15.25 5.75 9 12 15.25 18.25"/>', $markup);
        self::assertStringContainsString('<polyline points="8.75 5.75 15 12 8.75 18.25"/>', $markup);
        self::assertSame(2, substr_count($markup, '<span class="vf-icon-wrapper" style="--vf-icon-scale:1;--vf-icon-offset-x:0;--vf-icon-offset-y:0;">'));
    }

    public function testItRendersAnEmptyTablistAndNoPanelForNoItems(): void
    {
        $markup = $this->render(['items' => []], ['panel' => '<p>Panel</p>']);

        self::assertStringContainsString('<div role="tablist" aria-orientation="horizontal"></div>', $markup);
        self::assertStringNotContainsString('tabpanel', $markup);
        self::assertStringNotContainsString('<template', $markup);
        self::assertSame(2, substr_count($markup, '<button'));
    }

    // ------------------------------------------------------------ selection

    public function testItSelectsTheFirstEnabledItemByDefault(): void
    {
        $markup = $this->render(['items' => self::items(['overview'])], ['panel' => '<p>P</p>']);

        self::assertSame(['false', 'true', 'false'], self::attribute($markup, 'aria-selected'));
        self::assertSame(['-1', '0', '-1'], self::attribute($markup, 'tabindex'));
        self::assertStringContainsString('<button id="vf-tabs-r-0-tab-overview" aria-controls="vf-tabs-r-0-panel-overview" aria-selected="false" disabled tabindex="-1"', $markup);
        self::assertStringContainsString('id="vf-tabs-r-0-panel-settings" aria-labelledby="vf-tabs-r-0-tab-settings"', $markup);
    }

    public function testDefaultValueSeedsTheSelection(): void
    {
        $markup = $this->render(['default-value' => 'billing'], ['panel' => '<p>P</p>']);

        self::assertSame(['false', 'false', 'true'], self::attribute($markup, 'aria-selected'));
        self::assertSame(['-1', '-1', '0'], self::attribute($markup, 'tabindex'));
        self::assertStringContainsString('id="vf-tabs-r-0-panel-billing" aria-labelledby="vf-tabs-r-0-tab-billing"', $markup);
        self::assertSame(self::attribute($markup, 'aria-selected'), self::attribute($this->render(['defaultValue' => 'billing']), 'aria-selected'));
    }

    public function testModelValueWinsOverDefaultValue(): void
    {
        $markup = $this->render(['model-value' => 'settings', 'default-value' => 'billing']);

        self::assertSame(['false', 'true', 'false'], self::attribute($markup, 'aria-selected'));
        self::assertSame(self::attribute($markup, 'aria-selected'), self::attribute($this->render(['modelValue' => 'settings', 'defaultValue' => 'billing']), 'aria-selected'));
    }

    /** @return iterable<string, array{string}> */
    public static function nothingSelected(): iterable
    {
        yield 'unknown' => ['nope'];
        yield 'empty string' => [''];
    }

    /** @dataProvider nothingSelected */
    public function testAnUnknownOrEmptyControlledValueSelectsNothing(string $modelValue): void
    {
        $markup = $this->render(['model-value' => $modelValue, 'default-value' => 'settings'], ['panel' => '<p>P</p>']);

        self::assertSame(['false', 'false', 'false'], self::attribute($markup, 'aria-selected'));
        self::assertSame(['-1', '-1', '-1'], self::attribute($markup, 'tabindex'));
        self::assertStringNotContainsString('tabpanel', $markup);
        self::assertSame(3, substr_count($markup, 'aria-controls='), 'every tab still names its panel');
        self::assertSame(3, substr_count($markup, '<template data-vf-razor-tabs-panel='), 'every panel waits inert');
    }

    public function testANullModelValueIsNothingSaidAndFallsThroughToDefaultValue(): void
    {
        $markup = $this->render(['model-value' => null, 'default-value' => 'settings']);

        self::assertSame(['false', 'true', 'false'], self::attribute($markup, 'aria-selected'));
    }

    public function testADisabledDefaultValueStaysSelectedAndTabbableWithItsPanel(): void
    {
        $markup = $this->render(['items' => self::items(['settings']), 'default-value' => 'settings'], ['panel' => '<p>P</p>']);

        self::assertSame(['false', 'true', 'false'], self::attribute($markup, 'aria-selected'));
        self::assertSame(['-1', '0', '-1'], self::attribute($markup, 'tabindex'));
        self::assertStringContainsString('aria-selected="true" disabled tabindex="0"', $markup);
        self::assertStringContainsString('aria-labelledby="vf-tabs-r-0-tab-settings"', $markup);
    }

    public function testEveryItemDisabledSelectsNothing(): void
    {
        $markup = $this->render(['items' => self::items(['overview', 'settings', 'billing'])], ['panel' => '<p>P</p>']);

        self::assertSame(['false', 'false', 'false'], self::attribute($markup, 'aria-selected'));
        self::assertSame(['-1', '-1', '-1'], self::attribute($markup, 'tabindex'));
        self::assertSame(3, substr_count($markup, ' disabled '));
        self::assertStringNotContainsString('tabpanel', $markup);
    }

    public function testDuplicateValuesShareIdsAndAreBothSelectedAndTabbable(): void
    {
        $markup = $this->render(
            ['items' => [self::ITEMS[0], ['value' => 'overview', 'label' => 'Again'], self::ITEMS[1]]],
            ['panel' => '<p>P</p>'],
        );

        self::assertSame(['vf-tabs-r-0-tab-overview', 'vf-tabs-r-0-tab-overview', 'vf-tabs-r-0-tab-settings'], self::attribute($markup, 'id'));
        self::assertSame(['vf-tabs-r-0-panel-overview', 'vf-tabs-r-0-panel-overview', 'vf-tabs-r-0-panel-settings'], self::attribute($markup, 'aria-controls'));
        self::assertSame(['true', 'true', 'false'], self::attribute($markup, 'aria-selected'));
        self::assertSame(['0', '0', '-1'], self::attribute($markup, 'tabindex'));
        self::assertSame(1, substr_count($markup, 'tabpanel'));
    }

    // ------------------------------------------------------ ids and relations

    public function testTabIdOverridesTheTabIdAndThePanelLabel(): void
    {
        $markup = $this->render(
            ['items' => [['value' => 'overview', 'label' => 'Overview', 'tabId' => 'custom-tab'], self::ITEMS[1]]],
            ['panel' => '<p>P</p>'],
        );

        self::assertSame(['custom-tab', 'vf-tabs-r-0-tab-settings'], self::attribute($markup, 'id'));
        self::assertStringContainsString('<div id="vf-tabs-r-0-panel-overview" aria-labelledby="custom-tab"', $markup);
    }

    public function testPanelIdOverridesTheAriaControlsAndThePanelId(): void
    {
        $markup = $this->render(
            ['items' => [['value' => 'overview', 'label' => 'Overview', 'panelId' => 'custom-panel'], self::ITEMS[1]]],
            ['panel' => '<p>P</p>'],
        );

        self::assertSame(['custom-panel', 'vf-tabs-r-0-panel-settings'], self::attribute($markup, 'aria-controls'));
        self::assertStringContainsString('<div id="custom-panel" aria-labelledby="vf-tabs-r-0-tab-overview"', $markup);
    }

    public function testAPanelIdItemWritesAriaControlsWithoutAPanelSlotAndNothingElseDoes(): void
    {
        $markup = $this->render(['items' => [['value' => 'overview', 'label' => 'Overview', 'panelId' => 'external'], self::ITEMS[1]]]);

        self::assertSame(['external', null], self::attribute($markup, 'aria-controls'));
        self::assertStringNotContainsString('tabpanel', $markup);
        self::assertStringNotContainsString('<template', $markup);
    }

    public function testIdsEmbedTheRawValueSpacesIncludedAndTheCounterIsPerRequest(): void
    {
        $markup = $this->render(['items' => [['value' => 'a b', 'label' => 'AB']]], ['panel' => '<p>P</p>']);
        $second = $this->render();

        self::assertStringContainsString('id="vf-tabs-r-0-tab-a b" aria-controls="vf-tabs-r-0-panel-a b"', $markup);
        self::assertStringContainsString('<div id="vf-tabs-r-0-panel-a b"', $markup);
        self::assertStringContainsString('id="vf-tabs-r-1-tab-overview"', $second);
    }

    // ---------------------------------------------------------------- slots

    public function testPerItemPanelSlotsWinOverTheSharedOneInThePanelAndInTheTemplates(): void
    {
        $markup = $this->render(
            ['default-value' => 'settings'],
            ['panel' => '<p>Shared</p>', 'panel1' => '<p>Settings only</p>'],
        );

        self::assertStringContainsString('role="tabpanel" tabindex="0"><p>Settings only</p></div>', $markup);
        self::assertStringContainsString('<template data-vf-razor-tabs-panel="0"><p>Shared</p></template>', $markup);
        self::assertStringContainsString('<template data-vf-razor-tabs-panel="1"><p>Settings only</p></template>', $markup);
        self::assertStringContainsString('<template data-vf-razor-tabs-panel="2"><p>Shared</p></template>', $markup);
    }

    public function testAPerItemPanelSlotAloneMakesATabsHaveAPanelSlot(): void
    {
        $markup = $this->render([], ['panel2' => '<p>Billing only</p>']);

        self::assertSame(3, substr_count($markup, 'aria-controls='));
        self::assertStringContainsString('role="tabpanel" tabindex="0"></div>', $markup, 'the active item has no content of its own and the shared slot is empty');
        self::assertStringContainsString('<template data-vf-razor-tabs-panel="2"><p>Billing only</p></template>', $markup);
    }

    public function testTabSlotsReplaceTheLabelPerItem(): void
    {
        $markup = $this->render([], ['tab1' => '<span>2. Settings</span>']);

        self::assertStringContainsString('data-vf-razor-tabs-value="overview">Overview</button>', $markup);
        self::assertStringContainsString('data-vf-razor-tabs-value="settings"><span>2. Settings</span></button>', $markup);
    }

    public function testLabelsAreEscaped(): void
    {
        $markup = $this->render(['items' => [['value' => 'x', 'label' => '<b>&']]]);

        self::assertStringContainsString('data-vf-razor-tabs-value="x">&lt;b&gt;&amp;</button>', $markup);
        self::assertStringContainsString('id="vf-tabs-r-0-tab-x"', $markup);
    }

    // ----------------------------------------------------------- attributes

    public function testConsumerAttributesLandOnTheRootAndNowhereElse(): void
    {
        $markup = $this->render([
            'class' => 'consumer',
            'style' => 'margin-top: 4px',
            'id' => 'root',
            'dir' => 'rtl',
            'data-testid' => 'tabs',
            'aria-label' => 'Sections',
        ]);

        self::assertStringStartsWith('<div class="vf-tabs consumer" style="margin-top: 4px" id="root" dir="rtl" data-testid="tabs" aria-label="Sections" data-vf-razor="tabs">', $markup);
        self::assertSame(1, substr_count($markup, 'dir="rtl"'));
        self::assertSame(1, substr_count($markup, 'aria-label="Sections"'));
    }

    public function testANullAttributeIsNothingSaid(): void
    {
        $markup = $this->render(['class' => null, 'id' => null, 'dir' => null]);

        self::assertStringStartsWith('<div class="vf-tabs" data-vf-razor="tabs">', $markup);
    }

    // ----------------------------------------------------------- validation

    public function testItRefusesAMalformedItem(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Item 0 of vf-tabs carries an unknown key [description]');
        $this->render(['items' => [['value' => 'a', 'label' => 'A', 'description' => 'x']]]);
    }

    public function testItRefusesANonBooleanDisabledAndANonStringOverride(): void
    {
        try {
            $this->render(['items' => [['value' => 'a', 'label' => 'A', 'disabled' => 'yes']]]);
            self::fail('a string disabled was accepted');
        } catch (\InvalidArgumentException $exception) {
            self::assertStringContainsString('non-boolean [disabled]', $exception->getMessage());
        }

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('non-string [panelId]');
        $this->render(['items' => [['value' => 'a', 'label' => 'A', 'panelId' => 7]]]);
    }

    public function testItRefusesItemsThatAreNotAList(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['items' => ['a' => ['value' => 'a', 'label' => 'A']]]);
    }

    // ---------------------------------------------------------------- no JS

    public function testTheNoJavaScriptOutputIsTruthfulAndPretendsNothing(): void
    {
        $markup = $this->render(['default-value' => 'settings'], ['panel' => '<p>P</p>']);

        // No readiness a browser has not measured.
        self::assertStringNotContainsString('scroll-controls-ready', $markup);
        self::assertStringNotContainsString('scroll-controls-animated', $markup);
        self::assertStringNotContainsString('vf-tabs__indicator--ready', $markup);
        self::assertStringNotContainsString('can-scroll', $markup);
        self::assertStringNotContainsString('vf-horizontal-scroller__fade', $markup);
        // Both controls hidden and inert; the indicator at its seed.
        self::assertStringContainsString(self::HIDDEN_LEFT, $markup);
        self::assertStringContainsString(self::HIDDEN_RIGHT, $markup);
        self::assertStringContainsString('style="opacity:0;transform:translateX(0);width:0;"', $markup);
        // The selection is announced and the panel is there; nothing is a form.
        self::assertStringContainsString('aria-selected="true" tabindex="0" class="vf-tabs__tab" role="tab" type="button" data-vf-razor-tabs-value="settings">Settings</button>', $markup);
        self::assertStringNotContainsString('<form', $markup);
        self::assertStringNotContainsString('<a ', $markup);
        self::assertStringNotContainsString('href', $markup);
    }

    public function testItIsRegisteredBesideTheOtherComponentsAndTakesNoConstructorArgument(): void
    {
        $provider = new VueForgeRazorProvider();
        $components = $provider->components();

        self::assertInstanceOf(TabsComponent::class, $components['tabs']);
        self::assertNull((new \ReflectionClass(TabsComponent::class))->getConstructor());
        self::assertCount(24, $components);
    }
}
