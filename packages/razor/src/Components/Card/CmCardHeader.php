<?php

declare(strict_types=1);

namespace Codemonster\Ui\Components\Card;

use Codemonster\Razor\Components\RenderedHtml;

final class CmCardHeader
{
    public function render(?string $title, ?RenderedHtml $content): RenderedHtml
    {
        if ($content !== null) {
            return RenderedHtml::fromTrustedString(
                '<header class="cm-card__header">' . $content->value() . '</header>',
            );
        }

        if ($title === null || $title === '') {
            return RenderedHtml::empty();
        }

        return RenderedHtml::fromTrustedString(
            '<header class="cm-card__header"><h3 class="cm-card__title">'
            . htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
            . '</h3></header>',
        );
    }
}
