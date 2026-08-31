<?php

declare(strict_types=1);

namespace Codemonster\Ui\Layouts;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\Support\AttributeBag;
use Codemonster\Ui\Support\ClassBuilder;
use Codemonster\Ui\Support\PropBag;
use Codemonster\View\EngineInterface;
use InvalidArgumentException;

/**
 * Enter and Escape belong to the runtime controller, which asks the shared core whether the focused
 * control needs those keys itself. This side renders the panel a server can know.
 */
final class CmSetupLayout implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $asidePosition = $props->oneOf('asidePosition', ['left', 'right'], 'right');
        $titleProp = $props->nullableString('title');
        $descriptionProp = $props->nullableString('description');
        $props->bool('keyboardNavigation', true);
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-setup-layout')
            ->addWhen($asidePosition !== 'right', "cm-setup-layout--aside-{$asidePosition}")
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        $title = $context->hasSlot('title') ? $context->slot('title') : $titleProp;
        $description = $context->hasSlot('description') ? $context->slot('description') : $descriptionProp;

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('layouts.setup-layout', [
            'classes' => $classes,
            'title' => $title,
            'description' => $description,
            'hasHeader' => $title !== null || $description !== null,
            'brand' => $context->hasSlot('brand') ? $context->slot('brand') : null,
            'toolbar' => $context->hasSlot('toolbar') ? $context->slot('toolbar') : null,
            'aside' => $context->hasSlot('aside') ? $context->slot('aside') : null,
            'actions' => $context->hasSlot('actions') ? $context->slot('actions') : null,
            'footer' => $context->hasSlot('footer') ? $context->slot('footer') : null,
            'content' => $context->slot('default'),
            'attributes' => $attributes->without(['class', 'data-cm-controller'])->render(),
        ]), "\r\n"));
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) {
            return $value;
        }

        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
