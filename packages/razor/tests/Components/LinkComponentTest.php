<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\LinkComponent;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfLink.
 *
 * The assertions mirror the native branch of
 * packages/core/src/components/link/VfLink.characterization.spec.ts case for
 * case. The tests that carry the milestone are the ones about the branch this
 * adapter does *not* have: `to` and `component` are refused by name rather
 * than accepted, ignored, or translated into an href, and no output of this
 * component ever carries a `to`, a router class or an ownership marker. The
 * no-destination anchor is reproduced as the inert `<a>` it historically is.
 */
final class LinkComponentTest extends TestCase
{
    /**
     * @param array<string, mixed> $props
     * @param array<string, \Closure(): RenderedHtml> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-link');
        self::assertNotNull($component, 'The vf-link component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    private static function slot(string $markup): \Closure
    {
        return static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    /** @return array<string, \Closure(): RenderedHtml> */
    private static function docs(): array
    {
        return ['default' => self::slot('Docs')];
    }

    // ------------------------------------------------------------- native branch

    public function testItRendersANativeAnchorWithHrefAndTheSlotAsItsContent(): void
    {
        self::assertSame('<a href="/docs" class="vf-link">Docs</a>', $this->render(['href' => '/docs'], self::docs()));
    }

    public function testItKeepsAnEmptyStringHrefAsAPresentEmptyAttribute(): void
    {
        self::assertSame('<a href="" class="vf-link">Docs</a>', $this->render(['href' => ''], self::docs()));
    }

    public function testItRendersAnInertAnchorWhenNoDestinationIsGiven(): void
    {
        // Not a span, not a button, and not an anchor given a placeholder: no
        // href, no role, no tabindex. The browser will not focus it and the
        // accessibility tree ignores it, exactly as the reference's does.
        $markup = $this->render([], self::docs());

        self::assertSame('<a class="vf-link">Docs</a>', $markup);
        self::assertStringNotContainsString('href', $markup);
        self::assertStringNotContainsString('role=', $markup);
        self::assertStringNotContainsString('tabindex', $markup);
    }

    public function testItRendersAnEmptyAnchorWhenNoSlotIsGiven(): void
    {
        self::assertSame('<a href="/docs" class="vf-link"></a>', $this->render(['href' => '/docs']));
    }

    public function testItRendersConsumerContentVerbatimAndOwnsNoneOfIt(): void
    {
        self::assertSame(
            '<a href="/docs" class="vf-link"><span class="consumer-label">Docs</span><button type="button">B</button></a>',
            $this->render(
                ['href' => '/docs'],
                ['default' => self::slot('<span class="consumer-label">Docs</span><button type="button">B</button>')],
            ),
        );
    }

    // ------------------------------------------------------------- rel derivation

    public function testItDerivesRelForBlankWhenNoRelIsGiven(): void
    {
        self::assertSame(
            '<a href="https://example.com" target="_blank" rel="noopener noreferrer" class="vf-link">Ext</a>',
            $this->render(['href' => 'https://example.com', 'target' => '_blank'], ['default' => self::slot('Ext')]),
        );
    }

    public function testAnExplicitRelWinsWithoutMerging(): void
    {
        $markup = $this->render(['href' => 'https://example.com', 'target' => '_blank', 'rel' => 'nofollow']);

        self::assertStringContainsString('rel="nofollow"', $markup);
        self::assertStringNotContainsString('noopener', $markup);
    }

    public function testItDerivesNothingForAnyOtherTarget(): void
    {
        foreach (['_self', '_parent', '_top', 'preview'] as $target) {
            $markup = $this->render(['href' => '/docs', 'target' => $target]);

            self::assertStringContainsString('target="' . $target . '"', $markup);
            self::assertStringNotContainsString('rel=', $markup);
        }
    }

    public function testItWritesAnExplicitRelWithNoTarget(): void
    {
        self::assertSame('<a href="/docs" rel="me" class="vf-link"></a>', $this->render(['href' => '/docs', 'rel' => 'me']));
    }

    public function testAnEmptyStringRelIsTreatedAsAbsent(): void
    {
        self::assertStringContainsString(
            'rel="noopener noreferrer"',
            $this->render(['href' => 'https://example.com', 'target' => '_blank', 'rel' => '']),
        );
    }

    // ------------------------------------------------------------------ modifiers

    public function testItEmitsNoModifierAtTheDefaults(): void
    {
        self::assertSame(
            '<a href="/docs" class="vf-link"></a>',
            $this->render(['href' => '/docs', 'underline' => 'none', 'tone' => 'default']),
        );
    }

    public function testItEmitsTheUnderlineAndToneModifiersInOrder(): void
    {
        self::assertStringContainsString(
            'class="vf-link vf-link--underline-hover"',
            $this->render(['href' => '/docs', 'underline' => 'hover']),
        );
        self::assertStringContainsString(
            'class="vf-link vf-link--underline-always"',
            $this->render(['href' => '/docs', 'underline' => 'always']),
        );
        self::assertStringContainsString('class="vf-link vf-link--muted"', $this->render(['href' => '/docs', 'tone' => 'muted']));
        self::assertStringContainsString(
            'class="vf-link vf-link--underline-always vf-link--muted"',
            $this->render(['href' => '/docs', 'underline' => 'always', 'tone' => 'muted']),
        );
    }

