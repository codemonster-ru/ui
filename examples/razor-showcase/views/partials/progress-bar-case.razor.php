{{-- One shared case for VfProgressBar.

     One tag and no branching: the bar has no slot, so a case is its props and
     its attrs and nothing else. Every attribute the catalog can carry is
     bound, and a null binding is the component's "the consumer said nothing".
     The labelledby case needs the heading it points at, rendered after the
     bar exactly as the parity fixture renders it.

     Showcase fixture only. Nothing here is product implementation: the
     value/max arithmetic, the serialisation, the class merging, the height
     rule and the role precedence all live in the component. --}}
<vf-progress-bar
    :value="$case['props']['value'] ?? null"
    :max="$case['props']['max'] ?? null"
    :indeterminate="$case['props']['indeterminate'] ?? null"
    :label="$case['props']['label'] ?? null"
    :height="$case['props']['height'] ?? null"
    :show-value="$case['props']['showValue'] ?? null"
    :tone="$case['props']['tone'] ?? null"
    :striped="$case['props']['striped'] ?? null"
    :animated="$case['props']['animated'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :aria-labelledby="$case['attrs']['aria-labelledby'] ?? null"
    :aria-hidden="$case['attrs']['aria-hidden'] ?? null"
    :aria-valuenow="$case['attrs']['aria-valuenow'] ?? null"
    :aria-valuemin="$case['attrs']['aria-valuemin'] ?? null"
    :aria-valuemax="$case['attrs']['aria-valuemax'] ?? null"
    :aria-valuetext="$case['attrs']['aria-valuetext'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
></vf-progress-bar>
@if (($case['attrs']['aria-labelledby'] ?? null) === 'progress-bar-heading')
    <p id="progress-bar-heading" class="razor-showcase__hint">Upload progress</p>
@endif
