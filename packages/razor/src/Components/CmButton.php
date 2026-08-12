<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\Support\AttributeBag;
use Codemonster\Ui\Support\ClassBuilder;
use Codemonster\Ui\Support\PropBag;

final class CmButton implements ComponentInterface
{
    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $variant = $props->oneOf('variant', ['primary', 'secondary', 'danger', 'ghost'], 'primary');
        $size = $props->oneOf('size', ['sm', 'md', 'lg'], 'md');
        $type = $props->oneOf('type', ['button', 'submit', 'reset'], 'button');
        $disabled = $props->bool('disabled');
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-button', "cm-button--{$variant}", "cm-button--{$size}")
            ->add($this->optionalString($attributes->get('class')))
            ->value();
        $rootAttributes = $attributes->without(['class'])->render();
        $disabledAttribute = $disabled ? ' disabled' : '';
        $escapedClasses = htmlspecialchars($classes, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        return RenderedHtml::fromTrustedString(
            '<button class="' . $escapedClasses . '" type="' . $type . '"'
            . $disabledAttribute . $rootAttributes . '><span class="cm-button__label">'
            . $context->slot('default')->value() . '</span></button>',
        );
    }

    private function optionalString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (!is_string($value)) {
            throw new \InvalidArgumentException('Component attribute [class] must be a string.');
        }

        return $value;
    }
}
