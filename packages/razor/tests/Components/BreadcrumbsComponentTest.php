<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\BreadcrumbsComponent;
use Codemonster\VueForge\Razor\Support\IconRenderer;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfBreadcrumbs.
 *
 * The assertions mirror the native half of
 * packages/core/src/components/breadcrumbs/VfBreadcrumbs.characterization.spec.ts
 * case for case. The tests that carry the milestone are the ones about the
 * branch this adapter does *not* have: an item `to` and the root `component`
 * are refused by name rather than accepted, ignored, or translated into an
 * href, and no output of this component ever carries a `to`, a router class,
 * a controller marker or a script. The current item is reproduced as the span
 * it historically is - its href dropped - and `href: ''` as the span it
 * historically is, where VfLink would keep an empty href on an anchor.
 */
final class BreadcrumbsComponentTest extends TestCase
{
    private const NAV = '<nav class="vf-breadcrumbs" aria-label="Breadcrumb"><ol class="vf-breadcrumbs__list">';
    private const END = '</ol></nav>';

    /**
     * @param array<string, mixed> $props
     * @param array<string, \Closure(): RenderedHtml> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-breadcrumbs');
        self::assertNotNull($component, 'The vf-breadcrumbs component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    private static function separator(?string $content = null): string
    {
        return '<span class="vf-breadcrumbs__separator" aria-hidden="true">'
            . ($content ?? IconRenderer::render('chevron-right', 'var(--vf-icon-size-sm)'))
            . '</span>';
    }

    private static function item(string $inner): string
    {
        return '<li class="vf-breadcrumbs__item">' . $inner . '</li>';
    }

    /** @return list<array<string, mixed>> */
    private static function trail(): array
    {
        return [['label' => 'Home', 'href' => '/'], ['label' => 'Docs', 'href' => '/docs'], ['label' => 'Breadcrumbs']];
    }

    // ----------------------------------------------------------------- structure

    public function testItRendersNavOlLiWithAnchorsAndACurrentSpanAndSeparatorsBetween(): void
    {
        self::assertSame(
            self::NAV
                . self::item('<a href="/" class="vf-breadcrumbs__link">Home</a>' . self::separator())
                . self::item('<a href="/docs" class="vf-breadcrumbs__link">Docs</a>' . self::separator())
                . self::item('<span class="vf-breadcrumbs__current" aria-current="page">Breadcrumbs</span>')
                . self::END,
            $this->render(['items' => self::trail()]),
        );
    }

    public function testItRendersAnEmptyListForNoItems(): void
    {
        $markup = $this->render(['items' => []]);

        self::assertSame(self::NAV . self::END, $markup);
        self::assertStringNotContainsString('aria-current', $markup);
    }

    public function testOneItemIsTheCurrentSpanWithNoSeparatorWhetherOrNotItHasAnHref(): void
    {
        $expected = self::NAV . self::item('<span class="vf-breadcrumbs__current" aria-current="page">Only</span>') . self::END;

        self::assertSame($expected, $this->render(['items' => [['label' => 'Only']]]));
        self::assertSame($expected, $this->render(['items' => [['label' => 'Only', 'href' => '/only']]]));
    }

    public function testItWritesNoExplicitRoleNoScriptAndNoAdapterMarker(): void
    {
        $markup = $this->render(['items' => self::trail()]);

        self::assertStringNotContainsString('role=', $markup);
        self::assertStringNotContainsString('<script', $markup);
        self::assertStringNotContainsString('data-vf-razor', $markup);
        self::assertStringNotContainsString('<template', $markup);
    }

    public function testItEscapesLabels(): void
    {
        $markup = $this->render(['items' => [['label' => '<b>&</b>', 'href' => '/x'], ['label' => 'a"b']]]);

        self::assertStringContainsString('>&lt;b&gt;&amp;&lt;/b&gt;</a>', $markup);
        self::assertStringContainsString('>a&quot;b</span>', $markup);
    }

    // ------------------------------------------------------------- current item

    public function testTheLastItemIsCurrentWhenNoneIsFlaggedAndItsHrefIsDropped(): void
    {
        $markup = $this->render(['items' => [['label' => 'Home', 'href' => '/'], ['label' => 'Docs', 'href' => '/docs']]]);

        self::assertStringContainsString('<span class="vf-breadcrumbs__current" aria-current="page">Docs</span>', $markup);
        self::assertStringNotContainsString('/docs', $markup);
    }

