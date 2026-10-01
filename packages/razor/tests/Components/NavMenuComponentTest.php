<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\VueForge\Razor\Components\NavMenuComponent;
use Codemonster\VueForge\Razor\Support\IconRenderer;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfNavMenu.
 *
 * The assertions mirror the server half of
 * packages/core/src/components/nav-menu/VfNavMenu.characterization.spec.ts:
 * the topology, the initial active value and the ancestry it opens, the
 * links, the level declarations and the compact class a server can decide.
 * The adapter metadata - the root marker and its `data-vf-razor-nav-menu-*`
 * attributes, the per-li path and every collapse template - is asserted
 * separately and stripped before the markup is compared, because the parity
 * extractor drops exactly those. The tests that carry the milestone's
 * boundaries are the ones about what this adapter does *not* have: an item
 * `to` is refused by name, a server never renders a sidebar compact by
 * measurement, and nothing in the output acts without the controller.
 */
final class NavMenuComponentTest extends TestCase
{
    /** @param array<string, mixed> $props */
    private function render(array $props): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-nav-menu');
        self::assertNotNull($component, 'The vf-nav-menu component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, []))->value();
    }

    /** The product markup: adapter metadata and templates removed, as the parity extractor removes them. */
    private static function product(string $html): string
    {
        // Templates nest; strip the innermost until none is left.
        while (str_contains($html, '<template data-vf-razor-nav-menu')) {
            $html = (string) preg_replace('#<template data-vf-razor-nav-menu="collapse">(?:(?!<template).)*?</template>#s', '', $html);
        }

        return (string) preg_replace('# data-vf-razor[a-z-]*="[^"]*"#', '', (string) $html);
    }

    private static function chevron(): string
    {
        return IconRenderer::render('chevron-down', 'var(--vf-icon-size-sm)');
    }

    /** @return list<array<string, mixed>> */
    private static function tree(): array
    {
        return [
            [
                'value' => 'guide',
                'label' => 'Guide',
                'children' => [
                    ['value' => 'intro', 'label' => 'Intro', 'href' => '/intro'],
                    [
                        'value' => 'advanced',
                        'label' => 'Advanced',
                        'children' => [
                            ['value' => 'theming', 'label' => 'Theming'],
                            ['value' => 'ssr', 'label' => 'SSR', 'href' => '/ssr'],
                        ],
                    ],
                ],
            ],
            ['value' => 'components', 'label' => 'Components', 'children' => [['value' => 'button', 'label' => 'Button', 'href' => '/button']]],
            ['value' => 'changelog', 'label' => 'Changelog'],
        ];
    }

    public function testItRendersExactlyTheReferenceMarkupForACollapsedTree(): void
    {
        $html = self::product($this->render(['items' => [
            ['value' => 'a', 'label' => 'A', 'children' => [['value' => 'a1', 'label' => 'A1']]],
            ['value' => 'b', 'label' => 'B', 'href' => '/b'],
            ['value' => 'c', 'label' => 'C'],
        ]]));

        self::assertSame(
            '<nav class="vf-nav-menu vf-nav-menu--default vf-nav-menu--simple" aria-label="Navigation">'
            . '<span class="vf-nav-menu__compact-breakpoint-probe" aria-hidden="true"></span>'
            . '<ul class="vf-nav-menu__list">'
            . '<li class="vf-nav-menu__node vf-nav-menu__node--level-0">'
            . '<button class="vf-nav-menu__item vf-nav-menu__item--branch vf-nav-menu__item--top vf-nav-menu__item--icon-offset" style="--vf-nav-menu-level: 0" aria-expanded="false" type="button">'
            . '<span class="vf-nav-menu__item-content"><span class="vf-nav-menu__label">A</span></span>'
            . '<span class="vf-nav-menu__icon" aria-hidden="true">' . self::chevron() . '</span></button></li>'
            . '<li class="vf-nav-menu__node vf-nav-menu__node--level-0">'
            . '<a href="/b" class="vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--icon-offset" style="--vf-nav-menu-level: 0">'
            . '<span class="vf-nav-menu__item-content"><span class="vf-nav-menu__label">B</span></span></a></li>'
            . '<li class="vf-nav-menu__node vf-nav-menu__node--level-0">'
            . '<button class="vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--icon-offset" style="--vf-nav-menu-level: 0" type="button">'
            . '<span class="vf-nav-menu__item-content"><span class="vf-nav-menu__label">C</span></span></button></li>'
            . '</ul></nav>',
            $html,
        );
    }

