<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use DOMDocument;
use DOMElement;
use DOMXPath;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfCheckbox, VfRadio and VfSwitch.
 *
 * Three independent sets of assertions in one file, each mirroring its own Vue
 * characterization suite. They share a rendering helper and nothing else - the
 * point of the batch was to find out whether the three components are alike,
 * and the answer was no.
 */
final class CheckableComponentsTest extends TestCase
{
    /** @param array<string, mixed> $props */
    private function render(string $tag, array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve($tag);
        self::assertNotNull($component, "The {$tag} component must be registered by the provider.");

        $closures = [];
        foreach ($slots as $name => $markup) {
            $closures[$name] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
        }

        return $component->render(new ComponentRenderContext($props, $closures))->value();
    }

    /** @param array<string, mixed> $props */
    private function root(string $tag, array $props = [], array $slots = []): DOMElement
    {
        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'
            . $this->render($tag, $props, $slots) . '</body></html>',
            LIBXML_NOERROR,
        ));
        $label = (new DOMXPath($document))->query('//label')?->item(0);
        self::assertInstanceOf(DOMElement::class, $label);

        return $label;
    }

    // ------------------------------------------------------------- checkbox

    public function testCheckboxRendersALabelWrappingANativeCheckbox(): void
    {
        $root = $this->root('vf-checkbox');
        $input = $root->getElementsByTagName('input')->item(0);

        self::assertSame('label', $root->tagName);
        self::assertInstanceOf(DOMElement::class, $input);
        self::assertSame('checkbox', $input->getAttribute('type'));
        self::assertSame('vf-checkbox__input', $input->getAttribute('class'));
    }

    public function testCheckboxAlwaysEmitsASizeModifier(): void
    {
        self::assertSame('vf-checkbox vf-checkbox--md', $this->root('vf-checkbox')->getAttribute('class'));
        self::assertStringContainsString(
            'vf-checkbox--lg',
            $this->root('vf-checkbox', ['size' => 'lg'])->getAttribute('class'),
        );
    }

    public function testCheckboxEmitsStateModifiersInTheReferenceOrder(): void
    {
        self::assertSame(
            'vf-checkbox vf-checkbox--sm vf-checkbox--checked vf-checkbox--indeterminate '
                . 'vf-checkbox--invalid vf-checkbox--disabled',
            $this->root('vf-checkbox', [
                'size' => 'sm',
                'checked' => true,
                'indeterminate' => true,
                'invalid' => true,
                'disabled' => true,
            ])->getAttribute('class'),
        );
    }

    public function testCheckboxCarriesAnExplicitAriaChecked(): void
    {
        $input = static fn (DOMElement $root): ?DOMElement => $root->getElementsByTagName('input')->item(0);

        self::assertSame('false', $input($this->root('vf-checkbox'))?->getAttribute('aria-checked'));
        self::assertSame('true', $input($this->root('vf-checkbox', ['checked' => true]))?->getAttribute('aria-checked'));
        self::assertSame(
            'mixed',
            $input($this->root('vf-checkbox', ['checked' => true, 'indeterminate' => true]))
                ?->getAttribute('aria-checked'),
        );
    }

    public function testCheckboxMarksOnlyAnIndeterminateControlForEnhancement(): void
    {
        // indeterminate is a DOM property with no attribute, so it is the one
        // thing the server cannot express and the only thing marked.
        self::assertStringNotContainsString('data-vf-razor', $this->render('vf-checkbox', ['checked' => true]));
        self::assertStringContainsString(
            'data-vf-razor="checkbox-indeterminate"',
            $this->render('vf-checkbox', ['indeterminate' => true]),
        );
    }

    public function testCheckboxSwapsTheMarkWhenIndeterminate(): void
    {
        self::assertStringContainsString('vf-checkbox__mark', $this->render('vf-checkbox'));
        $indeterminate = $this->render('vf-checkbox', ['indeterminate' => true]);
        self::assertStringContainsString('vf-checkbox__indeterminate-mark', $indeterminate);
        self::assertStringNotContainsString('"vf-checkbox__mark"', $indeterminate);
    }

    public function testCheckboxPutsConsumerClassOnTheRootAndOtherAttrsOnTheInput(): void
    {
        $root = $this->root('vf-checkbox', [
            'class' => 'consumer-checkbox',
            'style' => 'margin: 4px',
            'id' => 'ship',
            'name' => 'ship',
            'required' => true,
            'data-testid' => 'ship',
        ]);
        $input = $root->getElementsByTagName('input')->item(0);

        self::assertSame('vf-checkbox vf-checkbox--md consumer-checkbox', $root->getAttribute('class'));
        self::assertSame('margin: 4px', $root->getAttribute('style'));
        self::assertInstanceOf(DOMElement::class, $input);
        self::assertSame('vf-checkbox__input', $input->getAttribute('class'));
        self::assertSame('ship', $input->getAttribute('id'));
        self::assertSame('ship', $input->getAttribute('name'));
        self::assertTrue($input->hasAttribute('required'));
        self::assertSame('ship', $input->getAttribute('data-testid'));
    }

    public function testCheckboxLetsAConsumerOverrideTheComponentBinding(): void
    {
        $input = $this->root('vf-checkbox', ['invalid' => true, 'aria-invalid' => 'false'])
            ->getElementsByTagName('input')->item(0);

        self::assertSame('false', $input?->getAttribute('aria-invalid'));
    }

    public function testCheckboxRendersContentOnlyWhenThereIsSome(): void
    {
        self::assertStringNotContainsString('vf-checkbox__content', $this->render('vf-checkbox'));
        $root = $this->root('vf-checkbox', ['label' => 'Ship it']);
        $content = (new DOMXPath($root->ownerDocument))->query('//span[@class="vf-checkbox__content"]')?->item(0);
        self::assertInstanceOf(DOMElement::class, $content);
        self::assertSame('Ship it', $content->textContent);
    }

    public function testCheckboxEscapesItsLabel(): void
    {
        $markup = $this->render('vf-checkbox', ['label' => '<b>bold</b> & "quoted"']);

        self::assertStringNotContainsString('<b>', $markup);
        self::assertStringContainsString('&lt;b&gt;', $markup);
        self::assertStringContainsString('&amp;', $markup);
    }

    // ---------------------------------------------------------------- radio

    public function testRadioRendersALabelWrappingANativeRadio(): void
    {
        $input = $this->root('vf-radio', ['value' => 'a'])->getElementsByTagName('input')->item(0);

        self::assertInstanceOf(DOMElement::class, $input);
        self::assertSame('radio', $input->getAttribute('type'));
        self::assertSame('a', $input->getAttribute('value'));
    }

    public function testRadioCarriesNoAriaCheckedUnlikeTheCheckbox(): void
    {
        $input = $this->root('vf-radio', ['value' => 'a'])->getElementsByTagName('input')->item(0);

        self::assertFalse($input?->hasAttribute('aria-checked'));
    }

    public function testRadioIsCheckedOnlyWhenTheModelStrictlyEqualsItsValue(): void
    {
        $checked = $this->root('vf-radio', ['value' => 'a', 'model-value' => 'a']);
        $unchecked = $this->root('vf-radio', ['value' => 'a', 'model-value' => 'b']);

        self::assertTrue($checked->getElementsByTagName('input')->item(0)?->hasAttribute('checked'));
        self::assertStringContainsString('vf-radio--checked', $checked->getAttribute('class'));
        self::assertFalse($unchecked->getElementsByTagName('input')->item(0)?->hasAttribute('checked'));
    }

    public function testRadioComparesStrictlySoANumberDoesNotMatchAString(): void
    {
        self::assertStringNotContainsString(
            'vf-radio--checked',
            $this->root('vf-radio', ['value' => '1', 'model-value' => 1])->getAttribute('class'),
        );
        self::assertStringContainsString(
            'vf-radio--checked',
            $this->root('vf-radio', ['value' => 1, 'model-value' => 1])->getAttribute('class'),
        );
    }

    public function testRadioRequiresAValue(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render('vf-radio');
    }

    public function testARealRadioGroupSharesANameAndSelectsOneMember(): void
    {
        $markup = $this->render('vf-radio', ['name' => 'pick', 'value' => 'a', 'model-value' => 'a', 'label' => 'Alpha'])
            . $this->render('vf-radio', ['name' => 'pick', 'value' => 'b', 'model-value' => 'a', 'label' => 'Beta']);

        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' . $markup . '</body></html>',
            LIBXML_NOERROR,
        ));
        $inputs = $document->getElementsByTagName('input');

        self::assertSame(2, $inputs->count());
        self::assertSame('pick', $inputs->item(0)?->getAttribute('name'));
        self::assertSame('pick', $inputs->item(1)?->getAttribute('name'));
        self::assertSame(['a', 'b'], [$inputs->item(0)?->getAttribute('value'), $inputs->item(1)?->getAttribute('value')]);
        self::assertTrue($inputs->item(0)?->hasAttribute('checked'));
        self::assertFalse($inputs->item(1)?->hasAttribute('checked'));
    }

    public function testRadioShipsNoController(): void
    {
        // Grouping is native; a group runtime would re-implement the platform.
        self::assertStringNotContainsString('data-vf-razor', $this->render('vf-radio', ['value' => 'a']));
    }

    // --------------------------------------------------------------- switch

    public function testSwitchIsANativeCheckboxThatCallsItselfASwitch(): void
    {
        $input = $this->root('vf-switch')->getElementsByTagName('input')->item(0);

        self::assertInstanceOf(DOMElement::class, $input);
        self::assertSame('checkbox', $input->getAttribute('type'));
        self::assertSame('switch', $input->getAttribute('role'));
    }

    public function testSwitchCarriesNoAriaCheckedUnlikeTheCheckbox(): void
    {
        self::assertFalse(
            $this->root('vf-switch', ['checked' => true])->getElementsByTagName('input')->item(0)
                ?->hasAttribute('aria-checked'),
        );
    }

    public function testSwitchEmitsItsOwnTwoModifiersInTheReferenceOrder(): void
    {
        self::assertSame(
            'vf-switch vf-switch--sm vf-switch--static vf-switch--thumb-contrast-inverse '
                . 'vf-switch--checked vf-switch--invalid vf-switch--disabled',
            $this->root('vf-switch', [
                'size' => 'sm',
                'static' => true,
                'thumb-contrast' => 'inverse',
                'checked' => true,
                'invalid' => true,
                'disabled' => true,
            ])->getAttribute('class'),
        );
    }

    public function testSwitchEmitsNoContrastModifierWhenAuto(): void
    {
        self::assertSame('vf-switch vf-switch--md', $this->root('vf-switch')->getAttribute('class'));
    }

    public function testSwitchRendersItsThumbSlotInsideTheControl(): void
    {
        $markup = $this->render('vf-switch', [], ['thumb' => '<i class="thumb-probe"></i>']);

        self::assertStringContainsString('<span class="vf-switch__thumb"><i class="thumb-probe"></i></span>', $markup);
    }

    public function testSwitchTreatsAWhitespaceOnlySlotAsNoContent(): void
    {
        self::assertStringNotContainsString('vf-switch__content', $this->render('vf-switch', [], ['default' => '   ']));
        self::assertStringContainsString(
            'vf-switch__content',
            $this->render('vf-switch', [], ['default' => 'On']),
        );
    }

    public function testSwitchShipsNoController(): void
    {
        self::assertStringNotContainsString('data-vf-razor', $this->render('vf-switch', ['checked' => true]));
    }
}