    public function testAnExplicitCurrentFlagMakesThatItemCurrentAndLetsTheLastItemBeALink(): void
    {
        $markup = $this->render(['items' => [
            ['label' => 'Home', 'href' => '/'],
            ['label' => 'Docs', 'href' => '/docs', 'current' => true],
            ['label' => 'Leaf', 'href' => '/leaf'],
        ]]);

        self::assertStringContainsString('<span class="vf-breadcrumbs__current" aria-current="page">Docs</span>', $markup);
        self::assertStringContainsString('<a href="/leaf" class="vf-breadcrumbs__link">Leaf</a>', $markup);
        self::assertSame(1, substr_count($markup, 'aria-current'));
    }

    public function testTwoExplicitCurrentFlagsMakeTwoCurrentSpans(): void
    {
        $markup = $this->render(['items' => [
            ['label' => 'A', 'href' => '/a', 'current' => true],
            ['label' => 'B', 'href' => '/b', 'current' => true],
            ['label' => 'C', 'href' => '/c'],
        ]]);

        self::assertSame(2, substr_count($markup, 'aria-current="page"'));
        self::assertStringContainsString('<span class="vf-breadcrumbs__current" aria-current="page">A</span>', $markup);
        self::assertStringContainsString('<span class="vf-breadcrumbs__current" aria-current="page">B</span>', $markup);
        self::assertStringContainsString('<a href="/c" class="vf-breadcrumbs__link">C</a>', $markup);
    }

    public function testAnExplicitFalseIsTheSameAsNoFlag(): void
    {
        $markup = $this->render(['items' => [['label' => 'A', 'href' => '/a', 'current' => false], ['label' => 'B', 'current' => false]]]);

        self::assertStringContainsString('<span class="vf-breadcrumbs__current" aria-current="page">B</span>', $markup);
        self::assertStringContainsString('<a href="/a"', $markup);
    }

    public function testAriaCurrentIsExactlyPageAndNeverOnAnAnchor(): void
    {
        $markup = $this->render(['items' => self::trail()]);

        self::assertStringContainsString('aria-current="page"', $markup);
        self::assertStringNotContainsString('aria-current="true"', $markup);
        self::assertDoesNotMatchRegularExpression('/<a[^>]*aria-current/', $markup);
    }

    // ----------------------------------------------------------- link selection

    public function testADisabledItemIsASpanWithTheModifierNoAriaCurrentAndNoAriaDisabled(): void
    {
        $markup = $this->render(['items' => [['label' => 'Home', 'href' => '/'], ['label' => 'Docs', 'href' => '/docs', 'disabled' => true], ['label' => 'Leaf']]]);

        self::assertStringContainsString(
            '<span class="vf-breadcrumbs__current vf-breadcrumbs__current--disabled">Docs</span>',
            $markup,
        );
        self::assertStringNotContainsString('aria-disabled', $markup);
        self::assertStringNotContainsString('/docs', $markup);
    }

    public function testADisabledCurrentItemCarriesBothTheModifierAndAriaCurrent(): void
    {
        $markup = $this->render(['items' => [['label' => 'Home', 'href' => '/'], ['label' => 'Leaf', 'disabled' => true]]]);

        self::assertStringContainsString(
            '<span class="vf-breadcrumbs__current vf-breadcrumbs__current--disabled" aria-current="page">Leaf</span>',
            $markup,
        );
    }

    public function testAMiddleItemWithNoDestinationIsASpanWithoutAriaCurrent(): void
    {
        $markup = $this->render(['items' => [['label' => 'Home', 'href' => '/'], ['label' => 'Section'], ['label' => 'Leaf']]]);

        self::assertStringContainsString('<span class="vf-breadcrumbs__current">Section</span>', $markup);
        self::assertSame(1, substr_count($markup, 'aria-current'));
    }

    public function testAnEmptyHrefIsNoDestinationSoTheItemIsASpanNotAnAnchorWithAnEmptyHref(): void
    {
        $markup = $this->render(['items' => [['label' => 'Home', 'href' => '/'], ['label' => 'Empty', 'href' => ''], ['label' => 'Leaf']]]);

        self::assertStringContainsString('<span class="vf-breadcrumbs__current">Empty</span>', $markup);
        self::assertStringNotContainsString('href=""', $markup);
    }

