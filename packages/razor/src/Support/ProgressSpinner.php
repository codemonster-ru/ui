<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * The loading spinner VfButton composes.
 *
 * Not a migrated component and not registered as a `vf-` tag: VfProgressSpinner
 * has its own public Vue API that nothing has characterized, and claiming to
 * have ported it would be claiming more than M12 proved. What is here is only
 * the markup VfButton's loading state renders, matching the reference exactly.
 *
 * The spinner is deliberately not decorative. The reference gives it
 * role=progressbar and an accessible name, so a loading button announces both
 * its label and that it is loading; only the artwork inside is hidden.
 *
 * @internal
 */
final class ProgressSpinner
{
    /**
     * @param string $size CSS length for the spinner box, or null to inherit.
     * @param array<int, string> $extraClasses Classes the composing component adds.
     */
    public static function render(
        ?string $size = null,
        int $strokeWidth = 4,
        string $label = 'Loading',
        array $extraClasses = [],
    ): string {
        // Vue merges a parent-supplied class onto the component root after its
        // own, so the canonical class comes first here too.
        $classes = Html::classes(['vf-progress-spinner', ...$extraClasses]);

        return '<span' . Html::attributes([
            'class' => $classes,
            'style' => $size === null ? null : '--vf-progress-spinner-size: ' . $size . ';',
            'role' => 'progressbar',
            'aria-label' => $label,
        ]) . '>'
            . '<svg class="vf-progress-spinner__svg" viewBox="0 0 50 50" aria-hidden="true" focusable="false">'
            . '<circle class="vf-progress-spinner__track" cx="25" cy="25" r="20" fill="none" stroke-width="'
            . Html::escape((string) $strokeWidth) . '"></circle>'
            . '<circle class="vf-progress-spinner__value" cx="25" cy="25" r="20" fill="none" stroke-width="'
            . Html::escape((string) $strokeWidth) . '"></circle>'
            . '</svg>'
            . '</span>';
    }
}
