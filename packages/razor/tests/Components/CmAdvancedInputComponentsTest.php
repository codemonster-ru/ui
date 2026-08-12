<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\UiComponentProvider;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\TestCase;

final class CmAdvancedInputComponentsTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/codemonster-ui-advanced-input-' . bin2hex(random_bytes(6));
        mkdir($this->root . '/views', 0775, true);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->root);
    }

    public function testRendersNativeFormControlsAndCommandRuntimeMarkup(): void
    {
        file_put_contents($this->root . '/views/inputs.razor.php', <<<'RAZOR'
<form><cm-select name="status" aria-label="Status" :options="$options" value="draft" /><cm-date-picker name="date" aria-label="Date" value="2026-08-13" /><cm-command-palette id="commands" title="Commands" :commands="$commands" /></form>
RAZOR);
        $html = $this->engine()->render('inputs', [
            'options' => [['value' => 'draft', 'label' => 'Draft']],
            'commands' => [['id' => 'open', 'label' => 'Open']],
        ]);
        self::assertStringContainsString('<select class="cm-select cm-select--md" name="status" aria-label="Status">', $html);
        self::assertStringContainsString('type="date" value="2026-08-13"', $html);
        self::assertStringContainsString('data-cm-controller="command-palette"', $html);
    }

    public function testEscapesOptionAndCommandValues(): void
    {
        file_put_contents($this->root . '/views/escaping.razor.php', <<<'RAZOR'
<cm-select aria-label="Select" :options="$options" /><cm-command-palette id="commands" title="Commands" :commands="$commands" />
RAZOR);
        $html = $this->engine()->render('escaping', [
            'options' => [['value' => '"><script>', 'label' => '<Option>']],
            'commands' => [['id' => 'unsafe', 'label' => '<Command>', 'keywords' => '"><script>']],
        ]);
        self::assertStringContainsString('&lt;Option&gt;', $html);
        self::assertStringContainsString('&lt;Command&gt;', $html);
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
