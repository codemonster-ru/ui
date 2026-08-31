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
 * Layouts live in their own namespace because a layout is not a component: it composes them into a
 * page shell. The npm side is a separate package for the same reason.
 *
 * State is rendered as attributes on the root, which is what lets this adapter carry it at all —
 * the Vue layouts previously handed it to slots as a scope, and PHP has no equivalent.
 */
final class CmAdminLayout implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $id = $props->string('id');

        if (trim($id) === '') {
            throw new InvalidArgumentException('AdminLayout id must be a non-empty string.');
        }

        $mobileOpen = $props->bool('mobileSidebarOpen');
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-admin-layout')
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        $hasBrand = $context->hasSlot('brand');
        $hasAsideContent = $context->hasSlot('aside');
        $hasAside = $hasBrand || $hasAsideContent;

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('layouts.admin-layout', [
            'id' => $id,
            'classes' => $classes,
            'sidebarCollapsed' => $props->bool('sidebarCollapsed') ? 'true' : 'false',
            'mobileSidebarOpen' => $mobileOpen ? 'true' : 'false',
            'toggleLabel' => $mobileOpen
                ? $props->string('mobileSidebarCloseLabel', 'Close navigation')
                : $props->string('mobileSidebarOpenLabel', 'Open navigation'),
            'hasAside' => $hasAside,
            'brand' => $hasBrand ? $context->slot('brand') : null,
            'aside' => $hasAsideContent ? $context->slot('aside') : null,
            'header' => $context->hasSlot('header') ? $context->slot('header') : null,
            'mobileBrand' => $context->hasSlot('mobileBrand') ? $context->slot('mobileBrand') : null,
            'mobileToggle' => $context->hasSlot('mobileToggle') ? $context->slot('mobileToggle') : null,
            'footer' => $context->hasSlot('footer') ? $context->slot('footer') : null,
            'content' => $context->slot('default'),
            'attributes' => $attributes
                ->without(['class', 'data-cm-controller', 'data-cm-sidebar-collapsed', 'data-cm-mobile-sidebar-open'])
                ->render(),
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
