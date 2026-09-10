<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\SkeletonComponent;
use Codemonster\VueForge\Razor\Components\SkeletonGateComponent;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfSkeletonGate.
 *
 * The assertions mirror
 * packages/core/src/components/skeleton-gate/VfSkeletonGate.characterization.spec.ts
 * case for case, so the two can be read side by side. The browser-level proof
 * that they agree is the parity gate; this suite is what fails first, and
 * points at the attribute.
 *
 * The child-composition group at the bottom is the part that is new in M17. It
 * is what tells "the gate renders something that looks like a skeleton" apart
 * from "the gate renders the canonical skeleton".
 */
final class SkeletonGateComponentTest extends TestCase
{
    /**
     * @param array<string, mixed> $props
     * @param array<string, callable> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-skeleton-gate');
        self::assertNotNull($component, 'The vf-skeleton-gate component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    private static function slot(string $markup): callable
    {
        return static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    public function testTheDefaultGate(): void
    {
        self::assertSame(
            '<div class="vf-skeleton-gate" style="--vf-skeleton-gate-fade-duration: 220ms;" aria-busy="true">'
            . '<div class="vf-skeleton-gate__content" aria-hidden="true" inert></div>'
            . '<div class="vf-skeleton-gate__overlay" aria-hidden="true">'
            . '<!-- Default skeleton primitive used by the gate when no custom skeleton slot is provided. -->'
            . '<div class="vf-skeleton vf-skeleton--animated" style="border-radius: var(--vf-radius-surface);"'
            . ' aria-hidden="true"></div>'
            . '</div>'
            . '</div>',
            $this->render(),
        );
    }

    public function testTheReadyGate(): void
    {
        self::assertSame(
            '<div class="vf-skeleton-gate" style="--vf-skeleton-gate-fade-duration: 220ms;">'
            . '<div class="vf-skeleton-gate__content vf-skeleton-gate__content--ready"></div>'
            . '<div class="vf-skeleton-gate__overlay" style="display: none;" aria-hidden="true">'
            . '<!-- Default skeleton primitive used by the gate when no custom skeleton slot is provided. -->'
            . '<div class="vf-skeleton vf-skeleton--animated" style="border-radius: var(--vf-radius-surface);"'
            . ' aria-hidden="true"></div>'
            . '</div>'
            . '</div>',
            $this->render(['ready' => true]),
        );
    }

    public function testBothHalvesArePresentInBothStates(): void
    {
        foreach ([false, true] as $ready) {
            $markup = $this->render(['ready' => $ready], ['default' => self::slot('Body')]);

            self::assertStringContainsString('vf-skeleton-gate__content', $markup);
            self::assertStringContainsString('vf-skeleton-gate__overlay', $markup);
            self::assertStringContainsString('vf-skeleton', $markup);
            self::assertStringContainsString('Body', $markup);
        }
    }

    public function testTheOverlayIsHiddenRatherThanRemovedWhenReady(): void
    {
        $markup = $this->render(['ready' => true]);

        self::assertStringContainsString('style="display: none;"', $markup);
        self::assertSame(1, substr_count($markup, 'vf-skeleton vf-skeleton--animated'));
    }

    public function testAriaBusyIsTrueWhileLoadingAndAbsentWhenReady(): void
    {
        self::assertStringContainsString('aria-busy="true"', $this->render());
        self::assertStringNotContainsString('aria-busy', $this->render(['ready' => true]));
        // Never "false". A port that wrote the negated value instead of
        // dropping the attribute would look equivalent and would announce every
        // ready gate to assistive technology as explicitly not busy.
        self::assertStringNotContainsString('aria-busy="false"', $this->render(['ready' => true]));
    }

    public function testTheContentWrapperIsHiddenAndInertOnlyWhileLoading(): void
    {
        $loading = $this->render();
        self::assertStringContainsString('<div class="vf-skeleton-gate__content" aria-hidden="true" inert>', $loading);

        $ready = $this->render(['ready' => true]);
        self::assertStringContainsString('<div class="vf-skeleton-gate__content vf-skeleton-gate__content--ready">', $ready);
        self::assertStringNotContainsString('inert', $ready);
    }

    public function testTheOverlayIsAriaHiddenInBothStates(): void
    {
        self::assertSame(1, substr_count($this->render(), 'vf-skeleton-gate__overlay" aria-hidden="true"'));
        self::assertStringContainsString('vf-skeleton-gate__overlay" style="display: none;" aria-hidden="true"', $this->render(['ready' => true]));
    }

    public function testTheFadeDurationIsAlwaysWritten(): void
    {
        self::assertStringContainsString('style="--vf-skeleton-gate-fade-duration: 220ms;"', $this->render());
        self::assertStringContainsString('--vf-skeleton-gate-fade-duration: 0ms;', $this->render(['fade-duration' => 0]));
        self::assertStringContainsString('--vf-skeleton-gate-fade-duration: 900ms;', $this->render(['fade-duration' => 900]));
    }

    public function testTheContentModifiersAreWrittenInOrder(): void
    {
        self::assertStringContainsString(
            'class="vf-skeleton-gate__content vf-skeleton-gate__content--ready'
            . ' vf-skeleton-gate__content--normalize-spacing"',
            $this->render(['ready' => true, 'normalize-content-spacing' => true]),
        );
    }

    public function testReserveHeightOutranksMinHeightOnTheRoot(): void
    {
        self::assertStringContainsString('min-height: 120px;', $this->render(['min-height' => 40, 'reserve-height' => 120]));
    }

    public function testAZeroReserveHeightIsAReservation(): void
    {
        self::assertStringContainsString('min-height: 0px;', $this->render(['min-height' => 50, 'reserve-height' => 0]));
    }

    public function testAnEmptyReserveHeightSwallowsTheMinHeight(): void
    {
        // The quirk: '' wins the precedence contest and then writes nothing, so
        // the root carries only the fade duration even though a min-height was
        // passed. The child still receives the min-height.
        $markup = $this->render(['min-height' => 50, 'reserve-height' => '']);

        self::assertStringContainsString(
            '<div class="vf-skeleton-gate" style="--vf-skeleton-gate-fade-duration: 220ms;"',
            $markup,
        );
        self::assertStringContainsString('style="min-height: 50px; border-radius: var(--vf-radius-surface);"', $markup);
    }

    public function testAnEmptyRadiusDropsTheDeclarationEverywhere(): void
    {
        $markup = $this->render(['radius' => '']);

        self::assertStringContainsString('<div class="vf-skeleton-gate" style="--vf-skeleton-gate-fade-duration: 220ms;"', $markup);
        self::assertStringContainsString('<div class="vf-skeleton-gate__overlay" aria-hidden="true">', $markup);
        // And the child, which has its own empty-value rule, ends up with no
        // style attribute at all. Two components' quirks composing.
        self::assertStringContainsString('<div class="vf-skeleton vf-skeleton--animated" aria-hidden="true">', $markup);
    }

    public function testTheOverlayReceivesTheRadiusAndNothingElse(): void
    {
        $markup = $this->render(['radius' => '8px', 'min-height' => 40, 'reserve-height' => 200]);

        self::assertStringContainsString('<div class="vf-skeleton-gate__overlay" style="border-radius: 8px;"', $markup);
    }

    public function testTheSlotIsRenderedInsideTheContentWrapper(): void
    {
        $markup = $this->render([], ['default' => self::slot('<h4>Title</h4><p>Paragraph</p>')]);

        self::assertStringContainsString(
            '<div class="vf-skeleton-gate__content" aria-hidden="true" inert><h4>Title</h4><p>Paragraph</p></div>',
            $markup,
        );
    }

    public function testTheContentWrapperIsRenderedForAnAbsentSlot(): void
    {
        self::assertStringContainsString('<div class="vf-skeleton-gate__content" aria-hidden="true" inert></div>', $this->render());
    }

    public function testTheSkeletonSlotReplacesTheChildEntirely(): void
    {
        $markup = $this->render([], ['skeleton' => self::slot('<p class="custom-skeleton">Loading</p>')]);

        self::assertStringNotContainsString('vf-skeleton ', $markup);
        self::assertStringNotContainsString('Default skeleton primitive', $markup);
        self::assertStringContainsString(
            '<div class="vf-skeleton-gate__overlay" aria-hidden="true"><p class="custom-skeleton">Loading</p></div>',
            $markup,
        );
    }

    public function testConsumerAttributesReachTheRootAndNeitherBranch(): void
    {
        $markup = $this->render(['class' => 'consumer', 'style' => 'opacity: 0.5', 'data-testid' => 'gate']);

        self::assertStringContainsString('class="vf-skeleton-gate consumer"', $markup);
        self::assertStringContainsString('data-testid="gate"', $markup);
        self::assertSame(1, substr_count($markup, 'data-testid'));
        self::assertStringContainsString('--vf-skeleton-gate-fade-duration: 220ms; opacity: 0.5;', $markup);
    }

    public function testAConsumerAriaBusyReplacesTheComponentsOwn(): void
    {
        self::assertStringContainsString('aria-busy="false"', $this->render(['aria-busy' => 'false']));
        self::assertStringContainsString('aria-busy="true"', $this->render(['ready' => true, 'aria-busy' => 'true']));
    }

    public function testItWritesNoRoleAndNoLiveRegion(): void
    {
        $markup = $this->render([], ['default' => self::slot('Body')]);

        self::assertStringNotContainsString('role=', $markup);
        self::assertStringNotContainsString('aria-live', $markup);
    }

    public function testPreserveLastHeightIsAcceptedAndHasNoServerRenderedEffect(): void
    {
        // Not an omission: the reference measures in onMounted, which never runs
        // on a server render, so the reference's own SSR output is identical
        // with and without the prop. VfSkeletonGate.characterization.spec.ts
        // asserts the same equality on the Vue side.
        self::assertSame($this->render(), $this->render(['preserve-last-height' => true]));
        self::assertSame(
            $this->render(['reserve-height' => 120]),
            $this->render(['reserve-height' => 120, 'preserve-last-height' => true]),
        );
    }

    public function testItAcceptsCamelCasePropSpellings(): void
    {
        self::assertSame(
            $this->render(['min-height' => 40, 'reserve-height' => 120, 'normalize-content-spacing' => true, 'fade-duration' => 10]),
            $this->render(['minHeight' => 40, 'reserveHeight' => 120, 'normalizeContentSpacing' => true, 'fadeDuration' => 10]),
        );
    }

    public function testItAddsNoFocusableElementOfItsOwn(): void
    {
        $markup = $this->render(['ready' => true], ['default' => self::slot('Body')]);

        self::assertStringNotContainsString('<button', $markup);
        self::assertStringNotContainsString('tabindex', $markup);
        self::assertStringNotContainsString('<a ', $markup);
    }

    public function testAConsumerControlInTheContentSlotIsLeftExactlyAsWritten(): void
    {
        $markup = $this->render(['ready' => true], ['default' => self::slot('<button type="button">Retry</button>')]);

        self::assertSame(1, substr_count($markup, '<button'));
        self::assertStringContainsString(
            '<div class="vf-skeleton-gate__content vf-skeleton-gate__content--ready"><button type="button">Retry</button></div>',
            $markup,
        );
    }

    // ---------------------------------------------------------------------
    // Child composition. Section 19 of the M17 plan.
    // ---------------------------------------------------------------------

    public function testTheProviderHandsTheGateTheSameSkeletonItRegisters(): void
    {
        $components = (new VueForgeRazorProvider())->components();

        $skeleton = $components['skeleton'];
        $gate = $components['skeleton-gate'];

        self::assertInstanceOf(SkeletonComponent::class, $skeleton);
        self::assertInstanceOf(SkeletonGateComponent::class, $gate);

        // Reach the private constructor property. Reflection rather than a
        // getter, because the gate has no business exposing its child to
        // application code - the point is that this test can see it and a
        // consumer cannot.
        $child = (new \ReflectionClass($gate))->getProperty('skeleton')->getValue($gate);

        self::assertSame(
            $skeleton,
            $child,
            'The gate must render the canonical registered skeleton, not a private copy of it.',
        );
    }

    public function testTheGateDelegatesToTheInjectedChildRatherThanAuthoringSkeletonMarkup(): void
    {
        // A test double that renders nothing a skeleton would render. If the
        // gate contained its own copy of the skeleton's markup, the canonical
        // classes would still appear below and the probe's output would not.
        $probe = new class implements ComponentInterface {
            /** @var list<array<string, mixed>> */
            public array $calls = [];

