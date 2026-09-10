<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfSkeleton.
 *
 * The assertions mirror
 * packages/core/src/components/skeleton/VfSkeleton.characterization.spec.ts
 * case for case, so the two can be read side by side. The browser-level proof
 * that they agree is the parity gate; this suite is what fails first, and
 * points at the attribute.
 */
final class SkeletonComponentTest extends TestCase
{
    /** @param array<string, mixed> $props */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-skeleton');
        self::assertNotNull($component, 'The vf-skeleton component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    public function testItRendersOneEmptyDiv(): void
    {
        self::assertSame(
            '<div class="vf-skeleton vf-skeleton--animated" style="border-radius: var(--vf-radius-surface);"'
            . ' aria-hidden="true"></div>',
            $this->render(),
        );
    }

    public function testItHasNoSlotAndIgnoresSlotContent(): void
    {
        $markup = $this->render([], [
            'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('IGNORED'),
        ]);

        self::assertStringNotContainsString('IGNORED', $markup);
    }

    public function testTheAnimationModifierIsPresentAtTheDefault(): void
    {
        // The inverted convention: VfBadge and VfTag express their default by
        // absence, this one by presence.
        self::assertStringContainsString('vf-skeleton vf-skeleton--animated', $this->render());
    }

    public function testTheAnimationModifierDisappearsWhenSwitchedOff(): void
    {
        foreach (['false', false, '0', ''] as $off) {
            self::assertStringContainsString('class="vf-skeleton"', $this->render(['animated' => $off]));
        }
    }

    public function testABareAnimatedAttributeMeansOn(): void
    {
        // Razor passes a valueless attribute as `true`, and `animated` already
        // defaults to on, so both spellings have to agree.
        self::assertStringContainsString('vf-skeleton--animated', $this->render(['animated' => true]));
    }

    public function testAConsumerClassIsAppendedAfterTheCanonicalClasses(): void
    {
        self::assertStringContainsString(
            'class="vf-skeleton vf-skeleton--animated mine"',
            $this->render(['class' => 'mine']),
        );
    }

    public function testItWritesMinHeightBeforeBorderRadius(): void
    {
        self::assertStringContainsString(
            'style="min-height: 40px; border-radius: var(--vf-radius-surface);"',
            $this->render(['min-height' => '40']),
        );
    }

    public function testANumericMinHeightBecomesPixels(): void
    {
        // A template writes props as text, so "40" has to travel the numeric
        // path the Vue prop typed `string | number` travels.
        self::assertStringContainsString('min-height: 40px', $this->render(['min-height' => '40']));
        self::assertStringContainsString('min-height: 40px', $this->render(['min-height' => 40]));
    }

    public function testZeroIsALengthRatherThanAnAbsence(): void
    {
        self::assertStringContainsString('min-height: 0px', $this->render(['min-height' => '0']));
    }

    public function testAStringMinHeightPassesThroughUntouched(): void
    {
        foreach (['3rem', '50%', 'var(--vf-space-8)'] as $value) {
            self::assertStringContainsString('min-height: ' . $value, $this->render(['min-height' => $value]));
        }
    }

    public function testANullRadiusIsAbsenceAndTheEmptyStringIsARefusal(): void
    {
        // A Razor template binds every attribute it names, so a case with no
        // radius arrives as an explicit null rather than as a missing key. Null
        // has to mean "the caller said nothing" and keep the default token,
        // while the empty string has to keep meaning "write no declaration".
        // Found by the showcase route, where every skeleton lost its radius.
        self::assertStringContainsString(
            'border-radius: var(--vf-radius-surface)',
            $this->render(['radius' => null]),
        );
        self::assertStringNotContainsString('style=', $this->render(['radius' => '']));
    }

    public function testAnEmptyRadiusDropsTheDeclarationRatherThanMeaningZero(): void
    {
        // The quirk. Not border-radius:0 - no declaration at all, and with no
        // min-height, no style attribute either.
        self::assertSame(
            '<div class="vf-skeleton vf-skeleton--animated" aria-hidden="true"></div>',
            $this->render(['radius' => '']),
        );
    }

    public function testAConsumerStyleIsAppendedAfterItsOwnDeclarations(): void
    {
        self::assertStringContainsString(
            'style="border-radius: var(--vf-radius-surface); margin-top: 2px;"',
            $this->render(['style' => 'margin-top: 2px']),
        );
    }

    public function testAConsumerStyleReplacesTheRadiusRatherThanDuplicatingIt(): void
    {
        // Vue merges the two rather than concatenating them, so exactly one
        // border-radius declaration survives.
        $markup = $this->render(['style' => 'border-radius: 99px']);

        self::assertStringContainsString('style="border-radius: 99px;"', $markup);
        self::assertSame(1, substr_count($markup, 'border-radius'));
    }

    public function testItHidesItselfFromTheAccessibilityTree(): void
    {
        self::assertStringContainsString('aria-hidden="true"', $this->render());
    }

    public function testItExposesNoRoleOfItsOwn(): void
    {
        // Not role=status, not aria-busy, not aria-live. A loading placeholder
        // that announced itself would be an accessibility improvement and a
        // product change.
        $markup = $this->render();

        foreach ([' role=', 'aria-busy', 'aria-live', 'aria-label'] as $forbidden) {
            self::assertStringNotContainsString($forbidden, $markup);
        }
    }

    public function testAConsumerCanOverrideAriaHidden(): void
    {
        // Historical and reachable: in Vue aria-hidden is a static attribute on
        // a component that does not set inheritAttrs: false, so an inherited
        // attribute of the same name replaces it.
        self::assertStringContainsString('aria-hidden="false"', $this->render(['aria-hidden' => 'false']));
        self::assertStringNotContainsString('aria-hidden="true"', $this->render(['aria-hidden' => 'false']));
    }

    public function testAConsumerCanAddARoleTheComponentNeverWrites(): void
    {
        $markup = $this->render(['role' => 'status', 'aria-label' => 'Loading']);

        self::assertStringContainsString('role="status"', $markup);
        self::assertStringContainsString('aria-label="Loading"', $markup);
    }

    public function testItForwardsProductDataAttributes(): void
    {
        self::assertStringContainsString('data-testid="skeleton"', $this->render(['data-testid' => 'skeleton']));
    }

    public function testItEscapesHostileAttributeValues(): void
    {
        self::assertStringContainsString(
            'data-x="a&quot;b&lt;c&amp;d"',
            $this->render(['data-x' => 'a"b<c&d']),
        );
    }

    public function testItEscapesAHostileRadius(): void
    {
        // The radius reaches a style attribute verbatim, so its escaping is the
        // only thing between a prop and injected markup.
        $markup = $this->render(['radius' => '0" onload="x']);

        self::assertStringNotContainsString('onload="x"', $markup);
        self::assertStringContainsString('&quot;', $markup);
    }

    public function testItRejectsANonScalarAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->render(['data-x' => ['array']]);
    }
}
