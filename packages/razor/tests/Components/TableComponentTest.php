<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\TableComponent;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfTable.
 *
 * The assertions mirror
 * packages/core/src/components/table/VfTable.characterization.spec.ts. The two
 * template tests at the end are the engine limit the component docblock
 * records, executed rather than described: through the PHP API a slot's
 * absence is explicit; a template invocation with only named slots declares a
 * whitespace default slot, and the body section opens for it.
 */
final class TableComponentTest extends TestCase
{
    private const HEADER = '<tr><th>Name</th><th>Role</th></tr>';
    private const BODY = '<tr><td>Ada</td><td>Admin</td></tr>';
    private const FOOTER = '<tr><td colspan="2">1 member</td></tr>';

    /**
     * @param array<string, mixed> $props
     * @param array<string, \Closure(): RenderedHtml> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-table');
        self::assertNotNull($component, 'The vf-table component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    private static function slot(string $markup): \Closure
    {
        return static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    private function renderTemplate(string $template): string
    {
        $engine = new \Codemonster\Razor\RazorEngine(
            new \Codemonster\View\Locator\DefaultLocator([sys_get_temp_dir()]),
            'razor.php',
            sys_get_temp_dir() . '/vueforge-table-template-test-cache',
            (static function (): ComponentRegistry {
                $registry = new ComponentRegistry();
                $registry->register(new VueForgeRazorProvider());
                return $registry;
            })(),
        );
        $name = 'vueforge-table-template-' . bin2hex(random_bytes(4));
        $path = sys_get_temp_dir() . '/' . $name . '.razor.php';
        file_put_contents($path, $template);

        try {
            return $engine->render($name, []);
        } finally {
            @unlink($path);
        }
    }

    public function testTheProviderRegistersTheTable(): void
    {
        $components = (new VueForgeRazorProvider())->components();

        self::assertInstanceOf(TableComponent::class, $components['table']);
        self::assertCount(34, $components);
    }

    public function testItRendersTwoWrappersAroundAnEmptyTable(): void
    {
        self::assertSame(
            '<div class="vf-table-wrap"><div class="vf-table-scroll"><table class="vf-table"></table></div></div>',
            $this->render(),
        );
    }

    public function testItRendersCaptionHeadBodyAndFootInThatOrder(): void
    {
        self::assertSame(
            '<div class="vf-table-wrap"><div class="vf-table-scroll"><table class="vf-table">'
            . '<caption class="vf-table__caption">Members</caption>'
            . '<thead class="vf-table__head">' . self::HEADER . '</thead>'
            . '<tbody class="vf-table__body">' . self::BODY . '</tbody>'
            . '<tfoot class="vf-table__foot">' . self::FOOTER . '</tfoot>'
            . '</table></div></div>',
            $this->render(['caption' => 'Members'], [
                'footer' => self::slot(self::FOOTER),
                'default' => self::slot(self::BODY),
                'header' => self::slot(self::HEADER),
            ]),
        );
    }

    public function testConsumerAttributesLandOnTheWrapperAndNowhereElse(): void
    {
        $markup = $this->render([
            'class' => 'consumer',
            'style' => 'max-height: 12rem',
            'id' => 'members',
            'data-testid' => 'table',
            'aria-label' => 'Members',
            'role' => 'region',
            'tabindex' => '0',
            'striped' => true,
        ]);

        self::assertSame(
            '<div class="vf-table-wrap consumer" id="members" data-testid="table" aria-label="Members" role="region" tabindex="0" style="max-height: 12rem">'
            . '<div class="vf-table-scroll"><table class="vf-table vf-table--striped"></table></div></div>',
            $markup,
        );
    }

    public function testTheCaptionFollowsJavaScriptTruthinessAndItsSlotWins(): void
    {
        self::assertStringNotContainsString('<caption', $this->render(['caption' => '']));
        self::assertStringContainsString('<caption class="vf-table__caption">0</caption>', $this->render(['caption' => '0']));
        self::assertStringContainsString(
            '<caption class="vf-table__caption"><strong>Slot</strong></caption>',
            $this->render(['caption' => 'Prop'], ['caption' => self::slot('<strong>Slot</strong>')]),
        );
        self::assertStringContainsString(
            '<caption class="vf-table__caption">Slot only</caption>',
            $this->render([], ['caption' => self::slot('Slot only')]),
        );
    }

    public function testAnEmptyCaptionSlotFallsBackToTheProp(): void
    {
        self::assertStringContainsString(
            '<caption class="vf-table__caption">Fallback</caption>',
            $this->render(['caption' => 'Fallback'], ['caption' => self::slot(' ')]),
        );
        self::assertStringContainsString(
            '<caption class="vf-table__caption"></caption>',
            $this->render([], ['caption' => self::slot('')]),
        );
    }

    public function testEachSectionIsKeyedOnThePresenceOfItsSlot(): void
    {
        self::assertSame(
            '<div class="vf-table-wrap"><div class="vf-table-scroll"><table class="vf-table">'
            . '<thead class="vf-table__head"></thead><tbody class="vf-table__body"></tbody><tfoot class="vf-table__foot"></tfoot>'
            . '</table></div></div>',
            $this->render([], ['header' => self::slot(''), 'default' => self::slot(''), 'footer' => self::slot('')]),
        );
        self::assertStringNotContainsString(
            '<tbody',
            $this->render([], ['header' => self::slot(self::HEADER), 'footer' => self::slot(self::FOOTER)]),
        );
    }

    public function testTheModifiersAreTableClassesInTheirFixedOrder(): void
    {
        self::assertStringContainsString(
            '<table class="vf-table vf-table--column-dividers vf-table--compact vf-table--striped vf-table--sticky-header">',
            $this->render(['sticky-header' => true, 'striped' => true, 'compact' => true, 'column-dividers' => true]),
        );
        self::assertStringContainsString(
            '<table class="vf-table vf-table--column-dividers vf-table--sticky-header">',
            $this->render(['columnDividers' => true, 'stickyHeader' => 'true']),
        );
        self::assertStringStartsWith('<div class="vf-table-wrap">', $this->render(['compact' => true]));
        self::assertStringContainsString('<table class="vf-table">', $this->render(['compact' => 'false']));
    }

    public function testItRendersNoInlineStyleIdOrInteractiveElementOfItsOwn(): void
    {
        $markup = $this->render(['caption' => 'C', 'sticky-header' => true], [
            'header' => self::slot(self::HEADER),
            'default' => self::slot(self::BODY),
        ]);

        foreach (['style=', 'id=', 'tabindex', 'role=', '<button', 'data-vf-razor', 'vf-data-table'] as $forbidden) {
            self::assertStringNotContainsString($forbidden, $markup);
        }
    }

    public function testItEscapesAHostileCaption(): void
    {
        self::assertStringContainsString('&lt;i&gt;x&lt;/i&gt;', $this->render(['caption' => '<i>x</i>']));
    }

    public function testItRejectsANonScalarAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['data-x' => ['nested']]);
    }

    public function testATemplateWithBodyRowsRendersEveryNamedSection(): void
    {
        $markup = $this->renderTemplate(
            '<vf-table caption="Members" :striped="true"><razor-slot name="header">' . self::HEADER . '</razor-slot>'
            . self::BODY . '<razor-slot name="footer">' . self::FOOTER . '</razor-slot></vf-table>',
        );

        self::assertStringContainsString('<thead class="vf-table__head">' . self::HEADER . '</thead>', $markup);
        self::assertStringContainsString('<tbody class="vf-table__body">' . self::BODY . '</tbody>', $markup);
        self::assertStringContainsString('<tfoot class="vf-table__foot">' . self::FOOTER . '</tfoot>', $markup);
    }

    public function testATemplateWithOnlyNamedSlotsDeclaresTheDefaultSlotAndOpensAnEmptyBody(): void
    {
        // The engine limit (plan section У.8): any content declares the default
        // slot. Vue would render no tbody here; this records that a template
        // cannot express its absence, so the parity fixture uses the PHP API.
        $markup = $this->renderTemplate(
            '<vf-table><razor-slot name="header">' . self::HEADER . '</razor-slot></vf-table>',
        );

        self::assertMatchesRegularExpression('#<tbody class="vf-table__body">\s*</tbody>#', $markup);
    }
}
