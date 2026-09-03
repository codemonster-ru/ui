<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\Support\AttributeBag;
use Codemonster\Ui\Support\ClassBuilder;
use Codemonster\Ui\Support\Icons;
use Codemonster\Ui\Support\PropBag;
use Codemonster\View\EngineInterface;
use InvalidArgumentException;

/** Emits generated icon geometry. Nothing here draws; see Support\Icons for why. */
final class CmIcon implements ComponentInterface
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $name = $props->string('icon', '');
        $family = $props->oneOf('family', ['classic', 'duotone'], 'classic');
        $variant = $props->oneOf('variant', ['solid', 'regular', 'light', 'thin'], 'regular');
        $label = $props->nullableString('label');
        $attributes = new AttributeBag($props->remaining());

        $rendering = Icons::resolve($name, $family, $variant);
        if ($rendering === null) {
            throw new InvalidArgumentException("Unknown icon [{$name}].");
        }

        $classes = (new ClassBuilder())
            ->add('cm-icon')
            ->add("cm-icon--{$variant}")
            ->add("cm-icon--{$family}")
            ->add($this->optionalString($attributes->get('class')))
            ->value();

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.icon', [
            'attributes' => $attributes->without(['class'])->render(),
            'body' => $rendering['body'],
            'classes' => $classes,
            'label' => $label,
            'viewBox' => $rendering['viewBox'],
        ]), "\r\n"));
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null || is_string($value)) return $value;
        throw new InvalidArgumentException('Component attribute [class] must be a string.');
    }
}
