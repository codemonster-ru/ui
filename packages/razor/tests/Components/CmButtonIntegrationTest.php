<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\UiComponentProvider;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\TestCase;

final class CmButtonIntegrationTest extends TestCase
{
    private string $root;
    private string $views;
    private string $cache;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/codemonster-ui-integration-' . bin2hex(random_bytes(6));
        $this->views = $this->root . '/views';
        $this->cache = $this->root . '/cache';
        mkdir($this->views, 0775, true);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->root);
    }

    public function testEscapesPropsAttributesAndSlotTextAcrossTheRazorBoundary(): void
    {
        $this->template(
            'button-security',
            '<cm-button :href="$href" class="consumer&quot;&lt;" data-note="&quot;note&lt;">{{ $label }}</cm-button>',
        );

        $html = $this->engine()->render('button-security', [
            'href' => '/docs?next="><script>alert(1)</script>',
            'label' => '<img src=x onerror=alert(1)>',
        ]);

        self::assertStringContainsString('href="/docs?next=&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"', $html);
        self::assertStringContainsString('data-note="&quot;note&lt;"', $html);
        self::assertStringContainsString('&lt;img src=x onerror=alert(1)&gt;', $html);
        self::assertStringNotContainsString('<script>', $html);
        self::assertStringNotContainsString('<img', $html);
    }

    public function testRendersAuthoritativeLoadingAccessibilityState(): void
    {
        $this->template('button-loading', '<cm-button loading>Save</cm-button>');

        $html = $this->engine()->render('button-loading');

        self::assertStringContainsString('<button', $html);
        self::assertStringContainsString(' disabled', $html);
        self::assertStringContainsString('aria-busy="true"', $html);
        self::assertStringContainsString('class="cm-button__spinner" aria-hidden="true"', $html);
        self::assertStringContainsString('class="cm-button__spinner-track"', $html);
        self::assertStringContainsString('class="cm-button__spinner-value"', $html);
        self::assertStringContainsString('<span class="cm-button__label">Save</span>', $html);
    }

    public function testRendersDisabledLinkWithoutNavigation(): void
    {
        $this->template('button-disabled-link', '<cm-button href="/docs" disabled>Docs</cm-button>');

        $html = $this->engine()->render('button-disabled-link');

        self::assertStringStartsWith('<a ', $html);
        self::assertStringContainsString('role="link"', $html);
        self::assertStringContainsString('aria-disabled="true"', $html);
        self::assertStringNotContainsString('href=', $html);
        self::assertStringNotContainsString(' disabled', $html);
    }

    private function engine(): RazorEngine
    {
        $components = new ComponentRegistry();
        $components->register(new UiComponentProvider());

        return new RazorEngine(new DefaultLocator($this->views), cachePath: $this->cache, components: $components);
    }

    private function template(string $name, string $contents): void
    {
        file_put_contents($this->views . '/' . $name . '.razor.php', $contents);
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
