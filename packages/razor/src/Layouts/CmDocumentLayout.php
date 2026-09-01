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
 * A reading frame with no state of its own. The only thing it computes is where content sticks, and
 * that is a declared height here: the server cannot measure, so it emits the form a browser can
 * later narrow.
 */
final class CmDocumentLayout implements ComponentInterface
{
    private const VARIANTS = ['content', 'sidebar-content', 'sidebar-content-aside'];

    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $layout = $props->oneOf('layout', self::VARIANTS, 'sidebar-content-aside');
        $attributes = new AttributeBag($props->remaining());

        $header = $context->hasSlot('header') ? $context->slot('header') : null;
        $subheader = $context->hasSlot('subheader') ? $context->slot('subheader') : null;

        $classes = (new ClassBuilder())
            ->add('cm-document-layout')
            ->add("cm-document-layout--{$layout}")
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('layouts.document-layout', [
            'classes' => $classes,
            'style' => StickyOffsets::render($header !== null, $subheader !== null),
            'header' => $header,
            'subheader' => $subheader,
            'sidebar' => $layout !== 'content' && $context->hasSlot('sidebar') ? $context->slot('sidebar') : null,
            'aside' => $layout === 'sidebar-content-aside' && $context->hasSlot('aside') ? $context->slot('aside') : null,
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
