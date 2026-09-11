<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\VueForge\Razor\Components\ProgressSpinnerComponent;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use DOMDocument;
use DOMElement;
use DOMXPath;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfProgressSpinner.
 *
 * The assertions mirror
 * packages/core/src/components/progress-spinner/VfProgressSpinner.characterization.spec.ts
 * case for case, so the two can be read side by side. The browser-level proof
 * that they agree is the parity gate; this suite is what fails first, and
 * points at the attribute.
 *
 * This file imports nothing from the button and renders no button. A button
 * defect must not be able to reach it, which is half of the dependency
 * direction proof; the other half is in ButtonComponentTest.
 */
final class ProgressSpinnerComponentTest extends TestCase
{
    private const ARTWORK =
        '<svg class="vf-progress-spinner__svg" viewBox="0 0 50 50" aria-hidden="true" focusable="false">'
        . '<circle class="vf-progress-spinner__track" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>'
        . '<circle class="vf-progress-spinner__value" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>'
        . '</svg>';

    private const TONES = ['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'];

    /** @param array<string, mixed> $props */
    private function render(array $props = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-progress-spinner');
        self::assertNotNull($component, 'The vf-progress-spinner component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, []))->value();
    }

    /** @param array<string, mixed> $props */
    private function root(array $props = []): DOMElement
    {
        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' . $this->render($props) . '</body></html>',
            LIBXML_NOERROR,
        ));
        $root = (new DOMXPath($document))->query('//body/*')?->item(0);
        self::assertInstanceOf(DOMElement::class, $root);

