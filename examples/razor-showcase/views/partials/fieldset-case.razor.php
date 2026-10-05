{{-- One shared case for VfFieldset.

     The tag is repeated once per slot combination the catalog uses, because
     the engine collects named slots when it compiles: a label slot wrapped in
     @if would still be declared, and a declared slot - empty or not - opens
     its part. A case with no slot at all is self-closing, which declares no
     default slot either. A group renders each member as its own real
     vf-fieldset from props.

     The inputs and the button are real consumer controls. They bind nothing
     the fieldset offers: the Vue scoped slot has no Razor counterpart.

     Showcase fixture only. The presence rules, the ids, aria-describedby and
     the invalid class live in the component.

     aria-describedby is bound only in the branch for the cases that forward
     one. Binding it as null everywhere would be a consumer explicitly passing
     nothing - which, in Vue as here, replaces the computed value and leaves
     the fieldset describing nothing (fieldset/consumer-describedby-null). --}}
@if ($combo === '' && array_key_exists('aria-describedby', $case['attrs'] ?? []))
<vf-fieldset
    :label="$member['label'] ?? null"
    :description="$member['description'] ?? null"
    :error="$member['error'] ?? null"
    :invalid="$member['invalid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :disabled="$case['attrs']['disabled'] ?? null"
    :form="$case['attrs']['form'] ?? null"
    :name="$case['attrs']['name'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-invalid="$case['attrs']['aria-invalid'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :aria-describedby="$case['attrs']['aria-describedby'] ?? null"
/>
@elseif ($combo === '')
<vf-fieldset
    :label="$member['label'] ?? null"
    :description="$member['description'] ?? null"
    :error="$member['error'] ?? null"
    :invalid="$member['invalid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :disabled="$case['attrs']['disabled'] ?? null"
    :form="$case['attrs']['form'] ?? null"
    :name="$case['attrs']['name'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-invalid="$case['attrs']['aria-invalid'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
/>
@elseif ($combo === 'body')
<vf-fieldset
    :label="$member['label'] ?? null"
    :description="$member['description'] ?? null"
    :error="$member['error'] ?? null"
    :invalid="$member['invalid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :disabled="$case['attrs']['disabled'] ?? null"
    :form="$case['attrs']['form'] ?? null"
    :name="$case['attrs']['name'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-invalid="$case['attrs']['aria-invalid'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
>{{ $content['body']['text'] ?? '' }}@if (($content['body']['controls'] ?? null) === 'input-and-button')<label for="{{ $key }}-email">Email</label><input id="{{ $key }}-email" type="email" name="email"><button type="button">Verify</button>@elseif (($content['body']['controls'] ?? null) === 'radios')<label><input type="radio" name="{{ $key }}-delivery" value="standard"> standard</label><label><input type="radio" name="{{ $key }}-delivery" value="express"> express</label>@endif</vf-fieldset>
@elseif ($combo === 'label+body')
<vf-fieldset
    :label="$member['label'] ?? null"
    :description="$member['description'] ?? null"
    :error="$member['error'] ?? null"
    :invalid="$member['invalid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :disabled="$case['attrs']['disabled'] ?? null"
    :form="$case['attrs']['form'] ?? null"
    :name="$case['attrs']['name'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-invalid="$case['attrs']['aria-invalid'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
><razor-slot name="label">{{ $content['label']['text'] ?? '' }}@if (($content['label']['markup'] ?? null) === 'rich')<strong>Rich</strong> <em>content</em>@endif</razor-slot>{{ $content['body']['text'] ?? '' }}@if (($content['body']['controls'] ?? null) === 'input-and-button')<label for="{{ $key }}-email">Email</label><input id="{{ $key }}-email" type="email" name="email"><button type="button">Verify</button>@elseif (($content['body']['controls'] ?? null) === 'radios')<label><input type="radio" name="{{ $key }}-delivery" value="standard"> standard</label><label><input type="radio" name="{{ $key }}-delivery" value="express"> express</label>@endif</vf-fieldset>
@elseif ($combo === 'label')
<vf-fieldset
    :label="$member['label'] ?? null"
    :description="$member['description'] ?? null"
    :error="$member['error'] ?? null"
    :invalid="$member['invalid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :disabled="$case['attrs']['disabled'] ?? null"
    :form="$case['attrs']['form'] ?? null"
    :name="$case['attrs']['name'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-invalid="$case['attrs']['aria-invalid'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
><razor-slot name="label">{{ $content['label']['text'] ?? '' }}@if (($content['label']['markup'] ?? null) === 'rich')<strong>Rich</strong> <em>content</em>@endif</razor-slot></vf-fieldset>
@elseif ($combo === 'description')
<vf-fieldset
    :label="$member['label'] ?? null"
    :description="$member['description'] ?? null"
    :error="$member['error'] ?? null"
    :invalid="$member['invalid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :disabled="$case['attrs']['disabled'] ?? null"
    :form="$case['attrs']['form'] ?? null"
    :name="$case['attrs']['name'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-invalid="$case['attrs']['aria-invalid'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
><razor-slot name="description">{{ $content['description']['text'] ?? '' }}@if (($content['description']['markup'] ?? null) === 'rich')<strong>Rich</strong> <em>content</em>@endif</razor-slot></vf-fieldset>
@elseif ($combo === 'error')
<vf-fieldset
    :label="$member['label'] ?? null"
    :description="$member['description'] ?? null"
    :error="$member['error'] ?? null"
    :invalid="$member['invalid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :disabled="$case['attrs']['disabled'] ?? null"
    :form="$case['attrs']['form'] ?? null"
    :name="$case['attrs']['name'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-invalid="$case['attrs']['aria-invalid'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
><razor-slot name="error">{{ $content['error']['text'] ?? '' }}@if (($content['error']['markup'] ?? null) === 'rich')<strong>Rich</strong> <em>content</em>@endif</razor-slot></vf-fieldset>
@elseif ($combo === 'label+description+error')
<vf-fieldset
    :label="$member['label'] ?? null"
    :description="$member['description'] ?? null"
    :error="$member['error'] ?? null"
    :invalid="$member['invalid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :disabled="$case['attrs']['disabled'] ?? null"
    :form="$case['attrs']['form'] ?? null"
    :name="$case['attrs']['name'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-invalid="$case['attrs']['aria-invalid'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
><razor-slot name="label">{{ $content['label']['text'] ?? '' }}@if (($content['label']['markup'] ?? null) === 'rich')<strong>Rich</strong> <em>content</em>@endif</razor-slot><razor-slot name="description">{{ $content['description']['text'] ?? '' }}@if (($content['description']['markup'] ?? null) === 'rich')<strong>Rich</strong> <em>content</em>@endif</razor-slot><razor-slot name="error">{{ $content['error']['text'] ?? '' }}@if (($content['error']['markup'] ?? null) === 'rich')<strong>Rich</strong> <em>content</em>@endif</razor-slot></vf-fieldset>
@else
    <p class="razor-showcase__unsupported">This partial has no branch for the slot combination [{{ $combo }}].</p>
@endif
