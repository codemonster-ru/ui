{{-- One shared case for VfSelect.

     The tag is repeated per slot and wrapper shape - adornment slots, inside a
     field, beside and inside a popover, or plain - because the engine collects
     named slots when it compiles, so a slot wrapped in @if would still be
     declared.

     A group renders each member as its own real vf-select. There is no
     showcase script: every select on the page is live through the packaged
     controller alone, which creates, teleports and positions each listbox
     with the floater.js bundled in the same file.

     Showcase fixture only. Nothing here is product implementation: the ids,
     the ARIA, the hidden input, the listbox, the field report and the whole
     keyboard and pointer contract live in the component and its controller.
     `case` and `members` are handed in by the view. --}}
@if (isset($case['content']['popover']))
    <vf-select
    :options="$case['props']['options'] ?? []"
    :model-value="$case['props']['modelValue'] ?? null"
    :placeholder="$case['props']['placeholder'] ?? null"
    ></vf-select>
    <vf-popover :disable-teleport="true" aria-label="Filters"><razor-slot name="trigger"><span>{{ $case['content']['popover']['trigger'] }}</span></razor-slot><vf-select
    :options="$case['props']['options'] ?? []"
    :model-value="$case['props']['modelValue'] ?? null"
    :placeholder="$case['props']['placeholder'] ?? null"
    ></vf-select></vf-popover>
@elseif (isset($case['content']['field']))
    <vf-field
        :label="$case['content']['field']['label']"
        :label-placement="$case['content']['field']['placement'] ?? 'top'"
        :description="$case['content']['field']['description'] ?? null"
        :error="$case['content']['field']['error'] ?? null"
    ><vf-select
    :options="$case['props']['options'] ?? []"
    :model-value="$case['props']['modelValue'] ?? null"
    :placeholder="$case['props']['placeholder'] ?? null"
    :clearable="$case['props']['clearable'] ?? null"
    :invalid="$case['props']['invalid'] ?? null"
    ></vf-select></vf-field>
@elseif (isset($case['content']['leading']))
    <vf-select
    :options="$case['props']['options'] ?? []"
    :model-value="$case['props']['modelValue'] ?? null"
    :placeholder="$case['props']['placeholder'] ?? null"
    ><razor-slot name="leading"><span class="parity-content">{{ $case['content']['leading']['text'] }}</span></razor-slot><razor-slot name="trailing"><span class="parity-content">{{ $case['content']['trailing']['text'] ?? '' }}</span></razor-slot></vf-select>
@elseif (isset($case['attrs']['aria-haspopup']) || isset($case['attrs']['data-vf-filled']))
    {{-- The one case that overrides the trigger's own attributes. They are
         bound only here: a bound null would remove the component's own. --}}
    <vf-select
    :options="$case['props']['options'] ?? []"
    :model-value="$case['props']['modelValue'] ?? null"
    :aria-haspopup="$case['attrs']['aria-haspopup'] ?? null"
    :data-vf-filled="$case['attrs']['data-vf-filled'] ?? null"
    ></vf-select>
@else
    @foreach ($members as $member)
        <vf-select
        :options="$member['options'] ?? []"
        :model-value="$member['modelValue'] ?? null"
        :placeholder="$member['placeholder'] ?? null"
        :size="$member['size'] ?? null"
        :invalid="$member['invalid'] ?? null"
        :leading-icon="$member['leadingIcon'] ?? null"
        :trailing-icon="$member['trailingIcon'] ?? null"
        :clearable="$member['clearable'] ?? null"
        :disabled="$member['disabled'] ?? null"
        :placement="$member['placement'] ?? null"
        :disable-teleport="$member['disableTeleport'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :name="$case['attrs']['name'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        :title="$case['attrs']['title'] ?? null"
        :tabindex="$case['attrs']['tabindex'] ?? null"
        :required="$case['attrs']['required'] ?? null"
        :autofocus="$case['attrs']['autofocus'] ?? null"
        :role="$case['attrs']['role'] ?? null"
        ></vf-select>
    @endforeach
@endif
@if (isset($case['content']['after']['control']))
    <button type="button" class="parity-after-control">{{ $case['content']['after']['control']['text'] }}</button>
@endif
@if (isset($case['content']['form']['reset']))
    <button type="reset" class="parity-reset-control">Reset</button>
@endif
