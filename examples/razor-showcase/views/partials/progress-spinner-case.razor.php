{{-- One shared case for VfProgressSpinner.

     One tag and no branching: the spinner has no slot, so a case is its props
     and its attrs and nothing else. Every attribute the catalog can carry is
     bound, and a null binding is the component's "the consumer said nothing".

     Showcase fixture only. Nothing here is product implementation: the class
     merging, the size rule, the role precedence and the artwork all live in
     the component - the same component the button's loading state renders on
     the button's route. --}}
<vf-progress-spinner
    :label="$case['props']['label'] ?? null"
    :size="$case['props']['size'] ?? null"
    :stroke-width="$case['props']['strokeWidth'] ?? null"
    :tone="$case['props']['tone'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :aria-hidden="$case['attrs']['aria-hidden'] ?? null"
    :aria-valuenow="$case['attrs']['aria-valuenow'] ?? null"
    :aria-valuemin="$case['attrs']['aria-valuemin'] ?? null"
    :aria-valuemax="$case['attrs']['aria-valuemax'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
></vf-progress-spinner>
