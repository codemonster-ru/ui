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

final class CmDropdown implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $id = $props->string('id');
        $label = $props->string('label');
        $items = $props->array('items');
        $open = $props->bool('open');
        $disabled = $props->bool('disabled');
        $placement = $props->oneOf('placement', ['bottom-start', 'bottom-end'], 'bottom-start');
        if (trim($id) === '' || trim($label) === '') {
            throw new InvalidArgumentException('Dropdown id and label must be non-empty strings.');
        }
        $open = $open && !$disabled;
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-dropdown')
            ->addWhen($placement === 'bottom-end', 'cm-dropdown--bottom-end')
            ->addWhen($open, 'cm-dropdown--open')
            ->add($this->optionalString($attributes->get('class')))
            ->value();
        $menu = (new CmMenu($this->views))->render(new ComponentRenderContext([
            'id' => "{$id}-menu",
            'class' => 'cm-dropdown__menu',
            'items' => $items,
            'aria-labelledby' => "{$id}-trigger",
            'hidden' => !$open,
        ], []));

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.dropdown', [
            'id' => $id,
            'label' => $label,
            'open' => $open,
            'disabled' => $disabled,
            'menu' => $menu,
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
