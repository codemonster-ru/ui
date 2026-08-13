<!-- prettier-ignore -->
<span class="{{ $classes }}" data-cm-controller="tooltip"{!! $attributes !!}><button class="cm-tooltip__trigger" type="button" aria-describedby="{{ $id }}-tooltip">{{ $label }}</button><span class="cm-tooltip__content" id="{{ $id }}-tooltip" role="tooltip"@if (!$visible) hidden@endif>{{ $content }}</span></span>
