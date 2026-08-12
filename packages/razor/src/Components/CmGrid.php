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

final readonly class CmGrid implements ComponentInterface
{
    public function __construct(private EngineInterface $views) {}

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $element = $props->oneOf('element', ['div', 'section', 'ul', 'ol'], 'div');
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())->add('cm-grid')->add($this->className($attributes))->value();
        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.layout-primitive', [
            'element' => $element, 'classes' => $classes, 'attributes' => $attributes->without(['class'])->render(),
            'content' => $context->slot('default'),
        ]), "\r\n"));
    }

    private function className(AttributeBag $attributes): ?string
    {
        $class = $attributes->get('class');
        if ($class === null || is_string($class)) return $class;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
