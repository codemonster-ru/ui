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
            . "<span class=\"cm-button__label\">Save</span></button>\n",
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
            . " data-id=\"&quot;save&quot;\"><span class=\"cm-button__label\"></span></button>\n",
            $button->render($context)->value(),
        );
    }

    private function button(): CmButton
    {
        return new CmButton(new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: $this->cache,
        ));
    }
}
