<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\Components\Card\CmCardBody;
use Codemonster\Ui\Components\Card\CmCardFooter;
use Codemonster\Ui\Components\Card\CmCardHeader;
use Codemonster\Ui\Support\AttributeBag;
use Codemonster\Ui\Support\ClassBuilder;
use Codemonster\Ui\Support\PropBag;

final readonly class CmCard implements ComponentInterface
{
    public function __construct(
        private CmCardHeader $header = new CmCardHeader(),
        private CmCardBody $body = new CmCardBody(),
        private CmCardFooter $footer = new CmCardFooter(),
    ) {
    }

    public function render(ComponentRenderContext $context): RenderedHtml
    {
        $props = new PropBag($context->props());
        $element = $props->oneOf('element', ['section', 'article', 'div'], 'section');
        $title = $props->nullableString('title');
        $compact = $props->bool('compact');
        $attributes = new AttributeBag($props->remaining());
        $classes = (new ClassBuilder())
            ->add('cm-card')
            ->addWhen($compact, 'cm-card--compact')
            ->add($this->optionalString($attributes->get('class')))
            ->value();
        $escapedClasses = htmlspecialchars($classes, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $content = $this->header->render($title, $context->hasSlot('header') ? $context->slot('header') : null)->value()
            . $this->body->render($context->hasSlot('default') ? $context->slot('default') : null)->value()
            . $this->footer->render($context->hasSlot('footer') ? $context->slot('footer') : null)->value();

        return RenderedHtml::fromTrustedString(
            '<' . $element . ' class="' . $escapedClasses . '"'
            . $attributes->without(['class'])->render() . '>' . $content . '</' . $element . '>',
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