    public function testAnEmptyLabelRendersAnEmptyAnchor(): void
    {
        $markup = $this->render(['items' => [['label' => '', 'href' => '/'], ['label' => 'Leaf']]]);

        self::assertStringContainsString('<a href="/" class="vf-breadcrumbs__link"></a>', $markup);
    }

    public function testDuplicateLabelsAndDestinationsRenderVerbatim(): void
    {
        $markup = $this->render(['items' => [['label' => 'Same', 'href' => '/x'], ['label' => 'Same', 'href' => '/x'], ['label' => 'Same']]]);

        self::assertSame(2, substr_count($markup, '<a href="/x" class="vf-breadcrumbs__link">Same</a>'));
        self::assertSame(3, substr_count($markup, '<li class="vf-breadcrumbs__item">'));
    }

    // ------------------------------------------------------------ target and rel

    /** @return list<array{0: array<string, mixed>, 1: string}> */
    public static function relCases(): array
    {
        return [
            [['label' => 'Ext', 'href' => 'https://example.com/', 'target' => '_blank'], '<a href="https://example.com/" target="_blank" rel="noopener noreferrer" class="vf-breadcrumbs__link">Ext</a>'],
            [['label' => 'Ext', 'href' => 'https://example.com/', 'target' => '_blank', 'rel' => 'nofollow'], '<a href="https://example.com/" target="_blank" rel="nofollow" class="vf-breadcrumbs__link">Ext</a>'],
            [['label' => 'Ext', 'href' => '/s', 'target' => '_self'], '<a href="/s" target="_self" class="vf-breadcrumbs__link">Ext</a>'],
            [['label' => 'Ext', 'href' => '/s', 'rel' => 'nofollow'], '<a href="/s" rel="nofollow" class="vf-breadcrumbs__link">Ext</a>'],
            [['label' => 'Ext', 'href' => '/s', 'rel' => ''], '<a href="/s" class="vf-breadcrumbs__link">Ext</a>'],
            [['label' => 'Ext', 'href' => 'https://example.com/', 'target' => '_blank', 'rel' => ''], '<a href="https://example.com/" target="_blank" rel="noopener noreferrer" class="vf-breadcrumbs__link">Ext</a>'],
            [['label' => 'Home', 'href' => '/'], '<a href="/" class="vf-breadcrumbs__link">Home</a>'],
        ];
    }

    /** @param array<string, mixed> $item */
    #[\PHPUnit\Framework\Attributes\DataProvider('relCases')]
    public function testTargetAndRelFollowTheLinkRule(array $item, string $expected): void
    {
        self::assertStringContainsString($expected, $this->render(['items' => [$item, ['label' => 'Leaf']]]));
    }

    // --------------------------------------------------------------------- root

    public function testTheNavLabelIsThePropUnderEitherSpellingAndAnEmptyOneIsWrittenEmpty(): void
    {
        self::assertStringStartsWith('<nav class="vf-breadcrumbs" aria-label="Path">', $this->render(['items' => self::trail(), 'aria-label' => 'Path']));
        self::assertStringStartsWith('<nav class="vf-breadcrumbs" aria-label="Path">', $this->render(['items' => self::trail(), 'ariaLabel' => 'Path']));
        self::assertStringStartsWith('<nav class="vf-breadcrumbs" aria-label="">', $this->render(['items' => self::trail(), 'aria-label' => '']));
    }

    public function testConsumerAttrsLandOnTheNavAndNowhereElse(): void
    {
        $markup = $this->render([
            'items' => self::trail(),
            'class' => 'consumer',
            'id' => 'trail',
            'style' => 'margin: 0',
            'data-testid' => 't',
            'role' => 'region',
            'aria-labelledby' => 'heading',
            'aria-describedby' => 'hint',
            'title' => 'T',
            'tabindex' => '0',
        ]);

        self::assertStringStartsWith(
            '<nav id="trail" data-testid="t" role="region" aria-labelledby="heading" aria-describedby="hint" title="T" tabindex="0" '
                . 'class="vf-breadcrumbs consumer" aria-label="Breadcrumb" style="margin: 0"><ol class="vf-breadcrumbs__list">',
            $markup,
        );
        $inner = substr($markup, strpos($markup, '<ol'));
        foreach (['id=', 'style="margin', 'data-testid', 'role=', 'aria-labelledby', 'aria-describedby', 'title=', 'tabindex', 'consumer'] as $fragment) {
            self::assertStringNotContainsString($fragment, $inner, "$fragment reached the list");
        }
    }

