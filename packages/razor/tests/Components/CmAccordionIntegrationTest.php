<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\UiComponentProvider;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\TestCase;

final class CmAccordionIntegrationTest extends TestCase
{
    private string $root;
    private string $views;
    private string $cache;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/codemonster-ui-accordion-integration-' . bin2hex(random_bytes(6));
        $this->views = $this->root . '/views';
        $this->cache = $this->root . '/cache';
        mkdir($this->views, 0775, true);
        file_put_contents($this->views . '/accordion.razor.php', <<<'RAZOR'
<cm-accordion id="faq" :items="$items" :default-open-items="$open" class="consumer">
    <razor-slot name="triggerAccount">Account <small>recommended</small></razor-slot>
    <razor-slot name="panelAccount"><p>Manage your <a href="/account">account</a>.</p></razor-slot>
</cm-accordion>
RAZOR);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->root);
    }

    public function testRendersDataDrivenMarkupReadyForSharedRuntime(): void
    {
        $html = $this->engine()->render('accordion', [
            'items' => [
                ['id' => 'account', 'title' => '<Account>', 'content' => '<Account answer>'],
                ['id' => 'billing', 'title' => 'Billing', 'content' => 'Billing answer', 'disabled' => true],
            ],
            'open' => ['account', 'billing'],
        ]);

        self::assertStringContainsString('class="cm-accordion consumer" data-cm-controller="accordion"', $html);
        self::assertStringContainsString('data-cm-accordion-item="account"', $html);
        self::assertStringContainsString('aria-expanded="true" aria-controls="faq-account-panel"', $html);
        self::assertStringContainsString('aria-expanded="false" aria-controls="faq-billing-panel" disabled', $html);
        self::assertStringContainsString('<small>recommended</small>', $html);
        self::assertStringContainsString('<a href="/account">account</a>', $html);
        self::assertStringNotContainsString('<Account>', $html);
    }

    private function engine(): RazorEngine
    {
        $components = new ComponentRegistry();
        $components->register(new UiComponentProvider());

        return new RazorEngine(new DefaultLocator($this->views), cachePath: $this->cache, components: $components);
    }

    private function removeDirectory(string $directory): void
    {
        if (!is_dir($directory)) {
            return;
        }

        foreach (scandir($directory) ?: [] as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }

            $path = $directory . '/' . $entry;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }

        rmdir($directory);
    }
}
