<?php

declare(strict_types=1);

namespace Codemonster\Ui;

use Codemonster\Razor\Components\Contracts\ComponentProviderInterface;
use Codemonster\Ui\Components\CmButton;

final readonly class UiComponentProvider implements ComponentProviderInterface
{
    public function prefix(): string
    {
        return 'cm';
    }

    public function components(): array
    {
        return ['button' => new CmButton()];
    }
}