    public function testTheModifiersApplyToTheNoDestinationAnchorToo(): void
    {
        self::assertSame(
            '<a class="vf-link vf-link--underline-hover vf-link--muted"></a>',
            $this->render(['underline' => 'hover', 'tone' => 'muted']),
        );
    }

    // ---------------------------------------------------------------------- attrs

    public function testAConsumerClassIsAppendedAfterTheCanonicalClasses(): void
    {
        self::assertStringContainsString(
            'class="vf-link vf-link--underline-hover consumer-link"',
            $this->render(['href' => '/docs', 'underline' => 'hover', 'class' => 'consumer-link']),
        );
        self::assertStringContainsString('class="vf-link consumer-link"', $this->render(['href' => '/docs', 'class' => 'consumer-link']));
    }

    public function testItForwardsStyleIdAndDataAttributesToTheAnchor(): void
    {
        $markup = $this->render(['href' => '/docs', 'style' => 'opacity: 0.6', 'id' => 'docs-link', 'data-testid' => 'docs']);

        self::assertStringContainsString('style="opacity: 0.6"', $markup);
        self::assertStringContainsString('id="docs-link"', $markup);
        self::assertStringContainsString('data-testid="docs"', $markup);
    }

    public function testItForwardsAriaAttributesVerbatimAndWritesNoneOfItsOwn(): void
    {
        self::assertSame('<a href="/docs" class="vf-link"></a>', $this->render(['href' => '/docs']));

        $markup = $this->render([
            'href' => '/docs',
            'aria-label' => 'Documentation',
            'aria-current' => 'page',
            'aria-describedby' => 'docs-hint',
        ]);

        self::assertStringContainsString('aria-label="Documentation"', $markup);
        self::assertStringContainsString('aria-current="page"', $markup);
        self::assertStringContainsString('aria-describedby="docs-hint"', $markup);
    }

    public function testAConsumerRoleAndTabindexLandOnTheAnchor(): void
    {
        $markup = $this->render(['href' => '/docs', 'role' => 'button', 'tabindex' => '-1']);

        self::assertStringContainsString('role="button"', $markup);
        self::assertStringContainsString('tabindex="-1"', $markup);
    }

    public function testItForwardsTheNativeLinkAttributesItHasNoPropFor(): void
    {
        $markup = $this->render([
            'href' => '/report.pdf',
            'download' => 'report.pdf',
            'hreflang' => 'en',
            'referrerpolicy' => 'no-referrer',
            'type' => 'application/pdf',
            'title' => 'Report',
        ]);

        foreach (['download="report.pdf"', 'hreflang="en"', 'referrerpolicy="no-referrer"', 'type="application/pdf"', 'title="Report"'] as $expected) {
            self::assertStringContainsString($expected, $markup);
        }
    }

    public function testAHostileHrefAndSlotAreEscapedAsAttributeAndTrustedContent(): void
    {
        $markup = $this->render(['href' => '/docs?a=1&b="x"', 'title' => '<b>'], self::docs());

        self::assertStringContainsString('href="/docs?a=1&amp;b=&quot;x&quot;"', $markup);
        self::assertStringContainsString('title="&lt;b&gt;"', $markup);
    }

    // --------------------------------------------- the branch this adapter lacks

    public function testItRefusesToByName(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('vf-link does not accept [to]');

        $this->render(['to' => '/docs']);
    }

    public function testItRefusesAnObjectDestinationTheSameWay(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('vf-link does not accept [to]');

        $this->render(['to' => ['name' => 'docs', 'params' => ['id' => 1]]]);
    }

    public function testItRefusesComponentByName(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('vf-link does not accept [component]');

        $this->render(['href' => '/docs', 'component' => 'span']);
    }

    public function testItNeverWritesARouterClassAMarkerOrAToAttribute(): void
    {
        foreach ([
            $this->render(['href' => '/docs'], self::docs()),
            $this->render([], self::docs()),
            $this->render(['href' => 'https://example.com', 'target' => '_blank', 'underline' => 'always', 'tone' => 'muted', 'class' => 'c']),
        ] as $markup) {
            self::assertStringStartsWith('<a', $markup);
            self::assertStringNotContainsString('router-link', $markup);
            self::assertStringNotContainsString('data-vf-razor', $markup);
            self::assertStringNotContainsString(' to=', $markup);
            self::assertStringNotContainsString('<template', $markup);
        }
    }

    public function testItRendersNoInteractiveElementBeyondTheAnchorItself(): void
    {
        $markup = $this->render(['href' => '/docs'], self::docs());

        self::assertSame(1, substr_count($markup, '<a'));
        self::assertStringNotContainsString('<button', $markup);
        self::assertStringNotContainsString('<input', $markup);
    }

    public function testAnUnsupportedPropTypeIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->render(['href' => ['/docs']]);
    }

    public function testAnUnsupportedAttributeTypeIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->render(['href' => '/docs', 'data-payload' => ['x' => 1]]);
    }

    public function testItIsRegisteredBesideTheOtherComponentsAndTakesNoConstructorArgument(): void
    {
        $provider = new VueForgeRazorProvider();
        $components = $provider->components();

        self::assertInstanceOf(LinkComponent::class, $components['link']);
        self::assertNull((new \ReflectionClass(LinkComponent::class))->getConstructor());
        self::assertCount(27, $components);
    }
}
