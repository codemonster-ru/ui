<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\Support\AttributeBag;
use Codemonster\Ui\Support\ClassBuilder;
use Codemonster\Ui\Support\CommandPaletteItems;
use Codemonster\Ui\Support\PropBag;
use Codemonster\View\EngineInterface;
use InvalidArgumentException;

final class CmCommandPalette implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views) {}

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $id = $props->string('id');
        $title = $props->string('title');
        $commands = CommandPaletteItems::normalize($props->array('commands'));
        $open = $props->bool('open');
        $query = $props->string('query');
        $placeholder = $props->string('placeholder', 'Search commands');
        $emptyText = $props->string('empty-text', 'No commands found.');
        $closeLabel = $props->string('close-label', 'Close');
        if (trim($id) === '' || trim($title) === '' || trim($placeholder) === '' || trim($emptyText) === '' || trim($closeLabel) === '') {
            throw new InvalidArgumentException('CommandPalette text props must be non-empty strings.');
        }
        $activeAssigned = false;
        $visibleCount = 0;
        $renderCommands = [];
        foreach ($commands as $command) {
            $haystack = $command['label'] . ' ' . ($command['keywords'] ?? '');
            $visible = trim($query) === '' || preg_match('/' . preg_quote(trim($query), '/') . '/iu', $haystack) === 1;
            $active = $visible && !$command['disabled'] && !$activeAssigned;
            $activeAssigned = $activeAssigned || $active;
            $visibleCount += $visible ? 1 : 0;
            $renderCommands[] = [...$command, 'visible' => $visible, 'active' => $active];
        }
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())->add('cm-command-palette')->addWhen($open, 'cm-command-palette--open')
            ->add($this->optionalString($attributes->get('class')))->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.command-palette', [
            'id' => $id, 'title' => $title, 'commands' => $renderCommands, 'open' => $open, 'query' => $query,
            'placeholder' => $placeholder, 'emptyText' => $emptyText, 'closeLabel' => $closeLabel,
            'activeId' => $this->activeId($renderCommands), 'empty' => $visibleCount === 0, 'classes' => $classes,
            'attributes' => $attributes->without(['class', 'id', 'open', 'aria-labelledby', 'data-cm-controller', 'data-cm-command-palette-state'])->render(),
        ]), "\r\n"));
    }

    /** @param list<array{id: string, label: string, keywords: ?string, disabled: bool, visible: bool, active: bool}> $commands */
    private function activeId(array $commands): ?string
    {
        foreach ($commands as $command) if ($command['active']) return $command['id'];
        return null;
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) return $value;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
