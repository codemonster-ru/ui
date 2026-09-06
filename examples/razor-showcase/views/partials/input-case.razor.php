{{-- One shared Input case, rendered by the real vf-input Razor component.

     Every prop is named explicitly: the engine has no prop spread, and the
     migration plan asks for an explicit map for the first component rather than
     a generic factory. A prop bound to null behaves exactly like an omitted
     one, so the same prop list covers the whole catalog without inventing a
     second list of cases.

     The tag is repeated per slot combination on purpose. The engine collects
     named slots from the template source when it compiles, so a named slot
     wrapped in @if is still declared and the component would report an
     adornment the case does not have. Selecting a whole tag is the only way to
     make slot presence follow the data.

     scripts/ci/check-showcase-routes.mjs requires all four prop lists below to
     stay character-identical, so the branches cannot drift apart. --}}
@if (isset($case['content']['leading']['text']) && isset($case['content']['trailing']['text']))
<vf-input
    :value="$case['props']['modelValue'] ?? null"
    :size="$case['props']['size'] ?? null"
    :invalid="$invalid"
    :leading-icon="$case['props']['leadingIcon'] ?? null"
    :trailing-icon="$case['props']['trailingIcon'] ?? null"
    :clearable="$case['props']['clearable'] ?? false"
    :password-reveal="$case['props']['passwordReveal'] ?? false"
    :id="$controlId"
    :name="$case['attrs']['name'] ?? null"
    :type="$case['attrs']['type'] ?? null"
    :placeholder="$case['attrs']['placeholder'] ?? null"
    :autocomplete="$case['attrs']['autocomplete'] ?? null"
    :inputmode="$case['attrs']['inputmode'] ?? null"
    :maxlength="$case['attrs']['maxlength'] ?? null"
    :min="$case['attrs']['min'] ?? null"
    :max="$case['attrs']['max'] ?? null"
    :step="$case['attrs']['step'] ?? null"
    :required="$case['attrs']['required'] ?? false"
    :disabled="$case['attrs']['disabled'] ?? false"
    :readonly="$case['attrs']['readonly'] ?? false"
    :aria-describedby="$describedBy"
    :aria-invalid="$case['attrs']['aria-invalid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
>
        <razor-slot name="leading"><span class="razor-showcase__content">{{ $case['content']['leading']['text'] }}</span></razor-slot>
        <razor-slot name="trailing"><span class="razor-showcase__content">{{ $case['content']['trailing']['text'] }}</span></razor-slot>
</vf-input>
@elseif (isset($case['content']['leading']['text']))
<vf-input
    :value="$case['props']['modelValue'] ?? null"
    :size="$case['props']['size'] ?? null"
    :invalid="$invalid"
    :leading-icon="$case['props']['leadingIcon'] ?? null"
    :trailing-icon="$case['props']['trailingIcon'] ?? null"
    :clearable="$case['props']['clearable'] ?? false"
    :password-reveal="$case['props']['passwordReveal'] ?? false"
    :id="$controlId"
    :name="$case['attrs']['name'] ?? null"
    :type="$case['attrs']['type'] ?? null"
    :placeholder="$case['attrs']['placeholder'] ?? null"
    :autocomplete="$case['attrs']['autocomplete'] ?? null"
    :inputmode="$case['attrs']['inputmode'] ?? null"
    :maxlength="$case['attrs']['maxlength'] ?? null"
    :min="$case['attrs']['min'] ?? null"
    :max="$case['attrs']['max'] ?? null"
    :step="$case['attrs']['step'] ?? null"
    :required="$case['attrs']['required'] ?? false"
    :disabled="$case['attrs']['disabled'] ?? false"
    :readonly="$case['attrs']['readonly'] ?? false"
    :aria-describedby="$describedBy"
    :aria-invalid="$case['attrs']['aria-invalid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
>
        <razor-slot name="leading"><span class="razor-showcase__content">{{ $case['content']['leading']['text'] }}</span></razor-slot>
</vf-input>
@elseif (isset($case['content']['trailing']['text']))
<vf-input
    :value="$case['props']['modelValue'] ?? null"
    :size="$case['props']['size'] ?? null"
    :invalid="$invalid"
    :leading-icon="$case['props']['leadingIcon'] ?? null"
    :trailing-icon="$case['props']['trailingIcon'] ?? null"
    :clearable="$case['props']['clearable'] ?? false"
    :password-reveal="$case['props']['passwordReveal'] ?? false"
    :id="$controlId"
    :name="$case['attrs']['name'] ?? null"
    :type="$case['attrs']['type'] ?? null"
    :placeholder="$case['attrs']['placeholder'] ?? null"
    :autocomplete="$case['attrs']['autocomplete'] ?? null"
    :inputmode="$case['attrs']['inputmode'] ?? null"
    :maxlength="$case['attrs']['maxlength'] ?? null"
    :min="$case['attrs']['min'] ?? null"
    :max="$case['attrs']['max'] ?? null"
    :step="$case['attrs']['step'] ?? null"
    :required="$case['attrs']['required'] ?? false"
    :disabled="$case['attrs']['disabled'] ?? false"
    :readonly="$case['attrs']['readonly'] ?? false"
    :aria-describedby="$describedBy"
    :aria-invalid="$case['attrs']['aria-invalid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
>
        <razor-slot name="trailing"><span class="razor-showcase__content">{{ $case['content']['trailing']['text'] }}</span></razor-slot>
</vf-input>
@else
<vf-input
    :value="$case['props']['modelValue'] ?? null"
    :size="$case['props']['size'] ?? null"
    :invalid="$invalid"
    :leading-icon="$case['props']['leadingIcon'] ?? null"
    :trailing-icon="$case['props']['trailingIcon'] ?? null"
    :clearable="$case['props']['clearable'] ?? false"
    :password-reveal="$case['props']['passwordReveal'] ?? false"
    :id="$controlId"
    :name="$case['attrs']['name'] ?? null"
    :type="$case['attrs']['type'] ?? null"
    :placeholder="$case['attrs']['placeholder'] ?? null"
    :autocomplete="$case['attrs']['autocomplete'] ?? null"
    :inputmode="$case['attrs']['inputmode'] ?? null"
    :maxlength="$case['attrs']['maxlength'] ?? null"
    :min="$case['attrs']['min'] ?? null"
    :max="$case['attrs']['max'] ?? null"
    :step="$case['attrs']['step'] ?? null"
    :required="$case['attrs']['required'] ?? false"
    :disabled="$case['attrs']['disabled'] ?? false"
    :readonly="$case['attrs']['readonly'] ?? false"
    :aria-describedby="$describedBy"
    :aria-invalid="$case['attrs']['aria-invalid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
/>
@endif
