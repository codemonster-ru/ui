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

/** A frame with no state: regions and nothing else, so there is nothing here to keep in step. */
final class CmAdminShell implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-admin-shell')
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        $brand = $context->hasSlot('brand') ? $context->slot('brand') : null;
        $header = $context->hasSlot('header') ? $context->slot('header') : null;
        $headerActions = $context->hasSlot('headerActions') ? $context->slot('headerActions') : null;

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('layouts.admin-shell', [
            'classes' => $classes,
            'hasTopbar' => $brand !== null || $header !== null || $headerActions !== null,
            'brand' => $brand,
            'header' => $header,
            'headerActions' => $headerActions,
            'sidebar' => $context->hasSlot('sidebar') ? $context->slot('sidebar') : null,
            'footer' => $context->hasSlot('footer') ? $context->slot('footer') : null,
            'content' => $context->slot('default'),
            'attributes' => $attributes->without(['class'])->render(),
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
