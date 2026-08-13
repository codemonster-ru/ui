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

final class CmTooltip implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $id = $props->string('id');
        $label = $props->string('label');
        $content = $props->string('content');
        $visible = $props->bool('default-visible');
        $placement = $props->oneOf('placement', ['top', 'bottom', 'start', 'end'], 'top');
        $delay = $props->oneOf('delay', ['none', 'short', 'long'], 'short');
        if (trim($id) === '' || trim($label) === '' || trim($content) === '') {
            throw new InvalidArgumentException('Tooltip id, label, and content must be non-empty strings.');
        }
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-tooltip', "cm-tooltip--{$placement}", "cm-tooltip--delay-{$delay}")
            ->addWhen($visible, 'cm-tooltip--visible')
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.tooltip', [
            'id' => $id,
            'label' => $label,
            'content' => $content,
            'visible' => $visible,
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
