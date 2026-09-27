{{-- The default slot of one VfGroupBox case: text, the paragraphs markup, a
     real consumer button, and a real nested vf-group-box with its own title,
     collapsible, seed and text. Rendered inside the content when open and into
     the deferred template when closed; the component decides which. --}}
@if ($body !== null){{ $body['text'] ?? '' }}@if (($body['markup'] ?? null) === 'paragraphs')<p>Invoice #1024 · Design service.</p><p>Due on receipt.</p>@endif @if (isset($body['control']))<button type="button">{{ $body['control']['text'] }}</button>@endif @if (isset($body['groupBox']))<vf-group-box :title="$body['groupBox']['title'] ?? null" :collapsible="$body['groupBox']['collapsible'] ?? null" :default-collapsed="$body['groupBox']['defaultCollapsed'] ?? null">{{ $body['groupBox']['text'] ?? '' }}</vf-group-box>@endif @endif
