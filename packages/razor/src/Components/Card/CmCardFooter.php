<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components\Card;

use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\View\EngineInterface;

final class CmCardFooter
{
    public function __construct(private readonly EngineInterface $views)
    {
    }

    public function render(?RenderedHtml $content): RenderedHtml
    {
        return $content === null
            ? RenderedHtml::empty()
            : RenderedHtml::fromTrustedString(rtrim(
                $this->views->render('components.card.footer', ['content' => $content]),
                "\r\n",
            ));
    }
}
