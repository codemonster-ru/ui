<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\UiComponentProvider;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\TestCase;

final class CmNavigationComponentsTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/codemonster-ui-navigation-' . bin2hex(random_bytes(6));
        mkdir($this->root . '/views', 0775, true);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->root);
    }

    public function testRendersRegisteredNavigationTagsAndRuntimeMarkers(): void
    {
        file_put_contents($this->root . '/views/navigation.razor.php', <<<'RAZOR'
<cm-link href="/account">Account</cm-link><cm-breadcrumbs :items="$breadcrumbs" /><cm-tabs id="settings" :items="$tabs" /><cm-menu :items="$menu" /><cm-dropdown id="actions" label="Actions" :items="$menu" />
RAZOR);
        $html = $this->engine()->render('navigation', [
            'breadcrumbs' => [['label' => 'Home', 'href' => '/'], ['label' => 'Current']],
            'tabs' => [['value' => 'general', 'label' => 'General', 'content' => 'Settings.']],
            'menu' => [['id' => 'edit', 'label' => 'Edit']],
        ]);

        self::assertStringContainsString('<a class="cm-link" href="/account">Account</a>', $html);
        self::assertStringContainsString('class="cm-breadcrumbs" aria-label="Breadcrumb"', $html);
        self::assertStringContainsString('data-cm-controller="tabs"', $html);
        self::assertStringContainsString('data-cm-controller="menu"', $html);
        self::assertStringContainsString('data-cm-controller="dropdown"', $html);
    }

    public function testEscapesNavigationValuesAndPreservesTrustedSeparatorSlot(): void
    {
        file_put_contents($this->root . '/views/escaping.razor.php', <<<'RAZOR'
<cm-link :href="$href">{{ $label }}</cm-link><cm-breadcrumbs :items="$items"><razor-slot name="separator"><strong>›</strong></razor-slot></cm-breadcrumbs>
RAZOR);
        $html = $this->engine()->render('escaping', [
            'href' => '"><script>unsafe</script>',
            'label' => '<Unsafe>',
            'items' => [['label' => '<Home>', 'href' => '/'], ['label' => '<Current>']],
        ]);

        self::assertStringContainsString('href="&quot;&gt;&lt;script&gt;unsafe&lt;/script&gt;"', $html);
        self::assertStringContainsString('&lt;Unsafe&gt;', $html);
        self::assertStringContainsString('&lt;Home&gt;', $html);
        self::assertStringContainsString('<strong>›</strong>', $html);
        self::assertStringNotContainsString('<script>', $html);
    }

    private function engine(): RazorEngine
    {
        $components = new ComponentRegistry();
        $components->register(new UiComponentProvider());
        return new RazorEngine(new DefaultLocator($this->root . '/views'), cachePath: $this->root . '/cache', components: $components);
    }

    private function removeDirectory(string $directory): void
    {
        if (!is_dir($directory)) return;
        foreach (scandir($directory) ?: [] as $entry) {
            if ($entry === '.' || $entry === '..') continue;
            $path = $directory . '/' . $entry;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }
        rmdir($directory);
    }
}
