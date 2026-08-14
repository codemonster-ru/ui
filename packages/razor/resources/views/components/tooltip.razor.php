<!-- prettier-ignore -->
<span class="{{ $classes }}" data-cm-controller="tooltip"{!! $attributes !!}><button class="cm-tooltip__trigger" type="button" aria-label="{{ $label }}" aria-describedby="{{ $id }}-tooltip">{{ $trigger }}</button><span class="cm-tooltip__content" id="{{ $id }}-tooltip" role="tooltip"@if (!$visible) hidden@endif>{{ $contentBody }}</span></span>
