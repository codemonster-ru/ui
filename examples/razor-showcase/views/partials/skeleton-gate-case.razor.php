{{-- One shared case for VfSkeletonGate.

     Its own partial rather than a branch in m16-case: the gate is the only
     migrated component that renders another migrated component, and folding it
     in beside the three M16 leaves would put the composition contract in a file
     whose whole purpose is components that compose nothing.

     The engine collects named slots when it compiles, so a slot wrapped in @if
     would still be declared - the same constraint the Input, Button and Card
     partials work around by repeating the tag. The gate's two slots differ in
     what their absence means, and only one of them matters here:

       - the default slot renders inside a wrapper that exists either way, so
         declaring it empty and declaring it absent produce the same markup;
       - the skeleton slot is the one that counts. Absent, the gate renders the
         canonical vf-skeleton; present, it replaces it. So the tag is repeated
         once per answer to that question, and nothing else.

     Showcase fixture only. Nothing here is product implementation: the state
     modifiers, the reserve precedence, the attribute merging and the forwarding
     to the child all live in the component. The button in the content slot is a
     real consumer control, written the way any consumer would write it - the
     gate owns no interaction, and what is in its slots is the consumer's. --}}
@php
    $shapeMarkup = static function (?array $slot): string {
        if ($slot === null) {
            return '';
        }

        $markup = '';
        if (isset($slot['text']) && $slot['text'] !== '') {
            $markup .= htmlspecialchars((string) $slot['text'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        }

        $shape = $slot['markup'] ?? null;
        if ($shape === 'paragraphs') {
            $markup .= '<p>Storage, seats and outbound transfer.</p><p>Updated hourly.</p>';
        }
        if ($shape === 'article') {
            $markup .= '<h4>Billing period</h4>'
                . '<p>Storage, seats and outbound transfer for the current period.</p>'
                . '<ul><li>Storage: 42 GB</li><li>Seats: 12</li></ul>';
        }
        if ($shape === 'bars') {
            $markup .= '<div class="parity-bar" style="height: 12px; background: #ccc"></div>'
                . '<div class="parity-bar" style="height: 12px; background: #ccc; margin-top: 6px"></div>';
        }
        if (isset($slot['control'])) {
            $markup .= '<button type="button">'
                . htmlspecialchars((string) $slot['control']['text'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
                . '</button>';
        }

        return $markup;
    };

    $bodyMarkup = $shapeMarkup($case['content']['body'] ?? null);
    $skeletonMarkup = $shapeMarkup($case['content']['skeleton'] ?? null);
@endphp

@if (array_key_exists('skeleton', $case['content'] ?? []))
    <vf-skeleton-gate
        :ready="($case['props']['ready'] ?? false) ? true : null"
        :min-height="$case['props']['minHeight'] ?? null"
        :reserve-height="array_key_exists('reserveHeight', $case['props'] ?? []) ? $case['props']['reserveHeight'] : null"
        :preserve-last-height="($case['props']['preserveLastHeight'] ?? false) ? true : null"
        :normalize-content-spacing="($case['props']['normalizeContentSpacing'] ?? false) ? true : null"
        :radius="array_key_exists('radius', $case['props'] ?? []) ? $case['props']['radius'] : null"
        :fade-duration="array_key_exists('fadeDuration', $case['props'] ?? []) ? $case['props']['fadeDuration'] : null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :aria-busy="$case['attrs']['aria-busy'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
    ><razor-slot name="skeleton">{!! $skeletonMarkup !!}</razor-slot>{!! $bodyMarkup !!}</vf-skeleton-gate>
@else
    <vf-skeleton-gate
        :ready="($case['props']['ready'] ?? false) ? true : null"
        :min-height="$case['props']['minHeight'] ?? null"
        :reserve-height="array_key_exists('reserveHeight', $case['props'] ?? []) ? $case['props']['reserveHeight'] : null"
        :preserve-last-height="($case['props']['preserveLastHeight'] ?? false) ? true : null"
        :normalize-content-spacing="($case['props']['normalizeContentSpacing'] ?? false) ? true : null"
        :radius="array_key_exists('radius', $case['props'] ?? []) ? $case['props']['radius'] : null"
        :fade-duration="array_key_exists('fadeDuration', $case['props'] ?? []) ? $case['props']['fadeDuration'] : null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :aria-busy="$case['attrs']['aria-busy'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
    >{!! $bodyMarkup !!}</vf-skeleton-gate>
@endif
