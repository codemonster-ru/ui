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

final readonly class CmProgressSpinner implements ComponentInterface
{
    public function __construct(private EngineInterface $views) {}

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $label = $props->string('label');
        if (trim($label) === '') throw new InvalidArgumentException('ProgressSpinner label must be a non-empty string.');
        $size = $props->oneOf('size', ['sm', 'md', 'lg'], 'md');
        $tone = $props->oneOf(
            'tone',
            ['neutral', 'primary', 'success', 'info', 'warning', 'help', 'danger', 'contrast'],
            'primary',
        );
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-progress-spinner', "cm-progress-spinner--{$size}")
            ->addWhen($tone !== 'primary', "cm-progress-spinner--{$tone}")
            ->add($this->className($attributes))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.progress-spinner', [
            'label' => $label,
            'classes' => $classes,
            'attributes' => $attributes->without([
                'class', 'role', 'aria-label', 'aria-valuemin', 'aria-valuemax', 'aria-valuenow',
            ])->render(),
        ]), "\r\n"));
    }

    private function className(AttributeBag $attributes): ?string
    {
        $class = $attributes->get('class');
        if ($class === null || is_string($class)) return $class;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
