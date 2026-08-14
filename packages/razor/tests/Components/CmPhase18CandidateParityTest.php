<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmFieldset;
use Codemonster\Ui\Components\CmIconButton;
use Codemonster\Ui\Components\CmProgressBar;
use Codemonster\Ui\Components\CmProgressSpinner;
use Codemonster\Ui\Tests\Support\SignificantDom;
use Codemonster\View\Locator\DefaultLocator;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CmPhase18CandidateParityTest extends TestCase
{
    private string $cache;

    protected function setUp(): void
    {
        $this->cache = sys_get_temp_dir() . '/codemonster-ui-phase-18-parity-' . bin2hex(random_bytes(6));
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
    public function testMatchesCanonicalSignificantDom(string $component, string $casePath, string $htmlPath): void
    {
        /** @var array{props: array<string, mixed>, slots: array<string, string>} $case */
        $case = json_decode((string) file_get_contents($casePath), true, flags: JSON_THROW_ON_ERROR);
        $slots = [];

        foreach ($case['slots'] as $name => $content) {
            $slots[$name] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($content);
        }

        $actual = $this->component($component)->render(new ComponentRenderContext($case['props'], $slots))->value();
        $expected = (string) file_get_contents($htmlPath);

        self::assertSame(SignificantDom::normalize($expected), SignificantDom::normalize($actual));
    }

    /** @return iterable<string, array{string, string, string}> */
    public static function caseProvider(): iterable
    {
        $contracts = dirname(__DIR__, 4) . '/contracts';

        foreach (['fieldset', 'icon-button', 'progress-bar', 'progress-spinner'] as $component) {
            $cases = "{$contracts}/{$component}/cases";
            foreach (glob($cases . '/*.case.json') ?: [] as $casePath) {
                $basename = substr(basename($casePath), 0, -strlen('.case.json'));
                yield "{$component}:{$basename}" => [$component, $casePath, $cases . '/' . $basename . '.html'];
            }
        }
    }

    private function component(string $component): ComponentInterface
    {
        $views = new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: $this->cache,
        );

        return match ($component) {
            'fieldset' => new CmFieldset($views),
            'icon-button' => new CmIconButton($views),
            'progress-bar' => new CmProgressBar($views),
            'progress-spinner' => new CmProgressSpinner($views),
            default => throw new InvalidArgumentException("Unknown parity component [{$component}]."),
        };
    }
}
