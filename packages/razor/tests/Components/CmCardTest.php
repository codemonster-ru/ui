<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmCard;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\TestCase;

final class CmCardTest extends TestCase
{
    private string $cache;

    protected function setUp(): void
    {
        $this->cache = sys_get_temp_dir() . '/codemonster-ui-card-' . bin2hex(random_bytes(6));
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

    public function testRendersOnlyPresentRegionsInContractOrder(): void
    {
        $context = new ComponentRenderContext(
            ['title' => 'Ignored', 'compact' => true, 'element' => 'article'],
            [
                'header' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<h2>Project</h2>'),
                'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<p>Summary</p>'),
                'footer' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Actions'),
            ],
        );

        self::assertSame(
            '<article class="cm-card cm-card--compact"><header class="cm-card__header"><h2>Project</h2></header>'
            . '<div class="cm-card__body"><p>Summary</p></div>'
            . '<footer class="cm-card__footer">Actions</footer></article>',
            $this->card()->render($context)->value(),
        );
    }

    public function testEscapesFallbackTitleAttributesAndConsumerClasses(): void
    {
        $context = new ComponentRenderContext([
            'title' => '<Project>',
            'class' => 'consumer"',
            'data-note' => '"quoted"',
        ], []);

        self::assertSame(
            '<section class="cm-card consumer&quot;" data-note="&quot;quoted&quot;">'
            . '<header class="cm-card__header"><h3 class="cm-card__title">&lt;Project&gt;</h3></header></section>',
            $this->card()->render($context)->value(),
        );
    }

    public function testOmitsEveryAbsentRegion(): void
    {
        self::assertSame('<section class="cm-card"></section>', $this->card()->render(new ComponentRenderContext([], []))->value());
    }

    private function card(): CmCard
    {
        return new CmCard(new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: $this->cache,
        ));
    }
}
