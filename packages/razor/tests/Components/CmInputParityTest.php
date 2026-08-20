<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmInput;
use Codemonster\Ui\Tests\Support\SignificantDom;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CmInputParityTest extends TestCase
{
    private string $cache;

    protected function setUp(): void
    {
        $this->cache = sys_get_temp_dir() . '/codemonster-ui-input-parity-' . bin2hex(random_bytes(6));
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

    #[DataProvider('caseProvider')]
    public function testMatchesCanonicalAccessibleDom(string $casePath, string $htmlPath): void
    {
        /** @var array{props: array<string, mixed>, attributes?: array<string, mixed>, slots: array<string, string>} $case */
        $case = json_decode((string) file_get_contents($casePath), true, flags: JSON_THROW_ON_ERROR);
        $props = [...$case['props'], ...($case['attributes'] ?? [])];
        foreach ([
            'passwordReveal' => 'password-reveal',
            'clearLabel' => 'clear-label',
            'showPasswordLabel' => 'show-password-label',
            'hidePasswordLabel' => 'hide-password-label',
        ] as $source => $target) {
            if (array_key_exists($source, $props)) {
                $props[$target] = $props[$source];
                unset($props[$source]);
            }
        }
        $slots = [];
        foreach ($case['slots'] as $name => $content) {
            $slots[$name] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($content);
        }
        $actual = $this->input()->render(new ComponentRenderContext($props, $slots))->value();
        $expected = (string) file_get_contents($htmlPath);

        self::assertSame(SignificantDom::normalize($expected), SignificantDom::normalize($actual));
    }

    /** @return iterable<string, array{string, string}> */
    public static function caseProvider(): iterable
    {
        $cases = dirname(__DIR__, 4) . '/contracts/input/cases';
        foreach (glob($cases . '/*.case.json') ?: [] as $casePath) {
            $basename = substr(basename($casePath), 0, -strlen('.case.json'));
            yield $basename => [$casePath, $cases . '/' . $basename . '.html'];
        }
    }

    private function input(): CmInput
    {
        return new CmInput(new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: $this->cache,
        ));
    }
}
