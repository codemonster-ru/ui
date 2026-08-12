<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components\Card;

use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\View\EngineInterface;

final class CmCardHeader
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(?string $title, ?RenderedHtml $content): RenderedHtml
    {
        if ($content !== null) {
            return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.card.header', [
                'content' => $content,
                'title' => null,
            ]), "\r\n"));
        }

        if ($title === null || $title === '') {
            return RenderedHtml::empty();
        }

        return RenderedHtml::fromTrustedString(rtrim($this->views->render('components.card.header', [
            'content' => null,
            'title' => $title,
        ]), "\r\n"));
    }
}
