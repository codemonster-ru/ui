<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\VueForge\Razor\Components\InputComponent;
use DOMDocument;
use DOMElement;
use DOMXPath;
use PHPUnit\Framework\TestCase;

/**
 * The no-JavaScript contract.
 *
 * Server output must be a usable, submittable native control on its own. These
 * tests assert what a visitor gets before any controller runs, including the
 * deliberate decisions: enhanced actions are present but inert, and the
 * floating-label composition degrades to the plain one.
 */
final class InputNoJavaScriptTest extends TestCase
{
    /** @param array<string, mixed> $props */
    private function xpath(array $props): DOMXPath
    {
        $markup = (new InputComponent())->render(new ComponentRenderContext($props, []))->value();
        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><form>' . $markup . '</form></body></html>',
            LIBXML_NOERROR,
        ));

        return new DOMXPath($document);
    }

    private function input(DOMXPath $xpath): DOMElement
    {
        $node = $xpath->query('//input')->item(0);
        self::assertInstanceOf(DOMElement::class, $node);

        return $node;
    }

    public function testTheControlIsARealSubmittableInput(): void
    {
        $input = $this->input($this->xpath(['name' => 'workspace', 'value' => 'Acme']));

        self::assertSame('input', $input->tagName);
        self::assertSame('workspace', $input->getAttribute('name'), 'A nameless control cannot be submitted.');
        self::assertSame('Acme', $input->getAttribute('value'));
        self::assertFalse($input->hasAttribute('disabled'), 'Nothing may disable the control by default.');
        self::assertFalse($input->hasAttribute('hidden'));
    }

    public function testTheControlDoesNotDependOnScriptToExist(): void
    {
        $markup = (new InputComponent())->render(
            new ComponentRenderContext(['name' => 'q', 'clearable' => true, 'value' => 'x'], []),
        )->value();

        self::assertStringNotContainsString('<script', $markup, 'Markup must not carry inline script.');
        self::assertStringContainsString('<input', $markup, 'The control must exist without enhancement.');
    }

    public function testAPasswordStaysProtectedWithoutJavaScript(): void
    {
        $xpath = $this->xpath([
            'type' => 'password',
            'name' => 'password',
            'value' => 'secret',
            'password-reveal' => true,
        ]);

        self::assertSame('password', $this->input($xpath)->getAttribute('type'));
    }

    public function testEnhancedActionsAreInertAndUnreachableBeforeBootstrap(): void
    {
        $xpath = $this->xpath([
            'type' => 'password',
            'value' => 'secret',
            'clearable' => true,
            'password-reveal' => true,
        ]);

        $buttons = $xpath->query('//button');
        self::assertSame(2, $buttons->length);

        foreach ($buttons as $button) {
            self::assertInstanceOf(DOMElement::class, $button);
            // Hidden keeps it out of the layout; disabled keeps it out of the
            // tab order. Neither offers an action that cannot work yet.
            self::assertTrue($button->hasAttribute('hidden'));
            self::assertTrue($button->hasAttribute('disabled'));
            self::assertSame('button', $button->getAttribute('type'), 'An action must never submit the form.');
        }
    }

    public function testNativeValidationAttributesSurvive(): void
    {
        $input = $this->input($this->xpath([
            'name' => 'seats',
            'type' => 'number',
            'required' => true,
            'min' => '1',
            'max' => '99',
            'step' => '1',
        ]));

        self::assertTrue($input->hasAttribute('required'));
        self::assertSame('number', $input->getAttribute('type'));
        self::assertSame('1', $input->getAttribute('min'));
        self::assertSame('99', $input->getAttribute('max'));
        self::assertSame('1', $input->getAttribute('step'));
    }

    public function testDisabledAndReadonlyRemainNativeSemantics(): void
    {
        self::assertTrue($this->input($this->xpath(['disabled' => true]))->hasAttribute('disabled'));
        self::assertTrue($this->input($this->xpath(['readonly' => true]))->hasAttribute('readonly'));
    }

    public function testLabelRelationshipSurvivesWithoutJavaScript(): void
    {
        $input = $this->input($this->xpath(['id' => 'workspace', 'aria-describedby' => 'workspace-hint']));

        self::assertSame('workspace', $input->getAttribute('id'), 'A label needs a stable id to point at.');
        self::assertSame('workspace-hint', $input->getAttribute('aria-describedby'));
    }

    public function testTheDesignedFloatingFallbackIsPlainComposition(): void
    {
        // Floating labels need a filled-state signal that only the controller
        // can maintain. Before enhancement the control renders without any
        // floating class, which is the designed fallback rather than an
        // accident: a static page shows an ordinary labelled field.
        $xpath = $this->xpath(['value' => 'Acme', 'leading-icon' => 'eye']);
        $wrapper = $xpath->query('//div')->item(0);
        self::assertInstanceOf(DOMElement::class, $wrapper);

        self::assertStringNotContainsString('vf-input-wrap--floating', $wrapper->getAttribute('class'));
        self::assertStringNotContainsString('vf-input--floating', $this->input($xpath)->getAttribute('class'));
        // The filled signal itself is server-rendered, so the controller only
        // has to keep it in step rather than discover it.
        self::assertSame('true', $this->input($xpath)->getAttribute('data-vf-filled'));
    }
}
