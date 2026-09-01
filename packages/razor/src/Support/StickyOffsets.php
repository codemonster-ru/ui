<?php

declare(strict_types=1);

namespace Codemonster\Ui\Support;

/**
 * The sticky offsets a shell publishes as custom properties.
 *
 * This mirrors shellStickyOffsets in runtime/src/core/shell.ts. The server cannot measure anything,
 * so it always emits the declared-height form; CmShellMetricsController narrows it to the observed
 * height once a browser is involved. That is why the layout is correct before any script runs.
 */
final class StickyOffsets
{
    public static function render(bool $hasHeader, bool $hasSubheader): string
    {
        $header = $hasHeader ? 'var(--cm-layout-header-height)' : '0';
        $subheader = $hasSubheader ? 'var(--cm-layout-subheader-height)' : '0';

        return sprintf(
            '--cm-sticky-header-offset: %s; --cm-sticky-subheader-offset: %s; --cm-sticky-top-offset: calc(%s + %s);',
            $header,
            $subheader,
            $header,
            $subheader,
        );
    }
}
