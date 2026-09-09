{{-- One shared case for VfBadge, VfTag or VfDivider.

     The tag is repeated per component because the engine resolves component
     tags when it compiles, so which component renders has to be a branch
     rather than a variable. That constraint happens to be useful here: this
     is fixture markup for three near-identical components, and a branch is
     visibly three components rather than one parameterised renderer.

     Showcase fixture only. Nothing here is product implementation: the class
     merging, the tone modifier and the divider's conditional role all live in
     the components. --}}
@if ($component === 'badge')
    <vf-badge
        :tone="$case['props']['tone'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :role="$case['attrs']['role'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
    >{{ $case['content']['text'] ?? '' }}</vf-badge>
@elseif ($component === 'tag')
    <vf-tag
        :tone="$case['props']['tone'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :role="$case['attrs']['role'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
    >{{ $case['content']['text'] ?? '' }}</vf-tag>
@else
    {{-- VfDivider has no height of its own: a vertical one takes it from a flex
         parent. The frame is the consumer layout the component asks for, so
         that a vertical divider is visible at all in the showcase. --}}
    <div class="razor-showcase__divider-frame">
        <span class="razor-showcase__divider-side">before</span>
        <vf-divider
            :orientation="$case['props']['orientation'] ?? null"
            :class="$case['attrs']['class'] ?? null"
            :style="$case['attrs']['style'] ?? null"
            :role="$case['attrs']['role'] ?? null"
            :aria-orientation="$case['attrs']['aria-orientation'] ?? null"
            :data-testid="$case['attrs']['data-testid'] ?? null"
        />
        <span class="razor-showcase__divider-side">after</span>
    </div>
@endif