        return $root;
    }

    /** @return list<string> */
    private function classes(DOMElement $element): array
    {
        return array_values(array_filter(explode(' ', $element->getAttribute('class'))));
    }

    // ------------------------------------------------------------ structure

    public function testItIsRegisteredAsAPublicComponent(): void
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());

        self::assertTrue($registry->handles('vf-progress-spinner'));
        self::assertInstanceOf(ProgressSpinnerComponent::class, $registry->resolve('vf-progress-spinner'));
    }

    public function testRendersExactlyTheHistoricalMarkupAtTheDefault(): void
    {
        self::assertSame(
            '<span class="vf-progress-spinner" role="progressbar" aria-label="Loading">' . self::ARTWORK . '</span>',
            $this->render(),
        );
    }

    public function testRendersASpanRootHoldingOneSvgHoldingTwoCircles(): void
    {
        $root = $this->root();
        self::assertSame('span', $root->tagName);

        $children = iterator_to_array($root->childNodes);
        self::assertCount(1, $children);
        $svg = $children[0];
        self::assertInstanceOf(DOMElement::class, $svg);
        self::assertSame('svg', $svg->tagName);

        $circles = array_values(array_filter(iterator_to_array($svg->childNodes), static fn ($node) => $node instanceof DOMElement));
        self::assertCount(2, $circles);
        self::assertSame(['vf-progress-spinner__track', 'vf-progress-spinner__value'], array_map(
            static fn (DOMElement $circle): string => $circle->getAttribute('class'),
            $circles,
        ));
        foreach ($circles as $circle) {
            self::assertSame('circle', $circle->tagName);
            self::assertSame('25', $circle->getAttribute('cx'));
            self::assertSame('25', $circle->getAttribute('cy'));
            self::assertSame('20', $circle->getAttribute('r'));
            self::assertSame('none', $circle->getAttribute('fill'));
        }
    }

    public function testTheSvgHasAFixedViewBoxAndNoWidthOrHeight(): void
    {
        $markup = $this->render(['size' => 40]);

        self::assertStringContainsString('viewBox="0 0 50 50"', $markup);
        self::assertStringNotContainsString(' width="', $markup);
        self::assertStringNotContainsString(' height="', $markup);
    }

    public function testItRendersNoTextNoSlotAndNoInteractiveElement(): void
    {
        foreach (self::TONES as $tone) {
            $markup = $this->render(['tone' => $tone, 'size' => 40, 'stroke-width' => 6, 'label' => 'Busy']);

            self::assertSame('', $this->root(['tone' => $tone])->textContent);
            self::assertStringNotContainsString('<button', $markup);
            self::assertStringNotContainsString('<a ', $markup);
            self::assertStringNotContainsString('tabindex', $markup);
        }
    }

    public function testItNeedsNoBrowserControllerAtAll(): void
    {
        self::assertStringNotContainsString('data-vf-razor', $this->render(['tone' => 'danger', 'size' => 40]));
    }

    // -------------------------------------------------------------- classes

    public function testEmitsOnlyTheBlockClassAtTheDefaultTone(): void
    {
        self::assertSame(['vf-progress-spinner'], $this->classes($this->root()));
        self::assertSame(['vf-progress-spinner'], $this->classes($this->root(['tone' => 'primary'])));
    }

    public function testEmitsAModifierForEveryToneOtherThanPrimaryNeutralIncluded(): void
    {
        foreach (self::TONES as $tone) {
            $expected = $tone === 'primary'
                ? ['vf-progress-spinner']
                : ['vf-progress-spinner', 'vf-progress-spinner--' . $tone];

            self::assertSame($expected, $this->classes($this->root(['tone' => $tone])), "tone {$tone}");
        }
    }

    public function testInterpolatesAnUndocumentedToneWithoutValidatingIt(): void
    {
        self::assertSame(
            ['vf-progress-spinner', 'vf-progress-spinner--nonsense'],
            $this->classes($this->root(['tone' => 'nonsense'])),
        );
    }

    public function testNeverEmitsAnotherBlockName(): void
    {
        foreach (self::TONES as $tone) {
            $class = $this->root(['tone' => $tone])->getAttribute('class');

            self::assertStringNotContainsString('vf-alert', $class);
            self::assertStringNotContainsString('vf-badge', $class);
            self::assertStringNotContainsString('vf-button', $class);
        }
    }

    public function testAppendsAConsumerClassAfterTheCanonicalClasses(): void
    {
        self::assertSame(['vf-progress-spinner', 'mine'], $this->classes($this->root(['class' => 'mine'])));
        self::assertSame(
            ['vf-progress-spinner', 'vf-progress-spinner--info', 'mine'],
            $this->classes($this->root(['tone' => 'info', 'class' => 'mine'])),
        );
    }

    // ----------------------------------------------------------------- size

    public function testWritesNoStyleAttributeAtTheDefault(): void
    {
        self::assertFalse($this->root()->hasAttribute('style'));
    }

    public function testWritesANumberAsPixels(): void
    {
        self::assertSame('--vf-progress-spinner-size: 40px;', $this->root(['size' => 40])->getAttribute('style'));
        self::assertSame('--vf-progress-spinner-size: 24.5px;', $this->root(['size' => 24.5])->getAttribute('style'));
    }

    public function testTreatsZeroAsALength(): void
    {
        self::assertSame('--vf-progress-spinner-size: 0px;', $this->root(['size' => 0])->getAttribute('style'));
    }

    public function testWritesAStringVerbatimTokenReferencesIncluded(): void
    {
        self::assertSame('--vf-progress-spinner-size: 2em;', $this->root(['size' => '2em'])->getAttribute('style'));
        self::assertSame(
            '--vf-progress-spinner-size: var(--vf-icon-current-size);',
            $this->root(['size' => 'var(--vf-icon-current-size)'])->getAttribute('style'),
        );
    }

    public function testANumericStringFromATemplateBecomesPixels(): void
    {
        // A template writes size="40" as text. The Vue prop typed
        // string | number would receive a number from `:size="40"`, so the
        // text form has to reach the same place.
        self::assertSame('--vf-progress-spinner-size: 40px;', $this->root(['size' => '40'])->getAttribute('style'));
    }

    public function testAnEmptySizeWritesNoDeclarationAndNoAttribute(): void
    {
        // The adapter's decision, made where the shared rule declines to make
        // it: the client form, no attribute at all.
        self::assertFalse($this->root(['size' => ''])->hasAttribute('style'));
        self::assertStringNotContainsString('--vf-progress-spinner-size', $this->render(['size' => '']));
    }

    public function testANullSizeFromATemplateIsTheDefault(): void
    {
        // `:size="$maybeNull"` binds the prop with a null value. Null is absence.
        self::assertFalse($this->root(['size' => null])->hasAttribute('style'));
    }

    // --------------------------------------------------------- stroke width

    public function testWritesTheStrokeWidthOnBothCircles(): void
    {
        self::assertSame(2, substr_count($this->render(), 'stroke-width="4"'));
        self::assertSame(2, substr_count($this->render(['stroke-width' => 5]), 'stroke-width="5"'));
        self::assertSame(2, substr_count($this->render(['strokeWidth' => 2.5]), 'stroke-width="2.5"'));
        self::assertSame(2, substr_count($this->render(['stroke-width' => '6']), 'stroke-width="6"'));
    }

    public function testWritesZeroAsAStrokeWidthRatherThanDroppingIt(): void
    {
        self::assertSame(2, substr_count($this->render(['stroke-width' => 0]), 'stroke-width="0"'));
    }

    public function testRejectsANonNumericStrokeWidth(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['stroke-width' => 'thick']);
    }

    // -------------------------------------------------------- accessibility

    public function testExposesTheRootAsAProgressbarNamedLoadingByDefault(): void
    {
        $root = $this->root();

        self::assertSame('progressbar', $root->getAttribute('role'));
        self::assertSame('Loading', $root->getAttribute('aria-label'));
    }

    public function testNamesTheRootFromTheLabelPropAnEmptyLabelIncluded(): void
    {
        self::assertSame('Saving', $this->root(['label' => 'Saving'])->getAttribute('aria-label'));
        $empty = $this->root(['label' => '']);
        self::assertTrue($empty->hasAttribute('aria-label'));
        self::assertSame('', $empty->getAttribute('aria-label'));
    }

    public function testHidesOnlyTheArtworkFromAssistiveTechnology(): void
    {
        $root = $this->root();
        self::assertFalse($root->hasAttribute('aria-hidden'));

        $svg = (new DOMXPath($root->ownerDocument))->query('//svg')?->item(0);
        self::assertInstanceOf(DOMElement::class, $svg);
        self::assertSame('true', $svg->getAttribute('aria-hidden'));
        self::assertSame('false', $svg->getAttribute('focusable'));
        self::assertSame(1, substr_count($this->render(), 'aria-hidden='));
    }

    public function testWritesNoValueSemantics(): void
    {
        $markup = $this->render();

        foreach (['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext', 'aria-busy', 'aria-live'] as $name) {
            self::assertStringNotContainsString($name, $markup);
        }
    }

    public function testAConsumerRoleReplacesItsOwn(): void
    {
        $markup = $this->render(['role' => 'status']);

        self::assertSame('status', $this->root(['role' => 'status'])->getAttribute('role'));
        self::assertStringNotContainsString('progressbar', $markup);
        self::assertSame(1, substr_count($markup, 'role='));
    }

    public function testAConsumerAriaLabelReplacesItsOwn(): void
    {
        $markup = $this->render(['label' => 'Loading', 'aria-label' => 'Busy']);

        self::assertSame('Busy', $this->root(['label' => 'Loading', 'aria-label' => 'Busy'])->getAttribute('aria-label'));
        self::assertSame(1, substr_count($markup, 'aria-label='));
    }

    public function testANullConsumerRoleFromATemplateLeavesItsOwn(): void
    {
        // The showcase template writes `:role="$case['attrs']['role'] ?? null"`
        // for every case, so null must be "the consumer said nothing".
        self::assertSame('progressbar', $this->root(['role' => null, 'aria-label' => null])->getAttribute('role'));
        self::assertSame('Loading', $this->root(['role' => null, 'aria-label' => null])->getAttribute('aria-label'));
    }

    public function testForwardsConsumerValueSemanticsOntoTheRoot(): void
    {
        $root = $this->root(['aria-valuenow' => '40', 'aria-valuemin' => '0', 'aria-valuemax' => '100']);

        self::assertSame('40', $root->getAttribute('aria-valuenow'));
        self::assertSame('0', $root->getAttribute('aria-valuemin'));
        self::assertSame('100', $root->getAttribute('aria-valuemax'));
        self::assertSame('progressbar', $root->getAttribute('role'));
    }

    public function testAConsumerCanHideTheWholeSpinner(): void
    {
        $root = $this->root(['aria-hidden' => 'true']);

        self::assertSame('true', $root->getAttribute('aria-hidden'));
        self::assertSame('progressbar', $root->getAttribute('role'));
    }

    // -------------------------------------------------------- attrs and style

    public function testForwardsNativeAndDataAttributesOntoTheRootNeverOntoTheSvg(): void
    {
        $root = $this->root(['id' => 'sp', 'title' => 'Loading data', 'data-testid' => 'spinner']);

        self::assertSame('sp', $root->getAttribute('id'));
        self::assertSame('Loading data', $root->getAttribute('title'));
        self::assertSame('spinner', $root->getAttribute('data-testid'));
        self::assertStringContainsString(self::ARTWORK, $this->render(['id' => 'sp', 'data-testid' => 'spinner']));
    }

    public function testMergesAConsumerStyleAfterItsOwnSizeDeclaration(): void
    {
        self::assertSame('margin: 4px;', $this->root(['style' => 'margin: 4px'])->getAttribute('style'));
        self::assertSame(
            '--vf-progress-spinner-size: 40px; margin: 4px;',
            $this->root(['size' => 40, 'style' => 'margin: 4px'])->getAttribute('style'),
        );
    }

    public function testAConsumerDeclarationOfTheSizePropertyWinsOverTheProp(): void
    {
        self::assertSame(
            '--vf-progress-spinner-size: 10px;',
            $this->root(['size' => 40, 'style' => '--vf-progress-spinner-size: 10px'])->getAttribute('style'),
        );
    }

    public function testKeepsTheArtworkFixedWhateverTheConsumerForwards(): void
    {
        $markup = $this->render([
            'tone' => 'danger', 'size' => 40, 'stroke-width' => 6,
            'class' => 'mine', 'style' => 'margin: 4px', 'role' => 'status', 'data-testid' => 'x',
        ]);

        self::assertStringContainsString(str_replace('stroke-width="4"', 'stroke-width="6"', self::ARTWORK), $markup);
    }

    public function testEscapesEveryConsumerSuppliedValue(): void
    {
        $markup = $this->render([
            'tone' => '"><script>alert(1)</script>',
            'label' => "it's \"quoted\"",
            'class' => 'a"b',
            'size' => '"><b>',
        ]);

        self::assertStringNotContainsString('<script>', $markup);
        self::assertStringContainsString('&lt;script&gt;', $markup);
        self::assertStringContainsString('&#039;', $markup);
        self::assertStringContainsString('a&quot;b', $markup);
        self::assertStringNotContainsString('<b>', $markup);
    }

    public function testRejectsANonScalarAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['data-config' => ['a' => 1]]);
    }

    // ------------------------------------------------------------- ownership

    public function testThereIsNoOtherSpinnerRendererInThePackage(): void
    {
        // The pre-M20 Support\ProgressSpinner is gone, and nothing else in the
        // package writes the block class. One renderer, this one.
        self::assertFileDoesNotExist(dirname(__DIR__, 2) . '/src/Support/ProgressSpinner.php');
        self::assertFalse(class_exists('Codemonster\\VueForge\\Razor\\Support\\ProgressSpinner'));

        $writers = [];
        foreach (['Components', 'Support'] as $directory) {
            foreach ((array) glob(dirname(__DIR__, 2) . "/src/{$directory}/*.php") as $file) {
                if (str_contains((string) file_get_contents($file), "'vf-progress-spinner")
                    || str_contains((string) file_get_contents($file), '"vf-progress-spinner')) {
                    $writers[] = basename($file);
                }
            }
        }

        self::assertSame(['ProgressSpinnerComponent.php', 'ProgressSpinnerState.php'], $writers);
    }
}
