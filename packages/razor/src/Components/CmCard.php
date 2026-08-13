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
use Codemonster\View\EngineInterface;

final class CmCard implements ComponentInterface
{
    public function __construct(
        private readonly EngineInterface $views,
        ?CmCardHeader $header = null,
        ?CmCardBody $body = null,
        ?CmCardFooter $footer = null,
    ) {
        $this->header = $header ?? new CmCardHeader($views);
        $this->body = $body ?? new CmCardBody($views);
        $this->footer = $footer ?? new CmCardFooter($views);
    }

    private readonly CmCardHeader $header;
    private readonly CmCardBody $body;
    private readonly CmCardFooter $footer;

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
        return RenderedHtml::fromTrustedString(
            rtrim($this->views->render('components.card', [
                'element' => $element,
                'classes' => $classes,
                'attributes' => $attributes->without(['class'])->render(),
                'header' => $this->header->render($title, $context->hasSlot('header') ? $context->slot('header') : null),
                'body' => $this->body->render($context->hasSlot('default') ? $context->slot('default') : null),
                'footer' => $this->footer->render($context->hasSlot('footer') ? $context->slot('footer') : null),
            ]), "\r\n"),
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
