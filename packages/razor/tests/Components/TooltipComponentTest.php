<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\TooltipComponent;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfTooltip.
 *
 * The server half of
 * packages/core/src/components/tooltip/VfTooltip.characterization.spec.ts:
 * the always-closed markup the reference's own server render produces, the
 * root that takes every forwarded attribute, the inert deferred body - present
 * exactly when the reference would render a tooltip element - and the adapter
 * metadata the browser controller reads. What happens after a hover or a
 * focus is the controller's and is measured in a real browser.
 */
final class TooltipComponentTest extends TestCase
{
    protected function setUp(): void
    {
        FieldIds::reset();
    }

    /**
     * @param array<string, mixed> $props
     * @param array<string, \Closure(): RenderedHtml> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-tooltip');
        self::assertNotNull($component, 'The vf-tooltip component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    /** @return array<string, \Closure(): RenderedHtml> */
    private static function slots(string $trigger = '<button type="button">Info</button>', ?string $content = null): array
    {
        $slots = ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($trigger)];
        if ($content !== null) {
            $slots['content'] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($content);
        }

        return $slots;
    }

    private const META = ' data-vf-razor="tooltip" data-vf-razor-tooltip-id="vf-tooltip-r-0"'
        . ' data-vf-razor-tooltip-placement="top" data-vf-razor-tooltip-open-delay="80"'
        . ' data-vf-razor-tooltip-teleport="body"';

    public function testItRendersTheClosedWrapperAndTriggerWithTheTextDeferred(): void
    {
        self::assertSame(
            '<span class="vf-tooltip"' . self::META . '>'
            . '<span class="vf-tooltip__trigger"><button type="button">Info</button></span>'
            . '<template data-vf-razor-tooltip="content">Helpful hint</template>'
            . '</span>',
            $this->render(['text' => 'Helpful hint'], self::slots()),
        );
    }

    public function testTheServerRenderIsAlwaysClosed(): void
    {
        $html = $this->render(['text' => 'Helpful hint'], self::slots());

        self::assertStringNotContainsString('aria-describedby', $html);
        self::assertStringNotContainsString('role="tooltip"', $html);
        // The future id travels only as adapter metadata, never as an id attribute.
        self::assertDoesNotMatchRegularExpression('/\sid="/', $html);
        self::assertStringNotContainsString('title=', $html);
        self::assertStringNotContainsString('tabindex', $html);
    }

    public function testAnEmptyOrAbsentTextWithNoSlotDefersNothing(): void
    {
        foreach ([[], ['text' => ''], ['text' => null], ['text' => false]] as $props) {
            FieldIds::reset();
            $html = $this->render($props, self::slots());

            self::assertStringNotContainsString('<template', $html);
            self::assertStringContainsString('data-vf-razor-tooltip-id="vf-tooltip-r-0"', $html);
        }
    }

    public function testAWhitespaceTextAndZeroAreContentVerbatim(): void
    {
        self::assertStringContainsString(
            '<template data-vf-razor-tooltip="content">   </template>',
            $this->render(['text' => '   '], self::slots()),
        );
        self::assertStringContainsString(
            '<template data-vf-razor-tooltip="content">0</template>',
            $this->render(['text' => '0'], self::slots()),
        );
    }

    public function testTheContentSlotWinsOverTheText(): void
    {
        self::assertStringContainsString(
            '<template data-vf-razor-tooltip="content"><strong>Rich</strong> body</template>',
            $this->render(['text' => 'Ignored'], self::slots(content: '<strong>Rich</strong> body')),
        );
    }

    public function testAnEmptyContentSlotStillDefersAnEmptyBody(): void
    {
        self::assertStringContainsString(
            '<template data-vf-razor-tooltip="content"></template>',
            $this->render([], self::slots(content: '')),
        );
    }

    public function testTheTextIsEscaped(): void
    {
        self::assertStringContainsString(
            '<template data-vf-razor-tooltip="content">&lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot;</template>',
            $this->render(['text' => '<b>x</b> & "y"'], self::slots()),
        );
    }

    public function testTheTriggerWrapperHoldsTheDefaultSlotVerbatimOrNothing(): void
    {
        self::assertStringContainsString(
            '<span class="vf-tooltip__trigger"></span>',
            $this->render(['text' => 'Hint']),
        );
        self::assertStringContainsString(
            '<span class="vf-tooltip__trigger">Just text</span>',
            $this->render(['text' => 'Hint'], self::slots('Just text')),
        );
    }

    public function testEveryOtherAttributeFallsThroughToTheRoot(): void
    {
        $html = $this->render(
            ['text' => 'Hint', 'id' => 'consumer', 'class' => 'consumer-class', 'style' => 'color: red;', 'data-testid' => 'tip', 'aria-label' => 'Help', 'disabled' => true],
            self::slots(),
        );

        self::assertStringStartsWith(
            '<span id="consumer" data-testid="tip" aria-label="Help" disabled class="vf-tooltip consumer-class" style="color: red;"',
            $html,
        );
        self::assertStringContainsString('<span class="vf-tooltip__trigger"><button', $html);
    }

    public function testThePlacementDelayAndDestinationTravelAsAdapterMetadata(): void
    {
        $html = $this->render(['text' => 'Hint', 'placement' => 'bottom', 'open-delay' => 400, 'teleport-to' => '#tips'], self::slots());

        self::assertStringContainsString('data-vf-razor-tooltip-placement="bottom"', $html);
        self::assertStringContainsString('data-vf-razor-tooltip-open-delay="400"', $html);
        self::assertStringContainsString('data-vf-razor-tooltip-teleport="#tips"', $html);
    }

    public function testTheCamelCaseSpellingsAreAccepted(): void
    {
        $html = $this->render(['text' => 'Hint', 'openDelay' => '600', 'teleportTo' => 'false'], self::slots());

        self::assertStringContainsString('data-vf-razor-tooltip-open-delay="600"', $html);
        self::assertStringContainsString('data-vf-razor-tooltip-teleport="false"', $html);
    }

    public function testInPlaceRenderingIsSpelledFalse(): void
    {
        foreach ([['disable-teleport' => true], ['teleport-to' => false], ['disableTeleport' => 'true'], ['disable-teleport' => true, 'teleport-to' => '#tips']] as $props) {
            self::assertStringContainsString(
                'data-vf-razor-tooltip-teleport="false"',
                $this->render(['text' => 'Hint'] + $props, self::slots()),
            );
        }
    }

    public function testEveryInstanceGetsItsOwnIdFromTheSharedCounter(): void
    {
        $first = $this->render(['text' => 'A'], self::slots());
        $second = $this->render(['text' => 'B'], self::slots());

        self::assertStringContainsString('data-vf-razor-tooltip-id="vf-tooltip-r-0"', $first);
        self::assertStringContainsString('data-vf-razor-tooltip-id="vf-tooltip-r-1"', $second);
    }

    public function testANonNumericDelayIsRefused(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->render(['text' => 'Hint', 'open-delay' => 'soon'], self::slots());
    }

    public function testANonScalarAttributeIsRefused(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->render(['data-x' => ['a']], self::slots());
    }

    public function testItIsRegisteredBesideThePopoverAndTakesNoConstructorArgument(): void
    {
        $components = (new VueForgeRazorProvider())->components();

        self::assertInstanceOf(TooltipComponent::class, $components['tooltip']);
        self::assertNotSame($components['popover'], $components['tooltip']);
        self::assertNull((new \ReflectionClass(TooltipComponent::class))->getConstructor());
        self::assertCount(34, $components);
    }
}