    public function testTheInitialValueMarksItsLeafAndOpensItsAncestry(): void
    {
        $html = self::product($this->render(['items' => self::tree(), 'default-value' => 'ssr']));

        self::assertStringContainsString(
            '<li class="vf-nav-menu__node vf-nav-menu__node--level-0 vf-nav-menu__node--expanded vf-nav-menu__node--ancestor-active">'
            . '<button class="vf-nav-menu__item vf-nav-menu__item--branch vf-nav-menu__item--top vf-nav-menu__item--icon-offset vf-nav-menu__item--ancestor-active vf-nav-menu__item--expanded" style="--vf-nav-menu-level: 0" aria-expanded="true" type="button">',
            $html,
        );
        self::assertStringContainsString('<span class="vf-nav-menu__icon vf-nav-menu__icon--open" aria-hidden="true">', $html);
        self::assertStringContainsString(
            '<div class="vf-nav-menu__collapse vf-nav-menu__collapse--level-0"><ul class="vf-nav-menu__list vf-nav-menu__list--nested">',
            $html,
        );
        self::assertStringContainsString(
            '<li class="vf-nav-menu__node vf-nav-menu__node--level-2 vf-nav-menu__node--active">'
            . '<a href="/ssr" class="vf-nav-menu__item vf-nav-menu__item--icon-offset vf-nav-menu__item--active" style="--vf-nav-menu-level: 2" aria-current="page">',
            $html,
        );
        self::assertSame(1, substr_count($html, 'aria-current'));
        self::assertSame(2, substr_count($html, 'aria-expanded="true"'));
        self::assertSame(1, substr_count($html, 'aria-expanded="false"'));
        // Components is closed: its children exist only in its template.
        self::assertStringNotContainsString('Button', $html);
    }

    public function testAGroupAncestorIsExpandedOnItsLiAndItsChildrenAreAlwaysRendered(): void
    {
        $html = self::product($this->render([
            'items' => [[
                'value' => 'lib',
                'label' => 'Library',
                'children' => [[
                    'value' => 'forms',
                    'kind' => 'group',
                    'label' => 'Forms',
                    'children' => [['value' => 'input', 'label' => 'Input']],
                ]],
            ]],
            'default-value' => 'input',
        ]));

        self::assertStringContainsString(
            '<li class="vf-nav-menu__node vf-nav-menu__node--level-1 vf-nav-menu__node--expanded vf-nav-menu__node--ancestor-active">'
            . '<div class="vf-nav-menu__group vf-nav-menu__group--level-1" style="--vf-nav-menu-level: 1">'
            . '<span class="vf-nav-menu__item-content"><span class="vf-nav-menu__group-label">Forms</span></span></div>'
            . '<ul class="vf-nav-menu__list vf-nav-menu__list--nested">',
            $html,
        );
        self::assertStringStartsWith('<nav class="vf-nav-menu vf-nav-menu--default" aria-label="Navigation">', $html);
    }

    public function testModelValueIsTheInitialValueAndBeatsTheDefault(): void
    {
        self::assertSame(
            $this->render(['items' => self::tree(), 'default-value' => 'ssr']),
            $this->render(['items' => self::tree(), 'model-value' => 'ssr', 'default-value' => 'intro']),
        );
        $empty = self::product($this->render(['items' => self::tree(), 'model-value' => '', 'default-value' => 'ssr']));
        self::assertStringNotContainsString('aria-current', $empty);
        self::assertStringNotContainsString('aria-expanded="true"', $empty);
    }

