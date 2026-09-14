<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\VueForge\Razor\Components\ProgressBarComponent;
use Codemonster\VueForge\Razor\Components\ProgressSpinnerComponent;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use DOMDocument;
use DOMElement;
use DOMXPath;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfProgressBar.
 *
 * The assertions mirror
 * packages/core/src/components/progress-bar/VfProgressBar.characterization.spec.ts
 * case for case, so the two can be read side by side. The browser-level proof
 * that they agree is the parity gate; this suite is what fails first, and
 * points at the attribute.
 *
 * This file renders no spinner and asserts, once, that the bar's output never
 * contains one - the two components share a role name and nothing else.
 */
final class ProgressBarComponentTest extends TestCase
{
    private const TONES = ['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'];

    /** @param array<string, mixed> $props */
    private function render(array $props = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-progress-bar');
        self::assertNotNull($component, 'The vf-progress-bar component must be registered by the provider.');

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

    private function fill(DOMElement $root): DOMElement
    {
        $fill = (new DOMXPath($root->ownerDocument))->query('./span', $root)?->item(0);
        self::assertInstanceOf(DOMElement::class, $fill);

        return $fill;
    }

    /** @return list<string> */
    private function classes(DOMElement $element): array
    {
        return array_values(array_filter(explode(' ', $element->getAttribute('class'))));
    }

    /** The determinate markup at a value, a maximum and a width, with no label. */
    private static function determinate(string $valuenow, string $valuemax, string $width, string $extra = ''): string
    {
        return '<div class="vf-progress-bar' . $extra . '" role="progressbar" aria-label="Progress" aria-valuemin="0"'
            . ' aria-valuemax="' . $valuemax . '" aria-valuenow="' . $valuenow . '">'
            . '<span class="vf-progress-bar__value" style="inline-size: ' . $width . ';"></span></div>';
    }

    // ------------------------------------------------------------ structure

    public function testItIsRegisteredAsAPublicComponent(): void
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());

