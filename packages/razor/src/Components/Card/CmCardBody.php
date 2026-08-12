<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components\Card;

use Codemonster\Razor\Components\RenderedHtml;

final class CmCardBody
{
    public function render(?RenderedHtml $content): RenderedHtml
    {
        return $content === null
            ? RenderedHtml::empty()
            : RenderedHtml::fromTrustedString('<div class="cm-card__body">' . $content->value() . '</div>');
    }
}
