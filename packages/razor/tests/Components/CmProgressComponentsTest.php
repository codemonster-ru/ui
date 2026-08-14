<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmProgressBar;
use Codemonster\Ui\Components\CmProgressSpinner;
use Codemonster\Ui\Tests\Support\SignificantDom;
use Codemonster\View\Locator\DefaultLocator;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CmProgressComponentsTest extends TestCase
{
    #[DataProvider('caseProvider')]
    public function testMatchesCanonicalSignificantDom(string $slug, string $casePath, string $htmlPath): void
    {
        /** @var array{props: array<string, mixed>} $case */
        $case = json_decode((string) file_get_contents($casePath), true, flags: JSON_THROW_ON_ERROR);
        $props = $this->razorProps($case['props']);
        $actual = $this->component($slug)->render(new ComponentRenderContext($props, []))->value();

        self::assertSame(
            SignificantDom::normalize((string) file_get_contents($htmlPath)),
            SignificantDom::normalize($actual),
        );
    }

    public function testNormalizesAndClampsProgressBarNumbers(): void
    {
        $html = $this->component('progress-bar')->render(new ComponentRenderContext([
            'label' => 'Upload progress',
            'value' => 140,
            'max' => 120,
            'show-value' => true,
        ], []))->value();

        self::assertStringContainsString('aria-valuemax="120" aria-valuenow="120"', $html);
        self::assertStringContainsString('style="inline-size: 100%"', $html);
        self::assertStringContainsString('>100%</span>', $html);
    }

    public function testRejectsEmptyAccessibleLabels(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('ProgressSpinner label must be a non-empty string.');
        $this->component('progress-spinner')->render(new ComponentRenderContext(['label' => ' '], []));
    }

    public function testProgressSpinnerOwnsIndeterminateAriaState(): void
    {
        $html = $this->component('progress-spinner')->render(new ComponentRenderContext([
            'label' => 'Loading reports',
            'aria-valuemin' => '0',
            'aria-valuemax' => '100',
            'aria-valuenow' => '50',
        ], []))->value();

        self::assertStringNotContainsString('aria-valuemin', $html);
        self::assertStringNotContainsString('aria-valuemax', $html);
        self::assertStringNotContainsString('aria-valuenow', $html);
    }

    /** @return iterable<string, array{string, string, string}> */
    public static function caseProvider(): iterable
    {
        foreach (['progress-bar', 'progress-spinner'] as $slug) {
            $cases = dirname(__DIR__, 4) . "/contracts/{$slug}/cases";
            foreach (glob($cases . '/*.case.json') ?: [] as $casePath) {
                $basename = substr(basename($casePath), 0, -strlen('.case.json'));
                yield "{$slug}-{$basename}" => [$slug, $casePath, $cases . '/' . $basename . '.html'];
            }
        }
    }

    /** @param array<string, mixed> $props
     *  @return array<string, mixed>
     */
    private function razorProps(array $props): array
    {
        foreach (['showValue' => 'show-value'] as $camel => $kebab) {
            if (!array_key_exists($camel, $props)) continue;
            $props[$kebab] = $props[$camel];
            unset($props[$camel]);
        }
        return $props;
    }

    private function component(string $slug): CmProgressBar|CmProgressSpinner
    {
        $views = new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: sys_get_temp_dir() . '/codemonster-ui-progress-' . bin2hex(random_bytes(6)),
        );

        return match ($slug) {
            'progress-bar' => new CmProgressBar($views),
            'progress-spinner' => new CmProgressSpinner($views),
            default => throw new InvalidArgumentException("Unknown progress component [{$slug}]."),
        };
    }
}