    public function testEveryBranchKeepsItsPristineChildrenInAnInertTemplate(): void
    {
        $html = $this->render(['items' => self::tree(), 'default-value' => 'ssr']);

        // Three branches; Advanced appears in Guide's live collapse and in Guide's template.
        self::assertSame(4, substr_count($html, '<template data-vf-razor-nav-menu="collapse">'));
        // Inside a template every branch renders closed: Guide's template holds Advanced without a live collapse.
        self::assertMatchesRegularExpression(
            '#<template data-vf-razor-nav-menu="collapse"><div class="vf-nav-menu__collapse vf-nav-menu__collapse--level-0">'
            . '<ul class="vf-nav-menu__list vf-nav-menu__list--nested"><li [^>]*data-vf-razor-nav-menu-path="0\.0"#',
            $html,
        );
        self::assertStringContainsString('data-vf-razor-nav-menu-path="0.1.1"', $html);
        self::assertStringContainsString('data-vf-razor-nav-menu-path="1.0"', $html);
    }

    public function testTheRootCarriesTheStructureAndTheStateTheControllerReads(): void
    {
        $html = $this->render([
            'items' => [
                ['value' => 'a', 'label' => 'A <b>', 'href' => '/a', 'leadingIcon' => 'bell', 'disabled' => true],
                ['value' => 'g', 'kind' => 'group', 'label' => 'G', 'children' => [['value' => 'b', 'label' => 'B']]],
            ],
            'default-value' => 'b',
            'expand-mode' => 'single',
            'variant' => 'sidebar',
            'compact' => false,
        ]);

        self::assertStringContainsString(' data-vf-razor="nav-menu"', $html);
        self::assertStringContainsString(' data-vf-razor-nav-menu-value="b"', $html);
        self::assertStringContainsString(' data-vf-razor-nav-menu-expand-mode="single"', $html);
        self::assertStringContainsString(' data-vf-razor-nav-menu-variant="sidebar"', $html);
        self::assertStringContainsString(' data-vf-razor-nav-menu-compact="false"', $html);
        preg_match('# data-vf-razor-nav-menu-tree="([^"]*)"#', $html, $match);
        self::assertSame(
            [
                ['value' => 'a', 'leadingIcon' => 'bell', 'disabled' => true],
                ['value' => 'g', 'kind' => 'group', 'children' => [['value' => 'b']]],
            ],
            json_decode(html_entity_decode($match[1]), true),
        );
        // No label and no destination travel in the metadata.
        self::assertStringNotContainsString('/a', html_entity_decode($match[1]));

        $plain = $this->render(['items' => []]);
        self::assertStringNotContainsString('data-vf-razor-nav-menu-value', $plain);
        self::assertStringNotContainsString('data-vf-razor-nav-menu-compact', $plain);
        self::assertStringContainsString(' data-vf-razor-nav-menu-expand-mode="multiple"', $plain);
    }

    public function testLinksAreSelectedByDefinednessAndCarryTheLinkRel(): void
    {
        $leaf = fn (array $item): string => self::product($this->render(['items' => [['value' => 'x', 'label' => 'X', ...$item]]]));

        self::assertStringContainsString('<a href="" class=', $leaf(['href' => '']));
        self::assertStringContainsString(
            '<a href="/x" target="_blank" rel="noopener noreferrer" class=',
            $leaf(['href' => '/x', 'target' => '_blank']),
        );
        self::assertStringContainsString(
            '<span class="vf-nav-menu__icon vf-nav-menu__icon--external" aria-hidden="true">'
            . IconRenderer::render('external-link', 'var(--vf-icon-size-sm)') . '</span></a>',
            $leaf(['href' => '/x', 'target' => '_blank']),
        );
        self::assertStringContainsString('rel="help"', $leaf(['href' => '/x', 'target' => '_blank', 'rel' => 'help']));
        self::assertStringNotContainsString('rel=', $leaf(['href' => '/x', 'target' => '_self']));
        self::assertStringNotContainsString('external', $leaf(['href' => '/x', 'target' => '_self']));
        // A target without a destination is a button and renders nothing of it.
        self::assertStringContainsString('<button class=', $leaf(['target' => '_blank']));
        self::assertStringNotContainsString('target', $leaf(['target' => '_blank']));
    }

