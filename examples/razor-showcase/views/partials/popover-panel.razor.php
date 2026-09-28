{{-- The default slot of one shared VfPopover case: the consumer's own panel
     content, built from the same catalog words the Vue route reads - a
     paragraph, buttons (an unfocusable span where the case asks for one) with
     either autofocus form, and a real vf-dropdown. The controller clones this
     markup into every panel it renders.

     Showcase fixture only. --}}
@if (isset($panel['note']))<p class="parity-panel-note">{{ $panel['note'] }}</p>@endif
@foreach ($panel['controls'] ?? [] as $control)@if (($control['tag'] ?? 'button') === 'span')@if (($control['autofocus'] ?? null) === 'data')<span class="parity-panel-control" data-autofocus>{{ $control['text'] }}</span>@else<span class="parity-panel-control">{{ $control['text'] }}</span>@endif@elseif (($control['autofocus'] ?? null) === 'attribute')<button type="button" class="parity-panel-control" autofocus>{{ $control['text'] }}</button>@elseif (($control['autofocus'] ?? null) === 'data')<button type="button" class="parity-panel-control" data-autofocus>{{ $control['text'] }}</button>@else<button type="button" class="parity-panel-control">{{ $control['text'] }}</button>@endif@endforeach
@if (isset($panel['dropdown']))@include('partials.popover-dropdown', ['label' => 'Inner', 'inPlace' => $panel['dropdown']['inPlace'] ?? false])@endif
