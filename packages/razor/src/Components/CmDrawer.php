<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\Support\AttributeBag;
use Codemonster\Ui\Support\ClassBuilder;
use Codemonster\Ui\Support\PropBag;
use Codemonster\View\EngineInterface;
use InvalidArgumentException;

final class CmDrawer implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $id = $props->string('id');
        $title = $props->string('title');
        $description = $props->nullableString('description');
        $open = $props->bool('open');
        $side = $props->oneOf('side', ['start', 'end'], 'end');
        $closeLabel = $props->string('close-label', 'Close');
        if (trim($id) === '' || trim($title) === '' || trim($closeLabel) === '') {
            throw new InvalidArgumentException('Drawer id, title, and close-label must be non-empty strings.');
        }
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-drawer', "cm-drawer--{$side}")
            ->addWhen($open, 'cm-drawer--open')
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.drawer', [
            'id' => $id,
            'title' => $title,
            'description' => $description,
            'open' => $open,
            'closeLabel' => $closeLabel,
            'body' => $context->slot('default'),
            'footer' => $context->hasSlot('footer') ? $context->slot('footer') : null,
            'classes' => $classes,
            'attributes' => $attributes->without(['class', 'id', 'open', 'aria-labelledby', 'aria-describedby', 'data-cm-controller', 'data-cm-drawer-state'])->render(),
        ]), "\r\n"));
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) return $value;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