    public function testADisabledLinkKeepsItsHrefAndLeavesTheTabOrder(): void
    {
        $html = self::product($this->render(['items' => [
            ['value' => 'x', 'label' => 'X', 'href' => '/x', 'disabled' => true],
            ['value' => 'y', 'label' => 'Y', 'disabled' => true],
        ], 'default-value' => 'x']));

        self::assertStringContainsString(
            '<a href="/x" class="vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--icon-offset vf-nav-menu__item--active vf-nav-menu__item--disabled" style="--vf-nav-menu-level: 0" aria-current="page" aria-disabled="true" tabindex="-1">',
            $html,
        );
        self::assertStringContainsString(
            '<button class="vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--icon-offset vf-nav-menu__item--disabled" style="--vf-nav-menu-level: 0" disabled type="button">',
            $html,
        );
    }

    public function testABranchWithADestinationIsStillABranchButtonAndDropsIt(): void
    {
        $html = self::product($this->render(['items' => [[
            'value' => 'a',
            'label' => 'A',
            'href' => '/a',
            'target' => '_blank',
            'disabled' => true,
            'children' => [['value' => 'b', 'label' => 'B']],
        ]]]));

        self::assertStringNotContainsString('href', $html);
        self::assertStringNotContainsString('target', $html);
        self::assertStringContainsString('aria-expanded="false" disabled type="button"', $html);
        self::assertStringNotContainsString('aria-disabled', $html);
    }

    public function testAnEmptyChildrenListIsALeaf(): void
    {
        $html = self::product($this->render(['items' => [['value' => 'a', 'label' => 'A', 'children' => []]]]));

        self::assertStringNotContainsString('aria-expanded', $html);
        self::assertStringNotContainsString('template', $this->render(['items' => [['value' => 'a', 'label' => 'A', 'children' => []]]]));
    }

    public function testALeadingIconResolvesAsTheVueIconComponentDoesAndMakesTheMenuNotSimple(): void
    {
        $html = self::product($this->render(['items' => [
            ['value' => 'a', 'label' => 'A', 'leadingIcon' => 'bell'],
            ['value' => 'b', 'label' => 'B', 'leadingIcon' => 'not-a-glyph'],
        ]]));

        self::assertStringStartsWith('<nav class="vf-nav-menu vf-nav-menu--default" ', $html);
        self::assertStringContainsString(
            '<span class="vf-nav-menu__item-content"><span class="vf-nav-menu__leading-icon" aria-hidden="true">'
            . IconRenderer::render('bell', 'var(--vf-icon-size-md)') . '</span><span class="vf-nav-menu__label">A</span></span>',
            $html,
        );
        self::assertStringContainsString(IconRenderer::render('moon', 'var(--vf-icon-size-md)'), $html);
        self::assertStringContainsString('class="vf-nav-menu__item vf-nav-menu__item--top"', $html);
    }

    public function testASidebarIsCompactOnTheServerOnlyWhenCompactSaysSo(): void
    {
        self::assertStringStartsWith(
            '<nav class="vf-nav-menu vf-nav-menu--sidebar vf-nav-menu--simple" ',
            $this->render(['items' => [], 'variant' => 'sidebar']),
        );
        self::assertStringStartsWith(
            '<nav class="vf-nav-menu vf-nav-menu--sidebar vf-nav-menu--simple vf-nav-menu--sidebar-compact" ',
            $this->render(['items' => [], 'variant' => 'sidebar', 'compact' => true]),
        );
        self::assertStringStartsWith(
            '<nav class="vf-nav-menu vf-nav-menu--pills vf-nav-menu--simple" ',
            $this->render(['items' => [], 'variant' => 'pills', 'compact' => true]),
        );
    }

