<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmAccordion;
use Codemonster\View\Locator\DefaultLocator;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class CmAccordionTest extends TestCase
{
    public function testRendersCanonicalSingleModeState(): void
    {
        $html = $this->accordion()->render(new ComponentRenderContext([
            'id' => 'faq',
            'items' => $this->items(),
            'default-open-items' => ['account'],
        ], []))->value();

        self::assertStringContainsString('class="cm-accordion" data-cm-controller="accordion"', $html);
        self::assertStringContainsString('data-cm-accordion-item="account"', $html);
        self::assertStringContainsString('id="faq-account-trigger" type="button" aria-expanded="true"', $html);
        self::assertStringContainsString('id="faq-account-panel" role="region" aria-labelledby="faq-account-trigger"', $html);
        self::assertStringContainsString('aria-expanded="false" aria-controls="faq-billing-panel"', $html);
        self::assertStringContainsString('id="faq-billing-panel" role="region" aria-labelledby="faq-billing-trigger" hidden', $html);
    }

    public function testNormalizesMultipleOpenItemsAndEscapesContent(): void
    {
        $items = $this->items();
        $items[1]['title'] = '<Billing>';
        $html = $this->accordion()->render(new ComponentRenderContext([
            'id' => 'faq',
            'items' => $items,
            'multiple' => true,
            'open-items' => ['unknown', 'billing', 'account'],
            'title' => '"unsafe"',
        ], []))->value();

        self::assertStringContainsString('data-cm-accordion-multiple="true" title="&quot;unsafe&quot;"', $html);
        self::assertSame(2, substr_count($html, 'aria-expanded="true"'));
        self::assertStringContainsString('&lt;Billing&gt;', $html);
        self::assertStringNotContainsString('<Billing>', $html);
    }

    public function testRejectsDuplicateItemIds(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('duplicate id');

        $this->accordion()->render(new ComponentRenderContext([
            'id' => 'faq',
            'items' => [$this->items()[0], $this->items()[0]],
        ], []));
    }

    public function testComposesTrustedPerItemSlotsAndEscapesFallbacks(): void
    {
        $items = $this->items();
        $items[1]['content'] = '<Billing answer>';
        $html = $this->accordion()->render(new ComponentRenderContext(
            ['id' => 'faq', 'items' => $items, 'default-open-items' => ['account']],
            [
                'triggerAccount' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString(
                    '<span>Account <small>recommended</small></span>',
                ),
                'panelAccount' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString(
                    '<p>Manage your <a href="/account">account</a>.</p>',
                ),
            ],
        ))->value();

        self::assertStringContainsString('<small>recommended</small>', $html);
        self::assertStringContainsString('<a href="/account">account</a>', $html);
        self::assertStringContainsString('&lt;Billing answer&gt;', $html);
        self::assertStringNotContainsString('<Billing answer>', $html);
    }

    /** @return list<array{id: string, title: string, content: string}> */
    private function items(): array
    {
        return [
            ['id' => 'account', 'title' => 'Account', 'content' => 'Account answer.'],
            ['id' => 'billing', 'title' => 'Billing', 'content' => 'Billing answer.'],
        ];
    }

    private function accordion(): CmAccordion
    {
        return new CmAccordion(new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: sys_get_temp_dir() . '/codemonster-ui-accordion-' . bin2hex(random_bytes(6)),
        ));
    }
}
