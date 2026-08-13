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

final readonly class CmTable implements ComponentInterface
{
    public function __construct(private EngineInterface $views) {}

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $caption = $props->string('caption');
        $density = $props->oneOf('density', ['default', 'compact'], 'default');
        $striped = $props->bool('striped');
        $columnDividers = $props->bool('column-dividers');
        $stickyHeader = $props->bool('sticky-header');
        $attributes = new AttributeBag($props->remaining());
        $rootClasses = (new ClassBuilder())->add('cm-table-wrap')->add($this->className($attributes))->value();
        $tableClasses = (new ClassBuilder())->add('cm-table')
            ->addWhen($density === 'compact', 'cm-table--compact')->addWhen($striped, 'cm-table--striped')
            ->addWhen($columnDividers, 'cm-table--column-dividers')->addWhen($stickyHeader, 'cm-table--sticky-header')
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.table', [
            'rootClasses' => $rootClasses,
            'tableClasses' => $tableClasses,
            'attributes' => $attributes->without(['class'])->render(),
            'caption' => $context->hasSlot('caption') ? $context->slot('caption') : $caption,
            'header' => $context->hasSlot('header') ? $context->slot('header') : null,
            'body' => $context->hasSlot('default') ? $context->slot('default') : null,
            'footer' => $context->hasSlot('footer') ? $context->slot('footer') : null,
        ]), "\r\n"));
    }

    private function className(AttributeBag $attributes): ?string
    {
        $class = $attributes->get('class');
        if ($class === null || is_string($class)) return $class;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
