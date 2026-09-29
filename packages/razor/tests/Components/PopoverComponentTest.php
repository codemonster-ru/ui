<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\PopoverComponent;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfPopover.
 *
 * The server half of
 * packages/core/src/components/popover/VfPopover.characterization.spec.ts:
 * the trigger wrapper's exact attributes, the dangling closed aria-controls,
 * the inert deferred content, the unpositioned open `section[role=dialog]` in
 * place, the root that takes every forwarded attribute, and the adapter
 * metadata the browser controller reads. What happens after a gesture is the
 * controller's and is measured in a real browser.
 */
final class PopoverComponentTest extends TestCase
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
        $component = $registry->resolve('vf-popover');
        self::assertNotNull($component, 'The vf-popover component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    /** @return array<string, \Closure(): RenderedHtml> */
    private static function slots(string $trigger = 'Details', string $content = '<p>Body</p>'): array
    {
        return [
            'trigger' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($trigger),
            'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($content),
        ];
    }

    private const META = ' data-vf-razor="popover" data-vf-razor-popover-placement="bottom-start"'
        . ' data-vf-razor-popover-close-on-outside-click="true" data-vf-razor-popover-close-on-escape="true"'
        . ' data-vf-razor-popover-teleport="body"';

    public function testItRendersTheClosedTriggerWithADanglingAriaControlsAndTheContentDeferred(): void
    {
        self::assertSame(
            '<div class="vf-popover"' . self::META . '>'
            . '<div id="vf-popover-trigger-r-1" class="vf-popover__trigger" aria-controls="vf-popover-content-r-0"'
            . ' aria-expanded="false" aria-haspopup="dialog" tabindex="0">Details</div>'
            . '<template data-vf-razor-popover="content"><p>Body</p></template>'
            . '</div>',
            $this->render([], self::slots()),
        );
    }

    public function testTheClosedContentDoesNotExistSoTheReferenceDangles(): void
    {
        $html = $this->render([], self::slots());

        self::assertStringNotContainsString('role="dialog"', $html);
        self::assertStringNotContainsString('id="vf-popover-content-r-0"', $html);
        self::assertStringContainsString('aria-controls="vf-popover-content-r-0"', $html);
    }

    public function testItRendersInitiallyOpenContentInPlaceUnpositionedAndWiredBothWays(): void
    {
        self::assertSame(
            '<div class="vf-popover"' . self::META . '>'
            . '<div id="vf-popover-trigger-r-1" class="vf-popover__trigger" aria-controls="vf-popover-content-r-0"'
            . ' aria-expanded="true" aria-haspopup="dialog" tabindex="0">Details</div>'
            . '<section id="vf-popover-content-r-0" class="vf-popover__content" style="left:0px;top:0px;"'
            . ' aria-labelledby="vf-popover-trigger-r-1" role="dialog" tabindex="-1">'
            . '<span class="vf-popover__arrow vf-popover__arrow--bottom" style="left:0px;top:0px;" aria-hidden="true"></span>'
            . '<p>Body</p></section>'
            . '</div>',
            $this->render(['default-open' => true], self::slots()),
        );
    }

    public function testOpenWinsOverDefaultOpenWheneverItIsGiven(): void
    {
        self::assertStringContainsString('aria-expanded="false"', $this->render(['open' => false, 'default-open' => true], self::slots()));
        self::assertStringContainsString('aria-expanded="true"', $this->render(['open' => true], self::slots()));
        self::assertStringContainsString('aria-expanded="true"', $this->render(['defaultOpen' => 'true'], self::slots()));
    }

    public function testThereIsNoDisabledState(): void
    {
        $html = $this->render(['disabled' => true], self::slots());

        // A consumer `disabled` is an ordinary forwarded attribute on the root,
        // as it is in the reference; the trigger stays in the tab order.
        self::assertStringStartsWith('<div disabled class="vf-popover"', $html);
        self::assertStringContainsString('aria-haspopup="dialog" tabindex="0">', $html);
        self::assertStringNotContainsString('aria-disabled', $html);
    }

    public function testThePlacementIsWrittenThroughAndDecidesTheOpenClasses(): void
    {
        $end = $this->render(['default-open' => true, 'placement' => 'bottom-end'], self::slots());

        self::assertStringContainsString('class="vf-popover__content"', $end);
        self::assertStringContainsString('data-vf-razor-popover-placement="bottom-end"', $end);

        // A top placement marks the content and the arrow before anything
        // computes a position; there is no --bottom content modifier.
        $top = $this->render(['default-open' => true, 'placement' => 'top-start'], self::slots());
        self::assertStringContainsString('class="vf-popover__content vf-popover__content--top"', $top);
        self::assertStringContainsString('class="vf-popover__arrow vf-popover__arrow--top"', $top);
        self::assertStringNotContainsString('vf-popover__content--bottom', $end);
    }

    public function testTheTeleportDestinationTravelsAsAdapterMetadata(): void
    {
        self::assertStringContainsString(
            'data-vf-razor-popover-teleport="#overlay-root"',
            $this->render(['teleport-to' => '#overlay-root'], self::slots()),
        );
        self::assertStringContainsString(
            'data-vf-razor-popover-teleport="false"',
            $this->render(['teleport-to' => false], self::slots()),
        );
        self::assertStringContainsString(
            'data-vf-razor-popover-teleport="false"',
            $this->render(['teleportTo' => 'false'], self::slots()),
        );
        self::assertStringContainsString(
            'data-vf-razor-popover-teleport="false"',
            $this->render(['teleport-to' => '#overlay-root', 'disable-teleport' => true], self::slots()),
        );
        self::assertStringContainsString(
            'data-vf-razor-popover-teleport="body"',
            $this->render(['teleport-to' => null], self::slots()),
        );
    }

    public function testBothDismissalSwitchesTravelAsAdapterMetadata(): void
    {
        $html = $this->render(['close-on-outside-click' => false, 'closeOnEscape' => 'false'], self::slots());

        self::assertStringContainsString('data-vf-razor-popover-close-on-outside-click="false"', $html);
        self::assertStringContainsString('data-vf-razor-popover-close-on-escape="false"', $html);
    }

    public function testForwardedAttributesAndTheConsumerClassLandOnTheRootOnly(): void
    {
        $html = $this->render(
            ['id' => 'consumer', 'data-testid' => 'po', 'aria-label' => 'Popover', 'class' => 'consumer extra', 'style' => 'margin-top: 4px;'],
            self::slots(),
        );

        self::assertStringStartsWith(
            '<div id="consumer" data-testid="po" aria-label="Popover" class="vf-popover consumer extra" style="margin-top: 4px;"',
            $html,
        );
        self::assertStringContainsString('<div id="vf-popover-trigger-r-1" class="vf-popover__trigger"', $html);
    }

    public function testEmptySlotsRenderAnEmptyTriggerAndEmptyDeferredContent(): void
    {
        self::assertStringContainsString(
            'tabindex="0"></div><template data-vf-razor-popover="content"></template></div>',
            $this->render(),
        );
        self::assertStringContainsString(
            'aria-hidden="true"></span></section></div>',
            $this->render(['default-open' => true]),
        );
    }

    public function testEveryInstanceGetsItsOwnIdsAndTheyNeverCross(): void
    {
        $first = $this->render([], self::slots());
        $second = $this->render([], self::slots());

        self::assertStringContainsString('aria-controls="vf-popover-content-r-0"', $first);
        self::assertStringContainsString('id="vf-popover-trigger-r-1"', $first);
        self::assertStringContainsString('aria-controls="vf-popover-content-r-2"', $second);
        self::assertStringContainsString('id="vf-popover-trigger-r-3"', $second);
    }

    public function testItWritesNoScriptAndNoInlineHandler(): void
    {
        $html = $this->render(['default-open' => true], self::slots());

        self::assertStringNotContainsString('<script', $html);
        self::assertDoesNotMatchRegularExpression('/\son[a-z]+=/', $html);
    }

    public function testItRejectsAnUnusableTeleportTarget(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['teleport-to' => ['#x']], self::slots());
    }

    public function testItRejectsANonScalarForwardedAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['data-x' => ['a']], self::slots());
    }

    public function testItIsRegisteredBesideTheDropdownAndTakesNoConstructorArgument(): void
    {
        $components = (new VueForgeRazorProvider())->components();

        self::assertInstanceOf(PopoverComponent::class, $components['popover']);
        self::assertNotSame($components['dropdown'], $components['popover']);
        self::assertNull((new \ReflectionClass(PopoverComponent::class))->getConstructor());
        self::assertCount(30, $components);
    }
}
