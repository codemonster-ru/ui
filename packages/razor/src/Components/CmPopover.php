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

final class CmPopover implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $id = $props->string('id');
        $label = $props->string('label');
        $open = $props->bool('open');
        $disabled = $props->bool('disabled');
        $placement = $props->oneOf('placement', ['top', 'bottom-start', 'bottom-end'], 'bottom-start');
        if (trim($id) === '' || trim($label) === '') {
            throw new InvalidArgumentException('Popover id and label must be non-empty strings.');
        }
        $open = $open && !$disabled;
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-popover')
            ->addWhen($placement !== 'bottom-start', "cm-popover--{$placement}")
            ->addWhen($open, 'cm-popover--open')
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.popover', [
            'id' => $id,
            'label' => $label,
            'open' => $open,
            'disabled' => $disabled,
            'content' => $context->slot('default'),
            'classes' => $classes,
            'attributes' => $attributes->without(['class', 'data-cm-controller'])->render(),
        ]), "\r\n"));
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) return $value;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