            public function render(ComponentRenderContext $context): RenderedHtml
            {
                $this->calls[] = $context->props();

                return RenderedHtml::fromTrustedString('<probe-child></probe-child>');
            }
        };

        $markup = (new SkeletonGateComponent($probe))->render(new ComponentRenderContext([], []))->value();

        self::assertStringContainsString('<probe-child></probe-child>', $markup);
        self::assertStringNotContainsString('vf-skeleton ', $markup);
        self::assertStringNotContainsString('vf-skeleton--animated', $markup);
        self::assertCount(1, $probe->calls);
    }

    public function testTheGateForwardsExactlyMinHeightAndRadiusToTheChild(): void
    {
        $probe = new class implements ComponentInterface {
            /** @var list<array<string, mixed>> */
            public array $calls = [];

            public function render(ComponentRenderContext $context): RenderedHtml
            {
                $this->calls[] = $context->props();

                return RenderedHtml::empty();
            }
        };

        (new SkeletonGateComponent($probe))->render(new ComponentRenderContext([
            'ready' => false,
            'min-height' => 40,
            'radius' => '8px',
            'reserve-height' => 120,
            'preserve-last-height' => true,
            'normalize-content-spacing' => true,
            'fade-duration' => 10,
            'class' => 'consumer',
            'data-testid' => 'gate',
        ], []))->value();

        // Exactly two keys. Not "at least": a gate that also forwarded the
        // reserved height, the consumer class or an animated flag would render
        // a plausible skeleton and would be a different component.
        self::assertSame([['min-height' => 40, 'radius' => '8px']], $probe->calls);
    }

    public function testTheGateOmitsTheRadiusSoTheChildsOwnDefaultApplies(): void
    {
        $probe = new class implements ComponentInterface {
            /** @var list<array<string, mixed>> */
            public array $calls = [];

            public function render(ComponentRenderContext $context): RenderedHtml
            {
                $this->calls[] = $context->props();

                return RenderedHtml::empty();
            }
        };

        (new SkeletonGateComponent($probe))->render(new ComponentRenderContext([], []))->value();

        self::assertSame([['min-height' => null]], $probe->calls);
    }

    public function testTheGateDoesNotCallTheChildWhenTheSkeletonSlotIsGiven(): void
    {
        $probe = new class implements ComponentInterface {
            public int $calls = 0;

            public function render(ComponentRenderContext $context): RenderedHtml
            {
                $this->calls += 1;

                return RenderedHtml::fromTrustedString('<probe-child></probe-child>');
            }
        };

        $markup = (new SkeletonGateComponent($probe))->render(new ComponentRenderContext([], [
            'skeleton' => self::slot('<p class="custom-skeleton">Loading</p>'),
        ]))->value();

        self::assertSame(0, $probe->calls);
        self::assertStringNotContainsString('<probe-child>', $markup);
    }

    public function testAChildThatChangesItsOutputChangesTheGatesLoadingBranch(): void
    {
        // The dependency direction, made observable. The gate's loading branch
        // is whatever the child renders; nothing about it is the gate's own.
        $first = new class implements ComponentInterface {
            public function render(ComponentRenderContext $context): RenderedHtml
            {
                return RenderedHtml::fromTrustedString('<div class="first"></div>');
            }
        };
        $second = new class implements ComponentInterface {
            public function render(ComponentRenderContext $context): RenderedHtml
            {
                return RenderedHtml::fromTrustedString('<div class="second"></div>');
            }
        };

        $withFirst = (new SkeletonGateComponent($first))->render(new ComponentRenderContext([], []))->value();
        $withSecond = (new SkeletonGateComponent($second))->render(new ComponentRenderContext([], []))->value();

        self::assertNotSame($withFirst, $withSecond);
        self::assertStringContainsString('<div class="first"></div>', $withFirst);
        self::assertStringContainsString('<div class="second"></div>', $withSecond);
        // And the content branch is untouched by which child was used.
        self::assertSame(
            substr_count($withFirst, 'vf-skeleton-gate__content'),
            substr_count($withSecond, 'vf-skeleton-gate__content'),
        );
    }

    public function testTheGateAndTheStandaloneSkeletonAgreeOnTheChildMarkup(): void
    {
        // The same markup, from the same class, reached two ways. If the gate
        // ever grew its own copy this is where the two would drift.
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $standalone = $registry->resolve('vf-skeleton')
            ->render(new ComponentRenderContext(['min-height' => 40, 'radius' => '8px'], []))
            ->value();

        self::assertStringContainsString($standalone, $this->render(['min-height' => 40, 'radius' => '8px']));
    }
}
