<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmInput;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\TestCase;

final class CmInputTest extends TestCase
{
    public function testRendersOneNativeInputWithContractState(): void
    {
        $context = new ComponentRenderContext([
            'value' => 'team@example.com',
            'type' => 'email',
            'size' => 'lg',
            'invalid' => true,
            'required' => true,
            'class' => 'consumer cm-input',
            'name' => 'email',
        ], []);

        self::assertSame(
            '<input class="cm-input cm-input--lg cm-input--invalid consumer" type="email"'
            . ' value="team@example.com" required aria-invalid="true" name="email">',
            $this->input()->render($context)->value(),
        );
    }

    public function testRendersDisabledAndReadonlyAsNativeAttributes(): void
    {
        $context = new ComponentRenderContext([
            'disabled' => true,
            'readonly' => true,
            'aria-invalid' => 'false',
        ], []);

        self::assertSame(
            '<input class="cm-input cm-input--md" type="text" value="" disabled readonly>',
            $this->input()->render($context)->value(),
        );
    }

    public function testRendersSharedAdornmentAndActionMarkup(): void
    {
        $context = new ComponentRenderContext([
            'value' => 'secret',
            'type' => 'password',
            'clearable' => true,
            'passwordReveal' => true,
        ], [
            'leading' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<span>@</span>'),
            'trailing' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<span>required</span>'),
        ]);

        $html = $this->input()->render($context)->value();

        self::assertStringContainsString('<div class="cm-input-wrap" data-cm-controller="input">', $html);
        self::assertStringContainsString('<span class="cm-input__leading"><span>@</span></span>', $html);
        self::assertStringContainsString('data-cm-input-password', $html);
        self::assertStringContainsString('data-cm-input-clear', $html);
    }

    private function input(): CmInput
    {
        return new CmInput(new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: sys_get_temp_dir() . '/codemonster-ui-input-' . bin2hex(random_bytes(6)),
        ));
    }
}
