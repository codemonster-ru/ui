<?php

declare(strict_types=1);

namespace Codemonster\Ui\Layouts;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\Support\AttributeBag;
use Codemonster\Ui\Support\ClassBuilder;
use Codemonster\Ui\Support\PropBag;
use Codemonster\Ui\Support\StickyOffsets;
use Codemonster\View\EngineInterface;
use InvalidArgumentException;

/**
 * An application frame whose sidebar state is an attribute rather than a scoped slot, because PHP
 * has no scoped slots. The collapse control is marked rather than wired: an application tags its own
 * button and CmAppShellController listens for it.
 */
final class CmAppShell implements ComponentInterface
{
    private const VARIANTS = ['content', 'sidebar-content', 'sidebar-content-aside'];

    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $layout = $props->oneOf('layout', self::VARIANTS, 'sidebar-content-aside');
        $sidebarCollapsed = $props->bool('sidebarCollapsed', false);
        $stickyHeader = $props->bool('stickyHeader', false);
        $attributes = new AttributeBag($props->remaining());

        $header = $context->hasSlot('header') ? $context->slot('header') : null;
        $subheader = $context->hasSlot('subheader') ? $context->slot('subheader') : null;
        $sidebar = $layout !== 'content' && $context->hasSlot('sidebar') ? $context->slot('sidebar') : null;
        $aside = $layout === 'sidebar-content-aside' && $context->hasSlot('aside') ? $context->slot('aside') : null;

        $classes = (new ClassBuilder())
            ->add('cm-app-shell')
            ->add("cm-app-shell--{$layout}")
            ->addWhen($stickyHeader, 'cm-app-shell--header-sticky')
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('layouts.app-shell', [
            'classes' => $classes,
            'style' => StickyOffsets::render($header !== null, $subheader !== null),
            'sidebarCollapsed' => $sidebarCollapsed ? 'true' : 'false',
            'header' => $header,
            'subheader' => $subheader,
            'sidebar' => $sidebar,
            'aside' => $aside,
            'footer' => $context->hasSlot('footer') ? $context->slot('footer') : null,
            'content' => $context->slot('default'),
            'attributes' => $attributes->without(['class'])->render(),
        ]), "\r\n"));
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) return $value;
        throw new InvalidArgumentException('Layout attribute [class] must be a string.');
    }
}
