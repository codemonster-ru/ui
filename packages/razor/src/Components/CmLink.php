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

final class CmLink implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $href = $props->string('href');
        $underline = $props->oneOf('underline', ['none', 'hover', 'always'], 'none');
        $tone = $props->oneOf('tone', ['default', 'muted'], 'default');
        if (trim($href) === '') throw new InvalidArgumentException('Component prop [href] must be non-empty.');

        $attributes = new AttributeBag($props->remaining());
        $target = $attributes->get('target');
        $rel = $attributes->get('rel');
        if ($target !== null && !is_string($target)) throw new InvalidArgumentException('Component attribute [target] must be a string.');
        if ($rel !== null && !is_string($rel)) throw new InvalidArgumentException('Component attribute [rel] must be a string.');
        $classes = (new ClassBuilder())
            ->add('cm-link')
            ->addWhen($underline !== 'none', "cm-link--underline-{$underline}")
            ->addWhen($tone === 'muted', 'cm-link--muted')
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.link', [
            'href' => $href,
            'classes' => $classes,
            'rel' => $rel ?? ($target === '_blank' ? 'noopener noreferrer' : null),
            'attributes' => $attributes->without(['class', 'href', 'rel'])->render(),
            'content' => $context->slot('default'),
        ]), "\r\n"));
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) return $value;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