    // ---------------------------------------------------------------- separator

    public function testTheSeparatorIsTheChevronRightGlyphAtTheSmallSizeInAnAriaHiddenSpanAfterEveryItemButTheLast(): void
    {
        $markup = $this->render(['items' => self::trail()]);

        self::assertSame(2, substr_count($markup, self::separator()));
        self::assertStringContainsString('points="8.75 5.75 15 12 8.75 18.25"', $markup);
        self::assertStringEndsWith('Breadcrumbs</span></li>' . self::END, $markup);
    }

    public function testTheSeparatorFollowsACurrentOrDisabledSpanTooBecausePlacementIsByPosition(): void
    {
        $markup = $this->render(['items' => [['label' => 'A', 'href' => '/a', 'current' => true], ['label' => 'B', 'disabled' => true], ['label' => 'C', 'href' => '/c']]]);

        self::assertStringContainsString('>A</span>' . self::separator(), $markup);
        self::assertStringContainsString('>B</span>' . self::separator(), $markup);
        self::assertStringEndsWith('C</a></li>' . self::END, $markup);
    }

    public function testTheSeparatorSlotReplacesTheContentOfTheOwnedWrapperAfterEveryItemButTheLast(): void
    {
        $markup = $this->render(
            ['items' => self::trail()],
            ['separator' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('/')],
        );

        self::assertSame(2, substr_count($markup, self::separator('/')));
        self::assertStringNotContainsString('<svg', $markup);
    }

    // ----------------------------------------------------------------- refusals

    public function testItRefusesAnItemToByNameRatherThanRenderingAnAnchorForARoute(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Item 0 of vf-breadcrumbs does not accept [to]');

        $this->render(['items' => [['label' => 'Home', 'to' => '/'], ['label' => 'Leaf']]]);
    }

    public function testItRefusesAnObjectToByNameToo(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('does not accept [to]');

        $this->render(['items' => [['label' => 'Home', 'to' => ['name' => 'home']], ['label' => 'Leaf']]]);
    }

    public function testItRefusesTheRootComponentPropByName(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('vf-breadcrumbs does not accept [component]');

        $this->render(['items' => self::trail(), 'component' => 'a']);
    }

    public function testItRefusesItemsThatAreNotAList(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('must be a list of items');

        $this->render(['items' => 'Home']);
    }

    public function testItRefusesAnItemWithoutAStringLabel(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Item 1 of vf-breadcrumbs must have a string [label]');

        $this->render(['items' => [['label' => 'Home'], ['href' => '/x']]]);
    }

    public function testItRefusesANonStringHref(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Item 0 of vf-breadcrumbs has a non-string [href]');

        $this->render(['items' => [['label' => 'Home', 'href' => 1]]]);
    }

    public function testItRefusesANonBooleanCurrent(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Item 0 of vf-breadcrumbs has a non-boolean [current]');

        $this->render(['items' => [['label' => 'Home', 'current' => 'yes']]]);
    }

    public function testItRefusesAnUnknownItemKey(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Item 0 of vf-breadcrumbs carries an unknown key [icon]');

        $this->render(['items' => [['label' => 'Home', 'icon' => 'home']]]);
    }

    public function testItRefusesANonScalarForwardedAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('must be a scalar or null');

        $this->render(['items' => self::trail(), 'data-meta' => ['a' => 1]]);
    }

    // -------------------------------------------------------------- registration

    public function testTheProviderRegistersItWithNoConstructorArgument(): void
    {
        $components = (new VueForgeRazorProvider())->components();

        self::assertInstanceOf(BreadcrumbsComponent::class, $components['breadcrumbs']);
        self::assertNull((new \ReflectionClass(BreadcrumbsComponent::class))->getConstructor());
        self::assertCount(26, $components);
    }
}
