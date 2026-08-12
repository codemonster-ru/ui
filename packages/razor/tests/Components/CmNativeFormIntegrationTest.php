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

final class CmNativeFormIntegrationTest extends TestCase
{
    private string $root;
    private string $views;
    private string $cache;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/codemonster-ui-native-form-' . bin2hex(random_bytes(6));
        $this->views = $this->root . '/views';
        $this->cache = $this->root . '/cache';
        mkdir($this->views, 0775, true);
        file_put_contents($this->views . '/form.razor.php', <<<'RAZOR'
<form method="post" action="{{ $action }}"><cm-input name="enabled" :value="$enabled" /><cm-input name="disabled" value="ignored" disabled /><cm-input name="reference" value="fixed" readonly /><cm-button type="submit">Save</cm-button></form>
RAZOR);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->root);
    }

    public function testRendersSafeNativeSuccessfulControls(): void
    {
        $dangerousValue = '"><script>unsafe</script>';
        $html = $this->engine()->render('form', [
            'action' => '"><unsafe>',
            'enabled' => $dangerousValue,
        ]);
        $document = new DOMDocument();
        $document->loadHTML($html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        $forms = $document->getElementsByTagName('form');
        $form = $forms->item(0);

        self::assertInstanceOf(DOMElement::class, $form);
        self::assertSame('post', $form->getAttribute('method'));
        self::assertSame('"><unsafe>', $form->getAttribute('action'));
        self::assertCount(0, $document->getElementsByTagName('script'));
        self::assertSame(
            ['enabled' => $dangerousValue, 'reference' => 'fixed'],
            $this->successfulInputValues($form),
        );

        $buttons = $form->getElementsByTagName('button');
        self::assertSame(1, $buttons->length);
        self::assertSame('submit', $buttons->item(0)?->attributes->getNamedItem('type')?->nodeValue);
    }

    /** @return array<string, string> */
    private function successfulInputValues(DOMElement $form): array
    {
        $values = [];

        foreach ($form->getElementsByTagName('input') as $input) {
            $name = $input->getAttribute('name');
            if ($name === '' || $input->hasAttribute('disabled')) {
                continue;
            }

            $values[$name] = $input->getAttribute('value');
        }

        return $values;
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
