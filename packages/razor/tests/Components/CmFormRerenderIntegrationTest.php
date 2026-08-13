<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\UiComponentProvider;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\TestCase;

final class CmFormRerenderIntegrationTest extends TestCase
{
    private string $root;
    private string $views;
    private string $cache;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/codemonster-ui-form-rerender-' . bin2hex(random_bytes(6));
        $this->views = $this->root . '/views';
        $this->cache = $this->root . '/cache';
        mkdir($this->views, 0775, true);
        file_put_contents($this->views . '/form.razor.php', <<<'RAZOR'
<form method="post"><cm-field control-id="email" label="Email" :error="$errors['email'] ?? null"><cm-input id="email" name="email" type="email" :value="$submitted['email'] ?? ''" :invalid="isset($errors['email'])" :aria-describedby="isset($errors['email']) ? 'email-error' : null" /></cm-field></form>
RAZOR);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->root);
    }

    public function testPreservesSubmittedValueAndAssociatesServerError(): void
    {
        $html = $this->engine()->render('form', [
            'submitted' => ['email' => '"><script>unsafe</script>'],
            'errors' => ['email' => '<Invalid address>'],
        ]);

        self::assertStringContainsString('class="cm-field cm-field--invalid"', $html);
        self::assertStringContainsString('type="email"', $html);
        self::assertStringContainsString('name="email"', $html);
        self::assertStringContainsString('value="&quot;&gt;&lt;script&gt;unsafe&lt;/script&gt;"', $html);
        self::assertStringContainsString('aria-invalid="true"', $html);
        self::assertStringContainsString('aria-describedby="email-error"', $html);
        self::assertStringContainsString(
            '<p class="cm-field__error" id="email-error">&lt;Invalid address&gt;</p>',
            $html,
        );
        self::assertStringNotContainsString('<script>', $html);
        self::assertStringNotContainsString('<Invalid address>', $html);
    }

    public function testInitialRenderKeepsNativeNameWithoutValidationState(): void
    {
        $html = $this->engine()->render('form', ['submitted' => [], 'errors' => []]);

        self::assertStringContainsString('type="email" value=""', $html);
        self::assertStringContainsString('name="email"', $html);
        self::assertStringNotContainsString('cm-field--invalid', $html);
        self::assertStringNotContainsString('aria-invalid', $html);
        self::assertStringNotContainsString('aria-describedby', $html);
        self::assertStringNotContainsString('cm-field__error', $html);
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
