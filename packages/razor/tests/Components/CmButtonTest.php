<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmButton;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\TestCase;

final class CmButtonTest extends TestCase
{
    private string $cache;

    protected function setUp(): void
    {
        $this->cache = sys_get_temp_dir() . '/codemonster-ui-button-' . bin2hex(random_bytes(6));
    }

    protected function tearDown(): void
    {
        foreach (glob($this->cache . '/*') ?: [] as $file) {
            unlink($file);
        }

        if (is_dir($this->cache)) {
            rmdir($this->cache);
        }
    }

    public function testRendersContractDefaults(): void
    {
        $button = $this->button();
        $context = new ComponentRenderContext(
            [],
            ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Save')],
        );

        self::assertSame(
            '<button class="cm-button cm-button--primary cm-button--md" type="button">'
            . '<span class="cm-button__label">Save</span></button>',
            $button->render($context)->value(),
        );
    }

    public function testRendersConfigurationAndSafeConsumerAttributes(): void
    {
        $button = $this->button();
        $context = new ComponentRenderContext([
            'variant' => 'danger',
            'size' => 'lg',
            'type' => 'submit',
            'disabled' => true,
            'class' => 'consumer cm-button',
            'data-id' => '"save"',
        ], []);

        self::assertSame(
            '<button class="cm-button cm-button--danger cm-button--lg consumer" type="submit" disabled'
            . ' data-id="&quot;save&quot;"><span class="cm-button__label"></span></button>',
            $button->render($context)->value(),
        );
    }

    public function testRendersLoadingAndIconSlots(): void
    {
        $context = new ComponentRenderContext(
            ['loading' => true],
            [
                'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Save'),
                'leading' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<i>Lead</i>'),
                'trailing' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<i>Trail</i>'),
            ],
        );

        $html = $this->button()->render($context)->value();

        self::assertStringContainsString('type="button" disabled aria-busy="true"', $html);
        self::assertStringContainsString('<span class="cm-button__spinner" aria-hidden="true"></span>', $html);
        self::assertStringNotContainsString('cm-button__leading', $html);
        self::assertStringContainsString('<span class="cm-button__trailing"><i>Trail</i></span>', $html);
    }

    public function testRendersEnabledAndDisabledLinks(): void
    {
        $slot = ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Docs')];
        $enabled = $this->button()->render(new ComponentRenderContext(['href' => '/docs'], $slot))->value();
        $disabled = $this->button()->render(new ComponentRenderContext([
            'href' => '/docs',
            'disabled' => true,
            'aria-disabled' => 'false',
        ], $slot))->value();

        self::assertStringContainsString('<a class="cm-button cm-button--primary cm-button--md" href="/docs">', $enabled);
        self::assertStringContainsString('role="link" aria-disabled="true"', $disabled);
        self::assertStringNotContainsString('href=', $disabled);
        self::assertSame(1, substr_count($disabled, 'aria-disabled='));
    }

    private function button(): CmButton
    {
        return new CmButton(new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: $this->cache,
        ));
    }
}
