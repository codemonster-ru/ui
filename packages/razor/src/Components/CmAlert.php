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

final class CmAlert implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $tone = $props->oneOf('tone', ['neutral', 'primary', 'success', 'info', 'warning', 'help', 'danger', 'contrast'], 'info');
        $title = $props->nullableString('title');
        $attributes = new AttributeBag($props->remaining());
        $role = $attributes->get('role') ?? 'status';
        if (!is_string($role)) throw new InvalidArgumentException('Component attribute [role] must be a string.');
        $classes = (new ClassBuilder())
            ->add('cm-alert')
            ->addWhen($tone !== 'info', "cm-alert--{$tone}")
            ->add($this->className($attributes))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.alert', [
            'classes' => $classes,
            'role' => $role,
            'attributes' => $attributes->without(['class', 'role'])->render(),
            'icon' => $context->hasSlot('icon') ? $context->slot('icon') : null,
            'title' => $context->hasSlot('title') ? $context->slot('title') : $title,
            'body' => $context->slot('default'),
        ]), "\r\n"));
    }

    private function className(AttributeBag $attributes): ?string
    {
        $class = $attributes->get('class');
        if ($class === null || is_string($class)) return $class;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
