<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\UiComponentProvider;
use Codemonster\View\Locator\DefaultLocator;
use DOMDocument;
use DOMElement;
use PHPUnit\Framework\TestCase;

final class CmFormComponentsTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/codemonster-ui-form-components-' . bin2hex(random_bytes(6));
        mkdir($this->root . '/views', 0775, true);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->root);
    }

    public function testRendersRegisteredTagsWithNativeFormSemantics(): void
    {
        file_put_contents($this->root . '/views/form.razor.php', <<<'RAZOR'
<form><cm-checkbox name="topics" value="releases" checked>Releases</cm-checkbox><cm-radio name="frequency" value="daily" checked label="Daily" /><cm-radio name="frequency" value="weekly" label="Weekly" /><cm-switch name="theme" value="dark" checked>Dark mode</cm-switch><cm-textarea name="notes" :value="$notes" rows="4" /></form>
RAZOR);
        $html = $this->engine()->render('form', ['notes' => "First\nSecond"]);
        $document = new DOMDocument();
        $document->loadHTML($html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        $form = $document->getElementsByTagName('form')->item(0);

        self::assertInstanceOf(DOMElement::class, $form);
        self::assertSame(
            ['topics' => 'releases', 'frequency' => 'daily', 'theme' => 'dark', 'notes' => "First\nSecond"],
            $this->successfulValues($form),
        );
        self::assertSame(4, $form->getElementsByTagName('input')->length, 'Components must not add hidden fallback inputs.');
    }

    public function testEscapesFallbackContentValuesAndAttributes(): void
    {
        file_put_contents($this->root . '/views/escaping.razor.php', <<<'RAZOR'
<cm-checkbox :label="$label" :value="$value" :name="$name" /><cm-textarea :value="$label" />
RAZOR);
        $html = $this->engine()->render('escaping', [
            'label' => '<script>unsafe</script>',
            'value' => '"><img src=x>',
            'name' => '"quoted"',
        ]);

        self::assertStringContainsString('&lt;script&gt;unsafe&lt;/script&gt;', $html);
        self::assertStringContainsString('value="&quot;&gt;&lt;img src=x&gt;"', $html);
        self::assertStringContainsString('name="&quot;quoted&quot;"', $html);
        self::assertStringNotContainsString('<script>', $html);
    }

    /** @return array<string, string> */
    private function successfulValues(DOMElement $form): array
    {
        $values = [];
        foreach ($form->getElementsByTagName('input') as $input) {
            $name = $input->getAttribute('name');
            if ($name === '' || $input->hasAttribute('disabled')) continue;
            $type = strtolower($input->getAttribute('type'));
            if (in_array($type, ['checkbox', 'radio'], true) && !$input->hasAttribute('checked')) continue;
            $values[$name] = $input->getAttribute('value');
        }
        foreach ($form->getElementsByTagName('textarea') as $textarea) {
            $name = $textarea->getAttribute('name');
            if ($name === '' || $textarea->hasAttribute('disabled')) continue;
            $values[$name] = $textarea->textContent;
        }
        return $values;
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