    public function testAttributesFallThroughToTheNavAfterTheComponentClasses(): void
    {
        $html = self::product($this->render([
            'items' => [['value' => 'a', 'label' => 'A']],
            'id' => 'docs',
            'class' => 'consumer',
            'data-testid' => 'nav',
            'title' => 'Docs',
            'style' => 'color: red;',
            'aria-label' => '',
        ]));

        self::assertStringStartsWith(
            '<nav id="docs" data-testid="nav" title="Docs" class="vf-nav-menu vf-nav-menu--default vf-nav-menu--simple consumer" aria-label="" style="color: red;">',
            $html,
        );
        self::assertSame(1, substr_count($html, 'data-testid'));
        self::assertStringContainsString('aria-label="Docs"', $this->render(['items' => [], 'ariaLabel' => 'Docs']));
    }

    public function testLabelsAreEscaped(): void
    {
        self::assertStringContainsString(
            '<span class="vf-nav-menu__label">&lt;b&gt;A&lt;/b&gt; &amp; &quot;B&quot;</span>',
            $this->render(['items' => [['value' => 'a', 'label' => '<b>A</b> & "B"']]]),
        );
    }

    public function testNothingActsWithoutTheController(): void
    {
        $html = $this->render(['items' => self::tree(), 'default-value' => 'ssr']);

        self::assertStringNotContainsString('<script', $html);
        self::assertStringNotContainsString('<form', $html);
        self::assertStringNotContainsString(' on', preg_replace('#="[^"]*"#', '=""', $html) ?? '');
        self::assertSame(substr_count($html, '<button'), substr_count($html, 'type="button"'));
        self::assertStringNotContainsString('aria-controls', $html);
        self::assertStringNotContainsString(' id=', $html);
    }

    public function testTheRouterBranchIsRefusedByName(): void
    {
        foreach ([
            ['items' => [['value' => 'a', 'label' => 'A', 'to' => '/a']]],
            ['items' => [['value' => 'a', 'label' => 'A', 'to' => ['name' => 'a'], 'href' => '/a']]],
            ['items' => [['value' => 'a', 'label' => 'A', 'children' => [['value' => 'b', 'label' => 'B', 'to' => '/b']]]]],
        ] as $props) {
            try {
                (new NavMenuComponent())->render(new ComponentRenderContext($props, []));
                self::fail('Expected a refusal for ' . json_encode($props));
            } catch (\InvalidArgumentException $exception) {
                self::assertStringContainsString('does not accept [to]', $exception->getMessage());
                self::assertStringContainsString('router branch belongs to the Vue adapter', $exception->getMessage());
            }
        }
    }

    public function testMalformedPropsAreRefused(): void
    {
        foreach ([
            [],
            ['items' => 'nope'],
            ['items' => [['label' => 'A']]],
            ['items' => [['value' => 'a']]],
            ['items' => [['value' => 'a', 'label' => 'A', 'kind' => 'section']]],
            ['items' => [['value' => 'a', 'label' => 'A', 'icon' => 'bell']]],
            ['items' => [['value' => 'a', 'label' => 'A', 'disabled' => 'yes']]],
            ['items' => [['value' => 'a', 'label' => 'A', 'href' => 1]]],
            ['items' => [['value' => 'a', 'label' => 'A', 'children' => 'b']]],
            ['items' => [], 'variant' => 'tabs'],
            ['items' => [], 'expand-mode' => 'none'],
            ['items' => [], 'compact' => 'yes'],
            ['items' => [], 'aria-label' => 3],
            ['items' => [], 'data-x' => ['array']],
        ] as $props) {
            try {
                (new NavMenuComponent())->render(new ComponentRenderContext($props, []));
                self::fail('Expected a refusal for ' . json_encode($props));
            } catch (\InvalidArgumentException) {
                self::addToAssertionCount(1);
            }
        }
    }

    public function testTheProviderRegistersOneNavMenu(): void
    {
        $components = (new VueForgeRazorProvider())->components();

        self::assertInstanceOf(NavMenuComponent::class, $components['nav-menu']);
        self::assertNull((new \ReflectionClass(NavMenuComponent::class))->getConstructor());
        self::assertCount(32, $components);
    }
}
