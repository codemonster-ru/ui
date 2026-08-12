<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components\Card;

use Codemonster\Razor\Components\RenderedHtml;

final class CmCardFooter
{
    public function render(?RenderedHtml $content): RenderedHtml
    {
        return $content === null
            ? RenderedHtml::empty()
            : RenderedHtml::fromTrustedString('<footer class="cm-card__footer">' . $content->value() . '</footer>');
    }
}
