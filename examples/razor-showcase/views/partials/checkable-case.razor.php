{{-- One shared case for VfCheckbox, VfRadio or VfSwitch.

     A group case renders several members sharing one name, because mutual
     exclusion belongs to the group rather than to any one control. The tag is
     repeated per component because the engine resolves component tags when it
     compiles, so which component renders has to be a branch rather than a
     variable. --}}
@if ($component === 'checkbox')
    @foreach (($case['group'] ?? [$case['props'] ?? []]) as $member)
        <vf-checkbox
            :checked="$member['modelValue'] ?? $case['props']['modelValue'] ?? false"
            :size="$member['size'] ?? $case['props']['size'] ?? null"
            :indeterminate="$member['indeterminate'] ?? $case['props']['indeterminate'] ?? false"
            :invalid="$member['invalid'] ?? $case['props']['invalid'] ?? false"
            :disabled="$member['disabled'] ?? $case['props']['disabled'] ?? false"
            :label="$case['content']['label'] ?? $member['label'] ?? $case['props']['label'] ?? null"
            :name="$case['attrs']['name'] ?? null"
            :value="$case['attrs']['value'] ?? null"
            :required="$case['attrs']['required'] ?? false"
            :aria-label="$case['attrs']['aria-label'] ?? null"
            :data-testid="$case['attrs']['data-testid'] ?? null"
            :class="$case['attrs']['class'] ?? null"
            :style="$case['attrs']['style'] ?? null"
        />
    @endforeach
@elseif ($component === 'radio')
    @foreach (($case['group'] ?? [$case['props'] ?? []]) as $member)
        <vf-radio
            :value="$member['value'] ?? $case['props']['value'] ?? null"
            :model-value="$member['modelValue'] ?? $case['props']['modelValue'] ?? null"
            :size="$member['size'] ?? $case['props']['size'] ?? null"
            :invalid="$member['invalid'] ?? $case['props']['invalid'] ?? false"
            :disabled="$member['disabled'] ?? $case['props']['disabled'] ?? false"
            :label="$case['content']['label'] ?? $member['label'] ?? $case['props']['label'] ?? null"
            :name="$case['props']['name'] ?? $case['attrs']['name'] ?? null"
            :required="$case['attrs']['required'] ?? false"
            :aria-label="$case['attrs']['aria-label'] ?? null"
            :data-testid="$case['attrs']['data-testid'] ?? null"
            :class="$case['attrs']['class'] ?? null"
            :style="$case['attrs']['style'] ?? null"
        />
    @endforeach
@else
    @foreach (($case['group'] ?? [$case['props'] ?? []]) as $member)
        <vf-switch
            :checked="$member['modelValue'] ?? $case['props']['modelValue'] ?? false"
            :size="$member['size'] ?? $case['props']['size'] ?? null"
            :static="$member['static'] ?? $case['props']['static'] ?? false"
            :thumb-contrast="$member['thumbContrast'] ?? $case['props']['thumbContrast'] ?? null"
            :invalid="$member['invalid'] ?? $case['props']['invalid'] ?? false"
            :disabled="$member['disabled'] ?? $case['props']['disabled'] ?? false"
            :label="$case['content']['label'] ?? $member['label'] ?? $case['props']['label'] ?? null"
            :name="$case['attrs']['name'] ?? null"
            :required="$case['attrs']['required'] ?? false"
            :aria-label="$case['attrs']['aria-label'] ?? null"
            :data-testid="$case['attrs']['data-testid'] ?? null"
            :class="$case['attrs']['class'] ?? null"
            :style="$case['attrs']['style'] ?? null"
        />
    @endforeach
@endif
