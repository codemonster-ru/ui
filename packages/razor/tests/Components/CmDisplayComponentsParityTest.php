<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmAlert;
use Codemonster\Ui\Components\CmAvatar;
use Codemonster\Ui\Components\CmBadge;
use Codemonster\Ui\Components\CmDivider;
use Codemonster\Ui\Components\CmSkeleton;
use Codemonster\Ui\Tests\Support\SignificantDom;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CmDisplayComponentsParityTest extends TestCase
{
    #[DataProvider('caseProvider')]
    public function testMatchesCanonicalSignificantDom(string $slug, string $casePath, string $htmlPath): void
    {
        /** @var array{props: array<string, mixed>, slots: array<string, string>, attributes?: array<string, mixed>} $case */
        $case = json_decode((string) file_get_contents($casePath), true, flags: JSON_THROW_ON_ERROR);
        $props = [...$case['props'], ...($case['attributes'] ?? [])];
        if (isset($props['imageAlt'])) {
            $props['image-alt'] = $props['imageAlt'];
            unset($props['imageAlt']);
        }
        if (isset($props['minHeight'])) {
            $props['min-height'] = $props['minHeight'];
            unset($props['minHeight']);
        }
        $slots = [];
        foreach ($case['slots'] as $name => $content) {
            $slots[$name] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($content);
        }

        $actual = $this->component($slug)->render(new ComponentRenderContext($props, $slots))->value();
        self::assertSame(SignificantDom::normalize((string) file_get_contents($htmlPath)), SignificantDom::normalize($actual));
    }

    /** @return iterable<string, array{string, string, string}> */
    public static function caseProvider(): iterable
    {
        foreach (['alert', 'avatar', 'badge', 'divider', 'skeleton'] as $slug) {
            $cases = dirname(__DIR__, 4) . "/contracts/{$slug}/cases";
            foreach (glob($cases . '/*.case.json') ?: [] as $casePath) {
                $basename = substr(basename($casePath), 0, -strlen('.case.json'));
                yield "{$slug}-{$basename}" => [$slug, $casePath, $cases . '/' . $basename . '.html'];
            }
        }
    }

    private function component(string $slug): CmAlert|CmAvatar|CmBadge|CmDivider|CmSkeleton
    {
        $views = new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: sys_get_temp_dir() . '/codemonster-ui-display-parity-' . bin2hex(random_bytes(6)),
        );
        return match ($slug) {
            'alert' => new CmAlert($views),
            'avatar' => new CmAvatar($views),
            'badge' => new CmBadge($views),
            'divider' => new CmDivider($views),
            'skeleton' => new CmSkeleton($views),
            default => throw new \InvalidArgumentException("Unknown display component [{$slug}]."),
        };
    }
}