        self::assertTrue($registry->handles('vf-progress-bar'));
        self::assertInstanceOf(ProgressBarComponent::class, $registry->resolve('vf-progress-bar'));
    }

    public function testItRendersExactlyTheHistoricalMarkupAtTheDefault(): void
    {
        self::assertSame(self::determinate('0', '100', '0%'), $this->render());
    }

    public function testItRendersADivRootHoldingOneFillSpanAndNothingElse(): void
    {
        $root = $this->root(['value' => 50]);

        self::assertSame('div', $root->tagName);
        self::assertSame(1, $root->childNodes->length);
        self::assertSame('span', $this->fill($root)->tagName);
        self::assertSame(0, $this->fill($root)->childNodes->length);
    }

    public function testItKeepsTheRoleAndTheValueOnTheRootAndTheWidthOnTheFill(): void
    {
        $root = $this->root(['value' => 50]);

        self::assertSame('progressbar', $root->getAttribute('role'));
        self::assertSame('50', $root->getAttribute('aria-valuenow'));
        self::assertFalse($root->hasAttribute('style'));
        self::assertFalse($this->fill($root)->hasAttribute('role'));
        self::assertFalse($this->fill($root)->hasAttribute('aria-valuenow'));
        self::assertSame('inline-size: 50%;', $this->fill($root)->getAttribute('style'));
    }

    public function testItRendersNoSpinnerAndNoInteractiveElementInAnyConfiguration(): void
    {
        foreach (self::TONES as $tone) {
            foreach ([false, true] as $indeterminate) {
                $markup = $this->render([
                    'tone' => $tone, 'indeterminate' => $indeterminate, 'show-value' => true,
                    'striped' => true, 'animated' => true, 'value' => 40,
                ]);

                self::assertStringNotContainsString('vf-progress-spinner', $markup);
                self::assertStringNotContainsString('<svg', $markup);
                self::assertDoesNotMatchRegularExpression('/<(a|button|input|select|textarea)\b|tabindex/', $markup);
            }
        }
    }

    public function testThereIsNoRelationshipToTheSpinnerRenderer(): void
    {
        // Registered beside the spinner, not through it, and sharing no code
        // with it: no constructor argument, no import of the spinner's
        // component or state, no call into either.
        $reflection = new \ReflectionClass(ProgressBarComponent::class);
        self::assertNull($reflection->getConstructor());
        $source = (string) file_get_contents((string) $reflection->getFileName());
        preg_match_all('/^use .+;$/m', $source, $imports);
        self::assertSame(
            [
                'use Codemonster\\Razor\\Components\\ComponentRenderContext;',
                'use Codemonster\\Razor\\Components\\Contracts\\ComponentInterface;',
                'use Codemonster\\Razor\\Components\\RenderedHtml;',
                'use Codemonster\\VueForge\\Razor\\Support\\Html;',
                'use Codemonster\\VueForge\\Razor\\Support\\ProgressBarState;',
            ],
            $imports[0],
        );
        self::assertStringNotContainsString('ProgressSpinnerState::', $source);
        self::assertStringNotContainsString('ProgressSpinnerComponent::', $source);
        self::assertNotInstanceOf(ProgressSpinnerComponent::class, new ProgressBarComponent());
    }

    // ---------------------------------------------------------- value and max

    public function testItWritesTheValueAndTheWidthFromTheSameNumber(): void
    {
        self::assertSame(self::determinate('50', '100', '50%'), $this->render(['value' => 50]));
    }

    public function testItWritesZeroAsAValueAndAWidthRatherThanDroppingEither(): void
    {
        $root = $this->root(['value' => 0]);

        self::assertSame('0', $root->getAttribute('aria-valuenow'));
        self::assertSame('inline-size: 0%;', $this->fill($root)->getAttribute('style'));
    }

    public function testItWritesTheMaximumAsFull(): void
    {
        self::assertSame(self::determinate('100', '100', '100%'), $this->render(['value' => 100]));
    }

    public function testItClampsAnOverflowToTheMaximum(): void
    {
        self::assertSame(self::determinate('100', '100', '100%'), $this->render(['value' => 150]));
        self::assertSame(self::determinate('12', '12', '100%'), $this->render(['value' => 15, 'max' => 12]));
    }

    public function testItClampsANegativeValueToZero(): void
    {
        self::assertSame(self::determinate('0', '100', '0%'), $this->render(['value' => -20]));
    }

    public function testItExposesACustomMaximumAndTheUnroundedRatio(): void
    {
        self::assertSame(self::determinate('7', '12', '58.333333333333336%'), $this->render(['value' => 7, 'max' => 12]));
        self::assertSame(self::determinate('1', '3', '33.33333333333333%'), $this->render(['value' => 1, 'max' => 3]));
    }

    public function testItFallsBackToAMaximumOf100ForZeroANegativeNanAndInfinity(): void
    {
        foreach ([0, -10, NAN, INF] as $max) {
            self::assertSame(self::determinate('5', '100', '5%'), $this->render(['value' => 5, 'max' => $max]));
        }
    }

    public function testItTreatsANonFiniteValueAsZero(): void
    {
        foreach ([NAN, INF, -INF, null] as $value) {
            self::assertSame(self::determinate('0', '100', '0%'), $this->render(['value' => $value]));
        }
    }

    public function testItKeepsAFractionalValueAndAFractionalMaximumUnrounded(): void
    {
        self::assertSame(self::determinate('33.3333', '100', '33.3333%'), $this->render(['value' => 33.3333]));
        self::assertSame(
            self::determinate('0.1', '0.3', '33.333333333333336%'),
            $this->render(['value' => 0.1, 'max' => 0.3]),
        );
        self::assertSame(self::determinate('0.5', '0.5', '100%'), $this->render(['value' => 5, 'max' => 0.5]));
    }

    public function testItWritesATinyValueInExponentFormOnBothTheAttributeAndTheWidth(): void
    {
        self::assertSame(self::determinate('1e-7', '100', '9.999999999999998e-8%'), $this->render(['value' => 1e-7]));
    }

    public function testAnIntegralFloatIsWrittenWithoutADecimalPoint(): void
    {
        // A template expression like :value="$done * 1.0" yields a float; the
        // reference has no float/int distinction and writes 50, not 50.0.
        self::assertSame(self::determinate('50', '100', '50%'), $this->render(['value' => 50.0, 'max' => 100.0]));
    }

    public function testItAlwaysExposesAriaValueminAsZero(): void
    {
        foreach ([[], ['value' => 50], ['value' => 7, 'max' => 12], ['value' => -20], ['value' => 5, 'max' => 0]] as $props) {
            self::assertSame('0', $this->root($props)->getAttribute('aria-valuemin'));
        }
    }

    // ------------------------------------------------ the numeric adapter boundary

    public function testATemplatesNumericTextIsANumberHereWhereTheReferenceReadsItAsNonFinite(): void
    {
        // The adapter boundary, stated as a test. A Razor template writes
        // value="40" as text, and 40 it is; the Vue reference, whose prop is
        // typed number, reads the same text as non-finite and renders 0. The
        // shared catalog therefore never carries a numeric string; each
        // side pins its own reading.
        self::assertSame(self::determinate('40', '80', '50%'), $this->render(['value' => '40', 'max' => '80']));
        self::assertSame(self::determinate('12.5', '100', '12.5%'), $this->render(['value' => '12.5']));
        self::assertSame(self::determinate('0', '100', '0%'), $this->render(['value' => '-3']));
        self::assertSame(self::determinate('5', '100', '5%'), $this->render(['value' => '5', 'max' => '0']));
    }

    public function testNonNumericTextIsRejectedRatherThanRenderedAsZero(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('[value] prop of vf-progress-bar must be a number');

        $this->render(['value' => 'abc']);
    }

    public function testABareValueAttributeIsTheAbsentProp(): void
    {
        // Razor passes a bare attribute as `true`; the component reads it as
        // nothing said, as it reads a bare `label`.
        self::assertSame($this->render(), $this->render(['value' => false, 'max' => false]));
    }

    // ---------------------------------------------- determinate versus indeterminate

    public function testItIsDeterminateByDefault(): void
    {
        $root = $this->root();

        self::assertNotContains('vf-progress-bar--indeterminate', $this->classes($root));
        self::assertSame('0', $root->getAttribute('aria-valuenow'));
    }

    public function testItRendersExactlyTheHistoricalIndeterminateMarkup(): void
    {
        self::assertSame(
            '<div class="vf-progress-bar vf-progress-bar--indeterminate" role="progressbar" aria-label="Progress">'
                . '<span class="vf-progress-bar__value"></span></div>',
            $this->render(['indeterminate' => true]),
        );
    }

    public function testItDropsAllThreeAriaValueAttributesAndTheFillSizeWhileIndeterminate(): void
    {
        $root = $this->root(['indeterminate' => true]);

        foreach (['aria-valuemin', 'aria-valuemax', 'aria-valuenow'] as $name) {
            self::assertFalse($root->hasAttribute($name), $name);
        }
        self::assertSame('progressbar', $root->getAttribute('role'));
        self::assertFalse($this->fill($root)->hasAttribute('style'));
    }

    public function testItIgnoresAValueAMaximumAndShowValuePassedBesideIndeterminate(): void
    {
        self::assertSame(
            $this->render(['indeterminate' => true]),
            $this->render(['indeterminate' => true, 'value' => 40, 'max' => 80, 'show-value' => true]),
        );
    }

    public function testItReadsIndeterminateFromTemplateTextAsWell(): void
    {
        self::assertContains('vf-progress-bar--indeterminate', $this->classes($this->root(['indeterminate' => 'true'])));
        self::assertNotContains('vf-progress-bar--indeterminate', $this->classes($this->root(['indeterminate' => 'false'])));
    }

    public function testItKeepsTheToneAndStripeModifiersBesideTheIndeterminateOne(): void
    {
        self::assertSame(
            [
                'vf-progress-bar',
                'vf-progress-bar--info',
                'vf-progress-bar--striped',
                'vf-progress-bar--animated',
                'vf-progress-bar--indeterminate',
            ],
            $this->classes($this->root(['indeterminate' => true, 'tone' => 'info', 'striped' => true, 'animated' => true])),
        );
    }

    // ---------------------------------------------------------- the visible label

    public function testItRendersNoLabelElementByDefault(): void
    {
        self::assertStringNotContainsString('vf-progress-bar__label', $this->render(['value' => 50]));
    }

    public function testItRendersTheRoundedPercentageInsideTheFillWithShowValue(): void
    {
        self::assertSame(
            '<div class="vf-progress-bar" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">'
                . '<span class="vf-progress-bar__value" style="inline-size: 50%;"><span class="vf-progress-bar__label">50%</span></span></div>',
            $this->render(['value' => 50, 'show-value' => true]),
        );
        self::assertStringContainsString('<span class="vf-progress-bar__label">50%</span>', $this->render(['value' => 50, 'showValue' => true]));
    }

    public function testItRoundsTheLabelHalfUpWhileLeavingTheWidthAndTheValueUnrounded(): void
    {
        $root = $this->root(['value' => 1, 'max' => 8, 'show-value' => true]);

        self::assertSame('13%', $this->fill($root)->textContent);
        self::assertSame('inline-size: 12.5%;', $this->fill($root)->getAttribute('style'));
        self::assertSame('1', $root->getAttribute('aria-valuenow'));
        self::assertSame('67%', $this->fill($this->root(['value' => 2, 'max' => 3, 'show-value' => true]))->textContent);
    }

    public function testItRendersZeroPercentAtZeroRatherThanDroppingTheLabel(): void
    {
        self::assertSame('0%', $this->fill($this->root(['value' => 0, 'show-value' => true]))->textContent);
    }

    public function testTheLabelIsNotTheAccessibleName(): void
    {
        $root = $this->root(['value' => 50, 'show-value' => true, 'label' => 'Upload']);

        self::assertSame('Upload', $root->getAttribute('aria-label'));
        self::assertSame('50%', $this->fill($root)->textContent);
        self::assertFalse($root->hasAttribute('aria-valuetext'));
    }

    // ---------------------------------------------------------------- classes

    public function testItEmitsOnlyTheBlockClassAtTheDefault(): void
    {
        self::assertSame(['vf-progress-bar'], $this->classes($this->root()));
        self::assertSame(['vf-progress-bar'], $this->classes($this->root(['tone' => 'primary'])));
    }

    public function testItEmitsAModifierForEveryToneOtherThanPrimary(): void
    {
        foreach (self::TONES as $tone) {
            $expected = $tone === 'primary' ? ['vf-progress-bar'] : ['vf-progress-bar', 'vf-progress-bar--' . $tone];

            self::assertSame($expected, $this->classes($this->root(['tone' => $tone])));
        }
        self::assertSame(['vf-progress-bar', 'vf-progress-bar--nonsense'], $this->classes($this->root(['tone' => 'nonsense'])));
    }

    public function testItEmitsTheStripedModifierAndTheAnimatedOneOnlyBesideIt(): void
    {
        self::assertSame(['vf-progress-bar', 'vf-progress-bar--striped'], $this->classes($this->root(['striped' => true])));
        self::assertSame(['vf-progress-bar'], $this->classes($this->root(['animated' => true])));
        self::assertSame(
            ['vf-progress-bar', 'vf-progress-bar--striped', 'vf-progress-bar--animated'],
            $this->classes($this->root(['striped' => true, 'animated' => true])),
        );
    }

    public function testItAppendsAConsumerClassAfterTheCanonicalClasses(): void
    {
        self::assertSame(['vf-progress-bar', 'mine'], $this->classes($this->root(['class' => 'mine'])));
        self::assertSame(
            ['vf-progress-bar', 'vf-progress-bar--info', 'vf-progress-bar--striped', 'mine'],
            $this->classes($this->root(['tone' => 'info', 'striped' => true, 'class' => 'mine'])),
        );
    }

    // ----------------------------------------------------------------- height

    public function testItWritesNoRootStyleAtTheDefault(): void
    {
        self::assertFalse($this->root()->hasAttribute('style'));
    }

    public function testItWritesANumberAsPixelsIntoTheCustomProperty(): void
    {
        self::assertSame('--vf-progress-bar-height: 12px;', $this->root(['height' => 12])->getAttribute('style'));
        self::assertSame('--vf-progress-bar-height: 12px;', $this->root(['height' => '12'])->getAttribute('style'));
        self::assertSame('--vf-progress-bar-height: 0px;', $this->root(['height' => 0])->getAttribute('style'));
        self::assertSame('--vf-progress-bar-height: 6.5px;', $this->root(['height' => 6.5])->getAttribute('style'));
    }

    public function testItWritesAStringHeightVerbatim(): void
    {
        self::assertSame('--vf-progress-bar-height: 1rem;', $this->root(['height' => '1rem'])->getAttribute('style'));
    }

    public function testItWritesNoDeclarationForAnEmptyHeight(): void
    {
        // The client form. Vue's SSR would write `--vf-progress-bar-height:;`;
        // the decision to drop it here is the adapter's, made for the reason
        // ProgressSpinnerComponent made it.
        self::assertFalse($this->root(['height' => ''])->hasAttribute('style'));
    }

    // ---------------------------------------------------------- accessibility

    public function testItNamesTheRootFromTheLabelPropAnEmptyLabelIncluded(): void
    {
        self::assertSame('Upload', $this->root(['label' => 'Upload'])->getAttribute('aria-label'));
        self::assertStringContainsString('aria-label=""', $this->render(['label' => '']));
    }

    public function testItWritesNoOtherAriaOfItsOwn(): void
    {
        $root = $this->root(['value' => 50]);

        foreach (['aria-valuetext', 'aria-busy', 'aria-live', 'aria-hidden', 'aria-labelledby'] as $name) {
            self::assertFalse($root->hasAttribute($name), $name);
        }
    }

    public function testItLetsAConsumerRoleReplaceItsOwnWhileTheValueStays(): void
    {
        $root = $this->root(['role' => 'status']);

        self::assertSame('status', $root->getAttribute('role'));
        self::assertStringNotContainsString('progressbar', $this->render(['role' => 'status']));
        self::assertSame('0', $root->getAttribute('aria-valuenow'));
    }

    public function testANullConsumerRoleLeavesTheComponentsOwnInPlace(): void
    {
        self::assertSame('progressbar', $this->root(['role' => null, 'aria-valuenow' => null])->getAttribute('role'));
        self::assertSame('0', $this->root(['aria-valuenow' => null])->getAttribute('aria-valuenow'));
    }

    public function testItLetsAConsumerAriaLabelReplaceItsOwn(): void
    {
        self::assertSame('Busy', $this->root(['label' => 'Upload', 'aria-label' => 'Busy'])->getAttribute('aria-label'));
    }

    public function testItLetsAConsumerAriaValueAttributeReplaceItsOwnWhileTheWidthKeepsTheProp(): void
    {
        $root = $this->root(['value' => 50, 'aria-valuenow' => '40']);

        self::assertSame('40', $root->getAttribute('aria-valuenow'));
        self::assertSame('inline-size: 50%;', $this->fill($root)->getAttribute('style'));
        self::assertSame('200', $this->root(['aria-valuemax' => '200'])->getAttribute('aria-valuemax'));
        self::assertSame('10', $this->root(['aria-valuemin' => '10'])->getAttribute('aria-valuemin'));
    }

    public function testItForwardsAConsumerAriaValuetextAndAriaLabelledby(): void
    {
        $root = $this->root(['aria-valuetext' => 'half', 'aria-labelledby' => 'heading']);

        self::assertSame('half', $root->getAttribute('aria-valuetext'));
        self::assertSame('heading', $root->getAttribute('aria-labelledby'));
        self::assertSame('Progress', $root->getAttribute('aria-label'));
    }

    public function testItForwardsAConsumerAriaValuenowOntoAnIndeterminateBar(): void
    {
        $root = $this->root(['indeterminate' => true, 'aria-valuenow' => '40']);

        self::assertSame('40', $root->getAttribute('aria-valuenow'));
        self::assertFalse($root->hasAttribute('aria-valuemin'));
        self::assertFalse($root->hasAttribute('aria-valuemax'));
    }

    public function testItLetsAConsumerHideTheWholeBar(): void
    {
        $root = $this->root(['aria-hidden' => 'true']);

        self::assertSame('true', $root->getAttribute('aria-hidden'));
        self::assertSame('progressbar', $root->getAttribute('role'));
    }

    // ------------------------------------------------------------ attrs and style

    public function testItForwardsNativeAndDataAttributesOntoTheRootNeverOntoTheFill(): void
    {
        $root = $this->root(['id' => 'pb', 'title' => 'Uploading', 'data-testid' => 'bar']);

        self::assertSame('pb', $root->getAttribute('id'));
        self::assertSame('Uploading', $root->getAttribute('title'));
        self::assertSame('bar', $root->getAttribute('data-testid'));
        self::assertFalse($this->fill($root)->hasAttribute('id'));
        self::assertFalse($this->fill($root)->hasAttribute('data-testid'));
    }

    public function testItMergesAConsumerStyleAfterItsOwnHeightDeclaration(): void
    {
        self::assertSame('margin: 4px;', $this->root(['style' => 'margin: 4px'])->getAttribute('style'));
        self::assertSame(
            '--vf-progress-bar-height: 12px; margin: 4px;',
            $this->root(['height' => 12, 'style' => 'margin: 4px'])->getAttribute('style'),
        );
    }

    public function testItLetsAConsumerDeclarationOfTheHeightPropertyWinOverTheProp(): void
    {
        self::assertSame(
            '--vf-progress-bar-height: 4px;',
            $this->root(['height' => 12, 'style' => '--vf-progress-bar-height: 4px'])->getAttribute('style'),
        );
    }

    public function testItNeverLetsAConsumerStyleReachTheFill(): void
    {
        $root = $this->root(['value' => 50, 'style' => 'inline-size: 10%']);

        self::assertSame('inline-size: 10%;', $root->getAttribute('style'));
        self::assertSame('inline-size: 50%;', $this->fill($root)->getAttribute('style'));
    }

    public function testItEscapesEveryConsumerValue(): void
    {
        $markup = $this->render(['label' => '"><b>x</b>', 'class' => '"><i>', 'data-testid' => "'\"<", 'tone' => '"><s>']);

        self::assertStringNotContainsString('<b>', $markup);
        self::assertStringNotContainsString('<i>', $markup);
        self::assertStringNotContainsString('<s>', $markup);
        self::assertStringContainsString('&quot;&gt;&lt;b&gt;x&lt;/b&gt;', $markup);
    }

    public function testItRejectsANonScalarAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->render(['data-config' => ['a' => 1]]);
    }

    // ------------------------------------------------------------ no browser work

    public function testItRendersCompletelyOnTheServerWithNoMarkerForABrowserController(): void
    {
        $markup = $this->render(['indeterminate' => true, 'striped' => true, 'animated' => true]);

        self::assertStringNotContainsString('data-vf-razor', $markup);
        self::assertStringNotContainsString('animation', $markup);
        self::assertStringNotContainsString('transition', $markup);
    }
}
